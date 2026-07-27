'use client';

import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/api';

interface Props {
  src?: string | null;
  name?: string | null;
  className?: string;
  textClassName?: string;
  alt?: string;
}

export default function SafeAvatar({
  src,
  name,
  className = 'w-16 h-16 rounded-2xl',
  textClassName = 'text-2xl font-bold text-brand-600',
  alt = '',
}: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const resolvedUrl = src ? getImageUrl(src) : '';
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'E';

  if (!resolvedUrl || error) {
    return (
      <div
        className={`${className} bg-brand-50 border-2 border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden select-none`}
      >
        <span className={textClassName}>{initial}</span>
      </div>
    );
  }

  return (
    <div
      className={`${className} bg-brand-50 border-2 border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden`}
    >
      <img
        src={resolvedUrl}
        alt={alt || name || ''}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
