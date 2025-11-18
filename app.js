// グローバル変数
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 5;
let brushOpacity = 1.0; // 0.0 - 1.0の範囲
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

// Undo/Redo履歴管理
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 30; // 最大履歴数

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
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushOpacitySlider = document.getElementById('brushOpacity');
const brushOpacityValue = document.getElementById('brushOpacityValue');
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
const dialogFontSize = document.getElementById('dialogFontSize');
const dialogFontSizeValue = document.getElementById('dialogFontSizeValue');
const dialogFontSizeInput = document.getElementById('dialogFontSizeInput');
const dialogFontFamily = document.getElementById('dialogFontFamily');
const dialogColorPicker = document.getElementById('dialogColorPicker');
const textPreview = document.getElementById('textPreview');
const colorPresets = document.querySelectorAll('.color-preset');
const saveFormatDialog = document.getElementById('saveFormatDialog');
const saveFormatRadios = document.querySelectorAll('input[name="saveFormat"]');
const saveQuality = document.getElementById('saveQuality');
const saveQualityValue = document.getElementById('saveQualityValue');
const saveQualityInput = document.getElementById('saveQualityInput');
const qualityGroup = document.getElementById('qualityGroup');
const saveConfirmBtn = document.getElementById('saveConfirmBtn');
const saveCancelBtn = document.getElementById('saveCancelBtn');
const brushColorPresets = document.querySelectorAll('.brush-color-preset');

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

// ========================================
// Undo/Redo機能
// ========================================

// 現在の状態を保存
function saveState() {
    // 現在のキャンバスの状態を保存
    const state = {
        canvasData: canvas.toDataURL(),
        textObjects: JSON.parse(JSON.stringify(textObjects)), // ディープコピー
        baseImage: baseImage ? baseImage.src : null,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageLoaded: imageLoaded
    };

    // undoStackに追加
    undoStack.push(state);

    // 最大履歴数を超えた場合、古い履歴を削除
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    // 新しい操作が行われたらredoStackをクリア
    redoStack = [];

    // ボタンの状態を更新
    updateHistoryButtons();
}

// Undo実行
function undo() {
    if (undoStack.length === 0) return;

    // 現在の状態をredoStackに保存
    const currentState = {
        canvasData: canvas.toDataURL(),
        textObjects: JSON.parse(JSON.stringify(textObjects)),
        baseImage: baseImage ? baseImage.src : null,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageLoaded: imageLoaded
    };
    redoStack.push(currentState);

    // undoStackから1つ前の状態を取得
    const previousState = undoStack.pop();

    // 状態を復元
    restoreState(previousState);

    // ボタンの状態を更新
    updateHistoryButtons();

    showNotification('↶ 元に戻しました', 'info');
}

// Redo実行
function redo() {
    if (redoStack.length === 0) return;

    // 現在の状態をundoStackに保存
    const currentState = {
        canvasData: canvas.toDataURL(),
        textObjects: JSON.parse(JSON.stringify(textObjects)),
        baseImage: baseImage ? baseImage.src : null,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageLoaded: imageLoaded
    };
    undoStack.push(currentState);

    // redoStackから次の状態を取得
    const nextState = redoStack.pop();

    // 状態を復元
    restoreState(nextState);

    // ボタンの状態を更新
    updateHistoryButtons();

    showNotification('↷ やり直しました', 'info');
}

// 状態を復元
function restoreState(state) {
    // キャンバスサイズを復元
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    // キャンバスの描画内容を復元
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = state.canvasData;

    // テキストオブジェクトを復元
    textObjects = JSON.parse(JSON.stringify(state.textObjects));
    selectedTextIndex = -1;

    // ベース画像を復元
    if (state.baseImage) {
        const baseImg = new Image();
        baseImg.onload = () => {
            baseImage = baseImg;
        };
        baseImg.src = state.baseImage;
    } else {
        baseImage = null;
    }

    // imageLoadedフラグを復元
    imageLoaded = state.imageLoaded;

    // ドロップヒントの表示/非表示を更新
    if (imageLoaded) {
        dropHint.classList.add('hidden');
    } else {
        dropHint.classList.remove('hidden');
    }
}

// Undo/Redoボタンの有効/無効を更新
function updateHistoryButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

// Undo/Redoボタンのイベントリスナー
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// ツール選択
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // ツールに応じたカーソルを設定
        if (currentTool === 'text') {
            canvas.style.cursor = 'text';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    });
});

// 色選択
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    updateBrushColorPresetSelection(currentColor);
});

// ブラシカラープリセットボタン
brushColorPresets.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        currentColor = color;
        colorPicker.value = color;
        updateBrushColorPresetSelection(color);
    });
});

// ブラシカラープリセットの選択状態を更新
function updateBrushColorPresetSelection(color) {
    brushColorPresets.forEach(btn => {
        if (btn.dataset.color.toUpperCase() === color.toUpperCase()) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// 初期カラー設定
updateBrushColorPresetSelection(currentColor);

// ブラシサイズ
brushSizeSlider.addEventListener('input', (e) => {
    brushSize = e.target.value;
    brushSizeValue.textContent = brushSize;
});

// ブラシ不透明度
brushOpacitySlider.addEventListener('input', (e) => {
    const opacityPercent = e.target.value;
    brushOpacity = opacityPercent / 100; // 0.01 - 1.0に変換
    brushOpacityValue.textContent = opacityPercent;
});

// フォントサイズ
fontSizeSlider.addEventListener('input', (e) => {
    fontSize = e.target.value;
    fontSizeValue.textContent = fontSize;
});

// ダイアログ内のフォントサイズスライダー
dialogFontSize.addEventListener('input', (e) => {
    const value = e.target.value;
    dialogFontSizeValue.textContent = value;
    dialogFontSizeInput.value = value;
    updateTextPreview();
});

// ダイアログ内のフォントサイズ数値入力
dialogFontSizeInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    if (value < 10) value = 10;
    if (value > 100) value = 100;
    if (isNaN(value)) value = 24;

    dialogFontSize.value = value;
    dialogFontSizeValue.textContent = value;
    updateTextPreview();
});

// ダイアログ内のフォント選択
dialogFontFamily.addEventListener('change', (e) => {
    updateTextPreview();
});

// ダイアログ内のカラーピッカー
dialogColorPicker.addEventListener('input', (e) => {
    updateColorPresetSelection(e.target.value);
    updateTextPreview();
});

// プリセット色ボタン
colorPresets.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        dialogColorPicker.value = color;
        updateColorPresetSelection(color);
        updateTextPreview();
    });
});

// 保存形式選択イベント
saveFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const format = e.target.value;
        // JPEG/WebPの場合は品質設定を表示
        if (format === 'jpeg' || format === 'webp') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
    });
});

// 保存品質スライダー
saveQuality.addEventListener('input', (e) => {
    const value = e.target.value;
    saveQualityValue.textContent = value;
    saveQualityInput.value = value;
});

// 保存品質数値入力
saveQualityInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    if (value < 1) value = 1;
    if (value > 100) value = 100;
    if (isNaN(value)) value = 92;

    saveQuality.value = value;
    saveQualityValue.textContent = value;
});

// テキスト入力のリアルタイムプレビュー
textInput.addEventListener('input', () => {
    updateTextPreview();
});

// プレビューを更新する関数
function updateTextPreview() {
    const text = textInput.value.trim();
    const fontSize = dialogFontSize.value;
    const fontFamily = dialogFontFamily.value;
    const color = dialogColorPicker.value;

    textPreview.textContent = text || 'サンプルテキスト';
    textPreview.style.fontSize = fontSize + 'px';
    textPreview.style.fontFamily = fontFamily;
    textPreview.style.color = color;
}

// カラープリセットの選択状態を更新
function updateColorPresetSelection(color) {
    colorPresets.forEach(btn => {
        if (btn.dataset.color.toUpperCase() === color.toUpperCase()) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

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

    // すべてのテキストを描画
    textObjects.forEach((textObj, index) => {
        const fontFamily = textObj.fontFamily || 'Arial, sans-serif';
        ctx.font = `${textObj.fontSize}px ${fontFamily}`;
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

            // 既存のテキストをクリア
            textObjects = [];
            selectedTextIndex = -1;

            // キャンバスを再描画
            redrawCanvas();

            imageLoaded = true;

            // ドロップヒントを非表示
            dropHint.classList.add('hidden');

            // 初回の履歴をクリアして、画像読み込み後の状態を最初の履歴として保存
            undoStack = [];
            redoStack = [];
            saveState();

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
        const fontFamily = textObj.fontFamily || 'Arial, sans-serif';
        ctx.font = `${textObj.fontSize}px ${fontFamily}`;
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

        // ダイアログを表示し、既存のテキストとスタイルを設定
        textInput.value = textObj.text;

        // ダイアログ内のフォント、フォントサイズ、色を設定
        dialogFontFamily.value = textObj.fontFamily || 'Arial, sans-serif';
        dialogFontSize.value = textObj.fontSize;
        dialogFontSizeValue.textContent = textObj.fontSize;
        dialogFontSizeInput.value = textObj.fontSize;
        dialogColorPicker.value = textObj.color;

        // カラープリセットの選択状態を更新
        updateColorPresetSelection(textObj.color);

        // プレビューを更新
        updateTextPreview();

        // 編集モードとして位置を保持
        pendingTextPos = { x: textObj.x, y: textObj.y, editingIndex: clickedIndex };

        textInputDialog.classList.add('show');
        textInput.focus();
        textInput.select();
    }
}

function startDrawing(e) {
    const pos = getMousePos(e);

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
    const pos = getMousePos(e);

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

    // 不透明度を設定
    ctx.globalAlpha = brushOpacity;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 不透明度をリセット
    ctx.globalAlpha = 1.0;

    lastX = pos2.x;
    lastY = pos2.y;
}

function stopDrawing() {
    // 描画が実際に行われていた場合のみ状態を保存
    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser')) {
        saveState();
    }

    isDrawing = false;
    isDraggingText = false;
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

    // ダイアログを表示し、現在の設定を反映
    textInput.value = '';
    dialogFontFamily.value = 'Arial, sans-serif';
    dialogFontSize.value = fontSize;
    dialogFontSizeValue.textContent = fontSize;
    dialogFontSizeInput.value = fontSize;
    dialogColorPicker.value = currentColor;

    // カラープリセットの選択状態を更新
    updateColorPresetSelection(currentColor);

    // プレビューを更新
    updateTextPreview();

    textInputDialog.classList.add('show');
    textInput.focus();
}

// テキスト入力のOKボタン
textOkBtn.addEventListener('click', () => {
    const text = textInput.value.trim();

    if (text && pendingTextPos) {
        // ダイアログ内の値を取得（数値入力とスライダーは同期されている）
        const dialogFontFamilyVal = dialogFontFamily.value;
        const dialogFontSizeVal = parseInt(dialogFontSize.value);
        const dialogColorVal = dialogColorPicker.value;

        if (pendingTextPos.editingIndex !== undefined) {
            // 既存のテキストを更新
            textObjects[pendingTextPos.editingIndex] = {
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontFamily: dialogFontFamilyVal,
                fontSize: dialogFontSizeVal,
                color: dialogColorVal
            };
            showNotification('✓ テキストを更新しました', 'success');
        } else {
            // 新しいテキストを追加
            textObjects.push({
                text: text,
                x: pendingTextPos.x,
                y: pendingTextPos.y,
                fontFamily: dialogFontFamilyVal,
                fontSize: dialogFontSizeVal,
                color: dialogColorVal
            });
            showNotification('✓ テキストを追加しました', 'success');
        }

        // ツールバーの値も更新
        fontSize = dialogFontSizeVal;
        currentColor = dialogColorVal;
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize;
        colorPicker.value = currentColor;

        // キャンバスを再描画
        redrawCanvas();

        // 状態を保存
        saveState();
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

// 画像を保存 - ダイアログを表示
saveBtn.addEventListener('click', () => {
    saveFormatDialog.classList.add('show');
});

// 保存確定ボタン
saveConfirmBtn.addEventListener('click', () => {
    try {
        // 選択された形式を取得
        const selectedFormat = document.querySelector('input[name="saveFormat"]:checked').value;
        const quality = saveQuality.value / 100; // 0.01 - 1.00に変換

        // タイムスタンプ生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        // 形式に応じてMIMEタイプとファイル拡張子を設定
        let mimeType, extension;
        if (selectedFormat === 'png') {
            mimeType = 'image/png';
            extension = 'png';
        } else if (selectedFormat === 'jpeg') {
            mimeType = 'image/jpeg';
            extension = 'jpg';
        } else if (selectedFormat === 'webp') {
            mimeType = 'image/webp';
            extension = 'webp';
        }

        // データURLを生成（PNGの場合は品質パラメータなし）
        let dataURL;
        if (selectedFormat === 'png') {
            dataURL = canvas.toDataURL(mimeType);
        } else {
            dataURL = canvas.toDataURL(mimeType, quality);
        }

        // ダウンロード
        const link = document.createElement('a');
        link.download = `edited-image-${timestamp}.${extension}`;
        link.href = dataURL;
        link.click();

        // ダイアログを閉じる
        saveFormatDialog.classList.remove('show');

        showNotification(`画像を${selectedFormat.toUpperCase()}形式で保存しました！`, 'success');
    } catch (err) {
        console.error('保存エラー:', err);
        showNotification('画像の保存に失敗しました', 'error');
    }
});

// 保存キャンセルボタン
saveCancelBtn.addEventListener('click', () => {
    saveFormatDialog.classList.remove('show');
});

// 保存ダイアログの背景クリックで閉じる
saveFormatDialog.addEventListener('click', (e) => {
    if (e.target === saveFormatDialog) {
        saveCancelBtn.click();
    }
});

// キャンバスをクリア
clearBtn.addEventListener('click', () => {
    if (confirm('キャンバスをクリアしますか？')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imageLoaded = false;
        baseImage = null;
        textObjects = [];
        selectedTextIndex = -1;
        dropHint.classList.remove('hidden');

        // 状態を保存（Undoで復元可能に）
        saveState();

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

    // Ctrl+Z で元に戻す（Undo）
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl+Y または Ctrl+Shift+Z でやり直す（Redo）
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }

    // Deleteキーで選択中のテキストを削除
    if (e.key === 'Delete' && selectedTextIndex !== -1 && currentTool === 'text') {
        e.preventDefault();
        textObjects.splice(selectedTextIndex, 1);
        selectedTextIndex = -1;
        redrawCanvas();
        saveState(); // 状態を保存
        showNotification('🗑️ テキストを削除しました', 'success');
    }
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('↶↷ Ctrl+Z で元に戻す、Ctrl+Y でやり直す');
showNotification('画像エディターへようこそ！', 'info');
