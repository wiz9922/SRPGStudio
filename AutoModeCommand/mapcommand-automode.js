/*----------------------------------------------------------
マップコマンドにオートモードを追加します。
その時点で未行動の自軍全員がステートの自動AIと同じ行動(おそらく通常型)をします。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.198

■更新履歴
2019/03/02 オートターンエンド有効時は自動行動後にマップコマンドが開かないように変更
2023/12/31 オート状態をスキップした時に発生する不具合を修正

----------------------------------------------------------*/
(function() {

StringTable.AutoMode_CommandName = 'オート';

var _MapCommand_configureCommands = MapCommand.configureCommands;
MapCommand.configureCommands = function(groupArray) {
	_MapCommand_configureCommands.call(this, groupArray);
	groupArray.insertObject(MapCommand.AutoMode, groupArray.length - 1);
};

MapCommand._moveOpen = function() {
	var object = this._commandScrollbar.getObject();
	var result = object.moveCommand();
	
	if(result === MoveResult.SELECT) {
		return MoveResult.END;
	}
	
	if(result !== MoveResult.CONTINUE) {
		this._commandScrollbar.setActive(true);
		this.changeCycleMode(ListCommandManagerMode.TITLE);
	}
	
	return MoveResult.CONTINUE;
};

//BerserkFlowEntry参照
MapCommand.AutoMode = defineObject(BaseListCommand, {
	_autoTurn: null,
	
	openCommand: function() {
		if(!this._isAutoModeUsable()) {
			return;
		}
		
		this._autoTurn = createObject(PlayerAutoTurn);
		this._autoTurn.openTurnCycle();
	},
	
	moveCommand: function() {
		if(this._autoTurn.moveTurnCycle() !== MoveResult.CONTINUE) {
			//通常は全員行動済みになっているので再構築
			this._listCommandManager.rebuildCommand();
			if(EnvironmentControl.isAutoTurnEnd()) {
				return MoveResult.SELECT;
			}
			return MoveResult.END;
		}
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
		this._autoTurn.drawTurnCycle();
	},
	
	getCommandName: function() {
		return StringTable.AutoMode_CommandName;
	},
	
	isCommandDisplayable: function() {
		return this._isAutoModeUsable();
	},
	
	//自軍未行動ユニットがいる
	_isAutoModeUsable: function() {
		var i, unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		for(i=0; i<count; i++) {
			unit = list.getData(i);
			if(!unit.isWait()) {
				return true;
			}
		}
		
		return false;
	}
});

//PlayerBerserkTurn参照
var PlayerAutoTurn = defineObject(EnemyTurn, {
	_moveEndEnemyTurn: function() {
		CurrentMap.setTurnSkipMode(false);
		return MoveResult.END;
	},
	
	//行動可能で暴走・自動AIステートでない
	_isOrderAllowed: function(unit) {
		if (!EnemyTurn._isOrderAllowed.call(this, unit)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
			return false;
		}
		
		return true;
	}
});

})();
