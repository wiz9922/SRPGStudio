//戦闘前ウィンドウに属性による威力上昇(↑)or低下(↓)を表示

(function() {

var alias1 = AttackChecker.getAttackStatusInternal;
AttackChecker.getAttackStatusInternal = function(unit, weapon, targetUnit) {
	var arr = alias1.call(this, unit, weapon, targetUnit);
	arr[3] = AttributeControl.checkMagnification(unit, targetUnit);
	return arr;
};

var alias2 = StatusRenderer.drawAttackStatus;
StatusRenderer.drawAttackStatus = function(x, y, arr, color, font, space) {
	var pic, width, height;
	alias2.call(this, x, y, arr, color, font, space);
	
	var check = arr[3];
	if(check !== 0) {
		pic = root.queryUI('parameter_risecursor');
		width = UIFormat.RISECURSOR_WIDTH / 2;
		height = UIFormat.RISECURSOR_HEIGHT / 2;
		
		if (pic !== null) {
			//上昇
			if(check === 1) {
				pic.drawParts(x+43, y, width * 1, 0, width-2, height);
			}
			//低下
			else if(check === -1) {
				pic.drawParts(x+43, y, width * 1, height * 1, width-2, height);
			}
		}
	}
};

})();