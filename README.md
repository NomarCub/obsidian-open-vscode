# Open in VSCode

This plugin for [Obsidian](https://obsidian.md/) makes a ribbon button and two commands to open your vault as a Visual Studio Code workspace:

- `open-vscode`: Uses `child_process` to launch VSCode with the `code` command. Currently, this is the command bound to the ribbon button.
- `open-vscode-via-url`: Open VSCode using a `vscode://` URL *(Windows users, please see [notes regarding the UX of this command](#caveats-regarding-the-url-command-for-windows-users))*

It's functionality is probably made redundant now using the [Shell commands](https://github.com/Taitava/obsidian-shellcommands) and [Customizable Sidebar](https://github.com/phibr0/obsidian-customizable-sidebar) (or [Buttons](https://github.com/shabegom/buttons)) plugins, but it'll be maintained for the foreseeable future.

You can use VSCode for various purposes with your vault, such as for git version control, markdown formatting with [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), linting with [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint), [mass formatting files](https://marketplace.visualstudio.com/items?itemName=jbockle.jbockle-format-files) and more.

![video showcase](https://user-images.githubusercontent.com/5298006/125867690-c11f4396-e31b-4232-9ea5-822bf729df9a.gif)

The icons work with light and dark mode.

![light and dark](https://user-images.githubusercontent.com/5298006/125868293-96c6f541-0604-4238-9fc3-05ff6c2e08df.gif)

You can also use it as a command and assign hotkeys to it. You can disable the ribbon button in settings.
![command](https://user-images.githubusercontent.com/5298006/125869408-d39d870b-ab4f-42d0-b915-b6abc1e617d5.png)

## Settings

- **Display Ribbon Icon**
- **Ribbon opens via `code`** (can alteratively open via URL method)

### Template for executing the `code` command

You can template the command opening VSCode however you like with its [provided command line arguments](https://code.visualstudio.com/docs/editor/command-line). This way you can technically launch any command you set, so take caution. Potential use cases include opening workspaces with `.code-workspace` files (e.g. for Dendron), opening specific files, folders, etc.

Note that on MacOS, a full path to the VSCode executable is required (generally "/usr/local/bin/code").

You can use the following variables: `{{vaultpath}}` (absolute), `{{filepath}}` (relative), `{{folderpath}}` (relative), `{{line}}` and `{{ch}}`.
The default template is `code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"`, which opens the current file (if there is one) in the workspace that is the vault's root folder. This gets expanded to be executed in your shell as `code "C:\Users\YourUser\Documents\vault" "C:\Users\YourUser\Documents\vault/Note.md"`, for example.

If you want to jump to the line (and character), you can use `code -g "{{vaultpath}}" "{{vaultpath}}/{{filepath}}:{{line}}:{{ch}}`.  
See also: [VSCode CLI - Opening Files and Folders](https://code.visualstudio.com/docs/editor/command-line#_opening-files-and-folders).

### Settings for `open-vscode-via-url`

On some systems, this may be faster than using the `child_process` approach.

- **Open file**

  Open the current file rather than the root of the Obsidian vault.

- **Path to VSCode Workspace**

  Defaults to the `{{vaultpath}}` template variable. You can set this to an absolute path to a ".code-workspace" file if you prefer to use a [Multi Root workspace file](https://code.visualstudio.com/docs/editor/workspaces#_multiroot-workspaces)

- **Open VSCode using a `vscode-insiders://` URL**

The first time you use the URL method for opening, VSCode displays a confirmation dialog (that you just can hit enter on) for security reasons. See [this issue](https://github.com/microsoft/vscode/issues/95670) for more infomation.

### Caveats regarding the URL command for Windows users

TLDR; We recommend that Windows users prefer the `open-vscode` command (and not the URL one).

Due to security updates in VSCode, the user experience of using opening VSCode via URL comes with some known issues!

On Windows, when opening via URL, you are prompted to allow VSCode to access the file. At present there's no option in VSCode to whitelist safe locations (ie your Obsidian vault), so you get this dialog every time ☹️.

Worse, if you are opening via URL, *and* have toggled the "Open File" setting on, then VSCode will attempt to open a *second* instance of VSCode, and will warn that there's another instance of Code running but not responding.

If this issue affects you, please consider watching and voting for the following VSCode issues:

- [Prompt users when opening vscode://file/... URIs · Issue #95252 · microsoft/vscode](https://github.com/microsoft/vscode/issues/95252)
- [URL protocol: confirmation dialog · Issue #95670 · microsoft/vscode](https://github.com/microsoft/vscode/issues/95670)

## Installation

You can install the plugin via the Community Plugins tab within the Obsidian app.  
[Here](https://obsidian.md/plugins?id=open-vscode)'s the plugin in Obsidian's Community Plugins website.  
You can install the plugin manually by copying a release to your `.obsidian/plugins/open-vscode` folder.

## Development

This plugin follows the structure of the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin), see further details there.  
Contributions are welcome.

If [pjeby/hot-reload](https://github.com/pjeby/hot-reload) is installed,
activated, and open-vscode is registered with hot-reload, then extra logging
and DX commands to refresh settings are activated.

## Credits

Original plugin by [NomarCub](https://github.com/NomarCub).  
If you like this plugin you can sponsor me here on GitHub: [![Sponsor NomarCub](https://img.shields.io/static/v1?label=Sponsor%20NomarCub&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/NomarCub), on Ko-fi here: <a href='https://ko-fi.com/nomarcub' target='_blank'><img height='35' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' alt='Buy Me a Coffee at ko-fi.com' /></a>, or on PayPal here: [![Paypal](https://img.shields.io/badge/paypal-nomarcub-yellow?style=social&logo=paypal)](https://paypal.me/nomarcub).

[Toggle ribbon setting](https://github.com/NomarCub/obsidian-open-vscode/pull/1) by [ozntel](https://github.com/ozntel).  
[UseURL: open file in workspace](https://github.com/NomarCub/obsidian-open-vscode/pull/5) [feature](https://github.com/NomarCub/obsidian-open-vscode/pull/7) and restructure by [ptim](https://github.com/ptim).
[Go to line support](https://github.com/NomarCub/obsidian-open-vscode/pull/13) by [Moyf](https://github.com/Moyf).  

Thank you to the makers of the [DEVONlink](https://github.com/ryanjamurphy/DEVONlink-obsidian) plugin, as it was a great starting point for working with ribbon icons in Obsidian.
The icon is from [Simple Icons](https://simpleicons.org/?q=visual-studio-code) ([SVG](https://simpleicons.org/icons/visualstudiocode.svg)).
