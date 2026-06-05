import type { MenuItem, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import type OpenVSCode from "./main.ts";

/*
 * Integration with Notebook Navigator (https://github.com/johansan/notebook-navigator).
 *
 * Notebook Navigator (NN) is a popular file explorer replacement. It builds its own
 * context menus and intentionally does not fire Obsidian's native "file-menu" event,
 * so the entry added in `fileMenuHandler` never shows up there. Instead, NN exposes a
 * public API that lets plugins register items directly into its menus.
 *
 * API reference: https://github.com/johansan/notebook-navigator/blob/main/docs/api-reference.md
 *
 * Only the small part of the API used here is typed.
 */

const NOTEBOOK_NAVIGATOR_ID = "notebook-navigator";

type AddItem = (cb: (item: MenuItem) => void) => void;

interface NotebookNavigatorApi {
    menus?: {
        // Both available since Notebook Navigator 1.2.0.
        registerFolderMenu?: (
            callback: (context: { addItem: AddItem; folder: TFolder }) => void,
        ) => () => void;
        registerFileMenu?: (callback: (context: { addItem: AddItem; file: TFile }) => void) => () => void;
    };
}

/**
 * Mirrors the native "Open in VS Code" file explorer entry (see `fileMenuHandler`)
 * into Notebook Navigator's file and folder context menus via its public API.
 *
 * Does nothing if Notebook Navigator is not installed or its API is unavailable.
 * The menu items honour the same `showFileContextMenuItem` setting as the native entry.
 */
export function registerNotebookNavigatorMenus(plugin: OpenVSCode, iconId: string): void {
    // Wait for layout ready so Notebook Navigator has loaded and exposed its API.
    plugin.app.workspace.onLayoutReady(() => {
        const nnPlugin = plugin.app.plugins.plugins[NOTEBOOK_NAVIGATOR_ID] as
            | (Plugin & { api?: NotebookNavigatorApi })
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

        if (menus.registerFolderMenu) {
            const dispose = menus.registerFolderMenu(({ addItem, folder }) => {
                if (!plugin.settings.showFileContextMenuItem) return;
                addItem((item) => {
                    addOpenItem(item, folder);
                });
            });
            plugin.register(dispose);
        }

        if (menus.registerFileMenu) {
            const dispose = menus.registerFileMenu(({ addItem, file }) => {
                if (!plugin.settings.showFileContextMenuItem) return;
                addItem((item) => {
                    addOpenItem(item, file);
                });
            });
            plugin.register(dispose);
        }
    });
}
