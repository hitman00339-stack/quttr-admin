'use client';

const features = [
  { 
    icon: '⚡', 
    title: 'Book in Seconds', 
    desc: 'Book your barber instantly, anytime, anywhere',
    color: 'from-brand-500 to-brand-700'
  },
  { 
    icon: '🚫', 
    title: 'No More Waiting', 
    desc: 'Skip the crowded shop lines forever',
    color: 'from-accent-500 to-accent-700'
  },
  { 
    icon: '💈', 
    title: 'Your Favorite Barber', 
    desc: 'Choose the barber you trust',
    color: 'from-brand-500 to-brand-700'
  },
  { 
    icon: '📍', 
    title: 'Real-Time Tracking', 
    desc: 'Live queue tracking with GPS',
    color: 'from-accent-500 to-accent-700'
  },
  { 
    icon: '⭐', 
    title: 'Rate & Review', 
    desc: 'Share your experience easily',
    color: 'from-brand-500 to-brand-700'
  },
  { 
    icon: '🎁', 
    title: 'Earn Rewards', 
    desc: 'Get points on every visit',
    color: 'from-accent-500 to-accent-700'
  },
];

export default function Features() {
  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-block mb-4">
          <span className="chip chip-accent">✨ FEATURES</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-4">
          What <span className="text-gradient">Quttr</span> Offers
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Everything you need for the perfect barber experience
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="card-interactive p-6 group animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Icon */}
            <div className={`
              w-14 h-14 rounded-2xl 
              bg-gradient-to-br ${feature.color}
              flex items-center justify-center 
              mb-4 
              shadow-elevation-2
              group-hover:scale-110 
              transition-transform duration-300
            `}>
              <span className="text-3xl">{feature.icon}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-gradient-gold transition-all">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-white/60 leading-relaxed">
              {feature.desc}
            </p>

            {/* Hover indicator */}
            <div className="mt-4 h-1 w-0 group-hover:w-full bg-gradient-to-r from-accent-500 to-brand-500 rounded-full transition-all duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
