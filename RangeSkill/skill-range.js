/*----------------------------------------------------------
武器の射程を増減させるスキルを作成できます。
※各処理での武器射程の取得方法も変更しています。競合が発生するかも

■使用方法
カスタムスキルのキーワードに「range」
カスタムパラメータ例
{
	startRange:-1,
	endRange:2
}
startRange: 開始射程の増減値(未設定なら0)
endRange: 終了射程の増減値(未設定なら0)

■仕様
「有効相手」はスキル所有者の条件となります
終了射程＜開始射程となった場合、終了射程＝開始射程となります
アイテムやスキルの射程は変わりません

■作成者
wiz

■対応バージョン
SRPG Studio Version 1.235

----------------------------------------------------------*/
(function() {

//オプション：最大射程1の武器の射程を増やすならtrue、増やさないならfalse
var isNearbyRangeExpand = false;

//----------------------------------------------------------

var RANGESKILL_KEYWORD = 'range';

if(!Number.clamp) {
	Number.prototype.clamp = function(min, max) {
		return Math.min(Math.max(this, min), max);
	};
}

var getCustomParameter = function(obj, key, defValue) {
	if(obj === null) {
		return defValue;
	}
	if(!obj.custom.hasOwnProperty(key)) {
		return defValue;
	}
	return obj.custom[key];
};

//開始射程の計算
UnitItemControl.getStartRange = function(unit, item) {
	var startRange = item.getStartRange();
	var endRange = item.getEndRange();
	
	if(unit === null) {
		return startRange;
	}
	if(startRange === 1 && !isNearbyRangeExpand) {
		return startRange;
	}
	
	var obj = SkillControl.getCustomRangeData(unit, item);
	startRange += obj.startRange;
	endRange += obj.endRange;
	
	//最低射程は開始射程が優先
	endRange = endRange.clamp(startRange, 99);
	
	return startRange.clamp(1, endRange);
};

//終了射程の計算
UnitItemControl.getEndRange = function(unit, item) {
	var startRange = item.getStartRange();
	var endRange = item.getEndRange();
	
	if(unit === null) {
		return endRange;
	}
	if(endRange === 1 && !isNearbyRangeExpand) {
		return endRange;
	}
	
	var obj = SkillControl.getCustomRangeData(unit, item);
	startRange += obj.startRange;
	endRange += obj.endRange;
	
	return endRange.clamp(startRange, 99);
};

//射程変更スキルの値を取得
SkillControl.getCustomRangeData = function(unit, item) {
	var i, skill;
	var arr = this.getDirectSkillArray(unit, SkillType.CUSTOM, RANGESKILL_KEYWORD);
	var count = arr.length;
	var obj = {startRange: 0, endRange: 0};
	
	for(i=0; i<count; i++) {
		skill = arr[i].skill;
		//有効相手
		if(skill.getTargetAggregation().isConditionFromWeapon(unit, item)) {
			obj.startRange += getCustomParameter(skill, 'startRange', 0);
			obj.endRange += getCustomParameter(skill, 'endRange', 0);
		}
	}
	
	return obj;
};

/*------------------------------------------------
既存の射程取得処理の変更
-------------------------------------------------*/
//map-enemyturnai
CombinationCollector.Weapon.collectCombination = function(misc) {
		var i, weapon, filter, rangeMetrics;
		var unit = misc.unit;
		var itemCount = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < itemCount; i++) {
			weapon = UnitItemControl.getItem(unit, i);
			if (weapon === null) {
				continue;
			}
			
			// 武器でないか、武器を装備できない場合は続行しない
			if (!weapon.isWeapon() || !this._isWeaponEnabled(unit, weapon, misc)) {
				continue;
			}
			
			misc.item = weapon;
			
			rangeMetrics = StructureBuilder.buildRangeMetrics();
			//rangeMetrics.startRange = weapon.getStartRange();
			//rangeMetrics.endRange = weapon.getEndRange();
			rangeMetrics.startRange = UnitItemControl.getStartRange(unit, weapon);
			rangeMetrics.endRange = UnitItemControl.getEndRange(unit, weapon);
			
			filter = this._getWeaponFilter(unit);
			this._checkSimulator(misc);
			this._setUnitRangeCombination(misc, filter, rangeMetrics);
		}
};

//singleton-system
//unitを引数に追加したので関連箇所も変更
IndexArray.createIndexArray = function(x, y, item, unit) {
		var i, rangeValue, rangeType, arr;
		var startRange = 1;
		var endRange = 1;
		var count = 1;
		
		if (item === null) {
			startRange = 1;
			endRange = 1;
		}
		else if (item.isWeapon()) {
			//startRange = item.getStartRange();
			//endRange = item.getEndRange();
			startRange = UnitItemControl.getStartRange(unit, item);
			endRange = UnitItemControl.getEndRange(unit, item);
		}
		else {
			if (item.getItemType() === ItemType.TELEPORTATION && item.getRangeType() === SelectionRangeType.SELFONLY) {
				rangeValue = item.getTeleportationInfo().getRangeValue();
				rangeType = item.getTeleportationInfo().getRangeType();
			}
			else {
				rangeValue = item.getRangeValue();
				rangeType = item.getRangeType();
			}
			
			if (rangeType === SelectionRangeType.SELFONLY) {
				return [];
			}
			else if (rangeType === SelectionRangeType.MULTI) {
				endRange = rangeValue;
			}
			else if (rangeType === SelectionRangeType.ALL) {
				count = CurrentMap.getSize();
				
				arr = [];
				arr.length = count;
				for (i = 0; i < count; i++) {
					arr[i] = i;
				}
				
				return arr;
			}
		}
		
		return this.getBestIndexArray(x, y, startRange, endRange);
};

AttackChecker.getAttackIndexArray = function(unit, weapon, isSingleCheck) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon, unit);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
};

AttackChecker.getFusionAttackIndexArray = function(unit, weapon, fusionData) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon, unit);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (FusionControl.isAttackable(unit, targetUnit, fusionData) && FusionControl.isRangeAllowed(unit, targetUnit, fusionData)) {
					indexArrayNew.push(index);
				}
			}
		}
		
		return indexArrayNew;
};

AttackChecker.isCounterattack = function(unit, targetUnit) {
		var weapon, indexArray;
		
		if (!Calculator.isCounterattackAllowed(unit, targetUnit)) {
			return false;
		}
		
		weapon = ItemControl.getEquippedWeapon(unit);
		if (weapon !== null && weapon.isOneSide()) {
			// 攻撃する側が「一方向」の武器を装備している場合は、反撃は発生しない
			return false;
		}
		
		// 攻撃を受ける側の装備武器を取得
		weapon = ItemControl.getEquippedWeapon(targetUnit);
		
		// 武器を装備していない場合は、反撃できない
		if (weapon === null) {
			return false;
		}
		
		// 「一方向」の武器を装備している場合は反撃でない
		if (weapon.isOneSide()) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), weapon, targetUnit);
		
		return IndexArray.findUnit(indexArray, unit);
};

AttackChecker.isCounterattackPos = function(unit, targetUnit, x, y) {
		var indexArray;
		var weapon = ItemControl.getEquippedWeapon(targetUnit);
		
		if (weapon === null) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), weapon, targetUnit);
		
		return IndexArray.findPos(indexArray, x, y);
};

//utility-panel
var _UnitRangePanel_getUnitAttackRange = UnitRangePanel.getUnitAttackRange;
UnitRangePanel.getUnitAttackRange = function(unit) {
	var obj = _UnitRangePanel_getUnitAttackRange.call(this, unit);
	var item;
	
	//自軍
	if(unit.getUnitType() === UnitType.PLAYER) {
		item = ItemControl.getEquippedWeapon(unit);
		if (item !== null) {
			obj.startRange = UnitItemControl.getStartRange(unit, item);
			obj.endRange = UnitItemControl.getEndRange(unit, item);
		}
	}
	
	return obj;
};

var _UnitRangePanel__getRangeMetricsFromItem = UnitRangePanel._getRangeMetricsFromItem;
UnitRangePanel._getRangeMetricsFromItem = function(unit, item) {
	if(item === null) {
		return null;
	}
	
	var rangeMetrics = _UnitRangePanel__getRangeMetricsFromItem.call(this, unit, item);
	
	//自軍以外
	if (item.isWeapon()) {
		if (ItemControl.isWeaponAvailable(unit, item)) {
			rangeMetrics.startRange = UnitItemControl.getStartRange(unit, item);
			rangeMetrics.endRange = UnitItemControl.getEndRange(unit, item);
		}
	}
	return rangeMetrics;
};

//window-unitsentence
UnitSentence.Range.drawUnitSentence = function(x, y, unit, weapon, totalStatus) {
		var startRange, endRange;
		var textui = this.getUnitSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = -1;
		var colorIndex = 1;
		var alpha = 255;
		
		TextRenderer.drawKeywordText(x, y, root.queryCommand('range_capacity'), length, color, font);
		x += 78;
		
		if (weapon === null) {
			TextRenderer.drawSignText(x - 5, y, StringTable.SignWord_Limitless);
			return;
		}
		
		//startRange = weapon.getStartRange();
		//endRange = weapon.getEndRange();
		startRange = UnitItemControl.getStartRange(unit, weapon);
		endRange = UnitItemControl.getEndRange(unit, weapon);
		
		if (startRange === endRange) {
			NumberRenderer.drawNumberColor(x, y, startRange, colorIndex, alpha);
		}
		else {
			x -= 30;
			NumberRenderer.drawNumberColor(x, y, startRange, colorIndex, alpha);
			TextRenderer.drawKeywordText(x + 17, y, StringTable.SignWord_WaveDash, -1, color, font);
			NumberRenderer.drawNumberColor(x + 40, y, endRange, colorIndex, alpha);
		}
};

})();
