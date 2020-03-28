/*--------------------------------------------------------------------------------------------------
属性によるダメージ変化を設定します。

使用方法:
ユニット、クラス、アイテム、スキル、地形、ステートにカスタムパラメータを設定してください。
未設定時は0として扱われます。

{
	attribute: {
		type: 2,
		pow_2:50, 
		res_1:-50,
		res_4:50
	}
}

(それぞれ省略可)
type: 付与する攻撃属性の種類(_AttrNameの順に0,1,2,...)
pow_n: n番目の属性強化値
res_n: n番目の属性耐性値

Q.属性を増やしたい！減らしたい！名前変えたい！
A._Attribute内を変更してください

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.111

■更新履歴
2017/01/20	作成
2017/01/23	地形に対応、アイテム情報の項目追加、非表示設定追加
2020/03/23	ダメージがマイナスの時に調整されていなかったのを修正

--------------------------------------------------------------------------------------------------*/
var AttrParamType = {
	TYPE: 0,
	ENHANCE: 1,
	RESIST: 2
};

var AttributeControl = {
	
	//基本倍率(%)
	_BaseEnhanceValue: 100,
	_BaseResistValue: 100,
	
	/*------------------------------------------------
	属性の種類
	name:名称
	show:表示するものはtrue、非表示しないものはfalse
	-------------------------------------------------*/
	_Attribute: [
		{name: '無', show: true},
		{name: '火', show: true},
		{name: '水', show: true},
		{name: '風', show: true},
		{name: '地', show: true}
	],
	
	//objのnullチェック+属性の設定がされているか
	_isAttributeCustom: function(obj) {
		if(obj == null) {
			return false;
		}
		if(typeof obj.custom.attribute === 'undefined') {
			return false;
		}
		return true;
	},
	
	//名称取得
	getName: function(type) {
		return this._Attribute[type].name;
	},
	
	//非表示チェック
	isShow: function(type) {
		return this._Attribute[type].show;
	},
	
	//個数取得
	getCount: function() {
		return this._Attribute.length;
	},
	
	//個数取得(表示するものだけ)
	getShowCount: function() {
		var i, count, count2;
		count = this.getCount();
		count2 = 0;
		for(i=0; i<count; i++) {
			if(this.isShow(i)) count2++;
		}
		return count2;
	},
	
	//objのカスパラから攻撃属性の種類を取得
	getAttackType: function(obj) {
		if(!this._isAttributeCustom(obj)) {
			return 0;
		}
		if(typeof obj.custom.attribute.type !== 'number') {
			return 0;
		}
		return obj.custom.attribute.type;
	},
	
	//objのカスパラから属性強化値を取得
	getEnhance: function(obj, type) {
		if(!this._isAttributeCustom(obj)) {
			return 0;
		}
		if(typeof obj.custom.attribute["pow_" + type] !== 'number') {
			return 0;
		}
		return obj.custom.attribute["pow_" + type];
	},
	
	//objの属性強化のカスパラ個数を取得(表示用)
	getEnhanceCount: function(obj) {
		var i, n, count;
		
		count = this.getCount();
		n = 0;
		for(i=0; i<count; i++) {
			if(!this.isShow(i)) {
				continue;
			}
			if(this.getEnhance(obj, i) !== 0) {
				n++;
			}
		}
		return n;
	},
	
	//objのカスパラから属性耐性値を取得
	getResist: function(obj, type) {
		if(!this._isAttributeCustom(obj)) {
			return 0;
		}
		if(typeof obj.custom.attribute["res_" + type] !== 'number') {
			return 0;
		}
		return obj.custom.attribute["res_" + type];
	},
	
	//objの属性耐性のカスパラ個数を取得(表示用)
	getResistCount: function(obj) {
		var i, n, count;
		
		count = this.getCount();
		n = 0;
		for(i=0; i<count; i++) {
			if(!this.isShow(i)) {
				continue;
			}
			if(this.getResist(obj, i) !== 0) {
				n++;
			}
		}
		return n;
	},
	
	//ユニットの攻撃属性の種類を取得
	getUnitAttackType: function(unit) {
		var list, count, unitClass, weapon, item, skill, terrain, state;
		var type = 0;
		
		//typeは上書き(優先順位は後のものほど高い)
		//ユニット
		if(this.getAttackType(unit) !== 0) {
			type = this.getAttackType(unit);
		}
		
		//クラス
		unitClass = unit.getClass();
		if(this.getAttackType(unitClass) !== 0) {
			type = this.getAttackType(unitClass);
		}
		
		//武器・アイテム
		weapon = ItemControl.getEquippedWeapon(unit);
		if(this.getAttackType(weapon) !== 0) {
			type = this.getAttackType(weapon);
		}
		count = UnitItemControl.getPossessionItemCount(unit);
		for(i=0; i<count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if(item != null && !item.isWeapon() && ItemControl.isItemUsable(unit, item)) {
				if(this.getAttackType(item) !== 0) {
					type = this.getAttackType(item);
				}
			}
		}
		
		//スキル
		list = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		count = list.length;
		for(i=0; i<count; i++) {
			skill = list[i].skill;
			if(this.getAttackType(skill) !== 0) {
				type = this.getAttackType(skill);
			}
		}
		
		//地形
		terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		if (terrain !== null) {
			if(this.getAttackType(terrain) !== 0) {
				type = this.getAttackType(terrain);
			}
		}
		
		//ステート
		list = unit.getTurnStateList();
		count = list.getCount();
		for(i=0; i<count; i++) {
			state = list.getData(i).getState();
			if(this.getAttackType(state) !== 0) {
				type = this.getAttackType(state);
			}
		}
		
		return type;
	},
	
	//ユニットの属性強化値の合計を取得
	getUnitEnhance: function(unit, type) {
		var list, count, unitClass, weapon, item, skill, terrain, state;
		var value = this._BaseEnhanceValue;
		
		//ユニット
		value += this.getEnhance(unit, type);
		
		//クラス
		unitClass = unit.getClass();
		value += this.getEnhance(unitClass, type);
		
		//武器・アイテム
		weapon = ItemControl.getEquippedWeapon(unit);
		value += this.getEnhance(weapon, type);
		count = UnitItemControl.getPossessionItemCount(unit);
		for(i=0; i<count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if(item != null && !item.isWeapon() && ItemControl.isItemUsable(unit, item)) {
				value += this.getEnhance(item, type);
			}
		}
		
		//スキル
		list = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		count = list.length;
		for(i=0; i<count; i++) {
			skill = list[i].skill;
			value += this.getEnhance(skill, type);
		}
		
		//地形
		terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		if (terrain !== null) {
			value += this.getEnhance(terrain, type);
		}
		
		//ステート
		list = unit.getTurnStateList();
		count = list.getCount();
		for(i=0; i<count; i++) {
			state = list.getData(i).getState();
			value += this.getEnhance(state, type);
		}
		
		if(value < 0) {
			value = 0;
		}
		
		return value;
	},
	
	//ユニットの属性耐性値の合計を取得
	getUnitResist: function(unit, type) {
		var list, count, unitClass, weapon, item, skill, terrain, state;
		var value = this._BaseResistValue;
		
		//ユニット
		value += this.getResist(unit, type);
		
		//クラス
		unitClass = unit.getClass();
		value += this.getResist(unitClass, type);
		
		//武器・アイテム
		weapon = ItemControl.getEquippedWeapon(unit);
		value += this.getResist(weapon, type);
		count = UnitItemControl.getPossessionItemCount(unit);
		for(i=0; i<count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if(item != null && !item.isWeapon() && ItemControl.isItemUsable(unit, item)) {
				value += this.getResist(item, type);
			}
		}
		
		//スキル
		list = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		count = list.length;
		for(i=0; i<count; i++) {
			skill = list[i].skill;
			value += this.getResist(skill, type);
		}
		
		//地形
		terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		if (terrain !== null) {
			value += this.getResist(terrain, type);
		}
		
		//ステート
		list = unit.getTurnStateList();
		count = list.getCount();
		for(i=0; i<count; i++) {
			state = list.getData(i).getState();
			value += this.getResist(state, type);
		}
		
		if(value < 0) {
			value = 0;
		}
		
		return value;
	},
	
	//倍率計算
	calculateMagnification: function(active, passive) {
		var type = this.getUnitAttackType(active);
		return (this.getUnitEnhance(active, type) / 100) * (this.getUnitResist(passive, type) / 100);
	},
	
	//ダメージ変化判定
	checkMagnification: function(active, passive) {
		var mag = this.calculateMagnification(active, passive);
		
		//100%
		if(mag === 1) {
			return 0;
		}
		//100%より小さい
		else if(mag < 1) {
			return -1;
		}
		//100%より大きい
		else if(mag > 1) {
			return 1;
		}
		return 0;
	}
};

//============================================================================================
(function() {

var alias1 = DamageCalculator.validValue;
DamageCalculator.validValue = function(active, passive, weapon, damage) {
	
	//属性を考慮したダメージ計算
	var mag = AttributeControl.calculateMagnification(active, passive);
	damage = Math.floor(damage * mag);
	
	damage = alias1.call(this, active, passive, weapon, damage);
	
	return damage;
};

})();
