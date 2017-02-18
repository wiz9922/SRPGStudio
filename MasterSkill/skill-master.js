/*--------------------------------------------------------------------------------------------------
特定の武器タイプを装備している場合にボーナスを得ることができます。

使用方法:
スキルでカスタムを選択し、キーワードに「master」と設定してください。
スキルにカスタムパラメータを設定してください。

{
	wcate:0,
	wtype:0,
	pow_bonus:2,
	hit_bonus:10,
	avd_bonus:10,
	crt_bonus:5,
	crtavd_bonus:5,
	agi_bonus:1
}

wcate:武器カテゴリ(0:戦士系、1:弓兵系、2:魔法系)
wtype:武器タイプID
(以下、省略可)
pow_bonus:攻撃ボーナス
hit_bonus:命中ボーナス
avd_bonus:回避ボーナス
crt_bonus:必殺ボーナス
crtavd_bonus:必殺回避ボーナス
agi_bonus:敏捷ボーナス

■作成者
wiz
改変元:Milele氏、1-239氏(統合Cal)

■対応バージョン
SRPG Stduio Version:1.109

--------------------------------------------------------------------------------------------------*/

(function() {

var BonusType = {
	POW:0,
	HIT:1,
	AVD:2,
	CRT:3,
	CRTAVD:4,
	AGI:5
};
var checkMaster = function(unit, type) {
	var value = 0;
	var weapon = ItemControl.getEquippedWeapon(unit);
	var skill = SkillControl.getPossessionCustomSkill(unit,'master');
	
	if(skill && weapon != null) {
		if(weapon.getWeaponType().getWeaponCategoryType() === skill.custom.wcate &&
		   weapon.getWeaponType().getId() === skill.custom.wtype) {
			switch(type) {
				case BonusType.POW:
					if(typeof skill.custom.pow_bonus === 'number') {
						value += skill.custom.pow_bonus;
					}
					break;
				case BonusType.HIT:
					if(typeof skill.custom.hit_bonus === 'number') {
						value += skill.custom.hit_bonus;
					}
					break;
				case BonusType.AVD:
					if(typeof skill.custom.avd_bonus === 'number') {
						value += skill.custom.avd_bonus;
					}
					break;
				case BonusType.CRT:
					if(typeof skill.custom.crt_bonus === 'number') {
						value += skill.custom.crt_bonus;
					}
					break;
				case BonusType.CRTAVD:
					if(typeof skill.custom.crtavd_bonus === 'number') {
						value += skill.custom.crtavd_bonus;
					}
					break;
				case BonusType.AGI:
					if(typeof skill.custom.agi_bonus === 'number') {
						value += skill.custom.agi_bonus;
					}
					break;
				default:
					value = 0;
					break;
			}
		}
	}
	
	return value;
};

//攻撃
var alias1 = AbilityCalculator.getPower;
AbilityCalculator.getPower = function(unit, weapon) {
	var pow = alias1.call(this, unit, weapon);
	pow += checkMaster(unit, BonusType.POW);
	return pow;
};

//命中
var alias2 = AbilityCalculator.getHit;
AbilityCalculator.getHit = function(unit, weapon) {
	var hit = alias2.call(this, unit, weapon);
	hit += checkMaster(unit, BonusType.HIT);
	return hit;
};

//回避
var alias3 = AbilityCalculator.getAvoid;
AbilityCalculator.getAvoid = function(unit) {
	var avoid = alias3.call(this, unit);
	avoid += checkMaster(unit, BonusType.AVD);
	return avoid;
};

//必殺
var alias4 = AbilityCalculator.getCritical;
AbilityCalculator.getCritical = function(unit, weapon) {
	var crt = alias4.call(this, unit, weapon);
	crt += checkMaster(unit, BonusType.CRT);
	return crt;
};

//必殺回避
var alias5 = AbilityCalculator.getCriticalAvoid;
AbilityCalculator.getCriticalAvoid = function(unit) {
	var crtavd = alias5.call(this, unit);
	crtavd += checkMaster(unit, BonusType.CRTAVD);
	return crtavd;
};

//敏捷
var alias6 = AbilityCalculator.getAgility;
AbilityCalculator.getAgility = function(unit, weapon) {
	var agi = alias6.call(this, unit, weapon);
	agi += checkMaster(unit, BonusType.AGI);
	return agi;
};

})();
