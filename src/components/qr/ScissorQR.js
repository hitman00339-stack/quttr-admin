'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScissorQR({ value, size = 300 }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadQR = async () => {
      if (window.QRCode) {
        setLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    };
    
    loadQR();
  }, []);
  
  useEffect(() => {
    if (!loaded || !canvasRef.current || !value || !window.QRCode) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const totalSize = size;
    const qrSize = size * 0.7;
    
    canvas.width = totalSize;
    canvas.height = totalSize;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalSize, totalSize);
    
    const tempCanvas = document.createElement('canvas');
    
    window.QRCode.toCanvas(tempCanvas, value, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' }
    }, (error) => {
      if (error) return;
      
      // Barber pole stripes at top
      const stripeH = 25;
      const stripeW = totalSize / 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#E63946' : (i % 3 === 0 ? '#FFFFFF' : '#0066CC');
        ctx.fillRect(i * stripeW, 0, stripeW, stripeH);
      }
      
      // Barber pole stripes at bottom
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#0066CC' : (i % 3 === 0 ? '#FFFFFF' : '#E63946');
        ctx.fillRect(i * stripeW, totalSize - stripeH, stripeW, stripeH);
      }
      
      // Border
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, stripeH + 2, totalSize - 4, totalSize - (stripeH * 2) - 4);
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, stripeH + 8, totalSize - 16, totalSize - (stripeH * 2) - 16);
      
      // Draw QR
      const qrX = (totalSize - qrSize) / 2;
      const qrY = (totalSize - qrSize) / 2;
      ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);
      
      // Center logo
      const cx = totalSize / 2;
      const cy = totalSize / 2;
      const logoR = qrSize * 0.13;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
      ctx.stroke();
      
      // Scissors icon
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      const s = logoR * 0.7;
      
      ctx.beginPath();
      ctx.arc(cx - s/2, cy - s/3, s/4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx - s/2, cy + s/3, s/4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - s/4, cy - s/3);
      ctx.lineTo(cx + s/2, cy + s/2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - s/4, cy + s/3);
      ctx.lineTo(cx + s/2, cy - s/2);
      ctx.stroke();
      
      // Bottom text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO BOOK', totalSize / 2, totalSize - 10);
    });
  }, [loaded, value, size]);
  
  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', maxWidth: `${size}px` }} />;
}
