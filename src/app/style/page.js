'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CELEBRITIES as IMPORTED_CELEBS } from '@/lib/celebrities';

// ============ NEW CATEGORIES: GITA & MOTIVATION (HINDI) ============
const NEW_CATEGORIES = [
  {
    id: 'gita',
    name: 'Bhagavad Gita',
    styleName: 'Divine Wisdom',
    category: 'Gita Updesh',
    themeColor: '#f97316', // Orange
    bgGradient: ['#431407', '#7c2d12'],
    dialogues: [
      "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। (कर्म करो, फल की चिंता मत करो)",
      "जो हुआ, वह अच्छा हुआ। जो हो रहा है, वह अच्छा हो रहा है।",
      "परिवर्तन ही संसार का नियम है।",
      "आत्मा न कभी जन्म लेती है और न कभी मरती है।",
      "मन अशांत है, लेकिन अभ्यास और वैराग्य से इसे वश में किया जा सकता है।",
      "खाली हाथ आए थे, खाली हाथ जाओगे।",
      "क्रोध से भ्रम पैदा होता है, और भ्रम से बुद्धि नष्ट होती है।",
      "मनुष्य अपने विश्वास से निर्मित होता है, जैसा वह विश्वास करता है, वैसा वह बन जाता है।",
      "न कोई मरता है, न कोई मारता है, सब निमित्त मात्र हैं।",
      "सन्देह करने वाले व्यक्ति के लिए न इस लोक में सुख है, न परलोक में।",
      "जो मन को नियंत्रित नहीं करते, उनके लिए मन शत्रु के समान काम करता है।",
      "अपना कर्म करते समय सुख-दुख, लाभ-हानि, जय-पराजय को समान समझो।",
      "डरने की कोई बात नहीं है, सत्य कभी नष्ट नहीं होता।",
      "श्रेष्ठ पुरुष जो आचरण करते हैं, सामान्य मनुष्य उसी का अनुसरण करते हैं।",
      "अपने अनिवार्य कर्तव्य का पालन करो, क्योंकि अकर्म से कर्म बेहतर है।",
      "बुद्धिमान व्यक्ति कामुक सुखों में आनंद नहीं लेते।",
      "जन्म लेने वाले की मृत्यु निश्चित है और मरने वाले का जन्म निश्चित है।",
      "तुम्हारा क्या गया जो तुम रोते हो? तुम क्या लाए थे जो तुमने खो दिया?",
      "मैं सभी प्राणियों के हृदय में स्थित हूँ।",
      "अहंकार, क्रोध और लालच — ये नरक के तीन द्वार हैं।"
    ]
  },
  {
    id: 'motivation',
    name: 'Success Mindset',
    styleName: 'Hardwork & Hustle',
    category: 'Motivation',
    themeColor: '#0ea5e9', // Sky Blue
    bgGradient: ['#082f49', '#0369a1'],
    dialogues: [
      "मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है।",
      "संघर्ष में आदमी अकेला होता है, सफलता में दुनिया उसके साथ होती है।",
      "हार हो जाती है जब मान लिया जाता है, जीत तब होती है जब ठान लिया जाता है।",
      "वक्त से लड़कर जो नसीब बदल दे, इंसान वही जो अपनी तकदीर बदल दे।",
      "अगर मेहनत आदत बन जाए, तो कामयाबी मुकद्दर बन जाती है।",
      "जिंदगी में रिस्क लेने से कभी मत डरो, या तो जीत मिलेगी या सीख।",
      "पानी में गिरने से किसी की जान नहीं जाती, जान तब जाती है जब तैरना नहीं आता।",
      "आज रास्ता बना लिया है, तो कल मंजिल भी मिल जाएगी।",
      "बुरा वक्त एक ऐसी तिजोरी है, जहां से सफलता के हथियार मिलते हैं।",
      "मैदान में हारा हुआ इंसान जीत सकता है, लेकिन मन से हारा हुआ कभी नहीं जीत सकता।",
      "जो उड़ने का शौक रखते हैं, वो गिरने का खौफ नहीं रखते।",
      "जिसने भी खुद को खर्च किया है, दुनिया ने उसी को गूगल पर सर्च किया है।",
      "ख्वाहिशें भले ही छोटी हों, लेकिन उन्हें पूरा करने की जिद होनी चाहिए।",
      "जब लोग आपका साथ छोड़ दें, तो समझ लेना आप सही रास्ते पर हैं।",
      "अकेले चलने का साहस रखो, कामयाबी एक दिन तुम्हारे कदम चूमेगी।",
      "मंजिल पाना तो बहुत दूर की बात है, गुरूर में रहोगे तो रास्ते भी नहीं देख पाओगे।",
      "तैरना सीखना है तो पानी में उतरना ही होगा, किनारे बैठकर कोई गोताखोर नहीं बनता।",
      "भीड़ हमेशा उस रास्ते पर चलती है जो आसान लगता है, अपना रास्ता खुद चुनिए।",
      "इंतजार करने वालों को सिर्फ उतना मिलता है, जितना कोशिश करने वाले छोड़ देते हैं।",
      "अपने सपनों को जिन्दा रखिए, अगर आपके सपनों की चिंगारी बुझ गई है तो समझो आप जीते जी मर गए।"
    ]
  }
];

const ALL_CELEBS = [...IMPORTED_CELEBS, ...NEW_CATEGORIES];

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(ALL_CELEBS[0]);
  const [activeDialogue, setActiveDialogue] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImage, setLogoImage] = useState(null);
  const [logoStatus, setLogoStatus] = useState('loading');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fonts
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

  // Load Logo
  useEffect(() => {
    const paths = ['/quttr-logo.png', '/quttr-business-logo.png', '/logo.png'];
    let cancelled = false;
    let index = 0;

    const tryNext = () => {
      if (cancelled || index >= paths.length) {
        if (!cancelled) setLogoStatus('fail');
        return;
      }
      const path = paths[index++];
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (cancelled) return;
        if (img.width > 0 && img.height > 0) {
          setLogoImage(img);
          setLogoStatus('ok');
        } else {
          tryNext();
        }
      };
      img.onerror = () => tryNext();
      img.src = path + '?v=' + Date.now();
    };

    tryNext();
    return () => { cancelled = true; };
  }, []);

  // Initialize random dialogue on celebrity change
  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
  }, [selectedCeleb]);

  // NEVER REPEAT EXACT SAME DIALOGUE ON CLICKS
  const pickRandomDialogue = (celeb) => {
    if (!celeb || !celeb.dialogues) return;
    const len = celeb.dialogues.length;
    let i = Math.floor(Math.random() * len);
    
    // If it's the same as current, shift by 1 to guarantee a new one
    if (len > 1 && celeb.dialogues[i] === activeDialogue) {
      i = (i + 1) % len;
    }
    setActiveDialogue(celeb.dialogues[i]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
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
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
    setSelectedImage(dataUrl);
  };

  const enhanceImage = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      r = r < 128 ? r * 0.92 : Math.min(255, r * 1.08 + 5);
      g = g < 128 ? g * 0.94 : Math.min(255, g * 1.06 + 3);
      b = b < 128 ? b * 0.96 : Math.min(255, b * 1.04);
      if (r > 150) r = Math.min(255, r + 8);
      if (b < 100) b = Math.max(0, b - 5);
      const brightness = (r + g + b) / 3;
      if (brightness > 80 && brightness < 200) {
        r = r * 0.95 + brightness * 0.05;
        g = g * 0.95 + brightness * 0.05;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
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
          let sum = 0, k = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const ni = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += copy[ni] * kernel[k++];
            }
          }
          d[i + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const drawWrapped = (ctx, text, x, y, maxW, lh) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxW && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = test;
      }
    }
    lines.push(line.trim());
    lines.forEach((l, idx) => ctx.fillText(l, x, y + idx * lh));
    return lines.length;
  };

  const drawLogoTopRight = (ctx) => {
    const pad = 40;
    const maxW = 180;
    const maxH = 90;

    if (logoImage && logoImage.width > 0) {
      const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
      const drawW = Math.max(40, logoImage.width * scale);
      const drawH = Math.max(20, logoImage.height * scale);
      const logoX = 1080 - drawW - pad;
      const logoY = pad;

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(logoX - 12, logoY - 10, drawW + 24, drawH + 20, 14);
        ctx.fill();
      } else {
        ctx.fillRect(logoX - 12, logoY - 10, drawW + 24, drawH + 20);
      }
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 16;
      ctx.drawImage(logoImage, logoX, logoY, drawW, drawH);
      ctx.restore();
    }
  };

  const generateCard = async () => {
    if (!selectedImage || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Creating your poster... 🎬');

    try { await document.fonts.ready; } catch (e) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Cinematic Background
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.3, selectedCeleb.bgGradient[0]);
      grad.addColorStop(0.7, selectedCeleb.bgGradient[1]);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      const spot = ctx.createRadialGradient(540, 400, 100, 540, 600, 900);
      spot.addColorStop(0, selectedCeleb.themeColor + '55');
      spot.addColorStop(0.5, selectedCeleb.themeColor + '22');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, 1080, 1920);

      // Light Rays
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.translate(540, 200);
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, 800);
        rayGrad.addColorStop(0, selectedCeleb.themeColor);
        rayGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(200, 1200); ctx.lineTo(-200, 1200);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.restore();

      // Face Processing
      const srcW = img.width, srcH = img.height;
      const cropSrcH = Math.min(srcH, srcH * 0.85);
      const workCanvas = document.createElement('canvas');
      workCanvas.width = 800; workCanvas.height = 1000;
      const workCtx = workCanvas.getContext('2d');
      workCtx.imageSmoothingEnabled = true; workCtx.imageSmoothingQuality = 'high';

      const srcRatio = srcW / cropSrcH;
      const dstRatio = 800 / 1000;
      let sx, sy, sw, sh;
      if (srcRatio > dstRatio) {
        sh = cropSrcH; sw = cropSrcH * dstRatio;
        sx = (srcW - sw) / 2; sy = 0;
      } else {
        sw = srcW; sh = srcW / dstRatio;
        sx = 0; sy = 0;
      }
      workCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 1000);
      enhanceImage(workCtx, 800, 1000);
      applySharpen(workCtx, 800, 1000);

      const faceY = 180, faceH = 1000, faceW = 840, faceX = (1080 - faceW) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#000';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath(); ctx.roundRect(faceX, faceY, faceW, faceH, 20); ctx.fill();
      } else { ctx.fillRect(faceX, faceY, faceW, faceH); }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(faceX, faceY, faceW, faceH, 20);
      } else { ctx.rect(faceX, faceY, faceW, faceH); }
      ctx.clip();
      ctx.drawImage(workCanvas, faceX, faceY, faceW, faceH);

      ctx.globalCompositeOperation = 'multiply';
      const duoGrad = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
      duoGrad.addColorStop(0, '#ffffff');
      duoGrad.addColorStop(1, selectedCeleb.themeColor);
      ctx.fillStyle = duoGrad; ctx.globalAlpha = 0.22;
      ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

      const fadeGrad = ctx.createLinearGradient(0, faceY + faceH - 280, 0, faceY + faceH);
      fadeGrad.addColorStop(0, 'transparent'); fadeGrad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(faceX, faceY + faceH - 280, faceW, 280);
      ctx.restore();

      // Gold Border
      ctx.save();
      const goldGrad = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
      goldGrad.addColorStop(0, '#FFD700'); goldGrad.addColorStop(0.5, '#FFA500'); goldGrad.addColorStop(1, '#B8860B');
      ctx.strokeStyle = goldGrad; ctx.lineWidth = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') { ctx.roundRect(faceX, faceY, faceW, faceH, 20); }
      else { ctx.rect(faceX, faceY, faceW, faceH); }
      ctx.stroke(); ctx.restore();

      // Grain Overlay
      const grainCanvas = document.createElement('canvas');
      grainCanvas.width = 1080; grainCanvas.height = 1920;
      const grainCtx = grainCanvas.getContext('2d');
      const grainData = grainCtx.createImageData(1080, 1920);
      for (let i = 0; i < grainData.data.length; i += 4) {
        const val = 128 + (Math.random() - 0.5) * 40;
        grainData.data[i] = val; grainData.data[i + 1] = val; grainData.data[i + 2] = val; grainData.data[i + 3] = 22;
      }
      grainCtx.putImageData(grainData, 0, 0);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35;
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

      // ============ TOP TEXT ============
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('Quttr Style', 48, 78);
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText(selectedCeleb.category.toUpperCase(), 48, 108);

      // ============ LOGO TOP RIGHT ============
      drawLogoTopRight(ctx);

      // ============ DIALOGUE (HINDI/ENGLISH) ============
      ctx.textAlign = 'center';
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '900 100px "Playfair Display", serif';
      ctx.globalAlpha = 0.35;
      ctx.fillText('"', 160, 1380);
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#FFF8E7';
      // Use slightly smaller font for long Hindi quotes so they fit nicely
      ctx.font = '700 42px "Caveat", cursive, system-ui';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      const lineCount = drawWrapped(ctx, activeDialogue, 540, 1380, 840, 56);
      ctx.shadowBlur = 0;

      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '900 100px "Playfair Display", serif';
      ctx.globalAlpha = 0.35;
      ctx.fillText('"', 920, 1380 + (lineCount - 1) * 56);
      ctx.globalAlpha = 1;

      // Divider & Name
      const dividerY = 1380 + lineCount * 56 + 30;
      const divGrad = ctx.createLinearGradient(240, 0, 840, 0);
      divGrad.addColorStop(0, 'transparent'); divGrad.addColorStop(0.5, '#FFD700'); divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad; ctx.fillRect(240, dividerY, 600, 1);

      ctx.fillStyle = '#FFD700';
      ctx.save(); ctx.translate(540, dividerY); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();

      ctx.fillStyle = '#FFD700';
      ctx.font = 'italic 600 28px "Playfair Display", serif';
      ctx.fillText('— ' + selectedCeleb.name, 540, dividerY + 45);

      // ============ THEME-STYLED PLAY STORE FOOTER ============
      const footerY = dividerY + 85;

      // Draw Play Store Themed Button
      const btnW = 380;
      const btnH = 80;
      const btnX = 540 - btnW / 2;
      
      // Button Background (Theme color translucent)
      ctx.fillStyle = selectedCeleb.themeColor + '44'; 
      ctx.strokeStyle = selectedCeleb.themeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(btnX, footerY, btnW, btnH, 16);
      } else {
        ctx.rect(btnX, footerY, btnW, btnH);
      }
      ctx.fill();
      ctx.stroke();

      // Play Store Triangle
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.beginPath();
      ctx.moveTo(btnX + 35, footerY + 20);
      ctx.lineTo(btnX + 35, footerY + 60);
      ctx.lineTo(btnX + 70, footerY + 40);
      ctx.closePath();
      ctx.fill();

      // "GET IT ON Google Play" Text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = '500 16px system-ui, sans-serif';
      ctx.fillText('GET IT ON', btnX + 90, footerY + 34);
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.fillText('Google Play', btnX + 90, footerY + 62);

      // Quttr App Logo + Name (Centered below the button)
      ctx.textAlign = 'center';
      
      if (logoImage && logoImage.width > 0) {
        // Draw small app logo
        const smallLogoW = 40;
        const smallLogoH = (logoImage.height / logoImage.width) * smallLogoW;
        ctx.drawImage(logoImage, 540 - smallLogoW - 60, footerY + 100, smallLogoW, smallLogoH);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '900 28px "Bebas Neue", Impact, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('QUTTR APP', 540 + 20, footerY + 128);

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
          text: `Check out my ${selectedCeleb.category} poster! 🔥 Download Quttr App from Playstore!`,
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

  const filtered = activeTab === 'All'
    ? ALL_CELEBS
    : ALL_CELEBS.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-8">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xs px-4 py-1.5 rounded-full mb-3 tracking-widest">
          ★ QUTTR PREMIUM POSTER ★
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight" style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '3px' }}>
          BECOME A <span className="text-yellow-400">STAR</span>
        </h1>
        <p className="text-slate-400 mt-3" style={{ fontFamily: 'Caveat, cursive', fontSize: 24 }}>
          Get Celebrity Styles, Motivation & Gita Updesh 🕉️
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 rounded-3xl border border-yellow-500/20 shadow-2xl">
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 1 — YOUR PHOTO
            </h2>
            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2 transition">
                  <span className="text-3xl">🖼️</span><span className="font-semibold text-sm">Upload Photo</span>
                </button>
                <button type="button" onClick={startCamera} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2 transition">
                  <span className="text-3xl">📸</span><span className="font-semibold text-sm">Take Selfie</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border-2 border-yellow-500" />
                <button type="button" onClick={captureSelfie} className="w-full bg-gradient-to-r from-rose-600 to-red-600 font-black py-4 rounded-xl text-lg">
                  📸 CAPTURE PHOTO
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 2 — CHOOSE STYLE / QUOTES
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {['All', 'Gita Updesh', 'Motivation', 'Cricketers', 'Bollywood', 'South Stars'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={'px-4 py-2 rounded-full text-xs font-black tracking-wider whitespace-nowrap transition ' + (activeTab === cat ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {filtered.map((celeb) => (
                <div
                  key={celeb.id}
                  onClick={() => setSelectedCeleb(celeb)}
                  className={'p-4 rounded-2xl cursor-pointer border-2 transition ' + (selectedCeleb.id === celeb.id ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02]' : 'border-slate-800 bg-slate-800/60 hover:border-slate-600')}
                >
                  <div className="font-black text-sm text-white">{celeb.name}</div>
                  <div className="text-xs text-yellow-400 mt-1 font-medium">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedImage && (
            <button
              type="button"
              onClick={() => pickRandomDialogue(selectedCeleb)}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-yellow-500/30 py-4 rounded-xl text-sm font-black tracking-wider hover:border-yellow-500 transition"
            >
              🎲 SHUFFLE QUOTE / DIALOGUE
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md rounded-3xl border-2 border-dashed border-yellow-500/30 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-gradient-to-b from-slate-900/50 to-black/50">
              <span className="text-7xl mb-6">🎬</span>
              <p className="text-lg font-black text-yellow-400 mb-2" style={{ fontFamily: 'Bebas Neue', letterSpacing: '3px' }}>
                YOUR POSTER APPEARS HERE
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/90 rounded-3xl flex flex-col items-center justify-center border border-yellow-500/40">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-yellow-400 font-black tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>{loadingText}</p>
                </div>
              )}
              {generatedCardUrl && (
                <img src={generatedCardUrl} alt="Quttr Style" className="w-full rounded-3xl border border-yellow-500/20 shadow-[0_0_80px_rgba(250,204,21,0.15)]" />
              )}
              {generatedCardUrl && !isProcessing && (
                <button type="button" onClick={shareCard} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black py-5 rounded-2xl shadow-2xl text-lg tracking-wider transition" style={{ fontFamily: 'Bebas Neue' }}>
                  📤 SHARE TO WHATSAPP / INSTAGRAM
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
