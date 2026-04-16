'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: React.CSSProperties;
}

export default function SafeImage({
  src,
  alt,
  className = '',
  style,
  fallbackClassName = '',
  fallbackStyle,
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center ${fallbackClassName || className}`}
        style={{
          background: 'linear-gradient(135deg, #1a2a4a, #0d1b36)',
          ...fallbackStyle,
          ...style
        }}
      >
        <User className="w-1/3 h-1/3 text-kinzola-muted/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
