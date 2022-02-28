/*------------------------------------------------------------------------------
「発動時に表示する」にチェックを入れていないカスタムスキルは、スキル情報ウィンドウで発動率が非表示になります。

■作成者
wiz

■対応バージョン
SRPG Stduio Ver1.254
------------------------------------------------------------------------------*/
(function() {

var _SkillInfoWindow__isInvocationType = SkillInfoWindow._isInvocationType;
SkillInfoWindow._isInvocationType = function() {
	if (this._skill === null) {
		return false;
	}
	
	if(this._skill.getSkillType() === SkillType.CUSTOM && !this._skill.isSkillDisplayable()) {
		return false;
	}
	
	return _SkillInfoWindow__isInvocationType.call(this);
};

})();
