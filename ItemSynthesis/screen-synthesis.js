/*----------------------------------------------------------
アイテム合成(ショップ)スクリプト
※現状、拠点のショップにのみ設定できます。場所イベントや戦闘準備の店では設定できません。

使用方法:
①拠点のショップのカスタムパラメータを設定してください。
{
	shopType:1,
	priceRate:1
}

type:1で合成ショップ(0または省略時は通常ショップ)
priceRate:購入価格係数(省略時は1倍)。無料にしたい場合は0にしてください

②合成対象のアイテムのカスタムパラメータを設定してください。
{
	material:[{id:0, value:1}, {id:100001, value:2}]
}

material:素材の種類の数だけidとvalueのセットを設定してください
  id:武器orアイテムID, value:必要個数
武器IDはそのまま、アイテムIDの場合は+100000してください。

設定例:
ID:0の武器を1個、ID:1のアイテムを2個
material:[{id:0, value:1}, {id:100001, value:2}]

ID:3の武器を1個、ID:4の武器を2個、ID:5のアイテムを1個
material:[{id:3, value:1}, {id:4, value:2}, {id:100005, value:1}]

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.130

----------------------------------------------------------*/

(function() {

StringTable.ShopLayout_SelectSynthesis = '合成';
StringTable.Material = '必要素材';
StringTable.Synthesis_switch = '表示切替:A';

//色々---------------------------------------------------------------------------------------

//とりあえずAキーを切替用にする
//他のキー等はヘルプの「game.ini仕様」を参照
InputControl.isSwitchAction = function() {
	return root.isInputAction(InputType.BTN5);
};

//表示切替の文字描画
TextRenderer.drawSwitchText = function(x, y) {
	var color = ColorValue.LIGHT;
	var font = root.queryTextUI('default_window').getFont();;
	this.drawKeywordText(x, y - 20, StringTable.Synthesis_switch, -1, color, font);
};

//カスタムパラメータ取得
ItemControl.getMaterial = function(item) {
	if(typeof item.custom.material !== 'undefined') {
		return item.custom.material;
	}
	return [];
};

// ItemIdValue.BASE = 100000
ItemControl.getItemDataFromId = function(id) {
	var item;
	if(id < ItemIdValue.BASE) {
		item = root.getBaseData().getWeaponList().getDataFromId(id);
	}
	else {
		item = root.getBaseData().getItemList().getDataFromId(id - ItemIdValue.BASE);
	}
	
	//root.duplicateItem(item);
	return item;
};

//id番のアイテムがストックにいくつ存在するか(回数は考慮しない)
StockItemControl.getItemCountFromId = function(id) {
	var i, item;
	var count = StockItemControl.getStockItemCount();
	var targetItem = ItemControl.getItemDataFromId(id);
	var value = 0;
	var isMatch = false;
	
	for(i=0; i<count; i++) {
		item = this.getStockItem(i);
		if(ItemControl.compareItem(item, targetItem)) {
			value++;
			isMatch = true;
		}
		else {
			//常にソートされて同じIDのアイテムが固まっている想定
			//なので、途中で見つからなくなったら終了
			if(isMatch) {
				return value;
			}
		}
	}
	
	return value;
};

//ストックからid番のアイテムをvalue個削除(ただしvalue個ある前提の処理)
StockItemControl.cutStockItemMulti = function(id, value) {
	var i, item;
	var count = StockItemControl.getStockItemCount();
	var itemArray = this.getStockItemArray();
	var targetItem = ItemControl.getItemDataFromId(id);
	
	for(i=0; i<count; i++) {
		item = this.getStockItem(i);
		if(ItemControl.compareItem(item, targetItem)) {
			itemArray.splice(i, value);
			break;
		}
	}
	this.sortItem();
};

//ショップリスト----------------------------------------------------------------------------
var alias1 = ShopShelfWindow.setShopData;
ShopShelfWindow.setShopData = function(shopData) {
	alias1.call(this, shopData);
	if(typeof shopData.custom.priceRate === 'number') {
		this._priceRate = shopData.custom.priceRate;
	}
	else {
		this._priceRate = 1;
	}
};

ShopShelfWindow.getPriceRate = function() {
	return this._priceRate;
};

var alias2 = ShopShelfScrollbar._getPrice;
ShopShelfScrollbar._getPrice = function(item) {
	var price = alias2.call(this, item);
	price *= this.getParentInstance().getPriceRate();
	return price;
};

//ショップ呼び出し--------------------------------------------------------------------------
var ShopType = {
	NORMAL: 0,
	SYNTHESIS: 1
};

ScreenBuilder.buildShopLayout = function() {
	return {
		unit: null,
		shopLayout: null,
		itemArray: null,
		inventoryArray: null,
		//以下を追加
		shopType: 0,
		priceRate: 1
	};
};

ShopScreenLauncher.openScreenLauncher = function() {
		var screenParam = this._createScreenParam();
		
		if(this.isSysnthesis()) {
			screenParam.shopType = this._shopData.custom.shopType;
			if(typeof this._shopData.custom.priceRate === 'number') {
				screenParam.priceRate = this._shopData.custom.priceRate;
			}
			this._screen = createObject(SynthesisScreen);
		}
		else {
			this._screen = createObject(ShopLayoutScreen);
		}
		
		this._screen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._screen, screenParam);
};

ShopScreenLauncher.isSysnthesis = function() {
	var shopData = this._shopData;
	if(typeof shopData.custom.shopType === 'number') {
		if(shopData.custom.shopType === ShopType.SYNTHESIS) {
			return true;
		}
	}
	return false;
};

//合成ショップ------------------------------------------------------------------------------
/*
必要素材を表示するMaterialWindowを追加
商品の購入条件に素材個数を追加
購入時に素材減少処理
素材情報はアイテム選択・購入・売却のタイミングで更新する
*/
var SynthesisScreen = defineObject(ShopLayoutScreen, {
	_shopType: 1,
	_priceRate: 1,
	_materialWindow: null,
	_materialRequireArray: null,
	_materialStockArray: null,
	_isMaterial: false,
	
	drawScreenCycle: function() {
		var width = this._getTopWindowWidth();
		var height = this._getTopWindowHeight();
		var xBase = LayoutControl.getCenterX(-1, width);
		var yBase = LayoutControl.getCenterY(-1, height);
		
		// 上部
		this._keeperWindow.drawWindow(xBase, yBase);
		this._activeSelectWindow.drawWindow(xBase + this._keeperWindow.getWindowWidth(), yBase);
		this._currencyWindow.drawWindow(xBase + this._keeperWindow.getWindowWidth(), yBase + this._activeSelectWindow.getWindowHeight());
		
		if (this.getCycleMode() === ShopLayoutMode.VISITORSELECT) {
			this._visitorSelectWindow.drawWindow(xBase + this._keeperWindow.getWindowWidth(), yBase + this._activeSelectWindow.getWindowHeight());
		}
		
		// 下部
		yBase += this._keeperWindow.getWindowHeight();
		width = this._activeItemWindow.getWindowWidth();
		
		var mode = this.getCycleMode();
		if(this._isMaterial && this.getCycleMode() === ShopLayoutMode.BUY) {
			this._materialWindow.drawWindow(xBase + width, yBase);
		}
		else {
			this._itemInfoWindow.drawWindow(xBase + width, yBase);
		}
		
		//表示切替
		if(this.getCycleMode() === ShopLayoutMode.BUY) {
			TextRenderer.drawSwitchText(xBase + width + DefineControl.getWindowXPadding(), yBase + + DefineControl.getWindowYPadding());
		}
		
		this._activeItemWindow.drawWindow(xBase, yBase);
	},
	
	notifyInfoItem: function(item) {
		this._itemInfoWindow.setInfoItem(item);
		
		this.updateMaterial();
		this._materialWindow.setInfoItem(item);
	},
	
	_prepareScreenMemberData: function(screenParam) {
		// unitがnullの場合、売買ではストックアイテムが対象になる。
		// たとえば、購入時にはストックアイテムにアイテムが追加される。
		// 一方、unitがnullでない場合は、何らかのユニットが店を訪問したということで、ユニットアイテムが対象になる。
		// つまり、ユニットのアイテム欄にアイテムが追加される。
		this._targetUnit = screenParam.unit;
		
		this._shopLayout = screenParam.shopLayout;
		
		// 一度でも購入か売却を行うとtrue
		this._isSale = false;
		
		this._nextmode = 0;
		this._itemSale = createObject(ItemSale2);
		this._itemSale.setParentShopScreen(this);
		
		this._shopItemArray = screenParam.itemArray;
		this._inventoryArray = screenParam.inventoryArray;
		this._buyItemWindow = createWindowObject(BuyItemWindow2, this);
		this._sellItemWindow = createWindowObject(SellItemWindow, this);
		this._buySellWindow = createWindowObject(BuySellWindow2, this);
		this._buyQuestionWindow = createWindowObject(BuyQuestionWindow2, this);
		this._sellQuestionWindow = createWindowObject(SellQuestionWindow, this);
		this._visitorSelectWindow = createWindowObject(VisitorSelectWindow, this);
		this._currencyWindow = createWindowObject(ShopCurrencyWindow, this);
		this._keeperWindow = createWindowObject(ShopMessageWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		
		this._activeSelectWindow = this._buySellWindow;
		this._activeItemWindow = this._buyItemWindow;
		
		this._createShopMessageTable(this._shopLayout);
		
		this._shopType = screenParam.shopType;
		this._priceRate = screenParam.priceRate;
		this._materialWindow = createWindowObject(MaterialWindow, this);
	},
	
	_moveBuy: function() {
		//表示切替判定
		if(InputControl.isSwitchAction()) {
			if(this._isMaterial) {
				this._isMaterial = false;
			}
			else {
				this._isMaterial = true;
			}
		}
		
		var input = this._buyItemWindow.moveWindow();
			
		if (input === ScrollbarInput.SELECT) {
			this._startMessage(this._shopMessageTable.SelectQuestion, ShopLayoutMode.BUYQUESTION);
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._startMessage(this._shopMessageTable.OtherMessage, ShopLayoutMode.BUYSELLSELECT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_startSale: function(isBuy, isForceStock) {
		var cutIndex;
		var price = this._itemSale.startSale(isBuy, isForceStock, this._activeItemWindow.getShopSelectItem());
		
		if (isBuy) {
			cutIndex = this._getCutIndex(this._activeItemWindow.getShopSelectItem());
			if (cutIndex !== -1) {
				this._shopItemArray.splice(cutIndex, 1);
				this._inventoryArray.splice(cutIndex, 1);
				this._buyItemWindow.updateItemArea();
			}
			
			this.decreaseMaterial();
		}
		
		// ゴールドを表示するウインドウの内容を変更する
		this._currencyWindow.startPriceCount(price);
		
		this._isSale = true;
		
		// 買ったときはアイテムを増やし、売ったときはアイテムを減らすから常に呼び出す
		this._sellItemWindow.updateItemArea();
		this.updateMaterial();
		
		this._playSaleSound();
	},
	
	getShopType: function() {
		return this._shopType;
	},
	
	getPriceRate: function() {
		return this._priceRate;
	},
	
	//それぞれid,valueを持つ配列
	getMaterialRequireArray: function() {
		return this._materialRequireArray;
	},
	
	getMaterialStockArray: function() {
		return this._materialStockArray;
	},
	
	updateMaterial: function() {
		var i, count;
		var id, value;
		
		var item = this._buyItemWindow.getShopSelectItem();
		
		this._materialRequireArray = ItemControl.getMaterial(item);
		this._materialStockArray = [];
		
		count = this._materialRequireArray.length;
		for(i=0; i<count; i++) {
			id = this._materialRequireArray[i].id;
			value = StockItemControl.getItemCountFromId(id);
			this._materialStockArray[i] = {id:id, value:value}
		}
	},
	
	decreaseMaterial: function() {
		var i, count;
		var id, value;
		
		count = this._materialRequireArray.length;
		for(i=0; i<count; i++) {
			id = this._materialRequireArray[i].id;
			value = this._materialRequireArray[i].value;
			StockItemControl.cutStockItemMulti(id, value);
		}
	}
});

//長いので処理追加分だけ
var alias11 = SynthesisScreen._processMode;
SynthesisScreen._processMode = function(mode) {
	alias11.call(this, mode);
	if (mode === ShopLayoutMode.BUYSELLSELECT) {
		this._materialWindow.setInfoItem(null);
	}
};

//既存オブジェクトの処理追加・変更
var ItemSale2 = defineObject(ItemSale, {
	//価格変更
	startSale: function(isBuy, isForceStock, item) {
		var price = this._getPrice(isBuy, item);
		
		if (isBuy) {
			price *= this._parentShopScreen.getPriceRate();
			this._pushBuyItem(item, isForceStock);
		}
		else {
			this._cutSellItem(item);
		}
		
		this._setPrice(price);
		
		return price;
	}
});

var BuySellWindow2 = defineObject(BuySellWindow, {
	//名称変更
	getSelectTextArray: function() {
		return [StringTable.ShopLayout_SelectSynthesis, StringTable.ShopLayout_SelectSell];
	}
});

var BuyQuestionWindow2 = defineObject(BuyQuestionWindow, {
	//条件追加
	moveWindowContent: function() {
		var input = this._scrollbar.moveInput();
		var result = BuyQuestionResult.NONE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._scrollbar.getIndex() === 0) {
				if (!this._isPriceOk() || !this._isMaterialOK()) {
					// 購入しようとしたが、ゴールドが足りなかった or 素材が足りなかった
					result = BuyQuestionResult.NOGOLD;
				}
				else if (!this._isSpaceOk()) {
					if (!this._isForceStockOk()) {
						// 購入しようとしたが、アイテム欄が一杯だった
						result = BuyQuestionResult.ITEMFULL;
					}
					else {
						// アイテム欄が一杯だが、ストックに送ることで購入する
						result = BuyQuestionResult.FORCESTOCK;
					}
				}
				else {
					result = BuyQuestionResult.BUY;
				}
			}
			else {
				result = BuyQuestionResult.CANCEL;
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = BuyQuestionResult.CANCEL;
		}
		
		return result;
	},
	
	_isMaterialOK: function() {
		var i, count;
		var materialArray1 = this.getParentInstance().getMaterialRequireArray();
		var materialArray2 = this.getParentInstance().getMaterialStockArray();
		
		count = materialArray1.length;
		for(i=0; i<count; i++) {
			if(materialArray1[i].value > materialArray2[i].value) {
				return false;
			}
		}
		
		return true;
	}
});

var BuyItemWindow2 = defineObject(BuyItemWindow, {
	getScrollbarObject: function() {
		return BuyScrollbar2;
	}
});

var BuyScrollbar2 = defineObject(BuyScrollbar, {
	//価格変更
	_getPrice: function(item) {
		var price = this.getParentInstance().getParentInstance().getGoldFromItem(item);
		price = Math.floor(price * this.getParentInstance().getDiscountFactor());
		price *= this.getParentInstance().getParentInstance().getPriceRate();
		
		return price;
	}
});

//素材表示用ウィンドウ
var MaterialWindow = defineObject(BaseWindow, {
	_item: null,
	_windowHeight: 0,
	
	_isWindowEnabled: false,
	
	drawWindowContent: function(x, y) {
		var i;
		var materialArray1 = this.getParentInstance().getMaterialRequireArray();
		var materialArray2 = this.getParentInstance().getMaterialStockArray();
		var count = materialArray1.length;
		var textui = this.getTextUI();
		var color0 = ColorValue.KEYWORD;
		var color = textui.getColor();
		var font = textui.getFont();
		
		var alpha, materialItem;
		var num1, num2;
		
		var x2 = x + GraphicsFormat.ICON_WIDTH + 160;
		var dx = [0, 15, 30];
		
		if (this._item === null) {
			return;
		}
		
		TextRenderer.drawKeywordText(x, y, StringTable.Material, -1, color0, font);
		y += this.getSpaceY();
		for (i = 0; i < count; i++) {
			if(materialArray1[i].value > materialArray2[i].value) {
				alpha = 120;
			}
			else {
				alpha = 255;
			}
			
			materialItem = ItemControl.getItemDataFromId(materialArray1[i].id);
			ItemRenderer.drawItemAlpha(x, y, materialItem, color, font, false, alpha);
			
			// 必要数/所持数(表示される最大値は99とする)
			num1 = materialArray1[i].value;
			if(num1 > 99) {
				num1 = 99;
			}
			num2 = materialArray2[i].value;
			if(num2 > 99) {
				num2 = 99;
			}
			
			NumberRenderer.drawNumber(x2 + dx[0], y, num1);
			TextRenderer.drawKeywordText(x2 + dx[1], y, '/', -1, color, font);
			NumberRenderer.drawNumber(x2 + dx[2], y, num2);
			
			y += ItemInfoRenderer.getSpaceY();
		}
	},
	
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	},
	
	getWindowHeight: function() {
		return this._windowHeight;
	},
	
	setInfoItem: function(item) {
		this._item = item;
		this._windowHeight = 0;
		
		if (this._item === null) {
			// ウインドウの枠などが描画されないようにする
			this.enableWindow(false);
			return;
		}
		var count = this.getParentInstance().getMaterialRequireArray().length;
		this._windowHeight = (count + 1) * ItemRenderer.getItemHeight() + DefineControl.getWindowYPadding();
		
		this.enableWindow(true);
	},
	
	getInfoItem: function() {
		return this._item;
	},
	
	getSpaceY: function() {
		return 20;
	},
	
	getTextUI: function() {
		return root.queryTextUI('default_window');
	}
});

})();