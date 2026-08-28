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

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all([
          document.fonts.load('700 48px Caveat'),
          document.fonts.load('700 40px Kalam'),
          document.fonts.load('40px Permanent Marker'),
        ]);
      } catch (e) {}
      setFontsReady(true);
    };
    loadFonts();
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
    reader.onload = (ev) => {
      setSelectedImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
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
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;
    c.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = c.toDataURL('image/png');
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
    setSelectedImage(dataUrl);
  };

  // Quttr Style = cartoon / Ghibli-like (cel shade + ink edges) — 100% free, no packages
  const applyQuttrGhibliStyle = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const levels = 5;
    const factor = 255 / (levels - 1);

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 15) continue;
      let r = Math.min(255, d[i] * 1.18 + 18);
      let g = Math.min(255, d[i + 1] * 1.06 + 8);
      let b = Math.min(255, d[i + 2] * 0.88);
      // soft boost for midtones (skin-friendly)
      r = Math.round(r / factor) * factor;
      g = Math.round(g / factor) * factor;
      b = Math.round(b / factor) * factor;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }

    const gray = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      const i = (y * w + x) * 4;
      return copy[i] * 0.299 + copy[i + 1] * 0.587 + copy[i + 2] * 0.114;
    };

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] < 15) continue;
        const gx =
          -gray(x - 1, y - 1) + gray(x + 1, y - 1) -
          2 * gray(x - 1, y) + 2 * gray(x + 1, y) -
          gray(x - 1, y + 1) + gray(x + 1, y + 1);
        const gy =
          -gray(x - 1, y - 1) - 2 * gray(x, y - 1) - gray(x + 1, y - 1) +
          gray(x - 1, y + 1) + 2 * gray(x, y + 1) + gray(x + 1, y + 1);
        const edge = Math.sqrt(gx * gx + gy * gy);
        if (edge > 48) {
          d[i] = Math.max(0, d[i] - 170);
          d[i + 1] = Math.max(0, d[i + 1] - 170);
          d[i + 2] = Math.max(0, d[i + 2] - 170);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const drawWrapped = (ctx, text, x, y, maxW, lh) => {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxW && n > 0) {
        ctx.fillText(line.trim(), x, cy);
        line = words[n] + ' ';
        cy += lh;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
  };

  const generateCard = async () => {
    if (!selectedImage || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Creating Quttr Ghibli Style... 🎨');

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
      // cinematic bg
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, selectedCeleb.bgGradient[0]);
      grad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      const glow = ctx.createRadialGradient(540, 820, 40, 540, 820, 720);
      glow.addColorStop(0, selectedCeleb.themeColor + '99');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1920);

      // draw face on offscreen + cartoonify
      const maxSide = 900;
      const scale0 = Math.min(maxSide / img.width, maxSide / img.height, 1);
      const ow = Math.max(2, Math.floor(img.width * scale0));
      const oh = Math.max(2, Math.floor(img.height * scale0));
      const off = document.createElement('canvas');
      off.width = ow;
      off.height = oh;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, ow, oh);
      applyQuttrGhibliStyle(octx, ow, oh);

      // place avatar
      const scale = Math.max(980 / ow, 1200 / oh);
      const dx = (1080 - ow * scale) / 2;
      const dy = 1920 - oh * scale - 240;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 35;
      ctx.drawImage(off, dx, dy, ow * scale, oh * scale);
      // soft color wash (poster look)
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.fillRect(0, 300, 1080, 1100);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      // vignette bottom
      const vig = ctx.createLinearGradient(0, 1050, 0, 1920);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(0.45, 'rgba(0,0,0,0.88)');
      vig.addColorStop(1, '#000');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, 1080, 1920);

      const topV = ctx.createLinearGradient(0, 0, 0, 280);
      topV.addColorStop(0, 'rgba(0,0,0,0.75)');
      topV.addColorStop(1, 'transparent');
      ctx.fillStyle = topV;
      ctx.fillRect(0, 0, 1080, 280);

      ctx.textAlign = 'center';

      // brand
      ctx.fillStyle = '#fff';
      ctx.font = '900 40px system-ui, sans-serif';
      ctx.fillText('QUTTR STYLE', 540, 100);
      ctx.fillStyle = '#FACC15';
      ctx.font = '700 28px Kalam, cursive';
      ctx.fillText('Ghibli Celebrity Edition', 540, 150);

      // HANDSTYLE title
      const title = selectedCeleb.styleName.toUpperCase();
      ctx.save();
      ctx.font = '84px Permanent Marker, cursive';
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#000';
      ctx.shadowColor = selectedCeleb.themeColor;
      ctx.shadowBlur = 22;
      ctx.strokeText(title, 540, 1340);
      ctx.fillStyle = '#fff';
      ctx.fillText(title, 540, 1340);
      ctx.restore();

      // dialogue box
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeStyle = selectedCeleb.themeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(70, 1390, 940, 260, 24);
      } else {
        ctx.rect(70, 1390, 940, 260);
      }
      ctx.fill();
      ctx.stroke();

      // HANDWRITTEN dialogue
      ctx.fillStyle = '#FFF7ED';
      ctx.font = '700 50px Caveat, cursive';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 6;
      drawWrapped(ctx, '"' + activeDialogue + '"', 540, 1485, 820, 56);
      ctx.shadowBlur = 0;

      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '700 32px Kalam, cursive';
      ctx.fillText('— ' + selectedCeleb.name, 540, 1625);

      // CTA
      ctx.fillStyle = '#fff';
      ctx.font = '700 34px Kalam, cursive';
      ctx.fillText('Want this look in real life?', 540, 1740);
      ctx.fillStyle = '#FACC15';
      ctx.font = '700 30px Kalam, cursive';
      ctx.fillText('Book barbers on Quttr App', 540, 1790);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 24px system-ui, sans-serif';
      ctx.fillText('quttr.com/style', 540, 1850);

      setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.92));
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
  }, [selectedImage, selectedCeleb, activeDialogue, fontsReady]);

  const shareCard = async () => {
    if (!generatedCardUrl) return;
    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-style.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Quttr Style',
          text:
            'Mera Quttr Ghibli Style — ' +
            selectedCeleb.name +
            '! Try yours: https://quttr.com/style',
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
    <div className="min-h-screen bg-[#07070a] text-white p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-amber-400 text-black font-extrabold text-xs px-3 py-1 rounded-full mb-2">
          QUTTR GHIBLI ENGINE
        </div>
        <h1 className="text-3xl md:text-5xl font-black">
          See Yourself In <span className="text-amber-400">Quttr Style</span>
        </h1>
        <p className="text-slate-400 mt-2" style={{ fontFamily: 'Caveat, cursive', fontSize: 22 }}>
          Upload photo → Cartoon Ghibli look → Handstyle celebrity poster
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3">1. Select Your Photo</h2>
            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🖼️</span> Upload Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📸</span> Take Selfie
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
                <button
                  type="button"
                  onClick={captureSelfie}
                  className="w-full bg-rose-600 font-bold py-3 rounded-xl"
                >
                  Capture Photo
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
          </div>

          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3">2. Choose Celebrity Style</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {['All', 'Cricketers', 'Bollywood', 'South Stars'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={
                    'px-4 py-1.5 rounded-full text-xs font-semibold ' +
                    (activeTab === cat ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-300')
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {filtered.map((celeb) => (
                <div
                  key={celeb.id}
                  onClick={() => setSelectedCeleb(celeb)}
                  className={
                    'p-4 rounded-2xl cursor-pointer border-2 ' +
                    (selectedCeleb.id === celeb.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-transparent bg-slate-800/80')
                  }
                >
                  <div className="font-bold text-sm">{celeb.name}</div>
                  <div className="text-xs text-amber-400 mt-1">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedImage && (
            <button
              type="button"
              onClick={() => pickRandomDialogue(selectedCeleb)}
              className="w-full bg-slate-800 border border-slate-700 py-3 rounded-xl text-sm font-bold"
            >
              🎲 Shuffle Celebrity Dialogue
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md rounded-3xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 p-6 text-center">
              Upload a photo to generate your handstyle Quttr poster
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/80 rounded-3xl flex flex-col items-center justify-center border border-amber-500/40">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-amber-400 font-bold">{loadingText}</p>
                </div>
              )}
              {generatedCardUrl && (
                <img
                  src={generatedCardUrl}
                  alt="Quttr Style"
                  className="w-full rounded-3xl border border-slate-800"
                />
              )}
              {generatedCardUrl && !isProcessing && (
                <button
                  type="button"
                  onClick={shareCard}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-extrabold py-4 rounded-2xl"
                >
                  📤 Share to WhatsApp / Instagram
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
