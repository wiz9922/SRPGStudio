/*------------------------------------------------------------------------------
指定スイッチがオンの時、同盟軍を中立軍として扱います。
自軍と中立軍は互いに攻撃可能となります。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.211

------------------------------------------------------------------------------*/
(function() {

//判定対象となるグローバルスイッチID
var neutralSwitchId = 1;

//目標確認画面の中立軍名称
StringTable.UnitType_Neutral = 'NEUTRAL';


var isNeutralValid = function() {
	var table = root.getMetaSession().getGlobalSwitchTable();
	var index = table.getSwitchIndexFromId(neutralSwitchId);
	return table.isSwitchOn(index);
};


var _FilterControl_getNormalFilter = FilterControl.getNormalFilter;
FilterControl.getNormalFilter = function(unitType) {
		if(!isNeutralValid()) {
			return _FilterControl_getNormalFilter.call(this, unitType);
		}
		
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			//敵対時は同盟無効
			//filter = UnitFilterFlag.ALLY;
		}
		
		return filter;
};

var _FilterControl_getReverseFilter = FilterControl.getReverseFilter;
FilterControl.getReverseFilter = function(unitType) {
		if(!isNeutralValid()) {
			return _FilterControl_getReverseFilter.call(this, unitType);
		}
		
		var filter;
		
		if(unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		else if(unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY;
		}
		
		return filter;
};

var _FilterControl_getBestFilter = FilterControl.getBestFilter;
FilterControl.getBestFilter = function(unitType, filterFlag) {
		if(!isNeutralValid()) {
			return _FilterControl_getBestFilter.call(this, unitType, filterFlag);
		}
		
		var newFlag = 0;
		
		if (unitType === UnitType.PLAYER) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.PLAYER;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
			}
			
			filterFlag = newFlag;
		}
		else if (unitType === UnitType.ENEMY) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.ENEMY;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
			}
			
			filterFlag = newFlag;
		}
		else if (unitType === UnitType.ALLY) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.ALLY;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY;
			}
			
			filterFlag = newFlag;
		}
		
		return filterFlag;
};

var _FilterControl_isReverseUnitTypeAllowed = FilterControl.isReverseUnitTypeAllowed;
FilterControl.isReverseUnitTypeAllowed = function(unit, targetUnit) {
		if(!isNeutralValid()) {
			return _FilterControl_isReverseUnitTypeAllowed.call(this, unit, targetUnit);
		}
		
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if(unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.ENEMY || targetUnitType === UnitType.ALLY;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.PLAYER || targetUnitType === UnitType.ALLY;
		}
		else if(unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.PLAYER || targetUnitType === UnitType.ENEMY;
		}
		
		return false;
};

//通行設定
var _SimulationBlockerControl_getDefaultFilter = SimulationBlockerControl.getDefaultFilter;
SimulationBlockerControl.getDefaultFilter = function(unit) {
	if(!isNeutralValid()) {
		return _SimulationBlockerControl_getDefaultFilter.call(this, unit);
	}
	
	var filter = 0;
	var unitType = unit.getUnitType();
	
	if (unitType === UnitType.PLAYER) {
		filter = UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
	}
	else if (unitType === UnitType.ENEMY) {
		filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
	}
	else if (unitType === UnitType.ALLY) {
		filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY;
	}
	
	return filter;
}

//攻撃範囲表示
var _MarkingPanel_updateMarkingPanel = MarkingPanel.updateMarkingPanel;
MarkingPanel.updateMarkingPanel = function() {
		if(!isNeutralValid()) {
			_MarkingPanel_updateMarkingPanel.call(this);
			return;
		}
		
		if (!this.isMarkingEnabled()) {
			return;
		}
		
		this._simulator = root.getCurrentSession().createMapSimulator();
		this._simulator.startSimulationWeaponAll(UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY);
		
		this._indexArray = this._simulator.getSimulationIndexArray();
		this._indexArrayWeapon = this._simulator.getSimulationWeaponIndexArray();
};

//目標確認
var _ObjectiveFaceZone__drawInfo = ObjectiveFaceZone._drawInfo;
ObjectiveFaceZone._drawInfo = function(x, y, unit, unitType) {
		if(!isNeutralValid()) {
			_ObjectiveFaceZone__drawInfo.call(this, x, y, unit, unitType);
			return;
		}
		
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = [StringTable.UnitType_Player, StringTable.UnitType_Enemy, StringTable.UnitType_Neutral];
		
		y += 112;
		
		TitleRenderer.drawTitle(pic, x - 20 + 5, y - 10, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 3);
		TextRenderer.drawText(x + 5, y + 12, text[unitType], -1, color, font);
		NumberRenderer.drawNumber(x + 100 + 5, y + 7, this._getTotalValue(unitType));
};

})();
