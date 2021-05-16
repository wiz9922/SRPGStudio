/*----------------------------------------------------------
漫符など、メッセージ中の顔グラフィックや立ち絵に追加で画像を表示できます

使用方法:
Material内に下記CategoryNameのフォルダを作成してください
各画像のファイル名はCategoryName番号.pngとなります
(例えばCategoryNameが「emotion」なら「emotion1.png」のようになります)

メッセージの先頭に制御文字「\em[1]」のように書くことで、その番号の画像が表示されます
メッセージレイアウトで設定した顔画像や立ち絵の座標を基準としているので、下記の表示位置を調整してださい

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.223

----------------------------------------------------------*/
(function() {

//Material内のフォルダおよびファイル名
var CategoryName = 'emotion';

//faceが顔グラフィック、charが立ち絵に対する表示位置
//メッセージの表示(上)
var faceX_top = 0;
var faceY_top = 0;
var charX_top = 0;
var charY_top = 0;

//メッセージの表示(中央)
var faceX_center = 0;
var faceY_center = 0;
var charX_center = 0;
var charY_center = 0;

//メッセージの表示(下)
var faceX_bottom = 0;
var faceY_bottom = 0;
var charX_bottom = 0;
var charY_bottom = 0;

//スチルメッセージ
var faceX_still = 0;
var faceY_still = 0;
var charX_still = 0;
var charY_still = 0;

//------------------------------------------------------------------------------
//parserInfoにIDを追加
var _StructureBuilder_buildParserInfo = StructureBuilder.buildParserInfo;
StructureBuilder.buildParserInfo = function() {
	var obj = _StructureBuilder_buildParserInfo.call(this);
	obj.emotionId = -1;
	return obj;
};

//制御文字
var _TextParser__configureVariableObject = TextParser._configureVariableObject;
TextParser._configureVariableObject = function(groupArray) {
	_TextParser__configureVariableObject.call(this, groupArray);
	groupArray.appendObject(ControlVariable.Emotion);
};

ControlVariable.Emotion = defineObject(BaseControlVariable, {
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.emotionId = obj.sig;
	},
	
	getKey: function() {
		var key = /\\em\[(\d+)\]/;
		
		return key;
	}
});

//IDを取得して表示
MessageAnalyzer.getEmotionId = function() {
	return this._parserInfo.emotionId;
};

BaseMessageView.drawEmotion = function(x, y, isActive) {
	var id = this._messageAnalyzer.getEmotionId();
	if(id < 0) {
		return;
	}
	
	var pic = root.getMaterialManager().createImage(CategoryName, CategoryName + id + '.png');
	if(pic === null) {
		return;
	}
	
	if (!isActive) {
		pic.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
	}
	
	pic.draw(x, y);
};

//表示位置
BaseMessageView.getFaceEmotionPos = function() {
	return {x:0, y:0};
};

BaseMessageView.getCharEmotionPos = function() {
	return {x:0, y:0};
};

var _BaseMessageView_drawFace = BaseMessageView.drawFace;
BaseMessageView.drawFace = function(xDest, yDest, isActive) {
	//顔グラが表示されない場合は表示しない
	var handle = this._faceHandle;
	if (handle === null) {
		return;
	}
	
	_BaseMessageView_drawFace.call(this, xDest, yDest, isActive);
	
	var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
	if (pic === null) {
		return;
	}
	
	var pos_e = this.getFaceEmotionPos();
	var x = xDest + pos_e.x;
	var y = yDest + pos_e.y;
	this.drawEmotion(x, y, isActive);
};


var _BaseMessageView_drawCharIllust = BaseMessageView.drawCharIllust;
BaseMessageView.drawCharIllust = function(isActive) {
	//立ち絵が表示されない場合は表示しない
	var image = this._illustImage;
	if (image === null || MessageViewControl.isHidden()) {
		return;
	}
	
	_BaseMessageView_drawCharIllust.call(this, isActive);
	
	var pos = this.getIllustPos(image);
	var pos_e = this.getCharEmotionPos();
	var x = pos.x + this._messageLayout.getCharIllustX() + pos_e.x;
	var y = pos.y + this._messageLayout.getCharIllustY() + pos_e.y;
	this.drawEmotion(x, y, isActive);
};

//メッセージの表示(上)
FaceViewTop.getFaceEmotionPos = function() {
	return {x:faceX_top, y:faceY_top};
};

FaceViewTop.getCharEmotionPos = function() {
	return {x:charX_top, y:charY_top};
};

//メッセージの表示(中央)
FaceViewCenter.getFaceEmotionPos = function() {
	return {x:faceX_center, y:faceY_center};
};

FaceViewCenter.getCharEmotionPos = function() {
	return {x:charX_center, y:charY_center};
};

//メッセージの表示(下)
FaceViewBottom.getFaceEmotionPos = function() {
	return {x:faceX_bottom, y:faceY_bottom};
};

FaceViewBottom.getCharEmotionPos = function() {
	return {x:charX_bottom, y:charY_bottom};
};

//スチルメッセージ
StillView.getFaceEmotionPos = function() {
	return {x:faceX_still, y:faceY_still};
};

StillView.getCharEmotionPos = function() {
	return {x:charX_still, y:charY_still};
};

})();
