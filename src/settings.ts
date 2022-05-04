import { App, PluginSettingTab, Setting } from "obsidian";
import OpenVSCode from "./main";

export interface OpenVSCodeSettings {
    ribbonIcon: boolean;
    useURL: boolean;
    executeTemplate: string;
    workspacePath: string;
    openFile: boolean;
}

export const DEFAULT_SETTINGS: OpenVSCodeSettings = {
    ribbonIcon: true,
    useURL: false,
    executeTemplate: 'code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"',
    workspacePath: '',
    openFile: true,
};

export class OpenVSCodeSettingsTab extends PluginSettingTab {
    plugin: OpenVSCode;

    constructor(app: App, plugin: OpenVSCode) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings' });

        new Setting(containerEl)
            .setName('Ribbon Icon')
            .setDesc('Turn on if you want to have a Ribbon Icon.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ribbonIcon).onChange((value) => {
                    this.plugin.settings.ribbonIcon = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshIconRibbon();
                }),
            );
        new Setting(containerEl)
            .setName('Use URL')
            .setDesc(
                'Open VSCode using a `vscode://` URL instead of executing the `code` command. Opening via URL may be faster than the alternative on some systems.',
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useURL).onChange((value) => {
                    this.plugin.settings.useURL = value;
                    this.plugin.saveSettings();
                }),
            );
        new Setting(containerEl)
            .setName('Template for executing the `code` command')
            .setDesc(
                'You can use the following variables: `{{vaultpath}} (absolute)`, `{{filepath}}` (relative). Note that on MacOS, a full path to the VSCode executable is required (generally "/usr/local/bin/code"). Example: `/usr/local/bin/code {{vaultpath}}/{{filepath}}`',
            )
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.executeTemplate)
                    .setValue(this.plugin.settings.executeTemplate || DEFAULT_SETTINGS.executeTemplate)
                    .onChange((value) => {
                        value = value.trim();
                        if (value === '') value = DEFAULT_SETTINGS.executeTemplate;
                        this.plugin.settings.executeTemplate = value;
                        this.plugin.saveData(this.plugin.settings);
                    }),
            );
        new Setting(containerEl)
            .setName('Path to VSCode Workspace (Use URL only)')
            .setDesc(
                'If "Use URL" is checked, VSCode will open Obsidian files in this workspace (requires an absolute path)',
            )
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.workspacePath)
                    .setValue(this.plugin.settings.workspacePath || DEFAULT_SETTINGS.workspacePath)
                    .onChange((value) => {
                        value = value.trim();
                        if (value === '') value = DEFAULT_SETTINGS.workspacePath;
                        this.plugin.settings.workspacePath = value;
                        this.plugin.saveData(this.plugin.settings);
                    }),
            );

        new Setting(containerEl)
            .setName('Open current file (Use URL only)')
            .setDesc('If "Use URL" is checked, open the current file rather than the root of the vault')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.openFile || DEFAULT_SETTINGS.openFile).onChange((value) => {
                    this.plugin.settings.openFile = value;
                    this.plugin.saveData(this.plugin.settings);
                }),
            );
    }
}
