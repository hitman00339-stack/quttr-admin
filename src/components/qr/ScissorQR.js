'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScissorQR({ value, size = 300 }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (window.QRCode) {
      setLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('Failed to load QRCode library');
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  useEffect(() => {
    if (!loaded || !canvasRef.current || !value) return;
    if (typeof window === 'undefined' || !window.QRCode) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const totalSize = size;
    const qrSize = size * 0.7;
    
    canvas.width = totalSize;
    canvas.height = totalSize;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalSize, totalSize);
    
    // Generate QR code on temp canvas
    const tempCanvas = document.createElement('canvas');
    
    window.QRCode.toCanvas(tempCanvas, value, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { 
        dark: '#000000', 
        light: '#FFFFFF' 
      }
    }, (error) => {
      if (error) {
        console.error('QR generation error:', error);
        return;
      }
      
      // === Draw Barber Theme ===
      
      // Top barber pole stripes
      const stripeH = 25;
      const stripeW = totalSize / 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#E63946' : (i % 3 === 0 ? '#FFFFFF' : '#0066CC');
        ctx.fillRect(i * stripeW, 0, stripeW, stripeH);
      }
      
      // Bottom barber pole stripes
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#0066CC' : (i % 3 === 0 ? '#FFFFFF' : '#E63946');
        ctx.fillRect(i * stripeW, totalSize - stripeH, stripeW, stripeH);
      }
      
      // Red border
      ctx.strokeStyle = '#E63946';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, stripeH + 2, totalSize - 4, totalSize - (stripeH * 2) - 4);
      
      // Gold inner border
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, stripeH + 8, totalSize - 16, totalSize - (stripeH * 2) - 16);
      
      // Draw QR in center
      const qrX = (totalSize - qrSize) / 2;
      const qrY = (totalSize - qrSize) / 2;
      ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);
      
      // === Center Logo with Scissors ===
      const cx = totalSize / 2;
      const cy = totalSize / 2;
      const logoR = qrSize * 0.13;
      
      // White circle background
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
      ctx.fill();
      
      // Red circle border
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
      
      // Scissor circles (handles)
      ctx.beginPath();
      ctx.arc(cx - s/2, cy - s/3, s/4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx - s/2, cy + s/3, s/4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Scissor blades
      ctx.beginPath();
      ctx.moveTo(cx - s/4, cy - s/3);
      ctx.lineTo(cx + s/2, cy + s/2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - s/4, cy + s/3);
      ctx.lineTo(cx + s/2, cy - s/2);
      ctx.stroke();
      
      // Bottom text "SCAN TO BOOK"
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO BOOK', totalSize / 2, totalSize - 10);
    });
  }, [loaded, value, size]);
  
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${size}px` }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: 'block',
          borderRadius: '8px',
        }} 
      />
      {!loaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #FFD700',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
