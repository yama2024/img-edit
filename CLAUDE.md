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

### 1. 画像読み込み（4つの方法）
- **ファイルアップロード**: `index.html:21` の input要素で画像ファイルを選択
- **ペースト機能（Ctrl+V）**: `app.js:130-147` でクリップボードからの画像貼り付けを処理
- **ペーストボタン**: `app.js:150-174` でClipboard APIを使用してクリップボードから読み込み
- **ドラッグ&ドロップ**: `app.js:177-195` でファイルのドラッグ&ドロップを処理

### 2. 描画ツール
- **ブラシツール**: `app.js:235-251` - 自由描画
- **消しゴムツール**: `app.js:235-251` - 白色で上書き消去
- **色選択**: `app.js:66-68` - カラーピッカーで色を変更
- **線の太さ調整**: `app.js:71-74` - スライダーで1-50px調整

### 3. テキスト入力
- **テキスト追加**: `app.js:261-309` - クリック位置にテキストを配置
- **テキスト入力ダイアログ**: `index.html:19-28` - モダンなUI/UXのテキスト入力
- **キーボードショートカット**: Enterで確定、Escapeでキャンセル
- **フォントサイズ**: `app.js:77-80` - 10-100pxで調整可能

### 4. 保存・管理
- **画像保存**: `app.js:288-300` - PNG形式でタイムスタンプ付きダウンロード
- **クリア機能**: `app.js:303-311` - キャンバスを白色でリセット

### 5. UI/UXの改善
- **通知システム**: `app.js:42-49` - 操作の成功/失敗をリアルタイムで表示
- **テキスト入力ダイアログ**: `style.css:201-262` - モダンなモーダルダイアログ
- **ドラッグビジュアル**: `style.css:134-137` - ドラッグ中の視覚フィードバック
- **ドロップヒント**: `index.html:55-59` - 画像読み込み方法のガイド表示
- **エラーハンドリング**: ファイル読み込み失敗時の適切なメッセージ表示
- **キーボードショートカット**: Enter/Escapeでダイアログ操作

## コードの重要な部分

### キャンバス初期化
```javascript
// app.js:1-15
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
```

### 通知システム
```javascript
// app.js:42-49
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
```

### ドラッグ&ドロップ処理
```javascript
// app.js:177-195
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImageFromFile(files[0]);
    }
});
```

### Clipboard API（ペーストボタン）
```javascript
// app.js:150-174
pasteBtn.addEventListener('click', async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    loadImageFromFile(blob);
                    break;
                }
            }
        }
    } catch (err) {
        showNotification('Ctrl+V を使用して画像を貼り付けてください', 'info');
    }
});
```

### 座標計算（レスポンシブ対応）
```javascript
// app.js:213-221
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

### テキスト入力ダイアログ
```javascript
// app.js:261-316
function addText(e) {
    const pos = getMousePos(e);
    pendingTextPos = pos;

    // ダイアログを表示
    textInputDialog.classList.remove('hidden');
    textInput.value = '';
    textInput.focus();
}

// OKボタンでテキストを描画
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text && pendingTextPos) {
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = currentColor;
        ctx.fillText(text, pendingTextPos.x, pendingTextPos.y);
        showNotification('テキストを追加しました', 'success');
    }
    textInputDialog.classList.add('hidden');
});
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

- モダンブラウザ（ES6+ 対応）
- Canvas API対応
- FileReader API対応
- Clipboard API対応（ペースト機能用）
- Drag and Drop API対応
- async/await対応（ペーストボタン用）

## テスト方法

### 基本機能のテスト
1. ブラウザで `index.html` を開く
2. **画像読み込みのテスト**（全4方法）
   - アップロードボタンをクリックしてファイルを選択
   - 画像ファイルをキャンバスにドラッグ&ドロップ
   - 画像をコピーして Ctrl+V でペースト
   - ペーストボタンをクリック
3. **描画ツールのテスト**
   - ブラシで描画
   - 消しゴムで消去
   - テキスト追加（ダイアログが表示され、Enterで確定、Escapeでキャンセル）
4. **保存・クリア機能のテスト**
   - 保存ボタンで画像をダウンロード
   - クリア機能でリセット
5. **通知システムのテスト**
   - 各操作で適切な通知が表示されることを確認

## コントリビューション

新機能追加時は以下を確認:
- コードの可読性
- コメントの追加
- エラーハンドリング
- タッチデバイス対応
- ブラウザ互換性

## ライセンス

MIT License
