/**
 * CaptionCraft v2 - 图片字幕生成器
 * Fully functional implementation
 */

// ==========================================
// State Management
// ==========================================
const state = {
    image: null,
    imageFile: null,
    settings: {
        barHeight: 80,
        fontSize: 40,
        fontColor: '#ffffff',
        strokeColor: '#000000',
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontWeight: '400',
        bgColor: '#000000',
        bgAlpha: 60,
        lineGap: 8,
        borderRadius: 8,
        barBorderWidth: 2,
        barBorderColor: '#ffffff',
        watermarkText: '么么哒哒',
        watermarkPosition: 'top-center',
        watermarkStyle: 'glass',
        watermarkSize: 24,
        watermarkAlpha: 70
    },
    captions: [],
    isGenerated: false
};

// ==========================================
// DOM Elements
// ==========================================
const elements = {
    // Upload
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    replaceFile: document.getElementById('replaceFile'),

    // Settings
    barHeight: document.getElementById('barHeight'),
    barHeightValue: document.getElementById('barHeightValue'),
    fontSize: document.getElementById('fontSize'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    fontColor: document.getElementById('fontColor'),
    strokeColor: document.getElementById('strokeColor'),
    fontFamily: document.getElementById('fontFamily'),
    fontWeight: document.getElementById('fontWeight'),
    bgColor: document.getElementById('bgColor'),
    bgAlpha: document.getElementById('bgAlpha'),
    bgAlphaValue: document.getElementById('bgAlphaValue'),
    lineGap: document.getElementById('lineGap'),
    lineGapValue: document.getElementById('lineGapValue'),
    borderRadius: document.getElementById('borderRadius'),
    borderRadiusValue: document.getElementById('borderRadiusValue'),
    barBorderWidth: document.getElementById('barBorderWidth'),
    barBorderValue: document.getElementById('barBorderValue'),
    barBorderColor: document.getElementById('barBorderColor'),

    // Watermark
    watermarkText: document.getElementById('watermarkText'),
    watermarkPosition: document.getElementById('watermarkPosition'),
    watermarkStyle: document.getElementById('watermarkStyle'),
    watermarkSize: document.getElementById('watermarkSize'),
    watermarkSizeValue: document.getElementById('watermarkSizeValue'),
    watermarkAlpha: document.getElementById('watermarkAlpha'),
    watermarkAlphaValue: document.getElementById('watermarkAlphaValue'),

    // Text
    captionText: document.getElementById('captionText'),
    lineCount: document.getElementById('lineCount'),

    // Preview
    previewContainer: document.getElementById('previewContainer'),
    placeholder: document.getElementById('placeholder'),
    previewCanvas: document.getElementById('previewCanvas'),
    dimensions: document.getElementById('dimensions'),
    warning: document.getElementById('warning'),
    warningText: document.getElementById('warningText'),

    // Actions
    generateBtn: document.getElementById('generateBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    status: document.getElementById('status'),

    // Export
    exportCanvas: document.getElementById('exportCanvas')
};

// ==========================================
// Utility Functions
// ==========================================
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showStatus(message, type = 'success') {
    elements.status.textContent = message;
    elements.status.className = 'status ' + type;
    setTimeout(() => {
        elements.status.className = 'status';
    }, 3000);
}

function parseCaptions(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 50);
}

// ==========================================
// Image Upload
// ==========================================
function handleFile(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        showStatus('请上传 JPG、PNG 或 WebP 格式的图片', 'error');
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showStatus('图片大小不能超过 20MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.image = img;
            state.imageFile = file;
            state.isGenerated = false;

            // Update UI
            elements.fileName.textContent = `${file.name} (${formatBytes(file.size)})`;
            elements.fileInfo.style.display = 'flex';
            elements.uploadZone.style.display = 'none';
            elements.placeholder.style.display = 'none';
            elements.previewCanvas.style.display = 'block';
            elements.dimensions.textContent = `${img.width} x ${img.height}`;

            // Enable buttons
            elements.generateBtn.disabled = false;

            // Initial render
            renderPreview();
            showStatus('图片上传成功');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetFile() {
    state.image = null;
    state.imageFile = null;
    state.isGenerated = false;

    elements.fileInput.value = '';
    elements.fileInfo.style.display = 'none';
    elements.uploadZone.style.display = 'block';
    elements.placeholder.style.display = 'block';
    elements.previewCanvas.style.display = 'none';
    elements.dimensions.textContent = '-- x --';
    elements.warning.style.display = 'none';

    elements.downloadBtn.disabled = true;
}

// Upload event listeners
elements.uploadZone.addEventListener('click', () => {
    elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

elements.replaceFile.addEventListener('click', () => {
    resetFile();
    elements.fileInput.click();
});

// Drag and drop
elements.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.add('dragover');
});

elements.uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragover');
});

elements.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// ==========================================
// Settings Handlers
// ==========================================
function updateSetting(key, value) {
    state.settings[key] = value;

    // Update display values
    const displayMap = {
        barHeight: elements.barHeightValue,
        fontSize: elements.fontSizeValue,
        lineGap: elements.lineGapValue,
        borderRadius: elements.borderRadiusValue
    };

    if (displayMap[key]) {
        displayMap[key].textContent = value + 'px';
    }

    if (key === 'bgAlpha') {
        elements.bgAlphaValue.textContent = value + '%';
    }

    // Re-render if image exists
    if (state.image) {
        renderPreview();
    }
}

// Slider inputs
elements.barHeight.addEventListener('input', (e) => updateSetting('barHeight', parseInt(e.target.value)));
elements.fontSize.addEventListener('input', (e) => updateSetting('fontSize', parseInt(e.target.value)));
elements.lineGap.addEventListener('input', (e) => updateSetting('lineGap', parseInt(e.target.value)));
elements.borderRadius.addEventListener('input', (e) => updateSetting('borderRadius', parseInt(e.target.value)));
elements.bgAlpha.addEventListener('input', (e) => updateSetting('bgAlpha', parseInt(e.target.value)));

// Color inputs
elements.fontColor.addEventListener('input', (e) => {
    updateSetting('fontColor', e.target.value);
    e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
});

elements.strokeColor.addEventListener('input', (e) => {
    updateSetting('strokeColor', e.target.value);
    e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
});

elements.bgColor.addEventListener('input', (e) => {
    updateSetting('bgColor', e.target.value);
    e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
});

// Select inputs
elements.fontFamily.addEventListener('change', (e) => {
    updateSetting('fontFamily', e.target.value);
});

elements.fontWeight.addEventListener('change', (e) => {
    updateSetting('fontWeight', e.target.value);
});

// Bar border
elements.barBorderWidth.addEventListener('input', (e) => {
    updateSetting('barBorderWidth', parseInt(e.target.value));
    e.target.nextElementSibling.textContent = e.target.value + 'px';
});

elements.barBorderColor.addEventListener('input', (e) => {
    updateSetting('barBorderColor', e.target.value);
    e.target.nextElementSibling.textContent = e.target.value.toUpperCase();
});

// Watermark
elements.watermarkText.addEventListener('input', (e) => {
    updateSetting('watermarkText', e.target.value);
});

elements.watermarkPosition.addEventListener('change', (e) => {
    updateSetting('watermarkPosition', e.target.value);
});

elements.watermarkStyle.addEventListener('change', (e) => {
    updateSetting('watermarkStyle', e.target.value);
});

elements.watermarkSize.addEventListener('input', (e) => {
    updateSetting('watermarkSize', parseInt(e.target.value));
    elements.watermarkSizeValue.textContent = e.target.value + 'px';
});

elements.watermarkAlpha.addEventListener('input', (e) => {
    updateSetting('watermarkAlpha', parseInt(e.target.value));
    elements.watermarkAlphaValue.textContent = e.target.value + '%';
});

// ==========================================
// Text Input
// ==========================================
elements.captionText.addEventListener('input', (e) => {
    state.captions = parseCaptions(e.target.value);
    elements.lineCount.textContent = `${state.captions.length} / 50 行`;

    if (state.image) {
        renderPreview();
    }
});

// ==========================================
// Canvas Rendering
// ==========================================
function renderPreview() {
    if (!state.image) return;

    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');
    const img = state.image;
    const s = state.settings;

    // Calculate captions area height
    const captionsHeight = state.captions.length > 0
        ? state.captions.length * s.barHeight + (state.captions.length - 1) * s.lineGap
        : 0;

    // Set canvas size to match image + captions area (captions below image)
    canvas.width = img.width;
    canvas.height = img.height + captionsHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image at top
    ctx.drawImage(img, 0, 0);

    // Draw watermark on image
    drawWatermark(ctx, img.width, img.height);

    // Draw captions below image
    if (state.captions.length > 0) {
        drawCaptions(ctx, img.width, img.height, captionsHeight);
    }
}

function drawWatermark(ctx, width, height) {
    const s = state.settings;
    const watermarkText = s.watermarkText || '么么哒哒';
    const fontSize = s.watermarkSize;

    // Calculate position
    let x, y;
    const padding = 20;

    switch (s.watermarkPosition) {
        case 'top-left':
            x = padding;
            y = padding;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            break;
        case 'top-right':
            x = width - padding;
            y = padding;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            break;
        case 'top-center':
            x = width / 2;
            y = padding;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            break;
        case 'bottom-left':
            x = padding;
            y = height - padding;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            break;
        case 'bottom-right':
            x = width - padding;
            y = height - padding;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            break;
        case 'bottom-center':
            x = width / 2;
            y = height - padding;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            break;
        case 'center':
            x = width / 2;
            y = height / 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            break;
        default:
            x = width / 2;
            y = padding;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
    }

    ctx.font = `500 ${fontSize}px "Microsoft YaHei", sans-serif`;

    // Measure text for background
    const metrics = ctx.measureText(watermarkText);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    const bgPadding = 8;
    const bgX = x - (ctx.textAlign === 'center' ? textWidth / 2 : ctx.textAlign === 'right' ? textWidth : 0) - bgPadding;
    const bgY = y - (ctx.textBaseline === 'middle' ? textHeight / 2 : ctx.textBaseline === 'bottom' ? textHeight : 0) - bgPadding;
    const bgWidth = textWidth + bgPadding * 2;
    const bgHeight = textHeight + bgPadding * 2;

    // Draw based on style
    switch (s.watermarkStyle) {
        case 'glass':
            // Glassmorphism effect
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${s.watermarkAlpha / 100 * 0.15})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.watermarkAlpha / 100 * 0.3})`;
            ctx.lineWidth = 1;
            roundRect(ctx, bgX, bgY, bgWidth, bgHeight, 6);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Text with glow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.watermarkAlpha / 100})`;
            ctx.fillText(watermarkText, x, y);
            ctx.restore();
            break;

        case 'solid':
            // Solid background
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${s.watermarkAlpha / 100})`;
            roundRect(ctx, bgX, bgY, bgWidth, bgHeight, 4);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(watermarkText, x, y);
            break;

        case 'outline':
            // Outline style
            ctx.strokeStyle = s.strokeColor;
            ctx.lineWidth = 2;
            ctx.strokeText(watermarkText, x, y);

            ctx.fillStyle = `rgba(255, 255, 255, ${s.watermarkAlpha / 100})`;
            ctx.fillText(watermarkText, x, y);
            break;

        case 'shadow':
            // Shadow style
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.watermarkAlpha / 100})`;
            ctx.fillText(watermarkText, x, y);
            ctx.restore();
            break;
    }
}

function drawCaptions(ctx, imgWidth, imgHeight, captionsHeight) {
    const s = state.settings;
    const captions = state.captions;

    // Start position from image bottom (captions are below image)
    let currentY = imgHeight;

    // Set font
    ctx.font = `${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    captions.forEach((text, index) => {
        // Draw background bar
        const bgColor = hexToRgba(s.bgColor, s.bgAlpha);
        ctx.fillStyle = bgColor;

        if (s.borderRadius > 0) {
            roundRect(ctx, 0, currentY, imgWidth, s.barHeight, s.borderRadius);
            ctx.fill();
        } else {
            ctx.fillRect(0, currentY, imgWidth, s.barHeight);
        }

        // Draw border if width > 0
        if (s.barBorderWidth > 0) {
            ctx.strokeStyle = s.barBorderColor;
            ctx.lineWidth = s.barBorderWidth;
            if (s.borderRadius > 0) {
                roundRect(ctx, s.barBorderWidth / 2, currentY + s.barBorderWidth / 2,
                    imgWidth - s.barBorderWidth, s.barHeight - s.barBorderWidth,
                    Math.max(0, s.borderRadius - s.barBorderWidth / 2));
                ctx.stroke();
            } else {
                ctx.strokeRect(s.barBorderWidth / 2, currentY + s.barBorderWidth / 2,
                    imgWidth - s.barBorderWidth, s.barHeight - s.barBorderWidth);
            }
        }

        // Calculate text position
        const textX = imgWidth / 2;
        const textY = currentY + s.barHeight / 2;

        // Draw text stroke
        ctx.strokeStyle = s.strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeText(text, textX, textY);

        // Draw text fill
        ctx.fillStyle = s.fontColor;
        ctx.fillText(text, textX, textY);

        // Move to next line
        currentY += s.barHeight + s.lineGap;
    });
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function checkOverflow(canvasHeight) {
    const s = state.settings;
    const captions = state.captions;

    const totalBarsHeight = captions.length * s.barHeight;
    const totalGapHeight = (captions.length - 1) * s.lineGap;
    const captionsTotalHeight = totalBarsHeight + totalGapHeight;

    if (captionsTotalHeight > canvasHeight) {
        elements.warning.style.display = 'flex';
        elements.warningText.textContent = `字幕区域超出图片高度 (${captionsTotalHeight}px > ${canvasHeight}px)`;
    } else {
        elements.warning.style.display = 'none';
    }
}

// ==========================================
// Generate & Download
// ==========================================
elements.generateBtn.addEventListener('click', () => {
    if (!state.image) {
        showStatus('请先上传图片', 'error');
        return;
    }

    if (state.captions.length === 0) {
        showStatus('请输入字幕内容', 'error');
        return;
    }

    renderPreview();
    state.isGenerated = true;
    elements.downloadBtn.disabled = false;
    showStatus('字幕图片生成成功！');
});

elements.downloadBtn.addEventListener('click', () => {
    if (!state.isGenerated || !state.image) return;

    const canvas = elements.previewCanvas;
    const link = document.createElement('a');

    // Generate filename
    const originalName = state.imageFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const newFilename = `${nameWithoutExt}_caption.png`;

    link.download = newFilename;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showStatus('图片已开始下载');
});

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set initial values
    elements.barHeightValue.textContent = state.settings.barHeight + 'px';
    elements.fontSizeValue.textContent = state.settings.fontSize + 'px';
    elements.lineGapValue.textContent = state.settings.lineGap + 'px';
    elements.borderRadiusValue.textContent = state.settings.borderRadius + 'px';
    elements.bgAlphaValue.textContent = state.settings.bgAlpha + '%';
    elements.barBorderValue.textContent = state.settings.barBorderWidth + 'px';
    elements.watermarkSizeValue.textContent = state.settings.watermarkSize + 'px';
    elements.watermarkAlphaValue.textContent = state.settings.watermarkAlpha + '%';

    // Disable download initially
    elements.downloadBtn.disabled = true;

    console.log('%c CaptionCraft v2 ', 'background: #d4a574; color: #0d0c0b; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 8px;');
    console.log('%c 已就绪 ', 'color: #a8a39a; font-size: 12px;');
});
