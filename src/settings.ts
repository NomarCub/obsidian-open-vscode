import { App, PluginSettingTab, Setting } from "obsidian";
import OpenVSCode from "./main";

export interface OpenVSCodeSettings {
    ribbonIcon: boolean;
    // use code command if true, otherwise open URL
    ribbonCommandUsesCode: boolean;
    showFileContextMenuItem: boolean;
    executeTemplate: string;
    openFile: boolean;
    urlProtocol: string;
    workspacePath: string;
}

export const DEFAULT_SETTINGS: OpenVSCodeSettings = {
    ribbonIcon: true,
    ribbonCommandUsesCode: true,
    showFileContextMenuItem: true,
    executeTemplate: 'code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"',
    urlProtocol: "vscode",
    openFile: true,
    workspacePath: "{{vaultpath}}",
};

export class OpenVSCodeSettingsTab extends PluginSettingTab {
    override plugin: OpenVSCode;

    constructor(app: App, plugin: OpenVSCode) {
        super(app, plugin);
        this.plugin = plugin;
    }

    override display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h3", { text: "General settings" });

        new Setting(containerEl)
            .setName("Display Ribbon Icon")
            .setDesc("Toggle this OFF if you want to hide the Ribbon Icon.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ribbonIcon)
                .onChange(value => {
                    this.plugin.settings.ribbonIcon = value;
                    void this.plugin.saveSettings();
                    this.plugin.refreshIconRibbon();
                }),
            );

        new Setting(containerEl)
            .setName("Ribbon opens via 'code' command")
            .setDesc("Toggle this OFF if you'd prefer that the Ribbon Icon opens VSCode via URL.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ribbonCommandUsesCode)
                .onChange(value => {
                    this.plugin.settings.ribbonCommandUsesCode = value;
                    void this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName('Display "Open in VS Code" option for files/folders')
            .setDesc('Toggle this OFF to hide the "Open in VS Code" option when right-clicking a file/folder.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showFileContextMenuItem)
                .onChange(value => {
                    this.plugin.settings.showFileContextMenuItem = value;
                    void this.plugin.saveSettings();
                }),
            );

        containerEl.createEl("h3", { text: "Open via 'code' CLI settings" });

        new Setting(containerEl)
            .setName("Template for executing the 'code' command")
            .setDesc("You can use the following variables: '{{vaultpath}}' (absolute), '{{filepath}}' (relative), '{{folderpath}}' (relative), '{{line}}' and '{{ch}}'. Note that on MacOS, a full path to the VSCode executable is required (generally '/usr/local/bin/code'). Example template: \"'/usr/local/bin/code' '{{vaultpath}}' '{{vaultpath}}/{{filepath}}'\"")
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.executeTemplate)
                .setValue(this.plugin.settings.executeTemplate || DEFAULT_SETTINGS.executeTemplate)
                .onChange(value => {
                    value = value.trim();
                    if (value === "") value = DEFAULT_SETTINGS.executeTemplate;
                    this.plugin.settings.executeTemplate = value;
                    void this.plugin.saveData(this.plugin.settings);
                }),
            );

        containerEl.createEl("h3", { text: "Open via 'vscode://' URL settings" });
        containerEl.createEl("p", { text: "See: " }).appendChild(createEl("a", {
            text: "Opening VS Code with URLs",
            href: "https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls",
        }));

        new Setting(containerEl)
            .setName("Open current file")
            .setDesc("Open the current file rather than the root of the vault.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.openFile || DEFAULT_SETTINGS.openFile)
                .onChange(value => {
                    this.plugin.settings.openFile = value;
                    void this.plugin.saveData(this.plugin.settings);
                }),
            );

        const workspacePathSetting = new Setting(containerEl)
            .setName("Path to VSCode Workspace")
            .setDesc('Defaults to the {{vaultpath}} template variable. You can set this to an absolute path to a ".code-workspace" file if you prefer to use a ')
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.workspacePath)
                .setValue(this.plugin.settings.workspacePath || DEFAULT_SETTINGS.workspacePath)
                .onChange(value => {
                    value = value.trim();
                    if (value === "") value = DEFAULT_SETTINGS.workspacePath;
                    this.plugin.settings.workspacePath = value;
                    void this.plugin.saveData(this.plugin.settings);
                }),
            );

        workspacePathSetting.descEl.appendChild(createEl("a", {
            text: "multi-root workspace",
            href: "https://code.visualstudio.com/docs/editor/workspaces#_multiroot-workspaces",
        })).appendText(".");

        new Setting(containerEl)
            .setName("URL protocol")
            .setDesc("You can override the default vscode:// to VSCode Insiders, VSCodium or other VSCode variants' protocol string")
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.urlProtocol)
                .setValue(this.plugin.settings.urlProtocol || DEFAULT_SETTINGS.urlProtocol)
                .onChange(value => {
                    value = value.trim();
                    if (value === "") value = DEFAULT_SETTINGS.urlProtocol;
                    this.plugin.settings.urlProtocol = value;
                    void this.plugin.saveData(this.plugin.settings);
                }),
            );
    }
}
