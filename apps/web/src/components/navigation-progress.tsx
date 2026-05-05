'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams],
  );

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const trickleTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (trickleTimerRef.current) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
  };

  const start = () => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    clearTimers();
    setVisible(true);
    setProgress(12);
    trickleTimerRef.current = window.setInterval(() => {
      setProgress((current) => clamp(current + Math.random() * 12, current, 90));
    }, 180);
  };

  const done = () => {
    if (!startedRef.current) {
      return;
    }
    startedRef.current = false;
    if (trickleTimerRef.current) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    setProgress(100);
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) {
        return;
      }
      if (anchor.target === '_blank') {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextKey = `${url.pathname}${url.search}`;
      const currentKey = `${window.location.pathname}${window.location.search}`;
      if (nextKey === currentKey) {
        return;
      }

      start();
    };

    const handlePopState = () => start();

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    done();
  }, [routeKey]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
