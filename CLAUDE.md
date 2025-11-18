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
- **ファイルアップロード**: `index.html:33` の input要素で画像ファイルを選択
- **ペースト機能（Ctrl+V）**: `app.js:116-133` でクリップボードからの画像貼り付けを処理
- **ペーストボタン**: `app.js:136-160` でClipboard APIを使用してクリップボードから読み込み
- **ドラッグ&ドロップ**: `app.js:163-181` でファイルのドラッグ&ドロップを処理

### 2. 描画ツール
- **ブラシツール**: `app.js:151-162` - 自由描画（画像ロード後のみ）
- **消しゴムツール**: `app.js:151-162` - 白色で上書き消去（画像ロード後のみ）
- **画像ロードチェック**: `app.js:140-143` - 画像がロードされていない場合は警告表示
- **色選択**: `app.js:68-70` - カラーピッカーで色を変更
- **線の太さ調整**: `app.js:73-76` - スライダーで1-50px調整

### 3. テキスト入力
- **テキスト追加**: `app.js:171-185` - クリック位置にテキストを配置
- **画像ロードチェック**: `app.js:173-176` - 画像がロードされていない場合は警告表示
- **テキスト入力ダイアログ**: `index.html:19-28` - モダンなUI/UXのテキスト入力
- **ダイアログ表示制御**: `app.js:182` で`.show`クラスを追加して表示
- **キーボードショートカット**: `app.js:212-225` でEnter確定、Escape でキャンセル
- **背景クリックで閉じる**: `app.js:228-232` でダイアログ外クリックで閉じる
- **フォントサイズ**: `app.js:79-82` - 10-100pxで調整可能

### 4. 保存・管理
- **画像保存**: `app.js:202-214` - PNG形式でタイムスタンプ付きダウンロード
- **クリア機能**: `app.js:217-225` - キャンバスを白色でリセット

### 5. UI/UXの改善
- **通知システム**: `app.js:46-53` - 操作の成功/失敗をリアルタイムで表示
- **テキスト入力ダイアログ**: `style.css:202-217` - モダンなモーダルダイアログ（`display: none`がデフォルト、`.show`で表示）
- **ダイアログCSS制御**: デフォルト非表示で、`.show`クラス追加時のみ`display: flex !important`
- **ドラッグビジュアル**: `style.css:134-137` - ドラッグ中の視覚フィードバック
- **ドロップヒント**: `index.html:51-55` - 画像読み込み方法のガイド表示
- **エラーハンドリング**: `app.js:84-112` - ファイル読み込み失敗時の適切なメッセージ表示
- **キーボードショートカット**: Enter/Escapeでダイアログ操作、背景クリックでも閉じる

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
// app.js:46-53
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
// app.js:163-181
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
// app.js:136-160
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
// app.js:208-216
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

### テキストダイアログCSS制御（重要な実装詳細）
```css
/* style.css:202-217 */
.text-input-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none;  /* デフォルトで非表示 */
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.text-input-dialog.show {
    display: flex !important;  /* .showクラス追加で表示 */
}
```

**実装のポイント:**
- デフォルトで`display: none;`なので初期状態では非表示
- `.show`クラスを追加すると`display: flex !important;`で確実に表示
- `!important`でCSS優先順位の問題を解決

### テキスト入力ダイアログ
```javascript
// app.js:171-232
function addText(e) {
    // 画像がロードされていない場合は警告
    if (!imageLoaded) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    const pos = getMousePos(e);
    pendingTextPos = pos;

    // ダイアログを表示（.showクラスを追加）
    textInputDialog.classList.add('show');
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
    // ダイアログを閉じる（.showクラスを削除）
    textInputDialog.classList.remove('show');
    pendingTextPos = null;
});

// キャンセルボタン
textCancelBtn.addEventListener('click', () => {
    textInputDialog.classList.remove('show');
    pendingTextPos = null;
});

// Enterキーで確定、Escapeでキャンセル
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        textOkBtn.click();
    }
});

textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        textCancelBtn.click();
    }
});

// ダイアログの背景クリックで閉じる
textInputDialog.addEventListener('click', (e) => {
    if (e.target === textInputDialog) {
        textCancelBtn.click();
    }
});
```

## UI/UX設計

### カラースキーム
- **プライマリーカラー**: `#667eea` (紫青系)
- **グラデーション**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **背景**: `#ecf0f1` (明るいグレー)

### レスポンシブ対応
- `style.css:285-306` - メディアクエリで768px以下の画面に対応
- タッチイベント処理: `app.js:235-250`

## イベント処理フロー

1. **画像読み込み** → `imageLoaded = true` フラグを設定 → ドロップヒント非表示
2. **マウスダウン** → `startDrawing()` → 画像ロードチェック → 描画開始位置を記録
3. **マウスムーブ** → `draw()` → 線を描画
4. **マウスアップ** → `stopDrawing()` → 描画終了
5. **テキストツール** → クリック → 画像ロードチェック → モーダルダイアログ表示 → テキスト入力 → Enter/OKで確定 → テキスト配置

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

### UI/UX設計のポイント
- **画像ロード必須**: すべての編集ツール（ブラシ、消しゴム、テキスト）は`imageLoaded`フラグをチェック
- **ダイアログ制御**: `.show`クラスベースで確実な表示/非表示制御
- **通知システム**: ユーザーに適切なフィードバックを提供（成功/エラー/情報）
- **エラーハンドリング**: すべてのファイル操作とAPI呼び出しでエラー処理を実装

### ブラウザ互換性
- モダンブラウザ（Chrome、Firefox、Safari、Edge）で動作
- Canvas API と FileReader API が必須
- Clipboard API（ペーストボタン）は一部ブラウザで権限が必要

## デバッグ情報

開発者コンソールで以下のメッセージが表示されます:
```
🎨 画像エディターが読み込まれました！
📋 Ctrl+V で画像を貼り付けることができます
🖱️ 画像をドラッグ&ドロップすることもできます
```

さらに、ページロード時に「画像エディターへようこそ！」という通知が表示されます。

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
2. **初期状態のテスト**
   - テキストダイアログが表示されていないことを確認
   - ドロップヒントが表示されていることを確認
   - 「画像エディターへようこそ！」通知が表示されることを確認
3. **画像読み込みのテスト**（全4方法）
   - アップロードボタンをクリックしてファイルを選択
   - 画像ファイルをキャンバスにドラッグ&ドロップ
   - 画像をコピーして Ctrl+V でペースト
   - ペーストボタンをクリック
   - 画像読み込み後、ドロップヒントが非表示になることを確認
4. **画像ロードチェックのテスト**
   - 画像をロードする前にブラシ/消しゴム/テキストツールを使用
   - 「先に画像をアップロードまたはペーストしてください」警告が表示されることを確認
5. **描画ツールのテスト**（画像ロード後）
   - ブラシで描画
   - 消しゴムで消去
   - テキスト追加（ダイアログが表示され、Enterで確定、Escapeでキャンセル、背景クリックでキャンセル）
6. **保存・クリア機能のテスト**
   - 保存ボタンで画像をダウンロード（タイムスタンプ付きファイル名）
   - クリア機能でリセット（ドロップヒントが再表示されることを確認）
7. **通知システムのテスト**
   - 各操作で適切な通知が表示されることを確認
   - 成功（緑）、エラー（赤）、情報（青）の色分けを確認

## コントリビューション

新機能追加時は以下を確認:
- コードの可読性
- コメントの追加
- エラーハンドリング
- タッチデバイス対応
- ブラウザ互換性

## ライセンス

MIT License
