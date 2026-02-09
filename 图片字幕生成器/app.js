const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const subtitleHeight = document.getElementById('subtitleHeight');
const fontSize = document.getElementById('fontSize');
const fontColorPicker = document.getElementById('fontColorPicker');
const fontColorHex = document.getElementById('fontColorHex');
const strokeColorPicker = document.getElementById('strokeColorPicker');
const strokeColorHex = document.getElementById('strokeColorHex');
const fontFamily = document.getElementById('fontFamily');
const fontWeight = document.getElementById('fontWeight');
const captionText = document.getElementById('captionText');
const watermarkSize = document.getElementById('watermarkSize');
const watermarkPos = document.getElementById('watermarkPos');
const btnGenerate = document.getElementById('btnGenerate');
const btnSave = document.getElementById('btnSave');
const statusEl = document.getElementById('status');
const warningEl = document.getElementById('warning');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewWrap = document.getElementById('previewWrap');
const previewLink = document.getElementById('previewLink');

let img = null;
let generated = false;

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function toSegments(text, maxLen) {
  const lines = (text || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const segs = [];
  for (const line of lines) {
    if (line.length <= maxLen) segs.push(line);
    else {
      for (let i = 0; i < line.length; i += maxLen) {
        segs.push(line.slice(i, i + maxLen));
      }
    }
  }
  return segs.slice(0, 200);
}
function syncColorInputs(picker, hex) {
  picker.addEventListener('input', () => { hex.value = picker.value; renderPreview(); });
  hex.addEventListener('input', () => {
    const v = hex.value.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) picker.value = v;
    renderPreview();
  });
}
syncColorInputs(fontColorPicker, fontColorHex);
syncColorInputs(strokeColorPicker, strokeColorHex);

function setCanvasSize(w, h) {
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawMaskFull(x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
}
function fitFontSize(text, targetWidth, base, minSize, family, weight) {
  let fs = base;
  ctx.font = `${weight} ${fs}px ${family}`;
  let m = ctx.measureText(text);
  while (m.width > targetWidth && fs > minSize) {
    fs -= 1;
    ctx.font = `${weight} ${fs}px ${family}`;
    m = ctx.measureText(text);
  }
  return fs;
}
function renderPreview() {
  statusEl.textContent = '';
  warningEl.textContent = '';
  generated = false;
  if (!img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const container = previewWrap.getBoundingClientRect();
  const barH = clamp(parseInt(subtitleHeight.value || '80', 10), 24, 200);
  const segs = toSegments(captionText.value, 18);
  const finalHOriginal = img.naturalHeight + segs.length * barH;
  const scale = Math.min(container.width / img.naturalWidth, container.height / finalHOriginal, 1);
  const w = Math.round(img.naturalWidth * scale);
  const hScaled = Math.round(img.naturalHeight * scale);
  const barHScaled = Math.round(barH * scale);
  const finalHScaled = hScaled + segs.length * barHScaled;
  setCanvasSize(w, finalHScaled);
  ctx.clearRect(0, 0, w, finalHScaled);
  ctx.drawImage(img, 0, 0, w, hScaled);

  const padX = 24;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fontColorHex.value;
  ctx.strokeStyle = strokeColorHex.value;
  ctx.lineWidth = 2;
  ctx.font = `${fontWeight.value} ${parseInt(fontSize.value || '40',10)}px ${fontFamily.value}`;

  for (let i = 0; i < segs.length; i++) {
    const y = hScaled + i * barHScaled;
    ctx.drawImage(img, 0, img.naturalHeight - barH, img.naturalWidth, barH, 0, y, w, barHScaled);
    drawMaskFull(0, y, w, barHScaled);
    const targetW = w - padX * 2;
    const baseFs = Math.round(parseInt(fontSize.value || '40',10) * scale);
    const fs = fitFontSize(segs[i], targetW, baseFs, 12, fontFamily.value, fontWeight.value);
    ctx.font = `${fontWeight.value} ${fs}px ${fontFamily.value}`;
    const cy = y + barHScaled / 2;
    ctx.strokeText(segs[i], w / 2, cy);
    ctx.fillText(segs[i], w / 2, cy);
  }

  ctx.save();
  const wm = '@么么哒哒';
  const wms = clamp(parseInt(watermarkSize.value || '35',10), 16, 72);
  ctx.font = `700 ${wms}px ${fontFamily.value}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 2;
  const metrics = ctx.measureText(wm);
  const rectPadX = 12, rectPadY = 8;
  const rectW = Math.min(w - 24, Math.round(metrics.width + rectPadX * 2));
  const rectH = Math.round(wms + rectPadY * 2);
  let rectX = 12, rectY = 10;
  if (watermarkPos.value === 'top-right') rectX = w - rectW - 12;
  if (watermarkPos.value === 'top-center') rectX = Math.round((w - rectW) / 2);
  ctx.save();
  ctx.filter = 'blur(6px)';
  ctx.drawImage(canvas, rectX, rectY, rectW, rectH, rectX, rectY, rectW, rectH);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(rectX, rectY, rectW, rectH);
  ctx.textAlign = watermarkedAlign(w, rectX, rectW);
  const tx = watermarkPos.value === 'top-left' ? rectX + rectW / 2
    : watermarkPos.value === 'top-right' ? rectX + rectW / 2
    : rectX + rectW / 2;
  ctx.strokeText(wm, tx, rectY + rectPadY);
  ctx.fillText(wm, tx, rectY + rectPadY);
  ctx.restore();
  previewLink.href = window.location.origin + '/';
  previewLink.addEventListener('click', (e) => {
    previewLink.href = window.location.origin + '/';
  });
}
function watermarkedAlign(w, rectX, rectW) {
  const mid = rectX + rectW / 2;
  if (mid < w * 0.33) return 'center';
  if (mid > w * 0.66) return 'center';
  return 'center';
}
function renderFinal() {
  statusEl.textContent = '';
  warningEl.textContent = '';
  generated = false;
  if (!img) return;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const barH = clamp(parseInt(subtitleHeight.value || '80', 10), 24, 200);
  const segs = toSegments(captionText.value, 18);
  const finalH = h + segs.length * barH;
  setCanvasSize(w, finalH);
  ctx.clearRect(0, 0, w, finalH);
  ctx.drawImage(img, 0, 0, w, h);

  const padX = 24;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fontColorHex.value;
  ctx.strokeStyle = strokeColorHex.value;
  ctx.lineWidth = 2;
  ctx.font = `${fontWeight.value} ${parseInt(fontSize.value || '40',10)}px ${fontFamily.value}`;

  for (let i = 0; i < segs.length; i++) {
    const y = h + i * barH;
    ctx.drawImage(img, 0, h - barH, w, barH, 0, y, w, barH);
    drawMaskFull(0, y, w, barH);
    const targetW = w - padX * 2;
    const baseFs = parseInt(fontSize.value || '40',10);
    const fs = fitFontSize(segs[i], targetW, baseFs, 16, fontFamily.value, fontWeight.value);
    ctx.font = `${fontWeight.value} ${fs}px ${fontFamily.value}`;
    const cy = y + barH / 2;
    ctx.strokeText(segs[i], w / 2, cy);
    ctx.fillText(segs[i], w / 2, cy);
  }

  ctx.save();
  const wm = '@么么哒哒';
  const wms = clamp(parseInt(watermarkSize.value || '35',10), 16, 72);
  ctx.font = `700 ${wms}px ${fontFamily.value}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 2;
  const metrics = ctx.measureText(wm);
  const rectPadX = 12, rectPadY = 8;
  const rectW = Math.min(w - 24, Math.round(metrics.width + rectPadX * 2));
  const rectH = Math.round(wms + rectPadY * 2);
  let rectX = 12, rectY = 10;
  if (watermarkPos.value === 'top-right') rectX = w - rectW - 12;
  if (watermarkPos.value === 'top-center') rectX = Math.round((w - rectW) / 2);
  ctx.save();
  ctx.filter = 'blur(6px)';
  ctx.drawImage(canvas, rectX, rectY, rectW, rectH, rectX, rectY, rectW, rectH);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(rectX, rectY, rectW, rectH);
  ctx.textAlign = 'center';
  ctx.strokeText(wm, rectX + rectW / 2, rectY + rectPadY);
  ctx.fillText(wm, rectX + rectW / 2, rectY + rectPadY);
  ctx.restore();

  generated = true;
  statusEl.textContent = '字幕图片生成成功！';
  previewLink.href = window.location.origin + '/';
}
function saveImage() {
  if (!generated) renderFinal();
  canvas.toBlob(blob => {
    if (!blob) return;
    const name = fileName.textContent ? fileName.textContent.replace(/\.[^.]+$/, '') : 'image';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_caption.png`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 'image/png');
}
fileInput.addEventListener('change', () => {
  warningEl.textContent = '';
  statusEl.textContent = '';
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;
  fileName.textContent = f.name;
  const url = URL.createObjectURL(f);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    img = image;
    renderPreview();
  };
  image.src = url;
});
subtitleHeight.addEventListener('input', renderPreview);
fontSize.addEventListener('input', renderPreview);
fontFamily.addEventListener('change', renderPreview);
fontWeight.addEventListener('change', renderPreview);
watermarkSize.addEventListener('input', renderPreview);
watermarkPos.addEventListener('change', renderPreview);
captionText.addEventListener('input', renderPreview);
btnGenerate.addEventListener('click', renderFinal);
btnSave.addEventListener('click', saveImage);
