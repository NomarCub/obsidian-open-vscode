import { exec } from "child_process";
import {
    addIcon,
    FileSystemAdapter,
    MarkdownView,
    type Menu,
    Notice,
    Plugin,
    type TAbstractFile,
} from "obsidian";
import type {} from "obsidian-typings";
import { registerNotebookNavigatorMenus } from "./notebook-navigator.ts";
import { DEFAULT_SETTINGS, type OpenVSCodeSettings, OpenVSCodeSettingsTab } from "./settings.ts";

export default class OpenVSCode extends Plugin {
    static iconId = "vscode-logo";
    // source: https://github.com/simple-icons/simple-icons/blob/12.4.0/icons/visualstudiocode.svg
    // removed from Simple Icons in v13:
    //   https://github.com/simple-icons/simple-icons/releases/tag/13.0.0
    //   https://github.com/simple-icons/simple-icons/issues/11236
    static iconSvgContent = `
<svg role="img" viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg">
    <title>Visual Studio Code</title>
    <path
        fill="currentColor"
        d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
    />
</svg>
`;

    ribbonIcon?: HTMLElement;
    settings!: OpenVSCodeSettings;

    readonly logTag = `[${this.manifest.id}]`;

    override async onload(): Promise<void> {
        addIcon(OpenVSCode.iconId, OpenVSCode.iconSvgContent);
        await this.loadSettings();
        this.refreshIconRibbon();

        this.addSettingTab(new OpenVSCodeSettingsTab(this.app, this));

        this.addCommand({
            // eslint-disable-next-line obsidianmd/commands/no-plugin-id-in-command-id
            id: "open-vscode",
            name: "Open as Visual Studio Code workspace",
            callback: this.openVSCode.bind(this),
        });

        this.addCommand({
            // eslint-disable-next-line obsidianmd/commands/no-plugin-id-in-command-id
            id: "open-vscode-via-url",
            name: "Open as Visual Studio Code workspace using a vscode:// URL",
            callback: this.openVSCodeUrl.bind(this),
        });

        this.registerEvent(this.app.workspace.on("file-menu", this.fileMenuHandler.bind(this)));

        // Notebook Navigator community plugin integration
        registerNotebookNavigatorMenus(this, OpenVSCode.iconId);
    }

    openVSCode(file: TAbstractFile | null = this.app.workspace.getActiveFile()): void {
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
            return;
        }

        const vaultPath = this.app.vault.adapter.getBasePath();
        const filePath = file?.path ?? "";
        const folderPath = file?.parent?.path ?? "";

        const cursor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor.getCursor();
        // VS Code line and column are 1-based
        const line = (cursor?.line ?? 0) + 1;
        const ch = (cursor?.ch ?? 0) + 1;

        const executeTemplate = this.settings.executeTemplate.trim() || DEFAULT_SETTINGS.executeTemplate;
        const command = executeTemplate
            .replaceAll("{{vaultpath}}", vaultPath)
            .replaceAll("{{filepath}}", filePath)
            .replaceAll("{{folderpath}}", folderPath)
            .replaceAll("{{line}}", line.toString())
            .replaceAll("{{ch}}", ch.toString());

        exec(command, (error) => {
            if (error) {
                new Notice(
                    "Failed to launch VS Code. Check the plugin's settings and your logs for more details.",
                );
                console.error(
                    `${this.logTag} exec error.\n\ttemplate: ${executeTemplate}\n\tcommand: ${command}\n`,
                    error,
                );
            }
        });
    }

    // https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls
    openVSCodeUrl(): void {
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
            return;
        }

        const path = this.app.vault.adapter.getBasePath();
        const file = this.app.workspace.getActiveFile();
        const filePath = file?.path ?? "";

        let url = `${this.settings.urlProtocol}://file/${path}`;

        if (this.settings.openFile) {
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
            const workspacePath = this.settings.workspacePath.replaceAll("{{vaultpath}}", path);
            window.open(`${this.settings.urlProtocol}://file/${workspacePath}`);

            // ...then open the _file_ in a setTimeout callback to allow time for the workspace to be activated
            setTimeout(() => {
                window.open(url);
            }, 200); // anecdotally, this seems to be the min required for the workspace to activate
        } else {
            window.open(url);
        }
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            (await this.loadData()) as OpenVSCodeSettings | null,
        );
    }

    async saveSettings(settings: OpenVSCodeSettings = this.settings): Promise<void> {
        await this.saveData(settings);
    }

    refreshIconRibbon(): void {
        this.ribbonIcon?.remove();
        if (this.settings.ribbonIcon) {
            this.ribbonIcon = this.addRibbonIcon(OpenVSCode.iconId, "VS Code", () => {
                if (this.settings.ribbonCommandUsesCode) this.openVSCode();
                else this.openVSCodeUrl();
            });
        }
    }

    fileMenuHandler(menu: Menu, file: TAbstractFile): void {
        if (!this.settings.showFileContextMenuItem) {
            return;
        }

        menu.addItem((item) => {
            item.setTitle("Open in VS Code")
                .setIcon(OpenVSCode.iconId)
                .onClick(() => {
                    this.openVSCode(file);
                });
        });
    }
}
