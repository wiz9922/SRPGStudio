/*--------------------------------------------------------------------------------------------------
特定の武器(アイテム)タイプに所持個数制限を設定します。

使用方法:
武器タイプにカスタムパラメータを設定してください。
{
    limit:1
}
limit: 所持できる個数

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.108

■更新履歴
2017/01/07	拠点でのショップとボーナス交換における不具合修正
			アイテム交換で空き枠に送ろうとした場合に起こる不具合修正

--------------------------------------------------------------------------------------------------*/

(function() {

//unitがitemと同じタイプのものをlimit個以上持っているか
ItemControl.isPossessionItemLimited = function(unit, item) {
	var i, unitItemCount, count, u_item;
	
	if(item === null || typeof item.getWeaponType().custom.limit !== 'number'){
		return false;
	}
	
	unitItemCount = UnitItemControl.getPossessionItemCount(unit);
	count = 0;
	
	for(i=0; i<unitItemCount; i++){
		u_item = UnitItemControl.getItem(unit, i);
		if(u_item != null && ItemControl.compareWeaponType(u_item, item)){
			count++;
		}
	}
	return (count >= item.getWeaponType().custom.limit);
};

//武器タイプの比較
ItemControl.compareWeaponType = function(item1, item2) {
	if(item1 === null || item2 === null) {
		return false;
	}
	if(item1.getWeaponType() !== item2.getWeaponType()) {
		return false;
	}
	return true;
};

//アイテム交換(盗む)
//並び替えは許可するのでaliasではなく処理追加
UnitItemTradeScreen._isTradable = function() {
		// 交換元と交換先が同一である場合は並び替えなので許可してよい
		if (this._isSrcSelect === this._isSrcScrollbarActive) {
			return true;
		}
		
		if (this._isTradeDisabled(this._unitSrc, this._getSelectedItem(this._itemListSrc))) {
			return false;
		}
		
		if (this._isTradeDisabled(this._unitDest, this._getSelectedItem(this._itemListDest))) {
			return false;
		}
		
		//@制限あれば交換不可
		var itemSrc = this._getSelectedItem(this._itemListSrc);
		var itemDest = this._getSelectedItem(this._itemListDest);
		if(ItemControl.isPossessionItemLimited(this._unitSrc, itemDest) || ItemControl.isPossessionItemLimited(this._unitDest, itemSrc) ) {
			//同タイプのアイテム交換は許可する
			if(!ItemControl.compareWeaponType(itemSrc, itemDest)) {
				return false;
			}
		}
		
		return true;
};

var alias2 = UnitItemStealScreen._isTradable;
UnitItemStealScreen._isTradable = function() {
	var result = alias2.call(this);
	
	var itemSrc = this._getSelectedItem(this._itemListSrc);
	var itemDest = this._getSelectedItem(this._itemListDest);
	if(ItemControl.isPossessionItemLimited(this._unitSrc, itemDest) || ItemControl.isPossessionItemLimited(this._unitDest, itemSrc) ) {
		result = false;
	}
	
	return result;
};

//ショップ購入
ItemSale._pushBuyItem = function(item, isForceStock) {
		var unit = this._parentShopScreen.getVisitor();
		var newItem = root.duplicateItem(item);
		
		if (isForceStock || unit === null) {
			StockItemControl.pushStockItem(newItem);
		}
		//@制限あれば強制ストック
		else if(ItemControl.isPossessionItemLimited(unit, newItem)){
			StockItemControl.pushStockItem(newItem);
		}
		else {
			UnitItemControl.pushItem(unit, newItem);
		}
};

//ストック取り出し
StockItemTradeScreen._moveExtract = function() {
		var item;
		var input = this._stockItemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {	
			//@制限あれば取り出し失敗
			if(ItemControl.isPossessionItemLimited(this._unit, this._stockItemWindow.getCurrentItem())){
				this._playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
			
			// アイテムを取り出す
			this._extractItem();
			
			if (!this.isExtractAllowed()) {
				this._processMode(StockItemTradeMode.OPERATION);
				this._itemInfoWindow.setInfoItem(null);
			}
			
			// 一度でも交換を行った場合はtrueになる
			this._isAction = true;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemInfoWindow.setInfoItem(null);
			this._processMode(StockItemTradeMode.OPERATION);
		}
		else if (input === ScrollbarInput.NONE) {
			item = this._stockItemWindow.getCurrentItem();
			this._itemInfoWindow.setInfoItem(item);
		}
		
		return MoveResult.CONTINUE;
};

//トロフィー入手
TrophyCollector.addTrophy = function(trophy) {
		var unit = this._unit;
		
		if (unit === null) {
			if (trophy.isImmediately()) {
				this._addStock(trophy);
			}
			else {
				this._addPool(trophy);
			}
		}
		else if (unit.getUnitType() !== UnitType.PLAYER) {
			this._addDrop(trophy);
		}
		else {
			if (trophy.isImmediately()) {
				//@制限あれば強制ストック
				if(ItemControl.isPossessionItemLimited(unit, trophy.getItem())){
					this._addStock(trophy);
				}
				else{
					this._addUnit(trophy, true);
				}
			}
			else {
				this._addPool(trophy);
			}	
		}
};

//アイテム増減イベント
ItemChangeEventCommand._checkEventCommand = function() {
		if (this._targetItem === null) {
			return false;
		}
		
		if (!this._isStockChange) {
			// ユニットのアイテムを増減させるにもかかわらず、ユニットが有効でないとき
			if (this._targetUnit === null) {
				return false;
			}
			
			// 交換禁止の場合は、ユニット増減をストック増減にする
			if (!Miscellaneous.isItemAccess(this._targetUnit)) {
				this._isStockChange = true;
			}
			
			//@制限あれば強制ストック
			if(ItemControl.isPossessionItemLimited(this._targetUnit, this._targetItem)){
				this._isStockChange = true;
			}
		}
		
		if (this._isStockChange) {
			this._itemArray = ItemChangeControl.changeStockItem(this._targetItem, this._increaseType);
		}
		else {
			// 自軍でない場合はストックに送れない
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				this._isStockSend = false;
			}
			
			this._itemArray = ItemChangeControl.changeUnitItem(this._targetUnit, this._targetItem, this._increaseType, this._isStockSend);
		}
		
		if (this.isSystemSkipMode() && this._itemArray.length === 0) {
			// アイテムの追加が問題なく終わった場合は、cycleに入らないようにfalseを返す
			return false;
		}
		
		return true;
};

})();