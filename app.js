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

// 履歴管理（Undo/Redo）
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

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
const dialogFontSize = document.getElementById('dialogFontSize');
const dialogColor = document.getElementById('dialogColor');

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

            // 履歴をリセットして初期状態を保存
            historyStack = [];
            historyIndex = -1;
            saveHistory();

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
        dialogFontSize.value = textObj.fontSize;
        dialogColor.value = textObj.color;

        // ツールバーのUIも更新
        fontSize = textObj.fontSize;
        currentColor = textObj.color;
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
    // ブラシ/消しゴムで描画した場合、baseImageを更新
    if (isDrawing && (currentTool === 'brush' || currentTool === 'eraser') && imageLoaded) {
        updateBaseImage();
    }

    // テキストを移動した場合、履歴を保存
    if (isDraggingText && imageLoaded) {
        saveHistory();
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

// 履歴管理: 現在の状態を保存
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

// 履歴から状態を復元
function restoreHistory(state) {
    if (!state) return;

    // キャンバスサイズを復元
    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    // ベース画像を復元
    if (state.baseImageData) {
        const img = new Image();
        img.onload = () => {
            baseImage = img;
            // テキストオブジェクトを復元
            textObjects = JSON.parse(JSON.stringify(state.textObjects));
            selectedTextIndex = -1;
            // キャンバスを再描画
            redrawCanvas();
        };
        img.src = state.baseImageData;
    } else {
        baseImage = null;
        textObjects = JSON.parse(JSON.stringify(state.textObjects));
        selectedTextIndex = -1;
        redrawCanvas();
    }
}

// 元に戻す（Undo）
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistory(historyStack[historyIndex]);
        showNotification('元に戻しました', 'info');
    } else {
        showNotification('これ以上元に戻せません', 'info');
    }
}

// やり直し（Redo）
function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreHistory(historyStack[historyIndex]);
        showNotification('やり直しました', 'info');
    } else {
        showNotification('これ以上やり直せません', 'info');
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

    // ダイアログを表示し、現在のフォントサイズと色を設定
    textInputDialog.classList.add('show');
    textInput.value = '';
    dialogFontSize.value = fontSize;
    dialogColor.value = currentColor;
    textInput.focus();
}

// テキスト入力のOKボタン
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

        // 履歴もリセット
        historyStack = [];
        historyIndex = -1;

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
        saveHistory();
        showNotification('テキストを削除しました', 'success');
    }

    // Ctrl+Z で元に戻す（Undo）
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl+Y または Ctrl+Shift+Z でやり直し（Redo）
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }
});

console.log('🎨 画像エディターが読み込まれました！');
console.log('📋 Ctrl+V で画像を貼り付けることができます');
console.log('🖱️ 画像をドラッグ&ドロップすることもできます');
console.log('✏️ テキストツール: クリックで追加、ダブルクリックで編集、Deleteキーで削除');
console.log('⏮️ Ctrl+Z で元に戻す、Ctrl+Y でやり直し（最大50回まで履歴保存）');
console.log('💾 Ctrl+S で画像を保存');
showNotification('画像エディターへようこそ！', 'info');
