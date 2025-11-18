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
let fillColor = '#3498db';
let strokeColor = '#000000';
let hasFill = true;
let hasStroke = true;
let isDraggingShape = false;
let isResizingShape = false;
let resizeHandle = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'

// キャンバスのデフォルトサイズ
canvas.width = 800;
canvas.height = 600;

// UI要素の取得
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const colorPicker = document.getElementById('colorPicker');
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
const textOkBtn = document.getElementById('textOkBtn');
const textCancelBtn = document.getElementById('textCancelBtn');

// 図形ツール用UI要素
const fillColorPicker = document.getElementById('fillColorPicker');
const strokeColorPicker = document.getElementById('strokeColorPicker');
const fillShapeCheckbox = document.getElementById('fillShape');
const strokeShapeCheckbox = document.getElementById('strokeShape');

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
        if (currentTool === 'text') {
            canvas.style.cursor = 'text';
        } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow') {
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
        ctx.font = `${textObj.fontSize}px Arial`;
        ctx.fillStyle = textObj.color;
        ctx.fillText(textObj.text, textObj.x, textObj.y);

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
}

// 図形を描画する関数
function drawShape(shape) {
    ctx.save();

    if (shape.type === 'rectangle') {
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

// 選択ハンドルを描画する関数
function drawSelectionHandles(shape) {
    const handleSize = 8;
    const handles = getShapeHandles(shape);

    ctx.fillStyle = '#667eea';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // 線と矢印の場合は選択枠なし、始点と終点のみ
    if (shape.type === 'line' || shape.type === 'arrow') {
        // 始点と終点にハンドルを描画
        const startX = shape.x;
        const startY = shape.y;
        const endX = shape.x + shape.width;
        const endY = shape.y + shape.height;

        // 線を強調表示
        ctx.strokeStyle = '#667eea';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 始点のハンドル
        ctx.fillStyle = '#667eea';
        ctx.fillRect(startX - handleSize / 2, startY - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(startX - handleSize / 2, startY - handleSize / 2, handleSize, handleSize);

        // 終点のハンドル
        ctx.fillStyle = '#667eea';
        ctx.fillRect(endX - handleSize / 2, endY - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(endX - handleSize / 2, endY - handleSize / 2, handleSize, handleSize);
    } else {
        // 矩形と円の場合は選択枠とハンドルを描画
        ctx.strokeStyle = '#667eea';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
        ctx.setLineDash([]);

        // ハンドルを描画
        handles.forEach(handle => {
            ctx.fillStyle = '#667eea';
            ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });
    }
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
        ctx.font = `${textObj.fontSize}px Arial`;
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

// 図形がクリックされたかチェック
function getClickedShapeIndex(x, y) {
    for (let i = shapeObjects.length - 1; i >= 0; i--) {
        const shape = shapeObjects[i];
        const padding = 5;

        if (shape.type === 'rectangle' || shape.type === 'circle') {
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
    const handleSize = 8;

    // 線と矢印の場合は始点と終点のみ
    if (shape.type === 'line' || shape.type === 'arrow') {
        const startX = shape.x;
        const startY = shape.y;
        const endX = shape.x + shape.width;
        const endY = shape.y + shape.height;

        // 始点をチェック
        if (x >= startX - handleSize && x <= startX + handleSize &&
            y >= startY - handleSize && y <= startY + handleSize) {
            return 'start';
        }

        // 終点をチェック
        if (x >= endX - handleSize && x <= endX + handleSize &&
            y >= endY - handleSize && y <= endY + handleSize) {
            return 'end';
        }

        return null;
    } else {
        // 矩形と円の場合は8つのハンドル
        const handles = getShapeHandles(shape);

        for (const handle of handles) {
            if (x >= handle.x - handleSize && x <= handle.x + handleSize &&
                y >= handle.y - handleSize && y <= handle.y + handleSize) {
                return handle.type;
            }
        }
        return null;
    }
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

        // UIを更新
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize;
        colorPicker.value = currentColor;

        // 編集モードとして位置を保持
        pendingTextPos = { x: textObj.x, y: textObj.y, editingIndex: clickedIndex };

        textInputDialog.classList.add('show');
        textInput.focus();
        textInput.select();
    }
}

function startDrawing(e) {
    const pos = getMousePos(e);

    // 図形ツールの場合
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow') {
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

    // 図形のリサイズ中
    if (isResizingShape && selectedShapeIndex !== -1) {
        const shape = shapeObjects[selectedShapeIndex];
        const dx = pos.x - shapeStartX;
        const dy = pos.y - shapeStartY;

        // 線と矢印の場合の特別処理
        if (shape.type === 'line' || shape.type === 'arrow') {
            if (resizeHandle === 'start') {
                // 始点を移動
                shape.x += dx;
                shape.y += dy;
                shape.width -= dx;
                shape.height -= dy;
            } else if (resizeHandle === 'end') {
                // 終点を移動
                shape.width += dx;
                shape.height += dy;
            }
        } else {
            // 矩形と円の場合のリサイズ処理
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
        const width = pos.x - shapeStartX;
        const height = pos.y - shapeStartY;

        // 線と矢印は枠線のみ
        let shapeFill = hasFill;
        let shapeStroke = hasStroke;
        if (currentTool === 'line' || currentTool === 'arrow') {
            shapeFill = false;
            shapeStroke = true;
        }

        // 塗りつぶしと枠線の両方がオフの場合、枠線を強制的にオンにする
        if (!shapeFill && !shapeStroke) {
            shapeStroke = true;
        }

        previewShape = {
            type: currentTool,
            x: width >= 0 ? shapeStartX : pos.x,
            y: height >= 0 ? shapeStartY : pos.y,
            width: Math.abs(width),
            height: Math.abs(height),
            fill: fillColor,
            stroke: strokeColor,
            lineWidth: brushSize,
            hasFill: shapeFill,
            hasStroke: shapeStroke
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
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = pos2.x;
    lastY = pos2.y;
}

function stopDrawing() {
    // 図形描画が完了した場合
    if (isDrawingShape && previewShape) {
        // 最小サイズチェック（3ピクセル以上）
        const minSize = 3;
        if (previewShape.width >= minSize || previewShape.height >= minSize) {
            shapeObjects.push(previewShape);
            selectedShapeIndex = shapeObjects.length - 1;
            showNotification('図形を追加しました', 'success');
        } else {
            showNotification('図形が小さすぎます。もう少し大きくドラッグしてください', 'info');
        }
        previewShape = null;
        redrawCanvas();
    }

    isDrawing = false;
    isDraggingText = false;
    isDrawingShape = false;
    isDraggingShape = false;
    isResizingShape = false;
    resizeHandle = null;
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
    textInput.focus();
}

// テキスト入力のOKボタン
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();

    if (text && pendingTextPos) {
        if (pendingTextPos.editingIndex !== undefined) {
            // 既存のテキストを更新
            textObjects[pendingTextPos.editingIndex] = {
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: fontSize,
                color: currentColor
            };
            showNotification('テキストを更新しました', 'success');
        } else {
            // 新しいテキストを追加
            textObjects.push({
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontSize: fontSize,
                color: currentColor
            });
            showNotification('テキストを追加しました', 'success');
        }

        // キャンバスを再描画
        redrawCanvas();
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
    }
});

// ショートカットキー
document.addEventListener('keydown', (e) => {
    // Ctrl+S で保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveBtn.click();
    }

    // Deleteキーで選択中のテキストを削除
    if (e.key === 'Delete' && selectedTextIndex !== -1 && currentTool === 'text') {
        e.preventDefault();
        textObjects.splice(selectedTextIndex, 1);
        selectedTextIndex = -1;
        redrawCanvas();
        showNotification('テキストを削除しました', 'success');
    }

    // Deleteキーで選択中の図形を削除
    if (e.key === 'Delete' && selectedShapeIndex !== -1 &&
        (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line' || currentTool === 'arrow')) {
        e.preventDefault();
        shapeObjects.splice(selectedShapeIndex, 1);
        selectedShapeIndex = -1;
        redrawCanvas();
        showNotification('図形を削除しました', 'success');
    }

    // Ctrl+Z で元に戻す（簡易版）
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        // 注: 完全な元に戻す機能には履歴管理が必要
    }
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('📐 図形ツール: ドラッグで描画、クリックで選択、ハンドルでサイズ変更、Deleteキーで削除');
showNotification('画像エディターへようこそ！', 'info');
