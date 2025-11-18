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
let baseCanvas = null; // 元の画像とブラシ描画を保持
let isDraggingText = false;
let dragStartX = 0;
let dragStartY = 0;
let currentFontFamily = 'Arial'; // 現在のフォント

// 履歴管理（Undo/Redo用）
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50; // 履歴の最大保持数

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
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const toolButtons = document.querySelectorAll('.tool-btn');
const dropZone = document.getElementById('dropZone');
const dropHint = document.getElementById('dropHint');
const notification = document.getElementById('notification');
const textInputDialog = document.getElementById('textInputDialog');
const textInput = document.getElementById('textInput');
const fontFamilySelect = document.getElementById('fontFamily');
const textOkBtn = document.getElementById('textOkBtn');
const textCancelBtn = document.getElementById('textCancelBtn');
const toggleInstructionsBtn = document.getElementById('toggleInstructions');
const instructionsContent = document.getElementById('instructionsContent');

// 初期化
function init() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

init();

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

// カスタムカーソルを更新
function updateCursor() {
    if (currentTool === 'text') {
        canvas.style.cursor = 'text';
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

// ツール選択
toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // カーソルを更新
        updateCursor();
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
    // カーソルを更新
    updateCursor();
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

    // ベース画像とブラシ描画を描画
    if (baseCanvas) {
        ctx.drawImage(baseCanvas, 0, 0);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // すべてのテキストを描画
    textObjects.forEach((textObj, index) => {
        ctx.font = `${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;
        ctx.fillStyle = textObj.color;
        ctx.fillText(textObj.text, textObj.x, textObj.y);

        // 選択中のテキストには枠を表示
        if (index === selectedTextIndex) {
            ctx.font = `${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`; // フォント再設定
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

            // ベースキャンバスを作成して画像を描画
            baseCanvas = document.createElement('canvas');
            baseCanvas.width = img.width;
            baseCanvas.height = img.height;
            const baseCtx = baseCanvas.getContext('2d');
            baseCtx.drawImage(img, 0, 0);

            // 既存のテキストをクリア
            textObjects = [];
            selectedTextIndex = -1;

            // キャンバスを再描画
            redrawCanvas();

            imageLoaded = true;

            // ドロップヒントを非表示
            dropHint.classList.add('hidden');

            showNotification('画像を読み込みました！', 'success');

            // 履歴に保存
            saveHistory();
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
        ctx.font = `${textObj.fontSize}px ${textObj.fontFamily || 'Arial'}`;
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

    // メインキャンバスに描画
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

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

function stopDrawing() {
    const wasDrawing = isDrawing;
    const wasDragging = isDraggingText;

    isDrawing = false;
    isDraggingText = false;

    // 描画またはドラッグが完了したら履歴に保存
    if (wasDrawing || wasDragging) {
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
                fontFamily: currentFontFamily
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
                fontFamily: currentFontFamily
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
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('↩️ Ctrl+Z で元に戻す、Ctrl+Y / Ctrl+Shift+Z でやり直し');
showNotification('画像エディターへようこそ！', 'info');
