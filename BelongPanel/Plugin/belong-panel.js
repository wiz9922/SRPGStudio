/*----------------------------------------------------------
キャラチップの下に所属毎の色パネルを追加します。
画像を使用しなくても代わりの描画は一応してくれます。

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.111

----------------------------------------------------------*/
(function() {

//画像を使用するか
var isUseImage = true;

//画像を使用する場合、Material以下のフォルダ名とファイル名
var BelongImage = {
	Folder: 'BelongPanel',
	File: 'bpanel.png'
};

//---------------------------------------------------------
var alias1 = MapLayer.prepareMapLayer;
MapLayer.prepareMapLayer = function() {
	alias1.call(this);
	this._belongPanel = createObject(BelongPanel);
};

var alias2 = MapLayer.moveMapLayer;
MapLayer.moveMapLayer = function() {
	var result = alias2.call(this);
	this._belongPanel.movePanel();
	return result;
};

MapLayer.drawUnitLayer = function() {
		var index = this._counter.getAnimationIndex();
		var index2 = this._counter.getAnimationIndex2();
		var session = root.getCurrentSession();
		
		this._markingPanel.drawMarkingPanel();
		
		this._unitRangePanel.drawRangePanel();
		this._mapChipLight.drawLight();
		
		if (session !== null) {
			//キャラチップとセットになる箇所に追加
			this._belongPanel.drawPanel();
			session.drawUnitSet(true, true, true, index, index2);
		}
		
		if (this._effectRangeType === EffectRangeType.MAPANDCHAR) {
			this._drawScreenColor();
		}
};

MapLayer.getBelongPanel = function() {
	return this._belongPanel;
};

var alias3 = UnitRenderer.drawScrollUnit;
UnitRenderer.drawScrollUnit = function(unit, x, y, unitRenderParam) {
	//移動中は位置指定で直接呼び出し
	MapLayer.getBelongPanel().drawUnitPanelInternal(unit, x, y, unitRenderParam);
	alias3.call(this, unit, x, y, unitRenderParam);
};

//パネルオブジェクト----------------------------------------------------------------------
var BelongPanel = defineObject(BaseObject, {
	_pic: null,
	
	initialize: function() {
		if(isUseImage) {
			this._pic = root.getMaterialManager().createImage(BelongImage.Folder, BelongImage.File);
		}
	},
	movePanel: function() {
		return MoveResult.CONTINUE;
	},
	
	drawPanel: function() {
		var i, j, list, count, unit, x, y;
		//自軍はSortieList
		var listArray = FilterControl.getListArray(UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY);
		
		for(i=0; i<listArray.length; i++) {
			list = listArray[i];
			count = list.getCount();
			for(j=0; j<count; j++) {
				unit = list.getData(j);
				this.drawUnitPanel(unit);
			}
		}
		
		//出撃開始まで(OPイベント、出撃準備、CMイベント)ゲストユニットは自軍扱いではない
		if(SceneManager.getActiveSceneType() === SceneType.BATTLESETUP) {
		//if(root.getCurrentScene() === SceneType.BATTLESETUP) {
			list = AllUnitList.getAliveList(root.getCurrentSession().getGuestList());
			count = list.getCount();
			for(j=0; j<count; j++) {
				unit = list.getData(j);
				this.drawUnitPanel(unit);
			}
		}
		
	},
	
	drawUnitPanel: function(unit) {
		//移動中や出撃準備前もユニットは非表示状態になっている
		if(unit.isInvisible()) {
			return;
		}
		var x = LayoutControl.getPixelX(unit.getMapX());
		var y = LayoutControl.getPixelY(unit.getMapY());
		
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		this.drawUnitPanelInternal(unit, x, y, unitRenderParam);
	},
	
	drawUnitPanelInternal: function(unit, x, y, unitRenderParam) {	
		var pic = this._pic;
		var w = GraphicsFormat.MAPCHIP_WIDTH;  //32
		var h = GraphicsFormat.MAPCHIP_HEIGHT; //32
		
		if(pic != null) {
			pic.setAlpha(unitRenderParam.alpha);
			pic.drawParts(x, y+4, w * unit.getUnitType(), 0, w, h);
		}
		else {
			root.getGraphicsManager().fillRange(x+4, y+8, w-8, h-8, this._getColor(unit.getUnitType()), unitRenderParam.alpha);
		}
	},
	
	_getColor: function(type) {
		if(type === UnitType.PLAYER) {
			return 0x3838ff;
		}
		else if(type === UnitType.ENEMY) {
			return 0xff3838;
		}
		else if(type === UnitType.ALLY) {
			return 0x38ff38;
		}
		return 0x000000;
	}
});

})();