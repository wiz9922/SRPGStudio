//ユニットメニューに属性耐性一覧のページを追加

(function() {

var alias1 = UnitMenuScreen._configureBottomWindows;
UnitMenuScreen._configureBottomWindows = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.appendWindowObject(UnitMenuBottomAttributeWindow, this);
};

var UnitMenuBottomAttributeWindow = defineObject(BaseMenuBottomWindow,
{
	_unit: null,
	
	changeUnitMenuTarget: function(unit) {
		this._unit = unit;
	},
	
	drawWindowContent: function(x, y) {
		this._drawUnitResist(x, y);
	},
	
	_drawUnitResist: function(xBase, yBase) {
		var i, text;
		var unit = this._unit;
		var textui_name = this._getWindowTextUI_Name();
		var color_name = textui_name.getColor();
		var font_name = textui_name.getFont();
		var textui_param = this._getWindowTextUI_Param();
		var color_param = textui_param.getColor();
		var font_param = textui_param.getFont();
		var length = this._getUnitTextLength();
		var x = xBase + 15;
		var y = yBase + 7;
		var xspace = 0;
		var yspace = 0;
		var count = AttributeControl.getCount();
		
		//1行に表示する数
		var col = 5;
		
		for (i=0; i<count; i++){
			if(!AttributeControl.isShow(i)) {
				continue;
			}
			
			text = AttributeControl.getName(i);
			TextRenderer.drawText(x + xspace, y + yspace, text, length, color_name, font_name);
			
			xspace += 20;
			
			text = AttributeControl.getUnitResist(unit, i) + '%';
			TextRenderer.drawText(x + xspace, y + yspace, text, length, color_param, font_param);
			
			if( (i+1) % col === 0) {
				xspace = 0;
				yspace += 30;
			} else {
				xspace += 55;
			}
		}
	},
	
	_getWindowTextUI_Name: function() {
		return root.queryTextUI('infowindow_title');
	},

	_getWindowTextUI_Param: function() {
		return root.queryTextUI('default_window');
	},
	
	_getUnitTextLength: function() {
		return 180;
	}
}
);

})();