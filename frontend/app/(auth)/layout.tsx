import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-white font-sans">
      {/* Left side graphical branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 to-violet-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 w-full max-w-lg space-y-6 px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-sm font-medium backdrop-blur-md">
            <span>✨</span> Welcome to the Future of Learning
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            Master your skills <br /> <span className="text-indigo-400">anywhere, anytime.</span>
          </h1>
          <p className="text-lg text-indigo-100/80 leading-relaxed max-w-md">
            Join thousands of learners discovering world-class content curated by experts, beautifully integrated into one seamless platform.
          </p>
        </div>
      </div>

      {/* Right side authentication forms */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-neutral-900 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none"></div>
        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
