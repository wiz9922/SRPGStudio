/*----------------------------------------------------------
イベントによる難易度変更

使用方法:
イベント「スクリプトの実行」で「コードの実行」を選択して、以下のように記述してください
(idには難易度IDを指定)

ChangeDifficulty(id);

■作成者
名前未定(仮) (改変元)
wiz

■対応バージョン
SRPG Studio Version:1.130

----------------------------------------------------------*/

var ChangeDifficulty = function(id)
{
	var difficulty = root.getBaseData().getDifficultyList().getDataFromId(id);
	root.getMetaSession().setDifficulty(difficulty);
}
