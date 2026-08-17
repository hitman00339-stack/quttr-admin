'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

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
  const [sessionId, setSessionId] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const trackedPageView = useRef(false);

  useEffect(() => {
    setSessionId(sid || makeSessionId());
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <HeroSection onDownload={downloadCustomer} />
        <FeatureOne />
        <FeatureTwo />
        <FeatureThree />
        <FeatureFour />
        <HowItWorks />
        <TestimonialsSection />
        <BarberSection onDownload={downloadBusiness} />
        <FinalCTASection onDownload={downloadCustomer} />
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9">
            <Image src="/quttr-logo.png" alt="Quttr" width={36} height={36} className="object-contain" />
          </div>
          <span className="text-[17px] font-black tracking-tight">
            Quttr<span className="text-[#FFD700]">.</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/70 font-semibold">
          <a href="#features" className="hover:text-[#FFD700] transition-colors">Features</a>
          <a href="#barbers" className="hover:text-[#FFD700] transition-colors">For Barbers</a>
          <a href="#download" className="hover:text-[#FFD700] transition-colors">Download</a>
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

/* HERO SECTION */
function HeroSection({ onDownload }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#E63946]/[0.18] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FFD700]/[0.1] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#B01824]/[0.12] rounded-full blur-[110px]" />
      </div>

      <div className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* BIG LOGO */}
        <div className="flex justify-center mb-10">
          <div className="relative w-36 h-36 md:w-44 md:h-44 qr-logo-float">
            <div className="absolute inset-0 bg-[#E63946]/50 blur-3xl rounded-full qr-logo-pulse" />
            <Image
              src="/quttr-logo.png"
              alt="Quttr Logo"
              fill
              className="object-contain relative z-10 drop-shadow-[0_0_50px_rgba(230,57,70,0.7)]"
              priority
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 mb-6">
          <span className="qr-hindi text-[11px] md:text-[12px] font-black tracking-[0.25em] text-[#FFD700] uppercase px-4 py-2 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/[0.08]">
            ✂️ भारत का #1 बार्बर ऐप
          </span>
        </div>

        <h1 className="qr-hero-title text-[54px] md:text-[110px] font-black leading-[1.02] tracking-[-0.04em] text-white mb-6">
          <span className="qr-hindi qr-gold-red-gradient block">इंतज़ार खत्म।</span>
          <span className="qr-hindi text-white block mt-2">Fresh लुक शुरू।</span>
        </h1>

        <p className="text-[22px] md:text-[32px] font-bold text-white/70 mb-4 tracking-tight">
          Skip the Wait. Walk in Fresh.
        </p>

        <p className="qr-hindi text-[19px] md:text-[24px] text-[#FFD700] mb-3 font-bold">
          बुकिंग सेकंडों में। बार्बर आपकी पसंद का।
        </p>

        <p className="qr-hindi text-[16px] md:text-[20px] text-white/60 max-w-2xl mx-auto leading-relaxed mb-14">
          अब लाइन में लगने की जरूरत नहीं। घर बैठे बुक करें,
          <br className="hidden md:block" />
          अपनी बारी पर पहुंचे, और fresh look के साथ निकलें।
        </p>

        {/* MEGA DOWNLOAD BUTTON */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <button
            onClick={onDownload}
            className="qr-mega-btn group relative inline-flex items-center gap-4 text-white text-[20px] md:text-[24px] font-black px-10 md:px-16 py-6 md:py-7 rounded-full transition-all duration-300 overflow-hidden"
          >
            <span className="qr-btn-shine" />
            <div className="relative z-10 flex items-center gap-4">
              <svg viewBox="0 0 512 512" className="w-9 h-9 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]">
                <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
                <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
                <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
                <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
              </svg>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] md:text-[12px] font-black text-[#FFD700] tracking-[0.25em] leading-none">
                  GET IT ON
                </span>
                <span className="text-[24px] md:text-[32px] font-black leading-tight mt-1">
                  Google Play
                </span>
              </div>
            </div>
          </button>

          <div className="flex flex-col items-center gap-1">
            <p className="qr-hindi text-[18px] md:text-[22px] font-black text-[#FFD700] qr-bounce-down">
              👇 अभी डाउनलोड करें
            </p>
            <p className="qr-hindi text-[13px] text-white/50 font-semibold">
              100% Free · कोई छिपा हुआ शुल्क नहीं
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-8 border-t border-white/10 max-w-2xl mx-auto">
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
            ⭐ 10,000+ लोग जुड़ चुके हैं
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-40">
        <div className="w-5 h-8 border border-[#FFD700]/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-[#FFD700]/60 rounded-full qr-scroll-dot" />
        </div>
      </div>
    </section>
  );
}

/* FEATURE ONE */
function FeatureOne() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="features" className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#E63946]/[0.12] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
              ⚡ स्पीड · SPEED
            </p>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-2 text-white">
              15 सेकंड में
            </h2>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] text-white/40 mb-6">
              बुकिंग हो जाए।
            </h2>
            <p className="text-[20px] md:text-[26px] font-bold text-[#FFD700] mb-4">
              Book in seconds. Not minutes.
            </p>
            <p className="qr-hindi text-[17px] md:text-[20px] text-white/70 leading-relaxed mb-4 font-medium">
              फोन कॉल भूल जाइए। इंतज़ार भूल जाइए। बस टैप करें, समय चुनें, और बुकिंग हो गई।
            </p>
            <p className="text-[16px] md:text-[18px] text-white/50 leading-relaxed">
              Your favorite barber is just one tap away.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/25 via-[#FFD700]/15 to-transparent rounded-3xl border border-[#FFD700]/25" />
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="qr-gold-red-gradient text-[120px] md:text-[220px] font-black tracking-[-0.04em] leading-none">
                    15
                  </div>
                  <div className="qr-hindi text-[26px] md:text-[32px] font-black text-white/80 mt-2">सेकंड</div>
                  <div className="text-[15px] text-white/40 mt-1">seconds only</div>
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
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
              💈 पसंद · CHOICE
            </p>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-2 text-white">
              अपना पसंदीदा
            </h2>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] qr-gold-red-gradient mb-6">
              बार्बर चुनें।
            </h2>
            <p className="text-[20px] md:text-[26px] font-bold text-[#FFD700] mb-4">
              Your Barber. Your Choice.
            </p>
            <p className="qr-hindi text-[17px] md:text-[20px] text-white/70 leading-relaxed mb-4 font-medium">
              शहर के 500+ बार्बर में से चुनें। उनके काम की तस्वीरें देखें, रिव्यू पढ़ें, और अपने style समझने वाले को बुक करें।
            </p>
            <p className="text-[16px] md:text-[18px] text-white/50 leading-relaxed">
              Choose from hundreds of skilled barbers in your city.
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
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#FFD700]/[0.1] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
              📍 लाइव ट्रैकिंग · LIVE
            </p>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-2 text-white">
              अपनी बारी
            </h2>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] text-white/40 mb-6">
              लाइव देखें।
            </h2>
            <p className="text-[20px] md:text-[26px] font-bold text-[#FFD700] mb-4">
              Track your turn in real-time.
            </p>
            <p className="qr-hindi text-[17px] md:text-[20px] text-white/70 leading-relaxed mb-4 font-medium">
              GPS के साथ live queue tracking। भीड़ भरी दुकान में बैठने की जरूरत नहीं। बस अपनी बारी पर पहुंचे।
            </p>
            <p className="text-[16px] md:text-[18px] text-white/50 leading-relaxed">
              Arrive exactly when it's your turn.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FFD700]/20 to-transparent rounded-3xl border border-[#FFD700]/25" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="qr-hindi text-[17px] text-white/70 mb-4 font-bold">आपकी बारी में</div>
                <div className="qr-gold-red-gradient text-[80px] md:text-[150px] font-black tracking-[-0.04em] leading-none">
                  8
                </div>
                <div className="qr-hindi text-[26px] md:text-[32px] font-black text-white/80 mt-2">मिनट</div>
                <div className="text-[14px] text-white/40 mt-1">minutes remaining</div>
                <div className="mt-8 w-full max-w-xs">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[#E63946] to-[#FFD700] qr-progress-bar" />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/50 mt-2 font-semibold">
                    <span>Position 3</span>
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
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
              🎁 रिवॉर्ड्स · REWARDS
            </p>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-2 text-white">
              हर विजिट पर
            </h2>
            <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] qr-gold-red-gradient mb-6">
              पॉइंट्स कमाएं।
            </h2>
            <p className="text-[20px] md:text-[26px] font-bold text-[#FFD700] mb-4">
              Earn rewards every visit.
            </p>
            <p className="qr-hindi text-[17px] md:text-[20px] text-white/70 leading-relaxed mb-4 font-medium">
              हर बुकिंग पर पॉइंट्स कमाएं। छूट, फ्री सर्विस, और premium features के लिए redeem करें। वफादारी का इनाम मिलता है।
            </p>
            <p className="text-[16px] md:text-[18px] text-white/50 leading-relaxed">
              Loyalty pays. Redeem for discounts and premium features.
            </p>
          </div>

          <div className={`md:order-1 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD700]/20 via-[#E63946]/12 to-transparent rounded-3xl border border-[#FFD700]/30" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="qr-hindi text-[14px] text-white/70 mb-2 tracking-[0.2em] uppercase font-black">आपके पॉइंट्स</div>
                <div className="qr-gold-red-gradient text-[80px] md:text-[140px] font-black tracking-[-0.04em] leading-none">
                  2,450
                </div>
                <div className="text-[17px] text-white/60 mt-2 font-bold">Total Points</div>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  <div className="px-4 py-2 bg-[#E63946]/25 border border-[#E63946]/50 rounded-full text-[13px] text-[#FFD700] qr-hindi font-black">
                    ₹250 छूट
                  </div>
                  <div className="px-4 py-2 bg-[#FFD700]/15 border border-[#FFD700]/50 rounded-full text-[13px] text-[#FFD700] qr-hindi font-black">
                    Free सर्विस
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
    { num: '01', hi: 'बार्बर चुनें', en: 'Choose Barber', desc: 'अपने पास के verified बार्बर देखें' },
    { num: '02', hi: 'स्लॉट बुक करें', en: 'Book Your Slot', desc: 'अपनी सुविधा का समय चुनें' },
    { num: '03', hi: 'Fresh निकलें', en: 'Walk in Fresh', desc: 'सही समय पर पहुंचे, बिना इंतज़ार' },
  ];

  return (
    <section ref={ref} className="px-6 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E63946]/[0.1] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
            कैसे काम करता है
          </p>
          <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-4">
            <span className="qr-gold-red-gradient">बस 3 आसान steps।</span>
          </h2>
          <p className="text-[20px] md:text-[26px] font-bold text-white/70">
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
              <div className="qr-gold-red-gradient text-[100px] md:text-[140px] font-black tracking-[-0.04em] leading-none opacity-40 mb-4">
                {step.num}
              </div>
              <h3 className="qr-hindi text-[32px] md:text-[42px] font-black tracking-[-0.02em] mb-2 text-white">
                {step.hi}
              </h3>
              <p className="text-[16px] font-bold text-[#FFD700] mb-3">
                {step.en}
              </p>
              <p className="qr-hindi text-[17px] text-white/70 leading-relaxed">
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
    { quote: 'अब घंटों इंतज़ार नहीं करना पड़ता। Quttr ने मेरी life आसान कर दी।', en: 'No more waiting for hours.', name: 'राहुल शर्मा', city: 'दिल्ली' },
    { quote: 'Queue tracking बहुत बढ़िया है। मैं exact time पर पहुंचता हूं।', en: 'Queue tracking is amazing.', name: 'अमित कुमार', city: 'मुंबई' },
    { quote: 'मेरा पसंदीदा बार्बर हमेशा Quttr पर available रहता है।', en: 'My favorite barber is always available.', name: 'विकास सिंह', city: 'बैंगलोर' },
  ];

  return (
    <section ref={ref} className="px-6 py-24 md:py-32 border-t border-white/[0.06] bg-gradient-to-b from-[#0A0000] to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,57,70,0.06),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="qr-hindi text-[13px] font-black tracking-[0.3em] text-[#FFD700] uppercase mb-6">
            ⭐ Reviews
          </p>
          <h2 className="qr-hindi text-[40px] md:text-[70px] font-black leading-[1.1] tracking-[-0.03em] mb-4">
            <span className="text-white">10,000+ लोगों का</span>
            <br />
            <span className="qr-gold-red-gradient">भरोसा।</span>
          </h2>
          <p className="text-[19px] md:text-[24px] font-bold text-white/70">
            Trusted by thousands across India.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.1] rounded-2xl p-8 transition-all duration-1000 hover:border-[#FFD700]/50 hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="qr-hindi text-[18px] leading-relaxed text-white/90 mb-4 font-semibold">
                "{t.quote}"
              </p>
              <p className="text-[14px] italic text-white/50 mb-6">
                {t.en}
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
    { hi: 'रियल-टाइम कमाई ट्रैकिंग', en: 'Real-time earnings dashboard' },
    { hi: 'कस्टमर लॉयल्टी प्रोग्राम', en: 'Customer loyalty programs' },
    { hi: 'बिज़नेस एनालिटिक्स', en: 'Business analytics & insights' },
    { hi: 'मार्केटिंग सपोर्ट', en: 'Marketing & promotional tools' },
  ];

  return (
    <section ref={ref} id="barbers" className="px-6 py-24 md:py-32 border-t border-white/[0.06] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #050A20 0%, #000000 100%)' }}>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#1A237E]/[0.35] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#FFD700]/[0.1] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-28 h-28 md:w-36 md:h-36 mb-6 qr-logo-float">
              <div className="absolute inset-0 bg-[#1A237E] blur-3xl rounded-full opacity-70 qr-logo-pulse" />
              <Image
                src="/quttr-business-logo.png"
                alt="Quttr Business"
                fill
                className="object-contain relative z-10 drop-shadow-[0_0_40px_rgba(26,35,126,0.8)]"
              />
            </div>
            <p className="qr-hindi text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#FFD700] uppercase px-4 py-2 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/[0.08]">
              💼 बार्बर के लिए · For Barbers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] mb-2 text-white">
                अपना बिज़नेस
              </h2>
              <h2 className="qr-hindi text-[48px] md:text-[80px] font-black leading-[1.02] tracking-[-0.03em] qr-blue-gold-gradient mb-6">
                digitally बढ़ाएं।
              </h2>
              <p className="text-[20px] md:text-[26px] font-bold text-[#FFD700] mb-4">
                Grow Your Business Digitally.
              </p>
              <p className="qr-hindi text-[17px] md:text-[20px] text-white/70 leading-relaxed mb-4 font-medium">
                हज़ारों बार्बर पहले से Quttr Business के साथ अपना बिज़नेस बढ़ा रहे हैं।
              </p>
              <p className="text-[16px] md:text-[18px] text-white/50 leading-relaxed mb-8">
                Join thousands already growing with Quttr Business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onDownload}
                  className="qr-mega-btn-blue group relative inline-flex items-center gap-3 text-white text-[17px] md:text-[20px] font-black px-8 py-5 md:px-10 md:py-6 rounded-full transition-all duration-300 overflow-hidden"
                >
                  <span className="qr-btn-shine" />
                  <div className="relative z-10 flex items-center gap-3">
                    <svg viewBox="0 0 512 512" className="w-7 h-7 md:w-9 md:h-9 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]">
                      <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
                      <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
                      <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
                      <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
                    </svg>
                    <span className="qr-hindi">Quttr BUSINESS डाउनलोड</span>
                  </div>
                </button>

                <a
                  href="tel:+919519953149"
                  className="qr-hindi inline-flex items-center justify-center gap-2 text-[16px] font-bold text-[#FFD700] hover:text-white px-6 py-5 rounded-full border-2 border-[#FFD700]/40 hover:border-[#FFD700] transition-all"
                >
                  📞 अभी कॉल करें
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
                      <div className="qr-hindi text-[18px] font-black text-white">{benefit.hi}</div>
                      <div className="text-[14px] text-white/50 mt-0.5">{benefit.en}</div>
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
function FinalCTASection({ onDownload }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="download" className="relative px-6 py-32 md:py-48 border-t border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#E63946]/[0.18] rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD700]/[0.1] rounded-full blur-[140px]" />
      </div>

      <div className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="qr-hindi text-[70px] md:text-[160px] font-black leading-[1] tracking-[-0.04em] mb-4">
          <span className="qr-gold-red-gradient">तैयार?</span>
        </h2>
        <p className="text-[32px] md:text-[56px] font-black text-white/70 mb-8">
          Ready?
        </p>
        <p className="qr-hindi text-[22px] md:text-[30px] text-white/80 mb-4 font-bold">
          Quttr डाउनलोड करें और इंतज़ार को कहें अलविदा।
        </p>
        <p className="text-[16px] md:text-[22px] text-white/50 mb-14 max-w-2xl mx-auto leading-relaxed">
          Download Quttr and skip the wait forever.
        </p>

        <button
          onClick={onDownload}
          className="qr-mega-btn group relative inline-flex items-center gap-4 text-white text-[22px] md:text-[28px] font-black px-12 md:px-20 py-7 md:py-8 rounded-full transition-all duration-300 overflow-hidden"
        >
          <span className="qr-btn-shine" />
          <div className="relative z-10 flex items-center gap-4">
            <svg viewBox="0 0 512 512" className="w-10 h-10 md:w-14 md:h-14 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]">
              <path fill="#FFD700" d="M99 8c-6 3-11 9-13 17v462c2 8 7 14 13 17l255-248L99 8z" />
              <path fill="#FFDE4A" d="M354 256l-72-72L99 8c-4 2-8 5-10 9l188 239 77-0z" />
              <path fill="#FFD700" d="M99 504c2 4 6 7 10 9l183-176-77-81L99 504z" />
              <path fill="#FFDE4A" d="M354 256l83-48c11-6 11-22 0-28l-83-48-77 76 77 48z" />
            </svg>
            <div className="flex flex-col items-start text-left">
              <span className="text-[11px] md:text-[13px] font-black text-[#FFD700] tracking-[0.25em] leading-none">
                GET IT ON
              </span>
              <span className="text-[26px] md:text-[36px] font-black leading-tight mt-1">
                Google Play
              </span>
            </div>
          </div>
        </button>

        <p className="qr-hindi mt-8 text-[17px] md:text-[20px] font-black text-[#FFD700] qr-bounce-down">
          👇 अभी डाउनलोड करें · 100% Free
        </p>
        <p className="mt-2 text-[13px] text-white/40 font-semibold">
          ★ 4.8 rating · 10,000+ downloads
        </p>
      </div>
    </section>
  );
}

/* FOOTER */
function FooterSection() {
  return (
    <footer className="px-6 py-16 border-t border-white/[0.06] bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-9 h-9">
                <Image src="/quttr-logo.png" alt="Quttr" width={36} height={36} className="object-contain" />
              </div>
              <span className="text-[17px] font-black">
                Quttr<span className="text-[#FFD700]">.</span>
              </span>
            </div>
            <p className="qr-hindi text-[13px] text-white/60 leading-relaxed font-semibold">
              भारत का सबसे तेज़ बार्बर बुकिंग ऐप।
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-black text-[#FFD700] mb-4 tracking-wider uppercase">Product</h4>
            <ul className="space-y-2 text-[13px] text-white/60 font-semibold">
              <li><a href="#features" className="hover:text-[#FFD700] transition-colors qr-hindi">Features · फीचर्स</a></li>
              <li><a href="#download" className="hover:text-[#FFD700] transition-colors qr-hindi">Download · डाउनलोड</a></li>
              <li><a href="#barbers" className="hover:text-[#FFD700] transition-colors qr-hindi">For Barbers · बार्बर</a></li>
            </ul>
          </div>

          <div>
            <h4 className="qr-hindi text-[13px] font-black text-[#FFD700] mb-4 tracking-wider uppercase">Support · सपोर्ट</h4>
            <ul className="space-y-2 text-[13px] text-white/60 font-semibold">
              <li><a href="mailto:support@quttrr.com" className="hover:text-[#FFD700] transition-colors">Email</a></li>
              <li><a href="tel:+919519953149" className="hover:text-[#FFD700] transition-colors qr-hindi">Phone · फोन</a></li>
              <li><a href="https://wa.me/919519953149" className="hover:text-[#FFD700] transition-colors">WhatsApp</a></li>
            </ul>
          </div>

          <div>
            <h4 className="qr-hindi text-[13px] font-black text-[#FFD700] mb-4 tracking-wider uppercase">Connect · जुड़ें</h4>
            <ul className="space-y-2 text-[13px] text-white/60 font-semibold">
              <li><a href="https://instagram.com/quttrofficial" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition-colors">Instagram</a></li>
              <li><a href="mailto:support@quttrr.com" className="hover:text-[#FFD700] transition-colors">support@quttrr.com</a></li>
              <li><a href="tel:+919519953149" className="hover:text-[#FFD700] transition-colors">+91 9519953149</a></li>
            </ul>
          </div>
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
      .qr-hero-title { font-feature-settings: 'kern' 1; }
      .qr-hindi { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
      .qr-gold-red-gradient {
        background: linear-gradient(135deg, #FFD700 0%, #E63946 50%, #FFD700 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: qr-gradient-shift 6s ease-in-out infinite;
      }
      .qr-blue-gold-gradient {
        background: linear-gradient(135deg, #FFD700 0%, #3949AB 50%, #FFD700 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: qr-gradient-shift 6s ease-in-out infinite;
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
        transform: scale(1.05);
        box-shadow: 0 0 0 2px rgba(255,215,0,0.5), 0 20px 60px -5px rgba(230,57,70,0.9), 0 0 100px rgba(255,215,0,0.5);
      }
      .qr-mega-btn:active { transform: scale(0.98); }
      .qr-mega-btn-blue {
        background: linear-gradient(135deg, #3949AB 0%, #1A237E 100%);
        box-shadow: 0 0 0 1px rgba(255,215,0,0.3), 0 15px 50px -8px rgba(26,35,126,0.7), 0 0 60px rgba(255,215,0,0.15);
      }
      .qr-mega-btn-blue:hover {
        transform: scale(1.05);
        box-shadow: 0 0 0 2px rgba(255,215,0,0.5), 0 20px 60px -5px rgba(26,35,126,0.9), 0 0 80px rgba(255,215,0,0.35);
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
      .qr-scroll-dot { animation: qr-scroll-anim 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
      @keyframes qr-scroll-anim {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(8px); opacity: 1; }
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
