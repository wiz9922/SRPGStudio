/*----------------------------------------------------------
変数と同様の書式(グループ+ID)で、NPCの名前を表示する制御文字を追加します

例:
グループ1のID0のNPCの名前
\npc1[0]

■作成者
wiz

■対応バージョン
SRPG Studio Version:1.166
----------------------------------------------------------*/
(function() {

var alias1 = VariableReplacer._configureVariableObject;
VariableReplacer._configureVariableObject = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.appendObject(DataVariable.Npc);
};

DataVariable.Npc = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var index = this.getIndexFromKey(text);
		var id = this.getIdFromKey(text);
		
		var list = root.getBaseData().getNpcList(index - 1);
		var npc = list.getDataFromId(id);
		
		return npc.getName();
	},
	
	getIndexFromKey: function(text) {
		var key = /\\npc(\d+)\[\d+\]/;
		var c = text.match(key);
		
		return Number(c[1]);
	},
	
	getKey: function() {
		var key = /\\npc\d+\[(\d+)\]/;
		
		return key;
	}
});

})();