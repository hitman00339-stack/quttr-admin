// src/app/style/page.js
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
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Set initial random dialogue on celeb select
  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
  }, [selectedCeleb]);

  const pickRandomDialogue = (celeb) => {
    const randomIndex = Math.floor(Math.random() * celeb.dialogues.length);
    setActiveDialogue(celeb.dialogues[randomIndex]);
  };

  // Handle File Upload from Gallery
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Live Webcam / Front Camera
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or unavailable. Please upload a photo.');
      setCameraActive(false);
    }
  };

  // Capture Photo from Camera
  const captureSelfie = () => {
    const video = videoRef.current;
    if (video) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth || 640;
      tempCanvas.height = video.videoHeight || 480;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const dataUrl = tempCanvas.toDataURL('image/png');
      setSelectedImage(dataUrl);

      // Stop camera stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }
  };

  // Generate 9:16 High-Res Share Card on HTML5 Canvas (100% Client-Side & Free)
  const generateQuttrCard = () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 9:16 Story aspect ratio (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImage;

    img.onload = () => {
      // 1. Draw Cinematic Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, selectedCeleb.bgGradient[0]);
      grad.addColorStop(1, selectedCeleb.bgGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Draw Subtle Pattern Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1920; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1080, i + 200);
        ctx.stroke();
      }

      // 3. Header Branding
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('QUTTR STYLE ✂️', 70, 110);

      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.font = '600 28px sans-serif';
      ctx.fillText('CELEBRITY EDITION', 70, 150);

      // 4. Draw User's Real Face with "Quttr Vector/Artistic Filter"
      const avatarBoxY = 220;
      const avatarBoxHeight = 980;

      ctx.save();
      // Rounded card box with border
      ctx.beginPath();
      ctx.roundRect(70, avatarBoxY, 940, avatarBoxHeight, 40);
      ctx.clip();

      // Apply Filter to image to create Quttr Illustration Style while preserving real face
      ctx.filter = 'contrast(125%) saturate(135%) brightness(105%) sepia(10%)';
      
      // Calculate crop to maintain center face alignment
      const scale = Math.max(940 / img.width, avatarBoxHeight / img.height);
      const x = (940 - img.width * scale) / 2 + 70;
      const y = (avatarBoxHeight - img.height * scale) / 2 + avatarBoxY;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // Avatar Border Glow
      ctx.strokeStyle = selectedCeleb.themeColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(70, avatarBoxY, 940, avatarBoxHeight, 40);
      ctx.stroke();

      // 5. Celebrity Style Badge
      ctx.fillStyle = selectedCeleb.themeColor;
      ctx.beginPath();
      ctx.roundRect(100, 1240, 880, 100, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'black 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedCeleb.styleName.toUpperCase(), 540, 1305);

      // 6. Dialogue Quote Box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(100, 1370, 880, 260, 25);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FCE7F3'; // Soft light pink
      ctx.font = 'italic 500 40px sans-serif';
      ctx.textAlign = 'center';

      // Wrap Dialogue text into lines
      const words = `"${activeDialogue}"`.split(' ');
      let line = '';
      let lineY = 1450;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > 800 && n > 0) {
          ctx.fillText(line, 540, lineY);
          line = words[n] + ' ';
          lineY += 55;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 540, lineY);

      // Author tag
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`— Style: ${selectedCeleb.name}`, 540, 1580);

      // 7. Bottom App Promotion CTA
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Want this look in real life? 💈', 540, 1690);

      ctx.fillStyle = '#FACC15'; // Yellow
      ctx.font = '600 32px sans-serif';
      ctx.fillText('Book top barbers near you on Quttr App', 540, 1740);

      // Short URL Tag
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 28px sans-serif';
      ctx.fillText('Try yours at quttr.in/style', 540, 1830);

      // Export Canvas to Image URL
      const cardDataUrl = canvas.toDataURL('image/png');
      setGeneratedCardUrl(cardDataUrl);
      setIsProcessing(false);
    };
  };

  // Re-generate card whenever photo or celeb or dialogue changes
  useEffect(() => {
    if (selectedImage) {
      generateQuttrCard();
    }
  }, [selectedImage, selectedCeleb, activeDialogue]);

  // Native Mobile Web Share API for 1-Tap WhatsApp & Instagram Story
  const shareCard = async () => {
    if (!generatedCardUrl) return;

    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-style.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My ${selectedCeleb.styleName} in Quttr Style!`,
          text: `Check out my ${selectedCeleb.name} style avatar! Get yours at quttr.in/style 💈🔥`
        });
      } else {
        // Fallback: Download Image
        const link = document.createElement('a');
        link.href = generatedCardUrl;
        link.download = `quttr-${selectedCeleb.id}-style.png`;
        link.click();
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const filteredCelebs = activeTab === 'All' 
    ? CELEBRITIES 
    : CELEBRITIES.filter(c => c.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8">
      {/* Hidden Working Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-gradient-to-r from-amber-500 to-rose-500 text-black font-extrabold text-xs tracking-widest px-3 py-1 rounded-full uppercase mb-2">
          Quttr Style Generator
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          See Yourself In <span className="text-amber-400">Celebrity Style</span> ✂️
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Upload photo → Pick celebrity → Get stylized card with iconic dialogues!
        </p>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Input */}
        <div className="space-y-6 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
          
          {/* STEP 1: PHOTO INPUT */}
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
              <span>1.</span> Select Your Photo
            </h2>

            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 text-center font-semibold text-sm transition flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🖼️</span> Upload Photo
                </button>

                <button
                  onClick={startCamera}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 text-center font-semibold text-sm transition flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">📸</span> Take Selfie
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border border-amber-500" />
                <button
                  onClick={captureSelfie}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl"
                >
                  Capture Photo 📸
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* STEP 2: CELEBRITY SELECTOR */}
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
              <span>2.</span> Choose Celebrity Style
            </h2>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
              {['All', 'Cricketers', 'Bollywood', 'South Stars'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === cat 
                      ? 'bg-amber-400 text-black' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Celeb Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {filteredCelebs.map((celeb) => (
                <div
                  key={celeb.id}
                  onClick={() => setSelectedCeleb(celeb)}
                  className={`p-3 rounded-2xl cursor-pointer border text-left transition ${
                    selectedCeleb.id === celeb.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{celeb.name}</div>
                  <div className="text-xs text-amber-400 font-medium">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: RANDOM DIALOGUE RE-ROLL */}
          {selectedImage && (
            <div className="pt-2">
              <button
                onClick={() => pickRandomDialogue(selectedCeleb)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <span>🎲</span> Shuffle Celebrity Dialogue
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Generated Share Card Preview */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {!selectedImage ? (
            <div className="w-full aspect-[9/16] max-w-sm bg-slate-900 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <span className="text-5xl mb-3">✂️</span>
              <p className="text-sm font-medium">
                Upload your photo or take a selfie to generate your 9:16 Quttr Style Share Card!
              </p>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              {isProcessing ? (
                <div className="w-full aspect-[9/16] bg-slate-900 rounded-3xl flex items-center justify-center text-amber-400 font-bold">
                  Styling your avatar... ✂️
                </div>
              ) : (
                <>
                  {/* Generated Card Output */}
                  <img
                    src={generatedCardUrl}
                    alt="Quttr Style Card"
                    className="w-full rounded-3xl shadow-2xl border border-slate-800"
                  />

                  {/* Share Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={shareCard}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base transition"
                    >
                      <span>📤</span> Share to WhatsApp / Instagram
                    </button>
                    <p className="text-center text-xs text-slate-500">
                      Instantly posts 9:16 high-res story card with Quttr App download link!
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
