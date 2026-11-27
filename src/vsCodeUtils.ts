import { exec } from "child_process";
import {
    type App,
    ConfirmationModal,
    FileSystemAdapter,
    MarkdownView,
    Notice,
    type PluginManifest,
    type TAbstractFile,
} from "obsidian";
import type {} from "obsidian-typings";
import { DEFAULT_SETTINGS, type OpenVSCodeSettings } from "./settings.ts";

export function openVSCode(
    app: App,
    settings: OpenVSCodeSettings,
    manifest: PluginManifest,
    file: TAbstractFile | null = app.workspace.getActiveFile(),
): void {
    if (!(app.vault.adapter instanceof FileSystemAdapter)) {
        return;
    }

    const vaultPath = app.vault.adapter.getBasePath();
    const filePath = file?.path ?? "";
    const folderPath = file?.parent?.path ?? "";

    const cursor = app.workspace.getActiveViewOfType(MarkdownView)?.editor.getCursor();
    // VS Code line and column are 1-based
    const line = (cursor?.line ?? 0) + 1;
    const ch = (cursor?.ch ?? 0) + 1;

    const executeTemplate = settings.executeTemplate.trim() || DEFAULT_SETTINGS.executeTemplate;
    const command = executeTemplate
        .replaceAll("{{vaultpath}}", vaultPath)
        .replaceAll("{{filepath}}", filePath)
        .replaceAll("{{folderpath}}", folderPath)
        .replaceAll("{{line}}", line.toString())
        .replaceAll("{{ch}}", ch.toString());

    const runCommand = (): void => {
        exec(command, (error) => {
            if (error) {
                new Notice(
                    "Failed to launch VS Code. Check the plugin's settings and your logs for more details.",
                );
                console.error(
                    `[${manifest.id}] exec error.\n\ttemplate: ${executeTemplate}\n\tcommand: ${command}\n`,
                    error,
                );
            }
        });
    };

    const approvalKey = `${manifest.id}:approved-execute-template`;
    const loadApprovedTemplates = (): string[] => {
        const stored: unknown = app.loadLocalStorage(approvalKey);
        return Array.isArray(stored) ? stored.filter((value) => typeof value === "string") : [];
    };
    if (loadApprovedTemplates().includes(executeTemplate)) {
        runCommand();
        return;
    }

    {
        const modal = new ConfirmationModal(app);

        modal.contentEl.createEl("p", {
            text: `The ${manifest.name} plugin will run the following command. Allow this command template for this vault on this computer.`,
        });
        const commandEl = modal.contentEl.createEl("pre");
        /* eslint-disable obsidianmd/no-static-styles-assignment  --
                TODO: Avoid setting styles directly via `element.style.*`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties*/
        commandEl.style.whiteSpace = "pre-wrap";
        commandEl.style.overflowWrap = "anywhere";
        commandEl.createEl("code", { text: command });
        modal.contentEl.createEl("p", { text: "Command template:" });
        const templateEl = modal.contentEl.createEl("pre");
        templateEl.style.whiteSpace = "pre-wrap";
        templateEl.style.overflowWrap = "anywhere";
        /* eslint-enable obsidianmd/no-static-styles-assignment */
        templateEl.createEl("code", { text: executeTemplate });

        modal
            .setTitle("Allow shell command?")
            .addCancelButton()
            .addButton((button) =>
                button
                    .setButtonText("Allow and run")
                    .setDestructive()
                    .setCta()
                    .onClick(() => {
                        const approved = loadApprovedTemplates();
                        if (!approved.includes(executeTemplate)) {
                            approved.push(executeTemplate);
                        }
                        app.saveLocalStorage(approvalKey, approved);
                        runCommand();
                    }),
            )
            .open();
    }
}

// https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls
export function openVSCodeUrl(app: App, settings: OpenVSCodeSettings): void {
    if (!(app.vault.adapter instanceof FileSystemAdapter)) {
        return;
    }

    const path = app.vault.adapter.getBasePath();
    const file = app.workspace.getActiveFile();
    const filePath = file?.path ?? "";

    let url = `${settings.urlProtocol}://file/${path}`;

    if (settings.openFile) {
        url += `/${filePath}`;
        /*
            By default, opening a file via the vscode:// URL will cause that file to open
            in the front-most window in VS Code. We assume that it is preferred that files from
            Obsidian should all open in the same workspace.

            As a workaround, we issue two open requests to VS Code in quick succession: the first to
            bring the workspace to front, the second to open the file.

            There is a ticket requesting this feature for VS Code:
            https://github.com/microsoft/vscode/issues/150078
            */

        // HACK: first open the _workspace_ to bring the correct window to the front....
        const workspacePath = settings.workspacePath.replaceAll("{{vaultpath}}", path);
        window.open(`${settings.urlProtocol}://file/${workspacePath}`);

        // ...then open the _file_ in a setTimeout callback to allow time for the workspace to be activated
        setTimeout(() => {
            window.open(url);
        }, 200); // anecdotally, this seems to be the min required for the workspace to activate
    } else {
        window.open(url);
    }
}
