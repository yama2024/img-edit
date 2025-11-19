// グローバル変数
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'select';
let currentColor = '#000000';
let brushSize = 5;
let eraserSize = 20;
let fontSize = 24;
let lastX = 0;
let lastY = 0;
let imageLoaded = false;

// テキストレイヤー管理
let textObjects = [];
let selectedTextIndex = -1;
let baseImage = null; // 元の画像を保持
let isDraggingText = false;
let dragStartX = 0;
let dragStartY = 0;

// 図形レイヤー管理
let shapeObjects = [];
let selectedShapeIndex = -1;
let isDrawingShape = false;
let shapeStartX = 0;
let shapeStartY = 0;
let previewShape = null; // 描画中の図形プレビュー
let fillColor = '#ff0000';
let strokeColor = '#000000';
let hasFill = true;
let hasStroke = true;
let isDraggingShape = false;
let isResizingShape = false;
let resizeHandle = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'

// Undo/Redo履歴管理
let historyStates = [];
let historyIndex = -1;
const MAX_HISTORY = 50;
let isRestoring = false; // 復元中フラグ（無限ループ防止）

// トリミング・リサイズ管理
let isCropping = false;
let cropStartX = 0;
let cropStartY = 0;
let cropRect = null; // { x, y, width, height }
let isDraggingCrop = false;
let isResizingCrop = false;
let cropResizeHandle = null;
let cropDragOffsetX = 0;
let cropDragOffsetY = 0;
let isCreatingCropRect = false;
let originalAspectRatio = 1;

// キャンバスのデフォルトサイズ（レスポンシブ対応）
function setInitialCanvasSize() {
    const containerWidth = document.querySelector('.canvas-container').clientWidth;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // スマートフォン・タブレット: 画面幅に合わせる
        const maxWidth = Math.min(containerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 300, 450);
        canvas.width = maxWidth;
        canvas.height = maxHeight;
    } else {
        // デスクトップ: デフォルトサイズ
        canvas.width = 800;
        canvas.height = 600;
    }

    // キャンバスを白で塗りつぶし
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

setInitialCanvasSize();

// UI要素の取得
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const eraserSizeSlider = document.getElementById('eraserSize');
const eraserSizeValue = document.getElementById('eraserSizeValue');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const toolButtons = document.querySelectorAll('.tool-btn');
const dropZone = document.getElementById('dropZone');
const dropHint = document.getElementById('dropHint');
const notification = document.getElementById('notification');
const textInputDialog = document.getElementById('textInputDialog');
const textInput = document.getElementById('textInput');
const textOkBtn = document.getElementById('textOkBtn');
const textCancelBtn = document.getElementById('textCancelBtn');

// テキストダイアログの新しいUI要素
const fontFamilySelect = document.getElementById('fontFamily');
const dialogFontSizeSlider = document.getElementById('dialogFontSize');
const dialogFontSizeValue = document.getElementById('dialogFontSizeValue');
const textColorPicker = document.getElementById('textColor');
const textBoldCheckbox = document.getElementById('textBold');
const textItalicCheckbox = document.getElementById('textItalic');
const textShadowCheckbox = document.getElementById('textShadow');
const textStrokeCheckbox = document.getElementById('textStroke');
const textBackgroundCheckbox = document.getElementById('textBackground');
const shadowColorPicker = document.getElementById('shadowColor');
const strokeTextColorPicker = document.getElementById('strokeTextColor');
const bgColorPicker = document.getElementById('bgColor');
const textPreview = document.getElementById('textPreview');
const shadowColorSection = document.getElementById('shadowColorSection');
const strokeColorSection = document.getElementById('strokeColorSection');
const bgColorSection = document.getElementById('bgColorSection');

// 図形ツール用UI要素
const fillColorPicker = document.getElementById('fillColorPicker');
const strokeColorPicker = document.getElementById('strokeColorPicker');
const fillShapeCheckbox = document.getElementById('fillShape');
const strokeShapeCheckbox = document.getElementById('strokeShape');

// トリミング・リサイズ用UI要素
const cropBtn = document.getElementById('cropBtn');
const resizeBtn = document.getElementById('resizeBtn');
const cropControls = document.getElementById('cropControls');
const cropApplyBtn = document.getElementById('cropApplyBtn');
const cropCancelBtn = document.getElementById('cropCancelBtn');
const resizeDialog = document.getElementById('resizeDialog');
const currentSizeText = document.getElementById('currentSize');
const newWidthInput = document.getElementById('newWidth');
const newHeightInput = document.getElementById('newHeight');
const maintainAspectCheckbox = document.getElementById('maintainAspect');
const resizeOkBtn = document.getElementById('resizeOkBtn');
const resizeCancelBtn = document.getElementById('resizeCancelBtn');

// 回転用UI要素
const rotateCWBtn = document.getElementById('rotateCWBtn');

// 初期化
function init() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

init();

// 通知を表示
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ツール選択
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // 選択状態をリセット
        selectedTextIndex = -1;
        selectedShapeIndex = -1;
        redrawCanvas();

        // ツールに応じたカーソルを設定
        if (currentTool === 'select') {
            canvas.style.cursor = 'default';
        } else if (currentTool === 'text') {
            canvas.style.cursor = 'text';
        } else if (currentTool === 'rectangle' || currentTool === 'square' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    });
});

// 色選択
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
});

// ブラシサイズ
brushSizeSlider.addEventListener('input', (e) => {
    brushSize = e.target.value;
    brushSizeValue.textContent = brushSize;
});

// 消しゴムサイズ
eraserSizeSlider.addEventListener('input', (e) => {
    eraserSize = e.target.value;
    eraserSizeValue.textContent = eraserSize;
});

// フォントサイズ
fontSizeSlider.addEventListener('input', (e) => {
    fontSize = e.target.value;
    fontSizeValue.textContent = fontSize;
});

// 図形の色設定
fillColorPicker.addEventListener('change', (e) => {
    fillColor = e.target.value;
});

strokeColorPicker.addEventListener('change', (e) => {
    strokeColor = e.target.value;
});

// 図形の塗りつぶし/枠線設定
fillShapeCheckbox.addEventListener('change', (e) => {
    hasFill = e.target.checked;
});

strokeShapeCheckbox.addEventListener('change', (e) => {
    hasStroke = e.target.checked;
});

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

    // ベース画像を描画
    if (baseImage) {
        ctx.drawImage(baseImage, 0, 0);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // すべての図形を描画
    shapeObjects.forEach((shape, index) => {
        drawShape(shape);

        // 選択中の図形にはハンドルを表示
        if (index === selectedShapeIndex) {
            drawSelectionHandles(shape);
        }
    });

    // すべてのテキストを描画
    textObjects.forEach((textObj, index) => {
        drawTextObject(textObj);

        // 選択中のテキストには枠を表示
        if (index === selectedTextIndex) {
            const metrics = ctx.measureText(textObj.text);
            const textWidth = metrics.width;
            const textHeight = textObj.fontSize;

            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(textObj.x - 5, textObj.y - textHeight, textWidth + 10, textHeight + 10);
            ctx.setLineDash([]);
        }
    });

    // プレビュー図形を描画
    if (previewShape) {
        ctx.globalAlpha = 0.7;
        drawShape(previewShape);
        ctx.globalAlpha = 1.0;
    }

    // トリミング矩形を描画
    if (isCropping && cropRect) {
        // 暗いオーバーレイ（選択範囲外）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 選択範囲をクリア（明るく表示）
        ctx.clearRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

        // 選択範囲を再描画
        if (baseImage) {
            ctx.drawImage(baseImage,
                cropRect.x, cropRect.y, cropRect.width, cropRect.height,
                cropRect.x, cropRect.y, cropRect.width, cropRect.height);
        }

        // テキストとシェイプを描画
        textObjects.forEach((textObj, index) => {
            ctx.font = `${textObj.fontSize}px Arial`;
            ctx.fillStyle = textObj.color;
            ctx.fillText(textObj.text, textObj.x, textObj.y);

            if (index === selectedTextIndex) {
                const metrics = ctx.measureText(textObj.text);
                const textWidth = metrics.width;
                const textHeight = textObj.fontSize;
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(textObj.x - 5, textObj.y - textHeight - 5, textWidth + 10, textHeight + 10);
                ctx.setLineDash([]);
            }
        });

        shapeObjects.forEach(shape => {
            drawShape(shape);
        });

        // 3x3グリッド線を描画
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;

        // 縦線
        for (let i = 1; i < 3; i++) {
            const x = cropRect.x + (cropRect.width / 3) * i;
            ctx.beginPath();
            ctx.moveTo(x, cropRect.y);
            ctx.lineTo(x, cropRect.y + cropRect.height);
            ctx.stroke();
        }

        // 横線
        for (let i = 1; i < 3; i++) {
            const y = cropRect.y + (cropRect.height / 3) * i;
            ctx.beginPath();
            ctx.moveTo(cropRect.x, y);
            ctx.lineTo(cropRect.x + cropRect.width, y);
            ctx.stroke();
        }

        // 選択範囲の枠線
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

        // リサイズハンドルを描画
        drawCropHandles(cropRect);

        // サイズ表示
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cropRect.x, cropRect.y - 30, 150, 25);
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px Arial';
        const sizeText = `${Math.round(cropRect.width)} × ${Math.round(cropRect.height)} px`;
        ctx.fillText(sizeText, cropRect.x + 5, cropRect.y - 10);
    }
}

// 履歴管理関数
function captureState() {
    if (isRestoring) return; // 復元中は履歴を保存しない

    // 現在の状態をキャプチャ
    const state = {
        canvasData: canvas.toDataURL(),
        textObjects: JSON.parse(JSON.stringify(textObjects)),
        shapeObjects: JSON.parse(JSON.stringify(shapeObjects)),
        baseImageData: baseImage ? baseImage.src : null,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageLoaded: imageLoaded
    };

    // 現在の位置より後の履歴を削除
    historyStates = historyStates.slice(0, historyIndex + 1);

    // 新しい状態を追加
    historyStates.push(state);

    // 履歴の最大数を超えたら古い履歴を削除
    if (historyStates.length > MAX_HISTORY) {
        historyStates.shift();
    } else {
        historyIndex++;
    }

    // ボタンの状態を更新
    updateUndoRedoButtons();
}

function restoreState(state) {
    if (!state) return;

    isRestoring = true;

    // キャンバスサイズを復元
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    // ベース画像を復元
    if (state.baseImageData) {
        const img = new Image();
        img.onload = () => {
            baseImage = img;
            imageLoaded = state.imageLoaded;

            // テキストと図形オブジェクトを復元
            textObjects = JSON.parse(JSON.stringify(state.textObjects));
            shapeObjects = JSON.parse(JSON.stringify(state.shapeObjects));

            // 選択状態をリセット
            selectedTextIndex = -1;
            selectedShapeIndex = -1;

            // キャンバスを再描画
            redrawCanvas();

            isRestoring = false;
        };
        img.src = state.baseImageData;
    } else {
        // ベース画像がない場合
        baseImage = null;
        imageLoaded = state.imageLoaded;
        textObjects = JSON.parse(JSON.stringify(state.textObjects));
        shapeObjects = JSON.parse(JSON.stringify(state.shapeObjects));
        selectedTextIndex = -1;
        selectedShapeIndex = -1;
        redrawCanvas();
        isRestoring = false;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyStates[historyIndex]);
        showNotification('元に戻しました', 'info');
    }
}

function redo() {
    if (historyIndex < historyStates.length - 1) {
        historyIndex++;
        restoreState(historyStates[historyIndex]);
        showNotification('やり直しました', 'info');
    }
}

function updateUndoRedoButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= historyStates.length - 1;
}

// 図形を描画する関数
function drawShape(shape) {
    ctx.save();

    if (shape.type === 'rectangle' || shape.type === 'square') {
        if (shape.hasFill) {
            ctx.fillStyle = shape.fill;
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        }
        if (shape.hasStroke) {
            ctx.strokeStyle = shape.stroke;
            ctx.lineWidth = shape.lineWidth;
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
    } else if (shape.type === 'circle') {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const radiusX = Math.abs(shape.width / 2);
        const radiusY = Math.abs(shape.height / 2);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        if (shape.hasFill) {
            ctx.fillStyle = shape.fill;
            ctx.fill();
        }
        if (shape.hasStroke) {
            ctx.strokeStyle = shape.stroke;
            ctx.lineWidth = shape.lineWidth;
            ctx.stroke();
        }
    } else if (shape.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.lineWidth;
        ctx.stroke();
    } else if (shape.type === 'arrow') {
        const fromX = shape.x;
        const fromY = shape.y;
        const toX = shape.x + shape.width;
        const toY = shape.y + shape.height;

        // 矢印の線
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.lineWidth;
        ctx.stroke();

        // 矢印の頭
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = 15;

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.lineWidth;
        ctx.stroke();
    }

    ctx.restore();
}

// テキストオブジェクトを描画する関数
function drawTextObject(textObj) {
    ctx.save();

    // フォントスタイルを設定
    let fontStyle = '';
    if (textObj.italic) fontStyle += 'italic ';
    if (textObj.bold) fontStyle += 'bold ';
    ctx.font = `${fontStyle}${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;

    // テキストのメトリクスを取得
    const lines = textObj.text.split('\n');
    const lineHeight = textObj.fontSize * 1.2;
    const metrics = ctx.measureText(textObj.text);
    const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const textHeight = lines.length * lineHeight;

    // 背景を描画
    if (textObj.backgroundColor) {
        ctx.fillStyle = textObj.backgroundColor;
        const padding = textObj.backgroundPadding || 5;
        ctx.fillRect(
            textObj.x - padding,
            textObj.y - textObj.fontSize - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
        );
    }

    // 影を設定
    if (textObj.shadow) {
        ctx.shadowColor = textObj.shadowColor || '#000000';
        ctx.shadowBlur = textObj.shadowBlur || 4;
        ctx.shadowOffsetX = textObj.shadowOffsetX || 2;
        ctx.shadowOffsetY = textObj.shadowOffsetY || 2;
    }

    // 各行を描画
    lines.forEach((line, index) => {
        const yPos = textObj.y + (index * lineHeight);

        // 縁取りを描画
        if (textObj.stroke) {
            ctx.strokeStyle = textObj.strokeColor || '#ffffff';
            ctx.lineWidth = textObj.strokeWidth || 3;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, textObj.x, yPos);
        }

        // テキストを描画
        ctx.fillStyle = textObj.color;
        ctx.fillText(line, textObj.x, yPos);
    });

    ctx.restore();
}

// 選択ハンドルを描画する関数
function drawSelectionHandles(shape) {
    const handleSize = 8;
    const handles = getShapeHandles(shape);

    ctx.fillStyle = '#667eea';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // 選択枠を描画
    ctx.strokeStyle = '#667eea';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
    ctx.setLineDash([]);

    // ハンドルを描画
    handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
}

// 図形のハンドル位置を取得
function getShapeHandles(shape) {
    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    return [
        { x: x, y: y, type: 'nw' },           // 左上
        { x: x + w / 2, y: y, type: 'n' },    // 上
        { x: x + w, y: y, type: 'ne' },       // 右上
        { x: x + w, y: y + h / 2, type: 'e' }, // 右
        { x: x + w, y: y + h, type: 'se' },   // 右下
        { x: x + w / 2, y: y + h, type: 's' }, // 下
        { x: x, y: y + h, type: 'sw' },       // 左下
        { x: x, y: y + h / 2, type: 'w' }     // 左
    ];
}

// トリミング範囲のハンドル位置を取得
function getCropHandles(cropRect) {
    const x = cropRect.x;
    const y = cropRect.y;
    const w = cropRect.width;
    const h = cropRect.height;

    return [
        { x: x, y: y, type: 'nw' },           // 左上
        { x: x + w / 2, y: y, type: 'n' },    // 上
        { x: x + w, y: y, type: 'ne' },       // 右上
        { x: x + w, y: y + h / 2, type: 'e' }, // 右
        { x: x + w, y: y + h, type: 'se' },   // 右下
        { x: x + w / 2, y: y + h, type: 's' }, // 下
        { x: x, y: y + h, type: 'sw' },       // 左下
        { x: x, y: y + h / 2, type: 'w' }     // 左
    ];
}

// トリミング範囲のハンドルを描画
function drawCropHandles(cropRect) {
    const handles = getCropHandles(cropRect);
    const handleSize = 12;

    ctx.fillStyle = '#667eea';

    handles.forEach(handle => {
        // ハンドルの外枠（白）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(handle.x - handleSize / 2 - 1, handle.y - handleSize / 2 - 1, handleSize + 2, handleSize + 2);

        // ハンドル本体（青）
        ctx.fillStyle = '#667eea';
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
}

// クリックされたトリミング範囲のハンドルを判定
function getClickedCropHandle(x, y, cropRect) {
    if (!cropRect) return null;

    const handles = getCropHandles(cropRect);
    const handleSize = 12;

    for (const handle of handles) {
        if (Math.abs(x - handle.x) <= handleSize / 2 && Math.abs(y - handle.y) <= handleSize / 2) {
            return handle.type;
        }
    }
    return null;
}

// トリミング範囲内かどうかを判定
function isInsideCropRect(x, y, cropRect) {
    if (!cropRect) return false;
    return x >= cropRect.x && x <= cropRect.x + cropRect.width &&
           y >= cropRect.y && y <= cropRect.y + cropRect.height;
}

// 画像ファイルを読み込む
function loadImageFromFile(file) {
    if (!file || !file.type.match('image.*')) {
        showNotification('有効な画像ファイルを選択してください', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // キャンバスサイズを画像に合わせる
            canvas.width = img.width;
            canvas.height = img.height;

            // ベース画像として保存
            baseImage = img;

            // 既存のテキストと図形をクリア
            textObjects = [];
            selectedTextIndex = -1;
            shapeObjects = [];
            selectedShapeIndex = -1;

            // キャンバスを再描画
            redrawCanvas();

            imageLoaded = true;

            // ドロップヒントを非表示
            dropHint.classList.add('hidden');

            showNotification('画像を読み込みました！', 'success');

            // 履歴をキャプチャ
            captureState();
        };
        img.onerror = () => {
            showNotification('画像の読み込みに失敗しました', 'error');
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
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

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// テキストがクリックされたかチェック
function getClickedTextIndex(x, y) {
    for (let i = textObjects.length - 1; i >= 0; i--) {
        const textObj = textObjects[i];

        // フォントスタイルを設定
        let fontStyle = '';
        if (textObj.italic) fontStyle += 'italic ';
        if (textObj.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;

        const lines = textObj.text.split('\n');
        const lineHeight = textObj.fontSize * 1.2;
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textHeight = lines.length * lineHeight;

        // テキストの範囲をチェック（少し広めの範囲）
        if (x >= textObj.x - 5 && x <= textObj.x + textWidth + 5 &&
            y >= textObj.y - textObj.fontSize && y <= textObj.y + textHeight) {
            return i;
        }
    }
    return -1;
}

// 図形がクリックされたかチェック
function getClickedShapeIndex(x, y) {
    for (let i = shapeObjects.length - 1; i >= 0; i--) {
        const shape = shapeObjects[i];
        const padding = 5;

        if (shape.type === 'rectangle' || shape.type === 'square' || shape.type === 'circle') {
            if (x >= shape.x - padding && x <= shape.x + shape.width + padding &&
                y >= shape.y - padding && y <= shape.y + shape.height + padding) {
                return i;
            }
        } else if (shape.type === 'line' || shape.type === 'arrow') {
            // 線と矢印は線の近傍をチェック
            const distance = distanceToLine(x, y, shape.x, shape.y, shape.x + shape.width, shape.y + shape.height);
            if (distance < 10) {
                return i;
            }
        }
    }
    return -1;
}

// 点と線分の距離を計算
function distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// ハンドルがクリックされたかチェック
function getClickedHandle(x, y, shape) {
    const handles = getShapeHandles(shape);
    const handleSize = 8;

    for (const handle of handles) {
        if (x >= handle.x - handleSize && x <= handle.x + handleSize &&
            y >= handle.y - handleSize && y <= handle.y + handleSize) {
            return handle.type;
        }
    }
    return null;
}

// テキストを編集（ダブルクリック時）
function editText(e) {
    if ((currentTool !== 'text' && currentTool !== 'select') || !imageLoaded) return;

    const pos = getMousePos(e);
    const clickedIndex = getClickedTextIndex(pos.x, pos.y);

    if (clickedIndex !== -1) {
        // 既存のテキストを編集
        selectedTextIndex = clickedIndex;
        const textObj = textObjects[clickedIndex];

        // ダイアログに既存の値を設定
        textInput.value = textObj.text;
        fontFamilySelect.value = textObj.fontFamily || 'Arial';
        dialogFontSizeSlider.value = textObj.fontSize || 24;
        dialogFontSizeValue.textContent = textObj.fontSize || 24;
        textColorPicker.value = textObj.color || '#000000';
        textBoldCheckbox.checked = textObj.bold || false;
        textItalicCheckbox.checked = textObj.italic || false;
        textShadowCheckbox.checked = textObj.shadow || false;
        textStrokeCheckbox.checked = textObj.stroke || false;
        textBackgroundCheckbox.checked = !!textObj.backgroundColor;
        shadowColorPicker.value = textObj.shadowColor || '#000000';
        strokeTextColorPicker.value = textObj.strokeColor || '#ffffff';
        bgColorPicker.value = textObj.backgroundColor || '#ffff00';

        // エフェクトセクションの表示/非表示
        shadowColorSection.style.display = textObj.shadow ? 'block' : 'none';
        strokeColorSection.style.display = textObj.stroke ? 'block' : 'none';
        bgColorSection.style.display = textObj.backgroundColor ? 'block' : 'none';

        // 編集モードとして位置を保持
        pendingTextPos = { x: textObj.x, y: textObj.y, editingIndex: clickedIndex };

        // プレビューを更新
        updateTextPreview();

        textInputDialog.classList.add('show');
        textInput.focus();
        textInput.select();
    }
}

function startDrawing(e) {
    const pos = getMousePos(e);

    // トリミングモードの場合
    if (isCropping) {
        if (cropRect) {
            // 既にトリミング範囲がある場合
            // ハンドルをクリックしたかチェック
            const handle = getClickedCropHandle(pos.x, pos.y, cropRect);
            if (handle) {
                // リサイズモード
                isResizingCrop = true;
                cropResizeHandle = handle;
                cropStartX = pos.x;
                cropStartY = pos.y;
                return;
            }

            // トリミング範囲内をクリックしたかチェック
            if (isInsideCropRect(pos.x, pos.y, cropRect)) {
                // 移動モード
                isDraggingCrop = true;
                cropDragOffsetX = pos.x - cropRect.x;
                cropDragOffsetY = pos.y - cropRect.y;
                return;
            }
        }

        // 新しいトリミング範囲を作成
        isCreatingCropRect = true;
        cropStartX = pos.x;
        cropStartY = pos.y;
        cropRect = null;
        return;
    }

    // 選択ツールの場合
    if (currentTool === 'select') {
        if (!imageLoaded) {
            return; // 画像がない場合は何もしない
        }

        // 図形の選択/リサイズ/移動をチェック
        if (selectedShapeIndex !== -1) {
            const selectedShape = shapeObjects[selectedShapeIndex];
            const handle = getClickedHandle(pos.x, pos.y, selectedShape);

            if (handle) {
                // ハンドルをクリック - リサイズモード
                isResizingShape = true;
                resizeHandle = handle;
                shapeStartX = pos.x;
                shapeStartY = pos.y;
                return;
            }
        }

        // 図形をクリックしたかチェック
        const clickedShapeIndex = getClickedShapeIndex(pos.x, pos.y);
        if (clickedShapeIndex !== -1) {
            // 図形を選択
            selectedShapeIndex = clickedShapeIndex;
            selectedTextIndex = -1;
            isDraggingShape = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            redrawCanvas();
            return;
        }

        // テキストをクリックしたかチェック
        const clickedTextIndex = getClickedTextIndex(pos.x, pos.y);
        if (clickedTextIndex !== -1) {
            // テキストを選択
            selectedTextIndex = clickedTextIndex;
            selectedShapeIndex = -1;
            isDraggingText = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            redrawCanvas();
            return;
        }

        // 何もクリックされていない場合は選択解除
        if (selectedTextIndex !== -1 || selectedShapeIndex !== -1) {
            selectedTextIndex = -1;
            selectedShapeIndex = -1;
            redrawCanvas();
        }
        return;
    }

    // 図形ツールの場合
    if (currentTool === 'rectangle' || currentTool === 'square' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow') {
        if (!imageLoaded) {
            showNotification('先に画像をアップロードまたはペーストしてください', 'info');
            return;
        }

        // 選択中の図形のハンドルをチェック
        if (selectedShapeIndex !== -1) {
            const selectedShape = shapeObjects[selectedShapeIndex];
            const handle = getClickedHandle(pos.x, pos.y, selectedShape);

            if (handle) {
                // ハンドルをクリック - リサイズモード
                isResizingShape = true;
                resizeHandle = handle;
                shapeStartX = pos.x;
                shapeStartY = pos.y;
                return;
            }
        }

        // 既存の図形をクリックしたかチェック
        const clickedShapeIndex = getClickedShapeIndex(pos.x, pos.y);

        if (clickedShapeIndex !== -1) {
            // 既存の図形をクリック - 選択/移動モード
            selectedShapeIndex = clickedShapeIndex;
            selectedTextIndex = -1;
            isDraggingShape = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            redrawCanvas();
        } else {
            // 新しい図形を描画開始
            selectedShapeIndex = -1;
            selectedTextIndex = -1;
            isDrawingShape = true;
            shapeStartX = pos.x;
            shapeStartY = pos.y;
        }
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
            selectedShapeIndex = -1;
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

    // テキスト・図形選択を解除
    if (selectedTextIndex !== -1 || selectedShapeIndex !== -1) {
        selectedTextIndex = -1;
        selectedShapeIndex = -1;
        redrawCanvas();
    }

    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    const pos = getMousePos(e);

    // トリミングモード中のドラッグ
    if (isCropping) {
        // トリミング範囲のリサイズ中
        if (isResizingCrop && cropRect) {
            const dx = pos.x - cropStartX;
            const dy = pos.y - cropStartY;

            let newX = cropRect.x;
            let newY = cropRect.y;
            let newWidth = cropRect.width;
            let newHeight = cropRect.height;

            // ハンドルに応じてリサイズ
            if (cropResizeHandle === 'nw') {
                newX += dx;
                newY += dy;
                newWidth -= dx;
                newHeight -= dy;
            } else if (cropResizeHandle === 'n') {
                newY += dy;
                newHeight -= dy;
            } else if (cropResizeHandle === 'ne') {
                newY += dy;
                newWidth += dx;
                newHeight -= dy;
            } else if (cropResizeHandle === 'e') {
                newWidth += dx;
            } else if (cropResizeHandle === 'se') {
                newWidth += dx;
                newHeight += dy;
            } else if (cropResizeHandle === 's') {
                newHeight += dy;
            } else if (cropResizeHandle === 'sw') {
                newX += dx;
                newWidth -= dx;
                newHeight += dy;
            } else if (cropResizeHandle === 'w') {
                newX += dx;
                newWidth -= dx;
            }

            // 最小サイズを確保
            if (newWidth > 10 && newHeight > 10) {
                // キャンバス範囲内に制限
                if (newX >= 0 && newY >= 0 &&
                    newX + newWidth <= canvas.width &&
                    newY + newHeight <= canvas.height) {
                    cropRect.x = newX;
                    cropRect.y = newY;
                    cropRect.width = newWidth;
                    cropRect.height = newHeight;
                    cropStartX = pos.x;
                    cropStartY = pos.y;
                }
            }

            redrawCanvas();
            return;
        }

        // トリミング範囲の移動中
        if (isDraggingCrop && cropRect) {
            let newX = pos.x - cropDragOffsetX;
            let newY = pos.y - cropDragOffsetY;

            // キャンバス範囲内に制限
            newX = Math.max(0, Math.min(newX, canvas.width - cropRect.width));
            newY = Math.max(0, Math.min(newY, canvas.height - cropRect.height));

            cropRect.x = newX;
            cropRect.y = newY;

            redrawCanvas();
            return;
        }

        // 新しいトリミング範囲を作成中
        if (isCreatingCropRect && cropStartX !== undefined && cropStartY !== undefined) {
            const width = pos.x - cropStartX;
            const height = pos.y - cropStartY;

            cropRect = {
                x: width >= 0 ? cropStartX : pos.x,
                y: height >= 0 ? cropStartY : pos.y,
                width: Math.abs(width),
                height: Math.abs(height)
            };

            redrawCanvas();
            return;
        }
    }

    // 図形のリサイズ中
    if (isResizingShape && selectedShapeIndex !== -1) {
        const shape = shapeObjects[selectedShapeIndex];
        const dx = pos.x - shapeStartX;
        const dy = pos.y - shapeStartY;

        // ハンドルに応じてリサイズ
        if (resizeHandle === 'nw') {
            shape.x += dx;
            shape.y += dy;
            shape.width -= dx;
            shape.height -= dy;
        } else if (resizeHandle === 'ne') {
            shape.y += dy;
            shape.width += dx;
            shape.height -= dy;
        } else if (resizeHandle === 'sw') {
            shape.x += dx;
            shape.width -= dx;
            shape.height += dy;
        } else if (resizeHandle === 'se') {
            shape.width += dx;
            shape.height += dy;
        } else if (resizeHandle === 'n') {
            shape.y += dy;
            shape.height -= dy;
        } else if (resizeHandle === 's') {
            shape.height += dy;
        } else if (resizeHandle === 'w') {
            shape.x += dx;
            shape.width -= dx;
        } else if (resizeHandle === 'e') {
            shape.width += dx;
        }

        shapeStartX = pos.x;
        shapeStartY = pos.y;

        redrawCanvas();
        return;
    }

    // 図形をドラッグ中
    if (isDraggingShape && selectedShapeIndex !== -1) {
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;

        shapeObjects[selectedShapeIndex].x += dx;
        shapeObjects[selectedShapeIndex].y += dy;

        dragStartX = pos.x;
        dragStartY = pos.y;

        redrawCanvas();
        return;
    }

    // 図形を描画中（プレビュー）
    if (isDrawingShape) {
        let width = pos.x - shapeStartX;
        let height = pos.y - shapeStartY;
        let finalWidth, finalHeight, finalX, finalY;

        // 正方形の場合は縦横比を1:1に固定
        if (currentTool === 'square') {
            // 縦横のうち大きい方のサイズを使用
            const size = Math.max(Math.abs(width), Math.abs(height));

            // 各方向の符号を保持してサイズを設定
            const signX = width >= 0 ? 1 : -1;
            const signY = height >= 0 ? 1 : -1;

            // 正方形のサイズと位置を計算
            finalWidth = size;
            finalHeight = size;
            finalX = signX >= 0 ? shapeStartX : shapeStartX - size;
            finalY = signY >= 0 ? shapeStartY : shapeStartY - size;
        } else {
            // 通常の図形（矩形、円など）
            finalWidth = Math.abs(width);
            finalHeight = Math.abs(height);
            finalX = width >= 0 ? shapeStartX : pos.x;
            finalY = height >= 0 ? shapeStartY : pos.y;
        }

        previewShape = {
            type: currentTool,
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            fill: fillColor,
            stroke: strokeColor,
            lineWidth: brushSize,
            hasFill: hasFill,
            hasStroke: hasStroke
        };

        redrawCanvas();
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

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineWidth = currentTool === 'eraser' ? eraserSize : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = pos2.x;
    lastY = pos2.y;
}

function stopDrawing() {
    // 図形描画が完了した場合
    if (isDrawingShape && previewShape) {
        // 図形を配列に追加（最小サイズチェック）
        if (previewShape.width > 5 || previewShape.height > 5) {
            shapeObjects.push(previewShape);
            selectedShapeIndex = shapeObjects.length - 1;
            showNotification('図形を追加しました', 'success');
            // 履歴をキャプチャ
            captureState();
        }
        previewShape = null;
        redrawCanvas();
    }

    // ブラシ/消しゴムで描画が完了した場合
    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser')) {
        // ベース画像を更新
        if (baseImage) {
            const tempImg = new Image();
            tempImg.onload = () => {
                baseImage = tempImg;
                // 履歴をキャプチャ
                captureState();
            };
            tempImg.src = canvas.toDataURL();
        }
    }

    // 図形の移動・リサイズが完了した場合
    if (isDraggingShape || isResizingShape) {
        captureState();
    }

    // テキストの移動が完了した場合
    if (isDraggingText) {
        captureState();
    }

    isDrawing = false;
    isDraggingText = false;
    isDrawingShape = false;
    isDraggingShape = false;
    isResizingShape = false;
    resizeHandle = null;

    // トリミング関連のフラグをリセット
    isCreatingCropRect = false;
    isDraggingCrop = false;
    isResizingCrop = false;
    cropResizeHandle = null;
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

    // ダイアログをデフォルト値に設定
    textInput.value = '';
    fontFamilySelect.value = 'Arial';
    dialogFontSizeSlider.value = 24;
    dialogFontSizeValue.textContent = 24;
    textColorPicker.value = '#000000';
    textBoldCheckbox.checked = false;
    textItalicCheckbox.checked = false;
    textShadowCheckbox.checked = false;
    textStrokeCheckbox.checked = false;
    textBackgroundCheckbox.checked = false;
    shadowColorPicker.value = '#000000';
    strokeTextColorPicker.value = '#ffffff';
    bgColorPicker.value = '#ffff00';

    // エフェクトセクションを非表示
    shadowColorSection.style.display = 'none';
    strokeColorSection.style.display = 'none';
    bgColorSection.style.display = 'none';

    // プレビューを更新
    updateTextPreview();

    // ダイアログを表示
    textInputDialog.classList.add('show');
    textInput.focus();
}

// テキストプレビューを更新する関数
function updateTextPreview() {
    const text = textInput.value || 'サンプルテキスト';
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(dialogFontSizeSlider.value);
    const color = textColorPicker.value;
    const isBold = textBoldCheckbox.checked;
    const isItalic = textItalicCheckbox.checked;
    const hasShadow = textShadowCheckbox.checked;
    const hasStroke = textStrokeCheckbox.checked;
    const hasBackground = textBackgroundCheckbox.checked;
    const shadowColor = shadowColorPicker.value;
    const strokeColor = strokeTextColorPicker.value;
    const bgColor = bgColorPicker.value;

    // プレビューのスタイルを設定
    let fontStyle = '';
    if (isItalic) fontStyle += 'italic ';
    let fontWeight = isBold ? 'bold' : 'normal';

    textPreview.style.fontFamily = fontFamily;
    textPreview.style.fontSize = `${fontSize}px`;
    textPreview.style.color = color;
    textPreview.style.fontStyle = isItalic ? 'italic' : 'normal';
    textPreview.style.fontWeight = fontWeight;
    textPreview.style.textShadow = hasShadow ? `2px 2px 4px ${shadowColor}` : 'none';
    textPreview.style.webkitTextStroke = hasStroke ? `2px ${strokeColor}` : 'none';
    textPreview.style.backgroundColor = hasBackground ? bgColor : 'transparent';
    textPreview.style.padding = hasBackground ? '10px' : '30px';
    textPreview.textContent = text;
}

// テキスト入力のOKボタン
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();

    if (text && pendingTextPos) {
        // テキストオブジェクトを作成
        const textObj = {
            text: text,
            x: pendingTextPos.x,
            y: pendingTextPos.y,
            fontSize: parseInt(dialogFontSizeSlider.value),
            fontFamily: fontFamilySelect.value,
            color: textColorPicker.value,
            bold: textBoldCheckbox.checked,
            italic: textItalicCheckbox.checked,
            shadow: textShadowCheckbox.checked,
            shadowColor: shadowColorPicker.value,
            shadowBlur: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            stroke: textStrokeCheckbox.checked,
            strokeColor: strokeTextColorPicker.value,
            strokeWidth: 3,
            backgroundColor: textBackgroundCheckbox.checked ? bgColorPicker.value : null,
            backgroundPadding: 5
        };

        if (pendingTextPos.editingIndex !== undefined) {
            // 既存のテキストを更新
            textObjects[pendingTextPos.editingIndex] = textObj;
            showNotification('テキストを更新しました', 'success');
        } else {
            // 新しいテキストを追加
            textObjects.push(textObj);
            showNotification('テキストを追加しました', 'success');
        }

        // キャンバスを再描画
        redrawCanvas();

        // 履歴をキャプチャ
        captureState();
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
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `edited-image-${timestamp}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showNotification('画像を保存しました！', 'success');
    } catch (err) {
        console.error('保存エラー:', err);
        showNotification('画像の保存に失敗しました', 'error');
    }
});

// キャンバスをクリア
clearBtn.addEventListener('click', () => {
    if (confirm('キャンバスをクリアしますか？この操作は取り消せません。')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imageLoaded = false;
        baseImage = null;
        textObjects = [];
        selectedTextIndex = -1;
        shapeObjects = [];
        selectedShapeIndex = -1;
        dropHint.classList.remove('hidden');
        showNotification('キャンバスをクリアしました', 'info');

        // 履歴をリセット
        historyStates = [];
        historyIndex = -1;
        updateUndoRedoButtons();
    }
});

// Undoボタン
undoBtn.addEventListener('click', undo);

// Redoボタン
redoBtn.addEventListener('click', redo);

// トリミングボタン
cropBtn.addEventListener('click', () => {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    isCropping = true;
    cropRect = null;
    isCreatingCropRect = false;
    isDraggingCrop = false;
    isResizingCrop = false;
    cropResizeHandle = null;
    cropControls.style.display = 'flex';
    canvas.style.cursor = 'crosshair';
    showNotification('トリミング範囲をドラッグして作成。範囲をドラッグで移動、ハンドルでサイズ変更できます', 'info');
});

// トリミング適用
cropApplyBtn.addEventListener('click', () => {
    if (!cropRect || cropRect.width < 10 || cropRect.height < 10) {
        showNotification('トリミング範囲が小さすぎます', 'error');
        return;
    }

    // トリミングを実行
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropRect.width;
    croppedCanvas.height = cropRect.height;
    const croppedCtx = croppedCanvas.getContext('2d');

    // ベース画像をトリミング
    if (baseImage) {
        croppedCtx.drawImage(baseImage,
            cropRect.x, cropRect.y, cropRect.width, cropRect.height,
            0, 0, cropRect.width, cropRect.height);
    }

    // 図形とテキストを調整
    textObjects.forEach(textObj => {
        textObj.x -= cropRect.x;
        textObj.y -= cropRect.y;
    });

    shapeObjects.forEach(shape => {
        shape.x -= cropRect.x;
        shape.y -= cropRect.y;
    });

    // 範囲外のオブジェクトを削除
    textObjects = textObjects.filter(textObj =>
        textObj.x >= 0 && textObj.x <= cropRect.width &&
        textObj.y >= 0 && textObj.y <= cropRect.height
    );
    shapeObjects = shapeObjects.filter(shape =>
        shape.x >= 0 && shape.x <= cropRect.width &&
        shape.y >= 0 && shape.y <= cropRect.height
    );

    // キャンバスサイズを更新
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;

    // ベース画像を更新
    const newImg = new Image();
    newImg.onload = () => {
        baseImage = newImg;
        isCropping = false;
        cropRect = null;
        isCreatingCropRect = false;
        isDraggingCrop = false;
        isResizingCrop = false;
        cropResizeHandle = null;
        cropControls.style.display = 'none';
        canvas.style.cursor = 'crosshair';
        redrawCanvas();
        captureState();
        showNotification('トリミングを適用しました', 'success');
    };
    newImg.src = croppedCanvas.toDataURL();
});

// トリミングキャンセル
cropCancelBtn.addEventListener('click', () => {
    isCropping = false;
    cropRect = null;
    isCreatingCropRect = false;
    isDraggingCrop = false;
    isResizingCrop = false;
    cropResizeHandle = null;
    cropControls.style.display = 'none';
    canvas.style.cursor = 'crosshair';
    redrawCanvas();
    showNotification('トリミングをキャンセルしました', 'info');
});

// リサイズボタン
resizeBtn.addEventListener('click', () => {
    if (!imageLoaded) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    // 現在のサイズを表示
    currentSizeText.textContent = `${canvas.width} × ${canvas.height} px`;
    newWidthInput.value = canvas.width;
    newHeightInput.value = canvas.height;
    originalAspectRatio = canvas.width / canvas.height;

    resizeDialog.classList.add('show');
});

// リサイズ実行
resizeOkBtn.addEventListener('click', () => {
    const newWidth = parseInt(newWidthInput.value);
    const newHeight = parseInt(newHeightInput.value);

    if (newWidth < 1 || newWidth > 5000 || newHeight < 1 || newHeight > 5000) {
        showNotification('サイズが範囲外です（1-5000px）', 'error');
        return;
    }

    // リサイズを実行
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    const resizedCtx = resizedCanvas.getContext('2d');

    // ベース画像をリサイズ
    if (baseImage) {
        resizedCtx.drawImage(baseImage, 0, 0, newWidth, newHeight);
    }

    const scaleX = newWidth / canvas.width;
    const scaleY = newHeight / canvas.height;

    // テキストと図形を拡大縮小
    textObjects.forEach(textObj => {
        textObj.x *= scaleX;
        textObj.y *= scaleY;
        textObj.fontSize *= Math.min(scaleX, scaleY);
    });

    shapeObjects.forEach(shape => {
        shape.x *= scaleX;
        shape.y *= scaleY;
        shape.width *= scaleX;
        shape.height *= scaleY;
        shape.lineWidth *= Math.min(scaleX, scaleY);
    });

    // キャンバスサイズを更新
    canvas.width = newWidth;
    canvas.height = newHeight;

    // ベース画像を更新
    const newImg = new Image();
    newImg.onload = () => {
        baseImage = newImg;
        redrawCanvas();
        captureState();
        showNotification('リサイズを適用しました', 'success');
    };
    newImg.src = resizedCanvas.toDataURL();

    resizeDialog.classList.remove('show');
});

// リサイズキャンセル
resizeCancelBtn.addEventListener('click', () => {
    resizeDialog.classList.remove('show');
});

// アスペクト比維持
newWidthInput.addEventListener('input', () => {
    if (maintainAspectCheckbox.checked && originalAspectRatio) {
        const newWidth = parseInt(newWidthInput.value);
        newHeightInput.value = Math.round(newWidth / originalAspectRatio);
    }
});

newHeightInput.addEventListener('input', () => {
    if (maintainAspectCheckbox.checked && originalAspectRatio) {
        const newHeight = parseInt(newHeightInput.value);
        newWidthInput.value = Math.round(newHeight * originalAspectRatio);
    }
});

// 回転処理（90度時計回り）
function rotateCanvas() {
    if (!imageLoaded || !baseImage) {
        showNotification('先に画像をアップロードまたはペーストしてください', 'info');
        return;
    }

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const newWidth = oldHeight;
    const newHeight = oldWidth;

    // 一時キャンバスを作成して回転した画像を描画
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // 回転の中心点を設定（90度時計回り）
    tempCtx.save();
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate((90 * Math.PI) / 180);
    tempCtx.drawImage(baseImage, -oldWidth / 2, -oldHeight / 2, oldWidth, oldHeight);
    tempCtx.restore();

    // テキストオブジェクトの座標を変換（90度時計回り）
    textObjects.forEach(textObj => {
        const oldX = textObj.x;
        const oldY = textObj.y;
        // 90度時計回り: (x, y) → (oldHeight - y, x)
        textObj.x = oldHeight - oldY;
        textObj.y = oldX;
    });

    // 図形オブジェクトの座標を変換（90度時計回り）
    shapeObjects.forEach(shape => {
        const oldX = shape.x;
        const oldY = shape.y;
        const oldW = shape.width;
        const oldH = shape.height;
        // 90度時計回り
        shape.x = oldHeight - oldY - oldH;
        shape.y = oldX;
        shape.width = oldH;
        shape.height = oldW;
    });

    // キャンバスサイズを更新
    canvas.width = newWidth;
    canvas.height = newHeight;

    // ベース画像を更新
    const newImg = new Image();
    newImg.onload = () => {
        baseImage = newImg;
        redrawCanvas();
        captureState();
        showNotification('90度回転しました', 'success');
    };
    newImg.src = tempCanvas.toDataURL();
}

// 回転ボタンのイベントリスナー
rotateCWBtn.addEventListener('click', rotateCanvas);

// ショートカットキー
document.addEventListener('keydown', (e) => {
    // Ctrl+S で保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }

    // Deleteキーで選択中のテキストを削除
    if (e.key === 'Delete' && selectedTextIndex !== -1 && (currentTool === 'text' || currentTool === 'select')) {
        e.preventDefault();
        textObjects.splice(selectedTextIndex, 1);
        selectedTextIndex = -1;
        redrawCanvas();
        showNotification('テキストを削除しました', 'success');
        captureState();
    }

    // Deleteキーで選択中の図形を削除
    if (e.key === 'Delete' && selectedShapeIndex !== -1 &&
        (currentTool === 'rectangle' || currentTool === 'square' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow' || currentTool === 'select')) {
        e.preventDefault();
        shapeObjects.splice(selectedShapeIndex, 1);
        selectedShapeIndex = -1;
        redrawCanvas();
        showNotification('図形を削除しました', 'success');
        captureState();
    }

    // Ctrl+Z で元に戻す
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl+Y または Ctrl+Shift+Z でやり直し
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }
});

// テキストダイアログのイベントリスナー（リアルタイムプレビュー）
textInput.addEventListener('input', updateTextPreview);
fontFamilySelect.addEventListener('change', updateTextPreview);
dialogFontSizeSlider.addEventListener('input', () => {
    dialogFontSizeValue.textContent = dialogFontSizeSlider.value;
    updateTextPreview();
});
textColorPicker.addEventListener('input', updateTextPreview);
textBoldCheckbox.addEventListener('change', updateTextPreview);
textItalicCheckbox.addEventListener('change', updateTextPreview);
textShadowCheckbox.addEventListener('change', () => {
    shadowColorSection.style.display = textShadowCheckbox.checked ? 'block' : 'none';
    updateTextPreview();
});
textStrokeCheckbox.addEventListener('change', () => {
    strokeColorSection.style.display = textStrokeCheckbox.checked ? 'block' : 'none';
    updateTextPreview();
});
textBackgroundCheckbox.addEventListener('change', () => {
    bgColorSection.style.display = textBackgroundCheckbox.checked ? 'block' : 'none';
    updateTextPreview();
});
shadowColorPicker.addEventListener('input', updateTextPreview);
strokeTextColorPicker.addEventListener('input', updateTextPreview);
bgColorPicker.addEventListener('input', updateTextPreview);

// 使い方トグル機能
const toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');
const instructionsContent = document.getElementById('instructionsContent');

toggleInstructionsBtn.addEventListener('click', () => {
    if (instructionsContent.style.display === 'none') {
        instructionsContent.style.display = 'block';
        toggleInstructionsBtn.textContent = '📖 使い方を非表示';
    } else {
        instructionsContent.style.display = 'none';
        toggleInstructionsBtn.textContent = '📖 使い方を表示';
    }
});

// スマートフォン向けタッチ制御の改善
(function initMobileOptimizations() {
    // ダブルタップズームを防止
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // キャンバス以外のタッチスクロールを許可、キャンバス上では防止
    canvas.addEventListener('touchstart', function(e) {
        // デフォルトの動作を防止（スクロール、ズームなど）
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
        // キャンバス上でのスクロールを防止
        e.preventDefault();
    }, { passive: false });

    // ピンチズームを防止（gestureイベント - Safari用）
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });

    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    });

    // ツールボタンのタップ時のハイライトを改善
    const toolButtons = document.querySelectorAll('.btn, .tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        button.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
        button.addEventListener('touchcancel', function() {
            this.style.opacity = '1';
        });
    });

    console.log('📱 スマートフォン向け最適化が有効になりました');
})();

// ウィンドウリサイズ・画面回転時の対応
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // 画像がロードされていない場合のみキャンバスサイズを調整
        if (!imageLoaded) {
            const containerWidth = document.querySelector('.canvas-container').clientWidth;
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                const maxWidth = Math.min(containerWidth - 40, 600);
                const maxHeight = Math.min(window.innerHeight - 300, 450);

                // キャンバスサイズを変更しても既存のコンテンツが失われないように
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, 0);

                canvas.width = maxWidth;
                canvas.height = maxHeight;

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tempCanvas, 0, 0);
            }
        }
        console.log('📱 画面サイズが変更されました');
    }, 250);
});

// 画面の向き変更時の対応
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        console.log('📱 画面の向きが変更されました');
        window.dispatchEvent(new Event('resize'));
    }, 100);
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('📐 図形ツール: ドラッグで描画、クリックで選択、ハンドルでサイズ変更、Deleteキーで削除');
console.log('■ 正方形ツール: 縦横比1:1の四角形を描画');
console.log('↶ 元に戻す: Ctrl+Z');
console.log('↷ やり直し: Ctrl+Y または Ctrl+Shift+Z');
