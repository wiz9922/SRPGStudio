//アイテム情報に属性情報を追加

(function() {

//見出し
var strAttributeType = '属性';
var strAttributeEnhance = '強化';
var strAttributeResist = '耐性';

var alias1 = ItemInfoWindow._configureWeapon;
ItemInfoWindow._configureWeapon = function(groupArray) {
	alias1.call(this, groupArray);
	
	//非表示にしたい項目はコメントアウト
	groupArray.appendObject(ItemSentence.AttributeType);
	groupArray.appendObject(ItemSentence.AttributeEnhance);
	groupArray.appendObject(ItemSentence.AttributeResist);
};

var alias2 = ItemInfoWindow._configureItem;
ItemInfoWindow._configureItem = function(groupArray) {
	alias2.call(this, groupArray);
	
	//非表示にしたい項目はコメントアウト
	groupArray.appendObject(ItemSentence.AttributeType);
	groupArray.appendObject(ItemSentence.AttributeEnhance);
	groupArray.appendObject(ItemSentence.AttributeResist);
};

//付与属性
ItemSentence.AttributeType = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		var i, type;
		var textui = root.queryTextUI('default_window');
		var color = textui.getColor();
		var font = textui.getFont();
		var length = 100;
		
		if(AttributeControl.getAttackType(item) !== 0) {
			type = AttributeControl.getAttackType(item);
			if(AttributeControl.isShow(type)) {
				ItemInfoRenderer.drawKeyword(x, y, strAttributeType);
				x += ItemInfoRenderer.getSpaceX();
				TextRenderer.drawText(x, y + 5, AttributeControl.getName(type), length, color, font);
			}
		}
	},
	
	getItemSentenceCount: function(item) {
		if(AttributeControl.getAttackType(item) !== 0) {
			type = AttributeControl.getAttackType(item);
			if(AttributeControl.isShow(type)) {
				return 1;
			}
		}
		return 0;
	}
}
);

//属性強化
ItemSentence.AttributeEnhance = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		if(AttributeControl.getEnhanceCount(item) !== 0) {
			ItemInfoRenderer.drawKeyword(x, y, strAttributeEnhance);
			x += ItemInfoRenderer.getSpaceX();
			ItemInfoRenderer.drawAttributeChange(x, y, item, AttrParamType.ENHANCE);
		}
	},
	
	getItemSentenceCount: function(item) {
		return AttributeControl.getEnhanceCount(item);
	}
}
);

//属性耐性
ItemSentence.AttributeResist = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		if(AttributeControl.getResistCount(item) !== 0) {
			ItemInfoRenderer.drawKeyword(x, y, strAttributeResist);
			x += ItemInfoRenderer.getSpaceX();
			ItemInfoRenderer.drawAttributeChange(x, y, item, AttrParamType.RESIST);
		}
	},
	
	getItemSentenceCount: function(item) {
		return AttributeControl.getResistCount(item);
	}
}
);

//ItemInfoRenderer.drawDopingと同様の処理
ItemInfoRenderer.drawAttributeChange = function(x, y, item, ptype) {
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
			n = AttributeControl.getEnhance(item, i);
		}
		else if(ptype === AttrParamType.RESIST) {
			n = AttributeControl.getResist(item, i);
		}
		
		if(n !== 0) {
			text = AttributeControl.getName(i);
			TextRenderer.drawKeywordText(x, y, text, -1, color, font);
			
			x += TextRenderer.getTextWidth(text, font) + 5;
			TextRenderer.drawSignText(x, y, n > 0 ? ' + ': ' - ');
			
			x += 10;
			x += DefineControl.getNumberSpace();
			
			if (n < 0) {
				n *= -1;
			}
			NumberRenderer.drawRightNumber(x, y, n);
			x += 20;
			
			y += this.getSpaceY();
			
			count2++;
			x = xBase;
		}
	}
	return count2;
};

})();