/*------------------------------------------------------------------------------
戦闘を発生させるアイテムを作成できます
・武器は装備中のものを使用します
・アイテムの射程や有効相手を参照します

使用方法：
アイテムの種類を「カスタム」、キーワードを「battle」に設定してください

■制限事項
対象を「使用者のみ」にした場合の動作は保証しません

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.211

------------------------------------------------------------------------------*/
(function() {

//カスタムアイテムのキーワード
var KEYWORD_BATTLEITEM = 'battle';

//情報ウィンドウでの種類名(～アイテム、～の杖)
StringTable.ItemInfo_Battle = '戦闘';

//アイテムの追加スコア(プラスの値にすると同じ攻撃より優先して使用するようになる)
var BattleItem_PlusScore = 0;

//カスタムアイテム--------------------------------------------------------------
//ItemSelectionでPosAttackWindowに変更することでダメージ予測を表示するので、ItemPotencyは不要

var _ItemPackageControl_getCustomItemSelectionObject = ItemPackageControl.getCustomItemSelectionObject;
ItemPackageControl.getCustomItemSelectionObject = function(item, keyword) {
	var result = _ItemPackageControl_getCustomItemSelectionObject.call(this, item, keyword);
	
	if (keyword === KEYWORD_BATTLEITEM) {
		return BattleItemSelection;
	}
	
	return result;
};

var _ItemPackageControl_getCustomItemUseObject = ItemPackageControl.getCustomItemUseObject;
ItemPackageControl.getCustomItemUseObject = function(item, keyword) {
	var result = _ItemPackageControl_getCustomItemUseObject.call(this, item, keyword);
	
	if (keyword === KEYWORD_BATTLEITEM) {
		return BattleItemUse;
	}
	
	return result;
};

var _ItemPackageControl_getCustomItemInfoObject = ItemPackageControl.getCustomItemInfoObject;
ItemPackageControl.getCustomItemInfoObject = function(item, keyword) {
	var result = _ItemPackageControl_getCustomItemInfoObject.call(this, item, keyword);
	
	if (keyword === KEYWORD_BATTLEITEM) {
		return BattleItemInfo;
	}
	
	return result;
};

var _ItemPackageControl_getCustomItemAvailabilityObject = ItemPackageControl.getCustomItemAvailabilityObject;
ItemPackageControl.getCustomItemAvailabilityObject = function(item, keyword) {
	var result = _ItemPackageControl_getCustomItemAvailabilityObject.call(this, item, keyword);
	
	if (keyword === KEYWORD_BATTLEITEM) {
		return BattleItemAvailability;
	}
	
	return result;
};

var _ItemPackageControl_getCustomItemAIObject = ItemPackageControl.getCustomItemAIObject;
ItemPackageControl.getCustomItemAIObject = function(item, keyword) {
	var result = _ItemPackageControl_getCustomItemAIObject.call(this, item, keyword);
	
	if (keyword === KEYWORD_BATTLEITEM) {
		return BattleItemAI;
	}
	
	return result;
};

//戦闘アイテム------------------------------------------------------------------
//武器での攻撃対象選択に変更
var BattleItemSelection = defineObject(BaseItemSelection, {
	setUnitSelection: function() {
		var weapon = ItemControl.getEquippedWeapon(this._unit);
		var filter = this.getUnitFilter();
		
		var indexArray = IndexArray.createIndexArray(this._unit.getMapX(), this._unit.getMapY(), this._item);
		indexArray = this._getUnitOnlyIndexArray(this._unit, indexArray);
		
		this._posSelector.setUnitOnly(this._unit, weapon, indexArray, PosMenuType.Attack, filter);
		this.setFirstPos();
	}
});

//使用時にPreAttack
var BattleItemUse = defineObject(BaseItemUse, {
	_itemUseParent: null,
	_preAttack: null,
	
	enterMainUseCycle: function(itemUseParent) {
		this._itemUseParent = itemUseParent;
		this._preAttack = createObject(PreAttack);
		var attackParam = this._createAttackParam();
		
		return this._preAttack.enterPreAttackCycle(attackParam);
	},
	
	moveMainUseCycle: function() {
		return this._preAttack.movePreAttackCycle();
	},
	
	drawMainUseCycle: function() {
		this._preAttack.drawPreAttackCycle();
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	},
	
	_createAttackParam: function() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var attackParam = StructureBuilder.buildAttackParam();
		
		attackParam.unit = itemTargetInfo.unit;
		attackParam.targetUnit = itemTargetInfo.targetUnit;
		attackParam.attackStartType = AttackStartType.NORMAL;
		
		return attackParam;
	}
});

//種類と射程
var BattleItemInfo = defineObject(BaseItemInfo, {
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Battle));
		y += ItemInfoRenderer.getSpaceY();
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	},
	
	getInfoPartsCount: function() {
		return 2;
	}
});

var BattleItemAvailability = defineObject(BaseItemAvailability, {
	isItemAllowed: function(unit, targetUnit, item) {
		//武器がないと使えない
		return ItemControl.getEquippedWeapon(unit) !== null;
	}
});

//基本スコアは攻撃と同値
var BattleItemAI = defineObject(BaseItemAI, {
	getItemScore: function(unit, combination) {
		var score = 0;
		var weapon = ItemControl.getEquippedWeapon(unit);
		if(weapon === null) {
			return 0;
		}
		
		// combination.itemを一時的に変更する
		var tempItem = combination.item;
		combination.item = weapon;
		
		score = AIScorer.Weapon._getTotalScore(unit, combination);
		
		// combination.itemを戻す(いらない)
		combination.item = tempItem;
		
		if (score < 0) {
			return -1;
		}
		
		return score + BattleItem_PlusScore;
	}
});

})();
