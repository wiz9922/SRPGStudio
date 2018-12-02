/*--------------------------------------------------------------------------------------------------
①武器(アイテム)タイプに所持個数制限を設定できます。
アイテム入手時に所持できない分はストックに送られます。

使用方法:
武器タイプにカスタムパラメータを設定してください。
{
    limit:1
}
limit: 所持できる個数

②武器(アイテム)にサイズを設定できます。
サイズ合計がアイテム所持数を超える場合は①同様に弾かれます。

使用方法:
武器またはアイテムにカスタムパラメータを設定してください。
{
    size:1
}
size:武器、アイテムのサイズ(未設定は1)

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.198

■更新履歴
2017/01/07	拠点でのショップとボーナス交換における不具合修正
			アイテム交換で空き枠に送ろうとした場合に起こる不具合修正
2017/11/30	イベントでユニットのアイテムを減らせない不具合修正
2018/12/02	サイズ設定を追加

--------------------------------------------------------------------------------------------------*/

(function() {

//アイテム情報ウィンドウにサイズを表示するならtrue、しないならfalse
var isSizeDisplayable = false;

//表示する場合の文字列
StringTable.Item_Size = 'サイズ';

//----------------------------------------------------------
//いずれかの制限に引っかかっているか
UnitItemControl.isPossessionItemLimited = function(unit, item) {
	return this.isPossessionItemTypeLimited(unit, item) || this.isPossessionItemSizeLimited(unit, item);
};

//unitがitemと同じタイプのものをlimit個以上持っているか
UnitItemControl.isPossessionItemTypeLimited = function(unit, item) {
	if(item === null) {
		return false;
	}
	if(typeof item.getWeaponType().custom.limit !== 'number') {
		return false;
	}
	
	var i, unitItemCount, count, u_item;
	unitItemCount = UnitItemControl.getPossessionItemCount(unit);
	count = 0;
	
	for(i=0; i<unitItemCount; i++){
		u_item = UnitItemControl.getItem(unit, i);
		if(u_item != null && ItemControl.compareWeaponType(u_item, item)){
			count++;
		}
	}
	
	return count >= item.getWeaponType().custom.limit;
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

//unitのサイズ合計+itemのサイズがアイテム所持数を超えているか
UnitItemControl.isPossessionItemSizeLimited = function(unit, item) {
	var size = item !== null ? ItemControl.getSize(item) : 0;
	return this.getTotalSize(unit) + size > DataConfig.getMaxUnitItemCount();
};

//unitのitem1をitem2に交換する場合のサイズチェック
UnitItemControl.isTradableItemSize = function(unit, item1, item2) {
	var size1 = item1 !== null ? ItemControl.getSize(item1) : 0;
	var size2 = item2 !== null ? ItemControl.getSize(item2) : 0;
	
	return this.getTotalSize(unit) - size1 + size2 <= DataConfig.getMaxUnitItemCount();
};

//アイテムのサイズ
ItemControl.getSize = function(item) {
	if(item === null) {
		return 0;
	}
	if(typeof item.custom.size !== 'number') {
		return 1;
	}
	return item.custom.size;
};

//ユニットのサイズ合計
UnitItemControl.getTotalSize = function(unit) {
	var i, item;
	var sizeCount = 0;
	var count = this.getPossessionItemCount(unit);
	
	for(i=0; i<count; i++){
		item = this.getItem(unit, i);
		if(item !== null) {
			sizeCount += ItemControl.getSize(item);
		}
	}
	return sizeCount;
};

//----------------------------------------------------------
//アイテム交換(盗む)
//並び替えは許可するので処理追加
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
		if(UnitItemControl.isPossessionItemTypeLimited(this._unitSrc, itemDest) || UnitItemControl.isPossessionItemTypeLimited(this._unitDest, itemSrc)) {
			//同タイプのアイテム交換は許可する
			if(!ItemControl.compareWeaponType(itemSrc, itemDest)) {
				return false;
			}
		}
		
		//互いにサイズ合計が上限を超えなければアイテム交換を許可する
		if(!UnitItemControl.isTradableItemSize(this._unitSrc, itemSrc, itemDest)
		||	!UnitItemControl.isTradableItemSize(this._unitDest, itemDest, itemSrc)) {
			return false;
		}
		
		return true;
};

var _UnitItemStealScreen__isTradable = UnitItemStealScreen._isTradable;
UnitItemStealScreen._isTradable = function() {
	var result = _UnitItemStealScreen__isTradable.call(this);
	
	var itemSrc = this._getSelectedItem(this._itemListSrc);
	var itemDest = this._getSelectedItem(this._itemListDest);
	if(UnitItemControl.isPossessionItemLimited(this._unitSrc, itemDest) || UnitItemControl.isPossessionItemLimited(this._unitDest, itemSrc) ) {
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
		else if(UnitItemControl.isPossessionItemLimited(unit, newItem)){
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
			if(UnitItemControl.isPossessionItemLimited(this._unit, this._stockItemWindow.getCurrentItem())){
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
				if(UnitItemControl.isPossessionItemLimited(unit, trophy.getItem())){
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
			
			//@アイテムを増やす場合、制限あれば強制ストック
			if(this._increaseType === IncreaseType.INCREASE) {
				if(UnitItemControl.isPossessionItemLimited(this._targetUnit, this._targetItem)){
					this._isStockChange = true;
				}
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

//アイテム情報ウィンドウ
var _ItemInfoWindow__configureWeapon = ItemInfoWindow._configureWeapon;
ItemInfoWindow._configureWeapon = function(groupArray) {
	_ItemInfoWindow__configureWeapon.call(this, groupArray);
	groupArray.appendObject(ItemSentence.Size);
};

ItemSentence.Size = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		var text;
		
		if (this.getItemSentenceCount(item) === 1) {
			text = StringTable.Item_Size;
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, ItemControl.getSize(item));
		}
	},
	
	getItemSentenceCount: function(item) {
		return isSizeDisplayable ? 1 : 0;
	}
}
);

})();