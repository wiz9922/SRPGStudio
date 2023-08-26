/*------------------------------------------------------------------------------
ユニットが所持する武器の耐久を一括で最大値まで回復します。


■使用方法
「スクリプトの実行」で種類を「コード実行」にして、以下のコードのいずれかを記述してください。

1.指定ユニット
対象は「オリジナルデータ」タブで設定したユニットとなります。
SupplyUnitWeapon();

2.全ての自軍ユニット
SupplyUnitWeaponAll();

■作成者
wiz

■対応バージョン
SRPG Stduio Ver1.286

------------------------------------------------------------------------------*/

//単体
var SupplyUnitWeapon = function() {
	var unit = root.getEventCommandObject().getOriginalContent().getUnit();
	UnitItemControl.supplyUnitWeapon(unit);
};

//全体
var SupplyUnitWeaponAll = function() {
	var i, unit;
	//フュージョンされているユニットも対象
	var list = PlayerList.getAliveDefaultList();
	var count = list.getCount();
	
	for(i=0; i<count; i++) {
		unit = list.getData(i);
		UnitItemControl.supplyUnitWeapon(unit);
	}
};

UnitItemControl.supplyUnitWeapon = function(unit) {
	var i, item;
	var count = DataConfig.getMaxUnitItemCount();
	
	for(i=0; i<count; i++) {
		item = this.getItem(unit, i);
		if(item !== null && item.isWeapon()) {
			//最大値に設定
			item.setLimit(item.getLimitMax());
		}
	}
};
