import { type App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type OpenVSCode from "./main.ts";

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

    override getSettingDefinitions(): SettingDefinitionItem<keyof OpenVSCodeSettings>[] {
        // TODO: use appendChild instead?
        const executeDescription = document.createDocumentFragment();
        executeDescription.append(
            createEl("p", {
                text: "You can use the following variables: '{{vaultpath}}' (absolute), '{{filepath}}' (relative), '{{folderpath}}' (relative), '{{line}}' and '{{ch}}'.",
            }),
            createEl("p", { text: `Default: ${DEFAULT_SETTINGS.executeTemplate}\n` }),
            createEl("span", { text: "For common issues, see the relevant part of the readme " }),
            createEl("a", {
                text: "(link)",
                href: "https://github.com/NomarCub/obsidian-open-vscode#prerequisites",
            }),
            createEl("span", { text: "." }),
        );

        const workspacePathDescription = document.createDocumentFragment();
        workspacePathDescription.appendText(
            `Default: ${DEFAULT_SETTINGS.workspacePath}. You can set this to an absolute path to a ".code-workspace" file if you prefer to use a multi-root workspace `,
        );
        workspacePathDescription
            .appendChild(
                createEl("a", {
                    text: "(link)",
                    href: "https://code.visualstudio.com/docs/editor/workspaces#_multiroot-workspaces",
                }),
            )
            .appendText(".");

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
                name: "Ribbon opens via 'code' command",
                desc: "Toggle this off, if you'd prefer that the ribbon icon opens VS Code via URL.",
                control: {
                    type: "toggle",
                    key: "ribbonCommandUsesCode",
                    defaultValue: DEFAULT_SETTINGS.ribbonCommandUsesCode,
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
            /// 2. Open via 'code' CLI command settings
            {
                type: "group",
                heading: "Open via 'code' CLI command",
                items: [
                    {
                        name: "Template for executing the 'code' command",
                        desc: executeDescription,
                        control: {
                            type: "text",
                            key: "executeTemplate",
                            placeholder: DEFAULT_SETTINGS.executeTemplate,
                            defaultValue: DEFAULT_SETTINGS.executeTemplate,
                            validate: (value: string) => this.validateInput(value, "Template"),
                        },
                    },
                ],
            },
            /// 3. Open via 'vscode://' URL settings
            {
                type: "group",
                heading: "Open via 'vscode://' URL",
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
                        name: "Open current file",
                        desc: "Open the current file rather than the root of the vault.",
                        control: {
                            type: "toggle",
                            key: "openFile",
                            defaultValue: DEFAULT_SETTINGS.openFile,
                        },
                    },
                    {
                        name: "Path to VS Code workspace",
                        desc: workspacePathDescription,
                        control: {
                            type: "text",
                            key: "workspacePath",
                            defaultValue: DEFAULT_SETTINGS.workspacePath,
                            placeholder: DEFAULT_SETTINGS.workspacePath,
                            validate: (value: string) => this.validateInput(value, "Path"),
                        },
                    },
                    {
                        name: "URL protocol",
                        desc: `Default: ${DEFAULT_SETTINGS.urlProtocol}. You can override the default vscode:// to VS Code Insiders, VSCodium or other VS Code variants' protocol string`,
                        control: {
                            type: "text",
                            key: "urlProtocol",
                            defaultValue: DEFAULT_SETTINGS.urlProtocol,
                            placeholder: DEFAULT_SETTINGS.urlProtocol,
                            validate: (value: string) => this.validateInput(value, "Protocol"),
                        },
                    },
                ],
            },
        ];
    }

    validateInput(input: string, fieldName: string): string | undefined {
        if (/^\s/.exec(input) || /\s$/.exec(input)) {
            return `${fieldName} should not begin or end with whitespace`;
        } else if (input === "") {
            return `${fieldName} should not be empty`;
        }
        return undefined;
    }
}
