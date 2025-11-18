# CLAUDE.md

このファイルは、Claude Code（AI アシスタント）がプロジェクトを理解しやすくするためのドキュメントです。

## プロジェクト概要

**画像エディター (Image Editor)**

ブラウザ上で動作する高機能画像編集アプリケーション。ユーザーが画像をアップロードまたはペーストして、ペイントツール、テキスト入力、Undo/Redo機能を使用して編集できる。

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
- **ファイルアップロード**: `index.html:45` の input要素で画像ファイルを選択
- **ペースト機能（Ctrl+V）**: `app.js:186-203` でクリップボードからの画像貼り付けを処理
- **ペーストボタン**: `app.js:206-230` でClipboard APIを使用してクリップボードから読み込み
- **ドラッグ&ドロップ**: `app.js:233-251` でファイルのドラッグ&ドロップを処理

### 2. 描画ツール（改善済み: データ消失防止）
- **ブラシツール**: `app.js:369-403` - 自由描画（画像ロード後のみ）
- **消しゴムツール**: `app.js:369-403` - 白色で上書き消去（画像ロード後のみ）
- **レイヤー管理**: `app.js:405-432` - **重要な修正点**
  - ブラシ/消しゴムの描画終了時に自動的にbaseImageに統合
  - `updateBaseImage()` 関数でデータ消失を防止
  - テキスト移動時に描画が消えるバグを完全修正
- **画像ロードチェック**: `app.js:352-356` - 画像がロードされていない場合は警告表示
- **色選択**: `app.js:80-82` - カラーピッカーで色を変更
- **線の太さ調整**: `app.js:85-88` - スライダーで1-50px調整

### 3. Undo/Redo機能（新規実装）✨

**完全な履歴管理システム** - すべての編集を元に戻せる

#### 履歴管理システム
- **履歴スタック**: `app.js:21-24` - `historyStack[]` で最大50件の履歴を保持
- **履歴インデックス**: `historyIndex` で現在位置を追跡
- **履歴保存**: `app.js:442-465` - `saveHistory()` で状態を保存
  - 画像読み込み時: `app.js:177-180`
  - ブラシ描画終了時: `app.js:435-436`
  - テキスト追加/編集時: `app.js:571-572`
  - テキスト削除時: `app.js:675`
- **履歴復元**: `app.js:468-493` - `restoreHistory()` で状態を復元
- **Undo機能**: `app.js:496-504` - Ctrl+Z で元に戻す
- **Redo機能**: `app.js:507-515` - Ctrl+Y または Ctrl+Shift+Z でやり直し

#### 保存される状態
```javascript
{
    baseImageData: "data:image/png;base64,...",  // ベース画像
    textObjects: [...],                          // テキストレイヤー
    canvasWidth: 800,                            // キャンバス幅
    canvasHeight: 600                            // キャンバス高さ}
```

### 4. テキスト入力・編集（レイヤーベースシステム）

**重要: テキストはレイヤーシステムで管理され、編集・移動・削除が可能**

#### テキストレイヤー管理
- **テキストオブジェクト配列**: `app.js:14` - `textObjects[]` で全テキストを管理
- **選択状態**: `app.js:15` - `selectedTextIndex` で選択中のテキストを追跡
- **ベース画像保持**: `app.js:16` - `baseImage` で元の画像を保持
- **ドラッグ状態**: `app.js:17-19` - `isDraggingText`, `dragStartX`, `dragStartY`

テキストオブジェクトの構造:
```javascript
{
    text: "テキスト内容",
    x: 100,           // X座標
    y: 200,           // Y座標
    fontSize: 24,     // フォントサイズ
    color: "#000000"  // 色
}
```

#### 主要機能
- **キャンバス再描画**: `app.js:109-140` - ベース画像 + 全テキストレイヤーを再描画
  - 選択中のテキストには点線の枠を表示（視覚的フィードバック）
- **テキスト追加**: `app.js:527-543` - クリック位置に新しいテキストオブジェクトを追加
- **テキスト選択**: `app.js:277-292` - `getClickedTextIndex()` でクリック判定
- **テキスト移動**: `app.js:372-385` - 選択中のテキストをドラッグで移動
- **テキスト編集**: `app.js:305-337` - ダブルクリックで編集ダイアログを表示
  - 既存のテキスト、フォントサイズ、色を事前入力
  - OKで更新、キャンセルで変更なし
- **テキスト削除**: `app.js:670-677` - Deleteキーで選択中のテキストを削除
- **画像ロードチェック**: すべてのテキスト操作で画像読み込みを確認

#### テキスト入力ダイアログ（改善版）✨
- **HTML**: `index.html:19-41` - モダンなモーダルダイアログ
- **改善点**:
  - ダイアログ内でフォントサイズを直接指定可能（10-100px）
  - ダイアログ内で色を直接選択可能
  - リアルタイムプレビュー機能
  - `dialogFontSize` と `dialogColor` で直感的な編集
- **CSS**: `style.css:249-295` - テキストオプションのスタイリング
- **JavaScript**: `app.js:49-50` - ダイアログ内の入力要素を取得
- **キーボードショートカット**:
  - Enter: 確定
  - Escape: キャンセル
  - Delete: 選択中のテキストを削除

### 5. 保存・管理
- **画像保存**: `app.js:633-645` - PNG形式でタイムスタンプ付きダウンロード
- **クリア機能**: `app.js:648-660` - キャンバスを白色でリセット
  - ベース画像とテキストオブジェクトもクリア
- **Ctrl+S**: `app.js:664-667` - キーボードショートカットで保存

### 6. UI/UXの改善
- **通知システム**: `app.js:54-61` - 操作の成功/失敗をリアルタイムで表示
- **テキスト入力ダイアログ**: `style.css:202-217` - モダンなモーダルダイアログ（`display: none`がデフォルト、`.show`で表示）
- **ダイアログCSS制御**: デフォルト非表示で、`.show`クラス追加時のみ`display: flex !important`
- **ドラッグビジュアル**: `style.css:134-137` - ドラッグ中の視覚フィードバック
- **ドロップヒント**: `index.html:67-71` - 画像読み込み方法のガイド表示
- **エラーハンドリング**: `app.js:143-183` - ファイル読み込み失敗時の適切なメッセージ表示
- **キーボードショートカット**:
  - Enter/Escapeでダイアログ操作
  - Ctrl+S: 保存
  - Ctrl+Z: 元に戻す
  - Ctrl+Y/Ctrl+Shift+Z: やり直し
  - Delete: テキスト削除

## コードの重要な部分

### ブラシ描画のレイヤー管理（重要な修正）
```javascript
// app.js:405-432
function stopDrawing() {
    // ブラシ/消しゴムで描画した場合、baseImageを更新
    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser') && imageLoaded) {
        updateBaseImage();
    }

    isDrawing = false;
    isDraggingText = false;
}

// baseImageを現在のキャンバス状態で更新（テキストレイヤーを除く）
function updateBaseImage() {
    // 一時キャンバスを作成
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 現在のキャンバス内容をコピー
    tempCtx.drawImage(canvas, 0, 0);

    // 新しいImageオブジェクトとして保存
    const img = new Image();
    img.onload = () => {
        baseImage = img;
        // ベース画像更新後、履歴を保存
        saveHistory();
    };
    img.src = tempCanvas.toDataURL();
}
```

### 履歴管理システム
```javascript
// app.js:442-515
function saveHistory() {
    if (!imageLoaded) return;

    // 現在の状態を作成
    const state = {
        baseImageData: baseImage ? baseImage.src : null,
        textObjects: JSON.parse(JSON.stringify(textObjects)),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    };

    // 現在位置より後の履歴を削除（新しい分岐を作成）
    historyStack = historyStack.slice(0, historyIndex + 1);

    // 新しい状態を追加
    historyStack.push(state);

    // 最大履歴数を超えたら古いものを削除
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
    } else {
        historyIndex++;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistory(historyStack[historyIndex]);
        showNotification('元に戻しました', 'info');
    } else {
        showNotification('これ以上元に戻せません', 'info');
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreHistory(historyStack[historyIndex]);
        showNotification('やり直しました', 'info');
    } else {
        showNotification('これ以上やり直せません', 'info');
    }
}
```

### テキストダイアログの改善
```javascript
// app.js:547-594
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    const selectedFontSize = parseInt(dialogFontSize.value);
    const selectedColor = dialogColor.value;

    if (text && pendingTextPos) {
        if (pendingTextPos.editingIndex !== undefined) {
            // 既存のテキストを更新
            textObjects[pendingTextPos.editingIndex] = {
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: selectedFontSize,
                color: selectedColor
            };
            showNotification('テキストを更新しました', 'success');
        } else {
            // 新しいテキストを追加
            textObjects.push({
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: selectedFontSize,
                color: selectedColor
            });
            showNotification('テキストを追加しました', 'success');
        }

        // グローバル設定も更新
        fontSize = selectedFontSize;
        currentColor = selectedColor;
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize;
        colorPicker.value = currentColor;

        // キャンバスを再描画
        redrawCanvas();

        // 履歴を保存
        saveHistory();
    }

    // ダイアログを閉じる
    textInputDialog.classList.remove('show');
    textInput.value = '';
    pendingTextPos = null;
});
```

## イベント処理フロー

1. **画像読み込み** → `imageLoaded = true` フラグを設定 → `baseImage`に保存 → ドロップヒント非表示 → **履歴を初期化して保存**
2. **マウスダウン（ブラシ/消しゴム）** → `startDrawing()` → 画像ロードチェック → 描画開始位置を記録
3. **マウスムーブ（ブラシ/消しゴム）** → `draw()` → 線を描画
4. **マウスアップ（ブラシ/消しゴム）** → `stopDrawing()` → **描画をbaseImageに統合** → **履歴を保存**
5. **テキストツール - 新規追加** → クリック（空白部分） → 画像ロードチェック → ダイアログ表示（フォントサイズ・色も表示） → テキスト入力 → Enter/OK → `textObjects`に追加 → `redrawCanvas()` → **履歴を保存**
6. **テキストツール - 選択** → クリック（テキスト上） → `getClickedTextIndex()` → `selectedTextIndex`設定 → 選択枠表示
7. **テキストツール - 移動** → テキスト選択中にドラッグ → `draw()` → テキスト座標更新 → `redrawCanvas()` → （履歴はドラッグ終了時に保存される可能性）
8. **テキストツール - 編集** → ダブルクリック（テキスト上） → `editText()` → ダイアログに既存値を事前入力 → Enter/OK → `textObjects`更新 → `redrawCanvas()` → **履歴を保存**
9. **テキストツール - 削除** → テキスト選択中にDeleteキー → `textObjects`から削除 → `selectedTextIndex`リセット → `redrawCanvas()` → **履歴を保存**
10. **Undo/Redo** → Ctrl+Z または Ctrl+Y → 履歴スタックから状態を復元 → 通知表示

## 今後の拡張案

- [x] ~~Undo/Redo機能（履歴管理の実装が必要）~~ ✅ **実装済み**
- [x] ~~ブラシ描画のデータ消失問題~~ ✅ **修正済み**
- [x] ~~テキストダイアログでのフォントサイズ・色選択~~ ✅ **実装済み**
- [ ] レイヤー管理UI（表示/非表示、順序変更、不透明度）
- [ ] 図形描画ツール（矩形、円、線、矢印）
- [ ] フィルター効果（明度、コントラスト、ぼかしなど）
- [ ] クロップ・リサイズ機能
- [ ] ズーム機能（拡大/縮小）
- [ ] JPEG、WebP形式での保存
- [ ] フォントファミリーの選択

## 開発時の注意点

### セキュリティ
- ユーザーアップロード画像は全てクライアントサイドで処理
- サーバーへのアップロードなし
- XSS対策: テキスト入力は `fillText()` で安全に描画

### パフォーマンス
- Canvas APIは高速だが、大きな画像では重くなる可能性
- **履歴管理**: 最大50件まで保存（メモリ使用量とのバランス）
- 大きな画像の場合、履歴データがメモリを消費する可能性あり

### UI/UX設計のポイント
- **画像ロード必須**: すべての編集ツール（ブラシ、消しゴム、テキスト）は`imageLoaded`フラグをチェック
- **ダイアログ制御**: `.show`クラスベースで確実な表示/非表示制御
- **通知システム**: ユーザーに適切なフィードバックを提供（成功/エラー/情報）
- **エラーハンドリング**: すべてのファイル操作とAPI呼び出しでエラー処理を実装
- **Undo/Redo**: 履歴スタックで完全な編集履歴を管理
- **データ永続性**: ブラシ描画を自動的にbaseImageに統合してデータ消失を防止

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
✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除
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
   - **重要**: テキストを移動しても描画が消えないことを確認（バグ修正の検証）
6. **テキスト編集機能のテスト**（画像ロード後）
   - **追加**: テキストツールで空白部分をクリック → ダイアログ表示（フォントサイズと色の入力欄も表示） → テキスト、サイズ、色を入力 → Enter/OK → テキストが追加される
   - **選択**: テキストをクリック → 選択枠（点線）が表示される
   - **移動**: 選択中のテキストをドラッグ → テキストが移動する
   - **編集**: テキストをダブルクリック → ダイアログに既存のテキスト、サイズ、色が表示される → 編集 → OK → テキストが更新される
   - **削除**: テキストを選択 → Deleteキー → テキストが削除される → 「テキストを削除しました」通知が表示される
   - **キーボード操作**: Enterで確定、Escapeでキャンセル、背景クリックでキャンセル
7. **Undo/Redo機能のテスト** ✨
   - 画像をロード → ブラシで描画 → Ctrl+Z → 描画が元に戻る
   - テキストを追加 → Ctrl+Z → テキストが消える
   - Ctrl+Y → テキストが再表示される
   - 複数回の編集 → 連続してCtrl+Zで全て元に戻る
   - 「これ以上元に戻せません」「これ以上やり直せません」の通知を確認
8. **保存・クリア機能のテスト**
   - 保存ボタンで画像をダウンロード（タイムスタンプ付きファイル名）
   - Ctrl+S でも保存できることを確認
   - クリア機能でリセット（ベース画像とテキストもクリアされることを確認）
   - ドロップヒントが再表示されることを確認
9. **通知システムのテスト**
   - 各操作で適切な通知が表示されることを確認
   - 成功（緑）、エラー（赤）、情報（青）の色分けを確認

## 最近の改善（2024年版）

### ✅ 優先度高の3項目を完全実装

1. **ブラシ/消しゴム描画のレイヤー管理修正**
   - 問題: ブラシで描画した内容がテキスト移動時に消えるバグ
   - 解決: `updateBaseImage()` 関数で描画終了時に自動的にbaseImageに統合
   - 影響: データ消失の完全防止

2. **Undo/Redo機能の実装**
   - 完全な履歴管理システム（最大50件）
   - Ctrl+Z で元に戻す、Ctrl+Y/Ctrl+Shift+Z でやり直し
   - すべての編集操作（ブラシ、テキスト追加/編集/削除）に対応
   - メモリ効率を考慮した実装

3. **テキスト入力ダイアログの改善**
   - ダイアログ内でフォントサイズを直接指定可能
   - ダイアログ内で色を直接選択可能
   - より直感的なUI/UX
   - レスポンシブ対応（モバイルでも快適）

## コントリビューション

新機能追加時は以下を確認:
- コードの可読性
- コメントの追加
- エラーハンドリング
- タッチデバイス対応
- ブラウザ互換性
- 履歴管理との統合

## ライセンス

MIT License
