/*----------------------------------------------------------
数値入力イベント
数値入力ウィンドウを表示し、入力した値を変数に保存します

使用方法：
スクリプトの実行で「イベントコマンド呼び出し」、オブジェクト名「NumberInputEventCommand」

プロパティ例：
{
	table:0,
	id:0,
	cancel:false,
	digit: 6
}

table:保存する変数のテーブル番号。グループ1～5→0～4、ID変数→5 (省略時は0)
id:保存する変数のID (省略時は0)
cancel:入力キャンセルがtrueで有効、falseで無効となります(省略時はfalse)
       キャンセルした場合は変数に-1が保存されます
digit:入力できる数値の桁数(省略時は1)

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.223

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
	
	getEventCommandName: function() {
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
		
		var digit = arg.digit || 1;
		this._editWindow.setWindowData(digit);
		
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

//編集用ウィンドウ------------
var VariableEditWindow = defineObject(BaseWindow, {
	_scrollbar: null,
	_digit: 0,
	
	setWindowData: function(digit) {
		//最低1桁
		this._digit = Math.max(digit, 1);
		this._scrollbar = createScrollbarObject(VariableEditScrollbar, this);
		this._scrollbar.setScrollFormation(this._digit, 1);
		this._scrollbar.setActive(true);
		
		//初期値0
		var i;
		var objectArray = [];
		for(i=0; i<this._digit; i++) {
			objectArray.push(0);
		}
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
		for(i=0; i<this._digit; i++) {
			value += this._scrollbar.getValue(i) * Math.pow(10, this._digit - 1 - i);
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
