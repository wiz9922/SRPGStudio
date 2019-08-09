/*----------------------------------------------------------
スイッチ調整、変数調整の画面を変更します。
・ウィンドウをテーブル一覧とスイッチ(変数)一覧の2つに分割
  ←→は今までテーブルの切り替えでしたが、スイッチ(変数)一覧のページ送りになります
・スイッチ(変数)一覧にID表示を追加。並びはインデックス順(エディタ上の表示順)
・変数操作(改変元：名前未定氏)の処理を入れているので一緒に使わないでください
  マイナス値に対応しました
  入力した値が最小値より小さければ最小値が、最大値より大きければ最大値が設定されます
  マウスホイールでも数値の変更ができます

使用方法：
Pluginフォルダに入れるだけ

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.205

----------------------------------------------------------*/
(function() {

//デフォルトで最初に表示するテーブル番号
//スイッチ:ローカル→0、グローバル→1
var FirstSwitchTableIndex = 0;

//変数：グループ1～5→0～4、ID変数→5
var FirstVariableTableIndex = 0;


if(!Number.clamp) {
	Number.prototype.clamp = function(min, max) {
		return Math.min(Math.max(this, min), max);
	};
}

/*----------------------------------------------------------
マップコマンド終了時にウェイト(コピペ)
-----------------------------------------------------------*/
var ListCommandManagerMode = {
	TITLE    : 0,
	OPEN     : 1,
	FINISHED : 2
};

// マップコマンドのオープン処理
var alias00 = MapCommand.openListCommandManager;
MapCommand.openListCommandManager= function() {
		alias00.call(this);

		// 処理終了時のウェイト用
		this._cycleCounter = createObject(CycleCounter);
		this._cycleCounter.setCounterInfo(6);
		this._cycleCounter.disableGameAcceleration();
};


// マップコマンドのキー処理
var alias01 = MapCommand.moveListCommandManager;
MapCommand.moveListCommandManager= function() {
		var result = alias01.call(this);
		var mode = this.getCycleMode();

		if (mode === ListCommandManagerMode.FINISHED) {
			// キャンセル押下後に若干ウェイトを入れる（入れないと、以降のイベントコマンドでキャンセル処理がかかってしまう）
			if (this._cycleCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
				result = MoveResult.END;
			}
		}
		return result;
};


// マップコマンドのキー処理（下位関数）
MapCommand._moveTitle= function() {
		var object;
		var result = MoveResult.CONTINUE;
		
		if (InputControl.isSelectAction()) {
			object = this._commandScrollbar.getObject();
			object.openCommand();
			
			this._playCommandSelectSound();
			this.changeCycleMode(ListCommandManagerMode.OPEN);
		}
		else if (InputControl.isCancelAction()) {
			this._playCommandCancelSound();
			this._checkTracingScroll();
			// ここで即座にMoveResult.ENDを返すと、マップコマンドを閉じた瞬間に発生したイベントでｘキーによるキャンセルがかかるので処理を修正
			this.changeCycleMode(ListCommandManagerMode.FINISHED);
//			result = MoveResult.END;
		}
		else {
			this._commandScrollbar.moveScrollbarCursor();
		}
		return result;
};

/*----------------------------------------------------------
共通部品
------------------------------------------------------------*/
var TableScreenMode = {
	TOP: 0,
	LIST: 1,
	EDIT: 2
};

var TableWindow = defineObject(BaseWindow, {
	_scrollbar: null,
	
	setWindowData: function(objectArray) {
		this._scrollbar = createScrollbarObject(TableScrollbar, this);
		
		this._scrollbar.setScrollFormation(1, objectArray.length);
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
});

var TableScrollbar = defineObject(BaseScrollbar, {
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, object, -1, color, font);
	},
	
	getObjectWidth: function() {
		return 100;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	}
});

/*----------------------------------------------------------
スイッチ調整
------------------------------------------------------------*/
SwitchScreenLauncher._getScreenObject = function() {
	return SwitchScreen2;
};

//Screen--------------------------------
var SwitchScreen2 = defineObject(SwitchScreen, {
	_tableWindow: null,
	_listWindow: null,
	_objectArray: null,
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if(mode === TableScreenMode.TOP) {
			result = this._moveTop();
		}
		else if(mode === TableScreenMode.LIST) {
			result = this._moveList();
		}
		
		return result;
	},
	
	//テーブル選択
	_moveTop: function() {
		var result = this._tableWindow.moveWindow();
		if(result === ScrollbarInput.SELECT) {
			this._tableWindow.enableSelectCursor(false);
			this._listWindow.enableSelectCursor(true);
			this._listWindow.setIndex(0);
			this.changeCycleMode(TableScreenMode.LIST);
		}
		else if(result === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if(this._tableWindow.isIndexChanged()) {
				this._updatePage();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	//リスト選択、キャンセルで変更データ保存
	_moveList: function() {
		var result = this._listWindow.moveWindow();
		if(result === ScrollbarInput.SELECT) {
			this._changeData();
		}
		else if(result === ScrollbarInput.CANCEL) {
			this._saveObjectArray(this._getTable(this._tableWindow.getIndex()));
			this._tableWindow.enableSelectCursor(true);
			this._listWindow.setActive(false);
			this._listWindow.setForceSelect(-1);
			this.changeCycleMode(TableScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	//テーブルウィンドウ表示
	drawScreenCycle: function() {
		var width = this._tableWindow.getWindowWidth() + this._listWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._listWindow.getWindowHeight());
		
		this._tableWindow.drawWindow(x, y);
		this._listWindow.drawWindow(x + this._tableWindow.getWindowWidth(), y);
	},
	
	//テーブル選択時は説明文非表示
	drawScreenBottomText: function(textui) {
		if(this.getCycleMode() === TableScreenMode.TOP) {
			return;
		}
		
		var table = this._getTable(this._tableWindow.getIndex());
		var index = this._listWindow.getIndex();
		var text = table.getSwitchDescription(index);
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	//以下、現在のテーブルの表示データのみ保持するよう変更
	_prepareScreenMemberData: function(screenParam) {
		this._listWindow = createWindowObject(SwitchWindow2, this);
		this._tableWindow = createWindowObject(TableWindow, this);
		this._objectArray = [];
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._listWindow.setWindowData();
		this._tableWindow.setWindowData(this._getTableNameArray());
		this._updatePage();
		
		this._listWindow.setActive(false);
		this._tableWindow.enableSelectCursor(true);
		
		this._tableWindow.setIndex(FirstSwitchTableIndex);
	},
	
	_createObjectArray: function(table) {
		var i, data;
		var switchArray = [];
		var count = table.getSwitchCount();
		
		for (i = 0; i < count; i++) {
			data = {};
			data.name = table.getSwitchName(i);
			data.isSwitchOn = table.isSwitchOn(i);
			data.handle = table.getSwitchResourceHandle(i);
			data.id = table.getSwitchId(i);
			switchArray.push(data);
		}
		
		return switchArray;
	},
	
	_saveObjectArray: function(table) {
		var i;
		var count = this._objectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i].isSwitchOn !== table.isSwitchOn(i)) {
				table.setSwitch(i, this._objectArray[i].isSwitchOn);
			}
		}
	},
	
	_changeData: function() {
		var index = this._listWindow.getIndex();
		var data = this._objectArray[index];
		data.isSwitchOn = !data.isSwitchOn;
	},
	
	_updatePage: function() {
		this._objectArray = this._createObjectArray(this._getTable(this._tableWindow.getIndex()));
		this._listWindow.setObjectArray(this._objectArray);
	},
	
	_getTable: function(tableIndex) {
		if(tableIndex === 0) {
			return this._getLocalSwitchTable();
		}
		else {
			return this._getGlobalSwitchTable();
		}
	},
	
	_getTableNameArray: function() {
		return ['ローカル','グローバル'];
	}
});

//Window--------------------------------
//保存処理はScreenで行うよう変更
var SwitchWindow2 = defineObject(SwitchWindow, {
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(SwitchScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
	},
	
	setObjectArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	getIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
	},
	
	setForceSelect: function(index) {
		this._scrollbar.setForceSelect(index);
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
});


//Scrollbar-----------------------------
//スイッチID表示を追加
SwitchScrollbar._drawName = function(x, y, object, isSelect, index) {
	var length = this._getTextLength();
	var textui = this.getParentTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	
	x += GraphicsFormat.ICON_WIDTH;
	TextRenderer.drawKeywordText(x, y, object.id, -1, ColorValue.INFO, font);
	
	x += 30;
	TextRenderer.drawKeywordText(x, y, object.name, length-30, color, font);
};

/*----------------------------------------------------------
変数調整
------------------------------------------------------------*/
VariableScreenLauncher._getScreenObject = function() {
	return VariableScreen2;
};

//Screen--------------------------------
//edit追加、Switch→Variable
var VariableScreen2 = defineObject(SwitchScreen2, {
	
	//
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = SwitchScreen2.moveScreenCycle.call(this);
		
		if(mode === TableScreenMode.EDIT) {
			result = this._moveEdit();
		}
		
		return result;
	},
	
	_moveList: function() {
		var result = this._listWindow.moveWindow();
		if(result === ScrollbarInput.SELECT) {
			this._listWindow.enableSelectCursor(false);
			this._editWindow.setVariableData(this._listWindow.getObject());
			this.changeCycleMode(TableScreenMode.EDIT);
		}
		else if(result === ScrollbarInput.CANCEL) {
			this._saveObjectArray(this._getTable(this._tableWindow.getIndex()));
			this._tableWindow.enableSelectCursor(true);
			this._listWindow.setActive(false);
			this._listWindow.setForceSelect(-1);
			this.changeCycleMode(TableScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEdit: function() {
		var recentlyInput;
		var input = this._editWindow.moveWindow();
		
		if(input === ScrollbarInput.SELECT) {
			//更新して閉じる
			this._changeData();
			this._listWindow.enableSelectCursor(true);
			this.changeCycleMode(TableScreenMode.LIST);
		}
		else if(input === ScrollbarInput.CANCEL) {
			//更新しないで閉じる
			this._listWindow.enableSelectCursor(true);
			this.changeCycleMode(TableScreenMode.LIST);
		}
		else {
			//↑↓キーまたはマウスホイールで増減
			recentlyInput = this._editWindow.getRecentlyInputType();
			if(recentlyInput === InputType.UP || root.isMouseAction(MouseType.UPWHEEL)) {
				this._editWindow.incActiveNumber();
			}
			else if(recentlyInput === InputType.DOWN || root.isMouseAction(MouseType.DOWNWHEEL)) {
				this._editWindow.decActiveNumber();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawScreenCycle: function() {
		SwitchScreen2.drawScreenCycle.call(this);
		
		if(this.getCycleMode() === TableScreenMode.EDIT) {
			var x = LayoutControl.getCenterX(-1, this._editWindow.getWindowWidth());
			var y = LayoutControl.getCenterY(-1, this._editWindow.getWindowHeight());
			this._editWindow.drawWindow(x, y);
		}
	},
	
	drawScreenBottomText: function(textui) {
		if(this.getCycleMode() === TableScreenMode.TOP) {
			return;
		}
		
		var table = this._getTable(this._tableWindow.getIndex());
		var index = this._listWindow.getIndex();
		var text = table.getVariableDescription(index);
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Variable');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		SwitchScreen2._prepareScreenMemberData.call(this, screenParam);
		this._listWindow = createWindowObject(VariableWindow2, this);
		this._editWindow = createWindowObject(VariableEditWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		SwitchScreen2._completeScreenMemberData.call(this, screenParam);
		this._editWindow.setWindowData();
		
		this._tableWindow.setIndex(FirstVariableTableIndex);
	},
	
	//ID、最大値、最小値
	_createObjectArray: function(table) {
		var i, data;
		var variableArray = [];
		var count = table.getVariableCount();
		
		for (i = 0; i < count; i++) {
			data = {};
			data.name = table.getVariableName(i);
			data.variable = table.getVariable(i);
			data.handle = table.getVariableResourceHandle(i);
			data.id = table.getVariableId(i);
			data.min = table.getVariableMin(i);
			data.max = table.getVariableMax(i);
			variableArray.push(data);
		}
		
		return variableArray;
	},
	
	_saveObjectArray: function(table) {
		var i;
		var count = this._objectArray.length;
		
		for (i = 0; i < count; i++) {
			if(this._objectArray[i].variable !== table.getVariable(i)) {
				table.setVariable(i, this._objectArray[i].variable);
			}
		}
	},
	
	_changeData: function() {
		var index = this._listWindow.getIndex();
		var data = this._objectArray[index];
		var value = this._editWindow.getVariableValue();
		
		//最小値～最大値の範囲内に調整
		data.variable = value.clamp(data.min, data.max);
	},
	
	_getTable: function(tableIndex) {
		return root.getMetaSession().getVariableTable(tableIndex);
	},
	
	_getTableNameArray: function() {
		return ['1','2','3','4','5','ID変数'];
	}
});

//Window--------------------------------
var VariableWindow2 = defineObject(VariableWindow, {
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(VariableScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
	},
	
	setObjectArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	getIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	getObject: function() {
		return this._scrollbar.getObject();
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
	},
	
	setForceSelect: function(index) {
		this._scrollbar.setForceSelect(index);
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
});

//Scrollbar-----------------------------
VariableScrollbar._drawName = function(x, y, object, isSelect, index) {
	var length = this._getTextLength();
	var textui = this.getParentTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	
	x += GraphicsFormat.ICON_WIDTH;
	TextRenderer.drawKeywordText(x, y, object.id, -1, ColorValue.INFO, font);
	
	x += 30;
	TextRenderer.drawKeywordText(x, y, object.name, length-30, color, font);
};

//編集用ウィンドウ(符号+6桁)------------
var VariableEditWindow = defineObject(BaseWindow, {
	_scrollbar: null,
	_data: null,
	
	setWindowData: function() {
		this._scrollbar = createScrollbarObject(VariableEditScrollbar, this);
		this._scrollbar.setScrollFormation(7, 1);
		this._scrollbar.setActive(true);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	setVariableData: function(data) {
		this._data = data;
		var i;
		var value = data.variable;
		var objectArray = [];
		
		//符号
		var sign = 1;
		if(value < 0) {
			sign *= -1;
			value *= -1;
		}
		
		//数値
		for(i=0; i<6; i++) {
			objectArray.push(value % 10);
			value = Math.floor(value / 10);
		}
		objectArray.push(sign);
		objectArray.reverse();
		
		this._scrollbar.setObjectArray(objectArray);
	},
	
	getVariableValue: function() {
		var i;
		var value = 0;
		
		//数値
		for(i=0; i<6; i++) {
			value += this._scrollbar.getValue(i+1) * Math.pow(10, 5-i);
		}
		
		//符号
		value *= this._scrollbar.getValue(0);
		
		return value;
	},
	
	incActiveNumber: function() {
		this._scrollbar.incActiveNumber();
	},
	
	decActiveNumber: function() {
		this._scrollbar.decActiveNumber();
	},
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}
});

var VariableEditScrollbar = defineObject(BaseScrollbar, {
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var text = object;
		
		//符号
		if(index === 0) {
			if(object === 1) {
				text = '+';
			}
			else if(object === -1){
				text = '-';
			}
		}
		
		x += 20;
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	},
	
	getValue: function(index) {
		return this.getObjectFromIndex(index);
	},
	
	getObjectWidth: function() {
		return 40;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	// 現在選択中の桁の数値を＋１する
	incActiveNumber: function() {
		//符号
		if(this.getIndex() === 0) {
			this._objectArray[0] *= -1;
			return;
		}
		
		//数値
		var value = this.getObject();
		value++;
		if( value >= 10 ) {
			value = 0;
		}
		this._objectArray[this.getIndex()] = value;
	},
	
	// 現在選択中の桁の数値を－１する
	decActiveNumber: function() {
		//符号
		if(this.getIndex() === 0) {
			this._objectArray[0] *= -1;
			return;
		}
		
		//数値
		var value = this.getObject();
		value--;
		if( value < 0 ) {
			value = 9;
		}
		this._objectArray[this.getIndex()] = value;
	}
});

})();
