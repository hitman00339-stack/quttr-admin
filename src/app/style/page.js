// src/app/style/page.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import imglyRemoveBackground from '@imgly/background-removal';
import { CELEBRITIES } from '@/lib/celebrities';

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null); // Holds BG-removed image
  const [selectedCeleb, setSelectedCeleb] = useState(CELEBRITIES[0]);
  const [activeDialogue, setActiveDialogue] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  
  // Status states
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

  // Process image when uploaded (Remove Background)
  const handleImageInput = async (dataUrl) => {
    setSelectedImage(dataUrl);
    setIsProcessing(true);
    setLoadingText('Removing background using AI... ✂️');

    try {
      // Convert DataURL to Blob for imgly
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Remove Background (runs locally in browser!)
      const bgRemovedBlob = await imglyRemoveBackground(blob);
      const bgRemovedUrl = URL.createObjectURL(bgRemovedBlob);
      
      setProcessedImage(bgRemovedUrl);
    } catch (error) {
      console.error("BG Removal failed, using original", error);
      setProcessedImage(dataUrl); // Fallback to original if it fails
    }
    
    setIsProcessing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleImageInput(event.target.result);
      };
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

  // Generate 9:16 High-Res CINEMATIC Poster
  const generateQuttrCard = () => {
    if (!processedImage) return;
    setIsProcessing(true);
    setLoadingText('Applying Cinematic Style... 🎬');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = processedImage; // Uses the image with BACKGROUND REMOVED

    img.onload = () => {
      // 1. Draw Cinematic Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGrad.addColorStop(0, selectedCeleb.bgGradient[0]);
      bgGrad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Add dramatic radial glow behind the user
      const glow = ctx.createRadialGradient(540, 960, 100, 540, 960, 800);
      glow.addColorStop(0, `${selectedCeleb.themeColor}88`); // 50% opacity
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Draw User Image (Scaled beautifully to fit poster)
      ctx.save();
      // Calculate scale to make user large and centered at bottom
      const scale = Math.max(1080 / img.width, 1400 / img.height);
      const x = (1080 - img.width * scale) / 2;
      const y = 1920 - (img.height * scale) - 200; // Pin to bottom area
      
      // Apply stylistic color grading (High contrast, slight desaturation)
      ctx.filter = 'contrast(130%) saturate(80%) brightness(90%) drop-shadow(0px 0px 40px rgba(0,0,0,0.8))';
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      // 3. Apply "Duotone" Blend Mode Overlay to make it look like movie lighting
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.globalAlpha = 0.3; // 30% tint of the celebrity color
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
      ctx.restore();

      // 4. Draw Vignette (Dark edges) & Bottom Fade (For text readability)
      const vignette = ctx.createLinearGradient(0, 1000, 0, 1920);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(0.5, 'rgba(0,0,0,0.8)');
      vignette.addColorStop(1, '#000000');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 1080, 1920);

      const topVignette = ctx.createLinearGradient(0, 0, 0, 400);
      topVignette.addColorStop(0, 'rgba(0,0,0,0.9)');
      topVignette.addColorStop(1, 'transparent');
      ctx.fillStyle = topVignette;
      ctx.fillRect(0, 0, 1080, 400);

      // 5. Typography & Branding
      ctx.textAlign = 'center';
      
      // Top Branding
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 45px sans-serif';
      ctx.fillText('QUTTR STYLE ✂️', 540, 120);
      
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = 'bold 28px sans-serif';
      ctx.letterSpacing = '5px';
      ctx.fillText('CELEBRITY EDITION', 540, 170);

      // 6. Style Name Title (Massive Movie Font style)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 90px impact, sans-serif';
      ctx.shadowColor = selectedCeleb.themeColor;
      ctx.shadowBlur = 30;
      ctx.fillText(selectedCeleb.styleName.toUpperCase(), 540, 1350);
      ctx.shadowBlur = 0; // Reset shadow

      // 7. Dialogue Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = selectedCeleb.themeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 1420, 920, 240, 30);
      ctx.fill();
      ctx.stroke();

      // Golden Quotes Icon
      ctx.fillStyle = '#FACC15';
      ctx.font = '900 80px serif';
      ctx.fillText('"', 150, 1500);

      // Dialogue Text Wrap
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 600 45px sans-serif';
      const words = activeDialogue.split(' ');
      let line = '';
      let lineY = 1510;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > 750 && n > 0) {
          ctx.fillText(line, 540, lineY);
          line = words[n] + ' ';
          lineY += 60;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 540, lineY);

      // Author Name
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`— Style: ${selectedCeleb.name}`, 540, 1620);

      // 8. Call to Action (Footer)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Want this look in real life? 💈', 540, 1750);
      ctx.fillStyle = '#FACC15';
      ctx.font = '800 32px sans-serif';
      ctx.fillText('Book top barbers on Quttr App', 540, 1800);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '24px sans-serif';
      ctx.fillText('quttr.in/style', 540, 1860);

      // Save Output
      setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.9));
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
      const file = new File([blob], 'quttr-style.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${selectedCeleb.styleName} in Quttr Style!`,
          text: `Check out my ${selectedCeleb.name} style avatar! Get yours at quttr.in/style 💈🔥`
        });
      } else {
        const link = document.createElement('a');
        link.href = generatedCardUrl;
        link.download = `quttr-${selectedCeleb.id}-style.jpg`;
        link.click();
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const filteredCelebs = activeTab === 'All' ? CELEBRITIES : CELEBRITIES.filter(c => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-4 md:p-8">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          See Yourself In <span className="text-amber-400">Celebrity Style</span> ✂️
        </h1>
        <p className="text-slate-400 mt-2">Upload photo → Pick celebrity → Get cinematic poster!</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          
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
                <button onClick={captureSelfie} className="w-full bg-rose-600 font-bold py-3 rounded-xl">Capture 📸</button>
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

        {/* RIGHT COLUMN: Poster Preview */}
        <div className="flex flex-col items-center justify-center">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-md bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <span className="text-6xl mb-4">✂️</span>
              <p>Upload a photo to see your cinematic avatar.</p>
            </div>
          ) : (
            <div className="w-full max-w-md relative group">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center border border-amber-500/50">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-amber-400 font-bold animate-pulse">{loadingText}</p>
                </div>
              )}
              
              {generatedCardUrl && (
                <img src={generatedCardUrl} alt="Poster" className="w-full rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800" />
              )}
              
              {generatedCardUrl && !isProcessing && (
                <button onClick={shareCard} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-[1.02] active:scale-95 text-black font-extrabold py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-lg transition-all duration-300">
                  <span>📤</span> Share to Story / Status
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
