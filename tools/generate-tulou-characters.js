const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'assets', 'hujian-tulou');
fs.mkdirSync(outDir, { recursive: true });

const SCALE = 4;
const SPRITE = 32;
const CANVAS = SPRITE * SCALE;
const generatedFiles = [];

function crc32(buf) {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return ~crc >>> 0;
}

function chunk(type, data) {
    const name = Buffer.from(type);
    const body = data || Buffer.alloc(0);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([name, body])), 0);
    return Buffer.concat([len, name, body, crc]);
}

function color(hex) {
    const value = hex.replace('#', '');
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
        value.length >= 8 ? parseInt(value.slice(6, 8), 16) : 255
    ];
}

function makeCanvas() {
    const pixels = Array.from({ length: CANVAS * CANVAS }, () => [0, 0, 0, 0]);

    function plot(x, y, fill) {
        if (x < 0 || y < 0 || x >= SPRITE || y >= SPRITE) return;
        const [r, g, b, a] = typeof fill === 'string' ? color(fill) : fill;
        for (let sy = 0; sy < SCALE; sy++) {
            for (let sx = 0; sx < SCALE; sx++) {
                pixels[(y * SCALE + sy) * CANVAS + (x * SCALE + sx)] = [r, g, b, a];
            }
        }
    }

    function rect(x, y, w, h, fill) {
        for (let yy = y; yy < y + h; yy++) {
            for (let xx = x; xx < x + w; xx++) plot(xx, yy, fill);
        }
    }

    function line(x0, y0, x1, y1, fill) {
        const dx = Math.abs(x1 - x0);
        const dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        let x = x0;
        let y = y0;

        while (true) {
            plot(x, y, fill);
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) {
                err += dy;
                x += sx;
            }
            if (e2 <= dx) {
                err += dx;
                y += sy;
            }
        }
    }

    function ellipse(cx, cy, rx, ry, fill) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
            for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
                const dx = (x - cx) / rx;
                const dy = (y - cy) / ry;
                if (dx * dx + dy * dy <= 1) plot(x, y, fill);
            }
        }
    }

    function polygon(points, fill) {
        const minY = Math.floor(Math.min(...points.map(p => p[1])));
        const maxY = Math.ceil(Math.max(...points.map(p => p[1])));
        for (let y = minY; y <= maxY; y++) {
            const nodes = [];
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const [xi, yi] = points[i];
                const [xj, yj] = points[j];
                if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
                    nodes.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
                }
            }
            nodes.sort((a, b) => a - b);
            for (let i = 0; i < nodes.length; i += 2) {
                for (let x = Math.floor(nodes[i]); x <= Math.ceil(nodes[i + 1]); x++) {
                    plot(x, y, fill);
                }
            }
        }
    }

    function writePng(file) {
        const raw = Buffer.alloc((CANVAS * 4 + 1) * CANVAS);
        let offset = 0;
        for (let y = 0; y < CANVAS; y++) {
            raw[offset++] = 0;
            for (let x = 0; x < CANVAS; x++) {
                const px = pixels[y * CANVAS + x];
                raw[offset++] = px[0];
                raw[offset++] = px[1];
                raw[offset++] = px[2];
                raw[offset++] = px[3];
            }
        }

        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(CANVAS, 0);
        ihdr.writeUInt32BE(CANVAS, 4);
        ihdr[8] = 8;
        ihdr[9] = 6;
        ihdr[10] = 0;
        ihdr[11] = 0;
        ihdr[12] = 0;

        fs.writeFileSync(file, Buffer.concat([
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
            chunk('IHDR', ihdr),
            chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
            chunk('IEND')
        ]));
        generatedFiles.push(file);
    }

    return { plot, rect, line, ellipse, polygon, writePng };
}

function drawSheep(file, theme) {
    const c = makeCanvas();
    const outline = theme.outline || '#5b4329';

    c.ellipse(16, 23, 8.5, 3.2, '#58432555');
    c.rect(9, 20, 4, 6, theme.hoof || '#4b3a2a');
    c.rect(20, 20, 4, 6, theme.hoof || '#4b3a2a');
    c.ellipse(16, 17, 10.5, 7.5, outline);
    c.ellipse(16, 16, 9.5, 7, theme.wool);
    c.ellipse(9, 12, 3.8, 3.5, theme.wool);
    c.ellipse(13, 9, 4.2, 3.8, theme.wool);
    c.ellipse(18, 9, 4.2, 3.8, theme.wool);
    c.ellipse(23, 12, 3.8, 3.5, theme.wool);
    c.ellipse(10, 18, 4.6, 4, theme.woolShade);
    c.ellipse(22, 18, 4.6, 4, theme.woolShade);
    c.ellipse(16, 16, 5.4, 5.8, theme.face);

    if (theme.horn) {
        c.rect(8, 11, 3, 2, '#d9c48c');
        c.rect(22, 11, 3, 2, '#d9c48c');
        c.plot(8, 10, '#fff1bd');
        c.plot(24, 10, '#fff1bd');
    } else {
        c.rect(7, 13, 2, 3, outline);
        c.rect(24, 13, 2, 3, outline);
    }

    if (theme.bell) {
        c.rect(15, 22, 3, 2, '#d9a63a');
        c.plot(16, 24, '#805824');
    }

    if (theme.patch) {
        c.rect(19, 12, 3, 2, theme.patch);
        c.plot(20, 14, theme.patch);
    }

    c.rect(12, 15, 2, 2, '#2d231d');
    c.rect(19, 15, 2, 2, '#2d231d');
    c.rect(16, 18, 2, 1, theme.faceDark || '#7c5136');
    c.rect(13, 19, 2, 1, theme.blush || '#dba07e');
    c.rect(20, 19, 2, 1, theme.blush || '#dba07e');
    c.plot(11, 10, '#fff8dd');
    c.plot(20, 10, '#fff8dd');
    c.writePng(path.join(outDir, file));
}

function drawWolf(file, theme) {
    const c = makeCanvas();
    const outline = theme.outline || '#242631';

    c.ellipse(16, 23, 9, 3, '#28251f55');
    c.rect(8, 20, 4, 6, outline);
    c.rect(21, 20, 4, 6, outline);
    c.polygon([[5, 8], [11, 3], [13, 12]], outline);
    c.polygon([[27, 8], [21, 3], [19, 12]], outline);
    c.polygon([[7, 8], [11, 5], [12, 11]], theme.ear);
    c.polygon([[25, 8], [21, 5], [20, 11]], theme.ear);
    c.ellipse(16, 16, 11, 8, outline);
    c.ellipse(16, 16, 9.5, 7, theme.fur);
    c.polygon([[8, 12], [16, 7], [24, 12], [22, 18], [16, 22], [10, 18]], theme.furDark);
    c.ellipse(16, 18, 5.4, 4.2, theme.muzzle);

    if (theme.brow) {
        c.rect(10, 12, 5, 1, theme.brow);
        c.rect(18, 12, 5, 1, theme.brow);
    }
    if (theme.cheek) {
        c.rect(8, 18, 3, 2, theme.cheek);
        c.rect(22, 18, 3, 2, theme.cheek);
    }
    if (theme.scar) {
        c.line(21, 9, 17, 13, '#efe2bb');
        c.line(22, 9, 18, 13, theme.furDark);
    }

    c.rect(11, 14, 3, 2, theme.eye || '#fff0bf');
    c.rect(19, 14, 3, 2, theme.eye || '#fff0bf');
    c.rect(12, 15, 2, 2, outline);
    c.rect(19, 15, 2, 2, outline);
    c.rect(15, 17, 3, 2, outline);
    c.rect(15, 20, 3, 1, theme.mouth || '#9a453d');
    c.rect(10, 19, 3, 2, '#efe2bb');
    c.rect(20, 19, 3, 2, '#efe2bb');
    c.rect(13, 22, 2, 2, outline);
    c.rect(19, 22, 2, 2, outline);
    c.plot(16, 9, theme.ear);
    c.plot(15, 10, theme.ear);
    c.writePng(path.join(outDir, file));
}

function drawVillage(file, theme) {
    const c = makeCanvas();
    const outline = '#5f5444';
    c.ellipse(16, 24, 10, 3.5, '#4f6a3e55');
    c.ellipse(16, 13, 12, 7.5, outline);
    c.ellipse(16, 13, 10, 5.5, theme.roof);
    c.ellipse(16, 14, 7, 3.5, theme.roofLight);
    c.rect(5, 13, 22, 11, outline);
    c.rect(6, 14, 20, 10, theme.wall);
    c.rect(13, 19, 6, 6, '#7d4c38');
    c.rect(15, 20, 2, 5, '#d0b18a');
    c.rect(9, 16, 2, 3, '#6b513f');
    c.rect(21, 16, 2, 3, '#6b513f');
    c.rect(11, 11, 2, 2, theme.beam);
    c.rect(15, 10, 2, 2, theme.beam);
    c.rect(19, 11, 2, 2, theme.beam);
    if (theme.banner) {
        c.rect(6, 18, 2, 6, theme.banner);
        c.rect(24, 18, 2, 6, theme.banner);
    }
    c.writePng(path.join(outDir, file));
}

function drawObstacle(file, theme) {
    const c = makeCanvas();
    c.ellipse(16, 24, 10, 3, '#382a1d55');
    if (theme.kind === 'stone') {
        c.ellipse(15, 17, 11, 8, '#54483a');
        c.ellipse(13, 15, 7, 5, '#7d6a52');
        c.ellipse(21, 19, 5, 4, '#3f352c');
        c.line(9, 17, 20, 12, '#9a8463');
        c.line(11, 20, 24, 20, '#2c281f');
    } else if (theme.kind === 'log') {
        c.rect(6, 14, 20, 10, '#5a3924');
        c.rect(8, 12, 19, 3, '#8f613a');
        c.rect(6, 23, 20, 3, '#3b2c20');
        c.ellipse(8, 19, 4, 6, '#a97845');
        c.ellipse(8, 19, 2, 3, '#5c3b24');
        c.line(13, 15, 24, 15, '#c08a52');
        c.line(13, 20, 24, 20, '#3d2b1f');
    } else if (theme.kind === 'crate') {
        c.rect(7, 10, 18, 17, '#4c3525');
        c.rect(8, 11, 16, 15, '#9f6a38');
        c.line(8, 11, 24, 26, '#5d3d24');
        c.line(24, 11, 8, 26, '#5d3d24');
        c.rect(10, 15, 12, 2, '#c08a4b');
        c.rect(10, 21, 12, 2, '#6f4728');
    } else {
        c.rect(8, 11, 16, 14, '#51483b');
        c.polygon([[6, 12], [16, 6], [26, 12]], '#6b5c47');
        c.rect(11, 15, 3, 7, '#a97a45');
        c.rect(18, 15, 3, 7, '#a97a45');
        c.rect(9, 23, 14, 3, '#392f25');
    }
    c.writePng(path.join(outDir, file));
}

function drawTrap(file, theme) {
    const c = makeCanvas();
    c.ellipse(16, 23, 10, 3, '#3b2a2455');
    if (theme.kind === 'pit') {
        c.ellipse(16, 17, 11, 7, '#4d2d29');
        c.ellipse(16, 17, 8, 5, '#221817');
        c.line(8, 15, 24, 15, '#d6a358');
        c.line(10, 20, 22, 20, '#8e5e3e');
        c.rect(13, 12, 2, 3, '#f0d28a');
        c.rect(19, 13, 2, 3, '#f0d28a');
    } else if (theme.kind === 'spikes') {
        c.rect(7, 22, 18, 3, '#5b3a2c');
        for (let i = 0; i < 5; i++) {
            const x = 7 + i * 4;
            c.polygon([[x, 22], [x + 2, 10 + (i % 2)], [x + 4, 22]], '#e9d18e');
            c.line(x + 1, 18, x + 2, 12, '#8e5d41');
        }
    } else if (theme.kind === 'snare') {
        c.ellipse(16, 17, 9, 6, '#d8bd74');
        c.ellipse(16, 17, 6, 4, '#3d3329');
        c.line(16, 13, 24, 7, '#d8bd74');
        c.line(24, 7, 27, 10, '#8d6239');
        c.rect(8, 22, 17, 2, '#60402e');
    } else {
        c.polygon([[16, 7], [25, 16], [16, 25], [7, 16]], '#562f2d');
        c.polygon([[16, 10], [22, 16], [16, 22], [10, 16]], '#a34d42');
        c.rect(15, 11, 2, 10, '#f3d790');
        c.rect(11, 15, 10, 2, '#f3d790');
    }
    c.writePng(path.join(outDir, file));
}

const sheepThemes = [
    { file: 'sheep.png', wool: '#f8edc9', woolShade: '#dec895', face: '#bc8353', bell: true },
    { file: 'sheep-2.png', wool: '#fff9df', woolShade: '#d7c8a2', face: '#9e6e51', horn: true },
    { file: 'sheep-3.png', wool: '#ead2a2', woolShade: '#bd9a63', face: '#7f573c', patch: '#6c5138' },
    { file: 'sheep-4.png', wool: '#f5dfbd', woolShade: '#d7a989', face: '#c7865d', blush: '#e8a7a0' },
    { file: 'sheep-5.png', wool: '#e8e3d1', woolShade: '#aaa99c', face: '#8c6a54', horn: true, bell: true }
];

const wolfThemes = [
    { file: 'wolf.png', fur: '#68717b', furDark: '#3b414d', ear: '#9da29e', muzzle: '#c9b18a', brow: '#2d323d' },
    { file: 'wolf-2.png', fur: '#55606b', furDark: '#252d38', ear: '#8a918d', muzzle: '#c7a77e', cheek: '#7a8084' },
    { file: 'wolf-3.png', fur: '#745f50', furDark: '#3e3028', ear: '#b08a64', muzzle: '#d0b28b', eye: '#ffe58d' },
    { file: 'wolf-4.png', fur: '#80858d', furDark: '#4b515a', ear: '#b4b1a4', muzzle: '#d6c196', scar: true },
    { file: 'wolf-5.png', fur: '#4d4d56', furDark: '#272733', ear: '#8c8790', muzzle: '#bda27d', brow: '#18191f', mouth: '#bd5649' }
];

const villageThemes = [
    { file: 'village.png', roof: '#5b5143', roofLight: '#a87958', wall: '#e8c07c', beam: '#b78050' },
    { file: 'village-2.png', roof: '#4f493f', roofLight: '#b18a65', wall: '#f0d5a1', beam: '#8e6046', banner: '#c45d56' },
    { file: 'village-3.png', roof: '#625542', roofLight: '#c08a54', wall: '#d7963d', beam: '#754b33' },
    { file: 'village-4.png', roof: '#51493d', roofLight: '#947354', wall: '#efdcae', beam: '#a36e47', banner: '#5e8f5c' }
];

const obstacleThemes = [
    { file: 'obstacle.png', kind: 'stone' },
    { file: 'obstacle-2.png', kind: 'log' },
    { file: 'obstacle-3.png', kind: 'crate' },
    { file: 'obstacle-4.png', kind: 'shed' }
];

const trapThemes = [
    { file: 'trap.png', kind: 'pit' },
    { file: 'trap-2.png', kind: 'spikes' },
    { file: 'trap-3.png', kind: 'snare' },
    { file: 'trap-4.png', kind: 'mark' }
];

sheepThemes.forEach(theme => drawSheep(theme.file, theme));
wolfThemes.forEach(theme => drawWolf(theme.file, theme));
villageThemes.forEach(theme => drawVillage(theme.file, theme));
obstacleThemes.forEach(theme => drawObstacle(theme.file, theme));
trapThemes.forEach(theme => drawTrap(theme.file, theme));

console.log(generatedFiles.map(file => path.relative(path.join(__dirname, '..'), file)).join('\n'));
