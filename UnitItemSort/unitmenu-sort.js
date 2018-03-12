/*----------------------------------------------------------
ユニットメニューでCキーを押すことでユニットの所持アイテムがソートされるようになります
優先順位
・装備武器(アイテム欄の一番上)
・武器→アイテムの順
・武器(アイテム)タイプIDが小さい順
・武器(アイテム)IDが小さい順
・耐久値が少ない順

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.174
----------------------------------------------------------*/

(function() {

//ソート時の効果音：リソース使用箇所→効果音を指定している項目の「内部名」
var SortSound = 'itemuse';

//---------------------------------------------------------
//ユニットメニューにおけるCキーの挙動を変更
var _UnitMenuScreen__optionAction = UnitMenuScreen._optionAction;

UnitMenuScreen._selectAction = function() {
	return _UnitMenuScreen__optionAction.call(this);
};

UnitMenuScreen._optionAction = function() {
	var unit = this._unit;
	var index = this._activePageIndex;
	//1ページ目かつ自軍ユニットであればソート実行
	if(index === 0 && unit.getUnitType() === UnitType.PLAYER) {
		MediaControl.soundDirect(SortSound);
		UnitItemControl.sortItem(unit);
		//BottomWindowを更新
		this._bottomWindowArray[index].changeUnitMenuTarget(unit);
	}
	return MoveResult.CONTINUE;
};

//所持アイテムのソート
UnitItemControl.sortItem = function(unit) {
	var i, item;
	var count = this.getPossessionItemCount(unit);
	var weapon = ItemControl.getEquippedWeapon(unit);
	
	var arr = [];
	for(i=0; i<count; i++) {
		item = this.getItem(unit, i);
		arr.push(item);
	}
	
	//StockItemControl.sortItem参照
	arr.sort(function(item1, item2) {
		var id1, id2;
		var limit1, limit2;
		var wType1, wType2;
		
		if(item2 === weapon) {
			return 1;
		}
		if(item1 === weapon) {
			return -1;
		}
		
		wType1 = item1.getWeaponType();
		wType2 = item2.getWeaponType();
		if(!item1.isWeapon() && item2.isWeapon()) {
			return 1;
		}
		else if(item1.isWeapon() && !item2.isWeapon()) {
			return -1;
		}
		else if(item1.isWeapon() && item2.isWeapon()) {
			if(wType1.getWeaponCategoryType() > wType2.getWeaponCategoryType()) {
				return 1;
			}
			else if(wType1.getWeaponCategoryType() < wType2.getWeaponCategoryType()) {
				return -1;
			}
		}
		
		if(wType1.getId() > wType2.getId()) {
			return 1;
		}
		else if(wType1.getId() < wType2.getId()) {
			return -1;
		}
		
		id1 = item1.getId();
		id2 = item2.getId();
		/*
		if (!item1.isWeapon()) {
			id1 += ItemIdValue.BASE;
		}
		
		if (!item2.isWeapon()) {
			id2 += ItemIdValue.BASE;
		}
		*/
		
		if (id1 > id2) {
			return 1;
		}
		else if (id1 < id2) {
			return -1;
		}
		else {
			limit1 = item1.getLimit();
			limit2 = item2.getLimit();
			
			if (limit1 > limit2) {
				return 1;
			}
			else if (limit1 < limit2) {
				return -1;
			}
		}
		
		return 0;
	});
	
	//所持アイテムに反映
	for(i=0; i<arr.length; i++) {
		item = arr[i];
		this.setItem(unit, i, item);
	}
	
};

})();