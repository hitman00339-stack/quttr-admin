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
      <div className="relative">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
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

/* ============================================
   STICKY HEADER
   ============================================ */
function StickyHeader({ scrolled, onDownload }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.08]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="3" stroke="white" strokeWidth="1.5" />
            <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="1.5" />
            <path d="M20 4L8.12 15.88" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14.47 14.48L20 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8.12 8.12L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight">Quttr</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/70">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#barbers" className="hover:text-white transition-colors">For Barbers</a>
          <a href="#download" className="hover:text-white transition-colors">Download</a>
        </nav>

        <button
          onClick={onDownload}
          className="text-[13px] font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-all"
        >
          Get the app
        </button>
      </div>
    </header>
  );
}

/* ============================================
   HERO SECTION - Apple Style
   ============================================ */
function HeroSection({ onDownload }) {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E63946]/[0.08] rounded-full blur-[120px]" />
      </div>

      <div className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Small badge */}
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/50 uppercase">
            Introducing Quttr
          </span>
        </div>

        {/* Massive headline - Apple style */}
        <h1 className="qr-hero-title text-[52px] md:text-[96px] font-bold leading-[1.05] tracking-[-0.04em] text-white mb-6">
          Skip the wait.
          <br />
          <span className="qr-gradient-text">Walk in fresh.</span>
        </h1>

        {/* Hindi subtitle */}
        <p className="qr-hindi text-[22px] md:text-[28px] font-medium text-white/60 mb-8 tracking-tight">
          बुकिंग सेकंडों में। इंतज़ार भूल जाइए।
        </p>

        {/* Description */}
        <p className="text-[18px] md:text-[21px] text-white/60 max-w-2xl mx-auto leading-relaxed mb-12 font-normal">
          The fastest way to book your favorite barber.
          <br className="hidden md:block" />
          No more waiting. No more phone calls.
        </p>

        {/* CTAs - Apple style */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={onDownload}
            className="qr-btn-primary group inline-flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[17px] font-normal px-6 py-3 rounded-full transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M3 20.5V3.5a.5.5 0 0 1 .8-.4l14.5 8.5a.5.5 0 0 1 0 .8L3.8 20.9a.5.5 0 0 1-.8-.4z" />
            </svg>
            Download for Android
          </button>

          <a
            href="#features"
            className="group inline-flex items-center gap-1 text-[17px] font-normal text-[#2997FF] hover:underline"
          >
            Learn more
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.7 6.3a1 1 0 0 0 0 1.4l4.3 4.3-4.3 4.3a1 1 0 1 0 1.4 1.4l5-5a1 1 0 0 0 0-1.4l-5-5a1 1 0 0 0-1.4 0z" />
            </svg>
          </a>
        </div>

        {/* Trust text */}
        <p className="text-[13px] text-white/40 font-normal">
          Free • ★ 4.8 rating • 10,000+ downloads
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30">
        <div className="w-5 h-8 border border-white/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-white/60 rounded-full qr-scroll-dot" />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FEATURE ONE - Speed
   ============================================ */
function FeatureOne() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="features" className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[13px] font-semibold tracking-[0.3em] text-[#2997FF] uppercase mb-6">
              Speed
            </p>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-2">
              Book in seconds.
            </h2>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white/40 mb-6">
              Not minutes.
            </h2>
            <p className="qr-hindi text-[20px] font-medium text-white/60 mb-6">
              15 सेकंड में बुक करें।
            </p>
            <p className="text-[18px] md:text-[19px] text-white/60 leading-relaxed">
              Skip the phone calls. Skip the waiting. Just tap, select your time, and you're done. Your favorite barber is one tap away.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0071E3]/20 to-transparent rounded-3xl" />
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[120px] md:text-[180px] font-bold tracking-[-0.04em] leading-none bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                    15
                  </div>
                  <div className="text-[24px] font-medium text-white/50 mt-2">seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FEATURE TWO - Choice
   ============================================ */
function FeatureTwo() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[13px] font-semibold tracking-[0.3em] text-[#2997FF] uppercase mb-6">
              Choice
            </p>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-2">
              Your barber.
            </h2>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white/40 mb-6">
              Your choice.
            </h2>
            <p className="qr-hindi text-[20px] font-medium text-white/60 mb-6">
              अपना पसंदीदा बार्बर।
            </p>
            <p className="text-[18px] md:text-[19px] text-white/60 leading-relaxed">
              Choose from hundreds of skilled barbers in your city. See their portfolios, read reviews, and book the one who understands your style.
            </p>
          </div>

          <div className={`md:order-1 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#E63946]/10 to-transparent rounded-3xl" />
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-2xl border border-white/[0.08] flex items-center justify-center hover:border-white/20 transition-colors">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-full mx-auto mb-2" />
                        <div className="text-[10px] text-white/40">★ 4.{9 - i}</div>
                      </div>
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

/* ============================================
   FEATURE THREE - Tracking
   ============================================ */
function FeatureThree() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[13px] font-semibold tracking-[0.3em] text-[#2997FF] uppercase mb-6">
              Tracking
            </p>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-2">
              Know your turn.
            </h2>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white/40 mb-6">
              Down to the minute.
            </h2>
            <p className="qr-hindi text-[20px] font-medium text-white/60 mb-6">
              अपनी बारी जानें।
            </p>
            <p className="text-[18px] md:text-[19px] text-white/60 leading-relaxed">
              Real-time queue tracking with GPS. No more sitting in crowded shops. Arrive exactly when it's your turn.
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#0071E3]/15 to-transparent rounded-3xl" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="text-[16px] text-white/50 mb-4">Your turn in</div>
                <div className="text-[80px] md:text-[120px] font-bold tracking-[-0.04em] leading-none text-white">
                  8
                </div>
                <div className="text-[24px] font-medium text-white/60 mt-2">minutes</div>
                <div className="mt-8 w-full max-w-xs">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-[#0071E3] qr-progress-bar" />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/40 mt-2">
                    <span>Position 3</span>
                    <span>Position 1</span>
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

/* ============================================
   FEATURE FOUR - Rewards
   ============================================ */
function FeatureFour() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="min-h-screen flex items-center px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className={`md:order-2 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-[13px] font-semibold tracking-[0.3em] text-[#2997FF] uppercase mb-6">
              Rewards
            </p>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-2">
              Get rewarded.
            </h2>
            <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white/40 mb-6">
              Every visit.
            </h2>
            <p className="qr-hindi text-[20px] font-medium text-white/60 mb-6">
              हर विजिट पर रिवॉर्ड।
            </p>
            <p className="text-[18px] md:text-[19px] text-white/60 leading-relaxed">
              Earn points on every booking. Redeem for discounts, exclusive services, and premium features. Loyalty pays.
            </p>
          </div>

          <div className={`md:order-1 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD700]/10 to-transparent rounded-3xl" />
              <div className="relative h-full flex flex-col justify-center items-center p-8">
                <div className="text-[14px] text-white/50 mb-2 tracking-[0.2em] uppercase">Total Points</div>
                <div className="text-[100px] md:text-[140px] font-bold tracking-[-0.04em] leading-none bg-gradient-to-b from-[#FFD700] to-[#FFD700]/40 bg-clip-text text-transparent">
                  2,450
                </div>
                <div className="mt-8 flex gap-3">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[12px] text-white/60">
                    ₹250 off
                  </div>
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[12px] text-white/60">
                    Free service
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

/* ============================================
   HOW IT WORKS
   ============================================ */
function HowItWorks() {
  const [ref, inView] = useInView();
  const steps = [
    { num: '01', title: 'Choose barber', hi: 'बार्बर चुनें', desc: 'Browse verified barbers near you' },
    { num: '02', title: 'Book slot', hi: 'स्लॉट बुक करें', desc: 'Pick a time that works for you' },
    { num: '03', title: 'Walk in fresh', hi: 'फ्रेश निकलें', desc: 'Arrive on time, no waiting' },
  ];

  return (
    <section ref={ref} className="px-6 py-24 md:py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[13px] font-semibold tracking-[0.3em] text-[#2997FF] uppercase mb-6">
            How it works
          </p>
          <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-4">
            Three simple steps.
          </h2>
          <p className="qr-hindi text-[20px] font-medium text-white/60">
            बस तीन आसान स्टेप्स।
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="text-[80px] md:text-[100px] font-bold tracking-[-0.04em] leading-none text-white/10 mb-6">
                {step.num}
              </div>
              <h3 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] mb-2">
                {step.title}
              </h3>
              <p className="qr-hindi text-[16px] font-medium text-white/50 mb-3">
                {step.hi}
              </p>
              <p className="text-[16px] text-white/60 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   TESTIMONIALS
   ============================================ */
function TestimonialsSection() {
  const [ref, inView] = useInView();
  const testimonials = [
    {
      quote: 'Finally, no more waiting for hours. Quttr changed how I get my haircut.',
      hi: 'अब घंटों इंतज़ार नहीं करना पड़ता।',
      name: 'Rahul Sharma',
      city: 'Delhi',
    },
    {
      quote: 'The queue tracking is amazing. I arrive exactly when it\'s my turn.',
      hi: 'क्यू ट्रैकिंग बहुत बढ़िया है।',
      name: 'Amit Kumar',
      city: 'Mumbai',
    },
    {
      quote: 'My barber is always available on Quttr. Booking takes seconds.',
      hi: 'मेरा बार्बर हमेशा उपलब्ध है।',
      name: 'Vikas Singh',
      city: 'Bangalore',
    },
  ];

  return (
    <section ref={ref} className="px-6 py-24 md:py-32 border-t border-white/[0.06] bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[36px] md:text-[56px] font-bold leading-[1.1] tracking-[-0.03em] mb-4">
            Loved by thousands.
          </h2>
          <p className="qr-hindi text-[18px] font-medium text-white/50">
            हज़ारों भारतीयों का पसंदीदा
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 transition-all duration-1000 hover:border-white/20 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-[19px] leading-relaxed text-white/90 mb-4">
                "{t.quote}"
              </p>
              <p className="qr-hindi text-[15px] text-white/50 mb-6">
                {t.hi}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
                <div>
                  <div className="text-[15px] font-medium">{t.name}</div>
                  <div className="text-[13px] text-white/40">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   BARBER SECTION
   ============================================ */
function BarberSection({ onDownload }) {
  const [ref, inView] = useInView();
  const benefits = [
    'Digital appointment management',
    'Real-time earnings dashboard',
    'Customer loyalty programs',
    'Business analytics & insights',
    'Marketing & promotional tools',
  ];

  return (
    <section ref={ref} id="barbers" className="px-6 py-24 md:py-32 border-t border-white/[0.06]" style={{ background: 'linear-gradient(180deg, #0A0E27 0%, #000000 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[13px] font-semibold tracking-[0.3em] text-[#3B82F6] uppercase mb-8">
            For Barbers
          </p>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] mb-2">
                Grow your
              </h2>
              <h2 className="text-[44px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white/40 mb-6">
                business.
              </h2>
              <p className="qr-hindi text-[20px] font-medium text-white/60 mb-6">
                अपना बिज़नेस बढ़ाएं।
              </p>
              <p className="text-[18px] md:text-[19px] text-white/60 leading-relaxed mb-8">
                Join thousands of barbers already growing with Quttr Business. Digital bookings, real-time earnings, customer insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onDownload}
                  className="inline-flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[17px] font-normal px-6 py-3 rounded-full transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M3 20.5V3.5a.5.5 0 0 1 .8-.4l14.5 8.5a.5.5 0 0 1 0 .8L3.8 20.9a.5.5 0 0 1-.8-.4z" />
                  </svg>
                  Download Quttr Business
                </button>

                <a
                  href="tel:+919519953149"
                  className="inline-flex items-center gap-1 text-[17px] font-normal text-[#2997FF] hover:underline justify-center sm:justify-start"
                >
                  Or call us
                </a>
              </div>
            </div>

            <div>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[17px] text-white/80">{benefit}</span>
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

/* ============================================
   FINAL CTA
   ============================================ */
function FinalCTASection({ onDownload }) {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} id="download" className="relative px-6 py-32 md:py-48 border-t border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071E3]/[0.08] rounded-full blur-[150px]" />
      </div>

      <div className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-[60px] md:text-[120px] font-bold leading-[1] tracking-[-0.04em] mb-4">
          Ready?
        </h2>
        <p className="qr-hindi text-[28px] md:text-[40px] font-medium text-white/50 mb-12">
          तैयार हैं?
        </p>
        <p className="text-[20px] md:text-[24px] text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
          Download Quttr and skip the wait forever.
        </p>

        <button
          onClick={onDownload}
          className="inline-flex items-center gap-3 bg-white hover:bg-white/90 text-black text-[19px] font-medium px-8 py-4 rounded-full transition-all duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M3 20.5V3.5a.5.5 0 0 1 .8-.4l14.5 8.5a.5.5 0 0 1 0 .8L3.8 20.9a.5.5 0 0 1-.8-.4z" />
          </svg>
          Download for Android
        </button>

        <p className="mt-8 text-[14px] text-white/40">
          Free • ★ 4.8 rating • Available on Google Play
        </p>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER
   ============================================ */
function FooterSection() {
  return (
    <footer className="px-6 py-16 border-t border-white/[0.06] bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="6" r="3" stroke="white" strokeWidth="1.5" />
                <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="1.5" />
                <path d="M20 4L8.12 15.88" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14.47 14.48L20 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8.12 8.12L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[15px] font-semibold">Quttr</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              The fastest way to book your barber.
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-[13px] text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#download" className="hover:text-white transition-colors">Download</a></li>
              <li><a href="#barbers" className="hover:text-white transition-colors">For Barbers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-[13px] text-white/50">
              <li><a href="mailto:support@quttrr.com" className="hover:text-white transition-colors">Email</a></li>
              <li><a href="tel:+919519953149" className="hover:text-white transition-colors">Phone</a></li>
              <li><a href="https://wa.me/919519953149" className="hover:text-white transition-colors">WhatsApp</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-[13px] text-white/50">
              <li><a href="https://instagram.com/quttrofficial" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="mailto:support@quttrr.com" className="hover:text-white transition-colors">support@quttrr.com</a></li>
              <li><a href="tel:+919519953149" className="hover:text-white transition-colors">+91 9519953149</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-white/30">
            Copyright © 2025 Quttr. All rights reserved.
          </p>
          <p className="text-[12px] text-white/30">
            Made with care in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================
   GLOBAL STYLES
   ============================================ */
function GlobalStyles() {
  return (
    <style jsx global>{`
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif;
        background: #000000;
        color: #ffffff;
      }

      html {
        scroll-behavior: smooth;
      }

      .qr-hero-title {
        font-feature-settings: 'kern' 1;
      }

      .qr-hindi {
        font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
      }

      .qr-gradient-text {
        background: linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #86868b 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .qr-btn-primary {
        letter-spacing: -0.01em;
      }

      .qr-scroll-dot {
        animation: qr-scroll-anim 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
      }

      @keyframes qr-scroll-anim {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(8px); opacity: 1; }
      }

      .qr-progress-bar {
        animation: qr-progress 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
      }

      @keyframes qr-progress {
        0% { width: 25%; }
        50% { width: 75%; }
        100% { width: 25%; }
      }

      /* Selection color */
      ::selection {
        background: rgba(0, 113, 227, 0.3);
        color: white;
      }

      /* Smooth section transitions */
      section {
        position: relative;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  );
}
