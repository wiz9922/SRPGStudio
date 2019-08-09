/*----------------------------------------------------------
数値入力イベント
数値入力ウィンドウ(6桁)を表示し、入力した値を変数に保存します

使用方法：
スクリプトの実行で「イベントコマンド呼び出し」、オブジェクト名「NumberInputEventCommand」

プロパティ例：
{
	table:0,
	id:0,
	cancel:false
}

table:保存する変数のテーブル番号。グループ1～5→0～4、ID変数→5 (省略時は0)
id:保存する変数のID (省略時は0)
cancel:入力キャンセルがtrueで有効、falseで無効となります(省略時はfalse)
       キャンセルした場合は変数に-1が保存されます

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.205

----------------------------------------------------------*/
(function() {

var _ScriptExecuteEventCommand__configureOriginalEventCommand = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	_ScriptExecuteEventCommand__configureOriginalEventCommand.call(this, groupArray);
	
	groupArray.appendObject(NumberInputEventCommand);
};

var NumberInputEventCommand = defineObject(BaseEventCommand, {
	_editWindow: null,
	_tableIndex: 0,
	_vId: 0,
	_cancel: false,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var result = this._moveEdit();
		return result;
	},
	
	drawEventCommandCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._editWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._editWindow.getWindowHeight());
		this._editWindow.drawWindow(x, y);
	},
	
	isEventCommandSkipAllowed: function() {
		return false;
	},
	
	getEventCommmandName: function() {
		return 'NumberInputEventCommand';
	},
	
	_prepareEventCommandMemberData: function() {
		this._editWindow = createObject(VariableEditWindow);
	},
	
	_completeEventCommandMemberData: function() {
		var arg = root.getEventCommandObject().getEventCommandArgument();
		this._tableIndex = arg.table || 0;
		this._vId = arg.id || 0;
		this._cancel = arg.cancel || false;
		
		this._editWindow.setWindowData();
		
		return EnterResult.OK;
	},
	
	_moveEdit: function() {
		var recentlyInput;
		var input = this._editWindow.moveWindow();
		
		if(input === ScrollbarInput.SELECT) {
			this._saveValue(this._editWindow.getVariableValue());
			return MoveResult.END;
		}
		else if(input === ScrollbarInput.CANCEL && this._cancel === true) {
			this._saveValue(-1);
			return MoveResult.END;
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
	
	_saveValue: function(value) {
		var table = root.getMetaSession().getVariableTable(this._tableIndex);
		var index = table.getVariableIndexFromId(this._vId);
		table.setVariable(index, value);
	}
});

//編集用ウィンドウ(6桁)------------
var VariableEditWindow = defineObject(BaseWindow, {
	_scrollbar: null,
	
	setWindowData: function() {
		this._scrollbar = createScrollbarObject(VariableEditScrollbar, this);
		this._scrollbar.setScrollFormation(6, 1);
		this._scrollbar.setActive(true);
		
		//初期値0
		var objectArray = [0, 0, 0, 0, 0, 0];
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getVariableValue: function() {
		var i;
		var value = 0;
		
		//数値
		for(i=0; i<6; i++) {
			value += this._scrollbar.getValue(i) * Math.pow(10, 5-i);
		}
		
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
		var value = this.getObject();
		value++;
		if( value >= 10 ) {
			value = 0;
		}
		this._objectArray[this.getIndex()] = value;
	},
	
	// 現在選択中の桁の数値を－１する
	decActiveNumber: function() {
		var value = this.getObject();
		value--;
		if( value < 0 ) {
			value = 9;
		}
		this._objectArray[this.getIndex()] = value;
	}
});

})();
