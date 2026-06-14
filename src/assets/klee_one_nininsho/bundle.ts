import fontUrl from './unknown.ttf';
import glyphData from './glyphData.json';

const bundle = {
  version: 0,
  family: 'Unknown',
  lineCap: 'round',
  fontUrl,
  fontFaceCSS: `@font-face { font-family: 'Unknown'; src: url(${fontUrl}); }`,
  unitsPerEm: 1000,
  ascender: 1160,
  descender: -288,
  glyphData,
} as const;

export default bundle;
