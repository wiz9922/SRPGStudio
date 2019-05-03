/*----------------------------------------------------------
経験値獲得画面をバー表示に変更(描画版)
経験値獲得画面で、ユニットの現在経験値をバーにして表示します。
本スクリプトは画像を使用しないで直接描画するタイプです。

使用方法:
Pluginフォルダにこのファイルを置いてください
色などをお好みでカスタマイズしてください

■作成者
名前未定(仮) (改変元)
wiz

■対応バージョン
SRPG Studio Version:1.130

----------------------------------------------------------*/

//バーの色(16進RGB)
var ExpGaugeColor = 0xffd700;

//バーの空白色(16進RGB)
var ExpGaugeColorEmpty = 0x400000;

//バーのフレーム色(16進RGB)
var ExpGaugeColorFrame = 0xdaa520;

//バーのサイズ(横、縦)
var ExpGaugeWidth = 100;
var ExpGaugeHeight = 10;

//バーの増加スピード(低いほど速い、デフォルトは10)
var ExpGaugeSpeed = 20;

// カンスト時の「Max」表示（true:「Max」を表示、false:表示しない）
var isLvMaxDisplay = false;

//-----------------------------
// リアル戦闘
//-----------------------------
RealExperienceFlowEntry._prepareMemberData= function(coreAttack) {
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._unit = attackFlow.getPlayerUnit();
		this._getExp = order.getExp();
		this._growthArray = null;
		this._experienceNumberView = createWindowObject(ExperienceNumberView2, this);	// 経験値表示をバーゲージ方式に切替
		this._levelupView = createObject(LevelupView);
};

RealExperienceFlowEntry._completeMemberData= function(coreAttack) {
		// 戦闘がリアル形式でない場合は続行しない
		if (!coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}
		
		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		
		// obtainExperience()でユニットに経験値が加算される前にsetExperienceNumberData()を呼び出す
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);

		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// スキップ時は、直ちに経験値を与える
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
//		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		this.changeCycleMode(RealExperienceMode.WINDOW);
		
		return EnterResult.OK;
};

//-----------------------------
// 簡易戦闘
//-----------------------------
EasyExperienceFlowEntry._prepareMemberData= function(coreAttack) {
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._unit = attackFlow.getPlayerUnit();
		this._getExp = order.getExp();
		this._growthArray = null;
		this._experienceNumberView = createWindowObject(ExperienceNumberView2, this);	// 経験値表示をバーゲージ方式に切替
		this._levelupView = createObject(LevelupView);
};


EasyExperienceFlowEntry._completeMemberData= function(coreAttack) {
		if (coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}
		
		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		
		// obtainExperience()でユニットに経験値が加算される前にsetExperienceNumberData()を呼び出す
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);

		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// スキップ時は、直ちに経験値を与える
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
//		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		this.changeCycleMode(EasyExperienceMode.WINDOW);
		
		return EnterResult.OK;
};

//-----------------------------
// 経験値取得イベントコマンド
//-----------------------------
ExperiencePlusEventCommand._prepareEventCommandMemberData= function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._getExp = eventCommandData.getExperienceValue();
		this._type = eventCommandData.getExperiencePlusType();
		this._targetUnit = eventCommandData.getTargetUnit();
		this._levelupView = createObject(LevelupView);
		this._experienceNumberView = createWindowObject(ExperienceNumberView2, this);	// 経験値表示をバーゲージ方式に切替
		this._growthArray = null;
		this._isMaxLv = false;

		if (this._targetUnit !== null) {
			// obtainExperience()でユニットに経験値が加算される前にsetExperienceNumberData()を呼び出す
			this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._getExp);
			
			this._isMaxLv = this._targetUnit.getLv() >= Miscellaneous.getMaxLv(this._targetUnit);
			if (!this._isMaxLv && this._type === ExperiencePlusType.VALUE) {
				this._growthArray = ExperienceControl.obtainExperience(this._targetUnit, this._getExp);
			}
		}
};


ExperiencePlusEventCommand._completeEventCommandMemberData= function() {
//		this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._getExp);
		
		this.changeCycleMode(ExperiencePlusMode.EXP);
		
		return EnterResult.OK;
};

//-----------------------------
// 経験値表示クラス(バー表示形式)
//-----------------------------

var ExperienceNumberView2 = defineObject(ExperienceNumberView,	// ExperienceNumberViewの派生クラス
{
	_gauge: null,
	_isMaxLv: false,

	// 経験値表示用の設定
	setExperienceNumberData: function(unit, exp) {
		var max,lim;
		var lv, mlv, max_exp;
		
		if (exp === 1) {
			// 習得経験値が1でも、音が再生されるようにする
			max = 0;
		}
		else {
			max = 2;
		}

		// ユニットレベルが上限LV-1で、入手経験値を加算すると経験値が100を超えてしまう場合、ぴったり100になるよう調整する
		lv = unit.getLv();
		mlv = Miscellaneous.getMaxLv(unit);
		if( lv == (mlv-1) ) {
			max_exp = 100 - unit.getExp();

			// レベルMaxに到達したか？
			if( exp >= max_exp ) {
				this._isMaxLv = true;
			}

			// レベルMaxの場合、獲得経験値をぴったりレベルアップする量に補正する
			if( exp > max_exp ) {
				exp = max_exp;
			}
		}

		lim = unit.getExp();
		this._unit = unit;
		this._exp = exp;
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(lim, 200);
		this._balancer.setBalancerSpeed(ExpGaugeSpeed);
		this._balancer.startBalancerMove(exp);
		
		this._gauge = createObject(GaugeBarShape);				// バーゲージオブジェクトを生成

		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(max);
		this.changeCycleMode(ExperienceNumberMode.COUNT);
	},


	// 経験値の描画（バーゲージ）
	_drawExp: function(x, y) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this._getTitlePartsCount();
		var exp = this._balancer.getCurrentValue();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);

		// バーゲージを描画
		this._gauge.setGaugeInfo( (exp % 100), 100);
		this._gauge.drawGaugeBar(x+20, y+26);
		
		// 数値とGetExpの描画
		x += 140;
		y += 16;

		if( this.isMaxLvUp(exp) == true ) {
			TextRenderer.drawText(x + 10, y + 8, 'Max', -1, color, font);
		}
		else {
			NumberRenderer.drawNumber(x, (y+2), (exp % 100) );
			TextRenderer.drawText(x + 15, y + 8, 'Exp', -1, color, font);
		}
	},

	// レベル上限に到達したか
	isMaxLvUp: function(exp) {
		if( isLvMaxDisplay == true ) {
			if( this._isMaxLv == true && exp == 100 ) {
				return true;
			}
		}
		return false;
	}
}
);

//-----------------------------
// 経験値用バーゲージクラス
//-----------------------------
var GaugeBarShape = defineObject(GaugeBar, 
{
	setGaugeInfo: function(value, maxValue) {
		this._balancer.setBalancerInfo(value, maxValue);
	},
	
	drawGaugeBar: function(x, y) {
		var i;
		var curValue = this._balancer.getCurrentValue();
		var maxValue = this._balancer.getMaxValue();
		var w = ExpGaugeWidth;
		var h = ExpGaugeHeight;
		var w2 = w * (curValue / maxValue);
		
		var canvas = root.getGraphicsManager().getCanvas();
		
		//ゲージ
		canvas.setStrokeInfo(ExpGaugeColorFrame, 255, 2, true);
		canvas.setFillColor(ExpGaugeColor, 255);
		this.drawShape(x, y, w, h, canvas);
		
		//空白部
		canvas.setFillColor(ExpGaugeColorEmpty, 255);
		this.drawShape(x+w2, y, w-w2, h, canvas);
	},
	
	drawShape: function(x, y, w, h, canvas) {
		canvas.drawRectangle(x, y, w, h);
	}
}
);
