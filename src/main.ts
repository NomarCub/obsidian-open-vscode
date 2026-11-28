import { addIcon, type Menu, Plugin, type TAbstractFile } from "obsidian";
import type {} from "obsidian-typings";
import { registerNotebookNavigatorMenus } from "./notebook-navigator.ts";
import { DEFAULT_SETTINGS, type OpenVSCodeSettings, OpenVSCodeSettingsTab } from "./settings.ts";
import { openVSCode } from "./vsCodeUtils.ts";

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
    override settings!: OpenVSCodeSettings;

    override async onload(): Promise<void> {
        addIcon(OpenVSCode.iconId, OpenVSCode.iconSvgContent);
        await this.loadSettings();
        this.refreshIconRibbon();

        this.addSettingTab(new OpenVSCodeSettingsTab(this.app, this));

        this.addCommand({
            // eslint-disable-next-line obsidianmd/commands/no-plugin-id-in-command-id
            id: "open-vscode",
            name: "Open vault with Visual Studio Code",
            callback: () => {
                openVSCode(this);
            },
        });

        this.registerEvent(this.app.workspace.on("file-menu", this.fileMenuHandler.bind(this)));

        // Notebook Navigator community plugin integration
        registerNotebookNavigatorMenus(this, OpenVSCode.iconId);
    }

    async loadSettings(): Promise<void> {
        // migrate from before 2.0.0, see: https://github.com/NomarCub/obsidian-open-vscode/pull/TODO
        const savedSettings = (await this.loadData()) as
            | (Partial<OpenVSCodeSettings> & {
                  ribbonCommandUsesCode?: boolean;
                  executeTemplate?: string;
                  urlProtocol?: string;
                  workspacePath?: string;
              })
            | null;
        const { ribbonCommandUsesCode, executeTemplate, urlProtocol, workspacePath, ...settings } =
            savedSettings ?? {};
        const legacyExec = executeTemplate?.trim()
            ? {
                  execVaultTemplate: executeTemplate,
                  execFolderTemplate: executeTemplate,
                  execFileTemplate: executeTemplate,
              }
            : {};
        const urlPrefix = `${(urlProtocol ?? "").trim() || "vscode"}://file/`;
        const legacyUrl =
            urlProtocol?.trim() || workspacePath?.trim()
                ? {
                      urlVaultTemplate: `${urlPrefix}${(workspacePath ?? "").trim() || "{{vaultpath}}"}`,
                      urlFolderTemplate: `${urlPrefix}{{vaultpath}}/{{folderpath}}`,
                      urlFileTemplate: `${urlPrefix}{{vaultpath}}/{{filepath}}:{{line}}:{{ch}}`,
                  }
                : {};
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...legacyExec,
            ...legacyUrl,
            ...settings,
            openMethod: settings.openMethod ?? (ribbonCommandUsesCode === false ? "url" : "exec"),
        };
    }

    async saveSettings(settings: OpenVSCodeSettings = this.settings): Promise<void> {
        await this.saveData(settings);
    }

    refreshIconRibbon(): void {
        this.ribbonIcon?.remove();
        if (this.settings.ribbonIcon) {
            this.ribbonIcon = this.addRibbonIcon(OpenVSCode.iconId, "VS Code", () => {
                openVSCode(this);
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
                    openVSCode(this, file);
                });
        });
    }
}
