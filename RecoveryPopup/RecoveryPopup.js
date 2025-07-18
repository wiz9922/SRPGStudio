/*------------------------------------------------------------------------------
回復イベント(回復アイテムやターン回復も含む)に数値ポップアップを表示します。
環境でダメージポップアップをオンにしている場合に有効となります。

■作成者
wiz

■対応バージョン
SRPG Stduio Version:1.315

------------------------------------------------------------------------------*/
(function() {

//カラーインデックス。ランタイムの数字画像なら0白、1青、2緑、3赤
var RecoveryColorIndex = 2;

//表示位置補正
var PopupX = 0;
var PopupY = 0;

//------------------------------------------------------------------------------
var _HpRecoveryEventCommand__completeEventCommandMemberData = HpRecoveryEventCommand._completeEventCommandMemberData;
HpRecoveryEventCommand._completeEventCommandMemberData = function() {
	var result = _HpRecoveryEventCommand__completeEventCommandMemberData.call(this);
	this._damagePopup = null;
	
	if(EnvironmentControl.isDamagePopup()) {
		this._setupDamagePopup();
	}
	
	return result;
};

HpRecoveryEventCommand._setupDamagePopup = function() {
	var effect = createObject(RecoveryPopupEffect);
	//ダメージイベントと同じ位置
	/*
	var dx = Math.floor((DamagePopup.WIDTH - GraphicsFormat.CHARCHIP_WIDTH) / 2) + PopupX;
	var dy = Math.floor((DamagePopup.HEIGHT - GraphicsFormat.CHARCHIP_HEIGHT) / 2) + PopupY;
	var targetUnit = this._targetUnit;
	var x = LayoutControl.getPixelX(targetUnit.getMapX());
	var y = LayoutControl.getPixelY(targetUnit.getMapY());
	
	if (y >= root.getGameAreaHeight() - 32) {
		dy -= 32;
	}
	else {
		dy += 32;
	}
	dx -= 32;
	*/
	
	//回復ウィンドウ上のユニット位置
	var width = this._recoveryWindow.getWindowWidth();
	var height = this._recoveryWindow.getWindowHeight();
	var x = LayoutControl.getUnitBaseX(this._targetUnit, width);
	var y = LayoutControl.getUnitBaseY(this._targetUnit, height);
	var dx = 0 + PopupX;
	var dy = 65 + PopupY;
	
	effect.setPos(x + dx, y + dy, this._recoveryValue);
	effect.setAsync(true);
	effect.setCritical(false);
	this._damagePopup = effect;
};

var _HpRecoveryEventCommand__moveWindow = HpRecoveryEventCommand._moveWindow;
HpRecoveryEventCommand._moveWindow = function() {
	var result = _HpRecoveryEventCommand__moveWindow.call(this);
	if(this._damagePopup !== null) {
		this._damagePopup.moveEffect();
	}
	
	return result;
};

var _HpRecoveryEventCommand__drawWindow = HpRecoveryEventCommand._drawWindow;
HpRecoveryEventCommand._drawWindow = function() {
	_HpRecoveryEventCommand__drawWindow.call(this);
	if(this._damagePopup !== null) {
		this._damagePopup.drawEffect(0, 0, false);
	}
};

//回復用ポップアップオブジェクト
//DamagePopupEffectにマイナス値を渡すと_setupBallPosでズレが生じるため
var RecoveryPopupEffect = defineObject(DamagePopupEffect, {
	_createBallObject: function() {
		return createObject(RecoveryBall);
	}
});

RecoveryBall._getNumberColorIndex = function() {
	return RecoveryColorIndex;
};

})();
