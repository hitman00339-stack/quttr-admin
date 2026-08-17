'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Camera, Loader2, CheckCircle, AlertCircle,
  ScanLine, Keyboard, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRScannerPage() {
  const router = useRouter();
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scanner) {
        try {
          scanner.clear();
        } catch (e) {}
      }
    };
  }, [scanner]);

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    
    try {
      // Dynamically import html5-qrcode (client-side only)
      const { Html5Qrcode } = await import('html5-qrcode');
      
      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);
      
      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR Code scanned successfully
          handleScanSuccess(decodedText, html5QrCode);
        },
        (errorMessage) => {
          // Ignore scan errors (happens continuously)
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Camera not accessible. Please allow camera permission.');
      setScanning(false);
      toast.error('Camera permission needed');
    }
  };

  const stopScanner = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (e) {}
    }
    setScanning(false);
    setScanner(null);
  };

  const handleScanSuccess = async (decodedText, scannerInstance) => {
    // Stop scanner
    try {
      await scannerInstance.stop();
      scannerInstance.clear();
    } catch (e) {}
    
    setScanning(false);
    setScanner(null);
    
    // Extract short code from URL
    // URL format: https://quttrr.com/q/XXXXXX
    let shortCode = decodedText;
    
    const match = decodedText.match(/\/q\/([A-Z0-9]+)/i);
    if (match) {
      shortCode = match[1];
    }
    
    // Clean up (remove any extra characters)
    shortCode = shortCode.trim().toUpperCase();
    
    if (!shortCode || shortCode.length < 4) {
      toast.error('Invalid QR code');
      return;
    }
    
    toast.success(`Detected: ${shortCode}`);
    
    // Redirect to QR detail page
    setTimeout(() => {
      router.push(`/dashboard/qr-codes/${shortCode}`);
    }, 500);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast.error('Enter a QR code');
      return;
    }
    
    const code = manualCode.trim().toUpperCase();
    router.push(`/dashboard/qr-codes/${code}`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/qr-codes" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-heading">Scan QR Code</h1>
          <p className="text-caption mt-1">Scan a printed QR code to activate it</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-4 bg-accent-500/5 border-accent-500/20">
        <div className="flex items-start gap-3">
          <ScanLine className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white mb-1">How it works</p>
            <ul className="text-xs text-white/60 space-y-1">
              <li>1. Point camera at printed QR code</li>
              <li>2. Wait for automatic detection</li>
              <li>3. Fill shop details on next page</li>
              <li>4. QR becomes ACTIVE for public use</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanner or Manual Entry */}
      {!showManual ? (
        <div className="card p-6">
          {!scanning ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-12 h-12 text-accent-500" />
              </div>
              <h3 className="text-title mb-2">Ready to Scan</h3>
              <p className="text-caption mb-6">
                Click below to open your camera and scan a QR code
              </p>
              <button
                onClick={startScanner}
                className="btn-brand"
              >
                <Camera className="w-4 h-4" />
                Start Scanner
              </button>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-caption mb-3">Or enter code manually</p>
                <button
                  onClick={() => setShowManual(true)}
                  className="btn-outline"
                >
                  <Keyboard className="w-4 h-4" />
                  Enter Code Manually
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="relative">
                <div 
                  id="qr-reader" 
                  ref={scannerRef}
                  className="rounded-xl overflow-hidden bg-black"
                  style={{ minHeight: '300px' }}
                />
                
                {/* Overlay scan line */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-accent-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent-500 rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent-500 rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent-500 rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent-500 rounded-br-2xl" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-accent-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Scanning...</span>
                </div>
                <p className="text-xs text-white/50 text-center">
                  Point camera at QR code
                </p>
                <button
                  onClick={stopScanner}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-error mb-1">Error</p>
                  <p className="text-xs text-white/70">{error}</p>
                  <p className="text-xs text-white/50 mt-2">
                    Make sure to allow camera permission in your browser
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Entry */
        <div className="card p-6">
          <h3 className="text-title mb-4">Enter QR Code Manually</h3>
          <p className="text-caption mb-6">
            Look at the printed QR - the code is written below it (e.g., TGRV3H)
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="label">QR Code</label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="input font-mono text-lg"
                placeholder="e.g., TGRV3H"
                maxLength={10}
                autoFocus
              />
              <p className="label-hint">Usually 6 characters, letters and numbers</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="btn-brand flex-1"
              >
                <CheckCircle className="w-4 h-4" />
                Continue
              </button>
              <button
                onClick={() => {
                  setShowManual(false);
                  setManualCode('');
                }}
                className="btn-outline"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card p-4">
        <p className="text-sm font-medium text-white mb-3">💡 Scanning Tips</p>
        <ul className="text-xs text-white/60 space-y-2">
          <li>✓ Good lighting helps scan faster</li>
          <li>✓ Hold phone steady, about 15-20cm away</li>
          <li>✓ Make sure QR is not damaged or wet</li>
          <li>✓ Allow camera permission when prompted</li>
        </ul>
      </div>
    </div>
  );
}
