// グローバル変数
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 5;
let fontSize = 24;
let lastX = 0;
let lastY = 0;
let imageLoaded = false;

// 図形描画用の変数
let shapeStartX = 0;
let shapeStartY = 0;
let isDrawingShape = false;
let shapeFill = false;
let previewCanvas = null; // プレビュー用の一時キャンバス

// テキストレイヤー管理
let textObjects = [];
let selectedTextIndex = -1;
let baseCanvas = null; // 元の画像とブラシ描画を保持
let isDraggingText = false;
let dragStartX = 0;
let dragStartY = 0;
let currentFontFamily = 'Arial'; // 現在のフォント

// 履歴管理（Undo/Redo用）
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50; // 履歴の最大保持数

// カラーパレット管理
let colorPalette = [];
const MAX_PALETTE_COLORS = 8; // パレットの最大色数

// ズーム・パン管理
let zoomLevel = 1.0; // 現在のズームレベル（1.0 = 100%）
let panX = 0; // パンのX座標
let panY = 0; // パンのY座標
let isPanning = false; // パン中かどうか
let lastPanX = 0; // パン開始時のX座標
let lastPanY = 0; // パン開始時のY座標
const MIN_ZOOM = 0.25; // 最小ズーム（25%）
const MAX_ZOOM = 4.0; // 最大ズーム（400%）

// キャンバスのデフォルトサイズ
canvas.width = 800;
canvas.height = 600;

// UI要素の取得
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const colorPicker = document.getElementById('colorPicker');
const colorPaletteElement = document.getElementById('colorPalette');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const toolButtons = document.querySelectorAll('.tool-btn');
const dropZone = document.getElementById('dropZone');
const dropHint = document.getElementById('dropHint');
const notification = document.getElementById('notification');
const textInputDialog = document.getElementById('textInputDialog');
const textInput = document.getElementById('textInput');
const fontFamilySelect = document.getElementById('fontFamily');
const fontBoldCheckbox = document.getElementById('fontBold');
const fontItalicCheckbox = document.getElementById('fontItalic');
const textOkBtn = document.getElementById('textOkBtn');
const textCancelBtn = document.getElementById('textCancelBtn');
const toggleInstructionsBtn = document.getElementById('toggleInstructions');
const instructionsContent = document.getElementById('instructionsContent');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const helpBtn = document.getElementById('helpBtn');
const helpPanel = document.getElementById('helpPanel');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const toggleToolbarBtn = document.getElementById('toggleToolbar');
const toolbar = document.querySelector('.toolbar');
const canvasContainer = document.querySelector('.canvas-container');
const brushPreview = document.getElementById('brushPreview');

// 新しいツールボタンとオプション
const eyedropperBtn = document.getElementById('eyedropperBtn');
const rectangleBtn = document.getElementById('rectangleBtn');
const circleBtn = document.getElementById('circleBtn');
const lineBtn = document.getElementById('lineBtn');
const arrowBtn = document.getElementById('arrowBtn');
const shapeFillCheckbox = document.getElementById('shapeFill');

// 変形ボタン
const rotateLeftBtn = document.getElementById('rotateLeftBtn');
const rotateRightBtn = document.getElementById('rotateRightBtn');
const flipHorizontalBtn = document.getElementById('flipHorizontalBtn');
const flipVerticalBtn = document.getElementById('flipVerticalBtn');

// 初期化
function init() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

init();

// カラーパレット関連の関数

// LocalStorageからカラーパレットを読み込み
function loadColorPalette() {
    const saved = localStorage.getItem('colorPalette');
    if (saved) {
        try {
            colorPalette = JSON.parse(saved);
        } catch (e) {
            colorPalette = [];
        }
    }
    // デフォルトカラーを追加（初回のみ）
    if (colorPalette.length === 0) {
        colorPalette = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    }
    renderColorPalette();
}

// LocalStorageにカラーパレットを保存
function saveColorPalette() {
    localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
}

// パレットに色を追加
function addColorToPalette(color) {
    // すでに存在する色は削除して先頭に追加
    const index = colorPalette.indexOf(color);
    if (index !== -1) {
        colorPalette.splice(index, 1);
    }

    // 先頭に追加
    colorPalette.unshift(color);

    // 最大数を超えたら削除
    if (colorPalette.length > MAX_PALETTE_COLORS) {
        colorPalette = colorPalette.slice(0, MAX_PALETTE_COLORS);
    }

    saveColorPalette();
    renderColorPalette();
}

// カラーパレットを描画
function renderColorPalette() {
    colorPaletteElement.innerHTML = '';

    colorPalette.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.title = color;

        // 現在の色と同じならactiveクラスを追加
        if (color === currentColor) {
            swatch.classList.add('active');
        }

        // クリックで色を選択
        swatch.addEventListener('click', () => {
            currentColor = color;
            colorPicker.value = color;
            renderColorPalette(); // activeクラスを更新
            updateBrushPreview(); // プレビューを更新
            showNotification(`色を選択: ${color}`, 'info');
        });

        colorPaletteElement.appendChild(swatch);
    });
}

// カラーパレットを初期化
loadColorPalette();

// Undo/Redoボタンの状態を更新
function updateUndoRedoButtons() {
    // Undoボタン
    if (historyIndex > 0) {
        undoBtn.disabled = false;
    } else {
        undoBtn.disabled = true;
    }

    // Redoボタン
    if (historyIndex < history.length - 1) {
        redoBtn.disabled = false;
    } else {
        redoBtn.disabled = true;
    }
}

// 履歴に状態を保存
function saveHistory() {
    // 現在の位置より後の履歴を削除
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }

    // 現在の状態を保存
    const state = {
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        textObjects: JSON.parse(JSON.stringify(textObjects)),
        selectedTextIndex: selectedTextIndex,
        baseCanvas: baseCanvas ? baseCanvas.toDataURL() : null,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    };

    history.push(state);

    // 履歴が最大数を超えたら古いものを削除
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }

    // ボタンの状態を更新
    updateUndoRedoButtons();
}

// 履歴から状態を復元
function restoreHistory(index) {
    if (index < 0 || index >= history.length) return;

    const state = history[index];

    // キャンバスサイズを復元
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    // テキストオブジェクトを復元
    textObjects = JSON.parse(JSON.stringify(state.textObjects));
    selectedTextIndex = state.selectedTextIndex;

    // baseCanvasを復元
    if (state.baseCanvas) {
        const img = new Image();
        img.onload = () => {
            baseCanvas = document.createElement('canvas');
            baseCanvas.width = state.canvasWidth;
            baseCanvas.height = state.canvasHeight;
            const baseCtx = baseCanvas.getContext('2d');
            baseCtx.drawImage(img, 0, 0);

            // 復元後にキャンバスを再描画
            redrawCanvas();
        };
        img.src = state.baseCanvas;
    } else {
        baseCanvas = null;
        // 画像データを直接復元（初期状態など）
        ctx.putImageData(state.imageData, 0, 0);
    }

    historyIndex = index;

    // ボタンの状態を更新
    updateUndoRedoButtons();
}

// 元に戻す (Undo)
function undo() {
    if (historyIndex > 0) {
        restoreHistory(historyIndex - 1);
        showNotification('元に戻しました', 'info');
    } else {
        showNotification('これ以上元に戻せません', 'info');
    }
}

// やり直し (Redo)
function redo() {
    if (historyIndex < history.length - 1) {
        restoreHistory(historyIndex + 1);
        showNotification('やり直しました', 'info');
    } else {
        showNotification('これ以上やり直せません', 'info');
    }
}

// 通知を表示
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 初期状態を履歴に保存
saveHistory();

// 初期カーソルを設定
updateCursor();

// Undo/Redoボタン
undoBtn.addEventListener('click', () => {
    undo();
});

redoBtn.addEventListener('click', () => {
    redo();
});

// 使い方のトグル
toggleInstructionsBtn.addEventListener('click', () => {
    if (instructionsContent.classList.contains('hidden')) {
        instructionsContent.classList.remove('hidden');
        instructionsContent.classList.add('show');
        toggleInstructionsBtn.textContent = '📖 使い方を非表示';
    } else {
        instructionsContent.classList.remove('show');
        instructionsContent.classList.add('hidden');
        toggleInstructionsBtn.textContent = '📖 使い方を表示';
    }
});

// ヘルプパネル機能
helpBtn.addEventListener('click', () => {
    helpPanel.classList.add('show');
});

helpCloseBtn.addEventListener('click', () => {
    helpPanel.classList.remove('show');
});

// ヘルプパネルの背景クリックで閉じる
helpPanel.addEventListener('click', (e) => {
    if (e.target === helpPanel) {
        helpPanel.classList.remove('show');
    }
});

// ローディングインジケーター表示/非表示
function showLoading() {
    loadingIndicator.classList.add('show');
}

function hideLoading() {
    loadingIndicator.classList.remove('show');
}

// ツールバー折りたたみ機能
let toolbarCollapsed = false;

function toggleToolbar() {
    toolbarCollapsed = !toolbarCollapsed;
    toolbar.classList.toggle('collapsed');
    canvasContainer.classList.toggle('toolbar-collapsed');
}

toggleToolbarBtn.addEventListener('click', toggleToolbar);

// ブラシプレビューを更新
function updateBrushPreview() {
    const size = Math.min(brushSize, 48); // 最大48px
    brushPreview.style.color = currentTool === 'eraser' ? '#ff0000' : currentColor;
    brushPreview.style.setProperty('--brush-size', size + 'px');

    // ::afterの疑似要素にサイズを適用
    const style = document.createElement('style');
    style.textContent = `
        #brushPreview::after {
            width: ${size}px;
            height: ${size}px;
        }
    `;

    // 既存のスタイルを削除して新しいものを追加
    const oldStyle = document.getElementById('brush-preview-style');
    if (oldStyle) oldStyle.remove();
    style.id = 'brush-preview-style';
    document.head.appendChild(style);
}

// 初期プレビュー
updateBrushPreview();

// カスタムカーソルを更新
function updateCursor() {
    if (currentTool === 'text') {
        canvas.style.cursor = 'text';
    } else if (currentTool === 'eyedropper') {
        canvas.style.cursor = 'crosshair';
    } else if (currentTool === 'brush' || currentTool === 'eraser') {
        // ブラシサイズに応じた円形カーソルを作成
        const cursorSize = Math.min(Math.max(brushSize * 2, 16), 64); // 16-64pxの範囲
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = cursorSize;
        cursorCanvas.height = cursorSize;
        const cursorCtx = cursorCanvas.getContext('2d');

        // 円を描画
        cursorCtx.beginPath();
        cursorCtx.arc(cursorSize / 2, cursorSize / 2, brushSize / 2, 0, Math.PI * 2);
        cursorCtx.strokeStyle = currentTool === 'eraser' ? '#ff0000' : '#000000';
        cursorCtx.lineWidth = 1;
        cursorCtx.stroke();

        // 中心点を描画
        cursorCtx.fillStyle = currentTool === 'eraser' ? '#ff0000' : '#000000';
        cursorCtx.fillRect(cursorSize / 2 - 1, cursorSize / 2 - 1, 2, 2);

        const cursorUrl = cursorCanvas.toDataURL();
        canvas.style.cursor = `url(${cursorUrl}) ${cursorSize / 2} ${cursorSize / 2}, crosshair`;
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

// ========================================
// 回転・反転機能
// ========================================

// 左に90度回転
function rotateLeft() {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードしてください', 'info');
        return;
    }

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    // 新しいキャンバスサイズ（幅と高さを入れ替え）
    canvas.width = oldHeight;
    canvas.height = oldWidth;

    // baseCanvasを回転
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = oldHeight;
    rotatedCanvas.height = oldWidth;
    const rotatedCtx = rotatedCanvas.getContext('2d');

    rotatedCtx.save();
    rotatedCtx.translate(oldHeight / 2, oldWidth / 2);
    rotatedCtx.rotate(-Math.PI / 2);
    rotatedCtx.drawImage(baseCanvas, -oldWidth / 2, -oldHeight / 2);
    rotatedCtx.restore();

    baseCanvas = rotatedCanvas;

    // テキストオブジェクトの座標を変換
    textObjects.forEach(textObj => {
        const oldX = textObj.x;
        const oldY = textObj.y;
        textObj.x = oldY;
        textObj.y = oldWidth - oldX;
    });

    redrawCanvas();
    saveHistory();
    showNotification('左に90度回転しました', 'success');
}

// 右に90度回転
function rotateRight() {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードしてください', 'info');
        return;
    }

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    // 新しいキャンバスサイズ（幅と高さを入れ替え）
    canvas.width = oldHeight;
    canvas.height = oldWidth;

    // baseCanvasを回転
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = oldHeight;
    rotatedCanvas.height = oldWidth;
    const rotatedCtx = rotatedCanvas.getContext('2d');

    rotatedCtx.save();
    rotatedCtx.translate(oldHeight / 2, oldWidth / 2);
    rotatedCtx.rotate(Math.PI / 2);
    rotatedCtx.drawImage(baseCanvas, -oldWidth / 2, -oldHeight / 2);
    rotatedCtx.restore();

    baseCanvas = rotatedCanvas;

    // テキストオブジェクトの座標を変換
    textObjects.forEach(textObj => {
        const oldX = textObj.x;
        const oldY = textObj.y;
        textObj.x = oldHeight - oldY;
        textObj.y = oldX;
    });

    redrawCanvas();
    saveHistory();
    showNotification('右に90度回転しました', 'success');
}

// 水平反転
function flipHorizontal() {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードしてください', 'info');
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // baseCanvasを反転
    const flippedCanvas = document.createElement('canvas');
    flippedCanvas.width = width;
    flippedCanvas.height = height;
    const flippedCtx = flippedCanvas.getContext('2d');

    flippedCtx.save();
    flippedCtx.translate(width, 0);
    flippedCtx.scale(-1, 1);
    flippedCtx.drawImage(baseCanvas, 0, 0);
    flippedCtx.restore();

    baseCanvas = flippedCanvas;

    // テキストオブジェクトの座標を変換
    textObjects.forEach(textObj => {
        textObj.x = width - textObj.x;
        // テキストの幅を考慮
        const fontStyle = textObj.italic ? 'italic' : 'normal';
        const fontWeight = textObj.bold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${fontWeight} ${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;
        const metrics = ctx.measureText(textObj.text);
        textObj.x -= metrics.width;
    });

    redrawCanvas();
    saveHistory();
    showNotification('水平反転しました', 'success');
}

// 垂直反転
function flipVertical() {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードしてください', 'info');
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // baseCanvasを反転
    const flippedCanvas = document.createElement('canvas');
    flippedCanvas.width = width;
    flippedCanvas.height = height;
    const flippedCtx = flippedCanvas.getContext('2d');

    flippedCtx.save();
    flippedCtx.translate(0, height);
    flippedCtx.scale(1, -1);
    flippedCtx.drawImage(baseCanvas, 0, 0);
    flippedCtx.restore();

    baseCanvas = flippedCanvas;

    // テキストオブジェクトの座標を変換
    textObjects.forEach(textObj => {
        textObj.y = height - textObj.y;
        // テキストの高さを考慮
        textObj.y += textObj.fontSize;
    });

    redrawCanvas();
    saveHistory();
    showNotification('垂直反転しました', 'success');
}

// ========================================
// スポイトツール
// ========================================

// クリックした位置の色を取得
function pickColor(x, y) {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードしてください', 'info');
        return;
    }

    // ズームとパンを考慮せずにbaseCanvasから直接色を取得
    const baseCtx = baseCanvas.getContext('2d');
    const imageData = baseCtx.getImageData(x, y, 1, 1);
    const pixel = imageData.data;

    // RGB値を16進数に変換
    const r = pixel[0].toString(16).padStart(2, '0');
    const g = pixel[1].toString(16).padStart(2, '0');
    const b = pixel[2].toString(16).padStart(2, '0');
    const color = `#${r}${g}${b}`;

    // 色を設定
    currentColor = color;
    colorPicker.value = color;
    addColorToPalette(color);
    updateBrushPreview();

    showNotification(`色を抽出: ${color}`, 'success');
}

// ========================================
// 図形描画機能
// ========================================

// 矩形を描画
function drawRectangle(x1, y1, x2, y2, isFinal = false) {
    const width = x2 - x1;
    const height = y2 - y1;

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    if (shapeFill) {
        ctx.fillStyle = currentColor;
        ctx.fillRect(x1, y1, width, height);
    } else {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.strokeRect(x1, y1, width, height);
    }

    ctx.restore();

    // 確定時はbaseCanvasにも描画
    if (isFinal && baseCanvas) {
        const baseCtx = baseCanvas.getContext('2d');
        if (shapeFill) {
            baseCtx.fillStyle = currentColor;
            baseCtx.fillRect(x1, y1, width, height);
        } else {
            baseCtx.strokeStyle = currentColor;
            baseCtx.lineWidth = brushSize;
            baseCtx.strokeRect(x1, y1, width, height);
        }
    }
}

// 円を描画
function drawCircle(x1, y1, x2, y2, isFinal = false) {
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

    if (shapeFill) {
        ctx.fillStyle = currentColor;
        ctx.fill();
    } else {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.stroke();
    }

    ctx.restore();

    // 確定時はbaseCanvasにも描画
    if (isFinal && baseCanvas) {
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.beginPath();
        baseCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

        if (shapeFill) {
            baseCtx.fillStyle = currentColor;
            baseCtx.fill();
        } else {
            baseCtx.strokeStyle = currentColor;
            baseCtx.lineWidth = brushSize;
            baseCtx.stroke();
        }
    }
}

// 直線を描画
function drawLine(x1, y1, x2, y2, isFinal = false) {
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();

    // 確定時はbaseCanvasにも描画
    if (isFinal && baseCanvas) {
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.beginPath();
        baseCtx.moveTo(x1, y1);
        baseCtx.lineTo(x2, y2);
        baseCtx.strokeStyle = currentColor;
        baseCtx.lineWidth = brushSize;
        baseCtx.lineCap = 'round';
        baseCtx.stroke();
    }
}

// 矢印を描画
function drawArrow(x1, y1, x2, y2, isFinal = false) {
    const headLength = 20; // 矢印の頭の長さ
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    // 線を描画
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 矢印の頭を描画
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();

    // 確定時はbaseCanvasにも描画
    if (isFinal && baseCanvas) {
        const baseCtx = baseCanvas.getContext('2d');

        // 線を描画
        baseCtx.beginPath();
        baseCtx.moveTo(x1, y1);
        baseCtx.lineTo(x2, y2);
        baseCtx.strokeStyle = currentColor;
        baseCtx.lineWidth = brushSize;
        baseCtx.lineCap = 'round';
        baseCtx.stroke();

        // 矢印の頭を描画
        baseCtx.beginPath();
        baseCtx.moveTo(x2, y2);
        baseCtx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        baseCtx.moveTo(x2, y2);
        baseCtx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        baseCtx.strokeStyle = currentColor;
        baseCtx.lineWidth = brushSize;
        baseCtx.lineCap = 'round';
        baseCtx.stroke();
    }
}

// ツール選択
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // カーソルを更新
        updateCursor();
        // プレビューを更新
        updateBrushPreview();
    });
});

// 色選択
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    addColorToPalette(currentColor); // パレットに追加
    updateBrushPreview(); // プレビューを更新
});

// ブラシサイズ
brushSizeSlider.addEventListener('input', (e) => {
    brushSize = e.target.value;
    brushSizeValue.textContent = brushSize;
    // カーソルを更新
    updateCursor();
    // プレビューを更新
    updateBrushPreview();
});

// フォントサイズ
fontSizeSlider.addEventListener('input', (e) => {
    fontSize = e.target.value;
    fontSizeValue.textContent = fontSize;
});

// フォント選択
fontFamilySelect.addEventListener('change', (e) => {
    currentFontFamily = e.target.value;
});

// ズーム機能

// ズームレベルを設定
function setZoom(newZoom) {
    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    zoomSlider.value = Math.round(zoomLevel * 100);
    zoomValue.textContent = Math.round(zoomLevel * 100);
    redrawCanvas();
}

// ズームスライダー
zoomSlider.addEventListener('input', (e) => {
    setZoom(e.target.value / 100);
});

// ズームインボタン
zoomInBtn.addEventListener('click', () => {
    setZoom(zoomLevel + 0.25);
});

// ズームアウトボタン
zoomOutBtn.addEventListener('click', () => {
    setZoom(zoomLevel - 0.25);
});

// ズームリセットボタン
zoomResetBtn.addEventListener('click', () => {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    setZoom(1.0);
    showNotification('ズームをリセットしました', 'info');
});

// マウスホイールでズーム（Ctrlキー押下時）
canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoomLevel + delta);
    }
}, { passive: false });

// 画像アップロード
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadImageFromFile(file);
    }
});

// キャンバスを再描画
function redrawCanvas() {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ズームとパンの変換を保存
    ctx.save();

    // ズームとパンを適用
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);

    // ベース画像とブラシ描画を描画
    if (baseCanvas) {
        ctx.drawImage(baseCanvas, 0, 0);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // すべてのテキストを描画
    textObjects.forEach((textObj, index) => {
        // フォントスタイルを構築（italic bold 24px Arial の形式）
        const fontStyle = textObj.italic ? 'italic' : 'normal';
        const fontWeight = textObj.bold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${fontWeight} ${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;
        ctx.fillStyle = textObj.color;
        ctx.fillText(textObj.text, textObj.x, textObj.y);

        // 選択中のテキストには枠を表示
        if (index === selectedTextIndex) {
            const metrics = ctx.measureText(textObj.text);
            const textWidth = metrics.width;
            const textHeight = textObj.fontSize;

            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2 / zoomLevel; // ズームレベルに応じて線の太さを調整
            ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel]); // ズームレベルに応じて破線を調整
            ctx.strokeRect(textObj.x - 5, textObj.y - textHeight, textWidth + 10, textHeight + 10);
            ctx.setLineDash([]);
        }
    });

    // 変換を復元
    ctx.restore();
}

// 画像ファイルを読み込む
function loadImageFromFile(file) {
    if (!file || !file.type.match('image.*')) {
        showNotification('有効な画像ファイルを選択してください', 'error');
        return;
    }

    // ローディング表示
    showLoading();

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 画像サイズの制限
            const MAX_WIDTH = 4096;
            const MAX_HEIGHT = 4096;

            let finalWidth = img.width;
            let finalHeight = img.height;
            let needsResize = false;

            // サイズチェック
            if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
                needsResize = true;
                const aspectRatio = img.width / img.height;

                if (img.width > MAX_WIDTH) {
                    finalWidth = MAX_WIDTH;
                    finalHeight = Math.round(MAX_WIDTH / aspectRatio);
                }

                if (finalHeight > MAX_HEIGHT) {
                    finalHeight = MAX_HEIGHT;
                    finalWidth = Math.round(MAX_HEIGHT * aspectRatio);
                }

                // ユーザーに確認
                const shouldResize = confirm(
                    `画像サイズが大きすぎます（${img.width}x${img.height}px）。\n` +
                    `メモリ節約のため ${finalWidth}x${finalHeight}px にリサイズしますか？\n\n` +
                    `キャンセルすると元のサイズで読み込みますが、動作が重くなる可能性があります。`
                );

                if (!shouldResize) {
                    finalWidth = img.width;
                    finalHeight = img.height;
                    needsResize = false;
                }
            }

            // キャンバスサイズを設定
            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // ベースキャンバスを作成して画像を描画
            baseCanvas = document.createElement('canvas');
            baseCanvas.width = finalWidth;
            baseCanvas.height = finalHeight;
            const baseCtx = baseCanvas.getContext('2d');

            // 画像をリサイズして描画（必要な場合）
            if (needsResize) {
                baseCtx.drawImage(img, 0, 0, finalWidth, finalHeight);
                showNotification(`画像をリサイズして読み込みました（${finalWidth}x${finalHeight}px）`, 'success');
            } else {
                baseCtx.drawImage(img, 0, 0);
                showNotification('画像を読み込みました！', 'success');
            }

            // 既存のテキストをクリア
            textObjects = [];
            selectedTextIndex = -1;

            // キャンバスを再描画
            redrawCanvas();

            imageLoaded = true;

            // ドロップヒントを非表示
            dropHint.classList.add('hidden');

            // 履歴に保存
            saveHistory();

            // ローディング非表示
            hideLoading();
        };
        img.onerror = () => {
            hideLoading();
            showNotification('画像の読み込みに失敗しました', 'error');
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
        hideLoading();
        showNotification('ファイルの読み込みに失敗しました', 'error');
    };
    reader.readAsDataURL(file);
}

// 画像のペースト（Ctrl+V）
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            loadImageFromFile(blob);
            e.preventDefault();
            hasImage = true;
            break;
        }
    }

    if (!hasImage && e.clipboardData.items.length > 0) {
        showNotification('クリップボードに画像がありません', 'info');
    }
});

// ペーストボタン
pasteBtn.addEventListener('click', async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        let hasImage = false;

        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    loadImageFromFile(blob);
                    hasImage = true;
                    break;
                }
            }
            if (hasImage) break;
        }

        if (!hasImage) {
            showNotification('クリップボードに画像がありません', 'info');
        }
    } catch (err) {
        console.error('クリップボードアクセスエラー:', err);
        showNotification('Ctrl+V を使用して画像を貼り付けてください', 'info');
    }
});

// ドラッグ&ドロップ機能
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImageFromFile(files[0]);
    }
});

// マウスイベント
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('dblclick', editText);

// タッチイベント（スマホ対応）
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // キャンバス座標を計算
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // ズームとパンを考慮した実際の座標を計算
    return {
        x: (canvasX - panX) / zoomLevel,
        y: (canvasY - panY) / zoomLevel
    };
}

// テキストがクリックされたかチェック
function getClickedTextIndex(x, y) {
    for (let i = textObjects.length - 1; i >= 0; i--) {
        const textObj = textObjects[i];
        // フォントスタイルを正確に設定（太字・斜体を含む）
        const fontStyle = textObj.italic ? 'italic' : 'normal';
        const fontWeight = textObj.bold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${fontWeight} ${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;
        const metrics = ctx.measureText(textObj.text);
        const textWidth = metrics.width;
        const textHeight = textObj.fontSize;

        // テキストの範囲をチェック（少し広めの範囲）
        if (x >= textObj.x - 5 && x <= textObj.x + textWidth + 5 &&
            y >= textObj.y - textHeight && y <= textObj.y + 10) {
            return i;
        }
    }
    return -1;
}

// テキストを編集（ダブルクリック時）
function editText(e) {
    if (currentTool !== 'text' || !imageLoaded) return;

    const pos = getMousePos(e);
    const clickedIndex = getClickedTextIndex(pos.x, pos.y);

    if (clickedIndex !== -1) {
        // 既存のテキストを編集
        selectedTextIndex = clickedIndex;
        const textObj = textObjects[clickedIndex];

        // ダイアログを表示し、既存のテキストを設定
        textInput.value = textObj.text;
        fontSize = textObj.fontSize;
        currentColor = textObj.color;
        currentFontFamily = textObj.fontFamily || 'Arial';

        // UIを更新
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize;
        colorPicker.value = currentColor;
        fontFamilySelect.value = currentFontFamily;
        fontBoldCheckbox.checked = textObj.bold || false;
        fontItalicCheckbox.checked = textObj.italic || false;

        // 編集モードとして位置を保持
        pendingTextPos = { x: textObj.x, y: textObj.y, editingIndex: clickedIndex };

        textInputDialog.classList.add('show');
        textInput.focus();
        textInput.select();
    }
}

function startDrawing(e) {
    // Altキーが押されている場合はスポイトツールとして動作
    if (e.altKey && imageLoaded) {
        const pos = getMousePos(e);
        pickColor(Math.floor(pos.x), Math.floor(pos.y));
        return;
    }

    // スペースキーが押されている場合はパンモード
    if (e.shiftKey || e.button === 1) { // Shiftキーまたは中ボタン
        isPanning = true;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        canvas.style.cursor = 'grab';
        return;
    }

    const pos = getMousePos(e);

    // スポイトツール
    if (currentTool === 'eyedropper') {
        pickColor(Math.floor(pos.x), Math.floor(pos.y));
        return;
    }

    // 図形描画ツール
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow') {
        if (!imageLoaded) {
            showNotification('先に画像をアップロードまたはペーストしてください', 'info');
            return;
        }

        isDrawingShape = true;
        shapeStartX = pos.x;
        shapeStartY = pos.y;

        // プレビュー用に現在のキャンバス状態を保存
        previewCanvas = document.createElement('canvas');
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(canvas, 0, 0);

        return;
    }

    if (currentTool === 'text') {
        // テキストツールの場合
        if (!imageLoaded) {
            showNotification('先に画像をアップロードまたはペーストしてください', 'info');
            return;
        }

        // クリックされた位置のテキストをチェック
        const clickedIndex = getClickedTextIndex(pos.x, pos.y);

        if (clickedIndex !== -1) {
            // 既存のテキストをクリック - 編集モード
            selectedTextIndex = clickedIndex;
            isDraggingText = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            redrawCanvas();
        } else {
            // 新しいテキストを追加
            addText(e);
        }
        return;
    }

    // 画像がロードされていない場合は警告（ブラシ、消しゴム）
    if (!imageLoaded && (currentTool === 'brush' || currentTool === 'eraser')) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    // テキスト選択を解除
    if (selectedTextIndex !== -1) {
        selectedTextIndex = -1;
        redrawCanvas();
    }

    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    // パン中の処理
    if (isPanning) {
        const dx = e.clientX - lastPanX;
        const dy = e.clientY - lastPanY;
        panX += dx;
        panY += dy;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        redrawCanvas();
        canvas.style.cursor = 'grabbing';
        return;
    }

    const pos = getMousePos(e);

    // 図形描画中（プレビュー表示）
    if (isDrawingShape) {
        // プレビュー用キャンバスを復元
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewCanvas, 0, 0);

        // 図形を描画（プレビュー）
        if (currentTool === 'rectangle') {
            drawRectangle(shapeStartX, shapeStartY, pos.x, pos.y, false);
        } else if (currentTool === 'circle') {
            drawCircle(shapeStartX, shapeStartY, pos.x, pos.y, false);
        } else if (currentTool === 'line') {
            drawLine(shapeStartX, shapeStartY, pos.x, pos.y, false);
        } else if (currentTool === 'arrow') {
            drawArrow(shapeStartX, shapeStartY, pos.x, pos.y, false);
        }
        return;
    }

    // テキストをドラッグ中
    if (isDraggingText && selectedTextIndex !== -1) {
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;

        textObjects[selectedTextIndex].x += dx;
        textObjects[selectedTextIndex].y += dy;

        dragStartX = pos.x;
        dragStartY = pos.y;

        redrawCanvas();
        return;
    }

    if (!isDrawing) return;
    if (currentTool === 'text') return;

    const pos2 = getMousePos(e);

    // メインキャンバスに描画（ズーム適用）
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // baseCanvasにも同時に描画（ブラシ描画を永続化）
    if (baseCanvas) {
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.beginPath();
        baseCtx.moveTo(lastX, lastY);
        baseCtx.lineTo(pos2.x, pos2.y);
        baseCtx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
        baseCtx.lineWidth = brushSize;
        baseCtx.lineCap = 'round';
        baseCtx.lineJoin = 'round';
        baseCtx.stroke();
    }

    lastX = pos2.x;
    lastY = pos2.y;
}

function stopDrawing(e) {
    const wasDrawing = isDrawing;
    const wasDragging = isDraggingText;
    const wasDrawingShape = isDrawingShape;

    // 図形描画の確定
    if (isDrawingShape && e) {
        const pos = getMousePos(e);

        // 図形を確定（baseCanvasに描画）
        if (currentTool === 'rectangle') {
            drawRectangle(shapeStartX, shapeStartY, pos.x, pos.y, true);
        } else if (currentTool === 'circle') {
            drawCircle(shapeStartX, shapeStartY, pos.x, pos.y, true);
        } else if (currentTool === 'line') {
            drawLine(shapeStartX, shapeStartY, pos.x, pos.y, true);
        } else if (currentTool === 'arrow') {
            drawArrow(shapeStartX, shapeStartY, pos.x, pos.y, true);
        }

        // キャンバスを再描画
        redrawCanvas();

        isDrawingShape = false;
        previewCanvas = null;
        saveHistory();
        return;
    }

    isDrawing = false;
    isDraggingText = false;
    isDrawingShape = false;

    // パン終了
    if (isPanning) {
        isPanning = false;
        updateCursor(); // カーソルを元に戻す
    }

    // 描画またはドラッグが完了したら履歴に保存
    if (wasDrawing || wasDragging || wasDrawingShape) {
        saveHistory();
    }
}

// テキスト追加
let pendingTextPos = null;

function addText(e) {
    // 画像がロードされていない場合は警告
    if (!imageLoaded) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    const pos = getMousePos(e);
    pendingTextPos = pos;

    // ダイアログを表示
    textInputDialog.classList.add('show');
    textInput.value = '';
    fontBoldCheckbox.checked = false;
    fontItalicCheckbox.checked = false;
    textInput.focus();
}

// テキスト入力のOKボタン
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();

    // 空文字チェック
    if (!text) {
        showNotification('テキストを入力してください', 'error');
        textInput.focus();
        return;
    }

    if (pendingTextPos) {
        if (pendingTextPos.editingIndex !== undefined) {
            // 既存のテキストを更新
            textObjects[pendingTextPos.editingIndex] = {
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: fontSize,
                color: currentColor,
                fontFamily: currentFontFamily,
                bold: fontBoldCheckbox.checked,
                italic: fontItalicCheckbox.checked
            };
            showNotification('テキストを更新しました', 'success');
        } else {
            // 新しいテキストを追加
            textObjects.push({
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: fontSize,
                color: currentColor,
                fontFamily: currentFontFamily,
                bold: fontBoldCheckbox.checked,
                italic: fontItalicCheckbox.checked
            });
            showNotification('テキストを追加しました', 'success');
        }

        // キャンバスを再描画
        redrawCanvas();

        // 履歴に保存
        saveHistory();
    }

    // ダイアログを閉じる
    textInputDialog.classList.remove('show');
    textInput.value = '';
    pendingTextPos = null;
});

// テキスト入力のキャンセルボタン
textCancelBtn.addEventListener('click', () => {
    textInputDialog.classList.remove('show');
    textInput.value = '';
    pendingTextPos = null;
});

// Enterキーでテキスト追加
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        textOkBtn.click();
    }
});

// Escapeキーでキャンセル
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

// タッチイベントハンドラー
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// 画像を保存
saveBtn.addEventListener('click', () => {
    try {
        // デフォルトのファイル名を生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const defaultFilename = `edited-image-${timestamp}`;

        // ユーザーにファイル名を入力してもらう
        const filename = prompt('保存するファイル名を入力してください（拡張子なし）:', defaultFilename);

        // キャンセルされた場合は処理を中止
        if (filename === null) {
            return;
        }

        // 空文字の場合はデフォルト名を使用
        const finalFilename = filename.trim() || defaultFilename;

        const link = document.createElement('a');
        link.download = `${finalFilename}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showNotification(`画像を保存しました: ${finalFilename}.png`, 'success');
    } catch (err) {
        console.error('保存エラー:', err);
        showNotification('画像の保存に失敗しました', 'error');
    }
});

// キャンバスをクリア
clearBtn.addEventListener('click', () => {
    if (confirm('キャンバスをクリアしますか？')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imageLoaded = false;
        baseCanvas = null;
        textObjects = [];
        selectedTextIndex = -1;
        dropHint.classList.remove('hidden');
        showNotification('キャンバスをクリアしました', 'info');
        saveHistory();
    }
});

// 変形ボタンのイベントリスナー
rotateLeftBtn.addEventListener('click', rotateLeft);
rotateRightBtn.addEventListener('click', rotateRight);
flipHorizontalBtn.addEventListener('click', flipHorizontal);
flipVerticalBtn.addEventListener('click', flipVertical);

// 図形オプションのイベントリスナー
shapeFillCheckbox.addEventListener('change', (e) => {
    shapeFill = e.target.checked;
});

// ショートカットキー
document.addEventListener('keydown', (e) => {
    // テキスト入力中は一部のショートカットを無効化
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';

    // Ctrl+S で保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }

    // Ctrl+O で画像を開く
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        uploadBtn.click();
    }

    // Ctrl+N で新規キャンバス（クリア）
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (confirm('キャンバスをクリアしますか？すべての編集内容が削除されます。')) {
            clearBtn.click();
        }
    }

    // Deleteキーで選択中のテキストを削除
    if (e.key === 'Delete' && selectedTextIndex !== -1 && currentTool === 'text') {
        e.preventDefault();
        textObjects.splice(selectedTextIndex, 1);
        selectedTextIndex = -1;
        redrawCanvas();
        showNotification('テキストを削除しました', 'success');
        saveHistory();
    }

    // Ctrl+Z で元に戻す (Undo)
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl+Y または Ctrl+Shift+Z でやり直し (Redo)
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }

    // ?キーでヘルプパネルを開く（テキスト入力中でない場合）
    if (!isTyping && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        helpPanel.classList.add('show');
    }

    // Escapeキーでヘルプパネルを閉じる
    if (e.key === 'Escape') {
        if (helpPanel.classList.contains('show')) {
            helpPanel.classList.remove('show');
        }
    }

    // テキスト入力中でない場合のみ、数字キーでツール切り替え
    if (!isTyping) {
        // 1キーでブラシツール
        if (e.key === '1') {
            e.preventDefault();
            document.querySelector('[data-tool="brush"]').click();
            showNotification('ブラシツールを選択', 'info');
        }
        // 2キーで消しゴムツール
        if (e.key === '2') {
            e.preventDefault();
            document.querySelector('[data-tool="eraser"]').click();
            showNotification('消しゴムツールを選択', 'info');
        }
        // 3キーでテキストツール
        if (e.key === '3') {
            e.preventDefault();
            document.querySelector('[data-tool="text"]').click();
            showNotification('テキストツールを選択', 'info');
        }
        // 4キーでスポイトツール
        if (e.key === '4') {
            e.preventDefault();
            document.querySelector('[data-tool="eyedropper"]').click();
            showNotification('スポイトツールを選択', 'info');
        }
        // 5キーで矩形ツール
        if (e.key === '5') {
            e.preventDefault();
            document.querySelector('[data-tool="rectangle"]').click();
            showNotification('矩形ツールを選択', 'info');
        }
        // 6キーで円ツール
        if (e.key === '6') {
            e.preventDefault();
            document.querySelector('[data-tool="circle"]').click();
            showNotification('円ツールを選択', 'info');
        }
        // 7キーで直線ツール
        if (e.key === '7') {
            e.preventDefault();
            document.querySelector('[data-tool="line"]').click();
            showNotification('直線ツールを選択', 'info');
        }
        // 8キーで矢印ツール
        if (e.key === '8') {
            e.preventDefault();
            document.querySelector('[data-tool="arrow"]').click();
            showNotification('矢印ツールを選択', 'info');
        }
    }
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('⌨️ キーボードショートカット:');
console.log('  - Ctrl+O: 画像を開く');
console.log('  - Ctrl+S: 画像を保存（ファイル名編集可能）');
console.log('  - Ctrl+N: 新規キャンバス（クリア）');
console.log('  - Ctrl+Z: 元に戻す');
console.log('  - Ctrl+Y / Ctrl+Shift+Z: やり直し');
console.log('  - 1-8: ツール切り替え（ブラシ/消しゴム/テキスト/スポイト/矩形/円/直線/矢印）');
console.log('  - Alt+クリック: 色を抽出（スポイト）');
console.log('  - Ctrl+マウスホイール: ズームイン/アウト');
console.log('  - Shift+ドラッグ: キャンバスをパン（移動）');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('💡 テキストは太字・斜体の設定が可能です！');
console.log('🎨 カラーパレット: 最近使った色を自動保存（LocalStorage）');
console.log('🔍 ズーム: 25%〜400%まで対応、細かい編集が可能');
console.log('🔄 変形: 左90°/右90°回転、水平/垂直反転に対応');
console.log('📐 図形描画: 矩形、円、直線、矢印を描画可能（塗りつぶし/枠線切り替え可）');
console.log('💧 スポイトツール: 画像から色を抽出');
showNotification('画像エディターへようこそ！', 'info');
