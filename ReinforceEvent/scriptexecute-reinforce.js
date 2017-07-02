/*----------------------------------------------------------
援軍を強制的に出現させるイベントコマンド
敵イベントのコピペを繰り返すのが面倒な場合などにどうぞ


使用方法:
イベントコマンド「スクリプトの実行」で「イベントコマンド呼び出し」を選択します
オブジェクト名に「ReinforceEventCommand」と記述します
テキスト領域に以下の形式で記述します

{id:index, id:index, …}

援軍作成ダイアログにおけるIDとページ番号(Page1がindex0)の組み合わせで指定してください

記述例:
「援軍id0の1ページ目」と「援軍id1の3ページ目」の援軍を出撃させたい場合
{0:0, 1:2}

■注意事項
・援軍作成ダイアログの設定項目は「ユニット」「方向」「重複時の処理」だけが考慮されます。条件はイベント側で指定してください
・このイベントコマンド以外で出したくない援軍は確率0%などにしておいてください

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.136
----------------------------------------------------------*/
(function() {

var alias1 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.appendObject(ReinforceEventCommand);
};

/*--------------------------------------------------
ReinforcementCheckerの派生
ユニットリストの追加と条件関連の除外
--------------------------------------------------*/
var ReinforcementChecker2 = defineObject(ReinforcementChecker, {
	_unitList: null,
	
	setUnitList: function(arg) {
		this._unitList = [];
		for(var id in arg) {
			this._unitList.push({id:id, index:arg[id]});
		}
	},
	
	_checkReinforcementPos: function(divisionArea) {
		var i, x, y, posData;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		//var count = mapInfo.getReinforcementPosCount();
		var count = this._unitList.length;
		
		this._reinforceUnitArray = [];
		
		for (i = 0; i < count; i++) {
			//posData = mapInfo.getReinforcementPos(i);
			posData = mapInfo.getReinforcementPos(this._unitList[i].id);
			x = posData.getX();
			y = posData.getY();
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			
			if (divisionArea.x <= x && divisionArea.xEnd - 1 >= x) {
				if (divisionArea.y <= y && divisionArea.yEnd - 1 >= y) {
					// ここが実行されるということは、x, yは範囲内に存在する
					this._checkReinforcementPage(posData, this._reinforceUnitArray, this._unitList[i].index);
				}
			}
		}
		
		// 全てのユニットを登場し終えたので、非表示設定を行う。
		// _createReinforcementUnitで非表示設定を行うと、
		// root.getCurrentSession().getUnitFromPosが非表示ユニットを考慮しなくなり、
		// ユニットが存在する箇所を空き地点と認識することがある。
		count = this._reinforceUnitArray.length;
		for (i = 0; i < count; i++) {
			this._reinforceUnitArray[i].unit.setInvisible(true);
		}
		
		return this._reinforceUnitArray.length > 0;
	},
	
	_checkReinforcementPage: function(posData, arr, index) {
		/*
		var i, pageData, turnCount;
		var turnType = root.getCurrentSession().getTurnType();
		var count = posData.getReinforcementPageCount();
		
		for (i = 0; i < count; i++) {
			pageData = posData.getReinforcementPage(i);
			turnCount = this._getTurnCount(pageData);
			// 出現ターンなどの条件を満たしているか調べる
			if (pageData.getStartTurn() <= turnCount && pageData.getEndTurn() >= turnCount && turnType === pageData.getTurnType()) {
				// イベントの条件を満たしているか調べる
				if (pageData.isCondition()) {
					// 実際に登場させる
					this._createReinforcementUnit(posData, pageData, arr);
					break;
				}
			}
		}
		*/
		
		var pageData = posData.getReinforcementPage(index);
		this._createReinforcementUnit(posData, pageData, arr);
	},
	
	_doSkipAction: function() {
		var i, j, x, y, posData, pageData, pageCount, turnCount, pos;
		var turnType = root.getCurrentSession().getTurnType();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		//var posCount = mapInfo.getReinforcementPosCount();
		var posCount = this._unitList.length;
		
		for (i = 0; i < posCount; i++) {
			//posData = mapInfo.getReinforcementPos(i);
			posData = mapInfo.getReinforcementPos(this._unitList[i].id);
			x = posData.getX();
			y = posData.getY();
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			/*
			pageCount = posData.getReinforcementPageCount();
			for (j = 0; j < pageCount; j++) {
				pageData = posData.getReinforcementPage(j);
				turnCount = this._getTurnCount(pageData);
				if (pageData.getStartTurn() <= turnCount && pageData.getEndTurn() >= turnCount && turnType === pageData.getTurnType()) {
					if (pageData.isCondition()) {
						pos = this._getTargetPos(posData, pageData);
						if (pos !== null) {
							this._appearUnit(pageData, pos.x, pos.y);
							break;
						}
					}
				}
			}
			*/
			pageData = posData.getReinforcementPage(this._unitList[i].index);
			pos = this._getTargetPos(posData, pageData);
			if (pos !== null) {
				this._appearUnit(pageData, pos.x, pos.y);
			}
		}
	}
});

/*------------------------------------------------
ReinforcementAppearFlowEntryをイベントコマンド型に
--------------------------------------------------*/
var ReinforceEventCommand = defineObject(BaseEventCommand, {
	_reinforceChecker: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
	
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		return this._reinforceChecker.moveReinforcementChecker();
	},
	
	drawEventCommandCycle: function() {
		this._reinforceChecker.drawReinforcementChecker();
	},
	
	getEventCommmandName: function() {
		return 'ReinforceEventCommand';
	},
	
	mainEventCommand: function() {
		this._reinforceChecker._doSkipAction();
	},
	
	_prepareEventCommandMemberData: function() {
		this._reinforceChecker = createObject(ReinforcementChecker2);
		
		var arg = root.getEventCommandObject().getEventCommandArgument();
		this._reinforceChecker.setUnitList(arg);
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		//スキップはイベント側で判定
		var result = this._reinforceChecker.enterReinforcementChecker(false);
		
		if (result === EnterResult.OK) {
			this._reinforceChecker.startMove();
		}
		
		return result;
	}
});

})();
