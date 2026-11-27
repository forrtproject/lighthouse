import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from './echarts';

/** Counts from 0 up to `target` once the element is on screen (instant with reduced motion). */
export function useCountUp<T extends HTMLElement>(target: number, duration = 900) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0));
  useEffect(() => {
    if (reducedMotion()) { setValue(target); return; }
    const node = ref.current;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (!node) { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); run(); } });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);
  return [ref, value] as const;
}
