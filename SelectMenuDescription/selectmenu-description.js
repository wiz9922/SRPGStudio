/*------------------------------------------------------------------------------
アイテム、武器、杖の選択時にユニットメニュー同様の説明文を表示します。
UI画像はユニットメニューの下フレームを使用します。

■作成者
wiz

■対応バージョン
SRPG Stduio Ver1.254

■特記事項
本プラグインはaskot様のご依頼により制作したもので、許諾を得て公開しています。

------------------------------------------------------------------------------*/
(function() {

TextRenderer.drawSelectMenuBottomText = function(text) {
	var interopData = root.queryScreen('UnitMenu');
	if(interopData !== null) {
		this.drawScreenBottomText(text, interopData.getBottomFrameTextUI());
	}
};

//アイテム
var _ItemSelectMenu_drawWindowManager = ItemSelectMenu.drawWindowManager;
ItemSelectMenu.drawWindowManager = function() {
	_ItemSelectMenu_drawWindowManager.call(this);
	
	var item = this.getSelectItem();
	if(item !== null) {
		TextRenderer.drawSelectMenuBottomText(item.getDescription());
	}
};

//武器
var _WeaponSelectMenu_drawWindowManager = WeaponSelectMenu.drawWindowManager;
WeaponSelectMenu.drawWindowManager = function() {
	_WeaponSelectMenu_drawWindowManager.call(this);
	
	var item = this.getSelectWeapon();
	if(item !== null) {
		TextRenderer.drawSelectMenuBottomText(item.getDescription());
	}
};

//杖
var _WandSelectMenu_drawWindowManager = WandSelectMenu.drawWindowManager;
WandSelectMenu.drawWindowManager = function() {
	_WandSelectMenu_drawWindowManager.call(this);
	
	var item = this.getSelectWand();
	if(item !== null) {
		TextRenderer.drawSelectMenuBottomText(item.getDescription());
	}
};

})();
