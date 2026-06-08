import type { MenuItem, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import type OpenVSCode from "./main.ts";

/*
 * Notebook Navigator builds its own menus and does not fire Obsidian's "file-menu"
 * event, so register the same entry through its public API when present.
 *
 * Types below are the subset we use, mirrored from notebook-navigator.d.ts @ 3.1.2:
 * https://github.com/johansan/notebook-navigator/blob/3.1.2/src/api/public/notebook-navigator.d.ts#L390-L399
 */

const NOTEBOOK_NAVIGATOR_ID = "notebook-navigator";

interface FileMenuExtensionContext {
    addItem(cb: (item: MenuItem) => void): void;
    file: TFile;
}

interface FolderMenuExtensionContext {
    addItem(cb: (item: MenuItem) => void): void;
    folder: TFolder;
}

type MenuExtensionDispose = () => void;

interface NotebookNavigatorAPI {
    menus: {
        registerFileMenu(callback: (context: FileMenuExtensionContext) => void): MenuExtensionDispose;
        registerFolderMenu(callback: (context: FolderMenuExtensionContext) => void): MenuExtensionDispose;
    };
}

/** Mirrors the native "Open in VS Code" entry into Notebook Navigator's file and folder menus. */
export function registerNotebookNavigatorMenus(plugin: OpenVSCode, iconId: string): void {
    plugin.app.workspace.onLayoutReady(() => {
        const nnPlugin = plugin.app.plugins.plugins[NOTEBOOK_NAVIGATOR_ID] as
            | (Plugin & { api?: NotebookNavigatorAPI })
            | undefined;
        const menus = nnPlugin?.api?.menus;
        if (!menus) return;

        const addOpenItem = (item: MenuItem, file: TAbstractFile): void => {
            item.setTitle("Open in VS Code")
                .setIcon(iconId)
                .onClick(() => {
                    plugin.openVSCode(file);
                });
        };

        plugin.register(
            menus.registerFileMenu((context) => {
                if (!plugin.settings.showFileContextMenuItem) return;
                context.addItem((item) => {
                    addOpenItem(item, context.file);
                });
            }),
        );
        plugin.register(
            menus.registerFolderMenu((context) => {
                if (!plugin.settings.showFileContextMenuItem) return;
                context.addItem((item) => {
                    addOpenItem(item, context.folder);
                });
            }),
        );
    });
}
