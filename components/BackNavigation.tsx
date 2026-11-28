'use client';

import { useEffect } from 'react';
import { installBackHistory } from '@/lib/back-navigation';

export default function BackNavigation() {
  useEffect(() => installBackHistory(window), []);
  return null;
}
