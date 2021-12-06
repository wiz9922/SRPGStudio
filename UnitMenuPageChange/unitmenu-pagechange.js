/*------------------------------------------------------------------------------
ユニットメニューが2ページ以上ある場合、下ウィンドウにページ数(マウスクリックで変更可)を表示します。
挙動は用語解説画面におけるページ数とほぼ同じです。

■作成者
wiz

■対応バージョン
SRPG Studio Version 1.248

------------------------------------------------------------------------------*/
(function() {

//数字の表示位置基準(trueなら左下、falseなら左上)
var isBottomBase = true;

//数字の表示位置(下ウィンドウの左上を基準とする)
var NUMBER_X = 10;
var NUMBER_Y = 0;

//数字の表示間隔
var NUMBER_INTERVAL = 22;

//----------------------------------------------------------
var _UnitMenuScreen__prepareScreenMemberData = UnitMenuScreen._prepareScreenMemberData;
UnitMenuScreen._prepareScreenMemberData = function(screenParam) {
	_UnitMenuScreen__prepareScreenMemberData.call(this, screenParam);
	this.xRendering = 0;
	this.yRendering = 0;
};

var _UnitMenuScreen_drawScreenCycle = UnitMenuScreen.drawScreenCycle;
UnitMenuScreen.drawScreenCycle = function() {
	_UnitMenuScreen_drawScreenCycle.call(this);
	
	var x, y;
	var index = this._activePageIndex;
	var width = this._topWindow.getWindowWidth();
	var topHeight = this._topWindow.getWindowHeight();
	var bottomHeight = this._bottomWindowArray[index].getWindowHeight();
	var interval = DefineControl.getWindowInterval();
	
	if (this._isUnitSentenceVisible()) {
		x = LayoutControl.getCenterX(-1, width + this._unitSentenceWindow.getWindowWidth());
	}
	else {
		x = LayoutControl.getCenterX(-1, width);
	}
	y = LayoutControl.getCenterY(-1, topHeight + bottomHeight + interval);
	
	if(isBottomBase) {
		y += bottomHeight - UIFormat.NUMBER_HEIGHT / 5;
	}
	
	this._drawPageNumber(x, y + topHeight + interval);
};

var _UnitMenuScreen__moveTopMode = UnitMenuScreen._moveTopMode;
UnitMenuScreen._moveTopMode = function() {
	var index = this._getPressedIndex();
	
	if (index !== -1) {
		this._pageChanger.setPageIndex(index);
		this._activePageIndex = index;
		return MoveResult.CONTINUE;
	}
	
	return _UnitMenuScreen__moveTopMode.call(this)
};

//screen-extra.jsのStoryDataChanger参照
UnitMenuScreen._drawPageNumber = function(x, y) {
	var i, colorIndex;
	var count = this._bottomWindowArray.length;
	var index = this._pageChanger.getPageIndex();
	
	if(count === 1) {
		return;
	}
	
	x += NUMBER_X;
	y += NUMBER_Y;
	
	this.xRendering = x;
	this.yRendering = y;
	
	for(i=0; i<count; i++) {
		if(i === index) {
			colorIndex = 0;
		}
		else {
			colorIndex = 4;
		}
		NumberRenderer.drawNumberColor(x, y, i + 1, colorIndex, 255);
		x += NUMBER_INTERVAL;
	}
};

UnitMenuScreen._getPressedIndex = function() {
	var i, range;
	var dx = 0;
	var count = this._bottomWindowArray.length;
	var width = UIFormat.NUMBER_WIDTH / 10;
	var height = UIFormat.NUMBER_HEIGHT / 5;
	
	if(count === 1) {
		return -1;
	}
	
	for(i=0; i<count; i++) {
		range = createRangeObject(this.xRendering + dx, this.yRendering, width, height);
		if (MouseControl.isRangePressed(range)) {
			return i;
		}
		dx += NUMBER_INTERVAL;
	}
	
	return -1;
};

//動作確認用の2ページ目追加(公式プラグインより)
/*
var alias1 = UnitMenuScreen._configureBottomWindows;
UnitMenuScreen._configureBottomWindows = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.appendWindowObject(UnitMenuBottomSecondWindow, this);
};

var UnitMenuBottomSecondWindow = defineObject(BaseMenuBottomWindow,
{
}
);
*/

})();
