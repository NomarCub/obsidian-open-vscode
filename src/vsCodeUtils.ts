import { exec } from "child_process";
import {
    type App,
    ConfirmationModal,
    FileSystemAdapter,
    MarkdownView,
    Notice,
    type PluginManifest,
    type TAbstractFile,
    TFolder,
} from "obsidian";
import type {} from "obsidian-typings";
import { DEFAULT_SETTINGS, type OpenTarget, type OpenVSCodeSettings } from "./settings.ts";

interface VSCodeContext {
    app: App;
    settings: OpenVSCodeSettings;
    manifest: Pick<PluginManifest, "id" | "name">;
}

export function openVSCode(
    { app, settings, manifest }: VSCodeContext,
    file: TAbstractFile | null = app.workspace.getActiveFile(),
): void {
    if (!(app.vault.adapter instanceof FileSystemAdapter)) {
        return;
    }

    const vaultPath = app.vault.adapter.getBasePath();
    const filePath = file?.path ?? "";
    const folderPath = file instanceof TFolder ? file.path : (file?.parent?.path ?? "");
    const target: OpenTarget =
        !file || (file instanceof TFolder && file.isRoot())
            ? "Vault"
            : file instanceof TFolder
              ? "Folder"
              : "File";

    // only reuse the active note's cursor when opening that same note
    const cursor =
        file && file === app.workspace.getActiveFile()
            ? app.workspace.getActiveViewOfType(MarkdownView)?.editor.getCursor()
            : undefined;
    // VS Code line and column are 1-based
    const line = (cursor?.line ?? 0) + 1;
    const ch = (cursor?.ch ?? 0) + 1;

    // formatting for the URL method
    const formatPath = (path: string): string =>
        settings.openMethod === "url"
            ? // encodeURI preserves / and :, but also # and ?, so escape those separately.
              encodeURI(path.replaceAll("\\", "/")).replaceAll("#", "%23").replaceAll("?", "%3F")
            : path;

    const renderTemplate = (template: string): string =>
        template
            .replaceAll("{{vaultpath}}", formatPath(vaultPath))
            .replaceAll("{{filepath}}", formatPath(filePath))
            .replaceAll("{{folderpath}}", formatPath(folderPath))
            .replaceAll("{{line}}", line.toString())
            .replaceAll("{{ch}}", ch.toString());
    // combine method and target to address the flat settings, `as const` preserves valid key types
    const templateKey = `${settings.openMethod}${target}Template` as const;
    const template = settings[templateKey].trim() || DEFAULT_SETTINGS[templateKey];

    if (settings.openMethod === "exec") {
        openVSCodeExec({ app, settings, manifest }, template, renderTemplate(template));
    } else {
        const vaultTemplate = settings.urlVaultTemplate.trim() || DEFAULT_SETTINGS.urlVaultTemplate;
        openVSCodeUrl(
            renderTemplate(template),
            settings.openFile && target !== "Vault" ? renderTemplate(vaultTemplate) : undefined,
        );
    }
}

function openVSCodeExec({ app, manifest }: VSCodeContext, executeTemplate: string, command: string): void {
    const runCommand = (): void => {
        exec(command, (error) => {
            if (error) {
                console.error(
                    `[${manifest.id}] exec error.\n\ttemplate: ${executeTemplate}\n\tcommand: ${command}\n`,
                    error,
                );
                new Notice(
                    "Failed to launch VS Code. Check the plugin's settings and your logs for more details.",
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
function openVSCodeUrl(url: string, workspaceUrl?: string): void {
    if (workspaceUrl) {
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
        window.open(workspaceUrl);

        // ...then open the _file_ in a setTimeout callback to allow time for the workspace to be activated
        setTimeout(() => {
            window.open(url);
        }, 200); // anecdotally, this seems to be the min required for the workspace to activate
    } else {
        window.open(url);
    }
}
