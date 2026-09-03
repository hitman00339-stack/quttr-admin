'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CELEBRITIES as IMPORTED_CELEBS } from '@/lib/celebrities';

// ═══════════════════════════════════════════════════════════
// FESTIVAL & GREETING TEMPLATES
// ═══════════════════════════════════════════════════════════
const NEW_CATEGORIES = [
  {
    id: 'janmashtami',
    name: 'जन्माष्टमी',
    styleName: 'Krishna Janmashtami',
    category: 'Festivals',
    icon: '🦚',
    theme: 'divine',
    themeColor: '#0EA5E9',
    accentColor: '#FFD700',
    bgGradient: ['#0A0E27', '#1E1B4B', '#4C1D95', '#7C2D12'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'जय श्री कृष्ण',
    subHeading: 'Happy Janmashtami',
    dialogues: [
      'मुरली मनोहर, गोपी मनोरम, यमुना के तट पर जिनका डेरा।\n{name} की ओर से हैप्पी जन्माष्टमी 🦚',
      'हाथी घोड़ा पालकी, जय कन्हैया लाल की!\n{name} के परिवार की ओर से शुभकामनाएँ।',
      'माखन चोर नंद किशोर, बांधी जिसने प्रीत की डोर।\nशुभ जन्माष्टमी — {name}',
      'नटखट कान्हा आए द्वार, लेकर बांसुरी की मधुर पुकार।\nJai Shree Krishna — {name}',
      'May Lord Krishna steal all your worries.\nHappy Janmashtami from {name} 🪈',
    ],
  },
  {
    id: 'birthday',
    name: 'Happy Birthday',
    styleName: 'जन्मदिन मुबारक',
    category: 'Greetings',
    icon: '🎂',
    theme: 'celebration',
    themeColor: '#F43F5E',
    accentColor: '#FFD700',
    bgGradient: ['#4C0519', '#831843', '#BE185D', '#9F1239'],
    requireName: true,
    supportsAge: true,
    supportsNoPhoto: false,
    heading: 'HAPPY BIRTHDAY',
    subHeading: 'जन्मदिन की शुभकामनाएँ',
    dialogues: [
      'Wishing you a magical day filled with love,\nlaughter and endless joy! 🎉',
      'जन्मदिन की अनंत शुभकामनाएँ! 🎂\nईश्वर आपको हमेशा खुश रखें।',
      'Another year of amazing you! ✨\nMay this year be your best one yet.',
      'मुस्कुराते रहो हमेशा! 🎁\nजन्मदिन बहुत बहुत मुबारक हो।',
      'Cheers to another trip around the sun! 🌟\nHave the happiest birthday ever!',
    ],
  },
  {
    id: 'diwali',
    name: 'शुभ दीपावली',
    styleName: 'Happy Diwali',
    category: 'Festivals',
    icon: '🪔',
    theme: 'divine',
    themeColor: '#F97316',
    accentColor: '#FFD700',
    bgGradient: ['#1C0A00', '#7C2D12', '#B45309', '#78350F'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'शुभ दीपावली',
    subHeading: 'Happy Diwali',
    dialogues: [
      'दीपों का त्योहार लाए खुशियों की बहार।\nशुभ दीपावली — {name} 🪔',
      'May the festival of lights brighten your life\nwith prosperity and joy! — {name}',
      'लक्ष्मी जी की कृपा बरसे आप पर।\nदीपावली मंगलमय हो — {name}',
    ],
  },
  {
    id: 'holi',
    name: 'शुभ होली',
    styleName: 'Happy Holi',
    category: 'Festivals',
    icon: '🎨',
    theme: 'celebration',
    themeColor: '#EC4899',
    accentColor: '#22D3EE',
    bgGradient: ['#3B0764', '#7E22CE', '#DB2777', '#F59E0B'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'शुभ होली',
    subHeading: 'Happy Holi',
    dialogues: [
      'रंगों की बौछार, खुशियों की बहार।\nहोली मुबारक हो — {name} 🎨',
      'May your life be as colorful as Holi! 🌈\nWishes from {name}',
    ],
  },
  {
    id: 'independence',
    name: 'स्वतंत्रता दिवस',
    styleName: 'Independence Day',
    category: 'Festivals',
    icon: '🇮🇳',
    theme: 'patriotic',
    themeColor: '#F97316',
    accentColor: '#16A34A',
    bgGradient: ['#000000', '#065F46', '#DC2626', '#F97316'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'जय हिन्द',
    subHeading: 'Happy Independence Day',
    dialogues: [
      'वंदे मातरम् 🇮🇳\nस्वतंत्रता दिवस की हार्दिक शुभकामनाएँ — {name}',
      'Salute to the heroes of our nation!\nJai Hind — {name}',
    ],
  },
  {
    id: 'rakhi',
    name: 'रक्षा बंधन',
    styleName: 'Raksha Bandhan',
    category: 'Festivals',
    icon: '🎗️',
    theme: 'divine',
    themeColor: '#DC2626',
    accentColor: '#FFD700',
    bgGradient: ['#2C0505', '#7F1D1D', '#B45309', '#F59E0B'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'रक्षा बंधन',
    subHeading: 'Happy Rakhi',
    dialogues: [
      'भाई-बहन के पवित्र बंधन को समर्पित।\nरक्षा बंधन की शुभकामनाएँ — {name} 🎗️',
      'The bond that lasts forever ✨\nHappy Raksha Bandhan — {name}',
    ],
  },
  {
    id: 'ganesh',
    name: 'गणेश चतुर्थी',
    styleName: 'Ganesh Chaturthi',
    category: 'Festivals',
    icon: '🐘',
    theme: 'divine',
    themeColor: '#DC2626',
    accentColor: '#FFD700',
    bgGradient: ['#3F0000', '#7F1D1D', '#B91C1C', '#F97316'],
    requireName: true,
    supportsNoPhoto: true,
    heading: 'गणपति बप्पा मोरया',
    subHeading: 'Ganesh Chaturthi',
    dialogues: [
      'गणपति बप्पा मोरया, मंगलमूर्ति मोरया!\nशुभकामनाएँ — {name} 🐘',
    ],
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    styleName: 'सालगिरह मुबारक',
    category: 'Greetings',
    icon: '💍',
    theme: 'celebration',
    themeColor: '#EC4899',
    accentColor: '#FFD700',
    bgGradient: ['#4C0519', '#831843', '#DB2777', '#F59E0B'],
    requireName: true,
    supportsAge: true,
    supportsNoPhoto: false,
    heading: 'Happy Anniversary',
    subHeading: 'शादी की सालगिरह मुबारक',
    dialogues: [
      'Celebrating your beautiful journey together! 💖\nHappy Anniversary',
      'सालगिरह की ढेरों शुभकामनाएँ! 💍\nEver-loving you both.',
    ],
  },
  {
    id: 'gita',
    name: 'भगवद् गीता',
    styleName: 'गीता उपदेश',
    category: 'Spiritual',
    icon: '🕉️',
    theme: 'divine',
    themeColor: '#F97316',
    accentColor: '#FFD700',
    bgGradient: ['#1C0A00', '#431407', '#7C2D12', '#B45309'],
    requireName: false,
    supportsNoPhoto: false,
    heading: 'श्रीमद् भगवद् गीता',
    subHeading: 'Divine Wisdom',
    dialogues: [
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
      'जो हुआ, वह अच्छा हुआ। जो हो रहा है, वह अच्छा हो रहा है।',
      'योग: कर्मसु कौशलम् — काम में कुशलता ही योग है।',
      'खाली हाथ आए थे, खाली हाथ जाओगे।',
      'श्रद्धावान् लभते ज्ञानम् — श्रद्धावान को ज्ञान मिलता है।',
    ],
  },
  {
    id: 'motivation',
    name: 'Success Mindset',
    styleName: 'प्रेरक विचार',
    category: 'Motivation',
    icon: '🔥',
    theme: 'cinematic',
    themeColor: '#EAB308',
    accentColor: '#F97316',
    bgGradient: ['#0C0A09', '#292524', '#78350F', '#B45309'],
    requireName: false,
    supportsNoPhoto: false,
    heading: 'RISE. GRIND. WIN.',
    subHeading: 'Mindset Matters',
    dialogues: [
      'मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है।',
      'हार हो जाती है जब मान लिया जाता है, जीत तब होती है जब ठान लिया जाता है।',
      'अगर मेहनत आदत बन जाए, तो कामयाबी मुकद्दर बन जाती है।',
      'डर के आगे जीत है।',
    ],
  },
];

const STYLE_MODES = [
  { id: 'divine', name: 'Divine', desc: 'Traditional & ornate', icon: '🕉️' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Bollywood movie style', icon: '🎬' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean & premium', icon: '✨' },
];

const ALL_CATEGORIES = [...NEW_CATEGORIES, ...(IMPORTED_CELEBS || [])];

export default function QuttrStylePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(NEW_CATEGORIES[0]);
  const [activeDialogue, setActiveDialogue] = useState('');
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userFrom, setUserFrom] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMsg, setUseCustomMsg] = useState(false);
  const [styleMode, setStyleMode] = useState('divine');
  const [noPhotoMode, setNoPhotoMode] = useState(false);

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
          document.fonts.load('700 60px "Caveat"'),
          document.fonts.load('700 40px "Kalam"'),
          document.fonts.load('900 80px "Bebas Neue"'),
          document.fonts.load('700 40px "Playfair Display"'),
          document.fonts.load('900 60px "Noto Sans Devanagari"'),
          document.fonts.load('700 40px "Dancing Script"'),
          document.fonts.load('900 80px "Cinzel"'),
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
      img.src = path + '?v=3';
    };
    tryNext();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    pickRandomDialogue(selectedCeleb);
    if (!selectedCeleb.supportsNoPhoto) setNoPhotoMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCeleb]);

  const pickRandomDialogue = (celeb) => {
    if (!celeb?.dialogues?.length) return;
    const len = celeb.dialogues.length;
    let i = Math.floor(Math.random() * len);
    if (len > 1 && celeb.dialogues[i] === activeDialogue) i = (i + 1) % len;
    setActiveDialogue(celeb.dialogues[i]);
  };

  const getFinalMessage = () => {
    let text = useCustomMsg && customMessage.trim()
      ? customMessage.trim()
      : activeDialogue;
    const name = userName.trim() || (selectedCeleb.requireName ? 'आपका नाम' : '');
    text = text.replace(/{name}/g, name);
    return text;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target.result);
      setNoPhotoMode(false);
    };
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
    setNoPhotoMode(false);
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
    const paragraphs = String(text || '').split('\n');
    const finalLines = [];
    paragraphs.forEach((para) => {
      const words = para.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + ' ';
        if (ctx.measureText(test).width > maxW && n > 0) {
          finalLines.push(line.trim());
          line = words[n] + ' ';
        } else line = test;
      }
      if (line.trim()) finalLines.push(line.trim());
    });
    return finalLines.length ? finalLines : [''];
  };

  // ── Vector art helpers ──
  const drawPeacockFeather = (ctx, x, y, size, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size / 200, size / 200);
    ctx.strokeStyle = '#065F46';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, 100, 40, 250);
    ctx.stroke();
    const featherGrad = ctx.createRadialGradient(0, -20, 5, 0, -20, 80);
    featherGrad.addColorStop(0, '#FEF3C7');
    featherGrad.addColorStop(0.15, '#FBBF24');
    featherGrad.addColorStop(0.35, '#0EA5E9');
    featherGrad.addColorStop(0.65, '#1E40AF');
    featherGrad.addColorStop(0.85, '#065F46');
    featherGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = featherGrad;
    ctx.beginPath();
    ctx.ellipse(0, -20, 45, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.ellipse(0, -20, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(0, -20, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.ellipse(0, -20, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawFlute = (ctx, x, y, size, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size / 300, size / 300);
    const grad = ctx.createLinearGradient(0, -20, 0, 20);
    grad.addColorStop(0, '#78350F');
    grad.addColorStop(0.4, '#D97706');
    grad.addColorStop(0.6, '#FBBF24');
    grad.addColorStop(1, '#78350F');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-150, -12, 300, 24, 12);
    else ctx.rect(-150, -12, 300, 24);
    ctx.fill();
    ctx.fillStyle = '#1C0A00';
    for (let i = -80; i <= 80; i += 30) {
      ctx.beginPath();
      ctx.arc(i, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    for (let i = -140; i <= 140; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, -12);
      ctx.lineTo(i, 12);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawLotus = (ctx, x, y, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    for (let layer = 3; layer >= 0; layer--) {
      const petals = 8;
      const radius = 30 + layer * 15;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + layer * 0.15;
        ctx.save();
        ctx.rotate(a);
        const petalGrad = ctx.createRadialGradient(0, -radius, 5, 0, -radius, 40);
        petalGrad.addColorStop(0, '#FFF5F5');
        petalGrad.addColorStop(0.5, layer % 2 === 0 ? '#FDA4AF' : '#F9A8D4');
        petalGrad.addColorStop(1, '#BE185D');
        ctx.fillStyle = petalGrad;
        ctx.beginPath();
        ctx.ellipse(0, -radius, 15, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    const centerGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
    centerGrad.addColorStop(0, '#FFD700');
    centerGrad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawDiya = (ctx, x, y, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    const bowlGrad = ctx.createLinearGradient(0, -20, 0, 30);
    bowlGrad.addColorStop(0, '#F59E0B');
    bowlGrad.addColorStop(0.5, '#D97706');
    bowlGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.ellipse(0, 15, 55, 20, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(0, -5, 45, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -20, 4, 15);
    const flameGrad = ctx.createRadialGradient(0, -35, 3, 0, -35, 25);
    flameGrad.addColorStop(0, '#FFF');
    flameGrad.addColorStop(0.3, '#FFD700');
    flameGrad.addColorStop(0.7, '#F97316');
    flameGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(0, -35, 12, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.ellipse(0, -35, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawMandala = (ctx, x, y, size, color = '#FFD700') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.25;
    for (let ring = 1; ring <= 4; ring++) {
      const r = size * (ring / 4);
      const petals = 8 + ring * 4;
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, r / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawStars = (ctx, count, w, h) => {
    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = size * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawConfetti = (ctx, w, h) => {
    ctx.save();
    const colors = ['#FFD700', '#F43F5E', '#8B5CF6', '#3B82F6', '#22D3EE', '#FBBF24'];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 8 + 4;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.globalAlpha = Math.random() * 0.7 + 0.3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      ctx.restore();
    }
    ctx.restore();
  };

  const drawBalloon = (ctx, x, y, color) => {
    ctx.save();
    ctx.translate(x, y);
    const grad = ctx.createRadialGradient(-8, -8, 5, 0, 0, 35);
    grad.addColorStop(0, '#FFF');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3, 30);
    ctx.lineTo(0, 36);
    ctx.lineTo(3, 30);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.quadraticCurveTo(15, 80, 5, 140);
    ctx.stroke();
    ctx.restore();
  };

  const drawLightRays = (ctx, cx, cy, radius, color) => {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * radius, Math.sin(angle) * radius);
      grad.addColorStop(0, color + 'AA');
      grad.addColorStop(0.5, color + '33');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle - 0.05) * radius, Math.sin(angle - 0.05) * radius);
      ctx.lineTo(Math.cos(angle + 0.05) * radius, Math.sin(angle + 0.05) * radius);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  // ── Logo top-right (previous style) ──
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

  // ── Google Play badge (previous style) ──
  const drawGooglePlayBadge = (ctx, cx, cy) => {
    const w = 420;
    const h = 88;
    const x = cx - w / 2;
    const y = cy;

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

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const px = x + 28;
    const py = y + h / 2;
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

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(px + 4, py - 14);
    ctx.lineTo(px + 4, py + 8);
    ctx.lineTo(px + 28, py - 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

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

  // ═══════════════════════════════════════════════════════════
  // GENERATE — BIG SQUARE PHOTO + PLAY BADGE + LOGO
  // ═══════════════════════════════════════════════════════════
  const generateCard = async () => {
    if ((!selectedImage && !noPhotoMode) || !fontsReady) return;
    setIsProcessing(true);
    setLoadingText('Crafting your masterpiece... ✨');
    try { await document.fonts.ready; } catch (e) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, selectedCeleb.bgGradient[0]);
    grad.addColorStop(0.35, selectedCeleb.bgGradient[1]);
    grad.addColorStop(0.65, selectedCeleb.bgGradient[2]);
    grad.addColorStop(1, selectedCeleb.bgGradient[3] || selectedCeleb.bgGradient[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    const centerGlow = ctx.createRadialGradient(540, 500, 80, 540, 700, 1100);
    centerGlow.addColorStop(0, selectedCeleb.themeColor + '40');
    centerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Theme decorations (behind photo)
    if (selectedCeleb.id === 'janmashtami' || selectedCeleb.id === 'gita') {
      drawStars(ctx, 90, 1080, 1920);
      drawMandala(ctx, 540, 900, 650, '#FFD700');
      drawPeacockFeather(ctx, 120, 180, 240, -0.35);
      drawPeacockFeather(ctx, 960, 180, 240, 0.35);
    } else if (selectedCeleb.id === 'diwali') {
      drawStars(ctx, 50, 1080, 1920);
      drawMandala(ctx, 540, 900, 650, '#F59E0B');
    } else if (selectedCeleb.id === 'holi') {
      drawConfetti(ctx, 1080, 1920);
    } else if (selectedCeleb.id === 'birthday' || selectedCeleb.id === 'anniversary') {
      drawConfetti(ctx, 1080, 1920);
      drawBalloon(ctx, 130, 220, '#F43F5E');
      drawBalloon(ctx, 90, 140, '#8B5CF6');
      drawBalloon(ctx, 950, 220, '#FBBF24');
      drawBalloon(ctx, 990, 140, '#EC4899');
    } else if (selectedCeleb.id === 'independence') {
      drawStars(ctx, 50, 1080, 1920);
    } else {
      drawStars(ctx, 40, 1080, 1920);
      drawMandala(ctx, 540, 900, 600, selectedCeleb.accentColor);
    }

    // ═══════════════════════════════════════
    // BIG SQUARE PHOTO BOX (previous layout)
    // faceY ~170, faceH ~920, faceW ~820
    // ═══════════════════════════════════════
    const faceY = 160;
    const faceH = 900;
    const faceW = 820;
    const faceX = (1080 - faceW) / 2;

    if (!noPhotoMode && selectedImage) {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Soft shadow plate
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

          // Process image into work canvas
          const cropSrcH = Math.min(img.height, img.height * 0.9);
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

          // Clip + draw photo
          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18);
          else ctx.rect(faceX, faceY, faceW, faceH);
          ctx.clip();
          ctx.drawImage(work, faceX, faceY, faceW, faceH);

          // Duotone
          ctx.globalCompositeOperation = 'multiply';
          const duo = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
          duo.addColorStop(0, '#fff');
          duo.addColorStop(1, selectedCeleb.themeColor);
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = duo;
          ctx.fillRect(faceX, faceY, faceW, faceH);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';

          // Bottom fade into bg
          const fade = ctx.createLinearGradient(0, faceY + faceH - 260, 0, faceY + faceH);
          fade.addColorStop(0, 'transparent');
          fade.addColorStop(1, selectedCeleb.bgGradient[1]);
          ctx.fillStyle = fade;
          ctx.fillRect(faceX, faceY + faceH - 260, faceW, 260);
          ctx.restore();

          // Gold border around square
          const gold = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
          gold.addColorStop(0, '#FFD700');
          gold.addColorStop(0.5, '#FFA500');
          gold.addColorStop(1, '#B8860B');
          ctx.strokeStyle = gold;
          ctx.lineWidth = 5;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18);
          else ctx.rect(faceX, faceY, faceW, faceH);
          ctx.stroke();

          // Outer thin ring
          ctx.strokeStyle = 'rgba(255,215,0,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(faceX - 8, faceY - 8, faceW + 16, faceH + 16, 22);
          else ctx.rect(faceX - 8, faceY - 8, faceW + 16, faceH + 16);
          ctx.stroke();

          resolve();
        };
        img.onerror = () => resolve();
        img.src = selectedImage;
      });
    } else if (noPhotoMode) {
      // Big icon / divine placeholder in square box
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(faceX, faceY, faceW, faceH, 18);
        ctx.fill();
      } else ctx.fillRect(faceX, faceY, faceW, faceH);

      ctx.font = '320px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedCeleb.icon || '✨', 540, faceY + faceH / 2 - 40);

      const gold = ctx.createLinearGradient(faceX, faceY, faceX + faceW, faceY + faceH);
      gold.addColorStop(0, '#FFD700');
      gold.addColorStop(1, '#B8860B');
      ctx.strokeStyle = gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(faceX, faceY, faceW, faceH, 18);
      else ctx.rect(faceX, faceY, faceW, faceH);
      ctx.stroke();
      ctx.restore();
    }

    // Decorative bottom elements after photo
    if (selectedCeleb.id === 'janmashtami' || selectedCeleb.id === 'gita') {
      drawFlute(ctx, 540, 1120, 200, 0);
      drawLotus(ctx, 140, 1140, 70);
      drawLotus(ctx, 940, 1140, 70);
    } else if (selectedCeleb.id === 'diwali') {
      drawDiya(ctx, 180, 1140, 100);
      drawDiya(ctx, 540, 1160, 100);
      drawDiya(ctx, 900, 1140, 100);
    }

    // ── Top left brand + top right logo ──
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText('Quttr Style', 48, 78);
    ctx.fillStyle = selectedCeleb.themeColor;
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText(selectedCeleb.category.toUpperCase(), 48, 106);
    drawLogoTopRight(ctx);

    // ── Heading ──
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    const headGrad = ctx.createLinearGradient(0, 1180, 0, 1260);
    headGrad.addColorStop(0, '#FFF8DC');
    headGrad.addColorStop(0.5, selectedCeleb.accentColor);
    headGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = headGrad;
    ctx.font = '900 58px "Noto Sans Devanagari", "Cinzel", "Playfair Display", serif';
    ctx.fillText(selectedCeleb.heading, 540, 1210);
    ctx.shadowBlur = 0;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(selectedCeleb.subHeading, 540, 1270);
    ctx.restore();

    // ── Name ──
    let nameBottomY = 1285;
    if (userName.trim()) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 16;
      const nameGrad = ctx.createLinearGradient(0, 1300, 0, 1380);
      nameGrad.addColorStop(0, '#FFF8DC');
      nameGrad.addColorStop(0.5, selectedCeleb.accentColor);
      nameGrad.addColorStop(1, '#D97706');
      ctx.fillStyle = nameGrad;
      ctx.font = '700 64px "Dancing Script", "Playfair Display", cursive';
      ctx.fillText(userName, 540, 1345);
      nameBottomY = 1390;

      // Age badge
      if (userAge && selectedCeleb.supportsAge) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawLightRays(ctx, 920, 1340, 70, selectedCeleb.accentColor);
        const ageGrad = ctx.createRadialGradient(920, 1340, 5, 920, 1340, 42);
        ageGrad.addColorStop(0, '#FFD700');
        ageGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = ageGrad;
        ctx.beginPath();
        ctx.arc(920, 1340, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '900 36px "Bebas Neue", Impact, sans-serif';
        ctx.fillText(userAge, 920, 1342);
        ctx.restore();
      }
      ctx.restore();
    }

    // ── Message ──
    const msgY = nameBottomY + 30;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFF8E7';
    ctx.font = '600 36px "Kalam", "Noto Sans Devanagari", "Caveat", cursive';
    const message = getFinalMessage();
    const lines = wrapLines(ctx, message, 800);
    const lh = 50;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, 540, msgY + idx * lh);
    });
    ctx.restore();

    let afterMsgY = msgY + lines.length * lh + 20;

    if (userFrom.trim()) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = selectedCeleb.accentColor;
      ctx.font = 'italic 500 24px "Playfair Display", serif';
      ctx.fillText('— ' + userFrom, 540, afterMsgY);
      afterMsgY += 40;
      ctx.restore();
    }

    // Divider
    const dg = ctx.createLinearGradient(200, 0, 880, 0);
    dg.addColorStop(0, 'transparent');
    dg.addColorStop(0.5, selectedCeleb.accentColor);
    dg.addColorStop(1, 'transparent');
    ctx.fillStyle = dg;
    ctx.fillRect(200, Math.min(afterMsgY + 10, 1580), 680, 1.5);

    // ── Google Play badge (previous) ──
    const badgeY = Math.min(afterMsgY + 40, 1620);
    drawGooglePlayBadge(ctx, 540, badgeY);

    // ── Bottom Quttr logo + text (previous) ──
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
    ctx.fillText('Barber booking  ·  quttrr.com/style', 540, appY + 52);

    setGeneratedCardUrl(canvas.toDataURL('image/jpeg', 0.95));
    setIsProcessing(false);
  };

  useEffect(() => {
    if ((selectedImage || noPhotoMode) && fontsReady) {
      generateCard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, noPhotoMode, selectedCeleb, activeDialogue, fontsReady, logoImage, userName, userAge, userFrom, customMessage, useCustomMsg, styleMode]);

  const shareCard = async () => {
    if (!generatedCardUrl) return;
    try {
      const blob = await (await fetch(generatedCardUrl)).blob();
      const file = new File([blob], 'quttr-greeting.jpg', { type: 'image/jpeg' });
      const shareText = `${selectedCeleb.icon} ${selectedCeleb.heading}!\n\nCreate your own free 👇\nhttps://www.quttrr.com/style`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Quttr Style', text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: 'Quttr Style', text: shareText });
        downloadImage();
      } else {
        downloadImage();
      }
    } catch (e) {
      console.log('Share cancelled', e);
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = generatedCardUrl;
    a.download = `quttr-${selectedCeleb.id}-${Date.now()}.jpg`;
    a.click();
  };

  const tabs = ['Festivals', 'Greetings', 'Spiritual', 'Motivation', 'Cricketers', 'Bollywood', 'South Stars'];
  const filtered = activeTab === 'All' ? ALL_CATEGORIES : ALL_CATEGORIES.filter((c) => c.category === activeTab);
  const canGenerate = selectedImage || noPhotoMode;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 overflow-x-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-4xl mx-auto text-center my-6">
        <div className="inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-black font-black text-xs px-5 py-2 rounded-full mb-4 tracking-widest shadow-lg shadow-yellow-500/30">
          ✨ INDIA'S #1 GREETING POSTER MAKER ✨
        </div>
        <h1
          className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '4px' }}
        >
          CREATE MAGIC
        </h1>
        <p className="text-slate-300 mt-3 text-lg" style={{ fontFamily: 'Dancing Script, cursive' }}>
          जन्माष्टमी · जन्मदिन · दीपावली · हर पल की खुशी
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {NEW_CATEGORIES.filter(c => c.category === 'Festivals' || c.category === 'Greetings').slice(0, 6).map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.category); setSelectedCeleb(item); }}
              className={
                'px-4 py-2 rounded-2xl font-bold text-xs tracking-wide border-2 transition ' +
                (selectedCeleb.id === item.id
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-300 text-black scale-105 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-yellow-500')
              }
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT CONTROLS */}
        <div className="space-y-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 rounded-3xl border border-yellow-500/20 shadow-2xl">
          <div>
            <label className="text-xs font-black text-yellow-400 mb-2 block tracking-widest">POSTER STYLE</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setStyleMode(mode.id)}
                  className={
                    'p-3 rounded-xl border-2 transition text-center ' +
                    (styleMode === mode.id
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-500')
                  }
                >
                  <div className="text-2xl">{mode.icon}</div>
                  <div className="text-xs font-bold mt-1">{mode.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-yellow-400 mb-2 block tracking-widest">
              YOUR NAME {selectedCeleb.requireName && <span className="text-rose-400">*</span>}
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              maxLength={30}
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 outline-none font-semibold text-lg"
            />
          </div>

          {selectedCeleb.supportsAge && (
            <div>
              <label className="text-xs font-black text-yellow-400 mb-2 block tracking-widest">AGE / YEARS (Optional)</label>
              <input
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value.slice(0, 3))}
                placeholder="e.g. 25"
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 outline-none font-semibold"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-black text-yellow-400 mb-2 block tracking-widest">FROM (Optional)</label>
            <input
              value={userFrom}
              onChange={(e) => setUserFrom(e.target.value)}
              placeholder="e.g. Rahul & Family"
              maxLength={40}
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 outline-none font-semibold"
            />
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useCustomMsg} onChange={(e) => setUseCustomMsg(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs font-bold text-yellow-400 tracking-wider">WRITE MY OWN MESSAGE</span>
            </label>
            {useCustomMsg && (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Write your own wish here..."
                maxLength={200}
                rows={3}
                className="w-full mt-2 bg-slate-900 border border-slate-700 focus:border-yellow-400 rounded-lg px-3 py-2 outline-none text-sm"
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-yellow-400 tracking-widest">YOUR PHOTO</label>
              {selectedCeleb.supportsNoPhoto && (
                <button
                  onClick={() => { setNoPhotoMode(!noPhotoMode); if (!noPhotoMode) setSelectedImage(null); }}
                  className={
                    'text-xs px-3 py-1 rounded-full font-bold transition ' +
                    (noPhotoMode ? 'bg-yellow-400 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600')
                  }
                >
                  {noPhotoMode ? '✓ NO PHOTO MODE' : 'Skip Photo'}
                </button>
              )}
            </div>

            {!noPhotoMode && !cameraActive && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-500 p-4 rounded-xl flex flex-col items-center gap-2 transition">
                  <span className="text-3xl">🖼️</span>
                  <span className="font-bold text-sm">Upload</span>
                </button>
                <button onClick={startCamera} className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-500 p-4 rounded-xl flex flex-col items-center gap-2 transition">
                  <span className="text-3xl">📸</span>
                  <span className="font-bold text-sm">Selfie</span>
                </button>
              </div>
            )}
            {cameraActive && (
              <div className="space-y-2">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-yellow-500" />
                <button onClick={captureSelfie} className="w-full bg-rose-600 font-black py-3 rounded-xl">📸 CAPTURE</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          <div>
            <label className="text-xs font-black text-yellow-400 mb-2 block tracking-widest">CHOOSE TEMPLATE</label>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {tabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={
                    'px-3 py-1.5 rounded-full text-xs font-black tracking-wider whitespace-nowrap transition border-2 ' +
                    (activeTab === cat
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500')
                  }
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
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
                  <div className="font-black text-sm flex items-center gap-1">
                    {celeb.icon || '⭐'} {celeb.name}
                  </div>
                  <div className="text-xs text-yellow-400/80 mt-0.5 truncate">{celeb.styleName}</div>
                </div>
              ))}
            </div>
          </div>

          {canGenerate && !useCustomMsg && (
            <button
              onClick={() => pickRandomDialogue(selectedCeleb)}
              className="w-full bg-slate-800 border-2 border-yellow-500/30 py-3 rounded-xl text-sm font-black hover:border-yellow-500 transition text-yellow-400"
            >
              🎲 SHUFFLE MESSAGE
            </button>
          )}
        </div>

        {/* RIGHT PREVIEW */}
        <div className="lg:sticky lg:top-8 flex flex-col items-center">
          {!canGenerate ? (
            <div className="w-full aspect-[9/16] max-w-md rounded-3xl border-2 border-dashed border-yellow-500/30 bg-slate-900/50 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-7xl mb-4">🎨</span>
              <p className="text-yellow-400 font-black text-3xl tracking-widest" style={{ fontFamily: 'Bebas Neue' }}>
                LIVE PREVIEW
              </p>
              <p className="text-sm mt-3 text-slate-400">Enter name & upload photo</p>
              {selectedCeleb.supportsNoPhoto && (
                <p className="text-xs mt-4 text-yellow-400/70">✨ Or tap Skip Photo for divine art</p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md relative">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/90 rounded-3xl flex flex-col items-center justify-center border border-yellow-500/40">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-yellow-400 font-black tracking-widest text-sm">{loadingText}</p>
                </div>
              )}
              {generatedCardUrl && (
                <img src={generatedCardUrl} alt="Your Card" className="w-full rounded-3xl border-4 border-slate-800 shadow-2xl shadow-yellow-500/20" />
              )}
              {generatedCardUrl && !isProcessing && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={shareCard}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xl py-5 rounded-2xl shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-3 font-black"
                    style={{ fontFamily: 'Bebas Neue', letterSpacing: '2px' }}
                  >
                    📤 SHARE ON WHATSAPP
                  </button>
                  <button
                    onClick={downloadImage}
                    className="w-full bg-slate-800 border-2 border-slate-700 hover:border-yellow-500 text-yellow-400 py-3 rounded-2xl font-black transition"
                  >
                    ⬇️ DOWNLOAD IMAGE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-slate-500 text-xs pb-6">
        Made with ❤️ in India · <a href="/" className="text-yellow-400 hover:underline">quttrr.com</a>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
