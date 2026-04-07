/* eslint-disable */
// Generate province city SVG path data from Aliyun DataV GeoJSON
// Run: node scripts/generateProvinceMapData.js
// Output: src/data/provinceMapPaths/

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROVINCE_ADCODE = {
  'beijing': { adcode: 110000, name: '北京' },
  'tianjin': { adcode: 120000, name: '天津' },
  'hebei': { adcode: 130000, name: '河北' },
  'shanxi': { adcode: 140000, name: '山西' },
  'neimenggu': { adcode: 150000, name: '内蒙古' },
  'liaoning': { adcode: 210000, name: '辽宁' },
  'jilin': { adcode: 220000, name: '吉林' },
  'heilongjiang': { adcode: 230000, name: '黑龙江' },
  'shanghai': { adcode: 310000, name: '上海' },
  'jiangsu': { adcode: 320000, name: '江苏' },
  'zhejiang': { adcode: 330000, name: '浙江' },
  'anhui': { adcode: 340000, name: '安徽' },
  'fujian': { adcode: 350000, name: '福建' },
  'jiangxi': { adcode: 360000, name: '江西' },
  'shandong': { adcode: 370000, name: '山东' },
  'henan': { adcode: 410000, name: '河南' },
  'hubei': { adcode: 420000, name: '湖北' },
  'hunan': { adcode: 430000, name: '湖南' },
  'guangdong': { adcode: 440000, name: '广东' },
  'guangxi': { adcode: 450000, name: '广西' },
  'hainan': { adcode: 460000, name: '海南' },
  'chongqing': { adcode: 500000, name: '重庆' },
  'sichuan': { adcode: 510000, name: '四川' },
  'guizhou': { adcode: 520000, name: '贵州' },
  'yunnan': { adcode: 530000, name: '云南' },
  'xizang': { adcode: 540000, name: '西藏' },
  'shaanxi': { adcode: 610000, name: '陕西' },
  'gansu': { adcode: 620000, name: '甘肃' },
  'qinghai': { adcode: 630000, name: '青海' },
  'ningxia': { adcode: 640000, name: '宁夏' },
  'xinjiang': { adcode: 650000, name: '新疆' },
  'taiwan': { adcode: 710000, name: '台湾' },
  'hongkong': { adcode: 810000, name: '香港' },
  'macau': { adcode: 820000, name: '澳门' },
};

function simplifyCoords(coords, tolerance) {
  if (coords.length <= 2) return coords;
  var maxDist = 0, maxIdx = 0;
  var first = coords[0], last = coords[coords.length - 1];
  for (var i = 1; i < coords.length - 1; i++) {
    var dist = pointToLineDist(coords[i], first, last);
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    var left = simplifyCoords(coords.slice(0, maxIdx + 1), tolerance);
    var right = simplifyCoords(coords.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function pointToLineDist(point, lineStart, lineEnd) {
  var dx = lineEnd[0] - lineStart[0], dy = lineEnd[1] - lineStart[1];
  var lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    var ddx2 = point[0] - lineStart[0], ddy2 = point[1] - lineStart[1];
    return Math.sqrt(ddx2 * ddx2 + ddy2 * ddy2);
  }
  var t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  var ddx = point[0] - (lineStart[0] + t * dx);
  var ddy = point[1] - (lineStart[1] + t * dy);
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

function computeProjection(features) {
  var lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity;
  features.forEach(function(feature) {
    var g = feature.geometry;
    var cl = g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
    cl.forEach(function(ring) {
      ring.forEach(function(c) {
        if (c[0] < lngMin) lngMin = c[0]; if (c[0] > lngMax) lngMax = c[0];
        if (c[1] < latMin) latMin = c[1]; if (c[1] > latMax) latMax = c[1];
      });
    });
  });
  var lp = (lngMax - lngMin) * 0.05, ap = (latMax - latMin) * 0.05;
  lngMin -= lp; lngMax += lp; latMin -= ap; latMax += ap;
  var W = 560, H = 480;
  var mMin = Math.log(Math.tan(Math.PI / 4 + (latMin * Math.PI / 180) / 2));
  var mMax = Math.log(Math.tan(Math.PI / 4 + (latMax * Math.PI / 180) / 2));
  return {
    lngToX: function(lng) { return ((lng - lngMin) / (lngMax - lngMin)) * W + 10; },
    latToY: function(lat) {
      var m = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
      return H - ((m - mMin) / (mMax - mMin)) * H + 10;
    },
    W: W, H: H
  };
}

function ringToPath(ring, p) {
  var s = simplifyCoords(ring, 0.05);
  if (s.length < 3) return '';
  var d = '';
  s.forEach(function(c, i) {
    var x = p.lngToX(c[0]).toFixed(1), y = p.latToY(c[1]).toFixed(1);
    d += (i === 0 ? 'M' + x + ',' + y : ' L' + x + ',' + y);
  });
  return d + ' Z';
}

function geoToPath(geometry, p) {
  var paths = [];
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(function(r) { var d = ringToPath(r, p); if (d) paths.push(d); });
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(function(poly) {
      poly.forEach(function(r) { var d = ringToPath(r, p); if (d) paths.push(d); });
    });
  }
  return paths.join(' ');
}

function getCentroid(geometry, p) {
  var sx = 0, sy = 0, n = 0;
  function proc(coords) { coords.forEach(function(c) { sx += p.lngToX(c[0]); sy += p.latToY(c[1]); n++; }); }
  if (geometry.type === 'Polygon') { proc(geometry.coordinates[0]); }
  else if (geometry.type === 'MultiPolygon') {
    var best = null, bestLen = 0;
    geometry.coordinates.forEach(function(poly) { if (poly[0].length > bestLen) { bestLen = poly[0].length; best = poly[0]; } });
    if (best) proc(best);
  }
  return { cx: n > 0 ? +(sx / n).toFixed(1) : 0, cy: n > 0 ? +(sy / n).toFixed(1) : 0 };
}

function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    var req = https.get(url, function(res) {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(15000, function() { req.destroy(); reject(new Error('Timeout')); });
  });
}

function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function genProvince(id, info) {
  var url = 'https://geo.datav.aliyun.com/areas_v3/bound/' + info.adcode + '_full.json';
  var geojson;
  try { geojson = await fetchJSON(url); } catch(e) {
    console.log('  SKIP ' + info.name + ': ' + e.message);
    return null;
  }
  if (!geojson.features || geojson.features.length === 0) {
    console.log('  SKIP ' + info.name + ': no features');
    return null;
  }
  var proj = computeProjection(geojson.features);
  var vb = '0 0 ' + (proj.W + 20) + ' ' + (proj.H + 20);
  var cities = [];
  geojson.features.forEach(function(f) {
    var cn = f.properties.name;
    if (!cn) return;
    var pd = geoToPath(f.geometry, proj);
    var ct = getCentroid(f.geometry, proj);
    if (!pd) return;
    cities.push({ name: cn, path: pd, cx: ct.cx, cy: ct.cy });
  });
  if (cities.length === 0) return null;
  return { id: id, name: info.name, adcode: info.adcode, viewBox: vb, cities: cities };
}

function writeProvince(outDir, d) {
  var lines = [
    '/**', ' * ' + d.name + ' SVG path data (auto-generated)', ' * Source: Aliyun DataV GeoJSON',
    ' * Generated: ' + new Date().toISOString(), ' */', '',
    "import {ProvinceMapData} from './index';", '',
    'const data: ProvinceMapData = {',
    "  id: '" + d.id + "',",
    "  name: '" + d.name + "',",
    '  adcode: ' + d.adcode + ',',
    "  viewBox: '" + d.viewBox + "',",
    '  cities: ['
  ];
  d.cities.forEach(function(c) {
    lines.push('    {');
    lines.push("      name: '" + c.name + "',");
    lines.push("      path: '" + c.path + "',");
    lines.push('      cx: ' + c.cx + ',');
    lines.push('      cy: ' + c.cy + ',');
    lines.push('    },');
  });
  lines.push('  ],', '};', '', 'export default data;', '');
  var fp = path.join(outDir, d.id + '.ts');
  fs.writeFileSync(fp, lines.join('\n'), 'utf-8');
  return fp;
}

function writeIndex(outDir, provinces) {
  var lines = [
    '/**', ' * Province city SVG path data index (auto-generated)',
    ' * Generated: ' + new Date().toISOString(), ' */', '',
    'export interface CityPathData {', '  name: string;', '  path: string;',
    '  cx: number;', '  cy: number;', '}', '',
    'export interface ProvinceMapData {', '  id: string;', '  name: string;',
    '  adcode: number;', '  viewBox: string;', '  cities: CityPathData[];', '}', ''
  ];
  provinces.forEach(function(p) { lines.push("import " + p.id + "Data from './" + p.id + "';"); });
  lines.push('', 'const PROVINCE_MAP_DATA: Record<string, ProvinceMapData> = {');
  provinces.forEach(function(p) { lines.push("  '" + p.id + "': " + p.id + "Data,"); });
  lines.push('};', '', 'const PROVINCE_NAME_TO_ID: Record<string, string> = {');
  provinces.forEach(function(p) { lines.push("  '" + p.name + "': '" + p.id + "',"); });
  lines.push('};', '');
  lines.push('export function getProvinceMapDataById(provinceId: string): ProvinceMapData | null {');
  lines.push('  return PROVINCE_MAP_DATA[provinceId] || null;', '}', '');
  lines.push('export function getProvinceMapDataByName(provinceName: string): ProvinceMapData | null {');
  lines.push('  const id = PROVINCE_NAME_TO_ID[provinceName];');
  lines.push('  if (!id) return null;');
  lines.push('  return PROVINCE_MAP_DATA[id] || null;', '}', '');
  lines.push('export function getAvailableProvinceIds(): string[] {');
  lines.push('  return Object.keys(PROVINCE_MAP_DATA);', '}', '');
  fs.writeFileSync(path.join(outDir, 'index.ts'), lines.join('\n'), 'utf-8');
}

async function main() {
  var outDir = path.join(__dirname, '..', 'src', 'data', 'provinceMapPaths');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  console.log('Generating province map data...');
  console.log('Output: ' + outDir);

  var ids = Object.keys(PROVINCE_ADCODE);
  var generated = [];

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var info = PROVINCE_ADCODE[id];
    console.log('[' + (i + 1) + '/' + ids.length + '] ' + info.name + ' (' + id + ')...');
    var data = await genProvince(id, info);
    if (data) {
      writeProvince(outDir, data);
      generated.push({ id: id, name: info.name });
      console.log('  OK: ' + data.cities.length + ' cities');
    }
    if (i < ids.length - 1) await delay(300);
  }

  writeIndex(outDir, generated);
  console.log('Done! ' + generated.length + ' provinces generated.');
}

main().catch(function(e) { console.error('FAILED:', e); process.exit(1); });
