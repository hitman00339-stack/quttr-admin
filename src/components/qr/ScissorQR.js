'use client';

import { useEffect, useRef } from 'react';

export default function ScissorQR({ 
  value, 
  size = 400,
  color = '#000000',
  bgColor = '#FFFFFF',
  logoText = 'Quttr'
}) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    // Load QRCode library dynamically
    const loadQR = async () => {
      if (typeof window === 'undefined') return;
      
      // @ts-ignore
      if (!window.QRCode) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => generateQR();
        document.head.appendChild(script);
      } else {
        generateQR();
      }
    };
    
    const generateQR = () => {
      if (typeof window === 'undefined') return;
      // @ts-ignore
      const QRCode = window.QRCode;
      if (!QRCode) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const totalSize = size;
      const qrSize = size * 0.65;
      
      canvas.width = totalSize;
      canvas.height = totalSize;
      
      // White background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalSize, totalSize);
      
      // Generate QR code
      const tempCanvas = document.createElement('canvas');
      QRCode.toCanvas(tempCanvas, value, {
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: color,
          light: bgColor,
        }
      }, (error) => {
        if (error) {
          console.error(error);
          return;
        }
        
        // Draw scissor decorations (barber theme)
        drawBarberTheme(ctx, totalSize, qrSize);
        
        // Draw QR in center
        const qrX = (totalSize - qrSize) / 2;
        const qrY = (totalSize - qrSize) / 2;
        ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);
        
        // Draw center logo
        drawCenterLogo(ctx, totalSize, qrSize, logoText);
        
        // Draw corner scissors
        drawCornerScissors(ctx, totalSize);
        
        // Bottom text
        drawBottomText(ctx, totalSize);
      });
    };
    
    loadQR();
  }, [value, size, color, bgColor, logoText]);
  
  const drawBarberTheme = (ctx, size, qrSize) => {
    // Barber pole stripes at top
    const stripeHeight = 30;
    const stripeWidth = size / 6;
    
    // Top barber pole stripes
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#E63946' : (i % 3 === 0 ? '#FFFFFF' : '#0066CC');
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, stripeHeight);
    }
    
    // Bottom barber pole stripes
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#0066CC' : (i % 3 === 0 ? '#FFFFFF' : '#E63946');
      ctx.fillRect(i * stripeWidth, size - stripeHeight, stripeWidth, stripeHeight);
    }
    
    // Border
    ctx.strokeStyle = '#E63946';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, stripeHeight + 2, size - 4, size - (stripeHeight * 2) - 4);
    
    // Inner gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, stripeHeight + 10, size - 20, size - (stripeHeight * 2) - 20);
  };
  
  const drawCenterLogo = (ctx, totalSize, qrSize, logoText) => {
    const centerX = totalSize / 2;
    const centerY = totalSize / 2;
    const logoSize = qrSize * 0.2;
    
    // White circle background for logo
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Red circle border
    ctx.strokeStyle = '#E63946';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Scissors icon in center
    ctx.strokeStyle = '#E63946';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const s = logoSize * 0.4;
    
    // Scissors two circles
    ctx.beginPath();
    ctx.arc(centerX - s/2, centerY - s/4, s/4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX - s/2, centerY + s/4, s/4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Scissors blades
    ctx.beginPath();
    ctx.moveTo(centerX - s/4, centerY - s/4);
    ctx.lineTo(centerX + s/2, centerY + s/2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - s/4, centerY + s/4);
    ctx.lineTo(centerX + s/2, centerY - s/2);
    ctx.stroke();
  };
  
  const drawCornerScissors = (ctx, size) => {
    const cornerSize = 40;
    const positions = [
      { x: 20, y: 50 },
      { x: size - 20 - cornerSize, y: 50 },
      { x: 20, y: size - 50 - cornerSize },
      { x: size - 20 - cornerSize, y: size - 50 - cornerSize },
    ];
    
    positions.forEach(pos => {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      const s = cornerSize * 0.6;
      const cx = pos.x + cornerSize / 2;
      const cy = pos.y + cornerSize / 2;
      
      // Scissors
      ctx.beginPath();
      ctx.arc(cx - s/3, cy - s/4, s/6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx - s/3, cy + s/4, s/6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - s/6, cy - s/4);
      ctx.lineTo(cx + s/3, cy + s/3);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - s/6, cy + s/4);
      ctx.lineTo(cx + s/3, cy - s/3);
      ctx.stroke();
    });
  };
  
  const drawBottomText = (ctx, size) => {
    // Scan to book text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO BOOK', size / 2, size - 12);
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: 'auto',
        maxWidth: `${size}px`,
        display: 'block',
      }} 
    />
  );
}
