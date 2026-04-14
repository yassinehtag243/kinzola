'use client';

import { motion } from 'framer-motion';

/**
 * Facebook-style verification badge — blue circle with white checkmark.
 * Used across the app wherever profile.verified is true.
 *
 * @param size - 'sm' (16px), 'md' (20px), 'lg' (28px)
 */
export default function VerifiedBadge({ size = 'md', className = '' }: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dimensions: Record<string, number> = { sm: 16, md: 20, lg: 28 };
  const checkSize: Record<string, number> = { sm: 8, md: 10, lg: 14 };
  const d = dimensions[size];
  const c = checkSize[size];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`flex-shrink-0 ${className}`}
      style={{ width: d, height: d }}
    >
      <svg
        width={d}
        height={d}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer blue circle */}
        <circle
          cx="14"
          cy="14"
          r="13"
          fill="#1877F2"
        />
        {/* White checkmark */}
        <path
          d={`M${7 + c * 0.1} ${14 + c * 0.05} L${11 + c * 0.1} ${18} L${21 - c * 0.1} ${10}`}
          stroke="white"
          strokeWidth={size === 'sm' ? 2.2 : 2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Static version without animation (for use inside already-animated contexts)
 */
export function VerifiedBadgeStatic({ size = 'md', className = '' }: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dimensions: Record<string, number> = { sm: 16, md: 20, lg: 28 };
  const checkSize: Record<string, number> = { sm: 8, md: 10, lg: 14 };
  const d = dimensions[size];
  const c = checkSize[size];

  return (
    <div className={`flex-shrink-0 ${className}`} style={{ width: d, height: d }}>
      <svg
        width={d}
        height={d}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14" cy="14" r="13" fill="#1877F2" />
        <path
          d={`M${7 + c * 0.1} ${14 + c * 0.05} L${11 + c * 0.1} ${18} L${21 - c * 0.1} ${10}`}
          stroke="white"
          strokeWidth={size === 'sm' ? 2.2 : 2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
