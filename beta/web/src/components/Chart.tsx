import { memo, useEffect, useRef, useState } from 'react';
import { echarts, type ChartOption, type Colors } from '../lib/echarts';
import { useTheme } from '../lib/theme';

export interface ChartClick { seriesIndex?: number; seriesName?: string; dataIndex?: number; data?: unknown; name?: string; value?: unknown }

interface Props {
  /**
   * Builds the option from the current theme colours, so charts follow light/dark.
   * Typed loosely on purpose: inline ECharts options widen string literals, and
   * ECharts validates options at runtime.
   */
  build: (c: Colors) => object;
  height: number;
  /** Short text alternative read by screen readers. */
  label: string;
  /** Pass a stable (useCallback) handler. */
  onClick?: (p: ChartClick) => void;
}

/**
 * One ECharts instance. It is created when the chart first scrolls into view,
 * so the entry animation plays where the reader can see it, and it is resized
 * with its container and rebuilt on theme change.
 */
function ChartImpl({ build, height, label, onClick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const inst = useRef<ReturnType<typeof echarts.init> | null>(null);
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  // Wait until the chart is near the viewport.
  useEffect(() => {
    if (!el.current || visible) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(el.current);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !el.current) return;
    const chart = echarts.init(el.current, undefined, { renderer: 'svg' });
    inst.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el.current);
    return () => { ro.disconnect(); chart.dispose(); inst.current = null; };
  }, [visible]);

  useEffect(() => {
    // Merge, so selection changes animate instead of redrawing, but replace the layout
    // components wholesale: merged settings would otherwise outlive the option that set them.
    inst.current?.setOption(build(colors) as ChartOption, {
      notMerge: false,
      replaceMerge: ['series', 'dataZoom', 'grid', 'xAxis', 'yAxis', 'legend', 'polar', 'angleAxis', 'radiusAxis', 'graphic'],
    });
  }, [build, colors, visible]);

  useEffect(() => {
    const chart = inst.current;
    if (!chart || !onClick) return;
    chart.on('click', onClick as never);
    return () => { chart.off('click', onClick as never); };
  }, [onClick, visible]);

  return (
    <div ref={el} className={`chart${visible ? ' is-visible' : ''}${onClick ? ' is-clickable' : ''}`} style={{ height }} role="img" aria-label={label} />
  );
}

export const Chart = memo(ChartImpl);
