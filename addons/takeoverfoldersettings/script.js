var Addon_Id = "takeoverfoldersettings";
var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Filter")) {
    item.setAttribute("Filter", "?:\\*;\\\\*");
}
if (window.Addon == 1) {
    Addons.TakeOverFolderSettings = {
        db: "",
        CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\takeoverfoldersettings.txt"),
        Filter: item ? item.getAttribute("Filter") : "?:\\*;\\\\*",
        nFormat: api.QuadPart(GetAddonOption(Addon_Id, "Format")),
        RememberFolder: function(FV) {
            if (FV && FV.FolderItem && !FV.FolderItem.Unvailable) {
                var path = String(api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
                if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter) && path == FV.Data.TakeOver) {
                    var col = FV.Columns(Addons.TakeOverFolderSettings.nFormat);
                    if (col) {
                        var db = [FV.CurrentViewMode, FV.IconSize, col, FV.SortColumn(Addons.TakeOverFolderSettings.nFormat), FV.GroupBy, FV.SortColumns].join("\t");
                        if (db != Addons.TakeOverFolderSettings.db) {
                            Addons.TakeOverFolderSettings.db = db;
                            Addons.TakeOverFolderSettings.bSave = true;
                        }
                    }
                }
            }
        }
    };
    AddEvent("BeforeNavigate", function(Ctrl, fs, wFlags, Prev) {
        if (Ctrl.Type <= CTRL_EB && Ctrl.Data && !Ctrl.Data.Setting) {
            if (Prev && !Prev.Unvailable) {
                var path = String(api.GetDisplayNameOf(Prev, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
                if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter)) {
                    var col = Ctrl.Columns(Addons.TakeOverFolderSettings.nFormat);
                    if (col) {
                        var db = [Ctrl.CurrentViewMode, Ctrl.IconSize, col, Ctrl.SortColumn, Ctrl.GroupBy, Ctrl.SortColumns].join("\t");
                        if (db != Addons.TakeOverFolderSettings.db) {
                            Addons.TakeOverFolderSettings.db = db;
                            Addons.TakeOverFolderSettings.bSave = true;
                        }
                    }
                }
            }
            var path = String(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
            if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter)) {
                var ar = Addons.TakeOverFolderSettings.db.split("\t");
                if (ar) {
                    fs.ViewMode = ar[0];
                    fs.ImageSize = ar[1];
                } else if (Ctrl && Ctrl.Items) {
                    fs.ViewMode = Ctrl.CurrentViewMode;
                    fs.ImageSize = Ctrl.IconSize;
                }
            }
        }
    });
    AddEvent("NavigateComplete", function(Ctrl) {
        if (Ctrl.Data && !Ctrl.Data.Setting) {
            Ctrl.Data.Setting = 'TakeOver';
            var path = String(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
            if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter)) {
                Ctrl.Data.TakeOver = path;
                var ar = Addons.TakeOverFolderSettings.db.split("\t");
                if (ar) {
                    Ctrl.CurrentViewMode(ar[0], ar[1]);
                    Ctrl.Columns = ar[2];
                    if (Ctrl.GroupBy && ar[4]) {
                        Ctrl.GroupBy = ar[4];
                    }
                    if ((ar[5] || "").split(/;/).length > 2 && Ctrl.SortColumns) {
                        Ctrl.SortColumns = ar[5];
                    } else {
                        Ctrl.SortColumn = ar[3];
                    }
                }
            }
        }
    });
    AddEvent("ChangeView", Addons.TakeOverFolderSettings.RememberFolder);
    AddEvent("ListViewCreated", function(Ctrl) {
        var ar = Addons.TakeOverFolderSettings.db.split("\t");
        Ctrl.Columns =ar[2];
    });
    AddEvent("CloseView", Addons.TakeOverFolderSettings.RememberFolder);
    AddEvent("Command", Addons.TakeOverFolderSettings.RememberFolder);
    AddEvent("InvokeCommand", function(ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
        var Ctrl = te.Ctrl(CTRL_FV);
        if (Ctrl) {
            Addons.TakeOverFolderSettings.RememberFolder(Ctrl);
        }
    });
    try {
        var ado = api.CreateObject("ads");
        ado.CharSet = "utf-8";
        ado.Open();
        ado.LoadFromFile(Addons.TakeOverFolderSettings.CONFIG);
        Addons.TakeOverFolderSettings.db = ado.ReadText();
        ado.Close();
    } catch (e) {}
    AddEvent("SaveConfig", function() {
        Addons.TakeOverFolderSettings.RememberFolder(te.Ctrl(CTRL_FV));
        if (Addons.TakeOverFolderSettings.bSave) {
            try {
                var ado = api.CreateObject("ads");
                ado.CharSet = "utf-8";
                ado.Open();
                ado.WriteText(Addons.TakeOverFolderSettings.db);
                ado.SaveToFile(Addons.TakeOverFolderSettings.CONFIG, adSaveCreateOverWrite);
                ado.Close();
                Addons.TakeOverFolderSettings.bSave = false;
            } catch (e) {}
        }
    });
}