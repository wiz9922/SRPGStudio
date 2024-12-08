/*------------------------------------------------------------------------------
HPゲージの色(画像)を残りHPによって変更します。

■使用方法
下記colorIndexArrayの数値を設定してください。
リソース使用箇所→UI→HPゲージで使われる画像4種のうち上から0,1,2,3となります。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.304

■更新履歴
2022/04/24 作成
2024/12/08 リアル戦闘、簡易戦闘、回復に対応

------------------------------------------------------------------------------*/
(function() {

//左から「HP全快」「HP1/2以上」「HP1/4以上」「HP1/4未満」のゲージ画像
var colorIndexArray = [1, 1, 3, 3];

//------------------------------------------------------------------------------
var getGaugeColorIndex = function(cur, max) {
	var colorIndex;
	
	//FULL
	if(cur >= max) {
		colorIndex = colorIndexArray[0];
	}
	//NONFULL
	else if(cur >= max / 2) {
		colorIndex = colorIndexArray[1];
	}
	//HALF
	else if(cur >= max / 4){
		colorIndex = colorIndexArray[2];
	}
	//QUARTER
	else {
		colorIndex = colorIndexArray[3];
	}
	
	return colorIndex;
};

ContentRenderer.drawUnitHpZoneEx = function(x, y, unit, pic, mhp) {
		var hp = unit.getHp();
		var colorIndex = getGaugeColorIndex(hp, mhp);
		
		this.drawHp(x, y, hp, mhp);
		
		y += 20;
		this.drawGauge(x, y, hp, mhp, colorIndex, 110, pic);
};

var _GaugeBar_setGaugeInfo = GaugeBar.setGaugeInfo;
GaugeBar.setGaugeInfo = function(value, maxValue, colorIndex) {
	var colorIndex = getGaugeColorIndex(value, maxValue);
	_GaugeBar_setGaugeInfo.call(this, value, maxValue, colorIndex);
};

GaugeBar.setColorIndex = function(colorIndex) {
	this._colorIndex = colorIndex;
};

//リアル戦闘
var _UIBattleLayout__drawHpArea = UIBattleLayout._drawHpArea;
UIBattleLayout._drawHpArea = function(unit, isRight) {
	var gauge, hp, mhp;
	if (isRight) {
		gauge = this._gaugeRight;
		hp = gauge.getBalancer().getCurrentValue();
		mhp = gauge.getBalancer().getMaxValue();
	}
	else {
		gauge = this._gaugeLeft;
		hp = gauge.getBalancer().getCurrentValue();
		mhp = gauge.getBalancer().getMaxValue();
	}
	gauge.setColorIndex(getGaugeColorIndex(hp, mhp));
	
	_UIBattleLayout__drawHpArea.call(this, unit, isRight);
};

//簡易戦闘
var _EasyAttackWindow__drawHP = EasyAttackWindow._drawHP;
EasyAttackWindow._drawHP = function(xBase, yBase) {
	var hp, mhp;
	if (this._unit !== null) {
		hp = this._gaugeBar.getBalancer().getCurrentValue();
		mhp = this._gaugeBar.getBalancer().getMaxValue();
		this._gaugeBar.setColorIndex(getGaugeColorIndex(hp, mhp));
	}
	
	_EasyAttackWindow__drawHP.call(this, xBase, yBase);
};

//回復
var _RecoveryWindow_drawWindowContent = RecoveryWindow.drawWindowContent;
RecoveryWindow.drawWindowContent = function(xBase, yBase) {
	var hp = this._gaugeBar.getBalancer().getCurrentValue();
	var	mhp = this._gaugeBar.getBalancer().getMaxValue();
	this._gaugeBar.setColorIndex(getGaugeColorIndex(hp, mhp));
	
	_RecoveryWindow_drawWindowContent.call(this, xBase, yBase);
};

})();
