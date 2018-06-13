var Addon_Id = "favbar";
var Default = "ToolBar4Center";

if (window.Addon == 1) {
	Addons.FavBar =
	{
		Click: function (i, bNew)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				if (item) {
					var type = item.getAttribute("Type");
					Exec(te, item.text, "Open in new tab", te.hwnd, null);
				}
				return false;
			}
		},

		Down: function (i)
		{
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				return this.Click(i, true);
			}
		},

		Open: function (i)
		{
			if (Addons.FavBar.bClose) {
				return S_OK;
			}
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && menus.length) {
					var items = menus[0].getElementsByTagName("Item");
					var item = items[i];
					var hMenu = api.CreatePopupMenu();
					var arMenu = [];
					for (var j = items.length; --j > i;) {
						arMenu.unshift(j);
					}
					var o = document.getElementById("_favbar2" + i);
					var pt = GetPos(o, true);
					pt.y += o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
					MakeMenus(hMenu, null, arMenu, items, te, pt);
					AdjustMenuBreak(hMenu);
					AddEvent("ExitMenuLoop", function () {
						Addons.FavBar.bClose = true;
						setTimeout("Addons.FavBar.bClose = false;", 100);
					});
					window.g_menu_click = 2;
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					api.DestroyMenu(hMenu);
					if (nVerb > 0) {
						item = items[nVerb - 1];
						var strType = item.getAttribute("Type");
						if (strType == "Open" && (window.g_menu_button == 3 || GetAddonOption("favbar", "NewTab"))) {
							strType = "Open in New Tab";
						}
						if (window.g_menu_button == 2 && api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background")) {
							PopupContextMenu(item.text);
							return S_OK;
						}
						Exec(te, item.text, strType, te.hwnd, null);
					}
					return S_OK;
				}
			}
		},

		Popup: function (i)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				if (i >= 0) {
					var hMenu = api.CreatePopupMenu();
					var ContextMenu = null;
					if (i < items.length) {
						var path = this.GetPath(items, i);
						if (path != "") {
							ContextMenu = api.ContextMenu(path);
						}
					}
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Add"));
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb >= 0x1001) {
						var s = ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
						if (api.StrCmpI(s, "delete")) {
							ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
						} else {
							this.ShowOptions();
						}
					}
					if (nVerb == 1) {
						this.ShowOptions(i);
					}
					if (nVerb == 2) {
						this.ShowOptions();
					}
					api.DestroyMenu(hMenu);
				}
			}
			return false;
		},

		Arrange: function ()
		{
			var s = [];
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				menus = 0;
				var image = te.GdiplusBitmap;
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var strType = item.getAttribute("Type").toLowerCase();
					var strFlag = strType == "menus" ? item.text.toLowerCase() : "";
					if (strFlag == "close" && menus) {
						menus--;
						continue;
					}
					var menus1 = menus;
					if (strFlag == "open") {
						if (menus++) {
							continue;
						}
					} else if (menus) {
						continue;
					}
					var img = '';
					var icon = item.getAttribute("Icon");
					var height = String(GetAddonOption("favbar", "Size")).replace(/\D/, "") || window.IconSize || 24;
					var sh = (height ? ' style="height:' + height + 'px"' : '');
					if (!icon) {
						icon='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABeUlEQVRIS7WVQU7CUBCG/3mKK8UuTRSCOxMgwRvQ9ADiCZATiCcQTyCcQLwBF4B6A0mExJ2IkrhEYaXhjXlPS4ptEUrp8uXN139m/r8lrOmhNXHhATeT6TKBigDlAAyZ0RBS1sxBt61E2PvpnBTinAgFAAbAbQJXzX731i1yCraNlMHxbfsX6GmEGSV1SIQb3y6Z72g0PjWHvaG+51xqJbINEE5WGQ1LrlmvnfIUrNrjDXG/CtSppc+vQ/PtsacVN5OZCoEuowAz5IXV71Y1uJXI1kEoRgPmK6vfqawX/GMxcR2JYkbJenmoa8X23lGKt2JPUYBnlhfVnD1206qNlCHjO8omu2GUM/hZfIxznoBo+EEmz4LsMGCayGMn9jPJc2DNRPYsMLYBb1RxVwvz/Va4D5eB+0F9FS+jPAg6F6yjHjAWBt7BKP9t/99RuC+ohUpBDcctCiomMu9elN/oF/qD6ADFNvVyaDQuOJaa556FwKHsF6ZokZpv/T6gF764jyAAAAAASUVORK5CYII='
					} 
						img = '<img class="tool_button" src="' + EncodeSC(api.PathUnquoteSpaces(ExtractMacro(te, icon))) + '"' + sh + '>';
					s.push('&nbsp;<span class=" favorite_item" id="_favbar2', i, '" ', strType != "menus" || api.StrCmpI(item.text, "Open") ? 'onclick="Addons.FavBar.Click(' + i + ')" onmousedown="Addons.FavBar.Down('
 : 'onmousedown="Addons.FavBar.Open(');
					// TODO 目前去掉了文本内容
					var text= EncodeSC(ExtractMacro(te, item.getAttribute("Name").replace(/\\t.*$/g, "").replace(/&(.)/g, "$1")));
					s.push(i, ')" oncontextmenu="return Addons.FavBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(item.text), '">', img,"&nbsp;",'</span> ');
				}
				s.push('&nbsp;</label>');

				var o = document.getElementById('_favbar2');
				o.parentNode.setAttribute("class","favorite_bar");
				// alert(o.parentNode.parentNode.parentNode.innerHTML);
				o.innerHTML = s.join("");
				ApplyLang(o);
				Resize();
			}
		},

		ShowOptions: function (i)
		{
			ShowOptions("Tab=Menus&Menus=Favorites" + (isFinite(i) ? "," + i : ""));
		},

		GetPath: function (items, i)
		{
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
		},

		FromPt: function (n, pt)
		{
			while (--n >= 0) {
				if (HitTest(document.getElementById("_favbar2" + n), pt)) {
					return n;
				}
			}
			return -1;
		},

	};
	Addons.FavBar.Parent = document.getElementById(SetAddon(Addon_Id, Default, '<span id="_favbar2"></span>'));
	Addons.FavBar.Arrange();
	AddEvent("FavoriteChanged", Addons.FavBar.Arrange);

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data["xmlMenus"].getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavBar.FromPt(items.length, pt);
				if (i >= 0) {
					hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					return S_OK;
				}
			}
			if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
		MouseOut("_favbar");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavBar.FromPt(items.length + 1, pt);
				if (i >= 0) {
					return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
				}
			}
			if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
				setTimeout(function ()
				{
					AddFavorite(dataObj.Item(0));
				}, 99);
				return S_OK;
			}
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		MouseOut();
		return S_OK;
	});
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="NewTab2" value="2" /><label for="NewTab">Open in New Tab</label><br /><label>Icon</label></label><br /><input type="text" name="Size" size="4" />px');
}
