﻿var Addon_Id = "undoclosetab";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", 0);
	item.setAttribute("MenuName", "&Undo close tab");

	item.setAttribute("KeyExec", 1);
	item.setAttribute("Key", "Shift+Ctrl+T");
	item.setAttribute("KeyOn", "All");

	item.setAttribute("MouseExec", 1);
	item.setAttribute("Mouse", "3");
	item.setAttribute("MouseOn", "Tabs_Background");
}
if (window.Addon == 1) {
	Addons.UndoCloseTab =
	{
		Save: 30,
		db: [],
		bSave: false,

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				Addons.UndoCloseTab.bLock = true;
				while (Addons.UndoCloseTab.db.length) {
					Addons.UndoCloseTab.bFail = false;
					Addons.UndoCloseTab.Open(FV, 0);
					if (!Addons.UndoCloseTab.bFail) {
						break;
					}
				}
				Addons.UndoCloseTab.bLock = false;
			}
			return S_OK;
		},

		Open: function (FV, i)
		{
			if (FV) {
				var Items = Addons.UndoCloseTab.Get(i);
				Addons.UndoCloseTab.db.splice(i, 1);
				FV.Navigate(Items, SBSP_NEWBROWSER);
				Addons.UndoCloseTab.bSave = true;
			}
		},

		Get: function (nIndex)
		{
			Addons.UndoCloseTab.db.splice(Addons.UndoCloseTab.Save, MAXINT);
			var s = Addons.UndoCloseTab.db[nIndex];
			if (typeof(s) == "string") {
				var a = s.split(/\n/);
				s = te.FolderItems();
				s.Index = a.pop();
				for (i in a) {
					s.AddItem(a[i]);
				}
				Addons.UndoCloseTab.db[nIndex] = s;
			}
			return s;
		}

	}

	var xml = OpenXml("closedtabs.xml", true, false);
	if (xml) {
		var items = xml.getElementsByTagName('Item');
		for (i = items.length; i--;) {
			Addons.UndoCloseTab.db.unshift(items[i].text);
		}
	}
	xml = null;

	AddEvent("CloseView", function (Ctrl)
	{
		if (Ctrl.FolderItem) {
			if (Addons.UndoCloseTab.bLock) {
				Addons.UndoCloseTab.bFail = true;
			}
			else {
				Addons.UndoCloseTab.db.unshift(Ctrl.History);
				Addons.UndoCloseTab.db.splice(Addons.UndoCloseTab.Save, MAXINT);
				Addons.UndoCloseTab.bSave = true;
			}
		}
		return S_OK;
	});

	AddEvent("SaveConfig", function ()
	{
		if (Addons.UndoCloseTab.bSave) {
			Addons.UndoCloseTab.bSave = false;
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");

			var db = Addons.UndoCloseTab.db;
			for (var i = 0; i < db.length; i++) {
				var item = xml.createElement("Item");
				var s = db[i];
				if (typeof(s) != "string") {
					var a = [];
					for (var j in s) {
						a.push(api.GetDisplayNameOf(s[j], SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
					}
					a.push(s.Index);
					s = a.join("\n");
				}
				item.text = s;
				root.appendChild(item);
				item = null;
			}
			xml.appendChild(root);
			SaveXmlEx("closedtabs.xml", xml, true);
			xml = null;
		}
	});

	Addons.UndoCloseTab.Save = item.getAttribute("Save") || 30;
	var s = item.getAttribute("MenuName");
	if (s && s != "") {
		Addons.UndoCloseTab.strName = s;
	}
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.UndoCloseTab.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.UndoCloseTab.nPos, MF_BYPOSITION | MF_STRING | ((Addons.UndoCloseTab.db.length) ? MF_ENABLED : MF_DISABLED), ++nPos, GetText(Addons.UndoCloseTab.strName));
			ExtraMenuCommand[nPos] = Addons.UndoCloseTab.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.UndoCloseTab.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.UndoCloseTab.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Undo close tab", Addons.UndoCloseTab.Exec);
} else {
	SetTabContents(0, "General", '<label>Save</label><br /><input type="text" name="Save" size="4" />');
}
