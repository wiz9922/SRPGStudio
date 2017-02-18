/*----------------------------------------------------------
クエストマップに退却コマンド(拠点に戻る)を追加します。
ついでにクエストマップにおけるマップクリア画像の表示も制御します。

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.111
----------------------------------------------------------*/
(function() {

//マップコマンド表示名
var RetreatCommand = '退却';

//確認メッセージ
var RetreatQuestion = '退却しますか？';

//退却時にマップクリア画像を表示するならtrue、表示しないならfalse
var MapVictoryDisplayable = false;

//---------------------------------------------------------
var isQuestMap = function() {
	return root.getCurrentSession().getCurrentMapInfo().getMapType() === MapType.QUEST;
};

var alias1 = MapCommand.configureCommands;
MapCommand.configureCommands = function(groupArray) {
	alias1.call(this, groupArray);
	
	if(isQuestMap()) {
		groupArray.insertObject(MapCommand.Retreat, groupArray.length - 1);
	}
};

MapCommand.Retreat = defineObject(BaseListCommand, {
	_questionWindow: null,
	
	openCommand: function() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(RetreatQuestion);
		this._questionWindow.setQuestionActive(true);
	},
	
	moveCommand: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				//退却実行チェック
				root.getMetaSession().global.retreat = true;
				
				//戦闘結果シーンに変更
				var generator = root.getEventGenerator();
				generator.sceneChange(SceneType.BATTLERESULT);
				generator.execute();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		this._questionWindow.drawWindow(x, y);
	},
	
	getCommandName: function() {
		return RetreatCommand;
	}
});

var alias2 = MapVictoryFlowEntry._isDisplayable;
MapVictoryFlowEntry._isDisplayable = function() {
	var result = alias2.call(this);
	if(typeof root.getMetaSession().global.retreat !== 'undefined') {
		//退却時のマップクリア画像
		if(root.getMetaSession().global.retreat && !MapVictoryDisplayable) {
			result = false;
		}
		root.getMetaSession().global.retreat = false;
	}
	return result;
};

})();
