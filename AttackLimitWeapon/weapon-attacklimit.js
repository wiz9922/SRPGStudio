/*----------------------------------------------------------
攻撃専用または反撃専用の武器が作成できます。

使用方法:
武器にカスタムパラメータを設定してください。
{
    attacktype:0
}
attacktype: 0で攻撃専用、1で反撃専用

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.198

----------------------------------------------------------*/

(function() {

//アイテム情報ウィンドウに表示する説明
StringTable.Weapon_AttackOnly = '攻撃専用';
StringTable.Weapon_CounterOnly = '反撃専用';

//----------------------------------------------

var AttackType = {
	ATTACK: 0,
	COUNTER: 1
};

//ユニットの種類とターンの種類から反撃か判定
Miscellaneous.isCounter = function(unit) {
	if(unit.getUnitType() !== root.getCurrentSession().getTurnType()){
		return true;
	}
	return false;
};

var alias1 = ItemControl.isWeaponAvailable;
ItemControl.isWeaponAvailable = function(unit, item){
	var result = alias1.call(this, unit, item);
	
	//拠点では通常通り
	//イベント中も判定できるようgetBaseScene
	if(root.getBaseScene() === SceneType.REST) {
		return result;
	}
	
	if(typeof item.custom.attacktype === 'number'){
		if(item.custom.attacktype === AttackType.ATTACK && Miscellaneous.isCounter(unit)){
			return false;
		}
		else if(item.custom.attacktype === AttackType.COUNTER && !Miscellaneous.isCounter(unit)){
			return false;
		}
	}
	
	return result;
};

//アイテム選択から装備だけは可能にする
ItemControl.isWeaponEquipable = function(unit, item) {
	var result = alias1.call(this, unit, item);
	return result;
};

ItemSelectMenu.isWorkAllowed = function(index) {
		var result = false;
		var item = this._itemListWindow.getCurrentItem();
		
		if (item.isWeapon()) {
			if (index === 0) {
				//result = ItemControl.isWeaponAvailable(this._unit, item);
				result = ItemControl.isWeaponEquipable(this._unit, item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		else {
			if (index === 0) {
				result = this._isItemUsable(item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		
		return result;
};

//アイテム情報ウィンドウ
var alias2 = ItemInfoWindow._configureWeapon;
ItemInfoWindow._configureWeapon = function(groupArray) {
	alias2.call(this, groupArray);
	
	//groupArray.appendObject(ItemSentence.AttackType);
	groupArray.insertObject(ItemSentence.AttackType, 7);
};

ItemSentence.AttackType = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		var text;
		
		if (this.getItemSentenceCount(item) === 1) {
			if(item.custom.attacktype === AttackType.ATTACK) {
				text = StringTable.Weapon_AttackOnly;
			}
			else if(item.custom.attacktype === AttackType.COUNTER) {
				text = StringTable.Weapon_CounterOnly;
			}
			ItemInfoRenderer.drawKeyword(x, y, text);
		}
	},
	
	getItemSentenceCount: function(item) {
		return (item.isWeapon() && typeof item.custom.attacktype === 'number') ? 1 : 0;
	}
}
);

})();