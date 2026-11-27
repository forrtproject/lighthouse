// World geometry for the map chart: Natural Earth 1:110m (public domain) via
// world-atlas, bundled locally and loaded only when a page needs the map.
import { echarts } from './echarts';

let ready: Promise<void> | null = null;

export function ensureWorldMap(): Promise<void> {
  ready ??= Promise.all([import('world-atlas/countries-110m.json'), import('topojson-client')]).then(([mod, { feature }]) => {
    const topo = ((mod as { default?: unknown }).default ?? mod) as { objects: { countries: unknown } };
    // topojson's types do not describe the JSON module's shape, hence the casts.
    const geo = feature(topo as never, topo.objects.countries as never);
    echarts.registerMap('world', geo as never);
  });
  return ready;
}
