import { useEffect, useRef } from 'react';

interface AuraOrbProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
}

const SIZE_MAP = {
  sm: { outer: 48, inner: 28, ring1: 38, ring2: 44 },
  md: { outer: 64, inner: 38, ring1: 52, ring2: 60 },
  lg: { outer: 96, inner: 56, ring1: 78, ring2: 90 },
};

export function AuraOrb({ size = 'md', className = '', interactive = false }: AuraOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const s = SIZE_MAP[size];

  useEffect(() => {
    if (!interactive) return;
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      el.style.transform = `rotateY(${dx * 12}deg) rotateX(${-dy * 12}deg)`;
    };

    const handleLeave = () => {
      if (el) el.style.transform = 'rotateY(0deg) rotateX(0deg)';
    };

    window.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: s.outer,
        height: s.outer,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Outer pulsing ring */}
      <span
        className="absolute rounded-full animate-pulse-soft"
        style={{
          width: s.ring2,
          height: s.ring2,
          background: 'radial-gradient(circle, hsl(22 92% 62% / 0.18) 0%, transparent 70%)',
          animation: 'pulse-soft 2.4s ease-in-out infinite',
        }}
      />

      {/* Mid ring — rotates */}
      <span
        className="absolute rounded-full border border-accent/25"
        style={{
          width: s.ring1,
          height: s.ring1,
          animation: 'spin-slow 8s linear infinite',
          borderTopColor: 'hsl(22 92% 62% / 0.5)',
          borderRightColor: 'hsl(22 92% 62% / 0.15)',
          borderBottomColor: 'hsl(22 92% 62% / 0.08)',
          borderLeftColor: 'hsl(22 92% 62% / 0.3)',
        }}
      />

      {/* Core orb */}
      <span
        className="relative rounded-full flex items-center justify-center shadow-accent animate-float"
        style={{
          width: s.inner,
          height: s.inner,
          background: 'linear-gradient(135deg, hsl(22 92% 62%) 0%, hsl(35 90% 60%) 55%, hsl(22 75% 52%) 100%)',
          boxShadow: '0 0 16px 4px hsl(22 92% 62% / 0.45), 0 4px 20px hsl(22 92% 62% / 0.25)',
          animation: 'float 3.2s ease-in-out infinite',
        }}
      >
        {/* Inner sparkle dots */}
        <span
          className="absolute rounded-full bg-white/40"
          style={{ width: size === 'sm' ? 5 : size === 'md' ? 7 : 10, height: size === 'sm' ? 5 : size === 'md' ? 7 : 10, top: '22%', left: '26%' }}
        />
        <span
          className="absolute rounded-full bg-white/20"
          style={{ width: size === 'sm' ? 3 : 4, height: size === 'sm' ? 3 : 4, bottom: '26%', right: '24%' }}
        />
      </span>
    </div>
  );
}
