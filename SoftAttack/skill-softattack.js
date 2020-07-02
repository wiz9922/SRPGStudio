/*------------------------------------------------------------------------------
発動すると、相手を倒せる攻撃でもHP1だけ残せるスキルが作成できます。
不死身スキル(HP1で生き残る)と同じ効果を相手に与えるイメージです。

使用方法:
スキル種類を「カスタム」、キーワードを「softAttack」に設定してください。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.214
------------------------------------------------------------------------------*/
(function() {

//カスタムスキルのキーワード
var KEYWORD_SOFTATTACK = 'softAttack';

var _AttackEvaluator_ActiveAction_evaluateAttackEntry = AttackEvaluator.ActiveAction.evaluateAttackEntry;
AttackEvaluator.ActiveAction.evaluateAttackEntry = function(virtualActive, virtualPassive, attackEntry) {
	_AttackEvaluator_ActiveAction_evaluateAttackEntry.call(this, virtualActive, virtualPassive, attackEntry);
	
	//ダメージ決定後に変更する
	if(this._isSoftAttack(virtualActive, virtualPassive, attackEntry)) {
		// ダメージを1つ減らすことでHP1で生き残るようにする
		attackEntry.damagePassive--;
		attackEntry.damagePassiveFull = attackEntry.damagePassive;
		
		if (attackEntry.damageActive < 0) {
			// 吸収による回復が生じているため、1つ増やす(回復量が1つ減る)
			attackEntry.damageActive++;
		}
	}
};

AttackEvaluator.ActiveAction._isSoftAttack = function(virtualActive, virtualPassive, attackEntry) {
	var active = virtualActive.unitSelf;
	var passive = virtualPassive.unitSelf;
	return SkillControl.checkAndPushCustomSkill(active, passive, attackEntry, true, KEYWORD_SOFTATTACK) !== null;
};

var _SkillRandomizer_isCustomSkillInvokedInternal = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if(keyword === KEYWORD_SOFTATTACK) {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	
	return _SkillRandomizer_isCustomSkillInvokedInternal.call(this, active, passive, skill, keyword);
};

})();
