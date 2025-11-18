# CLAUDE.md

このファイルは、Claude Code（AI アシスタント）がプロジェクトを理解しやすくするためのドキュメントです。

## プロジェクト概要

**画像エディター (Image Editor)**

ブラウザ上で動作する画像編集アプリケーション。ユーザーが画像をアップロードまたはペーストして、ペイントツールやテキスト入力で編集できる。

## 技術スタック

- **HTML5**: 構造とUI
- **CSS3**: スタイリング、レスポンシブデザイン
- **JavaScript (Vanilla)**: アプリケーションロジック
- **Canvas API**: 画像編集の中核技術

## ファイル構成

```
img-edit/
├── index.html      # メインHTMLファイル - UI構造を定義
├── style.css       # スタイルシート - デザインとレイアウト
├── app.js          # JavaScriptメインファイル - 画像編集ロジック
├── README.md       # ユーザー向けドキュメント
└── CLAUDE.md       # AI向けプロジェクトドキュメント（このファイル）
```

## 主要機能

### 1. 画像読み込み
- **ファイルアップロード**: `index.html:25` の input要素で画像ファイルを選択
- **ペースト機能**: `app.js:97-108` でクリップボードからの画像貼り付けを処理

### 2. 描画ツール
- **ブラシツール**: `app.js:144-160` - 自由描画
- **消しゴムツール**: `app.js:144-160` - 白色で上書き消去
- **色選択**: `app.js:60-62` - カラーピッカーで色を変更
- **線の太さ調整**: `app.js:64-67` - スライダーで1-50px調整

### 3. テキスト入力
- **テキスト追加**: `app.js:165-174` - クリック位置にテキストを配置
- **フォントサイズ**: `app.js:69-72` - 10-100pxで調整可能

### 4. 保存・管理
- **画像保存**: `app.js:192-197` - PNG形式でダウンロード
- **クリア機能**: `app.js:200-206` - キャンバスを白色でリセット

## コードの重要な部分

### キャンバス初期化
```javascript
// app.js:1-10
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
```

### 座標計算（レスポンシブ対応）
```javascript
// app.js:122-130
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}
```

### 描画処理
```javascript
// app.js:144-160
function draw(e) {
    // Canvas APIを使用した線描画
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
}
```

## UI/UX設計

### カラースキーム
- **プライマリーカラー**: `#667eea` (紫青系)
- **グラデーション**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **背景**: `#ecf0f1` (明るいグレー)

### レスポンシブ対応
- `style.css:142-154` - メディアクエリで768px以下の画面に対応
- タッチイベント処理: `app.js:176-190`

## イベント処理フロー

1. **マウスダウン** → `startDrawing()` → 描画開始位置を記録
2. **マウスムーブ** → `draw()` → 線を描画
3. **マウスアップ** → `stopDrawing()` → 描画終了
4. **テキストツール** → クリックでプロンプト表示 → テキスト配置

## 今後の拡張案

- [ ] Undo/Redo機能（履歴管理の実装が必要）
- [ ] レイヤー機能
- [ ] 図形描画ツール（矩形、円、線など）
- [ ] フィルター効果（明度、コントラスト、ぼかしなど）
- [ ] クロップ・リサイズ機能
- [ ] JPEG、WebP形式での保存

## 開発時の注意点

### セキュリティ
- ユーザーアップロード画像は全てクライアントサイドで処理
- サーバーへのアップロードなし
- XSS対策: テキスト入力は `fillText()` で安全に描画

### パフォーマンス
- Canvas APIは高速だが、大きな画像では重くなる可能性
- 現状では履歴管理なし（メモリ効率優先）

### ブラウザ互換性
- モダンブラウザ（Chrome、Firefox、Safari、Edge）で動作
- Canvas API と FileReader API が必須

## デバッグ情報

開発者コンソールで以下のメッセージが表示されます:
```
画像エディターが読み込まれました！
Ctrl+V で画像を貼り付けることができます
```

## 環境要件

- モダンブラウザ（ES6対応）
- Canvas API対応
- FileReader API対応
- Clipboard API対応（ペースト機能用）

## テスト方法

1. ブラウザで `index.html` を開く
2. 画像をアップロードまたはペースト
3. 各ツールで描画・編集
4. 保存機能で画像をダウンロード
5. クリア機能でリセット

## コントリビューション

新機能追加時は以下を確認:
- コードの可読性
- コメントの追加
- エラーハンドリング
- タッチデバイス対応
- ブラウザ互換性

## ライセンス

MIT License
