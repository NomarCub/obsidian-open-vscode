import { type App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type OpenVSCode from "./main.ts";

export type OpenMethod = "exec" | "url";
export type OpenTarget = "Vault" | "Folder" | "File";

export interface OpenVSCodeSettings {
    ribbonIcon: boolean;
    openMethod: OpenMethod;
    showFileContextMenuItem: boolean;
    openFile: boolean;
    execVaultTemplate: string;
    execFolderTemplate: string;
    execFileTemplate: string;
    urlVaultTemplate: string;
    urlFolderTemplate: string;
    urlFileTemplate: string;
}

export const DEFAULT_SETTINGS: OpenVSCodeSettings = {
    ribbonIcon: true,
    openMethod: "exec",
    showFileContextMenuItem: true,
    openFile: false,
    execVaultTemplate: 'code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"',
    execFolderTemplate: 'code "{{vaultpath}}/{{folderpath}}"',
    execFileTemplate: 'code "{{vaultpath}}" --goto "{{vaultpath}}/{{filepath}}:{{line}}:{{ch}}"',
    urlVaultTemplate: "vscode://file/{{vaultpath}}",
    urlFolderTemplate: "vscode://file/{{vaultpath}}/{{folderpath}}",
    urlFileTemplate: "vscode://file/{{vaultpath}}/{{filepath}}:{{line}}:{{ch}}",
};

export class OpenVSCodeSettingsTab extends PluginSettingTab {
    override plugin: OpenVSCode;

    constructor(app: App, plugin: OpenVSCode) {
        super(app, plugin);
        this.plugin = plugin;
    }

    validateInput(input: string, fieldName: string): string | undefined {
        if (/^\s/.exec(input) || /\s$/.exec(input)) {
            return `${fieldName} should not begin or end with whitespace`;
        } else if (input === "") {
            return `${fieldName} should not be empty`;
        }
        return undefined;
    }

    override getSettingDefinitions(): SettingDefinitionItem<keyof OpenVSCodeSettings>[] {
        return [
            /// 1. General settings
            {
                name: "Display ribbon icon",
                desc: "Toggle this off, if you want to hide the ribbon icon.",
                render: (setting) => {
                    setting.addToggle((toggle) =>
                        toggle.setValue(this.plugin.settings.ribbonIcon).onChange((value) => {
                            this.plugin.settings.ribbonIcon = value;
                            void this.plugin.saveSettings();
                            this.plugin.refreshIconRibbon();
                        }),
                    );
                },
            },
            {
                name: "Open method",
                desc: "Choose how to open VS Code.",
                control: {
                    type: "dropdown",
                    key: "openMethod",
                    defaultValue: DEFAULT_SETTINGS.openMethod,
                    options: { exec: "Shell command", url: "URL" },
                },
            },
            {
                name: 'Display "Open in VS Code" option for files/folders',
                desc: 'Toggle this off to hide the "Open in VS Code" option when right-clicking a file/folder.',
                control: {
                    type: "toggle",
                    key: "showFileContextMenuItem",
                    defaultValue: DEFAULT_SETTINGS.showFileContextMenuItem,
                },
            },
            {
                name: "Templates",
                desc: createFragment((fragment) => {
                    fragment.createEl("p", {
                        text: "You can use the following variables: '{{vaultpath}}' (absolute), '{{filepath}}' (relative), '{{folderpath}}' (relative), '{{line}}' and '{{ch}}'.",
                    });
                    fragment.createEl(
                        "p",
                        {
                            text: 'In a vault template, you can replace "{{vaultpath}}" with an absolute path to a ".code-workspace" file if you prefer to use a multi-root workspace ',
                        },
                        (paragraph) => {
                            paragraph.append(
                                createEl("a", {
                                    text: "(link)",
                                    href: "https://code.visualstudio.com/docs/editor/workspaces#_multiroot-workspaces",
                                }),
                                ".",
                            );
                        },
                    );
                }),
            },
            /// 2. Exec settings
            {
                type: "group",
                heading: "Shell command settings",
                items: [
                    {
                        // name is necessary to keep the description-only row visible without a render callback
                        name: "Shell command help",
                        desc: createFragment((fragment) => {
                            fragment.append(
                                createEl("span", {
                                    text: "For common issues, see the relevant part of the readme ",
                                }),
                                createEl("a", {
                                    text: "(link)",
                                    href: "https://github.com/NomarCub/obsidian-open-vscode#prerequisites",
                                }),
                                createEl("span", { text: "." }),
                            );
                        }),
                    },
                    {
                        name: "Vault command template",
                        desc: `Default: ${DEFAULT_SETTINGS.execVaultTemplate}`,
                        control: {
                            type: "text",
                            key: "execVaultTemplate",
                            placeholder: DEFAULT_SETTINGS.execVaultTemplate,
                            defaultValue: DEFAULT_SETTINGS.execVaultTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                    {
                        name: "Folder command template",
                        desc: `Default: ${DEFAULT_SETTINGS.execFolderTemplate}`,
                        control: {
                            type: "text",
                            key: "execFolderTemplate",
                            placeholder: DEFAULT_SETTINGS.execFolderTemplate,
                            defaultValue: DEFAULT_SETTINGS.execFolderTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                    {
                        name: "File command template",
                        desc: `Default: ${DEFAULT_SETTINGS.execFileTemplate}`,
                        control: {
                            type: "text",
                            key: "execFileTemplate",
                            placeholder: DEFAULT_SETTINGS.execFileTemplate,
                            defaultValue: DEFAULT_SETTINGS.execFileTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                ],
            },
            /// 3. URL method settings
            {
                type: "group",
                heading: "URL method settings",
                items: [
                    // description for the heading
                    {
                        name: "",
                        render: (setting) => {
                            const description = createEl("p", { text: "See: " });
                            description.appendChild(
                                createEl("a", {
                                    text: "Opening VS Code with URLs",
                                    href: "https://code.visualstudio.com/docs/configure/command-line#_opening-vs-code-with-urls",
                                }),
                            );

                            setting.controlEl.append(description);
                        },
                    },
                    // settings
                    {
                        name: "Open vault first",
                        desc: "Open the vault before opening the selected file or folder.",
                        control: {
                            type: "toggle",
                            key: "openFile",
                            defaultValue: DEFAULT_SETTINGS.openFile,
                        },
                    },
                    {
                        name: "Vault URL template",
                        desc: `Default: ${DEFAULT_SETTINGS.urlVaultTemplate}`,
                        control: {
                            type: "text",
                            key: "urlVaultTemplate",
                            placeholder: DEFAULT_SETTINGS.urlVaultTemplate,
                            defaultValue: DEFAULT_SETTINGS.urlVaultTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                    {
                        name: "Folder URL template",
                        desc: `Default: ${DEFAULT_SETTINGS.urlFolderTemplate}`,
                        control: {
                            type: "text",
                            key: "urlFolderTemplate",
                            placeholder: DEFAULT_SETTINGS.urlFolderTemplate,
                            defaultValue: DEFAULT_SETTINGS.urlFolderTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                    {
                        name: "File URL template",
                        desc: `Default: ${DEFAULT_SETTINGS.urlFileTemplate}`,
                        control: {
                            type: "text",
                            key: "urlFileTemplate",
                            placeholder: DEFAULT_SETTINGS.urlFileTemplate,
                            defaultValue: DEFAULT_SETTINGS.urlFileTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                ],
            },
        ];
    }
}
