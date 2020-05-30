/*------------------------------------------------------------------------------
敵の攻撃の際、特定の難易度であればAIが単純化します
ダメージも命中も必殺も関係なくなります

使用方法:
難易度のカスタムパラメータ
{
	aiType:0
}
aiTypeが0なら、HPの高いユニットを狙うようになります
aiTypeが1なら、HPの低いユニットを狙うようになります

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.211

------------------------------------------------------------------------------*/
(function() {

var getCustomParameter = function(obj, key, defValue) {
	if(obj === null) {
		return defValue;
	}
	if(!obj.custom.hasOwnProperty(key)) {
		return defValue;
	}
	return obj.custom[key];
};

var AIType = {
	HP_LARGE: 0,
	HP_SMALL: 1
};

var _AIScorer_Weapon__getTotalScore = AIScorer.Weapon._getTotalScore;
AIScorer.Weapon._getTotalScore = function(unit, combination) {
	var type;
	var score = 0;
	var difficulty = root.getMetaSession().getDifficulty();
	var type = getCustomParameter(difficulty, 'aiType', -1);
	
	if(type === AIType.HP_LARGE) {
		score = this._getHpLargeScore(unit, combination);
	}
	else if(type === AIType.HP_SMALL) {
		score = this._getHpSmallScore(unit, combination);
	}
	else {
		score = _AIScorer_Weapon__getTotalScore.call(this, unit, combination);
	}
	
	return score;
};

AIScorer.Weapon._getHpLargeScore = function(unit, combination) {
	var score = 0;
	var hp = combination.targetUnit.getHp();
	
	score += Miscellaneous.convertAIValue(hp);
	
	return score;
};

AIScorer.Weapon._getHpSmallScore = function(unit, combination) {
	var score = 0;
	var hp = combination.targetUnit.getHp();
	var limitHp = DataConfig.getMaxParameter(0);
	
	score += Miscellaneous.convertAIValue(limitHp - hp);
	
	return score;
};

})();
