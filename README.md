# Open in VSCode

This plugin for [Obsidian](https://obsidian.md/) makes a ribbon button and a command to open your vault as a Visual Studio Code workspace.

It's functionality is probably made redundant now using the [Shell commands](https://github.com/Taitava/obsidian-shellcommands) and [Customizable Sidebar](https://github.com/phibr0/obsidian-customizable-sidebar) (or [Buttons](https://github.com/shabegom/buttons)) plugins, but it'll be maintained for the foreseeable future.

You can use VSCode for various purposes with your vault, such as for git version control, markdown formatting with [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), linting with [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint), [mass formatting files](https://marketplace.visualstudio.com/items?itemName=jbockle.jbockle-format-files) and more.

![video showcase](https://user-images.githubusercontent.com/5298006/125867690-c11f4396-e31b-4232-9ea5-822bf729df9a.gif)

The icons work with light and dark mode.

![light and dark](https://user-images.githubusercontent.com/5298006/125868293-96c6f541-0604-4238-9fc3-05ff6c2e08df.gif)

You can also use it as a command and assign hotkeys to it. You can disable the ribbon button in settings.
![command](https://user-images.githubusercontent.com/5298006/125869408-d39d870b-ab4f-42d0-b915-b6abc1e617d5.png)

## Settings

### Open VSCode by executing the `code` command

By default the plugin uses `child_process` to launch VSCode with the `code` command, but the previous method using URLs can still be enabled by checking the following option:

### Open VSCode using a `vscode://` URL instead of executing the `code` command.

On some systems, this may be faster than using the `child_process` approach.

### Template for executing the `code` command

You can template the command opening VSCode however you like with its [provided command line arguments](https://code.visualstudio.com/docs/editor/command-line). This way you can technically launch any command you set, so take caution. Potential use cases include opening workspaces with `.code-workspace` files (e.g. for Dendron), opening specific files, folders, etc.

Note that on MacOS, a full path to the VSCode executable is required (generally "/usr/local/bin/code").

You can use the following variables: `{{vaultpath}}` (absolute), `{{filepath}}` (relative).
The default template is `code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"`, which opens the current file (if there is one) in the workspace that is the vault's root folder. This gets expanded to be executed in your shell as `code "C:\Users\YourUser\Documents\vault" "C:\Users\YourUser\Documents\vault/Note.md"`, for example.

### Path to VSCode Workspace

If "Use URL" is checked, VSCode will open Obsidian files in this workspace (requires an absolute path).

### Open file

If "Use URL" is checked, open the current file rather than the root of the Obsidian vault.

## Installation

You can install the plugin via the Community Plugins tab within Obsidian.
You can also manually copy from releases to your `.obsidian/plugins/open-vscode` folder.

## Caveats

The first time you use the URL method for opening, VSCode displays a confirmation dialog (that you just can hit enter on) for security reasons. See [this issue](https://github.com/microsoft/vscode/issues/95670) for more infomation.

## Development

Run `npm install` for dependencies and `npm run build` to build.

This plugin follows the structure of the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin), see further details there. Contributions are welcome.

## Credits

Toggle ribbon setting by [@ozntel](https://github.com/ozntel).

Thank you to the makers of the [DEVONlink](https://github.com/ryanjamurphy/DEVONlink-obsidian) plugin, as it was a great starting point for working with ribbon icons in Obsidian.
The icon is from [icon-icons.com](https://icon-icons.com/icon/visual-studio-code-logo/144754) and was resized with [iLoveIMG](https://www.iloveimg.com/resize-image/resize-svg).

## Support

If you like this plugin you can support me on PayPal here: [![Paypal](https://img.shields.io/badge/paypal-nomarcub-yellow?style=social&logo=paypal)](https://paypal.me/nomarcub)
