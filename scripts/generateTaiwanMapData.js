/* eslint-disable */
/**
 * 生成台湾省市县级 SVG path 数据
 * 数据源：unpkg.com/taiwan-atlas TopoJSON
 * 运行：node scripts/generateTaiwanMapData.js
 * 输出：src/data/provinceMapPaths/taiwan.ts 并更新 index.ts
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 台湾市县名称映射（TopoJSON 中的 id -> 中文名）
const COUNTY_NAMES = {
  '09007': '连江县',
  '09020': '金门县',
  '10002': '宜兰县',
  '10004': '新竹县',
  '10005': '苗栗县',
  '10007': '彰化县',
  '10008': '南投县',
  '10009': '云林县',
  '10010': '嘉义县',
  '10013': '屏东县',
  '10014': '台东县',
  '10015': '花莲县',
  '10016': '澎湖县',
  '10017': '基隆市',
  '10018': '新竹市',
  '10020': '嘉义市',
  '63000': '台北市',
  '64000': '高雄市',
  '65000': '新北市',
  '66000': '台中市',
  '67000': '台南市',
  '68000': '桃园市',
};

function fetchJSON(url) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, function (res) {
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, function () { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * 将 TopoJSON arc 解码为坐标数组
 */
function decodeArcs(topology) {
  var transform = topology.transform;
  var scale = transform.scale;
  var translate = transform.translate;
  var decoded = [];

  topology.arcs.forEach(function (arc) {
    var coords = [];
    var x = 0, y = 0;
    arc.forEach(function (point) {
      x += point[0];
      y += point[1];
      coords.push([
        x * scale[0] + translate[0],
        y * scale[1] + translate[1]
      ]);
    });
    decoded.push(coords);
  });
  return decoded;
}

/**
 * 将 TopoJSON geometry 转为 GeoJSON 坐标
 */
function topoGeometryToCoords(geom, decodedArcs) {
  if (geom.type === 'Polygon') {
    return geom.arcs.map(function (ring) {
      return ringToCoords(ring, decodedArcs);
    });
  } else if (geom.type === 'MultiPolygon') {
    return geom.arcs.map(function (polygon) {
      return polygon.map(function (ring) {
        return ringToCoords(ring, decodedArcs);
      });
    });
  }
  return [];
}

function ringToCoords(ring, decodedArcs) {
  var coords = [];
  ring.forEach(function (arcIdx) {
    var arc;
    if (arcIdx >= 0) {
      arc = decodedArcs[arcIdx].slice();
    } else {
      arc = decodedArcs[~arcIdx].slice().reverse();
    }
    // 去掉首个点（和上一段末尾重复），除非是第一段
    if (coords.length > 0) arc = arc.slice(1);
    coords = coords.concat(arc);
  });
  return coords;
}

// Douglas-Peucker 简化
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

function computeProjection(allCoords) {
  var lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity;
  allCoords.forEach(function (ring) {
    ring.forEach(function (c) {
      if (c[0] < lngMin) lngMin = c[0]; if (c[0] > lngMax) lngMax = c[0];
      if (c[1] < latMin) latMin = c[1]; if (c[1] > latMax) latMax = c[1];
    });
  });
  var lp = (lngMax - lngMin) * 0.05, ap = (latMax - latMin) * 0.05;
  lngMin -= lp; lngMax += lp; latMin -= ap; latMax += ap;
  var W = 560, H = 480;
  var mMin = Math.log(Math.tan(Math.PI / 4 + (latMin * Math.PI / 180) / 2));
  var mMax = Math.log(Math.tan(Math.PI / 4 + (latMax * Math.PI / 180) / 2));
  return {
    lngToX: function (lng) { return ((lng - lngMin) / (lngMax - lngMin)) * W + 10; },
    latToY: function (lat) {
      var m = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
      return H - ((m - mMin) / (mMax - mMin)) * H + 10;
    },
    W: W, H: H
  };
}

function ringToPath(ring, p) {
  var s = simplifyCoords(ring, 0.02);
  if (s.length < 3) return '';
  var d = '';
  s.forEach(function (c, i) {
    var x = p.lngToX(c[0]).toFixed(1), y = p.latToY(c[1]).toFixed(1);
    d += (i === 0 ? 'M' + x + ',' + y : ' L' + x + ',' + y);
  });
  return d + ' Z';
}

function getCentroid(rings, p) {
  // 使用最大环的质心
  var best = rings[0] || [];
  rings.forEach(function (r) { if (r.length > best.length) best = r; });
  var sx = 0, sy = 0, n = 0;
  best.forEach(function (c) { sx += p.lngToX(c[0]); sy += p.latToY(c[1]); n++; });
  return { cx: n > 0 ? +(sx / n).toFixed(1) : 0, cy: n > 0 ? +(sy / n).toFixed(1) : 0 };
}


async function main() {
  console.log('正在下载台湾市县 TopoJSON 数据...');
  var topo = await fetchJSON('https://unpkg.com/taiwan-atlas@1.0.0/counties-10t.json');
  console.log('下载完成，开始解析...');

  var decodedArcs = decodeArcs(topo);

  // 获取 counties 对象
  var objectKey = Object.keys(topo.objects)[0];
  var geometries = topo.objects[objectKey].geometries;

  console.log('共 ' + geometries.length + ' 个市县');

  // 收集所有坐标用于投影计算
  var allRings = [];
  var countyData = [];

  geometries.forEach(function (geom) {
    var id = geom.id || (geom.properties && geom.properties.COUNTYID) || '';
    var name = COUNTY_NAMES[id] || (geom.properties && geom.properties.COUNTYNAME) || id;

    var coords;
    if (geom.type === 'Polygon') {
      coords = [topoGeometryToCoords(geom, decodedArcs)];
    } else if (geom.type === 'MultiPolygon') {
      coords = topoGeometryToCoords(geom, decodedArcs).map(function (poly) { return poly; });
    } else {
      coords = [topoGeometryToCoords(geom, decodedArcs)];
    }

    // 扁平化所有环
    var rings = [];
    if (geom.type === 'MultiPolygon') {
      coords.forEach(function (poly) {
        poly.forEach(function (ring) { rings.push(ring); });
      });
    } else if (geom.type === 'Polygon') {
      var polyCoords = topoGeometryToCoords(geom, decodedArcs);
      polyCoords.forEach(function (ring) { rings.push(ring); });
    }

    rings.forEach(function (r) { allRings.push(r); });
    countyData.push({ name: name, rings: rings });
  });

  // 过滤掉离岛（连江县、金门县、澎湖县），它们离本岛太远会影响投影
  // 先计算只包含本岛的投影
  var mainIslandRings = [];
  var islandCounties = ['连江县', '金门县', '澎湖县'];
  countyData.forEach(function (c) {
    if (islandCounties.indexOf(c.name) === -1) {
      c.rings.forEach(function (r) { mainIslandRings.push(r); });
    }
  });

  var proj = computeProjection(mainIslandRings.length > 0 ? mainIslandRings : allRings);
  var vb = '0 0 ' + (proj.W + 20) + ' ' + (proj.H + 20);

  var cities = [];
  countyData.forEach(function (c) {
    // 跳过离岛（它们在投影范围外会显示异常）
    if (islandCounties.indexOf(c.name) !== -1) {
      console.log('  跳过离岛: ' + c.name);
      return;
    }

    var pathParts = [];
    c.rings.forEach(function (ring) {
      var d = ringToPath(ring, proj);
      if (d) pathParts.push(d);
    });
    var pd = pathParts.join(' ');
    if (!pd) {
      console.log('  跳过（无路径）: ' + c.name);
      return;
    }
    var ct = getCentroid(c.rings, proj);
    cities.push({ name: c.name, path: pd, cx: ct.cx, cy: ct.cy });
    console.log('  OK: ' + c.name);
  });

  console.log('生成 ' + cities.length + ' 个市县');

  // 写入 taiwan.ts
  var outDir = path.join(__dirname, '..', 'src', 'data', 'provinceMapPaths');
  var lines = [
    '/**',
    ' * 台湾 SVG path data (auto-generated)',
    ' * Source: taiwan-atlas TopoJSON',
    ' * Generated: ' + new Date().toISOString(),
    ' */',
    '',
    "import {ProvinceMapData} from './index';",
    '',
    'const data: ProvinceMapData = {',
    "  id: 'taiwan',",
    "  name: '台湾',",
    '  adcode: 710000,',
    "  viewBox: '" + vb + "',",
    '  cities: ['
  ];
  cities.forEach(function (c) {
    lines.push('    {');
    lines.push("      name: '" + c.name + "',");
    lines.push("      path: '" + c.path + "',");
    lines.push('      cx: ' + c.cx + ',');
    lines.push('      cy: ' + c.cy + ',');
    lines.push('    },');
  });
  lines.push('  ],', '};', '', 'export default data;', '');

  var fp = path.join(outDir, 'taiwan.ts');
  fs.writeFileSync(fp, lines.join('\n'), 'utf-8');
  console.log('已写入: ' + fp);

  // 更新 index.ts：添加台湾的 import 和映射
  var indexPath = path.join(outDir, 'index.ts');
  var indexContent = fs.readFileSync(indexPath, 'utf-8');

  // 添加 import
  if (indexContent.indexOf("import taiwanData") === -1) {
    indexContent = indexContent.replace(
      "import hongkongData from './hongkong';",
      "import taiwanData from './taiwan';\nimport hongkongData from './hongkong';"
    );
  }

  // 添加到 PROVINCE_MAP_DATA
  if (indexContent.indexOf("'taiwan': taiwanData") === -1) {
    indexContent = indexContent.replace(
      "  'hongkong': hongkongData,",
      "  'taiwan': taiwanData,\n  'hongkong': hongkongData,"
    );
  }

  // 添加到 PROVINCE_NAME_TO_ID
  if (indexContent.indexOf("'台湾': 'taiwan'") === -1) {
    indexContent = indexContent.replace(
      "  '香港': 'hongkong',",
      "  '台湾': 'taiwan',\n  '香港': 'hongkong',"
    );
  }

  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log('已更新: ' + indexPath);
  console.log('完成！');
}

main().catch(function (e) { console.error('失败:', e); process.exit(1); });
