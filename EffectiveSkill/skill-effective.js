/*------------------------------------------------------------------------------
発動型ではない、有効相手に対して常時特効となるスキルを作成します。
戦闘前ウィンドウのダメージ値にも反映されます。

使用方法：
スキル種類「カスタム」、キーワードは「effective」と設定してください
有効相手に特効対象を設定してください

■作成者
wiz

■対応バージョン
SRPG Stduio Ver1.254

■特記事項
本プラグインはaskot様のご依頼により制作したもので、許諾を得て公開しています。

------------------------------------------------------------------------------*/
(function() {

//常時特効スキル
DamageCalculator.isEffective = function(active, passive, weapon, isCritical, trueHitValue) {
		var skill;
		
		if (trueHitValue === TrueHitValue.EFFECTIVE) {
			return true;
		}
		
		// 相手が「特攻無効」スキルを持っているか調べる
		if (SkillControl.getBattleSkillFromFlag(passive, active, SkillType.INVALID, InvalidFlag.EFFECTIVE) === null) {
			// 相手のユニットに対して、アイテムが特攻であるか調べる
			if (ItemControl.isEffectiveData(passive, weapon)) {
				return true;
			}
			
			//常時特効スキルが有効か調べる
			skill = SkillControl.getPossessionCustomSkill(active, 'effective');
			if(skill && skill.getTargetAggregation().isCondition(passive)) {
				return true;
			}
		}
		
		return false;
};

})();
