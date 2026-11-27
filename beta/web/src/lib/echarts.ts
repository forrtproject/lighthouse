// ECharts is the beta's charting library. Only the modules in use are
// registered, which keeps the bundle small. SVG rendering keeps text crisp
// and lets charts print cleanly.
import * as echarts from 'echarts/core';
import {
  BarChart, CustomChart, GaugeChart, GraphChart, HeatmapChart, LineChart, MapChart, PieChart, SankeyChart, ScatterChart, TreemapChart,
} from 'echarts/charts';
import {
  AriaComponent, DataZoomComponent, GeoComponent, GraphicComponent, GridComponent, LegendComponent, MarkAreaComponent,
  MarkLineComponent, MarkPointComponent, PolarComponent, TitleComponent, TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { LabelLayout, LegacyGridContainLabel } from 'echarts/features';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, CustomChart, GaugeChart, GraphChart, HeatmapChart, LineChart, MapChart, PieChart, SankeyChart, ScatterChart, TreemapChart,
  AriaComponent, DataZoomComponent, GeoComponent, GraphicComponent, GridComponent, LegendComponent, MarkAreaComponent,
  MarkLineComponent, MarkPointComponent, PolarComponent, TitleComponent, TooltipComponent,
  VisualMapComponent, LabelLayout, LegacyGridContainLabel, SVGRenderer,
]);

export { echarts };
export type { EChartsCoreOption as ChartOption } from 'echarts/core';

/** Resolved colours from the FORRT/Atlas design tokens for the current theme. */
export interface Colors {
  text: string; text2: string; muted: string; faint: string;
  border: string; borderLight: string; surface: string; raised: string;
  primary: string; primaryFaint: string; primaryBorder: string;
  success: string; failed: string; mixed: string; inconclusive: string;
  warning: string; error: string;
  foundational: string; replication: string; critique: string; meta: string;
  reproduction: string; wiki: string; other: string;
  positive: string; neutral: string; critical: string;
  fontBody: string; fontDisplay: string; fontMono: string;
}

export function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    text: v('--color-text'), text2: v('--color-text-secondary'), muted: v('--color-text-muted'), faint: v('--color-text-faint'),
    border: v('--color-border'), borderLight: v('--color-border-light'), surface: v('--color-surface'), raised: v('--color-surface-raised'),
    primary: v('--color-primary'), primaryFaint: v('--color-primary-faint'), primaryBorder: v('--color-primary-border'),
    success: v('--color-chart-successful'), failed: v('--color-chart-failed'), mixed: v('--color-chart-mixed'), inconclusive: v('--color-chart-inconclusive'),
    warning: v('--color-warning'), error: v('--color-error'),
    foundational: v('--type-foundational'), replication: v('--type-replication'), critique: v('--type-critique'), meta: v('--type-meta'),
    reproduction: v('--type-reproduction'), wiki: v('--type-wiki'), other: v('--type-other'),
    positive: v('--color-chart-successful'), neutral: v('--color-chart-inconclusive'), critical: v('--color-chart-failed'),
    fontBody: v('--font-body'), fontDisplay: v('--font-display'), fontMono: v('--font-mono'),
  };
}

/** Users who ask the OS for less motion get static charts. */
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Staggered entry: item i starts `step` ms after item i-1. */
export const stagger = (step = 70, base = 0) => (i: number) => base + i * step;

/** Atlas look for every chart: quiet axes, Source Sans, raised tooltip, staggered entry animation. */
export function baseOption(c: Colors) {
  const still = reducedMotion();
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: c.fontBody, color: c.text2, fontSize: 12 },
    // ECharts' auto-description reads raw arrays (including "NaN"). Each chart
    // instead carries a written summary as its label plus a data-table view.
    aria: { enabled: false },
    animation: !still,
    animationDuration: 900,
    animationEasing: 'cubicOut',
    animationDelay: stagger(60),
    animationDurationUpdate: 450,
    animationEasingUpdate: 'cubicInOut',
    tooltip: {
      backgroundColor: c.raised,
      borderColor: c.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: c.text, fontFamily: c.fontBody, fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,.12); border-radius: 8px;',
      confine: true,
    },
  };
}

export function axisStyle(c: Colors) {
  return {
    axisLine: { lineStyle: { color: c.border } },
    axisTick: { lineStyle: { color: c.border } },
    axisLabel: { color: c.muted, fontFamily: c.fontBody, fontSize: 11 },
    splitLine: { lineStyle: { color: c.borderLight } },
    nameTextStyle: { color: c.muted, fontFamily: c.fontBody, fontSize: 11 },
  };
}
