'use client';

import { AnimatePresence } from 'framer-motion';
import AppShell from '@/components/kinzola/app-shell';

export default function Home() {
  return (
    <AnimatePresence mode="wait">
      <AppShell />
    </AnimatePresence>
  );
}
