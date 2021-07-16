import { addIcon, FileSystemAdapter, Plugin } from 'obsidian';

let svg = `
<path
  fill="currentColor"
  d="M 96.453125 10.773438 L 75.882812 0.878906 C 73.488281 -0.277344 70.640625 0.210938 68.769531 2.082031 L 29.367188 38.035156 L 12.195312 25.011719 C 10.601562 23.789062 8.351562 23.890625 6.871094 25.242188 L 1.371094 30.253906 C -0.449219 31.898438 -0.449219 34.761719 1.355469 36.40625 L 16.25 49.996094 L 1.355469 63.585938 C -0.449219 65.230469 -0.449219 68.097656 1.371094 69.742188 L 6.871094 74.753906 C 8.367188 76.101562 10.601562 76.203125 12.195312 74.980469 L 29.367188 61.945312 L 68.789062 97.914062 C 70.644531 99.785156 73.492188 100.273438 75.882812 99.117188 L 96.476562 89.203125 C 98.640625 88.164062 100.007812 85.980469 100.007812 83.570312 L 100.007812 16.398438 C 100.007812 14.007812 98.621094 11.808594 96.460938 10.769531 Z M 75.015625 72.707031 L 45.101562 50 L 75.015625 27.292969 Z M 75.015625 72.707031"
/>`

addIcon('vscode-logo', svg);
export default class OpenVSCode extends Plugin {
	ribbonIcon: HTMLElement;

	async onload() {
		this.ribbonIcon = this.addRibbonIcon('vscode-logo', 'VSCode', () => {
			this.openVSCode();
		});

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

		let path = this.app.vault.adapter.getBasePath();
		let url = "vscode://file/" + path;
		window.open(url, "_blank");
	}
}
