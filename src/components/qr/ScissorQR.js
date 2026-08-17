'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function ScissorQR({ value, size = 300 }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function drawQR() {
      if (!canvasRef.current || !value) return;
      
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const totalSize = size;
        
        canvas.width = totalSize;
        canvas.height = totalSize;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalSize, totalSize);
        
        // Generate QR
        const qrDataUrl = await QRCode.toDataURL(value, {
          width: totalSize,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        
        if (cancelled) return;
        
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          qrImg.onload = resolve;
          qrImg.onerror = reject;
          qrImg.src = qrDataUrl;
        });
        
        if (cancelled) return;
        
        // Draw QR full size
        ctx.drawImage(qrImg, 0, 0, totalSize, totalSize);
        
        // Center scissors logo
        const cx = totalSize / 2;
        const cy = totalSize / 2;
        const logoR = totalSize * 0.1;
        
        // White circle background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, logoR + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Red circle
        ctx.fillStyle = '#E63946';
        ctx.beginPath();
        ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
        ctx.fill();
        
        // Scissors icon (gold)
        ctx.strokeStyle = '#FFD700';
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
        
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('QR error:', err);
        if (!cancelled) setError(err.message);
      }
    }
    
    drawQR();
    return () => { cancelled = true; };
  }, [value, size]);
  
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${size}px` }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: 'auto',
          display: 'block',
          borderRadius: '8px',
          opacity: ready ? 1 : 0.3,
          transition: 'opacity 0.3s',
        }} 
      />
      {!ready && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '12px',
        }}>
          ⚠️ Error
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
