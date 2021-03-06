/*------------------------------------------------------------------------------
環境データ(environment.evs)にシステム変数を作成します。
これは各セーブデータで共有されます。

使用方法：
①オリジナルデータにシステム変数を作成してください(表示されていなければツール→オプション→上級)
このデータのIDがシステム変数のIDになります。
名前、説明、数値1(初期値)を使用します。
グループ番号に応じて後述のVariableBaseDataIndexを変更してください。

②「スクリプトの実行」→「コード実行」または「イベント(コマンド)の実行条件」→「スクリプト」
実行条件の書き方がわからない場合は戻り値を変数で受け取って変数条件にした方がいいかもしれません。

==================================================

EnvironmentControl.getVariable(id)
 id:システム変数のID
システム変数を取得します。存在しないIDなら0になります。
「戻り値を変数で受け取る」にチェックを入れてください。

EnvironmentControl.setVariable(id)
 id:システム変数のID
システム変数を設定します。「オリジナルデータ」タブの数値1に値を入力してください。
存在しないIDは新たに作成されるので注意してください。

EnvironmentControl.addVariable(id)
 id:システム変数のID
システム変数に加算します。「オリジナルデータ」タブの数値1に値を入力してください。

EnvironmentControl.clearVariable()
システム変数を全て消去し、オリジナルデータに従って初期値を設定し直します。

==================================================


■その他
ゲーム中でシステム変数一覧を見たい場合は、スイッチ・変数調整画面の変更プラグインを導入してください。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.223

------------------------------------------------------------------------------*/
(function() {

//オリジナルデータのインデックス(グループ番号-1)
//グループ1～10→0～9
var VariableBaseDataIndex = 0;

/*----------------------------------------------------------
変数操作
------------------------------------------------------------*/
var VariablePropertyName = 'systemVariables';

EnvironmentControl.initVariable = function() {
	var env = root.getExternalData().env;
	if(typeof env[VariablePropertyName] === 'undefined') {
		this.clearVariable();
	}
};

EnvironmentControl.getVariableDataList = function() {
	return root.getBaseData().getOriginalDataList(VariableBaseDataIndex);
};

EnvironmentControl.getVariables = function() {
	var env = root.getExternalData().env;
	return env[VariablePropertyName] || null;
};

EnvironmentControl.clearVariable = function() {
	var env = root.getExternalData().env;
	env[VariablePropertyName] = [];
	
	var list = this.getVariableDataList();
	var data;
	for(var i=0; i<list.getCount(); i++) {
		data = list.getData(i);
		this.setVariable(data.getId(), data.getOriginalContent().getValue(0));
	}
};

EnvironmentControl.getVariable = function(id) {
	var arr = this.getVariables();
	return arr[id] || 0;
};

EnvironmentControl.setVariable = function(id, value) {
	if(typeof value === 'undefined') {
		value = root.getEventCommandObject().getOriginalContent().getValue(0);
	}
	
	var arr = this.getVariables();
	if(id >= 0) {
		arr[id] = value;
	}
};

EnvironmentControl.addVariable = function(id, value) {
	if(typeof value === 'undefined') {
		value = root.getEventCommandObject().getOriginalContent().getValue(0);
	}
	
	this.setVariable(id, this.getVariable(id) + value);
};

/*----------------------------------------------------------
起動時に初期化
------------------------------------------------------------*/
var _SetupControl_setup = SetupControl.setup;
SetupControl.setup = function() {
	_SetupControl_setup.call(this);
	EnvironmentControl.initVariable();
};

})();
