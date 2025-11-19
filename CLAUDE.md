# CLAUDE.md

このファイルは、Claude Code（AI アシスタント）がプロジェクトを理解しやすくするためのドキュメントです。

## プロジェクト概要

**画像エディター (Image Editor)**

ブラウザ上で動作する画像編集アプリケーション。ユーザーが画像をアップロードまたはペーストして、ペイントツール、図形描画、テキスト入力で編集できる。

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

### 3. 図形描画ツール（レイヤーベースシステム）

**重要: 図形はレイヤーシステムで管理され、選択・移動・サイズ変更・削除が可能**

#### 図形レイヤー管理
- **図形オブジェクト配列**: `app.js:22` - `shapeObjects[]` で全図形を管理
- **選択状態**: `app.js:23` - `selectedShapeIndex` で選択中の図形を追跡
- **描画状態**: `app.js:24-27` - `isDrawingShape`, `shapeStartX`, `shapeStartY`, `previewShape`
- **ドラッグ・リサイズ状態**: `app.js:32-34` - `isDraggingShape`, `isResizingShape`, `resizeHandle`

図形オブジェクトの構造:
```javascript
{
    type: 'rectangle' | 'circle' | 'line' | 'arrow',  // 図形の種類
    x: 100,            // X座標
    y: 200,            // Y座標
    width: 150,        // 幅
    height: 100,       // 高さ
    fill: "#3498db",   // 塗りつぶし色
    stroke: "#000000", // 枠線色
    lineWidth: 5,      // 線の太さ
    hasFill: true,     // 塗りつぶし有無
    hasStroke: true    // 枠線有無
}
```

#### 図形の種類
- **矩形（Rectangle）**: 塗りつぶしと枠線が可能な長方形
- **正方形（Square）**: 幅と高さが等しい正方形（アスペクト比1:1）
- **円（Circle）**: 楕円も描画可能（ellipse APIを使用）
- **直線（Line）**: シンプルな直線
- **矢印（Arrow）**: 矢印の頭部付き直線

#### 主要機能
- **図形描画**: `app.js:205-279` - `drawShape()` で4種類の図形を描画
- **リアルタイムプレビュー**: `app.js:723-742` - ドラッグ中に図形をプレビュー表示
- **図形選択**: `app.js:475-495` - `getClickedShapeIndex()` でクリック判定
- **図形移動**: `app.js:709-721` - 選択中の図形をドラッグで移動
- **サイズ変更**: `app.js:667-706` - 8つのハンドル（四隅と辺の中央）でリサイズ
- **ハンドル表示**: `app.js:281-321` - 選択中の図形にリサイズハンドルを表示
- **図形削除**: `app.js:956-964` - Deleteキーで選択中の図形を削除
- **画像ロードチェック**: すべての図形操作で画像読み込みを確認
- **色設定**:
  - 塗りつぶし色: `app.js:125-127` - fillColorPicker
  - 枠線色: `app.js:129-131` - strokeColorPicker
- **塗りつぶし/枠線切り替え**: `app.js:133-140` - チェックボックスで有無を制御

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
- **キャンバス再描画**: `app.js:108-140` - ベース画像 + 全テキストレイヤーを再描画
  - 選択中のテキストには点線の枠を表示（視覚的フィードバック）
- **テキスト追加**: `app.js:418-427` - クリック位置に新しいテキストオブジェクトを追加
- **テキスト選択**: `app.js:277-292` - `getClickedTextIndex()` でクリック判定
- **テキスト移動**: `app.js:337-353` - 選択中のテキストをドラッグで移動
- **テキスト編集**: `app.js:294-323` - ダブルクリックで編集ダイアログを表示
  - 既存のテキスト、フォントサイズ、色を事前入力
  - OKで更新、キャンセルで変更なし
- **テキスト削除**: `app.js:551-558` - Deleteキーで選択中のテキストを削除
- **画像ロードチェック**: すべてのテキスト操作で画像読み込みを確認
- **テキスト入力ダイアログ**: `index.html:19-28` - モダンなUI/UXのテキスト入力
- **キーボードショートカット**:
  - Enter: 確定
  - Escape: キャンセル
  - Delete: 選択中のテキストを削除
- **フォントサイズ**: `app.js:91-94` - 10-100pxで調整可能

### 5. トリミング機能（プロフェッショナル品質）

**重要: トリミング機能は大幅に改善され、プロフェッショナル品質に向上**

#### トリミング状態管理
- **トリミングモード**: `isCropping` - トリミングモードの有効/無効
- **トリミング範囲**: `cropRect` - { x, y, width, height } で範囲を管理
- **操作状態**: `isCreatingCropRect`, `isDraggingCrop`, `isResizingCrop` - 各操作状態を管理
- **リサイズハンドル**: `cropResizeHandle` - 現在操作中のハンドルを追跡

#### 主要機能
- **8つのリサイズハンドル**: トリミング範囲の四隅と辺の中央にハンドルを配置
  - 四隅（nw, ne, se, sw）: 対角方向にリサイズ
  - 辺の中央（n, e, s, w）: 一方向にリサイズ
- **範囲の移動**: トリミング範囲内をドラッグして自由に移動
- **範囲のリサイズ**: ハンドルをドラッグしてサイズ変更
- **3x3グリッド線**: 三分割法のガイドラインを表示（構図確認用）
- **範囲外オーバーレイ**: トリミング範囲外を暗くして選択範囲を強調
- **リアルタイムサイズ表示**: 現在の範囲サイズをピクセル単位で表示
- **範囲内のプレビュー**: トリミング中もテキストと図形を表示
- **キャンバス範囲制限**: 範囲がキャンバス外に出ないように制限
- **最小サイズ制限**: 10px未満の小さすぎる範囲を防止

#### 操作フロー
1. **トリミングボタンをクリック** → トリミングモード開始
2. **ドラッグで範囲を作成** → `isCreatingCropRect = true` → リアルタイムプレビュー
3. **範囲を調整**:
   - 範囲内をドラッグ → 移動
   - ハンドルをドラッグ → サイズ変更
4. **適用ボタンをクリック** → トリミング実行 → キャンバスサイズ更新
5. **キャンセルボタンをクリック** → トリミングモード終了

#### トリミング適用時の処理
- ベース画像を指定範囲でトリミング
- テキストと図形の座標を調整（範囲の左上を原点に）
- 範囲外のテキストと図形を削除
- キャンバスサイズをトリミング範囲に合わせて更新
- 履歴に保存（Undo可能）

### 6. 保存・管理
- **画像保存**: `app.js:910-922` - PNG形式でタイムスタンプ付きダウンロード
- **クリア機能**: `app.js:924-937` - キャンバスを白色でリセット
  - ベース画像、テキストオブジェクト、図形オブジェクトをすべてクリア

### 7. Undo/Redo機能（履歴管理）

**重要: 完全な履歴管理システムを実装**

#### 履歴管理
- **履歴配列**: `history[]` - 最大50件の状態を保持
- **履歴インデックス**: `historyIndex` - 現在の履歴位置を追跡
- **復元中フラグ**: `isRestoring` - 無限ループ防止

#### 保存される状態
- キャンバスデータ（画像全体）
- テキストオブジェクト配列
- 図形オブジェクト配列
- ベース画像データ
- キャンバスサイズ（width, height）

#### 操作
- **Undo（元に戻す）**: Ctrl+Z（Mac: Cmd+Z）または Undoボタン
- **Redo（やり直し）**: Ctrl+Y（Mac: Cmd+Y）または Ctrl+Shift+Z（Mac: Cmd+Shift+Z）または Redoボタン
- **自動保存**: 図形追加、テキスト追加、描画、トリミングなど、すべての編集操作後に自動保存
- **ボタン制御**: Undoボタンは履歴がない場合に無効化、Redoボタンは先の履歴がない場合に無効化

### 8. UI/UXの改善（プロフェッショナル品質）

**重要: 最新のUI/UX改善により、プロフェッショナル品質のインターフェースを実装**

#### ✨ インテリジェントツールチップシステム（CSS-only実装）
- **実装場所**: `style.css:77-125` - `[data-tooltip]`属性ベースのツールチップ
- **技術詳細**:
  ```css
  [data-tooltip]::before {
    content: attr(data-tooltip);
    transform: translateX(-50%) scale(0);
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  ```
- **特徴**:
  - 30個以上のツールチップを全ボタン・コントロールに追加
  - スプリングアニメーション（`cubic-bezier(0.68, -0.55, 0.265, 1.55)`）
  - JavaScript不要の軽量実装
  - `::before`でツールチップ本体、`::after`で矢印を表示
  - `z-index: 10000`で常に最前面表示
  - ホバー/フォーカス時に`scale(0) → scale(1)`でアニメーション

#### 🎨 モダンなマイクロインタラクション
- **実装場所**: `style.css:127-235` - ボタン・ツールボタンのインタラクション
- **ボタンホバーエフェクト**:
  - 浮き上がり効果: `transform: translateY(-3px)`
  - シャドウ拡大: `0 6px 20px rgba(102, 126, 234, 0.4)`
  - グラデーションオーバーレイ: `::before`疑似要素で実装
- **フォーカスエフェクト**:
  - アウトラインシャドウ: `box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3)`
  - キーボードナビゲーション対応
- **アクティブ状態**:
  - ツールボタン: `scale(1.05)` + 枠線表示
  - 視覚的フィードバックで選択状態を明確化

#### 🎛️ カスタムスタイル化されたコントロール
- **レンジスライダー**: `style.css:200-260` - 完全カスタムスタイル
  ```css
  input[type="range"] {
    -webkit-appearance: none;
    background: linear-gradient(to right, #667eea, #764ba2);
  }
  input[type="range"]::-webkit-slider-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.3);
  }
  ```
- **チェックボックス**: `style.css:262-277` - モダンなスタイル
  - `accent-color: #667eea` でブランドカラー適用
  - ホバー時に`scale(1.1)`
  - フォーカス時にアウトライン表示
- **カラーピッカー**: `style.css:237-263` - 視覚的改善
  - ホバー時に`scale(1.1)` + 枠線色変更
  - `box-shadow`で奥行き感

#### ♿ アクセシビリティ向上（WCAG準拠）
- **実装場所**: `index.html:184-257` - 全インタラクティブ要素にARIA属性
- **ARIAラベル**:
  ```html
  <button id="uploadBtn"
          data-tooltip="ファイルから画像を読み込む"
          aria-label="画像をアップロード">
  ```
- **キーボードナビゲーション**:
  - すべてのボタン・コントロールにフォーカス状態
  - `outline`と`box-shadow`で視覚的フィードバック
  - Tab/Shift+Tabで順次移動可能
- **スクリーンリーダー対応**:
  - 全要素に説明的な`aria-label`
  - 画像のalt属性
  - セマンティックHTML構造

#### 🔤 洗練されたタイポグラフィ
- **実装場所**: `style.css:7-20` - bodyとhtmlのスタイル
- **システムフォントスタック**:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
               'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  ```
- **フォントスムージング**:
  - `-webkit-font-smoothing: antialiased`
  - `-moz-osx-font-smoothing: grayscale`
  - macOSとiOSで滑らかな文字表示
- **スムーズスクロール**:
  - `scroll-behavior: smooth` でページ内リンクがスムーズにスクロール

#### 🎬 高品質なアニメーション
- **コンテナフェードイン**: `style.css:22-41`
  ```css
  @keyframes containerFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```
- **Cubic-bezierイージング**:
  - ボタン: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Designのeasing
  - ツールチップ: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - スプリング効果
  - スライダー: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - バウンス効果
- **レイヤード・ボックスシャドウ**:
  - `box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25), 0 10px 25px rgba(0, 0, 0, 0.15)`
  - 複数のシャドウで奥行き感を演出
- **パフォーマンス最適化**:
  - `transform`と`opacity`のみをアニメーション（GPU加速）
  - `will-change`は使用せず、必要時のみブラウザが最適化

#### 📋 以前のUI改善（すでに実装済み）
- **描画ツールの固定表示**: `position: sticky` で画面スクロール時も描画ツールを表示
  - 選択、ブラシ、消しゴム、テキストツールが常に手の届く位置に
  - 紫色の枠線で視覚的に強調
- **UIラベルのシンプル化**: すべてのセクション名を短く、わかりやすく改善
  - 「描画色」→「描画」
  - 「塗りつぶし色」→「塗り」
  - 「枠線色」→「枠線」
- **セクションの統合**: 関連する設定を1つのセクションにまとめて整理
  - 「塗り・枠線」セクション: 塗りつぶし/枠線のチェックボックスと3つの色設定
  - 「サイズ」セクション: 線、消しゴム、文字のサイズ設定
- **使い方セクションのブロック化**: 6つのカードスタイルブロックで見やすく表示
  - グリッドレイアウトで整然と配置
  - ホバー時にアニメーション効果
  - 各ブロックに絵文字アイコンを追加
- **フォントサイズの改善**: セクション名を大きく（1.35em）、太く（700）して視認性向上

#### 基本的なUI機能
- **通知システム**: 操作の成功/失敗をリアルタイムで表示
- **テキスト入力ダイアログ**: モダンなモーダルダイアログ（`display: none`がデフォルト、`.show`で表示）
- **ダイアログCSS制御**: デフォルト非表示で、`.show`クラス追加時のみ`display: flex !important`
- **ドラッグビジュアル**: ドラッグ中の視覚フィードバック
- **ドロップヒント**: 画像読み込み方法のガイド表示
- **エラーハンドリング**: ファイル読み込み失敗時の適切なメッセージ表示
- **キーボードショートカット**: Enter/Escapeでダイアログ操作、背景クリックでも閉じる

### 9. スマートフォン・タブレット完全対応

**重要: 画像エディターはスマートフォンでも完全に利用可能**

#### レスポンシブデザイン実装
- **メディアクエリ**: `style.css:662-1014` - 4段階のブレークポイント
  - 1024px以下: タブレット向け最適化
  - 768px以下: 大型スマホ・小型タブレット向け
  - 480px以下: スマートフォン向け
  - 360px以下: 極小スマートフォン向け

#### viewport設定（重要）
```html
<!-- index.html:5-8 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
```

**設定の意味**:
- `maximum-scale=1.0, user-scalable=no`: ピンチズームを防止（編集操作の誤動作防止）
- `viewport-fit=cover`: ノッチ付きデバイスでの表示最適化
- `apple-mobile-web-app-capable`: iOS ホーム画面追加時にアプリモード
- `mobile-web-app-capable`: Android ホーム画面追加時にアプリモード

#### タッチ操作最適化
- **タッチイベント**: `app.js:1572-1590` - マウスイベントへの変換
- **ダブルタップズーム防止**: `app.js:1972-1979` - 300ms以内の連続タップを検知
- **ピンチズーム防止**: `app.js:1993-2003` - gestureイベントの制御（Safari用）
- **タッチフィードバック**: `app.js:2006-2017` - ボタンタップ時の視覚フィードバック
- **スクロール制御**: `app.js:1982-1990` - キャンバス上のスクロールを防止

#### タッチターゲットサイズ
- **768px以下**: ボタン最小サイズ44x44px（Apple推奨）
- **480px以下**: ボタン最小サイズ48x48px（Google推奨）
- **カラーピッカー**: 768px以下で44x44px、480px以下で48x48px

#### レイアウト調整
- **ツールバー**: 768px以下で縦並び（`flex-direction: column`）
- **ダイアログ**: 768px以下で画面幅95%、480px以下で全画面モーダル
- **通知**: 768px以下で上部中央に表示（右上だと見づらい）
- **トリミングコントロール**: 768px以下で縦並び、全幅ボタン
- **サイズ設定**: 480px以下で縦並び

#### キャンバスサイズ調整
- **初期サイズ設定**: `app.js:57-78` - 画面サイズに応じた初期キャンバスサイズ
  - モバイル（768px以下）: 画面幅に合わせて最大600x450px
  - デスクトップ: 800x600px
- **画面回転対応**: `app.js:2076-2081` - `orientationchange`イベントで自動調整
- **ウィンドウリサイズ**: `app.js:2044-2073` - リサイズ時に既存コンテンツを保持して調整

#### モバイルブラウザ対応
- **iOS Safari**: gestureイベントでピンチズーム防止、-webkit-プレフィックス対応
- **Android Chrome**: passive: false でデフォルト動作を制御
- **タッチイベント**: touchstart, touchmove, touchend を mouseイベントに変換

#### フォントサイズ最適化
- **iOS ズーム防止**: 480px以下でinput/textareaを16px以上に設定（iOS自動ズーム防止）
- **テキストサイズ**: 画面サイズに応じて段階的に調整

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

## UI/UX設計（プロフェッショナル品質）

### カラースキーム
- **プライマリーカラー**: `#667eea` (紫青系) - ボタン、ツールチップ、フォーカス状態に使用
- **セカンダリーカラー**: `#764ba2` (紫系) - グラデーションの終点
- **グラデーション**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` - ボタン、ヘッダー、スライダーに統一使用
- **背景**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` with `background-attachment: fixed` - パララックス効果
- **コンテナ背景**: `white` - 清潔感のある白
- **キャンバス背景**: `#ecf0f1` (明るいグレー) - 画像編集エリア

### デザインシステム
- **ボーダーラジウス**:
  - コンテナ: `20px` - 大きめの角丸で現代的な印象
  - ボタン: `8px` - 適度な角丸
  - カラーピッカー: `8px`
  - ダイアログ: `15px`
- **シャドウシステム**:
  - コンテナ: レイヤード（`0 25px 70px`, `0 10px 25px`） - 深い奥行き感
  - ボタン通常: `0 2px 8px rgba(102, 126, 234, 0.25)` - 軽い浮遊感
  - ボタンホバー: `0 6px 20px rgba(102, 126, 234, 0.4)` - 大きな浮遊感
  - ツールチップ: `0 4px 12px rgba(0, 0, 0, 0.3)` - 明確な分離
- **アニメーションタイミング**:
  - 標準: `0.25s cubic-bezier(0.4, 0, 0.2, 1)` - Material Design標準
  - スプリング: `0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)` - バウンス効果
  - レンジスライダー: `0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)` - 強めのバウンス

### タイポグラフィシステム
- **フォントファミリー**: システムフォントスタック（最高のパフォーマンス）
- **フォントスムージング**: `-webkit-font-smoothing: antialiased`
- **サイズスケール**:
  - H1: レスポンシブ（1.1em - 2em）
  - H3: `1em` - セクション名（読みやすさ重視）
  - ボタン: `14px` - タッチターゲットに最適
  - ツールチップ: `13px` - コンパクトながら読みやすい
- **フォントウェイト**:
  - ボタン: `600` - セミボールド
  - セクション名: `700` - ボールド

### レスポンシブ対応（4段階ブレークポイント）
- **1024px以下**: タブレット向け最適化
- **768px以下**: 大型スマホ・小型タブレット向け（ツールバー縦並び、ボタン44px以上）
- **480px以下**: スマートフォン向け（ボタン48px以上、縦並びレイアウト）
- **360px以下**: 極小スマートフォン向け（コンパクトUI）
- タッチイベント処理: タッチをマウスイベントに変換、ダブルタップズーム防止、ピンチズーム防止

### アクセシビリティガイドライン（WCAG 2.1 AA準拠）
- **キーボードナビゲーション**: すべてのインタラクティブ要素がTabで操作可能
- **フォーカスインジケーター**: `box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3)` で明確に表示
- **ARIAラベル**: すべてのボタン・コントロールに説明的なラベル
- **スクリーンリーダー**: セマンティックHTML、適切なaria-label
- **タッチターゲット**: 最小44x44px（Apple推奨）、スマホでは48x48px（Google推奨）
- **カラーコントラスト**: 背景と前景のコントラスト比を確保

## イベント処理フロー

1. **画像読み込み** → `imageLoaded = true` フラグを設定 → `baseImage`に保存 → テキスト・図形をクリア → ドロップヒント非表示
2. **マウスダウン（ブラシ/消しゴム）** → `startDrawing()` → 画像ロードチェック → 描画開始位置を記録
3. **マウスムーブ（ブラシ/消しゴム）** → `draw()` → 線を描画
4. **マウスアップ** → `stopDrawing()` → 描画/ドラッグ終了
5. **図形ツール - 新規描画** → ドラッグ開始 → 画像ロードチェック → `isDrawingShape = true` → ドラッグ中にプレビュー表示 → マウスアップ → `shapeObjects`に追加 → `redrawCanvas()`
6. **図形ツール - 選択** → クリック（図形上） → `getClickedShapeIndex()` → `selectedShapeIndex`設定 → ハンドル表示
7. **図形ツール - 移動** → 図形選択中にドラッグ → `draw()` → 図形座標更新 → `redrawCanvas()`
8. **図形ツール - リサイズ** → ハンドルをドラッグ → `isResizingShape = true` → `draw()` → 図形サイズ更新 → `redrawCanvas()`
9. **図形ツール - 削除** → 図形選択中にDeleteキー → `shapeObjects`から削除 → `selectedShapeIndex`リセット → `redrawCanvas()`
10. **テキストツール - 新規追加** → クリック（空白部分） → 画像ロードチェック → ダイアログ表示 → テキスト入力 → Enter/OK → `textObjects`に追加 → `redrawCanvas()`
11. **テキストツール - 選択** → クリック（テキスト上） → `getClickedTextIndex()` → `selectedTextIndex`設定 → 選択枠表示
12. **テキストツール - 移動** → テキスト選択中にドラッグ → `draw()` → テキスト座標更新 → `redrawCanvas()`
13. **テキストツール - 編集** → ダブルクリック（テキスト上） → `editText()` → ダイアログに既存値を事前入力 → Enter/OK → `textObjects`更新 → `redrawCanvas()`
14. **テキストツール - 削除** → テキスト選択中にDeleteキー → `textObjects`から削除 → `selectedTextIndex`リセット → `redrawCanvas()`
15. **トリミング - 開始** → トリミングボタンクリック → `isCropping = true` → 「範囲をドラッグ」通知
16. **トリミング - 範囲作成** → ドラッグ開始 → `isCreatingCropRect = true` → リアルタイムでプレビュー表示（グリッド線、オーバーレイ）
17. **トリミング - 範囲移動** → 範囲内をクリック → `isDraggingCrop = true` → ドラッグで移動
18. **トリミング - サイズ変更** → ハンドルをクリック → `isResizingCrop = true` → ドラッグでリサイズ
19. **トリミング - 適用** → 適用ボタンクリック → 画像トリミング → テキスト・図形座標調整 → キャンバスサイズ更新 → 履歴保存
20. **Undo** → Ctrl+Z または Undoボタン → `undo()` → 前の状態を復元 → `redrawCanvas()`
21. **Redo** → Ctrl+Y/Ctrl+Shift+Z または Redoボタン → `redo()` → 次の状態を復元 → `redrawCanvas()`

## 今後の拡張案

- [x] ~~Undo/Redo機能（履歴管理の実装が必要）~~ **実装済み**
- [x] ~~クロップ・リサイズ機能~~ **トリミング機能として実装済み**
- [x] ~~Redo機能（やり直し）~~ **実装済み**
- [x] ~~スマートフォン・タブレット対応~~ **完全実装済み（4段階のレスポンシブデザイン）**
- [x] ~~UI/UX改善~~ **実装済み（ツールチップ・アニメーション・アクセシビリティ・プロフェッショナル品質）**
- [ ] レイヤー順序の変更機能
- [ ] フィルター効果（明度、コントラスト、ぼかしなど）
- [ ] JPEG、WebP形式での保存
- [ ] 図形の回転機能
- [ ] グループ化機能

## 開発時の注意点

### セキュリティ
- ユーザーアップロード画像は全てクライアントサイドで処理
- サーバーへのアップロードなし
- XSS対策: テキスト入力は `fillText()` で安全に描画

### パフォーマンス
- Canvas APIは高速だが、大きな画像では重くなる可能性
- 現状では履歴管理なし（メモリ効率優先）

### UI/UX設計のポイント
- **画像ロード必須**: すべての編集ツール（ブラシ、消しゴム、図形、テキスト）は`imageLoaded`フラグをチェック
- **レイヤーシステム**: 図形とテキストは独立したレイヤーで管理され、自由に編集可能
- **リアルタイムフィードバック**: 図形描画時のプレビュー、選択時のハンドル表示など
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
✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除
📐 図形ツール: ドラッグで描画、クリックで選択、ハンドルでサイズ変更、Deleteキーで削除
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
   - 画像をロードする前にブラシ/消しゴム/図形/テキストツールを使用
   - 「先に画像をアップロードまたはペーストしてください」警告が表示されることを確認
5. **描画ツールのテスト**（画像ロード後）
   - ブラシで描画
   - 消しゴムで消去
6. **図形描画機能のテスト**（画像ロード後）
   - **矩形描画**: 矩形ツールを選択 → ドラッグで矩形を描画 → プレビュー表示を確認 → マウスアップで確定
   - **円描画**: 円ツールを選択 → ドラッグで円を描画 → プレビュー表示を確認 → マウスアップで確定
   - **直線描画**: 直線ツールを選択 → ドラッグで直線を描画 → プレビュー表示を確認 → マウスアップで確定
   - **矢印描画**: 矢印ツールを選択 → ドラッグで矢印を描画 → プレビュー表示を確認 → マウスアップで確定
   - **選択**: 図形をクリック → ハンドル（8個）が表示される
   - **移動**: 選択中の図形をドラッグ → 図形が移動する
   - **サイズ変更**: 選択中の図形のハンドルをドラッグ → 図形のサイズが変更される
   - **削除**: 図形を選択 → Deleteキー → 図形が削除される → 「図形を削除しました」通知が表示される
   - **塗りつぶし/枠線設定**: チェックボックスで塗りつぶし/枠線のオン/オフを切り替え
   - **色設定**: 塗りつぶし色・枠線色を変更して描画
7. **テキスト編集機能のテスト**（画像ロード後）
   - **追加**: テキストツールで空白部分をクリック → ダイアログ表示 → テキスト入力 → Enter/OK → テキストが追加される
   - **選択**: テキストをクリック → 選択枠（点線）が表示される
   - **移動**: 選択中のテキストをドラッグ → テキストが移動する
   - **編集**: テキストをダブルクリック → ダイアログに既存のテキストが表示される → 編集 → OK → テキストが更新される
   - **削除**: テキストを選択 → Deleteキー → テキストが削除される → 「テキストを削除しました」通知が表示される
   - **キーボード操作**: Enterで確定、Escapeでキャンセル、背景クリックでキャンセル
8. **トリミング機能のテスト**（画像ロード後）
   - **開始**: トリミングボタンをクリック → オーバーレイとグリッド線が表示される
   - **範囲作成**: ドラッグで範囲を作成 → リアルタイムでプレビュー表示
   - **範囲移動**: 範囲内をドラッグ → 範囲が移動する
   - **サイズ変更**: ハンドルをドラッグ → 範囲のサイズが変更される
   - **グリッド線**: 3x3グリッドが表示されることを確認
   - **サイズ表示**: 現在のサイズ（幅×高さ px）が表示されることを確認
   - **適用**: 適用ボタンをクリック → 画像がトリミングされる
   - **キャンセル**: キャンセルボタンをクリック → トリミングモードが終了する
9. **Undo/Redo機能のテスト**
   - 図形を追加 → Ctrl+Z → 図形が削除される → Ctrl+Y → 図形が復元される
   - テキストを追加 → Undoボタン → テキストが削除される → Redoボタン → テキストが復元される
   - トリミングを適用 → Ctrl+Z → トリミング前の状態に戻る → Ctrl+Shift+Z → トリミング後の状態に戻る
   - Undoボタンが履歴がない場合に無効化されることを確認
   - Redoボタンが先の履歴がない場合に無効化されることを確認
10. **保存・クリア機能のテスト**
   - 保存ボタンで画像をダウンロード（タイムスタンプ付きファイル名）
   - クリア機能でリセット（ベース画像、テキスト、図形がすべてクリアされることを確認）
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
