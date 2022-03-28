import {
	addIcon, App, FileSystemAdapter, Plugin,
	PluginSettingTab, Setting
} from 'obsidian';

const svg = `
<path
  fill="currentColor"
  d="M 96.453125 10.773438 L 75.882812 0.878906 C 73.488281 -0.277344 70.640625 0.210938 68.769531 2.082031 L 29.367188 38.035156 L 12.195312 25.011719 C 10.601562 23.789062 8.351562 23.890625 6.871094 25.242188 L 1.371094 30.253906 C -0.449219 31.898438 -0.449219 34.761719 1.355469 36.40625 L 16.25 49.996094 L 1.355469 63.585938 C -0.449219 65.230469 -0.449219 68.097656 1.371094 69.742188 L 6.871094 74.753906 C 8.367188 76.101562 10.601562 76.203125 12.195312 74.980469 L 29.367188 61.945312 L 68.789062 97.914062 C 70.644531 99.785156 73.492188 100.273438 75.882812 99.117188 L 96.476562 89.203125 C 98.640625 88.164062 100.007812 85.980469 100.007812 83.570312 L 100.007812 16.398438 C 100.007812 14.007812 98.621094 11.808594 96.460938 10.769531 Z M 75.015625 72.707031 L 45.101562 50 L 75.015625 27.292969 Z M 75.015625 72.707031"
/>`

addIcon('vscode-logo', svg);
export default class OpenVSCode extends Plugin {
	ribbonIcon: HTMLElement;
	settings: OpenVSCodeSettings;

	async onload() {
		console.log('Loading ' + this.manifest.name + ' plugin');
		this.addSettingTab(new OpenVSCodeSettingsTab(this.app, this));
		await this.loadSettings();

		this.refreshIconRibbon();

		this.addCommand({
			id: 'open-vscode',
			name: 'Open as Visual Studio Code workspace',
			callback: this.openVSCode.bind(this)
		});
	}

	async openVSCode() {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return;
		}

		const path = this.app.vault.adapter.getBasePath();
		if (this.settings.useURL) {
			const url = "vscode://file/" + path;
			console.log('[openVSCode]', { url });
			window.open(url, "_blank");
		}
		else {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { exec } = require("child_process");
			const file = this.app.workspace.getActiveFile();
			let command = this.settings.executeTemplate.trim() === "" ? DEFAULT_SETTINGS.executeTemplate : this.settings.executeTemplate;
			command = replaceAll(command, "{{vaultpath}}", path);
			command = replaceAll(command, "{{filepath}}", file?.path ?? "");
			console.log('[openVSCode]', { command });
			exec(command, (error: never, stdout: never, stderr: never) => {
				if (error) {
					console.error(`exec error: ${error}`);
				}
			});
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshIconRibbon = () => {
		this.ribbonIcon?.remove();
		if (this.settings.ribbonIcon) {
			this.ribbonIcon = this.addRibbonIcon('vscode-logo', 'VSCode', () => {
				this.openVSCode();
			});
		}
	}
}

interface OpenVSCodeSettings {
	ribbonIcon: boolean,
	useURL: boolean,
	executeTemplate: string,
}

const DEFAULT_SETTINGS: OpenVSCodeSettings = {
	ribbonIcon: true,
	useURL: false,
	executeTemplate: "code \"{{vaultpath}}\"",
}

class OpenVSCodeSettingsTab extends PluginSettingTab {

	plugin: OpenVSCode;

	constructor(app: App, plugin: OpenVSCode) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Settings" });

		new Setting(containerEl)
			.setName('Ribbon Icon')
			.setDesc('Turn on if you want to have a Ribbon Icon.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.ribbonIcon)
				.onChange((value) => {
					this.plugin.settings.ribbonIcon = value;
					this.plugin.saveSettings();
					this.plugin.refreshIconRibbon();
				})
			);
		new Setting(containerEl)
			.setName('Use URL')
			.setDesc('Open VSCode using a `vscode://` URL instead of executing the `code` command.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.useURL)
				.onChange((value) => {
					this.plugin.settings.useURL = value;
					this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName('Default template for executing the `code` command')
			.setDesc('You can use the following variables: {{vaultpath}}, {{filepath}} (relative)')
			.addText(text => text.setPlaceholder(DEFAULT_SETTINGS.executeTemplate)
				.setValue(this.plugin.settings.executeTemplate || DEFAULT_SETTINGS.executeTemplate)
				.onChange((value) => {
					value = value.trim();
					if (value === "") value = DEFAULT_SETTINGS.executeTemplate;
					this.plugin.settings.executeTemplate = value;
					this.plugin.saveData(this.plugin.settings);
				}));
	}

}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str: string, find: string, replace: string) {
	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
