/*----------------------------------------------------------
SceneType.EVENTを無視するため、SceneManagerで現在のシーン判定を行う
------------------------------------------------------------*/
(function() {

BaseScene._sceneType = -1;

BaseScene.getSceneType = function() {
	return this._sceneType;
};

SceneManager.getActiveSceneType = function() {
	return this.getActiveScene().getSceneType();
};

//以下、シーンの数だけ設定
var alias0 = TitleScene.setSceneData;
TitleScene.setSceneData = function() {
	alias0.call(this);
	this._sceneType = SceneType.TITLE;
};

var alias1 = GameOverScene.setSceneData;
GameOverScene.setSceneData = function() {
	alias1.call(this);
	this._sceneType = SceneType.GAMEOVER;
};

var alias2 = EndingScene.setSceneData;
EndingScene.setSceneData = function() {
	alias2.call(this);
	this._sceneType = SceneType.ENDING;
};

var alias3 = BattleSetupScene.setSceneData;
BattleSetupScene.setSceneData = function() {
	alias3.call(this);
	this._sceneType = SceneType.BATTLESETUP;
};

var alias4 = FreeAreaScene.setSceneData;
FreeAreaScene.setSceneData = function() {
	alias4.call(this);
	this._sceneType = SceneType.FREE;
};

var alias5 = BattleResultScene.setSceneData;
BattleResultScene.setSceneData = function() {
	alias5.call(this);
	this._sceneType = SceneType.BATTLERESULT;
};

var alias6 = RestScene.setSceneData;
RestScene.setSceneData = function() {
	alias6.call(this);
	this._sceneType = SceneType.REST;
};

var alias9 = EventTestScene.setSceneData;
EventTestScene.setSceneData = function() {
	alias9.call(this);
	this._sceneType = SceneType.EVENTTEST;
};

})();