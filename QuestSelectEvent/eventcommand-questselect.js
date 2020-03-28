/*------------------------------------------------------------------------------
クエスト選択イベント
選択したクエストIDが指定の変数に保存されます(キャンセル時は-1)

使用方法:
スクリプトの実行で「イベントコマンド呼び出し」、オブジェクト名「QuestSelectEventCommand」

プロパティ例:
{
table:0,
id:0
}

table:クエストIDを受け取る変数テーブルのインデックス(グループ1～5→0～4、ID変数→5、未設定の場合は0)
id:クエストIDを受け取る変数のID(未設定の場合は0)

■制限・注意事項
・変数の最小値を-1以下にしておいてください
・クエストIDを保存するだけなので選択後のマップ移動は手動で行ってください
・「攻略可能時イベント」「攻略不可能時イベント」は起こせません

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.209
------------------------------------------------------------------------------*/
(function() {

//スクリプトの実行
var _ScriptExecuteEventCommand__configureOriginalEventCommand = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	_ScriptExecuteEventCommand__configureOriginalEventCommand.call(this, groupArray);
	groupArray.appendObject(QuestSelectEventCommand);
};

//使い回し--------------------------------------------------
var BaseScreenEventCommand = defineObject(BaseEventCommand, {
	_screen: null,
	_screenContainer: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if(ScreenController.moveScreenControllerCycle(this._screenContainer) !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		ScreenController.drawScreenControllerCycle(this._screenContainer);
	},
	
	isEventCommandSkipAllowed: function() {
		return false;
	},
	
	_prepareEventCommandMemberData: function() {
		//オーバーライド
		this._screen = createObject(BaseScreen);
	},
	
	_completeEventCommandMemberData: function() {
		if(this._screen === null) {
			return EnterResult.NOTENTER;
		}
		
		this._screenContainer = {};
		this._screenContainer.screen = this._screen;
		this._screenContainer.param = this._createScreenParam();
		ScreenController.enterScreenControllerCycle(this._screenContainer);
		
		return EnterResult.OK;
	},
	
	_createScreenParam: function() {
		//オーバーライド
		return {};
	},
	
	_doEndAction: function() {
		//オーバーライド
	}
});

//イベントコマンド------------------------------------------
var QuestSelectEventCommand = defineObject(BaseScreenEventCommand, {
	getEventCommandName: function() {
		return 'QuestSelectEventCommand';
	},
	
	_prepareEventCommandMemberData: function() {
		this._screen = createObject(QuestScreen2);
	},
	
	_createScreenParam: function() {
		var arg = root.getEventCommandObject().getEventCommandArgument();
		this._tableNum = arg.table || 0;
		this._vId = arg.id || 0;
		
		return {};
	},
	
	_doEndAction: function() {
		var quest = this._screenContainer.screen.getSelectQuest();
		var questId = -1;
		if(quest !== null) {
			questId = quest.getId();
		}
		
		var table = root.getMetaSession().getVariableTable(this._tableNum);
		var index = table.getVariableIndexFromId(this._vId);
		
		table.setVariable(index, questId);
	}
});

var QuestScreen2 = defineObject(QuestScreen, {
	_quest: null,
	
	getSelectQuest: function() {
		return this._quest;
	},
	
	_moveSelect: function() {
		var input = this._questListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startQuestEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._quest = null;
			return MoveResult.END;
		}
		else {
			if (this._questListWindow.isIndexChanged()) {
				this._questDetailWindow.setQuestData(this._questEntryArray[this._questListWindow.getQuestListIndex()].data);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				//this._startQuestMap();
				//return MoveResult.CONTIUNE;
				this._quest = this.getCurrentQuestEntry().data;
				return MoveResult.END;
			}
			else {
				this._questListWindow.enableSelectCursor(true);
				this._changeSelectMode();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_changeEventMode: function() {
		var result;
		
		//result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.QUEST);
		result = EnterResult.NOTENTER;
		if (result === EnterResult.NOTENTER) {
			this.changeCycleMode(QuestScreenMode.SELECT);
		}
		else {
			this.changeCycleMode(QuestScreenMode.AUTOEVENTCHECK);
		}
	}
});

})();
