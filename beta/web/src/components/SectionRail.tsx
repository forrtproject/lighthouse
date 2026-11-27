import { useEffect, useState, type ComponentType } from 'react';
import type { IconProps } from '@phosphor-icons/react';
import type { Tone } from '../lib/signals';
import { ToneIcon } from './Tone';

export interface RailItem { id: string; label: string; icon: ComponentType<IconProps>; tone?: Tone; count?: number }

/**
 * Sticky section navigation. On wide screens it is a left rail whose status
 * markers double as a summary; on narrow screens it becomes a horizontal strip.
 * The section in view is highlighted (scrollspy).
 */
export function SectionRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav className="rail" aria-label="On this page">
      <span className="rail-title">On this page</span>
      <ul>
        {items.map(({ id, label, icon: Icon, tone, count }) => (
          <li key={id}>
            <a href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'location' : undefined}>
              <Icon size={18} aria-hidden="true" className="rail-icon" />
              <span className="rail-label">{label}</span>
              {count != null && <span className="rail-count">{count}</span>}
              {tone && <ToneIcon tone={tone} size={14} label />}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
