/*--------------------------------------------------------------------------------------------------
ストック直接交換プラグイン

ストックの「全預け」コマンドを「交換」コマンドに変更し、
手持ちアイテムとストックのアイテムを直接交換します。

使用方法:
Pluginフォルダにこのファイルを置いてください

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.144
--------------------------------------------------------------------------------------------------*/

(function() {

StringTable.StockItem_Trade = '交換';

StockItemTradeMode.TRADESTORE = 5;
StockItemTradeMode.TRADEEXTRACT = 6;

//TRADE系の処理を追加
var alias1 = StockItemTradeScreen.moveScreenCycle;
StockItemTradeScreen.moveScreenCycle = function() {
	var mode = this.getCycleMode();
	var result = alias1.call(this);
	
	if(mode === StockItemTradeMode.TRADESTORE) {
		result = this._moveTradeStore();
	}
	else if(mode === StockItemTradeMode.TRADEEXTRACT) {
		result = this._moveTradeExtract();
	}
	
	return result;
};

//isStoreAllowedとisExtractAllowedの複合
StockItemTradeScreen.isTradeAllowed = function() {
		// 所持アイテムがなくなったため、これ以上預けれない
		if (UnitItemControl.getPossessionItemCount(this._unit) === 0) {
			return false;
		}
		
		// ストックアイテムがなくなったため、これ以上引き出せない
		if (StockItemControl.getStockItemCount() === 0) {
			return false;
		}
		
		return true;
};

//SELECTの動作を変更
StockItemTradeScreen._moveOperation = function() {
		var index;
		var input = this._itemOperationWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemOperationWindow.getOperationIndex();
			if (index === 0 && this.isExtractAllowed()) {
				this._processMode(StockItemTradeMode.EXTRACT);
			}
			else if (index === 1 && this.isStoreAllowed()) {
				this._processMode(StockItemTradeMode.STORE);
			}
			else if (index === 2 && this.isTradeAllowed()) {
				this._processMode(StockItemTradeMode.TRADESTORE);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._isAction) {
				// 何らかの交換を行った場合は、交換済みを示す値を返す
				this._resultCode = StockItemTradeResult.TRADEEND;
			}
			else {
				this._resultCode = StockItemTradeResult.TRADENO;
			}
			
			// アイテムの更新が終わった後の処理を行う
			ItemControl.updatePossessionItem(this._unit);
			
			result = MoveResult.END;
		}
		else if (this.getCycleMode() === StockItemTradeMode.OPERATION) {
			if (this._unitSimpleWindow === null || this._unitList === null) {
				return result;
			}
			
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._unit = this._unitList.getData(index);
				this._unitItemWindow.setUnitItemFormation(this._unit);
				this._unitSimpleWindow.setFaceUnitData(this._unit);
			}
		}
		
		return result;
};

//_moveStoreがベース
StockItemTradeScreen._moveTradeStore = function() {
		var item;
		var input = this._unitItemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (Miscellaneous.isTradeDisabled(this._unit, this._unitItemWindow.getCurrentItem())) {
				this._playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
			
			//ストック側に移行
			this._processMode(StockItemTradeMode.TRADEEXTRACT);
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemInfoWindow.setInfoItem(null);
			this._processMode(StockItemTradeMode.OPERATION);
		}
		else if (input === ScrollbarInput.NONE) {
			if (this._unitItemWindow.isIndexChanged()) {
				item = this._unitItemWindow.getCurrentItem();
				this._itemInfoWindow.setInfoItem(item);
			}
		}
		
		return MoveResult.CONTINUE;
};

//_moveExtractがベース
StockItemTradeScreen._moveTradeExtract = function() {
		var item, unitItem;
		var input = this._stockItemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			
			//所持個数制限プラグインの存在チェック
			if(ItemControl.isPossessionItemLimited != null) {
				//制限あれば取り出し失敗
				item = this._unitItemWindow.getCurrentItem();
				unitItem = this._stockItemWindow.getCurrentItem();
				if(ItemControl.isPossessionItemLimited(this._unit, unitItem)){
					//同タイプのアイテム交換は許可する
					if(!ItemControl.compareWeaponType(item, unitItem)) {
						this._playOperationBlockSound();
						return MoveResult.CONTINUE;;
					}
				}
			}
			
			// アイテム交換
			this._tradeItem();
			
			//どちらも0になることはないはずだけど一応
			if (!this.isTradeAllowed()) {
				this._processMode(StockItemTradeMode.OPERATION);
				this._itemInfoWindow.setInfoItem(null);
			}
			
			// 一度でも交換を行った場合はtrueになる
			this._isAction = true;
			
			//実行後はユニット側に移行
			this._processMode(StockItemTradeMode.TRADESTORE);
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._itemInfoWindow.setInfoItem(null);
			//キャンセルはユニット側に移行
			this._processMode(StockItemTradeMode.TRADESTORE);
		}
		else if (input === ScrollbarInput.NONE) {
			if (this._stockItemWindow.isIndexChanged()) {
				item = this._stockItemWindow.getCurrentItem();
				this._itemInfoWindow.setInfoItem(item);
			}
		}
		
		return MoveResult.CONTINUE;
};

//_storeItemと_extractItemの複合+ユニットのアイテム変更処理
StockItemTradeScreen._tradeItem = function() {
	var index1 = this._unitItemWindow.getItemIndex();
	var item1 = UnitItemControl.getItem(this._unit, index1);
		
	if (item1 === null) {
		return;
	}
	
	var index2 = this._stockItemWindow.getItemIndex();
	var item2 = StockItemControl.getStockItem(index2);
	
	if (item2 === null) {
		return;
	}
	
	this._cutStockItem(index2);
	UnitItemControl.setItem(this._unit, index1, item2);
	this._pushStockItem(item1);
	
	this._updateListWindow();
};

//TRADE系の処理を追加
var alias2 = StockItemTradeScreen._processMode;
StockItemTradeScreen._processMode = function(mode) {
	if(mode === StockItemTradeMode.TRADESTORE) {
		this._unitItemWindow.enableSelectCursor(true);
		this._itemOperationWindow.enableSelectCursor(false);
		this._itemInfoWindow.setInfoItem(this._unitItemWindow.getCurrentItem());
		
		//TRADEEXTRACTから戻ってきた場合用
		this._stockItemWindow.setActive(false);
		this._stockItemWindow.setForceSelect(-1);
	}
	else if(mode === StockItemTradeMode.TRADEEXTRACT) {
		this._stockItemWindow.enableSelectCursor(true);
		this._unitItemWindow.enableSelectCursor(false);
		this._itemInfoWindow.setInfoItem(this._stockItemWindow.getCurrentItem());
	}
	alias2.call(this, mode);
};

//コマンド名称変更
ItemOperationWindow.setItemOperationData = function() {
		var arr = [StringTable.StockItem_Extract, StringTable.StockItem_Store, StringTable.StockItem_Trade];
		
		this._scrollbar = createScrollbarObject(ItemOperationScrollbar, this);
		this._scrollbar.setScrollFormation(arr.length, 1);
		this._scrollbar.setObjectArray(arr);
};

//------------------------------------------------------------------------------
//カテゴリ表示版
CategoryStockItemTradeScreen._moveTradeExtract = function() {
	var index = this._stockCategory.checkStockCategory(this._stockItemWindow);
	
	if (index !== -1) {
		return MoveResult.CONTINUE;
	}
	
	return StockItemTradeScreen._moveTradeExtract.call(this);
};

CategoryStockItemTradeScreen._tradeItem = function() {
	var index1 = this._unitItemWindow.getItemIndex();
	var item1 = UnitItemControl.getItem(this._unit, index1);
		
	if (item1 === null) {
		return;
	}
	
	var item2 = this._stockItemWindow.getCurrentItem();
	var index2 = StockItemControl.getIndexFromItem(item2);
	
	if (item2 === null) {
		return;
	}
	
	this._cutStockItem(index2);
	UnitItemControl.setItem(this._unit, index1, item2);
	this._pushStockItem(item1);
	
	this._updateListWindow();
};

})();
