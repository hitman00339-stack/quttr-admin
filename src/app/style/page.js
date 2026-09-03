'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CELEBRITIES as IMPORTED_CELEBS } from '@/lib/celebrities';

// ============ CATEGORIES WITH GREETINGS & FESTIVALS ============
const NEW_CATEGORIES = [
  {
    id: 'janmashtami',
    name: 'जन्माष्टमी 🦚',
    styleName: 'Krishna Janmashtami',
    category: 'Festivals',
    themeColor: '#0ea5e9', // Peacock Blue
    bgGradient: ['#020617', '#082f49'], // Deep night sky
    requireName: true,
    dialogues: [
      'हाथी घोड़ा पालकी, जय कन्हैया लाल की!\n{name} की ओर से जन्माष्टमी की हार्दिक शुभकामनाएँ।',
      'माखन चोर नंद किशोर, बांधी जिसने प्रीत की डोर।\n{name} के परिवार की ओर से शुभ जन्माष्टमी।',
      'मुरली मनोहर, गोपी मनोरम, यमुना के तट पर जिनका डेरा।\n{name} की तरफ से हैप्पी जन्माष्टमी।',
      'नटखट कान्हा आए द्वार, लेकर अपनी बांसुरी की पुकार।\n{name} की ओर से जय श्री कृष्णा!',
      'May Lord Krishna steal all your tensions and worries.\nHappy Janmashtami from {name}!',
    ],
  },
  {
    id: 'birthday',
    name: 'Happy Birthday 🎂',
    styleName: 'जन्मदिन की बधाई',
    category: 'Greetings',
    themeColor: '#f43f5e', // Rose
    bgGradient: ['#4c0519', '#9f1239'], // Ruby
    requireName: true,
    dialogues: [
      'Wishing {name} a very Happy Birthday! 🎉\nMay all your dreams come true.',
      'जन्मदिन की अनंत शुभकामनाएँ, {name}! 🎂\nईश्वर आपको हमेशा खुश रखें।',
      'Happy Birthday {name}!\nKeep shining and inspiring everyone around you. ✨',
      'मुस्कुराते रहो हमेशा! {name} को जन्मदिन की ढेरों बधाइयाँ। 🎁',
    ],
  },
  {
    id: 'gita',
    name: 'भगवद् गीता 🕉️',
    styleName: 'गीता उपदेश',
    category: 'Spiritual',
    themeColor: '#f97316',
    bgGradient: ['#431407', '#7c2d12'],
    requireName: false,
    dialogues: [
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
      'जो हुआ, वह अच्छा हुआ। जो हो रहा है, वह अच्छा हो रहा है।',
      'खाली हाथ आए थे, खाली हाथ जाओगे।',
      'मनुष्य अपने विश्वास से निर्मित होता है।',
      'श्रेष्ठ पुरुष जो आचरण करते हैं, सामान्य मनुष्य उसी का अनुसरण करते हैं।',
    ],
  },
  {
    id: 'motivation',
    name: 'सक्सेस माइंडसेट 🔥',
    styleName: 'प्रेरक विचार',
    category: 'Motivation',
    themeColor: '#eab308',
    bgGradient: ['#422006', '#854d0e'],
    requireName: false,
    dialogues: [
      'मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है।',
      'हार हो जाती है जब मान लिया जाता है, जीत तब होती है जब ठान लिया जाता है।',
      'अगर मेहनत आदत बन जाए, तो कामयाबी मुकद्दर बन जाती है।',
      'पानी में गिरने से जान नहीं जाती, जान तब जाती है जब तैरना नहीं आता।',
      'जो उड़ने का शौक रखते हैं, वो गिरने का खौफ नहीं रखते।',
    ],
  },
];

const ALL_CELEBS = [...NEW_CATEGORIES, ...(IMPORTED_CELEBS || [])];

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(NEW_CATEGORIES[0]); // Janmashtami default
  const [activeDialogue, setActiveDialogue] = useState('');
  const [userName, setUserName] = useState(''); // Custom name input
  
  const [activeTab, setActiveTab] = useState('Festivals');
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
  }, [selectedCeleb, userName]);

  const pickRandomDialogue = (celeb) => {
    if (!celeb?.dialogues?.length) return;
    const len = celeb.dialogues.length;
    let i = Math.floor(Math.random() * len);
    if (len > 1 && celeb.dialogues[i] === activeDialogue) i = (i + 1) % len;
    
    // Replace {name} placeholder with user input (or fallback)
    let text = celeb.dialogues[i];
    if (text.includes('{name}')) {
      text = text.replace(/{name}/g, userName.trim() !== '' ? userName : 'आपका नाम');
    }
    setActiveDialogue(text);
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
      let r = d[i], g = d[i + 1], b = d[i + 2];
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
              sum += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[k++];
            }
          }
          d[i + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

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
    
    // Support manual \n line breaks too
    const finalLines = [];
    lines.forEach(l => {
      finalLines.push(...l.split('\n'));
    });
    return finalLines.length ? finalLines : [''];
  };

  const drawLogoTopRight = (ctx) => {
    const pad = 40;
    if (!logoImage || !logoImage.width) return;
    const maxW = 170, maxH = 85;
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

  const drawGooglePlayBadge = (ctx, cx, cy) => {
    const w = 420; const h = 88;
    const x = cx - w / 2; const y = cy;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#2a2a2a'); bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 14); else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.stroke();
    
    const px = x + 28, py = y + h / 2;
    const triGrad = ctx.createLinearGradient(px, py - 22, px + 42, py + 22);
    triGrad.addColorStop(0, '#00F076'); triGrad.addColorStop(0.35, '#00D0FF');
    triGrad.addColorStop(0.65, '#FFD400'); triGrad.addColorStop(1, '#FF3A44');
    ctx.fillStyle = triGrad;
    ctx.beginPath(); ctx.moveTo(px, py - 24); ctx.lineTo(px, py + 24); ctx.lineTo(px + 42, py); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(px + 4, py - 14); ctx.lineTo(px + 4, py + 8); ctx.lineTo(px + 28, py - 2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText('GET IT ON', px + 58, y + 32);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 32px system-ui, sans-serif';
    ctx.fillText('Google Play', px + 58, y + 64);
    ctx.restore();
  };

  const generateCard = async () => {
    if (!selectedImage || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Creating your poster... 🎬');
    try { await document.fonts.ready; } catch (e) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080; canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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

      const cropSrcH = Math.min(img.height, img.height * 0.85);
      const work = document.createElement('canvas');
      work.width = 800; work.height = 1000;
      const wctx = work.getContext('2d');
      wctx.imageSmoothingEnabled = true; wctx.imageSmoothingQuality = 'high';
      const srcRatio = img.width / cropSrcH;
      const dstRatio = 0.8;
      let sx, sy, sw, sh;
      if (srcRatio > dstRatio) {
        sh = cropSrcH; sw = cropSrcH * dstRatio; sx = (img.width - sw) / 2; sy = 0;
      } else {
        sw = img.width; sh = img.width / dstRatio; sx = 0; sy = 0;
      }
      wctx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 1000);
      enhanceImage(wctx, 800, 1000);
      applySharpen(wctx, 800, 1000);

      const faceY = 170, faceH = 920, faceW = 820, faceX = (1080 - faceW) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 50; ctx.fillStyle = '#000';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(faceX, faceY, faceW, faceH, 18); ctx.fill(); }
      else ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18); else ctx.rect(faceX, faceY, faceW, faceH);
      ctx.clip();
      ctx.drawImage(work, faceX, faceY, faceW, faceH);
      ctx.globalCompositeOperation = 'multiply';
      const duo = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
      duo.addColorStop(0, '#fff'); duo.addColorStop(1, selectedCeleb.themeColor);
      ctx.globalAlpha = 0.2; ctx.fillStyle = duo; ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const fade = ctx.createLinearGradient(0, faceY + faceH - 260, 0, faceY + faceH);
      fade.addColorStop(0, 'transparent'); fade.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = fade; ctx.fillRect(faceX, faceY + faceH - 260, faceW, 260);
      ctx.restore();

      const gold = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
      gold.addColorStop(0, '#FFD700'); gold.addColorStop(0.5, '#FFA500'); gold.addColorStop(1, '#B8860B');
      ctx.strokeStyle = gold; ctx.lineWidth = 4; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18); else ctx.rect(faceX, faceY, faceW, faceH);
      ctx.stroke();

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('Quttr Style', 48, 78);
      ctx.fillStyle = selectedCeleb.themeColor; ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText(selectedCeleb.category.toUpperCase(), 48, 106);
      drawLogoTopRight(ctx);

      const quoteMaxW = 780;
      const quoteStartY = 1240;
      ctx.font = '700 46px "Caveat", "Noto Sans Devanagari", system-ui, sans-serif';
      
      // Update text in case name changed just before draw
      let finalDialogue = activeDialogue;
      if (selectedCeleb.requireName && userName.trim() !== '') {
         // Auto-replace just in case
         if (!finalDialogue.includes(userName)) {
           finalDialogue = finalDialogue.replace(/आपका नाम/g, userName).replace(/{name}/g, userName);
         }
      }

      const lines = wrapLines(ctx, finalDialogue, quoteMaxW);
      const lh = 64;
      const blockH = lines.length * lh;
      const textTop = quoteStartY;
      const textBottom = textTop + (lines.length - 1) * lh;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(90, textTop - 70, 900, blockH + 130, 20); ctx.fill();
      } else ctx.fillRect(90, textTop - 70, 900, blockH + 130);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFF8E7';
      ctx.font = '700 46px "Caveat", "Noto Sans Devanagari", system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 8;
      lines.forEach((ln, idx) => { ctx.fillText(ln, 540, textTop + idx * lh); });
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      const authorY = textBottom + 78;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'italic 600 26px "Playfair Display", serif';
      ctx.fillText('— ' + (selectedCeleb.name), 540, authorY);

      const lineY = authorY + 28;
      const dg = ctx.createLinearGradient(260, 0, 820, 0);
      dg.addColorStop(0, 'transparent'); dg.addColorStop(0.5, '#FFD700'); dg.addColorStop(1, 'transparent');
      ctx.fillStyle = dg; ctx.fillRect(260, lineY, 560, 1);

      const badgeY = Math.min(lineY + 36, 1720);
      drawGooglePlayBadge(ctx, 540, badgeY);

      const appY = badgeY + 110;
      if (logoImage && logoImage.width) {
        const s = 36; const ratio = logoImage.height / logoImage.width;
        ctx.drawImage(logoImage, 540 - 100, appY - 8, s, s * ratio);
      }
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = '800 26px "Bebas Neue", Impact, sans-serif';
      ctx.fillText('QUTTR APP', 540 - 50, appY + 22);

      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '500 18px system-ui, sans-serif';
      ctx.fillText('Barber booking  ·  quttrr.com/style', 540, appY + 52);

      setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
    };
    img.onerror = () => { setIsProcessing(false); alert('Photo load failed. Try another image.'); };
    img.src = selectedImage;
  };

  useEffect(() => {
    if (selectedImage && fontsReady) generateCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, selectedCeleb, activeDialogue, fontsReady, logoImage, userName]);

  // ==========================================
  // SHARING FUNCTION — Auto Includes Link
  // ==========================================
  const shareCard = async () => {
    if (!generatedCardUrl) return;
    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-style.jpg', { type: 'image/jpeg' });
      
      // ⭐ Embed the exact link to this page so others can make posters too!
      const shareText = 'Make your own Poster & Greetings! 🔥\nClick here: https://www.quttrr.com/style';

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Quttr Style',
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({ title: 'Quttr Style', text: shareText });
        downloadImage();
      } else {
        downloadImage();
      }
    } catch (e) {
      console.log('Sharing failed:', e);
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = generatedCardUrl;
    a.download = 'quttr-style.jpg';
    a.click();
  };

  const tabs = ['Festivals', 'Greetings', 'Spiritual', 'Motivation', 'Cricketers', 'Bollywood'];
  const filtered = activeTab === 'All' ? ALL_CELEBS : ALL_CELEBS.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 overflow-x-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xs px-4 py-1.5 rounded-full mb-3 tracking-widest">
          ★ QUTTR GREETINGS & POSTERS ★
        </div>
        <h1
          className="text-4xl md:text-6xl font-black tracking-tight"
          style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '3px' }}
        >
          BECOME A <span className="text-yellow-400">STAR</span>
        </h1>
        <p className="text-slate-400 mt-2" style={{ fontFamily: 'Caveat, cursive', fontSize: 24 }}>
          जन्माष्टमी · जन्मदिन · मोटिवेशन · बॉलीवुड
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => selectQuickCategory('janmashtami')}
            className={
              'px-6 py-3 rounded-2xl font-black text-sm tracking-wide border-2 transition shadow-lg ' +
              (selectedCeleb.id === 'janmashtami'
                ? 'bg-gradient-to-r from-sky-400 to-blue-600 border-sky-300 text-black scale-105'
                : 'bg-sky-950/80 border-sky-500/50 text-sky-200 hover:border-sky-400')
            }
          >
            🦚 जन्माष्टमी विश
          </button>
          <button
            type="button"
            onClick={() => selectQuickCategory('birthday')}
            className={
              'px-6 py-3 rounded-2xl font-black text-sm tracking-wide border-2 transition shadow-lg ' +
              (selectedCeleb.id === 'birthday'
                ? 'bg-gradient-to-r from-rose-400 to-red-600 border-rose-300 text-black scale-105'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200 hover:border-rose-400')
            }
          >
            🎂 हैप्पी बर्थडे
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 rounded-3xl border border-yellow-500/20 shadow-2xl">
          
          {/* Custom Name Input */}
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 1 — YOUR NAME
            </h2>
            <input 
              type="text" 
              placeholder="Enter your name (e.g. Rahul Sharma)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-yellow-400 text-white rounded-xl px-4 py-3 outline-none transition font-semibold"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 2 — YOUR PHOTO
            </h2>
            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-500 p-4 rounded-2xl flex flex-col items-center gap-2 transition"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="font-semibold text-sm">Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-500 p-4 rounded-2xl flex flex-col items-center gap-2 transition"
                >
                  <span className="text-3xl">📸</span>
                  <span className="font-semibold text-sm">Take Selfie</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border-2 border-yellow-500" />
                <button type="button" onClick={captureSelfie} className="w-full bg-rose-600 font-black py-4 rounded-xl shadow-lg">
                  📸 CAPTURE
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* Category / Style */}
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 3 — STYLE / QUOTE
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
              {tabs.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    if (cat === 'Festivals') selectQuickCategory('janmashtami');
                    if (cat === 'Greetings') selectQuickCategory('birthday');
                  }}
                  className={
                    'px-4 py-2 rounded-full text-xs font-black tracking-wider whitespace-nowrap transition border ' +
                    (activeTab === cat
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700')
                  }
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {filtered.map((celeb) => (
                <div
                  key={celeb.id}
                  onClick={() => setSelectedCeleb(celeb)}
                  className={
                    'p-3 rounded-xl cursor-pointer border-2 transition ' +
                    (selectedCeleb.id === celeb.id
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-600')
                  }
                >
                  <div className="font-black text-sm">{celeb.name}</div>
                  <div className="text-xs text-yellow-400 mt-1 truncate">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reroll Quote */}
          {selectedImage && (
            <button
              type="button"
              onClick={() => pickRandomDialogue(selectedCeleb)}
              className="w-full bg-slate-800 border-2 border-yellow-500/30 py-4 rounded-xl text-sm font-black hover:border-yellow-500 transition text-yellow-400"
            >
              🎲 नया मैसेज / कोट (New Message)
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Live Preview */}
        <div className="flex flex-col items-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md rounded-3xl border-2 border-dashed border-yellow-500/30 bg-slate-900/50 flex flex-col items-center justify-center p-8 text-center text-slate-500 shadow-2xl">
              <span className="text-6xl mb-4">🎨</span>
              <p className="text-yellow-400 font-black text-2xl tracking-widest" style={{ fontFamily: 'Bebas Neue' }}>
                LIVE PREVIEW
              </p>
              <p className="text-sm mt-2 text-slate-400">अपना नाम लिखें और फोटो अपलोड करें</p>
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/90 rounded-3xl flex flex-col items-center justify-center border border-yellow-500/40">
                  <div className="w-14 h-14 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-yellow-400 font-black tracking-widest">{loadingText}</p>
                </div>
              )}
              
              {generatedCardUrl && (
                <img 
                  src={generatedCardUrl} 
                  alt="Your Quttr Card" 
                  className="w-full rounded-3xl border-4 border-slate-800 shadow-2xl" 
                />
              )}

              {generatedCardUrl && !isProcessing && (
                <button
                  type="button"
                  onClick={shareCard}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 text-black text-xl py-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Bebas Neue', letterSpacing: '2px' }}
                >
                  <span>📤</span>
                  <span>SHARE TO WHATSAPP & INSTA</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Scrollbar styles for cleaner UI */}
      <style dangerouslySetContent={`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `} />
    </div>
  );
}
