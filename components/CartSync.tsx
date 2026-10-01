'use client';

import { useEffect } from 'react';
import { startCartSync } from '@/lib/cart-session';

export default function CartSync() {
  useEffect(() => startCartSync(), []);
  return null;
}
