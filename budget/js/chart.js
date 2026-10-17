import { esc } from './format.js';

export function donut(segments, center = '') {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 40, circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = total ? segments.map(s => {
    const len = (s.value / total) * circumference;
    const gap = segments.length > 1 ? Math.min(1.2, len / 3) : 0;
    const arc = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${s.color}" stroke-width="14"
      stroke-dasharray="${Math.max(0, len - gap)} ${circumference}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 50 50)"><title>${esc(s.label)}</title></circle>`;
    offset += len;
    return arc;
  }).join('') : '';
  return `<div class="donut-wrap">
    <svg class="donut" viewBox="0 0 100 100" role="img">
      <circle cx="50" cy="50" r="${r}" fill="none" class="donut-track" stroke-width="14"/>${arcs}
    </svg>
    <div class="donut-center">${center}</div>
  </div>`;
}

export function bars(items, format) {
  const w = 320, h = 160, top = 22, bottom = 22, gap = 12;
  const max = Math.max(1, ...items.map(i => i.value));
  const bw = (w - gap * (items.length + 1)) / items.length;
  const body = items.map((it, i) => {
    const x = gap + i * (bw + gap);
    const bh = Math.max(it.value ? 3 : 0, ((h - top - bottom) * it.value) / max);
    const y = h - bottom - bh;
    return `<g class="${it.highlight ? 'bar-current' : 'bar'}">
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="5"/>
      <text class="bar-value" x="${x + bw / 2}" y="${y - 6}" text-anchor="middle">${it.value ? esc(format(it.value)) : ''}</text>
      <text class="bar-label" x="${x + bw / 2}" y="${h - 6}" text-anchor="middle">${esc(it.label)}</text>
    </g>`;
  }).join('');
  return `<svg class="bars" viewBox="0 0 ${w} ${h}" role="img">
    <line class="bar-axis" x1="0" x2="${w}" y1="${h - bottom}" y2="${h - bottom}"/>${body}</svg>`;
}
