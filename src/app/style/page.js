'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CELEBRITIES } from '@/lib/celebrities';

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(CELEBRITIES[0]);
  const [activeDialogue, setActiveDialogue] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImage, setLogoImage] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load fonts
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

  // Load logo from public folder
  useEffect(() => {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => setLogoImage(logo);
    logo.onerror = () => console.log('Logo not found at /quttr-logo.png');
    logo.src = '/quttr-logo.png';
  }, []);

  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
  }, [selectedCeleb]);

  const pickRandomDialogue = (celeb) => {
    const i = Math.floor(Math.random() * celeb.dialogues.length);
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

  // Professional image enhancement
  const enhanceImage = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // S-curve contrast
      r = r < 128 ? r * 0.92 : Math.min(255, r * 1.08 + 5);
      g = g < 128 ? g * 0.94 : Math.min(255, g * 1.06 + 3);
      b = b < 128 ? b * 0.96 : Math.min(255, b * 1.04);

      // Cinematic warm highlights / cool shadows
      if (r > 150) r = Math.min(255, r + 8);
      if (b < 100) b = Math.max(0, b - 5);

      // Smooth midtones
      const brightness = (r + g + b) / 3;
      if (brightness > 80 && brightness < 200) {
        r = r * 0.95 + brightness * 0.05;
        g = g * 0.95 + brightness * 0.05;
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  // Sharpening filter
  const applySharpen = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let k = 0;
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

  // Text wrap helper
  const drawWrapped = (ctx, text, x, y, maxW, lh) => {
    const words = text.split(' ');
    let line = '';
    let cy = y;
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
    lines.forEach((l, idx) => {
      ctx.fillText(l, x, cy + idx * lh);
    });
    return lines.length;
  };

  // ============ PROFESSIONAL POSTER GENERATION ============
  const generateCard = async () => {
    if (!selectedImage || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Creating your poster... 🎬');

    try {
      await document.fonts.ready;
    } catch (e) {}

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Cinematic background
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.3, selectedCeleb.bgGradient[0]);
      grad.addColorStop(0.7, selectedCeleb.bgGradient[1]);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Radial spotlight
      const spot = ctx.createRadialGradient(540, 400, 100, 540, 600, 900);
      spot.addColorStop(0, selectedCeleb.themeColor + '55');
      spot.addColorStop(0.5, selectedCeleb.themeColor + '22');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Light rays
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.translate(540, 200);
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, 800);
        rayGrad.addColorStop(0, selectedCeleb.themeColor);
        rayGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(40, 0);
        ctx.lineTo(200, 1200);
        ctx.lineTo(-200, 1200);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 3. Smart face crop + enhance
      const srcW = img.width;
      const srcH = img.height;
      const cropSrcW = srcW;
      const cropSrcH = Math.min(srcH, srcH * 0.85);

      const workCanvas = document.createElement('canvas');
      workCanvas.width = 800;
      workCanvas.height = 1000;
      const workCtx = workCanvas.getContext('2d');
      workCtx.imageSmoothingEnabled = true;
      workCtx.imageSmoothingQuality = 'high';

      const srcRatio = cropSrcW / cropSrcH;
      const dstRatio = 800 / 1000;
      let sx, sy, sw, sh;
      if (srcRatio > dstRatio) {
        sh = cropSrcH;
        sw = cropSrcH * dstRatio;
        sx = (cropSrcW - sw) / 2;
        sy = 0;
      } else {
        sw = cropSrcW;
        sh = cropSrcW / dstRatio;
        sx = 0;
        sy = 0;
      }
      workCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 1000);

      enhanceImage(workCtx, 800, 1000);
      applySharpen(workCtx, 800, 1000);

      // 4. Place face on poster
      const faceY = 220;
      const faceH = 1050;
      const faceW = 840;
      const faceX = (1080 - faceW) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#000';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(faceX, faceY, faceW, faceH, 20);
      } else {
        ctx.rect(faceX, faceY, faceW, faceH);
      }
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(faceX, faceY, faceW, faceH, 20);
      } else {
        ctx.rect(faceX, faceY, faceW, faceH);
      }
      ctx.clip();
      ctx.drawImage(workCanvas, faceX, faceY, faceW, faceH);

      // Duotone wash
      ctx.globalCompositeOperation = 'multiply';
      const duoGrad = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
      duoGrad.addColorStop(0, '#ffffff');
      duoGrad.addColorStop(1, selectedCeleb.themeColor);
      ctx.fillStyle = duoGrad;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(faceX, faceY, faceW, faceH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Bottom fade into background
      const fadeGrad = ctx.createLinearGradient(0, faceY + faceH - 300, 0, faceY + faceH);
      fadeGrad.addColorStop(0, 'transparent');
      fadeGrad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(faceX, faceY + faceH - 300, faceW, 300);
      ctx.restore();

      // Gold border
      ctx.save();
      const goldGrad = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
      goldGrad.addColorStop(0, '#FFD700');
      goldGrad.addColorStop(0.5, '#FFA500');
      goldGrad.addColorStop(1, '#B8860B');
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(faceX, faceY, faceW, faceH, 20);
      } else {
        ctx.rect(faceX, faceY, faceW, faceH);
      }
      ctx.stroke();
      ctx.restore();

      // Film grain
      const grainCanvas = document.createElement('canvas');
      grainCanvas.width = 1080;
      grainCanvas.height = 1920;
      const grainCtx = grainCanvas.getContext('2d');
      const grainData = grainCtx.createImageData(1080, 1920);
      for (let i = 0; i < grainData.data.length; i += 4) {
        const val = 128 + (Math.random() - 0.5) * 40;
        grainData.data[i] = val;
        grainData.data[i + 1] = val;
        grainData.data[i + 2] = val;
        grainData.data[i + 3] = 25;
      }
      grainCtx.putImageData(grainData, 0, 0);
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // ============ TOP: LEFT BRAND + LOGO TOP-RIGHT ============
      // Left small brand
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('Quttr Style', 48, 78);

      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText(selectedCeleb.name, 48, 108);

      // Logo TOP-RIGHT
      if (logoImage) {
        const logoMaxW = 160;
        const logoMaxH = 80;
        const lw = logoImage.width;
        const lh = logoImage.height;
        const scale = Math.min(logoMaxW / lw, logoMaxH / lh);
        const drawW = lw * scale;
        const drawH = lh * scale;
        const logoX = 1080 - drawW - 48;
        const logoY = 40;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 15;
        ctx.drawImage(logoImage, logoX, logoY, drawW, drawH);
        ctx.restore();
      }

      // ============ DIALOGUE SECTION (no style name) ============
      ctx.textAlign = 'center';

      // Opening quote mark
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '900 100px "Playfair Display", serif';
      ctx.globalAlpha = 0.35;
      ctx.fillText('"', 180, 1440);
      ctx.globalAlpha = 1;

      // Handwritten dialogue
      ctx.fillStyle = '#FFF8E7';
      ctx.font = '700 46px "Caveat", cursive';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 10;
      const lineCount = drawWrapped(ctx, activeDialogue, 540, 1440, 820, 58);
      ctx.shadowBlur = 0;

      // Closing quote
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '900 100px "Playfair Display", serif';
      ctx.globalAlpha = 0.35;
      ctx.fillText('"', 880, 1440 + (lineCount - 1) * 58);
      ctx.globalAlpha = 1;

      // Divider
      const dividerY = 1440 + lineCount * 58 + 40;
      const divGrad = ctx.createLinearGradient(240, 0, 840, 0);
      divGrad.addColorStop(0, 'transparent');
      divGrad.addColorStop(0.5, '#FFD700');
      divGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = divGrad;
      ctx.fillRect(240, dividerY, 600, 1);

      // Diamond
      ctx.fillStyle = '#FFD700';
      ctx.save();
      ctx.translate(540, dividerY);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();

      // Celebrity name below quote
      ctx.fillStyle = '#FFD700';
      ctx.font = 'italic 600 28px "Playfair Display", serif';
      ctx.fillText('— ' + selectedCeleb.name, 540, dividerY + 45);

      // ============ CTA BUTTON ============
      const btnY = dividerY + 90;
      const btnGrad = ctx.createLinearGradient(240, btnY, 840, btnY + 60);
      btnGrad.addColorStop(0, '#FFD700');
      btnGrad.addColorStop(1, '#FFA500');
      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(240, btnY, 600, 65, 32);
      } else {
        ctx.rect(240, btnY, 600, 65);
      }
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = '900 28px "Bebas Neue", Impact, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('✂  BOOK  ON  QUTTR  APP  ✂', 540, btnY + 43);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '500 22px "Playfair Display", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('quttr.com/style', 540, btnY + 105);

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
          title: 'My Quttr Style',
          text: 'Check out my ' + selectedCeleb.name + ' style! 🔥 Try yours: https://quttr.com/style',
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

  const filtered =
    activeTab === 'All'
      ? CELEBRITIES
      : CELEBRITIES.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-8">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xs px-4 py-1.5 rounded-full mb-3 tracking-widest">
          ★ QUTTR PREMIUM POSTER ★
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight" style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '3px' }}>
          BECOME A <span className="text-yellow-400">CELEBRITY</span>
        </h1>
        <p className="text-slate-400 mt-3" style={{ fontFamily: 'Caveat, cursive', fontSize: 24 }}>
          Upload your photo → Get an ultra-premium celebrity poster
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2 transition"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="font-semibold text-sm">Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center gap-2 transition"
                >
                  <span className="text-3xl">📸</span>
                  <span className="font-semibold text-sm">Take Selfie</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border-2 border-yellow-500" />
                <button
                  type="button"
                  onClick={captureSelfie}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 font-black py-4 rounded-xl text-lg"
                >
                  📸 CAPTURE PHOTO
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <p className="text-xs text-slate-500 mt-2 text-center">
              💡 Tip: Use a well-lit front-facing photo for best results
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-3 tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              STEP 2 — CHOOSE CELEBRITY
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {['All', 'Cricketers', 'Bollywood', 'South Stars'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={
                    'px-4 py-2 rounded-full text-xs font-black tracking-wider whitespace-nowrap transition ' +
                    (activeTab === cat
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
                  }
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
                  className={
                    'p-4 rounded-2xl cursor-pointer border-2 transition ' +
                    (selectedCeleb.id === celeb.id
                      ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-600')
                  }
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
              🎲 SHUFFLE CELEBRITY DIALOGUE
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
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: 22 }} className="text-slate-400">
                Upload a photo to see the magic ✨
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/90 rounded-3xl flex flex-col items-center justify-center border border-yellow-500/40">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-yellow-400 font-black tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
                    {loadingText}
                  </p>
                </div>
              )}
              {generatedCardUrl && (
                <img
                  src={generatedCardUrl}
                  alt="Quttr Style"
                  className="w-full rounded-3xl border border-yellow-500/20 shadow-[0_0_80px_rgba(250,204,21,0.15)]"
                />
              )}
              {generatedCardUrl && !isProcessing && (
                <button
                  type="button"
                  onClick={shareCard}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black py-5 rounded-2xl shadow-2xl text-lg tracking-wider transition"
                  style={{ fontFamily: 'Bebas Neue' }}
                >
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
