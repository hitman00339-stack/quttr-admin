'use client';

import { useEffect, useRef, useState } from 'react';

// Pre-load QR library once for entire app
let qrLibraryPromise = null;

function loadQRLibrary() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.QRCode) return Promise.resolve(window.QRCode);
  
  if (!qrLibraryPromise) {
    qrLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.async = true;
      script.onload = () => resolve(window.QRCode);
      script.onerror = () => reject(new Error('Failed to load QR library'));
      document.head.appendChild(script);
    });
  }
  
  return qrLibraryPromise;
}

export default function ScissorQR({ value, size = 300 }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    
    async function draw() {
      try {
        const QRCode = await loadQRLibrary();
        if (cancelled || !QRCode || !canvasRef.current || !value) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const totalSize = size;
        const qrSize = size * 0.7;
        
        canvas.width = totalSize;
        canvas.height = totalSize;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalSize, totalSize);
        
        // Create temp canvas for QR
        const tempCanvas = document.createElement('canvas');
        
        await new Promise((resolve, reject) => {
          QRCode.toCanvas(tempCanvas, value, {
            width: qrSize,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: { dark: '#000000', light: '#FFFFFF' }
          }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        if (cancelled) return;
        
        // === BARBER THEME ===
        
        // Top stripes
        const stripeH = Math.max(20, totalSize * 0.08);
        const stripeW = totalSize / 6;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#E63946' : (i % 3 === 0 ? '#FFFFFF' : '#0066CC');
          ctx.fillRect(i * stripeW, 0, stripeW, stripeH);
        }
        
        // Bottom stripes
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
        ctx.lineWidth = 1.5;
        ctx.strokeRect(8, stripeH + 8, totalSize - 16, totalSize - (stripeH * 2) - 16);
        
        // Draw QR in center
        const qrX = (totalSize - qrSize) / 2;
        const qrY = (totalSize - qrSize) / 2;
        ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);
        
        // Center logo with scissors
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
        ctx.font = `bold ${Math.max(10, totalSize * 0.035)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('SCAN TO BOOK', totalSize / 2, totalSize - (stripeH / 2) + 4);
        
        setReady(true);
      } catch (err) {
        console.error('QR draw error:', err);
        if (!cancelled) setError(err.message);
      }
    }
    
    draw();
    
    return () => { cancelled = true; };
  }, [value, size]);
  
  if (error) {
    return (
      <div style={{
        width: '100%',
        maxWidth: `${size}px`,
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        color: '#ff4444',
        fontSize: '12px',
        padding: '20px',
        textAlign: 'center',
      }}>
        Error loading QR
      </div>
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${size}px` }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: 'block',
          borderRadius: '8px',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.3s',
        }} 
      />
      {!ready && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: '8px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #E63946',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'qrSpin 0.8s linear infinite',
          }} />
        </div>
      )}
      <style jsx>{`
        @keyframes qrSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
