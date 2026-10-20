/**
 * Subscribe to the app's inferred connectivity (see src/lib/network/monitor.ts).
 * Returns `true` when online. Backed by React Query's onlineManager so it stays
 * in sync with query pausing/refetching.
 */

import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setOnline), []);
  return online;
}
