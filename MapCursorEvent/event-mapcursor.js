/*------------------------------------------------------------------------------
マップカーソルで特定の位置を選択した時に発生するイベントを作成します。
・優先度はユニット選択＞マップカーソルイベント＞マップコマンドの順
・発生するのは自軍ターンのみ。戦闘準備では発生しません

使い方：
場所イベントの種類を「カスタム」、キーワードを「cursor」と設定してください。
通常のイベント同様、何度でも発生させたい場合は実行済み解除を行ってください。

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.198

------------------------------------------------------------------------------*/
(function() {

PlayerTurnMode.EVENT = 100;

var _PlayerTurn_moveTurnCycle = PlayerTurn.moveTurnCycle;
PlayerTurn.moveTurnCycle = function() {
	var mode = this.getCycleMode();
	var result = _PlayerTurn_moveTurnCycle.call(this);
	
	if(mode === PlayerTurnMode.EVENT) {
		result = this._moveEvent();
	}
	
	return result;
}

var _PlayerTurn_drawTurnCycle = PlayerTurn.drawTurnCycle;
PlayerTurn.drawTurnCycle = function() {
	var mode = this.getCycleMode();
	_PlayerTurn_drawTurnCycle.call(this);
	
	if(mode === PlayerTurnMode.EVENT) {
		this._drawMap();
	}
}

var _PlayerTurn__prepareTurnMemberData = PlayerTurn._prepareTurnMemberData;
PlayerTurn._prepareTurnMemberData = function() {
	_PlayerTurn__prepareTurnMemberData.call(this);
	this._capsuleEvent = createObject(CapsuleEvent);
};

PlayerTurn._moveEvent = function() {
	if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
		this.changeCycleMode(PlayerTurnMode.MAP);
	}
	return MoveResult.CONTINUE;
};

PlayerTurn._moveMap = function() {
		var result = this._mapEdit.moveMapEdit();
		
		if (result === MapEditResult.UNITSELECT) {
			this._targetUnit = this._mapEdit.getEditTarget();
			if (this._targetUnit !== null) {
				if (this._targetUnit.isWait()) {
					this._mapEdit.clearRange();
					
					// 待機しているユニット上での決定キー押下は、マップコマンドとして扱う
					this._mapCommandManager.openListCommandManager();
					this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
				}
				else {
					// ユニットの移動範囲を表示するモードに進む
					this._mapSequenceArea.openSequence(this);
					this.changeCycleMode(PlayerTurnMode.AREA);
				}
			}
		}
		else if (result === MapEditResult.MAPCHIPSELECT) {
			//カーソルイベントがあれば実行
			if(this._checkMapCursorEvent()) {
				this.changeCycleMode(PlayerTurnMode.EVENT);
			}
			else {
				this._mapCommandManager.openListCommandManager();
				this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
			}
		}
		
		return MoveResult.CONTINUE;
};

PlayerTurn._checkMapCursorEvent = function() {
	var x = this._mapEdit.getEditX();
	var y = this._mapEdit.getEditY();
	var event = PosChecker.getPlaceEventFromPos(PlaceEventType.CUSTOM, x, y);
	
	if(event === null) {
		return false;
	}
	if(event.getPlaceEventInfo().getPlaceCustomType() !== PlaceCustomType.KEYWORD) {
		return false;
	}
	if(event.getPlaceEventInfo().getCustomKeyword() !== 'cursor') {
		return false;
	}
	
	this._capsuleEvent.enterCapsuleEvent(event, true);
	return true;
};

})();
