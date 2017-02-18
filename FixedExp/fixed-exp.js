/*--------------------------------------------------------------------------
マップ内で以下の経験値を固定します。
・戦闘経験値
・アイテム使用時の経験値
・スキル使用時の経験値

使用方法:
マップのカスタムパラメータを設定してください。
{
    exp: 0
}
exp: この値に固定
  
■作成者
wiz

■対応バージョン
SRPG Studio Version:1.103

--------------------------------------------------------------------------*/

(function() {

//アイテム使用からも呼ばれる
var alias1 = ExperienceCalculator.getBestExperience;
ExperienceCalculator.getBestExperience = function(unit, exp) {
	var fexp = alias1.call(this, unit, exp);
	var session = root.getCurrentSession();
	
	//マップが開かれていて、カスパラの値が設定されていたら経験値固定
	if (root.getCurrentScene() === SceneType.FREE) {
		if (typeof session.getCurrentMapInfo().custom.exp === 'number') {
			fexp = session.getCurrentMapInfo().custom.exp;
		}
	}
	
	return fexp;
};

})();