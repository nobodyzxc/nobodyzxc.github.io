/* eslint-disable no-restricted-globals */
importScripts(
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js'
);

const stemFromPath = (name) => {
  const base = String(name || '').split('/').pop() || String(name || '');
  return base.replace(/\.(gpx|fit)(\.gz)?$/i, '');
};

const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
};

const parseCsv = (text) => {
  const lines = String(text || '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
    return row;
  });
};

const buildMetaMaps = (rows) => {
  const byId = new Map();
  const byFilenameStem = new Map();
  rows.forEach((row) => {
    const id = String(row['Activity ID'] || row['活動 ID'] || '').trim();
    if (id) byId.set(id, row);
    const filename = String(row.Filename || row['檔案名稱'] || '').trim();
    if (filename) byFilenameStem.set(stemFromPath(filename), row);
  });
  return { byId, byFilenameStem };
};

const metaPick = (meta, keys, fallback = '') => {
  if (!meta || !keys || !keys.length) return fallback;
  for (let i = 0; i < keys.length; i += 1) {
    const v = meta[keys[i]];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return fallback;
};

const parseMetaNumber = (value) => {
  const s = String(value ?? '').trim().replace(/,/g, '');
  if (!s) return Number.NaN;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : Number.NaN;
};

const parseActivityDateTs = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return Number.NaN;
  let ts = Date.parse(s);
  if (Number.isFinite(ts)) return ts;
  const m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
    ts = d.getTime();
    return Number.isFinite(ts) ? ts : Number.NaN;
  }
  const zh = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!zh) return Number.NaN;
  const d = new Date(Number(zh[1]), Number(zh[2]) - 1, Number(zh[3]), 12, 0, 0, 0);
  ts = d.getTime();
  return Number.isFinite(ts) ? ts : Number.NaN;
};

const parseGpxText = (text) => {
  const pts = [];
  const tagRe = /<(?:[a-z0-9_]+:)?trkpt\b[^>]*>/gi;
  const latRe = /\blat=(['"])(.*?)\1/i;
  const lonRe = /\blon=(['"])(.*?)\1/i;
  let m = null;
  while ((m = tagRe.exec(String(text || ''))) !== null) {
    const tag = m[0];
    const lm = tag.match(latRe);
    const nm = tag.match(lonRe);
    if (!lm || !nm) continue;
    const lat = Number(lm[2]);
    const lon = Number(nm[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) pts.push([lat, lon]);
  }
  return pts;
};

const fitSemicircleToDegrees = (value) => (value * 180) / 2147483648;
const parseFitPoints = (u8) => {
  const points = [];
  if (!u8 || u8.length < 14) return points;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const headerSize = dv.getUint8(0);
  if (headerSize < 12 || u8.length < headerSize + 2) return points;

  const dataSize = dv.getUint32(4, true);
  const dataStart = headerSize;
  const dataEnd = Math.min(u8.length, dataStart + dataSize);
  const definitions = new Map();
  let offset = dataStart;

  const readSint32 = (pos, littleEndian) => {
    if (pos + 4 > dataEnd) return null;
    return dv.getInt32(pos, littleEndian);
  };

  while (offset < dataEnd) {
    const header = dv.getUint8(offset);
    offset += 1;

    if (header & 0x80) {
      const localMsgType = (header >> 5) & 0x03;
      const def = definitions.get(localMsgType);
      if (!def) continue;
      let lat = null;
      let lon = null;
      for (const field of def.fields) {
        if (offset + field.size > dataEnd) { offset = dataEnd; break; }
        if (def.globalMsgNum === 20 && field.size === 4 && (field.num === 0 || field.num === 1)) {
          const value = readSint32(offset, def.littleEndian);
          if (value !== null && value !== 0x7fffffff) {
            if (field.num === 0) lat = fitSemicircleToDegrees(value);
            if (field.num === 1) lon = fitSemicircleToDegrees(value);
          }
        }
        offset += field.size;
      }
      if (Number.isFinite(lat) && Number.isFinite(lon)) points.push([lat, lon]);
      continue;
    }

    const isDefinition = (header & 0x40) !== 0;
    const hasDeveloperData = (header & 0x20) !== 0;
    const localMsgType = header & 0x0f;

    if (isDefinition) {
      if (offset + 5 > dataEnd) break;
      offset += 1;
      const architecture = dv.getUint8(offset); offset += 1;
      const littleEndian = architecture === 0;
      const globalMsgNum = dv.getUint16(offset, littleEndian); offset += 2;
      const numFields = dv.getUint8(offset); offset += 1;
      const fields = [];
      for (let i = 0; i < numFields; i += 1) {
        if (offset + 3 > dataEnd) break;
        const num = dv.getUint8(offset);
        const size = dv.getUint8(offset + 1);
        fields.push({ num, size });
        offset += 3;
      }
      if (hasDeveloperData) {
        if (offset + 1 > dataEnd) break;
        const numDevFields = dv.getUint8(offset);
        offset += 1 + numDevFields * 3;
      }
      definitions.set(localMsgType, { globalMsgNum, littleEndian, fields });
      continue;
    }

    const def = definitions.get(localMsgType);
    if (!def) continue;
    let lat = null;
    let lon = null;
    for (const field of def.fields) {
      if (offset + field.size > dataEnd) { offset = dataEnd; break; }
      if (def.globalMsgNum === 20 && field.size === 4 && (field.num === 0 || field.num === 1)) {
        const value = readSint32(offset, def.littleEndian);
        if (value !== null && value !== 0x7fffffff) {
          if (field.num === 0) lat = fitSemicircleToDegrees(value);
          if (field.num === 1) lon = fitSemicircleToDegrees(value);
        }
      }
      offset += field.size;
    }
    if (Number.isFinite(lat) && Number.isFinite(lon)) points.push([lat, lon]);
  }
  return points;
};

const toRad = (v) => (v * Math.PI) / 180;
const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const detectTrackAnomaly = (points) => {
  if (!points || points.length < 2) return true;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let jump200 = 0;
  let jump1000 = 0;
  let nearZero = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const lat = Number(p && p[0]);
    const lon = Number(p && p[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (Math.abs(lat) < 0.5 && Math.abs(lon) < 0.5) nearZero += 1;
    if (i > 0) {
      const d = haversineMeters(points[i - 1], points[i]);
      if (d > 200000) jump200 += 1;
      if (d > 1000000) jump1000 += 1;
    }
  }
  const latSpan = maxLat - minLat;
  const lonSpan = maxLon - minLon;
  const nearZeroRatio = nearZero / Math.max(1, points.length);
  return jump1000 >= 1
    || jump200 >= 3
    || (latSpan > 10 && lonSpan > 10)
    || nearZeroRatio > 0.02;
};

const send = (payload) => postMessage(payload);

self.onmessage = async (ev) => {
  const data = ev && ev.data ? ev.data : {};
  if (data.kind !== 'parseZip') return;
  const id = data.id;
  const sourceLabel = String(data.sourceLabel || 'zip');
  try {
    send({ id, type: 'progress', percent: 0, text: `準備解析 ${sourceLabel}` });
    const zip = await self.JSZip.loadAsync(data.buffer);
    let metaMaps = { byId: new Map(), byFilenameStem: new Map() };
    const csvEntry = zip.file('activities.csv');
    if (csvEntry) {
      const csvText = await csvEntry.async('text');
      metaMaps = buildMetaMaps(parseCsv(csvText));
    }
    const entries = Object.values(zip.files).filter((f) => !f.dir && /(^|\/)activities\/.+\.(gpx|fit)(\.gz)?$/i.test(f.name));
    if (!entries.length) {
      send({ id, type: 'result', cache: null });
      return;
    }
    const tracks = [];
    let parsedGpx = 0;
    let parsedFit = 0;
    let parseError = 0;
    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i];
      send({ id, type: 'progress', percent: (i / Math.max(1, entries.length)) * 82, text: `解析檔案 ${i + 1}/${entries.length}` });
      let u8 = await e.async('uint8array');
      if (/\.gz$/i.test(e.name)) u8 = self.pako.ungzip(u8);
      let points = [];
      if (/\.fit(\.gz)?$/i.test(e.name)) {
        points = parseFitPoints(u8);
        if (points.length >= 2) parsedFit += 1;
      } else {
        try {
          const text = new TextDecoder('utf-8').decode(u8);
          points = parseGpxText(text);
          if (points.length >= 2) parsedGpx += 1;
        } catch (_) {
          points = [];
        }
      }
      if (points.length < 2) {
        parseError += 1;
        continue;
      }
      const stem = stemFromPath(e.name);
      const meta = metaMaps.byId.get(stem) || metaMaps.byFilenameStem.get(stem) || {};
      tracks.push({
        entryName: e.name,
        points,
        isAnomaly: detectTrackAnomaly(points),
        actType: String(metaPick(meta, ['Activity Type', '活動類型'], '')).trim(),
        actDate: String(metaPick(meta, ['Activity Date', '活動日期'], '')),
        actTs: parseActivityDateTs(String(metaPick(meta, ['Activity Date', '活動日期'], '')).trim()),
        activityName: String(metaPick(meta, ['Activity Name', '活動名稱'], e.name)),
        distanceRaw: parseMetaNumber(metaPick(meta, ['Distance', '距離'], '')),
        elevGainRaw: parseMetaNumber(metaPick(meta, ['Total Elevation Gain', 'Elevation Gain', '爬升海拔'], '')),
        elevHighRaw: parseMetaNumber(metaPick(meta, ['Elevation High', '最高海拔'], '')),
        movingRaw: parseMetaNumber(metaPick(meta, ['Moving Time', '移動時間'], '')),
        elapsedRaw: parseMetaNumber(metaPick(meta, ['Elapsed Time', '經過時間'], '')),
      });
    }
    send({
      id,
      type: 'result',
      cache: {
        sourceLabel,
        tracks,
        parsedGpx,
        parsedFit,
        parseError,
      },
    });
  } catch (err) {
    send({ id, type: 'error', message: err && err.message ? err.message : String(err) });
  }
};
