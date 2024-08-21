/*------------------------------------------------------------------------------
スイッチアイテム使用時、指定した変数も変更できます。

使用方法：
アイテムにカスタムパラメータを設定してください。
{
	vGroup:1,
	vId:1,
	vValue:10
}

vGroup:変数グループ1～5(通常)、6(ID変数)
vId:変数ID
vValue:代入する値

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.299

------------------------------------------------------------------------------*/
(function() {

var getCustomParameter = function(obj, key, defValue) {
	if(obj === null) {
		return defValue;
	}
	if(!obj.custom.hasOwnProperty(key)) {
		return defValue;
	}
	return obj.custom[key];
};

var setVariable = function(group, id, value) {
	var table = root.getMetaSession().getVariableTable(group - 1);
	var index = table.getVariableIndexFromId(id);
	
	table.setVariable(index, value);
};

var _SwitchItemUse_mainAction = SwitchItemUse.mainAction;
SwitchItemUse.mainAction = function() {
	_SwitchItemUse_mainAction.call(this);
	
	var item = this._itemUseParent.getItemTargetInfo().item;
	var group = getCustomParameter(item, 'vGroup', -1);
	var id = getCustomParameter(item, 'vId', -1);
	var value = getCustomParameter(item, 'vValue', -1);
	
	if(group < 1 || id < 0) {
		return;
	}
	
	setVariable(group, id, value);
};

})();
