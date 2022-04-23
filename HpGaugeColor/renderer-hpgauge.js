/*------------------------------------------------------------------------------
HPゲージの色(画像)を残りHPによって変更します。
戦闘画面のゲージも変わりますが、色は戦闘開始時のもので固定です。

■使用方法
下記colorIndexArrayの数値を設定してください。
リソース使用箇所→UI→ユニットHPゲージで使われる画像4種のうち上から0,1,2,3となります。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.257
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

})();
