'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const CUSTOMER_PKG = 'com.quttr.customer';
const BUSINESS_PKG = 'com.quttr.business';

function makeSessionId() {
  if (typeof window === 'undefined') return '';
  try {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  } catch (e) {}
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px', ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LandingContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#E63946]/30 border-t-[#FFD700] rounded-full animate-spin" />
        <p className="text-[#FFD700]/60 text-xs tracking-[0.3em] uppercase font-bold">Quttr</p>
      </div>
      <GlobalStyles />
    </div>
  );
}

function LandingContent() {
  const searchParams = useSearchParams();
  const qrId = searchParams.get('qr') || '';
  const sid = searchParams.get('sid') || '';
  const location = searchParams.get('loc') || searchParams.get('location') || '';
  
  const [sessionId, setSessionId] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [locationText, setLocationText] = useState('आपके शहर');
  const trackedPageView = useRef(false);

  useEffect(() => {
    setSessionId(sid || makeSessionId());
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch location details from QR code
  useEffect(() => {
    if (location) {
      setLocationText(decodeURIComponent(location));
    } else if (qrId) {
      fetch(`/api/qr/location?qr=${qrId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.location) {
            setLocationText(data.location);
          }
        })
        .catch(() => {});
    }
  }, [qrId, location]);

  const trackEvent = useCallback(
    (event) => {
      try {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, qr_id: qrId, session_id: sessionId }),
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    },
    [qrId, sessionId]
  );

  useEffect(() => {
    if (!sessionId || trackedPageView.current) return;
    trackedPageView.current = true;
    trackEvent('page_view');
  }, [sessionId, trackEvent]);

  const openStore = useCallback(
    (pkg, eventName) => {
      trackEvent(eventName);
      const marketUrl = `market://details?id=${pkg}`;
      const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
      const start = Date.now();
      let didHide = false;
      const onHide = () => { didHide = true; };
      document.addEventListener('visibilitychange', onHide, { once: true });
      window.location.href = marketUrl;
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onHide);
        if (!didHide && Date.now() - start < 2000) {
          window.location.href = webUrl;
        }
      }, 900);
    },
    [trackEvent]
  );

  const customerPkg =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CUSTOMER_APP_PACKAGE) ||
    CUSTOMER_PKG;
  const businessPkg =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BUSINESS_APP_PACKAGE) ||
    BUSINESS_PKG;

  const downloadCustomer = () => openStore(customerPkg, 'customer_download_click');
  const downloadBusiness = () => openStore(businessPkg, 'business_download_click');

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap"
      />

      <StickyHeader scrolled={scrolled} onDownload={downloadCustomer} />

      <main className="bg-black text-white antialiased overflow-x-hidden">
        <HeroSection onDownload={downloadCustomer} locationText={locationText} />
        <FeatureOne />
        <FeatureTwo />
        <FeatureThree />
        <FeatureFour />
        <HowItWorks />
        <TestimonialsSection />
        <BarberSection onDownload={downloadBusiness} />
        <FinalCTASection onDownload={downloadCustomer} locationText={locationText} />
        <FooterSection />
      </main>

      <GlobalStyles />
    </>
  );
}

/* STICKY HEADER */
function StickyHeader({ scrolled, onDownload }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/85 backdrop-blur-xl border-b border-[#FFD700]/[0.15]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img 
            src="/quttr-logo.png" 
            alt="Quttr" 
            className="w-9 h-9 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-[17px] font-black tracking-tight">
            Quttr<span className="text-[#FFD700]">.</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/70 font-semibold">
          <a href="#features" className="hover:text-[#FFD700] transition-colors">फीचर्स</a>
          <a href="#barbers" className="hover:text-[#FFD700] transition-colors">बार्बर</a>
          <a href="#download" className="hover:text-[#FFD700] transition-colors">डाउनलोड</a>
        </nav>

        <button
          onClick={onDownload}
          className="qr-hindi text-[13px] font-bold bg-gradient-to-r from-[#E63946] to-[#B01824] text-white px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(230,57,70,0.6)] transition-all"
        >
          डाउनलोड
        </button>
      </div>
    </header>
  );
}

/* HERO SECTION - Fixed */
function HeroSection({ onDownload, locationText }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#E63946]/[0.18] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FFD700]/[0.1] rounded-full blur-[120px]" />
      </div>

      <div className={`relative z-10 max-w-5xl mx-auto text-center w-full transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* LOGO with fallback */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 md:w-40 md:h-40 qr-logo-float">
            <div className="absolute inset-0 bg-[#E63946]/50 blur-3xl rounded-full qr-logo-pulse" />
            <div className="relative w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-[#E63946] to-[#B01824] border-4 border-[#FFD700]/40 shadow-[0_0_50px_rgba(230,57,70,0.7)]">
              <img 
                src="/quttr-logo.png" 
                alt="Quttr"
                className="w-full h-full object-contain absolute inset-0"
                onError={(e) => { 
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-20 md:h-20 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88" strokeLinecap="round"/>
                  <line x1="14.47" y1="14.48" x2="20" y2="20" strokeLinecap="round"/>
                  <line x1="8.12" y1="8.12" x2="12" y2="12" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Location Badge */}
        <div className="inline-flex items-center gap-2 mb-6 max-w-[95%]">
          <span className="qr-hindi text-[13px] md:text-[15px] font-black tracking-wider text-[#FFD700] px-5 py-2.5 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/[0.08] backdrop-blur-sm">
            📍 अब <span className="text-white">{locationText}</span> में भी!
          </span>
        </div>

        <div className="inline-flex items-center gap-2 mb-6">
          <span className="qr-hindi text-[10px] md:text-[11px] font-black tracking-[0.2em] text-white/60 uppercase px-4 py-2 rounded-full border border-white/10 bg-white/[0.03]">
            ✂️ भारत का #1 बार्बर ऐप
          </span>
        </div>

        {/* FIXED Headlines - Proper Hindi */}
        <h1 className="qr-hindi qr-hero-title text-[42px] sm:text-[60px] md:text-[90px] font-black leading-[1.15] tracking-tight text-white mb-4">
          <span className="qr-gold-red-gradient block pb-2">इंतज़ार खत्म</span>
          <span className="text-white block pb-2">फ्रेश लुक शुरू</span>
        </h1>

        <p className="text-[20px] md:text-[28px] font-bold text-white/70 mb-6 tracking-tight">
          Skip the Wait. Walk in Fresh.
        </p>

        <p className="qr-hindi text-[18px] md:text-[22px] text-[#FFD700] mb-4 font-bold px-4">
          बुकिंग सेकंडों में। बार्बर आपकी पसंद का।
        </p>

        <p className="qr-hindi text-[15px] md:text-[18px] text-white/60 max-w-2xl mx-auto leading-relaxed mb-12 px-4">
          अब लाइन में लगने की जरूरत नहीं। घर बैठे बुक करें,
          <br className="hidden md:block" />
          अपनी बारी पर पहुंचे, और फ्रेश लुक के साथ निकलें।
        </p>

        {/* MEGA DOWNLOAD BUTTON */}
        <div className="flex flex-col items-center gap-6 mb-8 px-4">
          <button
            onClick={onDownload}
            className="qr-mega-btn group relative inline-flex items-center gap-3 text-white text-[16px] sm:text-[20px] md:text-[24px] font-black px-6 sm:px-10 md:px-14 py-5 md:py-6 rounded-full transition-all duration-300 overflow-hidden w-full max-w-md"
          >
            <span className="qr-btn-shine" />
            <div className="relative z-10 flex items-center gap-3 justify-center w-full">
              <svg viewBox="0 0 512 512" className="w-8 h-8 md:w-11 md:h-11 flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]">
                <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
                <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
                <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
                <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
              </svg>
              <div className="flex flex-col items-start text-left">
                <span className="text-[9px] md:text-[11px] font-black text-[#FFD700] tracking-[0.2em] leading-none">
                  GET IT ON
                </span>
                <span className="text-[20px] sm:text-[24px] md:text-[30px] font-black leading-tight mt-1">
                  Google Play
                </span>
              </div>
            </div>
          </button>

          <div className="flex flex-col items-center gap-1">
            <p className="qr-hindi text-[16px] md:text-[20px] font-black text-[#FFD700] qr-bounce-down">
              👇 अभी डाउनलोड करें
            </p>
            <p className="qr-hindi text-[12px] md:text-[13px] text-white/50 font-semibold">
              100% Free · कोई छिपा शुल्क नहीं
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-8 border-t border-white/10 max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="flex text-[#FFD700]">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-[13px] font-bold text-white/80">4.8 Rating</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <p className="qr-hindi text-[13px] font-bold text-white/80">
            ⭐ 10,000+ लोग जुड़े हैं
          </p>
        </div>
      </div>
    </section>
  );
}

/* FEATURE ONE */
function FeatureOne() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="features" className="min-h-screen flex items-center px-4 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#E63946]/[0.12] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
              ⚡ स्पीड · SPEED
            </p>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-2 text-white">
              सिर्फ 15 सेकंड
            </h2>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight text-white/40 mb-6">
              में बुकिंग
            </h2>
            <p className="text-[18px] md:text-[24px] font-bold text-[#FFD700] mb-4">
              Book in seconds. Not minutes.
            </p>
            <p className="qr-hindi text-[16px] md:text-[19px] text-white/70 leading-relaxed mb-4 font-medium">
              फोन कॉल भूल जाइए। लाइन भूल जाइए। बस टैप करें, समय चुनें, और बुकिंग हो गई।
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/25 via-[#FFD700]/15 to-transparent rounded-3xl border border-[#FFD700]/25" />
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="qr-gold-red-gradient text-[120px] md:text-[200px] font-black tracking-tight leading-none">
                    15
                  </div>
                  <div className="qr-hindi text-[24px] md:text-[32px] font-black text-white/80 mt-2">सेकंड</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FEATURE TWO */
function FeatureTwo() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-4 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
              💈 पसंद · CHOICE
            </p>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-2 text-white">
              अपना पसंदीदा
            </h2>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight qr-gold-red-gradient mb-6">
              बार्बर चुनें
            </h2>
            <p className="text-[18px] md:text-[24px] font-bold text-[#FFD700] mb-4">
              Your Barber. Your Choice.
            </p>
            <p className="qr-hindi text-[16px] md:text-[19px] text-white/70 leading-relaxed mb-4 font-medium">
              शहर के 500 से ज्यादा बार्बर में से चुनें। रिव्यू पढ़ें, तस्वीरें देखें, बुक करें।
            </p>
          </div>

          <div className={`md:order-1 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#E63946]/20 via-transparent to-[#FFD700]/15 rounded-3xl border border-[#E63946]/25" />
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[
                    { name: 'राज', rating: '4.9' },
                    { name: 'अमित', rating: '4.8' },
                    { name: 'विकास', rating: '4.9' },
                    { name: 'सुनील', rating: '4.7' }
                  ].map((barber, i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 hover:border-[#FFD700]/50 transition-all flex flex-col items-center justify-center p-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#E63946]/50 to-[#B01824]/50 rounded-full mb-3 flex items-center justify-center border-2 border-[#FFD700]/30">
                        <span className="qr-hindi text-white font-black text-lg">{barber.name[0]}</span>
                      </div>
                      <div className="qr-hindi text-[14px] font-bold text-white/90">{barber.name}</div>
                      <div className="text-[11px] text-[#FFD700] mt-1 font-bold">★ {barber.rating}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FEATURE THREE */
function FeatureThree() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-4 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#FFD700]/[0.1] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
              📍 लाइव ट्रैकिंग · LIVE
            </p>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-2 text-white">
              अपनी बारी
            </h2>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight text-white/40 mb-6">
              लाइव देखें
            </h2>
            <p className="text-[18px] md:text-[24px] font-bold text-[#FFD700] mb-4">
              Track your turn in real-time.
            </p>
            <p className="qr-hindi text-[16px] md:text-[19px] text-white/70 leading-relaxed mb-4 font-medium">
              GPS के साथ लाइव क्यू ट्रैकिंग। भीड़ में बैठने की जरूरत नहीं। सिर्फ अपनी बारी पर पहुंचे।
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FFD700]/20 to-transparent rounded-3xl border border-[#FFD700]/25" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="qr-hindi text-[16px] md:text-[18px] text-white/70 mb-4 font-bold">आपकी बारी में</div>
                <div className="qr-gold-red-gradient text-[80px] md:text-[140px] font-black tracking-tight leading-none">
                  8
                </div>
                <div className="qr-hindi text-[24px] md:text-[32px] font-black text-white/80 mt-2">मिनट</div>
                <div className="mt-8 w-full max-w-xs">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[#E63946] to-[#FFD700] qr-progress-bar" />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/50 mt-2 font-semibold">
                    <span className="qr-hindi">नंबर 3</span>
                    <span className="qr-hindi">आपकी बारी</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FEATURE FOUR */
function FeatureFour() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-4 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
              🎁 रिवॉर्ड्स · REWARDS
            </p>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-2 text-white">
              हर विजिट पर
            </h2>
            <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight qr-gold-red-gradient mb-6">
              पॉइंट्स कमाएं
            </h2>
            <p className="text-[18px] md:text-[24px] font-bold text-[#FFD700] mb-4">
              Earn rewards every visit.
            </p>
            <p className="qr-hindi text-[16px] md:text-[19px] text-white/70 leading-relaxed mb-4 font-medium">
              हर बुकिंग पर पॉइंट्स कमाएं। छूट और फ्री सर्विस के लिए रिडीम करें। वफादारी का इनाम।
            </p>
          </div>

          <div className={`md:order-1 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD700]/20 via-[#E63946]/12 to-transparent rounded-3xl border border-[#FFD700]/30" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="qr-hindi text-[13px] md:text-[14px] text-white/70 mb-2 tracking-[0.2em] uppercase font-black">आपके पॉइंट्स</div>
                <div className="qr-gold-red-gradient text-[70px] md:text-[130px] font-black tracking-tight leading-none">
                  2,450
                </div>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <div className="qr-hindi px-4 py-2 bg-[#E63946]/25 border border-[#E63946]/50 rounded-full text-[13px] text-[#FFD700] font-black">
                    ₹250 छूट
                  </div>
                  <div className="qr-hindi px-4 py-2 bg-[#FFD700]/15 border border-[#FFD700]/50 rounded-full text-[13px] text-[#FFD700] font-black">
                    फ्री सर्विस
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* HOW IT WORKS */
function HowItWorks() {
  const [ref, inView] = useInView();
  const steps = [
    { num: '01', hi: 'बार्बर चुनें', en: 'Choose Barber', desc: 'पास के वेरिफाइड बार्बर देखें' },
    { num: '02', hi: 'स्लॉट बुक करें', en: 'Book Your Slot', desc: 'अपनी सुविधा का समय चुनें' },
    { num: '03', hi: 'फ्रेश निकलें', en: 'Walk in Fresh', desc: 'सही समय पर पहुंचे, बिना इंतज़ार' },
  ];

  return (
    <section ref={ref} className="px-4 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E63946]/[0.1] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
            कैसे काम करता है
          </p>
          <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-4">
            <span className="qr-gold-red-gradient">बस 3 आसान स्टेप्स</span>
          </h2>
          <p className="text-[18px] md:text-[24px] font-bold text-white/70">
            Just 3 simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="qr-gold-red-gradient text-[80px] md:text-[130px] font-black tracking-tight leading-none opacity-40 mb-4">
                {step.num}
              </div>
              <h3 className="qr-hindi text-[28px] md:text-[38px] font-black tracking-tight mb-2 text-white">
                {step.hi}
              </h3>
              <p className="text-[15px] font-bold text-[#FFD700] mb-3">
                {step.en}
              </p>
              <p className="qr-hindi text-[16px] text-white/70 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* TESTIMONIALS */
function TestimonialsSection() {
  const [ref, inView] = useInView();
  const testimonials = [
    { quote: 'अब घंटों इंतज़ार नहीं करना पड़ता। Quttr ने काम आसान कर दिया।', name: 'राहुल शर्मा', city: 'दिल्ली' },
    { quote: 'क्यू ट्रैकिंग बहुत बढ़िया है। मैं सही समय पर पहुंचता हूं।', name: 'अमित कुमार', city: 'मुंबई' },
    { quote: 'मेरा पसंदीदा बार्बर हमेशा Quttr पर मिलता है।', name: 'विकास सिंह', city: 'बैंगलोर' },
  ];

  return (
    <section ref={ref} className="px-4 py-24 md:py-32 border-t border-white/[0.06] bg-gradient-to-b from-[#0A0000] to-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase mb-6">
            ⭐ रिव्यूज़
          </p>
          <h2 className="qr-hindi text-[36px] sm:text-[48px] md:text-[64px] font-black leading-[1.15] tracking-tight mb-4">
            <span className="text-white">10,000+ लोगों का</span>
            <br />
            <span className="qr-gold-red-gradient">भरोसा</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] rounded-2xl p-8 transition-all duration-1000 hover:border-[#FFD700]/50 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="qr-hindi text-[17px] leading-relaxed text-white/90 mb-6 font-semibold">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center border-2 border-[#FFD700]/30">
                  <span className="qr-hindi text-white font-black text-lg">{t.name[0]}</span>
                </div>
                <div>
                  <div className="qr-hindi text-[15px] font-black text-white">{t.name}</div>
                  <div className="qr-hindi text-[13px] text-[#FFD700] font-semibold">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* BARBER SECTION */
function BarberSection({ onDownload }) {
  const [ref, inView] = useInView();
  const benefits = [
    { hi: 'डिजिटल बुकिंग मैनेजमेंट', en: 'Digital appointment management' },
    { hi: 'लाइव कमाई ट्रैकिंग', en: 'Real-time earnings dashboard' },
    { hi: 'ज्यादा कस्टमर पाएं', en: 'Grow your customer base' },
    { hi: 'बिज़नेस एनालिटिक्स', en: 'Business analytics & insights' },
    { hi: 'मार्केटिंग सपोर्ट', en: 'Marketing & promotional tools' },
  ];

  return (
    <section ref={ref} id="barbers" className="px-4 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #050A20 0%, #000000 100%)' }}>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#1A237E]/[0.35] rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-6 qr-logo-float">
              <div className="absolute inset-0 bg-[#1A237E] blur-3xl rounded-full opacity-70 qr-logo-pulse" />
              <div className="relative w-full h-full flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#1A237E] to-[#0D1440] border-2 border-[#FFD700]/30">
                <img 
                  src="/quttr-business-logo.png" 
                  alt="Quttr Business"
                  className="w-full h-full object-contain absolute inset-0"
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center">
                  <span className="text-5xl">💼</span>
                </div>
              </div>
            </div>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-wider text-[#FFD700] uppercase px-4 py-2 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/[0.08]">
              💼 बार्बर के लिए
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight mb-2 text-white">
                अपना बिज़नेस
              </h2>
              <h2 className="qr-hindi text-[38px] sm:text-[52px] md:text-[72px] font-black leading-[1.15] tracking-tight qr-blue-gold-gradient mb-6">
                बढ़ाएं
              </h2>
              <p className="text-[18px] md:text-[24px] font-bold text-[#FFD700] mb-4">
                Grow Your Business.
              </p>
              <p className="qr-hindi text-[16px] md:text-[19px] text-white/70 leading-relaxed mb-8 font-medium">
                हज़ारों बार्बर पहले से Quttr Business के साथ अपना बिज़नेस बढ़ा रहे हैं।
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onDownload}
                  className="qr-mega-btn-blue group relative inline-flex items-center justify-center gap-3 text-white text-[15px] md:text-[18px] font-black px-6 py-4 md:px-8 md:py-5 rounded-full transition-all duration-300 overflow-hidden"
                >
                  <span className="qr-btn-shine" />
                  <div className="relative z-10 flex items-center gap-3">
                    <svg viewBox="0 0 512 512" className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]">
                      <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
                      <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
                      <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
                      <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
                    </svg>
                    <span className="qr-hindi">Quttr Business डाउनलोड</span>
                  </div>
                </button>

                <a
                  href="tel:+919519953149"
                  className="qr-hindi inline-flex items-center justify-center gap-2 text-[15px] font-bold text-[#FFD700] hover:text-white px-6 py-4 rounded-full border-2 border-[#FFD700]/40 hover:border-[#FFD700] transition-all"
                >
                  📞 कॉल करें
                </a>
              </div>
            </div>

            <div>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B08900] flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="qr-hindi text-[17px] font-black text-white">{benefit.hi}</div>
                      <div className="text-[13px] text-white/50 mt-0.5">{benefit.en}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FINAL CTA */
function FinalCTASection({ onDownload, locationText }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="download" className="relative px-4 py-32 md:py-48 border-t border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#E63946]/[0.18] rounded-full blur-[160px]" />
      </div>

      <div className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="qr-hindi inline-block text-[14px] md:text-[16px] font-bold text-[#FFD700] mb-6 px-5 py-2.5 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/[0.08]">
          📍 {locationText} में उपलब्ध
        </div>

        <h2 className="qr-hindi text-[60px] md:text-[140px] font-black leading-[1.15] tracking-tight mb-4">
          <span className="qr-gold-red-gradient">तैयार?</span>
        </h2>
        <p className="qr-hindi text-[20px] md:text-[28px] text-white/80 mb-4 font-bold">
          Quttr डाउनलोड करें
        </p>
        <p className="qr-hindi text-[16px] md:text-[20px] text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
          इंतज़ार को कहें अलविदा।
        </p>

        <button
          onClick={onDownload}
          className="qr-mega-btn group relative inline-flex items-center gap-3 text-white text-[18px] md:text-[26px] font-black px-8 md:px-16 py-6 md:py-7 rounded-full transition-all duration-300 overflow-hidden w-full max-w-md"
        >
          <span className="qr-btn-shine" />
          <div className="relative z-10 flex items-center gap-3 justify-center w-full">
            <svg viewBox="0 0 512 512" className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]">
              <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
              <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
              <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
              <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] md:text-[12px] font-black text-[#FFD700] tracking-[0.2em] leading-none">
                GET IT ON
              </span>
              <span className="text-[22px] md:text-[32px] font-black leading-tight mt-1">
                Google Play
              </span>
            </div>
          </div>
        </button>

        <p className="qr-hindi mt-8 text-[16px] md:text-[18px] font-black text-[#FFD700] qr-bounce-down">
          👇 अभी डाउनलोड करें · Free
        </p>
      </div>
    </section>
  );
}

/* FOOTER */
function FooterSection() {
  return (
    <footer className="px-4 py-16 border-t border-white/[0.06] bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[20px] font-black">
              Quttr<span className="text-[#FFD700]">.</span>
            </span>
          </div>
          <p className="qr-hindi text-[15px] text-white/60 font-semibold mb-2">
            भारत का सबसे तेज़ बार्बर बुकिंग ऐप
          </p>
          <p className="text-[13px] text-white/40">
            India's fastest barber booking app
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-12 text-[13px] font-semibold">
          <a href="mailto:support@quttrr.com" className="text-white/60 hover:text-[#FFD700] transition-colors">
            support@quttrr.com
          </a>
          <a href="tel:+919519953149" className="text-white/60 hover:text-[#FFD700] transition-colors">
            +91 9519953149
          </a>
          <a href="https://instagram.com/quttrofficial" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#FFD700] transition-colors">
            Instagram
          </a>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-white/40 font-semibold">
            © 2025 Quttr. All rights reserved.
          </p>
          <p className="qr-hindi text-[12px] text-white/40 font-semibold">
            प्यार से भारत में बनाया गया 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}

/* GLOBAL STYLES */
function GlobalStyles() {
  return (
    <style jsx global>{`
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #000; color: #fff; }
      html { scroll-behavior: smooth; }
      
      .qr-hero-title { 
        font-feature-settings: 'kern' 1;
        overflow: visible !important;
      }
      
      .qr-hindi { 
        font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
        line-height: 1.4 !important;
      }
      
      h1.qr-hindi, h2.qr-hindi {
        line-height: 1.25 !important;
        padding-bottom: 0.1em;
      }
      
      .qr-gold-red-gradient {
        background: linear-gradient(135deg, #FFD700 0%, #E63946 50%, #FFD700 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; 
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: qr-gradient-shift 6s ease-in-out infinite;
        display: inline-block;
        padding-bottom: 0.15em;
      }
      
      .qr-blue-gold-gradient {
        background: linear-gradient(135deg, #FFD700 0%, #3949AB 50%, #FFD700 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; 
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: qr-gradient-shift 6s ease-in-out infinite;
        display: inline-block;
        padding-bottom: 0.15em;
      }
      
      @keyframes qr-gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      .qr-mega-btn {
        background: linear-gradient(135deg, #E63946 0%, #B01824 100%);
        box-shadow: 0 0 0 1px rgba(255,215,0,0.3), 0 15px 50px -8px rgba(230,57,70,0.7), 0 0 80px rgba(255,215,0,0.25);
        animation: qr-mega-pulse 2.5s ease-in-out infinite;
      }
      .qr-mega-btn:hover {
        transform: scale(1.03);
        box-shadow: 0 0 0 2px rgba(255,215,0,0.5), 0 20px 60px -5px rgba(230,57,70,0.9), 0 0 100px rgba(255,215,0,0.5);
      }
      .qr-mega-btn:active { transform: scale(0.98); }
      
      .qr-mega-btn-blue {
        background: linear-gradient(135deg, #3949AB 0%, #1A237E 100%);
        box-shadow: 0 0 0 1px rgba(255,215,0,0.3), 0 15px 50px -8px rgba(26,35,126,0.7), 0 0 60px rgba(255,215,0,0.15);
      }
      .qr-mega-btn-blue:hover {
        transform: scale(1.03);
      }
      
      @keyframes qr-mega-pulse {
        0%, 100% { box-shadow: 0 0 0 1px rgba(255,215,0,0.3), 0 15px 50px -8px rgba(230,57,70,0.7), 0 0 80px rgba(255,215,0,0.25); }
        50% { box-shadow: 0 0 0 2px rgba(255,215,0,0.6), 0 20px 60px -5px rgba(230,57,70,0.95), 0 0 120px rgba(255,215,0,0.5); }
      }
      
      .qr-btn-shine {
        position: absolute; inset: 0;
        background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%);
        transform: translateX(-150%) skewX(-20deg);
        animation: qr-shine-move 3s ease-in-out infinite;
      }
      @keyframes qr-shine-move {
        0% { transform: translateX(-150%) skewX(-20deg); }
        60%, 100% { transform: translateX(200%) skewX(-20deg); }
      }
      
      .qr-logo-float { animation: qr-float 4s ease-in-out infinite; }
      @keyframes qr-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      
      .qr-logo-pulse { animation: qr-pulse 3s ease-in-out infinite; }
      @keyframes qr-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.15); }
      }
      
      .qr-bounce-down { animation: qr-bounce-down-anim 1.6s ease-in-out infinite; }
      @keyframes qr-bounce-down-anim {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(6px); }
      }
      
      .qr-progress-bar { animation: qr-progress 2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
      @keyframes qr-progress {
        0% { width: 25%; }
        50% { width: 75%; }
        100% { width: 25%; }
      }
      
      ::selection { background: rgba(230,57,70,0.4); color: white; }
      
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  );
}
