/*----------------------------------------------------------
経験値分配画面に以下の機能を追加します。
・数値入力で←→キーを押すと一定量増減(デフォルト10ずつ)
・変換前に確認メッセージ追加

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.191
----------------------------------------------------------*/

(function() {

//←→キーの増減値
var ChangeValue = 10;

//-----------------------------------------------
ExperienceDistributionScreenMode.QUESTION = 4;

//確認メッセージ
var _ExperienceDistributionScreen_moveScreenCycle = ExperienceDistributionScreen.moveScreenCycle;
ExperienceDistributionScreen.moveScreenCycle = function() {
	var mode = this.getCycleMode();
	var result = _ExperienceDistributionScreen_moveScreenCycle.call(this);
	if(result === MoveResult.CONTINUE) {
		if (mode === ExperienceDistributionScreenMode.QUESTION) {
			result = this._moveQuestion();
		}
	}
	return result;
};

var _ExperienceDistributionScreen_drawScreenCycle = ExperienceDistributionScreen.drawScreenCycle;
ExperienceDistributionScreen.drawScreenCycle = function() {
	_ExperienceDistributionScreen_drawScreenCycle.call(this);
	if (this.getCycleMode() === ExperienceDistributionScreenMode.QUESTION) {
		this._drawQuestionWindow();
	}
};

var _ExperienceDistributionScreen__prepareScreenMemberData = ExperienceDistributionScreen._prepareScreenMemberData;
ExperienceDistributionScreen._prepareScreenMemberData = function(screenParam) {
	_ExperienceDistributionScreen__prepareScreenMemberData.call(this, screenParam);
	this._questionWindow = createWindowObject(QuestionWindow, this);
};

var _ExperienceDistributionScreen__completeScreenMemberData = ExperienceDistributionScreen._completeScreenMemberData;
ExperienceDistributionScreen._completeScreenMemberData = function(screenParam) {
	_ExperienceDistributionScreen__completeScreenMemberData.call(this, screenParam);
	this._questionWindow.setQuestionMessage('');
};

ExperienceDistributionScreen._moveInput = function() {
		if (this._bonusInputWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._bonusInputWindow.getInputExp() === -1) {
				this._processMode(ExperienceDistributionScreenMode.TOP);
			}
			else {
				this._setQuestionMessage();
				this._questionWindow.setQuestionActive(true);
				this._processMode(ExperienceDistributionScreenMode.QUESTION);
			}
		}
		
		return MoveResult.CONTINUE;
};

ExperienceDistributionScreen._moveQuestion = function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._changeBonus();
				this._processMode(ExperienceDistributionScreenMode.LEVEL);
			}
			else {
				this._processMode(ExperienceDistributionScreenMode.INPUT);
			}
		}
		
		return MoveResult.CONTINUE;
};
	
ExperienceDistributionScreen._drawQuestionWindow = function() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		this._questionWindow.drawWindow(x, y);
};

ExperienceDistributionScreen._setQuestionMessage = function() {
	var bonus = this._bonusInputWindow.convertExpToBonus();
	var exp = this._bonusInputWindow.getInputExp();
	var message = bonus + StringTable.CurrencySign_Bonus + 'を' + exp + StringTable.Status_Experience + 'に変換しますか？';
	this._questionWindow.setQuestionMessage(message);
};

ExperienceDistributionScreen._changeBonus = function() {
	var bonus = root.getMetaSession().getBonus();
	bonus -= this._bonusInputWindow.convertExpToBonus();
	root.getMetaSession().setBonus(bonus);
};

//変換レート
BonusInputWindow.convertExpToBonus = function() {
	return Math.floor(this._exp * this._getRate());
};

//増減値操作
BonusInputWindow._moveInput = function() {
		var inputType;
		
		if (InputControl.isSelectAction()) {
			//ボーナス消費はScreen側で行う
			//this._changeBonus();
			return MoveResult.END;
		}
		
		if (InputControl.isCancelAction()) {
			this._cancelExp();
			return MoveResult.END;
		}
		
		inputType = this._commandCursor.moveCursor();
		if (inputType === InputType.UP || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			if (++this._exp > this._max) {
				this._exp = 1;
			}
		}
		else if (inputType === InputType.DOWN || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			if (--this._exp < 1) {
				this._exp = this._max;
			}
		}
		//左右の動作
		else if (inputType === InputType.RIGHT) {
			this._exp += ChangeValue;
			if (this._exp > this._max) {
				this._exp = this._max;
			}
		}
		else if (inputType === InputType.LEFT) {
			this._exp -= ChangeValue;
			if (this._exp < 1) {
				this._exp = 1;
			}
		}
		
		return MoveResult.CONTINUE;
};

})();