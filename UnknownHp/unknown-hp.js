/*----------------------------------------------------------
HPが一定以上の時は「???」で表示されるようになります。
HPバーはそのまま。

使い方:
ユニットのカスタムパラメータに「unknownHp」を設定してください。
固定値または割合で指定できます。

使用例:
①HP100以上の時は隠す
{
	unknownHp:100
}

②HP50%以上の時は隠す
{
	unknownHp:'50%'
}

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.111

■注意事項
マップ上のユニットのHP表示(環境で設定できるもの)は変更できないため、
公式スクリプトの「mapunithp-disabled.js」を導入するなどして、非表示にしてください。

----------------------------------------------------------*/

(function() {

Miscellaneous.isUnknownHp = function(unit) {
	var maxHp, nowHp, value, num;
	
	if( unit == null || typeof unit.custom.unknownHp === 'undefined'){
		return false;
	}
	value = unit.custom.unknownHp;
	maxHp = RealBonus.getMhp(unit);
	nowHp = unit.getHp();
	
	var regex = /^([\-]*[0-9]+)\%$/;
	var regexNum = /^([\-]*[0-9]+)$/;
	
	if(typeof value === 'number') {
		num = value;
	}
	else if(value.match(regex))
	{
		num = parseInt(Math.floor( maxHp * (parseInt(RegExp.$1) / 100) ));
	}
	else if( value.match(regexNum) )
	{
		num = parseInt(value);
	}
	
	return nowHp >= num;
};

ContentRenderer.drawUnknownHp = function(x, y) {
	var textHp = this._getHpText();
	var textSlash = '/';
	var dx = [0, 34, 60, 88];
	var unknown = '???';
	
	var textui = root.queryTextUI('default_window');
	var color = textui.getColor();
	var font = textui.getFont();
	
	TextRenderer.drawSignText(x + dx[0], y, textHp);
	TextRenderer.drawKeywordText(x + dx[1], y, unknown, -1, color, font);
	TextRenderer.drawSignText(x + dx[2], y, textSlash);
	TextRenderer.drawKeywordText(x + dx[3], y, unknown, -1, color, font);
};

NumberRenderer.drawAttackUnknownNumber = function(x, y) {
	var unknown = '???';
	
	//大きめのフォントを指定
	var textui = root.queryTextUI('chapter_frame');
	var color = textui.getColor();
	var font = textui.getFont();
	
	var range = createRangeObject(x, y, 48, 24);
	TextRenderer.drawRangeText(range, TextFormat.CENTER, unknown, -1, color, font);
};

//-------------------------------------------------------------------------------
//シンプルウィンドウ、ユニットメニュー、
ContentRenderer.drawUnitHpZone = function(x, y, unit, pic) {
		var hp = unit.getHp();
		var mhp = ParamBonus.getMhp(unit);
		
		if(Miscellaneous.isUnknownHp(unit)) {
			this.drawUnknownHp(x, y);
		}
		else {
			this.drawHp(x, y, hp, mhp);
		}
		
		y += 20;
		this.drawGauge(x, y, hp, mhp, 1, 110, pic);
};

//戦闘前画面
PosBaseWindow.drawInfoTop = function(xBase, yBase) {
		var x = xBase;
		var y = yBase;
		var pic = root.queryUI('unit_gauge');
		var balancer = this._gaugeBar.getBalancer();
		
		if (this._unit !== null) {
			if(Miscellaneous.isUnknownHp(this._unit)) {
				ContentRenderer.drawUnknownHp(x, y + 20);
			}
			else {
				ContentRenderer.drawHp(x, y + 20, balancer.getCurrentValue(), balancer.getMaxValue());
			}
			this._gaugeBar.drawGaugeBar(x, y + 40, pic);
		}
};

//マップユニットウィンドウ簡易表示
MapParts.UnitInfoSmall._drawInfo = function(x, y, unit, textui) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += this.getIntervalY();
		if(Miscellaneous.isUnknownHp(unit)) {
			ContentRenderer.drawUnknownHp(x, y);
		}
		else {
			ContentRenderer.drawHp(x, y, unit.getHp(), ParamBonus.getMhp(unit));
		}
};

//簡易戦闘
EasyAttackWindow._drawHP = function(xBase, yBase) {
		var balancer, textui, color, font;
		var x = xBase;
		var y = yBase;
		var pic = root.queryUI('battle_gauge');
		
		if (this._unit !== null) {
			balancer = this._gaugeBar.getBalancer();
			
			// ここでは、getWindowTextUIを参照しない
			textui = root.queryTextUI('easyattack_window');
			color = textui.getColor();
			font = textui.getFont();
			
			TextRenderer.drawText(x + 20, y + 33, this._getHpText(), -1, color, font);
			if(Miscellaneous.isUnknownHp(this._unit)) {
				NumberRenderer.drawAttackUnknownNumber(x + 70, y + 30);
			}
			else {
				NumberRenderer.drawAttackNumberColor(x + 70, y + 30, balancer.getCurrentValue(), 1, 255);
			}
			this._gaugeBar.drawGaugeBar(x + 10, y + 55, pic);
		}
};

//リアル戦闘
UIBattleLayout._drawHpArea = function(unit, isRight) {
		var x, gauge, hp, xNumber, yNumber;
		var y = 40;
		var dx = 70 + this._getIntervalX();
		var dyNumber = 12;
		var pic = root.queryUI('battle_gauge');
		
		if (isRight) {
			x = this._getBattleAreaWidth() - this._gaugeRight.getGaugeWidth() - dx;
			gauge = this._gaugeRight;
			hp = this._gaugeRight.getBalancer().getCurrentValue();
			
			xNumber = 380 + this._getIntervalX();
			yNumber = y - dyNumber;
			
		}
		else {
			x = dx;
			gauge = this._gaugeLeft;
			hp = this._gaugeLeft.getBalancer().getCurrentValue();
			
			xNumber = 260 + this._getIntervalX();
			yNumber = y - dyNumber;
		}
		
		gauge.drawGaugeBar(x, y, pic);
		
		if(Miscellaneous.isUnknownHp(unit)) {
			//3桁扱いでdx=24
			NumberRenderer.drawAttackUnknownNumber(xNumber - 24, yNumber);
		}
		else {
			NumberRenderer.drawAttackNumberCenter(xNumber, yNumber, hp);
		}
};

//HP回復
RecoveryWindow._drawHpArea = function(x, y) {
		var balancer = this._gaugeBar.getBalancer();
		if(Miscellaneous.isUnknownHp(this._unit)) {
			ContentRenderer.drawUnknownHp(x, y);
		}
		else {
			ContentRenderer.drawHp(x, y, balancer.getCurrentValue(), balancer.getMaxValue());
		}
};

})();