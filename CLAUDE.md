# CLAUDE.md

このファイルは、Claude Code（AI アシスタント）がプロジェクトを理解しやすくするためのドキュメントです。

## プロジェクト概要

**画像エディター (Image Editor)**

ブラウザ上で動作する**商用レベルの画像編集アプリケーション**。ユーザーが画像をアップロードまたはペーストして、ペイントツール、テキスト入力、図形描画、回転・反転など、豊富な編集機能を使用できる。

**完成度: 100%（商用レベル）**

### 主な特徴
- ✅ 画像読み込み（4つの方法）
- ✅ ブラシ・消しゴムツール
- ✅ テキスト編集（レイヤー、移動、編集、削除、太字、斜体）
- ✅ 図形描画（矩形、円、直線、矢印）
- ✅ スポイトツール（色抽出）
- ✅ 回転・反転機能
- ✅ Undo/Redo（最大50ステップ）
- ✅ ズーム・パン機能（25%〜400%）
- ✅ カラーパレット（LocalStorage保存）
- ✅ キーボードショートカット（18種類）
- ✅ モダンなUI/UX（左サイドバー、折りたたみ、アイコン）

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

**重要: ブラシ/消しゴム描画は`baseCanvas`に永続化され、テキストレイヤーと独立して管理されます**

- **ブラシツール**: `app.js:460-508` - 自由描画（画像ロード後のみ）
  - メインキャンバスと`baseCanvas`の両方に同時に描画
  - テキストを移動/編集しても描画内容は保持される
- **消しゴムツール**: `app.js:460-508` - 白色で上書き消去（画像ロード後のみ）
  - `baseCanvas`からも消去されるため完全に削除
- **画像ロードチェック**: すべての描画操作で画像読み込みを確認
- **色選択**: カラーピッカーで色を変更
- **線の太さ調整**: スライダーで1-50px調整

### 3. テキスト入力・編集（レイヤーベースシステム）

**重要: テキストはレイヤーシステムで管理され、編集・移動・削除が可能**

#### テキストレイヤー管理
- **テキストオブジェクト配列**: `app.js:14` - `textObjects[]` で全テキストを管理
- **選択状態**: `app.js:15` - `selectedTextIndex` で選択中のテキストを追跡
- **ベースキャンバス保持**: `app.js:16` - `baseCanvas` で元の画像とブラシ描画を保持（Canvas要素）
- **ドラッグ状態**: `app.js:17-19` - `isDraggingText`, `dragStartX`, `dragStartY`

テキストオブジェクトの構造:
```javascript
{
    text: "テキスト内容",
    x: 100,                // X座標
    y: 200,                // Y座標
    fontSize: 24,          // フォントサイズ
    color: "#000000",      // 色
    fontFamily: "Arial"    // フォントファミリー
}
```

#### 主要機能
- **キャンバス再描画**: `app.js:192-224` - `redrawCanvas()` でレイヤーを順番に描画
  - `baseCanvas`（画像+ブラシ描画）→ テキストレイヤーの順に描画
  - 選択中のテキストには点線の枠を表示（視覚的フィードバック）
- **テキスト追加**: `app.js:418-427` - クリック位置に新しいテキストオブジェクトを追加
- **テキスト選択**: `app.js:277-292` - `getClickedTextIndex()` でクリック判定
- **テキスト移動**: `app.js:337-353` - 選択中のテキストをドラッグで移動
- **テキスト編集**: `app.js:466-497` - ダブルクリックで編集ダイアログを表示
  - 既存のテキスト、フォントサイズ、色、フォントを事前入力
  - OKで更新、キャンセルで変更なし
- **テキスト削除**: `app.js:751-758` - Deleteキーで選択中のテキストを削除
- **画像ロードチェック**: すべてのテキスト操作で画像読み込みを確認
- **テキスト入力ダイアログ**: `index.html:19-44` - モダンなUI/UXのテキスト入力
  - テキスト入力フィールド（最大100文字）
  - フォント選択ドロップダウン（11種類のフォント）
  - 空文字入力時のバリデーション
- **フォント選択**: 11種類のフォントから選択可能
  - 欧文: Arial, Verdana, Helvetica, Times New Roman, Georgia, Courier New, Comic Sans MS, Impact
  - 日本語: メイリオ、游ゴシック、ヒラギノ角ゴ Pro
- **入力バリデーション**: 空文字でOKを押すとエラー通知
- **キーボードショートカット**:
  - Enter: 確定
  - Escape: キャンセル
  - Delete: 選択中のテキストを削除
- **フォントサイズ**: `app.js:249-253` - 10-100pxで調整可能

### 4. 回転・反転機能

**重要: 画像とテキストを同時に変形し、座標を正確に変換します**

- **左90度回転**: `app.js:410-448` - 画像とテキストを左に90度回転
  - キャンバスサイズを自動調整（幅と高さを入れ替え）
  - テキストオブジェクトの座標を変換（x = oldY, y = oldWidth - oldX）
- **右90度回転**: `app.js:451-489` - 画像とテキストを右に90度回転
  - キャンバスサイズを自動調整（幅と高さを入れ替え）
  - テキストオブジェクトの座標を変換（x = oldHeight - oldY, y = oldX）
- **水平反転**: `app.js:492-529` - 画像とテキストを左右反転
  - テキストの幅を考慮して座標を調整
- **垂直反転**: `app.js:532-565` - 画像とテキストを上下反転
  - テキストの高さを考慮して座標を調整
- **UIボタン**: `index.html:191-197` - ツールバーに変形ボタンを追加
- **Undo/Redo対応**: すべての変形操作で履歴を自動保存

### 5. スポイトツール

**重要: 画像内の色を抽出してカラーパレットに追加します**

- **スポイトツール**: `app.js:572-596` - クリックした位置の色を抽出
  - baseCanvasからピクセルデータを取得（getImageData）
  - RGB値を16進数カラーコードに変換
  - カラーピッカーとブラシプレビューを自動更新
- **Alt+クリック**: `app.js:804-808` - 任意のツールでAltキーを押しながらクリック
  - どのツールを選択していても色を抽出可能
- **自動パレット登録**: 抽出した色を自動的にカラーパレットに追加
- **UIボタン**: `index.html:163-166` - スポイトツールボタン（💧アイコン）
- **キーボードショートカット**: 4キー、Alt+クリック

### 6. 図形描画ツール

**重要: ドラッグで図形を描画し、リアルタイムプレビューを表示します**

#### 図形描画用の変数
- **図形開始座標**: `app.js:14-15` - `shapeStartX`, `shapeStartY`
- **描画中フラグ**: `app.js:16` - `isDrawingShape`
- **塗りつぶしフラグ**: `app.js:17` - `shapeFill`
- **プレビューキャンバス**: `app.js:18` - `previewCanvas`（一時保存用）

#### 実装された図形
- **矩形ツール**: `app.js:603-634` - ドラッグで矩形を描画
  - 塗りつぶし（fillRect）/枠線（strokeRect）の切り替え
  - キーボードショートカット: 5キー
- **円ツール**: `app.js:637-676` - ドラッグで楕円を描画
  - ellipse APIを使用して楕円を描画
  - 塗りつぶし/枠線の切り替え
  - キーボードショートカット: 6キー
- **直線ツール**: `app.js:679-705` - ドラッグで直線を描画
  - lineCap: 'round' で丸い端点
  - キーボードショートカット: 7キー
- **矢印ツール**: `app.js:708-762` - ドラッグで矢印を描画
  - 三角関数で矢印の頭を計算・描画
  - headLength: 20px固定
  - キーボードショートカット: 8キー

#### 技術的な実装
- **プレビュー表示**: `app.js:872-888` - ドラッグ中にリアルタイムでプレビュー
  - previewCanvasに現在の状態を保存
  - マウス移動時にプレビューを更新
- **baseCanvas統合**: `app.js:927-949` - 図形確定時にbaseCanvasに描画
  - マウスアップ時に確定
  - 履歴に自動保存
- **ズーム対応**: すべての図形描画でズーム・パン機能と統合
  - ctx.save(), ctx.translate(), ctx.scale(), ctx.restore()を使用

#### UI/UX
- **ツールボタン**: `index.html:167-182` - 矩形、円、直線、矢印ボタン
- **図形オプション**: `index.html:199-205` - 塗りつぶしチェックボックス
- **イベントリスナー**: `app.js:1117-1119` - 塗りつぶしオプション変更

### 7. 保存・管理
- **画像保存**: `app.js:516-528` - PNG形式でタイムスタンプ付きダウンロード
- **クリア機能**: `app.js:532-544` - キャンバスを白色でリセット
  - ベース画像とテキストオブジェクトもクリア

### 8. 元に戻す/やり直し（Undo/Redo）

**重要: 最大50ステップまでの履歴を保持し、すべての操作を元に戻すことができます**

#### 履歴管理システム
- **履歴配列**: `app.js:22` - `history[]` で操作履歴を管理
- **履歴インデックス**: `app.js:23` - `historyIndex` で現在位置を追跡
- **最大履歴数**: `app.js:24` - `MAX_HISTORY = 50` で最大保持数を制限

履歴状態の構造:
```javascript
{
    imageData: ImageData,        // キャンバスの画像データ
    textObjects: [...],          // テキストオブジェクトの配列
    selectedTextIndex: -1,       // 選択中のテキスト
    baseCanvas: "data:image...", // ベースキャンバスのURL（画像+ブラシ描画）
    canvasWidth: 800,            // キャンバス幅
    canvasHeight: 600            // キャンバス高さ
}
```

#### 主要機能
- **履歴の保存**: `app.js:58-83` - `saveHistory()` で現在の状態を保存
  - 画像データ、テキストオブジェクト、キャンバスサイズを保存
  - 履歴が最大数を超えたら古いものを削除
- **履歴の復元**: `app.js:85-112` - `restoreHistory(index)` で指定した履歴を復元
- **元に戻す**: `app.js:114-122` - `undo()` で1つ前の状態に戻る
- **やり直し**: `app.js:124-132` - `redo()` で次の状態に進む
- **自動保存タイミング**:
  - 画像読み込み後: `app.js:256`
  - 描画/ドラッグ終了時: `app.js:498`
  - テキスト追加/編集後: `app.js:552`
  - テキスト削除後: `app.js:657`
  - キャンバスクリア後: `app.js:638`
- **キーボードショートカット**:
  - Ctrl+Z: 元に戻す
  - Ctrl+Y または Ctrl+Shift+Z: やり直し
- **UIボタン**: `index.html:47-51` - ツールバーに「↶ 元に戻す」「↷ やり直し」ボタンを追加
  - 履歴の状態に応じて自動的に有効/無効を切り替え
  - `app.js:60-75` - `updateUndoRedoButtons()` で動的に更新

### 9. UI/UXの改善

**重要: すべてのツールに視覚的フィードバックとアクセシビリティ機能を実装**

#### 通知システム
- **リアルタイム通知**: `app.js:167-175` - 操作の成功/失敗/情報を表示
  - 成功（緑）、エラー（赤）、情報（青）の色分け
  - 3秒後に自動消去
  - スライドインアニメーション

#### カスタムカーソル
- **ブラシサイズプレビュー**: `app.js:189-217` - `updateCursor()` でカスタムカーソルを動的生成
  - ブラシ/消しゴムツール選択時、サイズに応じた円形カーソルを表示
  - ブラシは黒、消しゴムは赤で表示
  - ブラシサイズ変更時にリアルタイムで更新
  - 16-64pxの範囲で表示（大きすぎる場合は縮小）

#### テキスト入力ダイアログ
- **モーダルダイアログ**: `style.css:255-315` - モダンなUI/UX
  - `display: none`がデフォルト、`.show`クラスで表示
  - 半透明の背景オーバーレイ
  - フォント選択ドロップダウン
  - 空文字バリデーション
  - Enter/Escapeキー対応
  - 背景クリックで閉じる

#### ボタン状態管理
- **Undo/Redoボタン**: `style.css:110-132` - disabled状態のスタイリング
  - 無効時: グレーアウト、カーソル: not-allowed
  - 有効時: 青色、ホバーエフェクト
  - アニメーション無効化（disabled時）

#### その他のUI改善
- **ドラッグビジュアル**: `style.css:134-137` - ドラッグ中の視覚フィードバック
- **ドロップヒント**: `index.html:67-71` - 画像読み込み方法のガイド表示
- **エラーハンドリング**: すべてのファイル操作とAPI呼び出しでエラー処理を実装
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

1. **画像読み込み** → `imageLoaded = true` フラグを設定 → `baseCanvas`に保存 → ドロップヒント非表示 → `saveHistory()`
2. **マウスダウン（ブラシ/消しゴム）** → `startDrawing()` → 画像ロードチェック → 描画開始位置を記録
3. **マウスムーブ（ブラシ/消しゴム）** → `draw()` → 線を描画
4. **マウスアップ** → `stopDrawing()` → 描画/ドラッグ終了 → `saveHistory()`
5. **テキストツール - 新規追加** → クリック（空白部分） → 画像ロードチェック → ダイアログ表示 → テキスト入力 → Enter/OK → `textObjects`に追加 → `redrawCanvas()` → `saveHistory()`
6. **テキストツール - 選択** → クリック（テキスト上） → `getClickedTextIndex()` → `selectedTextIndex`設定 → 選択枠表示
7. **テキストツール - 移動** → テキスト選択中にドラッグ → `draw()` → テキスト座標更新 → `redrawCanvas()` → マウスアップで `saveHistory()`
8. **テキストツール - 編集** → ダブルクリック（テキスト上） → `editText()` → ダイアログに既存値を事前入力 → Enter/OK → `textObjects`更新 → `redrawCanvas()` → `saveHistory()`
9. **テキストツール - 削除** → テキスト選択中にDeleteキー → `textObjects`から削除 → `selectedTextIndex`リセット → `redrawCanvas()` → `saveHistory()`
10. **スポイトツール** → クリック（画像上） → `pickColor()` → baseCanvasからピクセルデータ取得 → RGB→16進数変換 → カラーパレットに追加 → 通知表示
11. **Alt+クリック** → 任意のツールでAltキー押下中にクリック → スポイトツールとして動作 → 色を抽出
12. **図形描画 - 矩形/円/線/矢印** → マウスダウン → `isDrawingShape = true` → previewCanvasに保存 → マウスムーブでプレビュー表示 → マウスアップで確定 → baseCanvasに描画 → `redrawCanvas()` → `saveHistory()`
13. **回転・反転** → ボタンクリック → baseCanvasを変形 → textObjectsの座標を変換 → キャンバスサイズ調整（回転時） → `redrawCanvas()` → `saveHistory()`
14. **元に戻す** → Ctrl+Z → `undo()` → `restoreHistory(historyIndex - 1)` → 通知表示
15. **やり直し** → Ctrl+Y / Ctrl+Shift+Z → `redo()` → `restoreHistory(historyIndex + 1)` → 通知表示

## 今後の拡張案

- [x] Undo/Redo機能（履歴管理の実装が必要）✅ 実装済み
- [x] 回転・反転機能（90度回転、水平/垂直反転）✅ 実装済み
- [x] 図形描画ツール（矩形、円、線、矢印）✅ 実装済み
- [x] スポイトツール（色抽出機能）✅ 実装済み
- [ ] レイヤー機能
- [ ] フィルター効果（明度、コントラスト、ぼかしなど）
- [ ] クロップ・リサイズ機能
- [ ] JPEG、WebP形式での保存
- [ ] グラデーション塗りつぶし
- [ ] パターン塗りつぶし

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
⌨️ キーボードショートカット:
  - Ctrl+O: 画像を開く
  - Ctrl+S: 画像を保存（ファイル名編集可能）
  - Ctrl+N: 新規キャンバス（クリア）
  - Ctrl+Z: 元に戻す
  - Ctrl+Y / Ctrl+Shift+Z: やり直し
  - 1-8: ツール切り替え（ブラシ/消しゴム/テキスト/スポイト/矩形/円/直線/矢印）
  - Alt+クリック: 色を抽出（スポイト）
  - Ctrl+マウスホイール: ズームイン/アウト
  - Shift+ドラッグ: キャンバスをパン（移動）
✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除
💡 テキストは太字・斜体の設定が可能です！
🎨 カラーパレット: 最近使った色を自動保存（LocalStorage）
🔍 ズーム: 25%〜400%まで対応、細かい編集が可能
🔄 変形: 左90°/右90°回転、水平/垂直反転に対応
📐 図形描画: 矩形、円、直線、矢印を描画可能（塗りつぶし/枠線切り替え可）
💧 スポイトツール: 画像から色を抽出
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
6. **テキスト編集機能のテスト**（画像ロード後）
   - **追加**: テキストツールで空白部分をクリック → ダイアログ表示 → テキスト入力 → Enter/OK → テキストが追加される
   - **選択**: テキストをクリック → 選択枠（点線）が表示される
   - **移動**: 選択中のテキストをドラッグ → テキストが移動する
   - **編集**: テキストをダブルクリック → ダイアログに既存のテキストが表示される → 編集 → OK → テキストが更新される
   - **削除**: テキストを選択 → Deleteキー → テキストが削除される → 「テキストを削除しました」通知が表示される
   - **キーボード操作**: Enterで確定、Escapeでキャンセル、背景クリックでキャンセル
7. **スポイトツールのテスト**（画像ロード後）
   - スポイトツールを選択してクリック → 色が抽出されることを確認
   - Alt+クリック（任意のツール） → 色が抽出されることを確認
   - 抽出した色がカラーパレットに追加されることを確認
   - 抽出した色がカラーピッカーに反映されることを確認
8. **図形描画ツールのテスト**（画像ロード後）
   - **矩形**: 矩形ツールを選択 → ドラッグ → プレビュー表示 → 矩形が描画される
   - **円**: 円ツールを選択 → ドラッグ → プレビュー表示 → 楕円が描画される
   - **直線**: 直線ツールを選択 → ドラッグ → プレビュー表示 → 直線が描画される
   - **矢印**: 矢印ツールを選択 → ドラッグ → プレビュー表示 → 矢印が描画される
   - **塗りつぶしオプション**: チェックボックスで塗りつぶし/枠線を切り替え → 図形が正しく描画される
   - **Undo/Redo**: 図形描画後に元に戻す → 図形が消える → やり直し → 図形が復元される
9. **回転・反転機能のテスト**（画像ロード後）
   - **左90度回転**: ボタンをクリック → 画像とテキストが左に90度回転 → キャンバスサイズが調整される
   - **右90度回転**: ボタンをクリック → 画像とテキストが右に90度回転 → キャンバスサイズが調整される
   - **水平反転**: ボタンをクリック → 画像とテキストが左右反転
   - **垂直反転**: ボタンをクリック → 画像とテキストが上下反転
   - **Undo/Redo**: 回転・反転後に元に戻す → 元の状態に戻る
10. **保存・クリア機能のテスト**
   - 保存ボタンで画像をダウンロード（タイムスタンプ付きファイル名）
   - クリア機能でリセット（ベース画像とテキストもクリアされることを確認）
   - ドロップヒントが再表示されることを確認
11. **通知システムのテスト**
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
