import { App, FileSystemAdapter, Plugin, addIcon } from 'obsidian';
import { DEFAULT_SETTINGS, OpenVSCodeSettings, OpenVSCodeSettingsTab } from './settings';

const svg = `
<path
  fill="currentColor"
  d="M 96.457031 10.777344 L 75.875 0.875 C 73.492188 -0.273438 70.640625 0.210938 68.769531 2.082031 L 29.355469 38.042969 L 12.1875 25.007812 C 10.589844 23.796875 8.355469 23.894531 6.871094 25.246094 L 1.363281 30.253906 C 0.496094 31.042969 0 32.160156 0 33.335938 C -0.00390625 34.507812 0.492188 35.625 1.359375 36.417969 L 16.246094 50 L 1.359375 63.582031 C 0.492188 64.375 -0.00390625 65.492188 0 66.664062 C 0 67.839844 0.496094 68.957031 1.363281 69.746094 L 6.875 74.75 C 8.359375 76.101562 10.59375 76.199219 12.191406 74.988281 L 29.359375 61.953125 L 68.773438 97.914062 C 70.644531 99.785156 73.492188 100.269531 75.875 99.121094 L 96.464844 89.214844 C 98.628906 88.171875 100 85.984375 100 83.582031 L 100 16.414062 C 100 14.011719 98.625 11.820312 96.457031 10.777344 Z M 75.015625 72.699219 L 45.109375 50 L 75.015625 27.300781 Z M 75.015625 72.699219"
/>
`;

addIcon('vscode-logo', svg);

type AppWithPlugins = App & {
	plugins: {
		disablePlugin: (id: string) => unknown;
		enablePlugin: (id: string) => unknown;
		enabledPlugins: Set<string>;
		plugins: Record<string, any>;
	};
};

let DEV = false;

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
			callback: this.openVSCode.bind(this),
		});

		this.addCommand({
			id: 'open-vscode-via-url',
			name: 'Open as Visual Studio Code workspace using a vscode:// URL',
			callback: this.openVSCodeUrl.bind(this),
		});

		DEV =
			(this.app as AppWithPlugins).plugins.enabledPlugins.has('hot-reload') &&
			(this.app as AppWithPlugins).plugins.plugins['hot-reload'].enabledPlugins.has(this.manifest.id);

		if (DEV) {
			this.addCommand({
				id: 'open-vscode-reload',
				name: 'Reload the plugin in dev',
				callback: this.reload.bind(this),
			});

			this.addCommand({
				id: 'open-vscode-reset-settings',
				name: 'Reset plugins settings to default in dev',
				callback: this.resetSettings.bind(this),
			});
		}
	}

	async openVSCode() {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return;
		}
		const { executeTemplate } = this.settings;

		const path = this.app.vault.adapter.getBasePath();
		const file = this.app.workspace.getActiveFile();
		const filePath = file?.path ?? '';

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { exec } = require('child_process');

		let command = executeTemplate.trim() === '' ? DEFAULT_SETTINGS.executeTemplate : executeTemplate;
		command = replaceAll(command, '{{vaultpath}}', path);
		command = replaceAll(command, '{{filepath}}', filePath);
		if (DEV) console.log('[openVSCode]', { command });
		exec(command, (error: never, stdout: never, stderr: never) => {
			if (error) {
				console.error(`[openVSCode] exec error: ${error}`);
			}
		});
	}

	async openVSCodeUrl() {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return;
		}
		const { openFile, useUrlInsiders } = this.settings;

		const path = this.app.vault.adapter.getBasePath();
		const file = this.app.workspace.getActiveFile();
		const filePath = file?.path ?? '';
		if (DEV)
			console.log('[open-vscode]', {
				settings: this.settings,
				path,
				filePath,
			});

		// https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls
		const protocol = useUrlInsiders ? 'vscode-insiders://' : 'vscode://';
		let url = `${protocol}file/${path}`;

		if (openFile) {
			url += `/${filePath}`;
			/*
			By default, opening a file via the vscode:// URL will cause that file to open
			in the front-most window in VSCode. We assume that it is preferred that files from
			Obsidian should all open in the same workspace.

			As a workaround, we issue two open requests to VSCode in quick succession: the first to
			bring the workspace to front, the second to open the file.

			There is a ticket requesting this feature for VSCode:
			https://github.com/microsoft/vscode/issues/150078
			*/

			// HACK: first open the _workspace_ to bring the correct window to the front....
			const workspacePath = replaceAll(this.settings.workspacePath, '{{vaultpath}}', path);
			window.open(`vscode://file/${workspacePath}`);

			// ...then open the _file_ in a setTimeout callback to allow time for the workspace to be activated
			setTimeout(() => {
				if (DEV) console.log('[openVSCode]', { url });
				window.open(url);
			}, 200); // anecdotally, this seems to be the min required for the workspace to activate
		} else {
			if (DEV) console.log('[openVSCode]', { url });
			window.open(url);
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
				const ribbonCommand = this.settings.ribbonCommandUsesCode ? 'openVSCode' : 'openVSCodeUrl';
				this[ribbonCommand]();
			});
		}
	};

	/**
	 * [pjeby](https://forum.obsidian.md/t/how-to-get-started-with-developing-a-custom-plugin/8157/7)
	 *
	 * > ...while doing development, you may need to reload your plugin
	 * > after making changes. You can do this by reloading, sure, but it’s easier
	 * > to just go to settings and then toggle the plugin off, then back on again.
	 * >
	 * > You can also automate this process from within the plugin itself, by
	 * > including a command that does something like this:
	 */
	async reload() {
		const id = this.manifest.id;
		const plugins = (this.app as AppWithPlugins).plugins;
		await plugins.disablePlugin(id);
		await plugins.enablePlugin(id);
		console.log('[open-vscode] reloaded', this);
	}

	async resetSettings() {
		console.log('[open-vscode]', { old: this.settings, DEFAULT_SETTINGS });
		this.settings = DEFAULT_SETTINGS;
		await this.saveData(this.settings);
	}
}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str: string, find: string, replace: string) {
	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
