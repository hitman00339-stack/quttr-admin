'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CELEBRITIES as IMPORTED_CELEBS } from '@/lib/celebrities';

// ============ GITA & MOTIVATION (HINDI) ============
const NEW_CATEGORIES = [
  {
    id: 'gita',
    name: 'भगवद् गीता',
    styleName: 'गीता उपदेश',
    category: 'Gita Updesh',
    themeColor: '#f97316',
    bgGradient: ['#431407', '#7c2d12'],
    dialogues: [
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
      'जो हुआ, वह अच्छा हुआ। जो हो रहा है, वह अच्छा हो रहा है।',
      'परिवर्तन ही संसार का नियम है।',
      'आत्मा न कभी जन्म लेती है और न कभी मरती है।',
      'मन अशांत है, लेकिन अभ्यास और वैराग्य से इसे वश में किया जा सकता है।',
      'खाली हाथ आए थे, खाली हाथ जाओगे।',
      'क्रोध से भ्रम पैदा होता है, और भ्रम से बुद्धि नष्ट होती है।',
      'मनुष्य अपने विश्वास से निर्मित होता है।',
      'न कोई मरता है, न कोई मारता है, सब निमित्त मात्र हैं।',
      'सन्देह करने वाले के लिए न इस लोक में सुख है, न परलोक में।',
      'जो मन को नियंत्रित नहीं करते, उनके लिए मन शत्रु के समान है।',
      'सुख-दुख, लाभ-हानि, जय-पराजय को समान समझो।',
      'डरने की कोई बात नहीं, सत्य कभी नष्ट नहीं होता।',
      'श्रेष्ठ पुरुष जो आचरण करते हैं, सामान्य मनुष्य उसी का अनुसरण करते हैं।',
      'अपने अनिवार्य कर्तव्य का पालन करो, अकर्म से कर्म बेहतर है।',
      'जन्म लेने वाले की मृत्यु निश्चित है और मरने वाले का जन्म निश्चित है।',
      'तुम क्या लाए थे जो तुमने खो दिया? क्या गया जो तुम रोते हो?',
      'मैं सभी प्राणियों के हृदय में स्थित हूँ।',
      'अहंकार, क्रोध और लालच — ये नरक के तीन द्वार हैं।',
      'योग: कर्मसु कौशलम् — काम में कुशलता ही योग है।',
      'समत्वं योग उच्यते — समभाव ही योग है।',
      'उद्धरेदात्मनात्मानं — अपने आप को स्वयं उठाओ।',
      'श्रद्धावान् लभते ज्ञानम् — श्रद्धावान को ज्ञान मिलता है।',
      'न हि कल्याणकृत् कश्चित् दुर्गतिं तात गच्छति।',
      'असंशयं महाबाहो मनो दुर्निग्रहं चलम्।',
    ],
  },
  {
    id: 'motivation',
    name: 'सक्सेस माइंडसेट',
    styleName: 'प्रेरक विचार',
    category: 'Motivation',
    themeColor: '#0ea5e9',
    bgGradient: ['#082f49', '#0369a1'],
    dialogues: [
      'मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है।',
      'संघर्ष में आदमी अकेला होता है, सफलता में दुनिया उसके साथ होती है।',
      'हार हो जाती है जब मान लिया जाता है, जीत तब होती है जब ठान लिया जाता है।',
      'अगर मेहनत आदत बन जाए, तो कामयाबी मुकद्दर बन जाती है।',
      'जिंदगी में रिस्क लेने से कभी मत डरो — या तो जीत मिलेगी या सीख।',
      'पानी में गिरने से जान नहीं जाती, जान तब जाती है जब तैरना नहीं आता।',
      'आज रास्ता बना लिया है, तो कल मंजिल भी मिल जाएगी।',
      'बुरा वक्त एक ऐसी तिजोरी है, जहां से सफलता के हथियार मिलते हैं।',
      'मैदान में हारा इंसान जीत सकता है, मन से हारा कभी नहीं।',
      'जो उड़ने का शौक रखते हैं, वो गिरने का खौफ नहीं रखते।',
      'ख्वाहिशें भले छोटी हों, उन्हें पूरा करने की जिद होनी चाहिए।',
      'जब लोग आपका साथ छोड़ दें, समझ लेना आप सही रास्ते पर हैं।',
      'अकेले चलने का साहस रखो, कामयाबी एक दिन तुम्हारे कदम चूमेगी।',
      'तैरना सीखना है तो पानी में उतरना ही होगा।',
      'भीड़ आसान रास्ते पर चलती है — अपना रास्ता खुद चुनो।',
      'इंतजार करने वालों को उतना ही मिलता है, जितना कोशिश करने वाले छोड़ देते हैं।',
      'अपने सपनों को जिंदा रखो।',
      'थककर मत बैठो, मंजिल और करीब आ चुकी है।',
      'छोटी-छोटी रोज़ की मेहनत बड़े नतीजे लाती है।',
      'डर के आगे जीत है।',
      'आज की मेहनत कल की पहचान है।',
      'सपने वो नहीं जो नींद में आएं, सपने वो हैं जो नींद न आने दें।',
      'हिम्मत रखो, मुश्किलें हार जाती हैं।',
      'जो बोया है वही काटोगे — मेहनत बोओ, सफलता काटो।',
      'रुको मत, रुकोगे तो मिट जाओगे।',
    ],
  },
];

const ALL_CELEBS = [...NEW_CATEGORIES, ...IMPORTED_CELEBS];

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(NEW_CATEGORIES[0]); // Gita first
  const [activeDialogue, setActiveDialogue] = useState('');
  const [activeTab, setActiveTab] = useState('Gita Updesh');
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImage, setLogoImage] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('700 60px Caveat'),
          document.fonts.load('700 40px Kalam'),
          document.fonts.load('900 80px "Bebas Neue"'),
          document.fonts.load('40px "Playfair Display"'),
        ]);
      } catch (e) {}
      setFontsReady(true);
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const paths = ['/quttr-logo.png', '/quttr-business-logo.png', '/logo.png'];
    let cancelled = false;
    let index = 0;
    const tryNext = () => {
      if (cancelled || index >= paths.length) return;
      const path = paths[index++];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!cancelled && img.width > 0) setLogoImage(img);
        else tryNext();
      };
      img.onerror = () => tryNext();
      img.src = path + '?v=2';
    };
    tryNext();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCeleb]);

  const pickRandomDialogue = (celeb) => {
    if (!celeb?.dialogues?.length) return;
    const len = celeb.dialogues.length;
    let i = Math.floor(Math.random() * len);
    if (len > 1 && celeb.dialogues[i] === activeDialogue) i = (i + 1) % len;
    setActiveDialogue(celeb.dialogues[i]);
  };

  const selectQuickCategory = (catId) => {
    const item = NEW_CATEGORIES.find((c) => c.id === catId);
    if (!item) return;
    setActiveTab(item.category);
    setSelectedCeleb(item);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera blocked. Please upload a photo.');
      setCameraActive(false);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth || 1280;
    c.height = video.videoHeight || 720;
    c.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = c.toDataURL('image/png');
    video.srcObject?.getTracks()?.forEach((t) => t.stop());
    setCameraActive(false);
    setSelectedImage(dataUrl);
  };

  const enhanceImage = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i],
        g = d[i + 1],
        b = d[i + 2];
      r = r < 128 ? r * 0.92 : Math.min(255, r * 1.08 + 5);
      g = g < 128 ? g * 0.94 : Math.min(255, g * 1.06 + 3);
      b = b < 128 ? b * 0.96 : Math.min(255, b * 1.04);
      if (r > 150) r = Math.min(255, r + 8);
      if (b < 100) b = Math.max(0, b - 5);
      const br = (r + g + b) / 3;
      if (br > 80 && br < 200) {
        r = r * 0.95 + br * 0.05;
        g = g * 0.95 + br * 0.05;
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const applySharpen = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let sum = 0,
            k = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              sum += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[k++];
            }
          }
          d[i + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  /** Returns lines for quote layout (does not draw) */
  const wrapLines = (ctx, text, maxW) => {
    const words = String(text || '').split(' ');
    const lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxW && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else line = test;
    }
    if (line.trim()) lines.push(line.trim());
    return lines.length ? lines : [''];
  };

  const drawLogoTopRight = (ctx) => {
    const pad = 40;
    if (!logoImage || !logoImage.width) return;
    const maxW = 170,
      maxH = 85;
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
    const drawW = logoImage.width * scale;
    const drawH = logoImage.height * scale;
    const logoX = 1080 - drawW - pad;
    const logoY = pad;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(logoX - 12, logoY - 10, drawW + 24, drawH + 20, 14);
      ctx.fill();
    } else ctx.fillRect(logoX - 12, logoY - 10, drawW + 24, drawH + 20);
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 14;
    ctx.drawImage(logoImage, logoX, logoY, drawW, drawH);
    ctx.restore();
  };

  /** Realistic Google Play badge */
  const drawGooglePlayBadge = (ctx, cx, cy) => {
    const w = 420;
    const h = 88;
    const x = cx - w / 2;
    const y = cy;

    // Outer black pill (official-style)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#2a2a2a');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 14);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    // Thin light border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Multicolor Play triangle (approx Google colors)
    const px = x + 28;
    const py = y + h / 2;
    // green / blue / yellow / red segments simplified as one triangle with gradient
    const triGrad = ctx.createLinearGradient(px, py - 22, px + 42, py + 22);
    triGrad.addColorStop(0, '#00F076');
    triGrad.addColorStop(0.35, '#00D0FF');
    triGrad.addColorStop(0.65, '#FFD400');
    triGrad.addColorStop(1, '#FF3A44');
    ctx.fillStyle = triGrad;
    ctx.beginPath();
    ctx.moveTo(px, py - 24);
    ctx.lineTo(px, py + 24);
    ctx.lineTo(px + 42, py);
    ctx.closePath();
    ctx.fill();

    // White inner highlight on triangle
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(px + 4, py - 14);
    ctx.lineTo(px + 4, py + 8);
    ctx.lineTo(px + 28, py - 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('GET IT ON', px + 58, y + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText('Google Play', px + 58, y + 64);

    ctx.restore();
  };

  const generateCard = async () => {
    if (!selectedImage || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Creating your poster... 🎬');
    try {
      await document.fonts.ready;
    } catch (e) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#000');
      grad.addColorStop(0.3, selectedCeleb.bgGradient[0]);
      grad.addColorStop(0.7, selectedCeleb.bgGradient[1]);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      const spot = ctx.createRadialGradient(540, 400, 100, 540, 600, 900);
      spot.addColorStop(0, selectedCeleb.themeColor + '55');
      spot.addColorStop(0.5, selectedCeleb.themeColor + '22');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, 1080, 1920);

      // Face
      const cropSrcH = Math.min(img.height, img.height * 0.85);
      const work = document.createElement('canvas');
      work.width = 800;
      work.height = 1000;
      const wctx = work.getContext('2d');
      wctx.imageSmoothingEnabled = true;
      wctx.imageSmoothingQuality = 'high';
      const srcRatio = img.width / cropSrcH;
      const dstRatio = 0.8;
      let sx, sy, sw, sh;
      if (srcRatio > dstRatio) {
        sh = cropSrcH;
        sw = cropSrcH * dstRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / dstRatio;
        sx = 0;
        sy = 0;
      }
      wctx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 1000);
      enhanceImage(wctx, 800, 1000);
      applySharpen(wctx, 800, 1000);

      const faceY = 170,
        faceH = 920,
        faceW = 820,
        faceX = (1080 - faceW) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 50;
      ctx.fillStyle = '#000';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(faceX, faceY, faceW, faceH, 18);
        ctx.fill();
      } else ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18);
      else ctx.rect(faceX, faceY, faceW, faceH);
      ctx.clip();
      ctx.drawImage(work, faceX, faceY, faceW, faceH);
      ctx.globalCompositeOperation = 'multiply';
      const duo = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
      duo.addColorStop(0, '#fff');
      duo.addColorStop(1, selectedCeleb.themeColor);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = duo;
      ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const fade = ctx.createLinearGradient(0, faceY + faceH - 260, 0, faceY + faceH);
      fade.addColorStop(0, 'transparent');
      fade.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = fade;
      ctx.fillRect(faceX, faceY + faceH - 260, faceW, 260);
      ctx.restore();

      // Gold frame
      const gold = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
      gold.addColorStop(0, '#FFD700');
      gold.addColorStop(0.5, '#FFA500');
      gold.addColorStop(1, '#B8860B');
      ctx.strokeStyle = gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18);
      else ctx.rect(faceX, faceY, faceW, faceH);
      ctx.stroke();

      // Top brand
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('Quttr Style', 48, 78);
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText(selectedCeleb.category.toUpperCase(), 48, 106);
      drawLogoTopRight(ctx);

      // ========== QUOTE BLOCK WITH CORRECT "" ==========
      const quoteMaxW = 780;
      const quoteStartY = 1280;
      ctx.font = '700 40px "Caveat", "Noto Sans Devanagari", system-ui, sans-serif';
      const lines = wrapLines(ctx, activeDialogue, quoteMaxW);
      const lh = 54;
      const blockH = lines.length * lh;
      const textTop = quoteStartY;
      const textBottom = textTop + (lines.length - 1) * lh;

      // Soft plate behind quote for readability
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(90, textTop - 70, 900, blockH + 130, 20);
        ctx.fill();
      } else ctx.fillRect(90, textTop - 70, 900, blockH + 130);

      // Opening “  — top-left of quote block
      ctx.textAlign = 'left';
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.globalAlpha = 0.9;
      ctx.font = '700 92px "Playfair Display", Georgia, serif';
      ctx.fillText('\u201C', 110, textTop - 8); // “
      ctx.globalAlpha = 1;

      // Quote lines (centered)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFF8E7';
      ctx.font = '700 40px "Caveat", "Noto Sans Devanagari", system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 8;
      lines.forEach((ln, idx) => {
        ctx.fillText(ln, 540, textTop + idx * lh);
      });
      ctx.shadowBlur = 0;

      // Closing ” — bottom-right after last line
      ctx.textAlign = 'right';
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.globalAlpha = 0.9;
      ctx.font = '700 92px "Playfair Display", Georgia, serif';
      ctx.fillText('\u201D', 970, textBottom + 48); // ”
      ctx.globalAlpha = 1;

      // Author
      ctx.textAlign = 'center';
      const authorY = textBottom + 78;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'italic 600 26px "Playfair Display", serif';
      ctx.fillText('— ' + selectedCeleb.name, 540, authorY);

      // Gold thin line
      const lineY = authorY + 28;
      const dg = ctx.createLinearGradient(260, 0, 820, 0);
      dg.addColorStop(0, 'transparent');
      dg.addColorStop(0.5, '#FFD700');
      dg.addColorStop(1, 'transparent');
      ctx.fillStyle = dg;
      ctx.fillRect(260, lineY, 560, 1);

      // Google Play badge (real aesthetic)
      const badgeY = Math.min(lineY + 36, 1720);
      drawGooglePlayBadge(ctx, 540, badgeY);

      // App row under badge
      const appY = badgeY + 110;
      if (logoImage && logoImage.width) {
        const s = 36;
        const ratio = logoImage.height / logoImage.width;
        ctx.drawImage(logoImage, 540 - 100, appY - 8, s, s * ratio);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '800 26px "Bebas Neue", Impact, sans-serif';
      ctx.fillText('QUTTR APP', 540 - 50, appY + 22);

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '500 18px system-ui, sans-serif';
      ctx.fillText('Barber booking  ·  quttr.com', 540, appY + 52);

      setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
    };
    img.onerror = () => {
      setIsProcessing(false);
      alert('Photo load failed. Try another image.');
    };
    img.src = selectedImage;
  };

  useEffect(() => {
    if (selectedImage && fontsReady) generateCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, selectedCeleb, activeDialogue, fontsReady, logoImage]);

  const shareCard = async () => {
    if (!generatedCardUrl) return;
    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-style.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Quttr Style',
          text: 'मेरा Quttr Style पोस्टर 🔥 ऐप डाउनलोड करें https://www.quttrr.com/style,
        });
      } else {
        const a = document.createElement('a');
        a.href = generatedCardUrl;
        a.download = 'quttr-style.jpg';
        a.click();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const tabs = ['Gita Updesh', 'Motivation', 'All', 'Cricketers', 'Bollywood', 'South Stars'];
  const filtered =
    activeTab === 'All' ? ALL_CELEBS : ALL_CELEBS.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xs px-4 py-1.5 rounded-full mb-3 tracking-widest">
          ★ QUTTR PREMIUM POSTER ★
        </div>
        <h1
          className="text-4xl md:text-6xl font-black tracking-tight"
          style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '3px' }}
        >
          BECOME A <span className="text-yellow-400">STAR</span>
        </h1>
        <p className="text-slate-400 mt-2" style={{ fontFamily: 'Caveat, cursive', fontSize: 22 }}>
          गीता उपदेश · मोटिवेशन · सेलिब्रिटी स्टाइल
        </p>

        {/* TOP PRIORITY BUTTONS — Gita & Motivation first */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => selectQuickCategory('gita')}
            className={
              'px-6 py-3 rounded-2xl font-black text-sm tracking-wide border-2 transition shadow-lg ' +
              (selectedCeleb.id === 'gita'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 border-orange-300 text-black scale-105'
                : 'bg-orange-950/80 border-orange-500/50 text-orange-200 hover:border-orange-400')
            }
          >
            🕉️ गीता उपदेश
          </button>
          <button
            type="button"
            onClick={() => selectQuickCategory('motivation')}
            className={
              'px-6 py-3 rounded-2xl font-black text-sm tracking-wide border-2 transition shadow-lg ' +
              (selectedCeleb.id === 'motivation'
                ? 'bg-gradient-to-r from-sky-400 to-blue-600 border-sky-300 text-black scale-105'
                : 'bg-sky-950/80 border-sky-500/50 text-sky-200 hover:border-sky-400')
            }
          >
            🔥 मोटिवेशनल कोट्स
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 rounded-3xl border border-yellow-500/20 shadow-2xl">
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 1 — YOUR PHOTO
            </h2>
            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="font-semibold text-sm">Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">📸</span>
                  <span className="font-semibold text-sm">Take Selfie</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border-2 border-yellow-500" />
                <button type="button" onClick={captureSelfie} className="w-full bg-rose-600 font-black py-4 rounded-xl">
                  📸 CAPTURE
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 2 — STYLE / QUOTES
            </h2>
            {/* Tabs: Gita & Motivation first */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {tabs.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    if (cat === 'Gita Updesh') selectQuickCategory('gita');
                    if (cat === 'Motivation') selectQuickCategory('motivation');
                  }}
                  className={
                    'px-4 py-2 rounded-full text-xs font-black tracking-wider whitespace-nowrap transition ' +
                    (activeTab === cat
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
                  }
                >
                  {cat === 'Gita Updesh' ? '🕉️ GITA' : cat === 'Motivation' ? '🔥 MOTIVATION' : cat.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {filtered.map((celeb) => (
                <div
                  key={celeb.id}
                  onClick={() => setSelectedCeleb(celeb)}
                  className={
                    'p-4 rounded-2xl cursor-pointer border-2 transition ' +
                    (selectedCeleb.id === celeb.id
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-slate-800 bg-slate-800/60')
                  }
                >
                  <div className="font-black text-sm">{celeb.name}</div>
                  <div className="text-xs text-yellow-400 mt-1">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedImage && (
            <button
              type="button"
              onClick={() => pickRandomDialogue(selectedCeleb)}
              className="w-full bg-slate-800 border border-yellow-500/30 py-4 rounded-xl text-sm font-black hover:border-yellow-500"
            >
              🎲 नया कोट / डायलॉग (हर क्लिक अलग)
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md rounded-3xl border-2 border-dashed border-yellow-500/30 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <span className="text-6xl mb-4">🎬</span>
              <p className="text-yellow-400 font-black" style={{ fontFamily: 'Bebas Neue' }}>
                POSTER HERE
              </p>
              <p className="text-sm mt-2">पहले ऊपर से गीता / मोटिवेशन चुनें</p>
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/90 rounded-3xl flex flex-col items-center justify-center border border-yellow-500/40">
                  <div className="w-14 h-14 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-yellow-400 font-black">{loadingText}</p>
                </div>
              )}
              {generatedCardUrl && (
                <img src={generatedCardUrl} alt="Quttr" className="w-full rounded-3xl border border-yellow-500/20" />
              )}
              {generatedCardUrl && !isProcessing && (
                <button
                  type="button"
                  onClick={shareCard}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black py-5 rounded-2xl"
                  style={{ fontFamily: 'Bebas Neue' }}
                >
                  📤 SHARE WHATSAPP / INSTAGRAM
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
