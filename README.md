# SRPGstudio用プラグイン
Plugins for SRPG Studio  

## 利用規約
・利用はSRPG Studioを使ったゲームに限ります  
・商用利用可  
・加工、再配布、転載OK (作成者を偽るのとスクリプトの販売は禁止)  
・著作表記と利用報告は任意  
・SRPG Studio利用規約は遵守してください  
http://srpgstudio.com/guide/rules.html  

## AttackLimitWeapon
攻撃専用または反撃専用の武器が作成できます。  

## AttributeSystem
属性によるダメージ変化を実装します。  
・必須はattribute-mainのみで、他はオブションです  
・デフォルトでは表示範囲の都合上、名称は2文字以内が望ましいです
* attribute-main
メイン処理
* attribute-attackwindow
 戦闘前ウィンドウに属性による威力上昇(↑)or低下(↓)を表示
* attribute-iteminfo
 アイテム情報ウィンドウに属性情報を追加
* attribute-terraininfo
 地形ウィンドウに属性情報を追加
* attribute-unitmenu
 ユニットメニューに属性耐性一覧のページを追加  

## BelongPanel
キャラチップの下に所属毎の色パネルを追加します。  
・PluginとMaterialをコピーすればそのまま使えます  
・別の画像を使用する場合はbelong-panel内で指定してください  
 通常は32*32の画像が自軍、敵軍、同盟軍の順に3つ並んだものです  
 ※ver1.123以降、「マップユニットシンボル」として同等の機能が公式に追加されました

## ChangeDifficulty
イベントから難易度を変更できます。  

## ExperienceGaugeBar
経験値獲得画面をバー表示にします(UI画像を使用しないタイプ)

## FixedExp
マップ内の取得経験値を固定します。  
・戦闘経験値  
・アイテム使用時の経験値  
・スキル使用時の経験値  

## ItemSynthesis
アイテム合成(ショップ)を作成します。  
現状は拠点のみ。  

## MasterSkill
特定の武器タイプを装備している場合にボーナスを得ることができます。

## PosessionLimitItem
武器(アイテム)タイプに所持個数制限を設定します。

## QuestRetreat
クエストマップに退却コマンド(拠点に戻る)を追加します。

## UnknownHp
HPが一定以上の時は「???」で表示されるようになります。  

## 連絡先
wiz  
twitter: https://twitter.com/wiz9922  
GitHub: https://github.com/wiz9922/SRPGstudio  
