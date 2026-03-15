import L from 'leaflet';
// These imports rely on bundler asset handling; ensure leaflet is installed in package.json
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});


