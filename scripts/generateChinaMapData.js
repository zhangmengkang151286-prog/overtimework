/**
 * 从阿里云 DataV GeoJSON 生成中国地图 SVG path 数据
 * 
 * 运行方式: node scripts/generateChinaMapData.js
 * 输出: src/data/chinaMapPaths.ts
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 阿里云 DataV GeoJSON 地址（简化版，不含子区域）
const GEOJSON_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

// SVG 画布尺寸
const SVG_WIDTH = 560;
const SVG_HEIGHT = 480;

// 中国经纬度范围
const LNG_MIN = 73;
const LNG_MAX = 136;
const LAT_MIN = 17;
const LAT_MAX = 54;

// 墨卡托投影：经纬度 -> SVG 坐标
function lngToX(lng) {
  return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * SVG_WIDTH + 10;
}

function latToY(lat) {
  // 简化墨卡托投影
  const latRad = (lat * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  
  const latMinRad = (LAT_MIN * Math.PI) / 180;
  const latMaxRad = (LAT_MAX * Math.PI) / 180;
  const mercMin = Math.log(Math.tan(Math.PI / 4 + latMinRad / 2));
  const mercMax = Math.log(Math.tan(Math.PI / 4 + latMaxRad / 2));
  
  return SVG_HEIGHT - ((mercY - mercMin) / (mercMax - mercMin)) * SVG_HEIGHT + 10;
}

// 简化坐标点（Douglas-Peucker 算法简化版）
function simplifyCoords(coords, tolerance) {
  if (coords.length <= 2) return coords;
  
  let maxDist = 0;
  let maxIdx = 0;
  const first = coords[0];
  const last = coords[coords.length - 1];
  
  for (let i = 1; i < coords.length - 1; i++) {
    const dist = pointToLineDist(coords[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = simplifyCoords(coords.slice(0, maxIdx + 1), tolerance);
    const right = simplifyCoords(coords.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  
  return [first, last];
}

function pointToLineDist(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq === 0) {
    const ddx = point[0] - lineStart[0];
    const ddy = point[1] - lineStart[1];
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }
  
  let t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  
  const projX = lineStart[0] + t * dx;
  const projY = lineStart[1] + t * dy;
  const ddx = point[0] - projX;
  const ddy = point[1] - projY;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

// 坐标环转 SVG path
function ringToPath(ring) {
  const simplified = simplifyCoords(ring, 0.15); // 简化容差
  if (simplified.length < 3) return '';
  
  let d = '';
  simplified.forEach((coord, i) => {
    const x = lngToX(coord[0]).toFixed(1);
    const y = latToY(coord[1]).toFixed(1);
    d += (i === 0 ? `M${x},${y}` : ` L${x},${y}`);
  });
  d += ' Z';
  return d;
}

// GeoJSON geometry -> SVG path
function geometryToPath(geometry) {
  const paths = [];
  
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => {
      const p = ringToPath(ring);
      if (p) paths.push(p);
    });
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        const p = ringToPath(ring);
        if (p) paths.push(p);
      });
    });
  }
  
  return paths.join(' ');
}

// 计算几何中心
function getCentroid(geometry) {
  let sumX = 0, sumY = 0, count = 0;
  
  function processCoords(coords) {
    coords.forEach(coord => {
      sumX += lngToX(coord[0]);
      sumY += latToY(coord[1]);
      count++;
    });
  }
  
  if (geometry.type === 'Polygon') {
    processCoords(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    // 用面积最大的多边形的中心
    let maxLen = 0;
    let maxRing = null;
    geometry.coordinates.forEach(polygon => {
      if (polygon[0].length > maxLen) {
        maxLen = polygon[0].length;
        maxRing = polygon[0];
      }
    });
    if (maxRing) processCoords(maxRing);
  }
  
  return {
    cx: count > 0 ? +(sumX / count).toFixed(1) : 0,
    cy: count > 0 ? +(sumY / count).toFixed(1) : 0,
  };
}

// 省份全称 -> 简称映射
const PROVINCE_SHORT_NAME = {
  '北京市': '北京',
  '天津市': '天津',
  '河北省': '河北',
  '山西省': '山西',
  '内蒙古自治区': '内蒙古',
  '辽宁省': '辽宁',
  '吉林省': '吉林',
  '黑龙江省': '黑龙江',
  '上海市': '上海',
  '江苏省': '江苏',
  '浙江省': '浙江',
  '安徽省': '安徽',
  '福建省': '福建',
  '江西省': '江西',
  '山东省': '山东',
  '河南省': '河南',
  '湖北省': '湖北',
  '湖南省': '湖南',
  '广东省': '广东',
  '广西壮族自治区': '广西',
  '海南省': '海南',
  '重庆市': '重庆',
  '四川省': '四川',
  '贵州省': '贵州',
  '云南省': '云南',
  '西藏自治区': '西藏',
  '陕西省': '陕西',
  '甘肃省': '甘肃',
  '青海省': '青海',
  '宁夏回族自治区': '宁夏',
  '新疆维吾尔自治区': '新疆',
  '台湾省': '台湾',
  '香港特别行政区': '香港',
  '澳门特别行政区': '澳门',
};

// 下载 GeoJSON
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('正在下载中国地图 GeoJSON 数据...');
  const geojson = await fetchJSON(GEOJSON_URL);
  console.log(`下载完成，共 ${geojson.features.length} 个省份`);
  
  const provinces = [];
  
  for (const feature of geojson.features) {
    const fullName = feature.properties.name;
    const name = PROVINCE_SHORT_NAME[fullName] || fullName;
    
    // 跳过空名称（南海诸岛等）
    if (!name || !fullName) {
      console.warn(`跳过：无名称的区域`);
      continue;
    }
    
    const pathD = geometryToPath(feature.geometry);
    const centroid = getCentroid(feature.geometry);
    
    if (!pathD) {
      console.warn(`跳过 ${name}：无有效路径`);
      continue;
    }
    
    provinces.push({
      name,
      path: pathD,
      cx: centroid.cx,
      cy: centroid.cy,
    });
    
    console.log(`  ✓ ${name} (path长度: ${pathD.length})`);
  }
  
  // 生成 TypeScript 文件
  let tsContent = `/**
 * 中国省份 SVG 路径数据（自动生成）
 * 
 * 数据来源：阿里云 DataV GeoJSON
 * 生成时间：${new Date().toISOString()}
 * 
 * 重新生成：node scripts/generateChinaMapData.js
 */

export interface ProvincePathData {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

export const CHINA_MAP_VIEWBOX = '0 0 580 500';

export const CHINA_PROVINCES: ProvincePathData[] = [\n`;

  for (const p of provinces) {
    tsContent += `  {\n`;
    tsContent += `    name: '${p.name}',\n`;
    tsContent += `    path: '${p.path}',\n`;
    tsContent += `    cx: ${p.cx},\n`;
    tsContent += `    cy: ${p.cy},\n`;
    tsContent += `  },\n`;
  }
  
  tsContent += `];\n`;
  
  const outPath = path.join(__dirname, '..', 'src', 'data', 'chinaMapPaths.ts');
  fs.writeFileSync(outPath, tsContent, 'utf-8');
  console.log(`\n✅ 已生成: ${outPath}`);
  console.log(`   共 ${provinces.length} 个省份`);
}

main().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
