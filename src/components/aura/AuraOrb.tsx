import { useEffect, useRef, useState } from 'react';

interface AuraOrbProps {
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
};

const ringMap = {
  sm: 'w-14 h-14',
  md: 'w-24 h-24',
  lg: 'w-36 h-36',
};

export function AuraOrb({ size = 'md', interactive = false, className = '' }: AuraOrbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;
    const handleMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = ((e.clientX - cx) / window.innerWidth) * 12;
      const y = ((e.clientY - cy) / window.innerHeight) * 12;
      setTilt({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [interactive]);

  return (
    <div
      ref={ref}
      className={`relative flex items-center justify-center ${className}`}
      style={{
        transform: interactive ? `perspective(400px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)` : undefined,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Rotating outer ring */}
      <div
        className={`absolute ${ringMap[size]} rounded-full border-2 border-accent/30 animate-spin-slow`}
        style={{ borderTopColor: 'hsl(var(--accent))' }}
      />
      {/* Pulsing glow */}
      <div
        className={`absolute ${sizeMap[size]} rounded-full bg-accent/20 animate-pulse`}
        style={{ filter: 'blur(8px)' }}
      />
      {/* Core orb */}
      <div
        className={`${sizeMap[size]} rounded-full gradient-coral flex items-center justify-center shadow-accent animate-orb-glow`}
      >
        <span className="text-white font-serif italic text-xs sm:text-sm select-none">A</span>
      </div>
    </div>
  );
}
