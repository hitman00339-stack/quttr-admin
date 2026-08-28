// src/app/style/page.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import imglyRemoveBackground from '@imgly/background-removal';
import { CELEBRITIES } from '@/lib/celebrities';

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(CELEBRITIES[0]);
  const [activeDialogue, setActiveDialogue] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
  }, [selectedCeleb]);

  const pickRandomDialogue = (celeb) => {
    const randomIndex = Math.floor(Math.random() * celeb.dialogues.length);
    setActiveDialogue(celeb.dialogues[randomIndex]);
  };

  // Step 1: Remove Background
  const handleImageInput = async (dataUrl) => {
    setSelectedImage(dataUrl);
    setIsProcessing(true);
    setLoadingText('Removing Background... ✂️');

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Remove Background locally
      const bgRemovedBlob = await imglyRemoveBackground(blob);
      const bgRemovedUrl = URL.createObjectURL(bgRemovedBlob);
      
      setProcessedImage(bgRemovedUrl);
    } catch (error) {
      console.error("BG Removal failed, using original", error);
      setProcessedImage(dataUrl);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleImageInput(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access denied. Please upload a photo.');
      setCameraActive(false);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (video) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth || 640;
      tempCanvas.height = video.videoHeight || 480;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const dataUrl = tempCanvas.toDataURL('image/png');
      
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
      setCameraActive(false);

      handleImageInput(dataUrl);
    }
  };

  // Step 2: GHIBLI / ANIME CARTOONIFICATION SHADER ENGINE
  const applyGhibliCartoonShader = (ctx, width, height) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const copyData = new Uint8ClampedArray(data);

    const levels = 5; // Color banding levels for cel-shading
    const factor = 255 / (levels - 1);

    // Pass 1: Posterization & Ghibli Warmth Filter
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue; // Skip transparent pixels

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Ghibli Warm Color Palette Shift
      r = Math.min(255, r * 1.15 + 15);
      g = Math.min(255, g * 1.05 + 5);
      b = Math.min(255, b * 0.90);

      // Cel-shading (Quantize colors to flat anime bands)
      r = Math.round(r / factor) * factor;
      g = Math.round(g / factor) * factor;
      b = Math.round(b / factor) * factor;

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Pass 2: Sobel Edge Detection (Anime Outline Ink Lines)
    const getGray = (x, y) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      const idx = (y * width + x) * 4;
      return (copyData[idx] * 0.299 + copyData[idx + 1] * 0.587 + copyData[idx + 2] * 0.114);
    };

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] < 10) continue;

        // Sobel Kernels for Edge Strength
        const gx = 
          -1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) +
          -2 * getGray(x - 1, y)     + 2 * getGray(x + 1, y) +
          -1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1);

        const gy = 
          -1 * getGray(x - 1, y - 1) - 2 * getGray(x, y - 1) - 1 * getGray(x + 1, y - 1) +
           1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1);

        const edge = Math.sqrt(gx * gx + gy * gy);

        // If edge detected, draw dark anime line stroke
        if (edge > 45) {
          data[idx] = Math.max(0, data[idx] - 180);     // R
          data[idx + 1] = Math.max(0, data[idx + 1] - 180); // G
          data[idx + 2] = Math.max(0, data[idx + 2] - 180); // B
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Step 3: Composite Final Cinematic 9:16 Share Card
  const generateQuttrCard = () => {
    if (!processedImage) return;
    setIsProcessing(true);
    setLoadingText('Converting to Quttr Ghibli Style... 🎨');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = processedImage;

    img.onload = () => {
      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGrad.addColorStop(0, selectedCeleb.bgGradient[0]);
      bgGrad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Radial Glow
      const glow = ctx.createRadialGradient(540, 800, 50, 540, 800, 700);
      glow.addColorStop(0, `${selectedCeleb.themeColor}aa`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Offscreen Canvas for Ghibli Transformation
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(img, 0, 0);

      // Apply Ghibli Cartoon Engine to User's Face
      applyGhibliCartoonShader(offCtx, img.width, img.height);

      // 3. Draw Stylized Ghibli Avatar onto Main Poster
      const scale = Math.max(1000 / img.width, 1300 / img.height);
      const x = (1080 - img.width * scale) / 2;
      const y = 1920 - (img.height * scale) - 220;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 40;
      ctx.drawImage(offCanvas, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // 4. Dark Bottom Vignette (Text Readability)
      const vignette = ctx.createLinearGradient(0, 1100, 0, 1920);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(0.4, 'rgba(0,0,0,0.85)');
      vignette.addColorStop(1, '#000000');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 1080, 1920);

      // 5. Header Branding
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px sans-serif';
      ctx.fillText('QUTTR STYLE ✂️', 540, 110);

      ctx.fillStyle = '#FACC15';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('GHIBLI CELEBRITY EDITION', 540, 155);

      // 6. Style Name Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 85px impact, sans-serif';
      ctx.shadowColor = selectedCeleb.themeColor;
      ctx.shadowBlur = 25;
      ctx.fillText(selectedCeleb.styleName.toUpperCase(), 540, 1360);
      ctx.shadowBlur = 0;

      // 7. Dialogue Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = selectedCeleb.themeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 1430, 920, 230, 25);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 600 42px sans-serif';
      const words = `"${activeDialogue}"`.split(' ');
      let line = '';
      let lineY = 1510;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > 780 && n > 0) {
          ctx.fillText(line, 540, lineY);
          line = words[n] + ' ';
          lineY += 55;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 540, lineY);

      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`— Style: ${selectedCeleb.name}`, 540, 1620);

      // 8. Footer Promotion
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('Want this look in real life? 💈', 540, 1745);
      ctx.fillStyle = '#FACC15';
      ctx.font = '800 30px sans-serif';
      ctx.fillText('Book top barbers on Quttr App', 540, 1790);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '24px sans-serif';
      ctx.fillText('quttr.in/style', 540, 1850);

      setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.92));
      setIsProcessing(false);
    };
  };

  useEffect(() => {
    if (processedImage) generateQuttrCard();
  }, [processedImage, selectedCeleb, activeDialogue]);

  const shareCard = async () => {
    if (!generatedCardUrl) return;
    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-ghibli-style.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${selectedCeleb.styleName} in Quttr Style!`,
          text: `Check out my ${selectedCeleb.name} Ghibli avatar! Get yours at quttr.in/style 💈🔥`
        });
      } else {
        const link = document.createElement('a');
        link.href = generatedCardUrl;
        link.download = `quttr-${selectedCeleb.id}-ghibli-style.jpg`;
        link.click();
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const filteredCelebs = activeTab === 'All' ? CELEBRITIES : CELEBRITIES.filter(c => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-sans p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-amber-400 text-black font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          Quttr Ghibli Engine 🎨
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          See Yourself In <span className="text-amber-400">Quttr Anime Style</span> ✂️
        </h1>
        <p className="text-slate-400 mt-2">Upload photo → Auto-Convert to Ghibli Style → Share Poster!</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3">1. Select Your Photo</h2>
            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileInputRef.current.click()} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2 transition">
                  <span className="text-2xl">🖼️</span> Upload Photo
                </button>
                <button onClick={startCamera} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2 transition">
                  <span className="text-2xl">📸</span> Take Selfie
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
                <button onClick={captureSelfie} className="w-full bg-rose-600 font-bold py-3 rounded-xl">Capture Photo 📸</button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3">2. Choose Celebrity Style</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
              {['All', 'Cricketers', 'Bollywood', 'South Stars'].map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${activeTab === cat ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
              {filteredCelebs.map((celeb) => (
                <div key={celeb.id} onClick={() => setSelectedCeleb(celeb)} className={`p-4 rounded-2xl cursor-pointer border-2 transition ${selectedCeleb.id === celeb.id ? 'border-amber-400 bg-amber-400/10' : 'border-transparent bg-slate-800/80 hover:bg-slate-700'}`}>
                  <div className="font-bold text-sm text-white">{celeb.name}</div>
                  <div className="text-xs text-amber-400 font-medium mt-1">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {processedImage && (
            <button onClick={() => pickRandomDialogue(selectedCeleb)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <span>🎲</span> Shuffle Celebrity Dialogue
            </button>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col items-center justify-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <span className="text-6xl mb-4">🎨</span>
              <p>Upload your photo to transform into Ghibli Quttr Style!</p>
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-amber-500/50">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-amber-400 font-bold animate-pulse text-center px-4">{loadingText}</p>
                </div>
              )}
              
              {generatedCardUrl && (
                <img src={generatedCardUrl} alt="Ghibli Poster" className="w-full rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-800" />
              )}
              
              {generatedCardUrl && !isProcessing && (
                <button onClick={shareCard} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-extrabold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg hover:scale-[1.02] active:scale-95 transition">
                  <span>📤</span> Share Ghibli Card to WhatsApp / Instagram
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
