import L from 'leaflet';
import { Monument } from '@/services/monumentService';

const riskColors = {
  low: {
    fill: '#16a34a',
    glow: 'rgba(22,163,74,0.4)',
    border: '#14532d',
  },
  moderate: {
    fill: '#ca8a04',
    glow: 'rgba(202,138,4,0.4)',
    border: '#713f12',
  },
  high: {
    fill: '#d97706',
    glow: 'rgba(217,119,6,0.4)',
    border: '#78350f',
  },
  critical: {
    fill: '#dc2626',
    glow: 'rgba(220,38,38,0.5)',
    border: '#7f1d1d',
  },
};

export const createMonumentIcon = (monument: Monument, isMobile: boolean = false) => {
  const color = riskColors[monument.riskLevel];
  const size = isMobile ? 44 : 36;

  const doublePulse =
    monument.riskLevel === 'critical'
      ? `<div style="
            position:absolute;
            inset:0;
            border-radius:50%;
            background:${color.glow};
            animation:markerPulse 2s ease-in-out infinite;
            animation-delay:0.5s;
          "></div>`
      : '';

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
    ">
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: ${color.glow};
        animation: markerPulse 2s ease-in-out infinite;
      "></div>
      ${doublePulse}
      <div style="
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        background: ${color.fill};
        border: 2px solid ${color.border};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: white;
        font-weight: 600;
      ">
        ${monument.vulnerabilityScore}
      </div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -20],
  });
};


