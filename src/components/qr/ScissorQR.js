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
        const qrSize = size * 0.7;
        
        // Set canvas size
        canvas.width = totalSize;
        canvas.height = totalSize;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalSize, totalSize);
        
        // Generate QR to data URL first
        const qrDataUrl = await QRCode.toDataURL(value, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        
        if (cancelled) return;
        
        // Load QR image
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          qrImg.onload = resolve;
          qrImg.onerror = reject;
          qrImg.src = qrDataUrl;
        });
        
        if (cancelled) return;
        
        // === Draw Barber Theme ===
        
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
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        
        // Center logo with scissors
        const cx = totalSize / 2;
        const cy = totalSize / 2;
        const logoR = qrSize * 0.13;
        
        // White circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
        ctx.fill();
        
        // Red border
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
        
        // Scissor handles (circles)
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
        
        // Bottom text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(10, totalSize * 0.035)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('SCAN TO BOOK', totalSize / 2, totalSize - (stripeH / 2) + 4);
        
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('QR draw error:', err);
        if (!cancelled) setError(err.message || 'Failed to generate QR');
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #E63946',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'qrSpinAnim 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '11px', color: '#666' }}>Loading QR...</span>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#ff4444',
          fontSize: '12px',
          padding: '10px',
        }}>
          ⚠️ {error}
        </div>
      )}
      <style jsx>{`
        @keyframes qrSpinAnim {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
