//地形ウィンドウに属性情報を追加

(function() {

//見出し
var strAttributeType = '属性';
var strAttributeEnhance = '強化';
var strAttributeResist = '耐性';

MapParts.Terrain._drawContent = function(x, y, terrain) {
	var text;
	var textui = this._getWindowTextUI();
	var font = textui.getFont();
	var color = textui.getColor();
	var length = this._getTextLength();
	
	if (terrain === null) {
		return;
	}
	
	x += 2;
	TextRenderer.drawText(x, y, terrain.getName(), length, color, font);
	
	y += this.getIntervalY();
	this._drawKeyword(x, y, root.queryCommand('avoid_capacity'), terrain.getAvoid());
	
	if (terrain.getDef() !== 0) {
		text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.DEF));
		y += this.getIntervalY();
		this._drawKeyword(x, y, text, terrain.getDef());
	}
	
	if (terrain.getMdf() !== 0) {
		text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.MDF));
		y += this.getIntervalY();
		this._drawKeyword(x, y, text, terrain.getMdf());
	}
	
	if(AttributeControl.getAttackType(terrain) !== 0) {
		type = AttributeControl.getAttackType(terrain);
		if(AttributeControl.isShow(type)) {
			y += this.getIntervalY();
			ItemInfoRenderer.drawKeyword(x, y, strAttributeType);
			TextRenderer.drawText(x + this.getSpaceX(), y + 5, AttributeControl.getName(type), length, color, font);
		}
	}
	
	if(AttributeControl.getEnhanceCount(terrain) !== 0) {
		y += this.getIntervalY();
		ItemInfoRenderer.drawKeyword(x, y, strAttributeEnhance);
		this.drawAttributeChange(x + this.getSpaceX(), y, terrain, AttrParamType.ENHANCE);
	}
	
	if(AttributeControl.getResistCount(terrain) !== 0) {
		y += this.getIntervalY();
		ItemInfoRenderer.drawKeyword(x, y, strAttributeResist);
		this.drawAttributeChange(x + this.getSpaceX(), y, terrain, AttrParamType.RESIST);
	}
};

MapParts.Terrain.getSpaceX = function() {
	return 42;
};

MapParts.Terrain.drawAttributeChange = function(x, y, terrain, ptype) {
	var i, n, text;
	var count = AttributeControl.getCount();
	var count2 = 0;
	var xBase = x;
	var textui = root.queryTextUI('default_window');
	var color = textui.getColor();
	var font = textui.getFont();
	
	for (i=0; i<count; i++) {
		if(!AttributeControl.isShow(i)) {
			continue;
		}
		if(ptype === AttrParamType.ENHANCE) {
			n = AttributeControl.getEnhance(terrain, i);
		}
		else if(ptype === AttrParamType.RESIST) {
			n = AttributeControl.getResist(terrain, i);
		}
		
		if(n !== 0) {
			text = AttributeControl.getName(i);
			TextRenderer.drawKeywordText(x, y, text, -1, color, font);
			
			//x += TextRenderer.getTextWidth(text, font) + 5;
			x += TextRenderer.getTextWidth(text, font);
			TextRenderer.drawSignText(x, y, n > 0 ? ' + ': ' - ');
			
			//x += 10;
			//x += DefineControl.getNumberSpace();
			x += 20;
			
			if (n < 0) {
				n *= -1;
			}
			NumberRenderer.drawRightNumber(x, y, n);
			x += 20;
			
			y += this.getIntervalY();
			
			count2++;
			x = xBase;
		}
	}
	return count2;
};

var alias2 = MapParts.Terrain._getPartsCount;
MapParts.Terrain._getPartsCount = function(terrain) {
	var count = alias2.call(this, terrain);
	
	if(AttributeControl.getAttackType(terrain) !== 0) {
		count++;
	}
	count += AttributeControl.getEnhanceCount(terrain);
	count += AttributeControl.getResistCount(terrain);
	
	return count;
};

})();