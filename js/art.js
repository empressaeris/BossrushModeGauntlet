/* Havenwood Gauntlet — all artwork is drawn here as inline SVG.
 * Characters share a 300x360 bust canvas; backgrounds use 800x600. */
const Art = (() => {
  let n = 0;
  const uid = (p) => `${p}${++n}`;

  const svg = (vb, body, cls = '', par = 'xMidYMax meet') =>
    `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  const stops = (s) => s.map(([o, c, op]) =>
    `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('');
  const lin = (id, s, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
  const rad = (id, s) => `<radialGradient id="${id}">${stops(s)}</radialGradient>`;
  const glow = (id, d = 3) =>
    `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${d}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  // deterministic random so backgrounds look the same every time
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function star(cx, cy, r, fill, extra = '') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
  }
  const sparkle = (x, y, r, fill = '#fff', op = 1) => (x = +x, y = +y, r = +r,
    `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" opacity="${op}"/>`);

  /* ---------------- shared anime face ---------------- */
  const FACE = 'M92 140 C92 84 208 84 208 140 C208 186 190 214 150 238 C110 214 92 186 92 140Z';

  function eyes(o) {
    const Y = 166, ink = o.lash || '#2a1730';
    const gid = uid('iris');
    let s = `<defs>${lin(gid, [[0, o.iris[1]], [0.55, o.iris[0]], [1, o.iris[2] || '#ffffff']])}</defs>`;
    let brows = '';
    for (const cx of [124, 176]) {
      const sd = cx < 150 ? -1 : 1;          // direction of the outer corner
      const out = cx + sd * 18, inn = cx - sd * 18;
      const ex = o.expr;
      if (ex === 'happy') {
        if (o.shadow) s += `<ellipse cx="${cx + sd * 2}" cy="${Y - 8}" rx="20" ry="8" fill="${o.shadow}" opacity=".7"/>`;
        s += `<path d="M${cx - 15} ${Y + 4} Q${cx} ${Y - 14} ${cx + 15} ${Y + 4}" stroke="${ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
        if (o.wing) s += `<path d="M${cx + sd * 15} ${Y + 4} L${cx + sd * 25} ${Y - 4}" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
      } else if (ex === 'hurt') {
        s += `<path d="M${out} ${Y - 9} L${inn + sd * 2} ${Y} L${out} ${Y + 9}" stroke="${ink}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else {
        const h = o.eyeH || (o.narrow ? 19 : 28), top = Y - h / 2, lw = o.lashW || 4.5;
        if (o.shadow) s += `<ellipse cx="${cx + sd * 3}" cy="${top - 1}" rx="21" ry="9" fill="${o.shadow}" opacity=".75"/>`;
        s += `<ellipse cx="${cx}" cy="${Y}" rx="16" ry="${h / 2 + 1}" fill="#fff"/>
          <ellipse cx="${cx}" cy="${Y + 2}" rx="11.5" ry="${h / 2 - 0.5}" fill="url(#${gid})"/>
          <ellipse cx="${cx}" cy="${Y + 3}" rx="${o.slit ? 2.4 : 5}" ry="${o.slit ? h / 2 - 2 : Math.max(3, h / 2 - 6)}" fill="#1b1020" opacity=".85"/>
          <circle cx="${cx - 4}" cy="${Y - 4}" r="${o.narrow ? 2.8 : 4}" fill="#fff"/>
          <circle cx="${cx + 4}" cy="${Y + 6}" r="1.8" fill="#fff" opacity=".85"/>`;
        const slant = ex === 'angry' ? 11 : ex === 'determined' ? 6 : 0;
        if (slant) {
          s += `<polygon points="${out},${top - 10} ${inn},${top - 10} ${inn},${top + 3 + slant} ${out},${top + 3}" fill="${o.shadow || o.skin}"/>
            <path d="M${out + sd * 4} ${top} L${out} ${top + 3} L${inn} ${top + 3 + slant}" stroke="${ink}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>`;
        } else {
          s += `<path d="M${out} ${top + 4} Q${cx} ${top - 7} ${inn} ${top + 3}" stroke="${ink}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>
            <path d="M${out} ${top + 4} L${out + sd * 6} ${top}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
        }
        if (o.wing) s += `<path d="M${out + sd * 1} ${top + 1} L${out + sd * 14} ${top - 6} L${out + sd * 2} ${top + 9}Z" fill="${ink}"/>`;
        s += `<path d="M${cx - 7} ${Y + h / 2 + 2} Q${cx} ${Y + h / 2 + 4} ${cx + 7} ${Y + h / 2 + 2}" stroke="${ink}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      }
      // brows
      const bc = o.brow || ink, bw = o.browW || 3;
      if (ex === 'angry') brows += `<path d="M${out} ${Y - 30} L${inn} ${Y - 19}" stroke="${bc}" stroke-width="${bw + 0.5}" stroke-linecap="round"/>`;
      else if (ex === 'hurt' || ex === 'sad') brows += `<path d="M${out} ${Y - 22} Q${cx} ${Y - 26} ${inn} ${Y - 31}" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
      else if (ex === 'determined') brows += `<path d="M${out} ${Y - 28} Q${cx} ${Y - 29} ${inn} ${Y - 24}" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
      else brows += `<path d="M${out} ${Y - 25} Q${cx} ${Y - 31} ${inn} ${Y - 26}" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
    }
    return { eyes: s, brows };
  }

  function mouth(expr, c = '#6b2a3a', lips = null) {
    if (lips) {
      const closed = `<path d="M140 213 Q145 208.5 150 211 Q155 208.5 160 213 Q155 221 150 221 Q145 221 140 213Z" fill="${lips}"/>
        <path d="M146 217.5 q3 1.2 6 0" stroke="#fff" stroke-width="1.3" opacity=".55" fill="none" stroke-linecap="round"/>`;
      const upper = `<path d="M139 208 Q145 204.5 150 206.5 Q155 204.5 161 208" stroke="${lips}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      switch (expr) {
        case 'happy': case 'smile':
          return `<path d="M139 208 Q150 224 161 208 Q150 212 139 208Z" fill="#5a1a2a"/><path d="M144 214 Q150 219 156 214" fill="#ff8fa3"/>${upper}<path d="M139 208 Q150 224 161 208" stroke="${lips}" stroke-width="3" fill="none"/>`;
        case 'angry':
          return `<path d="M139 216 Q150 207 161 216 Q155 226 150 226 Q145 226 139 216Z" fill="#5a1a2a" stroke="${lips}" stroke-width="3"/><path d="M142 214 L158 214 L156 217 L144 217Z" fill="#fff"/>`;
        case 'hurt':
          return `${closed}<path d="M140 215 Q145 212 150 215 Q155 218 160 214" stroke="${c}" stroke-width="1.8" fill="none"/>`;
        case 'smirk':
          return `${closed}<path d="M141 213.5 Q151 216 161 210" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
        default:
          return `${closed}<path d="M141 213.5 Q150 215.5 159 213.5" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      }
    }
    switch (expr) {
      case 'happy':
      case 'smile':
        return `<path d="M139 208 Q150 224 161 208 Q150 212 139 208Z" fill="#8a2f45"/><path d="M144 214 Q150 219 156 214" fill="#ff8fa3"/>`;
      case 'smirk':
        return `<path d="M140 213 Q152 218 161 207" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      case 'angry':
        return `<path d="M139 216 Q150 207 161 216 Q155 226 150 226 Q145 226 139 216Z" fill="#5a1a2a"/><path d="M142 214 L158 214 L156 217 L144 217Z" fill="#fff"/>`;
      case 'hurt':
        return `<path d="M139 216 Q143 211 147 216 Q151 221 155 216 Q159 211 162 215" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      case 'sad':
        return `<path d="M142 217 Q150 210 158 217" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      case 'determined':
        return `<path d="M141 213 Q150 217 159 213" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      default:
        return `<path d="M143 213 Q150 217 157 213" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
  }

  function head(o) {
    const skin = o.skin || '#ffe6d6', shade = o.shade || '#f2bfa8';
    o.skin = skin;
    const e = eyes(o);
    const blush = o.noBlush ? '' : o.softBlush
      ? `<ellipse cx="108" cy="192" rx="14" ry="6" fill="${o.blush}" opacity=".4"/><ellipse cx="192" cy="192" rx="14" ry="6" fill="${o.blush}" opacity=".4"/>`
      : `<ellipse cx="110" cy="194" rx="13" ry="5.5" fill="${o.blush || '#ff7f9a'}" opacity="${o.blush ? 0.55 : 0.38}"/><ellipse cx="190" cy="194" rx="13" ry="5.5" fill="${o.blush || '#ff7f9a'}" opacity="${o.blush ? 0.55 : 0.38}"/>
       <path d="M104 192 l4 -4 M110 192 l4 -4 M186 192 l4 -4 M192 192 l4 -4" stroke="#ff6f8c" stroke-width="1.2" opacity=".5"/>`;
    const under = `
      <path d="M134 214 L134 266 Q150 276 166 266 L166 214Z" fill="${shade}"/>
      <path d="${FACE}" fill="${skin}"/>
      <path d="M100 168 C104 196 124 218 150 232 C128 212 112 192 104 160Z" fill="${shade}" opacity=".35"/>
      ${blush}
      <path d="M150 189 L147.5 196 L151 196" stroke="${shade}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      ${e.eyes}${o.mouth === false ? '' : mouth(o.mouthExpr || o.expr, o.mouthCol, o.lips)}`;
    return { under, brows: e.brows };
  }

  /* ---------------- characters ---------------- */
  // long, swept-back elven ears (drawn behind the face)
  function elfEars(skin, shade, line) {
    const one = (m) => {
      const X = (x) => (m ? 300 - x : x);
      return `<path d="M${X(98)} 150 C${X(76)} 146 ${X(42)} 128 ${X(8)} 112 C${X(32)} 134 ${X(64)} 166 ${X(100)} 182Z" fill="${skin}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M${X(95)} 158 C${X(76)} 153 ${X(52)} 140 ${X(28)} 126 C${X(48)} 146 ${X(72)} 164 ${X(97)} 173Z" fill="${shade}"/>`;
    };
    return one(false) + one(true);
  }

  // gold circlet with a hanging gem, worn across the forehead
  function circlet(gem) {
    return `<path d="M88 124 Q150 98 212 124" stroke="#a97c1e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M88 124 Q150 98 212 124" stroke="#f0c75a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M96 118 Q150 96 204 118" stroke="#fff3c4" stroke-width="1.2" fill="none"/>
      <path d="M138 108 L162 108 L158 124 L150 132 L142 124Z" fill="#f0c75a" stroke="#a97c1e" stroke-width="1.6"/>
      <circle cx="150" cy="118" r="4.5" fill="${gem}" stroke="#a97c1e" stroke-width="1"/>
      <circle cx="148.5" cy="116.5" r="1.4" fill="#fff"/>`;
  }

  function lysa(expr = 'neutral') {
    const h = uid('lh'), c = uid('lc'), t = uid('lt'), gd = uid('lgd');
    const skin = '#8a5a45', shade = '#69412f', line = '#9d96bd';
    const hd = head({
      expr, eyeH: 23, iris: ['#9fd8cf', '#356a6c', '#effffc'], skin, shade,
      lash: '#12070c', lashW: 5.5, wing: true, shadow: '#6a3a5c',
      lips: '#d9617f', mouthCol: '#5a1a2e', blush: '#c4566a', softBlush: true,
      brow: '#eeecf6', browW: 2.6,
    });
    return svg('0 0 300 360', `
      <defs>${lin(h, [[0, '#ffffff'], [0.55, '#eeeaf7'], [1, '#c9c2e2']])}${lin(c, [[0, '#2a3166'], [1, '#10132e']])}
        ${lin(t, [[0, '#f3f6ea'], [1, '#b9c9a8']])}${lin(gd, [[0, '#ffe38a'], [1, '#c8902a']])}</defs>
      <path d="M84 130 C64 58 236 58 216 130 C240 210 248 300 234 360 L66 360 C52 300 60 210 84 130Z" fill="url(#${h})" stroke="${line}" stroke-width="1.6"/>
      <path d="M100 180 C96 240 98 300 92 360 M200 180 C204 240 202 300 208 360" stroke="#c9c2e2" stroke-width="2" fill="none"/>
      <path d="M40 360 C50 290 96 262 150 258 C204 262 250 290 260 360Z" fill="url(#${c})"/>
      <path d="M72 360 C78 306 106 280 150 276 C194 280 222 306 228 360Z" fill="url(#${t})"/>
      <path d="M150 284 L150 360 M118 300 C112 320 110 340 110 360 M182 300 C188 320 190 340 190 360" stroke="#c8902a" stroke-width="3" fill="none"/>
      <ellipse cx="84" cy="298" rx="26" ry="14" fill="url(#${gd})" stroke="#8a5a14" stroke-width="2" transform="rotate(-18 84 298)"/>
      <ellipse cx="216" cy="298" rx="26" ry="14" fill="url(#${gd})" stroke="#8a5a14" stroke-width="2" transform="rotate(18 216 298)"/>
      <path d="M64 300 Q84 290 104 296 M196 296 Q216 290 236 300" stroke="#fff3c4" stroke-width="1.5" fill="none" opacity=".8"/>
      ${elfEars(skin, shade, '#4a2a1e')}
      <path d="M36 112 l-5 7 M264 112 l5 7" stroke="#f0c75a" stroke-width="4" stroke-linecap="round"/>
      ${hd.under}
      <path d="M120 228 L120 268 Q150 282 180 268 L180 228 Q150 244 120 228Z" fill="url(#${t})" stroke="#c8902a" stroke-width="2.5"/>
      <path d="M124 260 Q150 272 176 260" stroke="#c8902a" stroke-width="2" fill="none"/>
      <path d="M140 274 L160 274 L156 290 L150 296 L144 290Z" fill="url(#${gd})" stroke="#8a5a14" stroke-width="1.5"/>
      <circle cx="150" cy="282" r="4" fill="#5ee0d6"/>
      <path d="M86 128 C76 192 82 244 98 300 C98 256 100 206 100 150Z" fill="url(#${h})" stroke="${line}" stroke-width="1.4"/>
      <path d="M214 128 C224 192 218 244 202 300 C202 256 200 206 200 150Z" fill="url(#${h})" stroke="${line}" stroke-width="1.4"/>
      <path d="M92 160 C88 200 90 240 96 280 M208 160 C212 200 210 240 204 280" stroke="#c9c2e2" stroke-width="1.4" fill="none"/>
      <path d="M86 152 C72 66 228 66 214 152 C206 116 180 96 150 94 C120 96 94 116 86 152Z" fill="url(#${h})" stroke="${line}" stroke-width="1.6"/>
      <path d="M150 92 C130 98 110 114 100 142 C112 126 124 116 138 110 C132 120 128 130 127 142 C134 126 142 112 150 104Z" fill="url(#${h})" stroke="${line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M150 92 C170 98 190 114 200 142 C188 126 176 116 162 110 C168 120 172 130 173 142 C166 126 158 112 150 104Z" fill="url(#${h})" stroke="${line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M150 102 C148 118 150 134 147 150 C152 138 153 120 152 104Z" fill="url(#${h})" stroke="${line}" stroke-width="1.2"/>
      <path d="M150 76 L150 96" stroke="${line}" stroke-width="1.6"/>
      <path d="M118 84 Q150 74 182 84" stroke="#c9c2e2" stroke-width="2" fill="none"/>
      <path d="M92 128 Q150 104 208 128" stroke="#8a5a14" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M92 128 Q150 104 208 128" stroke="#f0c75a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M142 112 L158 112 L155 120 L145 120Z" fill="url(#${gd})" stroke="#8a5a14" stroke-width="1.3"/>
      <path d="M150 120 L150 124" stroke="#c8902a" stroke-width="1.5"/>
      <path d="M150 124 C155 130 155 137 150 140 C145 137 145 130 150 124Z" fill="#5ee0d6" stroke="#c8902a" stroke-width="1.5"/>
      <circle cx="148.5" cy="131" r="1.3" fill="#fff"/>
      ${hd.brows}
      ${sparkle(226, 100, 6)}`, 'char lysa');
  }

  function grandma(expr = 'smirk') {
    const h = uid('gh'), sh = uid('gs'), gem = uid('gg');
    const skin = '#7f5240', shade = '#5f3a2b', line = '#8d91ab';
    const hd = head({ expr, mouthExpr: expr === 'neutral' ? 'smirk' : expr, narrow: true, iris: ['#c9b6ff', '#4a3080', '#f3ecff'], skin, shade, brow: '#e4e5f0', browW: 3.5, lash: '#140a0e', blush: '#b44f62', mouthCol: '#33121c' });
    return svg('0 0 300 360', `
      <defs>${lin(h, [[0, '#f4f5fb'], [1, '#a7abc4']])}${lin(sh, [[0, '#8a4fb0'], [1, '#3d1f59']])}${lin(gem, [[0, '#ff9ad5'], [1, '#7a2cff']], 1, 1)}</defs>
      <circle cx="150" cy="70" r="32" fill="url(#${h})" stroke="${line}" stroke-width="1.5"/>
      <path d="M132 46 L178 98" stroke="#c9a24a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="132" cy="46" r="5" fill="#ff7fb5"/>
      <path d="M86 140 C70 70 230 70 214 140 C222 180 216 210 204 226 L96 226 C84 210 78 180 86 140Z" fill="url(#${h})" stroke="${line}" stroke-width="1.5"/>
      <path d="M44 360 C54 292 96 262 150 258 C204 262 246 292 256 360Z" fill="url(#${sh})"/>
      <path d="M60 360 C70 320 90 300 108 290 L120 360Z M240 360 C230 320 210 300 192 290 L180 360Z" fill="#2b1840" opacity=".45"/>
      ${elfEars(skin, shade, '#3e2219')}
      <path d="M22 120 l-6 3 M278 120 l6 3" stroke="#f0c75a" stroke-width="4" stroke-linecap="round"/>
      ${hd.under}
      <path d="M116 236 Q150 262 184 236 L192 262 Q150 292 108 262Z" fill="#2a2238"/>
      <path d="M120 262 Q150 280 180 262" stroke="#4a3d60" stroke-width="2" fill="none"/>
      <path d="M100 172 l-8 -3 M100 178 l-8 2 M200 172 l8 -3 M200 178 l8 2 M132 204 q-4 6 -2 12 M168 204 q4 6 2 12" stroke="#4e2e22" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <path d="M88 146 C82 76 218 76 212 146 C204 112 182 98 150 104 C118 98 96 112 88 146Z" fill="url(#${h})" stroke="${line}" stroke-width="1.5"/>
      <path d="M112 100 Q132 92 150 104 M188 100 Q168 92 150 104" stroke="#8d91ab" stroke-width="1.6" fill="none"/>
      ${circlet('#ff7fb5')}
      ${hd.brows}
      <circle cx="124" cy="167" r="21" fill="#dff3ff" fill-opacity=".14" stroke="#c9a24a" stroke-width="2.6"/>
      <circle cx="176" cy="167" r="21" fill="#dff3ff" fill-opacity=".14" stroke="#c9a24a" stroke-width="2.6"/>
      <path d="M145 165 Q150 160 155 165" stroke="#c9a24a" stroke-width="2.6" fill="none"/>
      <path d="M112 158 l8 -6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      <path d="M164 158 l8 -6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      <g transform="translate(232 300) rotate(12)">
        <polygon points="0,-26 18,-6 0,26 -18,-6" fill="url(#${gem})" stroke="#fff" stroke-width="2"/>
        <path d="M-18 -6 L18 -6 M0 -26 L-6 -6 L0 26 M0 -26 L6 -6" stroke="#fff" stroke-width="1" opacity=".6" fill="none"/>
      </g>
      ${sparkle(258, 276, 7)}${sparkle(214, 330, 5)}`, 'char grandma');
  }

  function minotaur(expr = 'angry') {
    const f = uid('mf'), hn = uid('mh'), bd = uid('mb'), g = uid('mg');
    const hurt = expr === 'hurt';
    const back = (sd) => {   // horn and ear, drawn behind the head
      const x = (v) => 150 + sd * v;
      return `<path d="M${x(46)} 100 C${x(80)} 96 ${x(112)} 74 ${x(108)} 30 C${x(126)} 62 ${x(118)} 112 ${x(54)} 126Z" fill="url(#${hn})" stroke="#8a7a5a" stroke-width="2"/>
        <path d="M${x(72)} 104 l5 -9 M${x(88)} 95 l4 -10 M${x(100)} 80 l3 -10" stroke="#b8a77e" stroke-width="2"/>
        <path d="M${x(48)} 130 L${x(88)} 124 L${x(80)} 142 L${x(50)} 148Z" fill="url(#${f})" stroke="#2a140a" stroke-width="2"/>
        <path d="M${x(54)} 134 L${x(78)} 130 L${x(74)} 139Z" fill="#c98f80"/>`;
    };
    const front = (sd) => {  // eye, brow and nostril steam
      const x = (v) => 150 + sd * v;
      if (hurt) return `<path d="M${x(42)} 138 L${x(16)} 148 L${x(42)} 158" stroke="#1a0a06" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return `<polygon points="${x(44)},138 ${x(14)},148 ${x(18)},158 ${x(42)},152" fill="#ff3b3b" filter="url(#${g})"/>
        <circle cx="${x(30)}" cy="149" r="2.2" fill="#fff"/>
        <path d="M${x(54)} 128 L${x(12)} 142" stroke="#1e0e07" stroke-width="7" stroke-linecap="round"/>
        <g fill="#fff"><circle cx="${x(52)}" cy="224" r="7" opacity=".7"/><circle cx="${x(68)}" cy="234" r="10" opacity=".55"/><circle cx="${x(88)}" cy="244" r="13" opacity=".4"/></g>`;
    };
    return svg('0 0 300 360', `
      <defs>${lin(f, [[0, '#7a4a32'], [1, '#4a2a1a']])}${lin(hn, [[0, '#fff8e6'], [1, '#cdb88a']])}${lin(bd, [[0, '#6e4130'], [1, '#2e1810']])}${glow(g, 3)}</defs>
      <path d="M12 360 C22 266 90 234 150 234 C210 234 278 266 288 360Z" fill="url(#${bd})"/>
      <path d="M110 300 Q150 320 150 360 M190 300 Q150 320 150 360" stroke="#1e0e07" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M40 290 L270 360" stroke="#4a2a14" stroke-width="18"/>
      ${[80, 130, 180, 230].map((x) => `<circle cx="${x}" cy="${(290 + (x - 40) * 0.304).toFixed(0)}" r="4" fill="#d9c27a"/>`).join('')}
      <path d="M16 338 C24 282 66 262 104 268 L100 302 C72 298 44 312 32 344Z" fill="#7d8494" stroke="#3e434d" stroke-width="3"/>
      <path d="M40 300 L30 278 L52 292Z M66 284 L62 260 L80 280Z" fill="#c6ccd8" stroke="#3e434d" stroke-width="2"/>
      ${back(-1)}${back(1)}
      <path d="M100 100 C100 66 200 66 200 100 C208 150 198 190 184 216 L116 216 C102 190 92 150 100 100Z" fill="url(#${f})"/>
      <path d="M118 78 L132 108 L140 82 L150 112 L160 82 L168 108 L182 78 Q150 58 118 78Z" fill="#2a160c"/>
      <path d="M102 198 C102 166 198 166 198 198 C198 238 174 252 150 252 C126 252 102 238 102 198Z" fill="#b9876a"/>
      <ellipse cx="130" cy="206" rx="9" ry="6" fill="#2a120a"/><ellipse cx="170" cy="206" rx="9" ry="6" fill="#2a120a"/>
      <circle cx="150" cy="224" r="13" fill="none" stroke="#a97c1e" stroke-width="7"/>
      <circle cx="150" cy="224" r="13" fill="none" stroke="#f2c65b" stroke-width="4"/>
      <path d="M122 242 Q150 ${hurt ? 236 : 250} 178 242" stroke="#2a120a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${front(-1)}${front(1)}
      ${hurt ? '' : `<path d="M58 70 l14 12 M48 92 l18 4 M242 70 l-14 12 M252 92 l-18 4" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round"/>`}`, 'char minotaur');
  }

  function lamia(expr = 'smirk') {
    const h = uid('lmh'), sc = uid('lms'), top = uid('lmt');
    const skin = '#f1dccb', shade = '#d4ad98';
    const hd = head({ expr, slit: true, eyeH: 24, iris: ['#ffd34d', '#8a5a00', '#fff6c4'], skin, shade, lash: '#12261f', brow: '#1d5a4c' });
    let scales = '';
    for (let x = 14; x < 300; x += 22) scales += `<path d="M${x} ${344 - Math.sin(x / 40) * 10} q11 -10 22 0" stroke="#1f6b45" stroke-width="2" fill="none" opacity=".7"/>`;
    return svg('0 0 300 360', `
      <defs>${lin(h, [[0, '#3fc4a3'], [1, '#125454']])}${lin(sc, [[0, '#4cc27a'], [1, '#1d6b45']])}${lin(top, [[0, '#6b3a9a'], [1, '#341a52']])}</defs>
      <path d="M84 130 C60 56 240 56 216 130 C246 190 226 232 250 270 C228 282 246 320 228 352 L72 352 C54 320 72 282 50 270 C74 232 54 190 84 130Z" fill="url(#${h})"/>
      <path d="M262 334 C304 292 298 214 256 204 C232 200 226 226 244 234" stroke="url(#${sc})" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M244 234 C236 236 232 232 236 226" stroke="#1d6b45" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M58 360 C64 302 102 266 150 262 C198 266 236 302 242 360Z" fill="${skin}"/>
      <path d="M80 360 C86 320 108 300 150 300 C192 300 214 320 220 360Z" fill="url(#${top})"/>
      <path d="M86 340 Q150 316 214 340" stroke="#f2c65b" stroke-width="3" fill="none"/>
      <path d="M110 268 Q150 296 190 268" stroke="#f2c65b" stroke-width="4" fill="none"/>
      <polygon points="150,286 160,296 150,310 140,296" fill="#4cc27a" stroke="#f2c65b" stroke-width="2.5"/>
      ${hd.under}
      <path d="M90 128 C70 190 92 236 76 290 C96 260 104 214 110 150Z M210 128 C230 190 208 236 224 290 C204 260 196 214 190 150Z" fill="url(#${h})"/>
      <path d="M86 150 C72 66 228 66 214 150 C206 130 196 118 182 112 C186 128 180 142 168 150 C170 132 162 116 150 108 C138 116 130 132 132 150 C120 142 114 128 118 112 C104 118 94 130 86 150Z" fill="url(#${h})"/>
      <path d="M90 122 Q150 100 210 122" stroke="#f2c65b" stroke-width="4" fill="none"/>
      <path d="M150 92 C162 92 166 104 150 116 C134 104 138 92 150 92Z" fill="#f2c65b" stroke="#a97c1e" stroke-width="1.5"/>
      <circle cx="145" cy="100" r="2" fill="#e0245e"/><circle cx="155" cy="100" r="2" fill="#e0245e"/>
      ${hd.brows}
      <path d="M0 360 C6 322 56 302 106 316 C148 328 162 352 204 344 C244 336 270 312 300 320 L300 360Z" fill="url(#${sc})"/>
      <path d="M0 360 C20 340 60 330 100 338 C140 346 170 360 200 356 C240 350 270 336 300 340 L300 360Z" fill="#d9e8a8" opacity=".85"/>
      ${scales}
      ${sparkle(46, 120, 6, '#b8ffe0')}${sparkle(256, 160, 5, '#b8ffe0')}`, 'char lamia');
  }

  function griffin(expr = 'angry') {
    const w = uid('gw'), hd = uid('gh'), bk = uid('gb'), bd = uid('gbd');
    const hurt = expr === 'hurt';
    const wing = (sd) => {
      const x = (v) => 150 + sd * v;
      let s = `<path d="M${x(40)} 250 C${x(80)} 190 ${x(120)} 120 ${x(150)} 40 C${x(150)} 90 ${x(146)} 110 ${x(140)} 120 C${x(152)} 130 ${x(150)} 150 ${x(140)} 166 C${x(150)} 176 ${x(146)} 196 ${x(134)} 210 C${x(140)} 222 ${x(132)} 240 ${x(118)} 250Z" fill="url(#${w})" stroke="#6b4a1e" stroke-width="2"/>`;
      for (const [a, b] of [[118, 132], [116, 170], [106, 206]]) s += `<path d="M${x(a - 46)} ${b + 56} Q${x(a - 14)} ${b + 20} ${x(a + 8)} ${b}" stroke="#8a6a2e" stroke-width="2" fill="none"/>`;
      return s;
    };
    const eye = (sd) => {
      const x = (v) => 150 + sd * v;
      return hurt
        ? `<path d="M${x(46)} 140 L${x(22)} 150 L${x(46)} 160" stroke="#2a1508" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M${x(50)} 150 Q${x(34)} 136 ${x(18)} 148 Q${x(34)} 162 ${x(50)} 150Z" fill="#ffb320" stroke="#2a1508" stroke-width="3"/>
           <circle cx="${x(33)}" cy="149" r="5" fill="#1b1020"/><circle cx="${x(31)}" cy="146" r="2" fill="#fff"/>
           <path d="M${x(60)} 128 Q${x(36)} 128 ${x(12)} 144" stroke="#5a3a14" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    };
    let ruff = '';
    for (let x = 80; x <= 220; x += 20) ruff += `<path d="M${x - 14} 250 Q${x} 290 ${x + 14} 250Z" fill="#fff8ec" stroke="#d9c7a0" stroke-width="1.5"/>`;
    return svg('0 0 300 360', `
      <defs>${lin(w, [[0, '#f2d38a'], [1, '#a8782e']])}${lin(hd, [[0, '#ffffff'], [0.7, '#f6ead2'], [1, '#e0c58f']])}${lin(bk, [[0, '#ffe08a'], [1, '#d99a20']])}${lin(bd, [[0, '#e2ad6c'], [1, '#a8702e']])}</defs>
      ${wing(-1)}${wing(1)}
      <path d="M36 360 C46 290 98 256 150 256 C202 256 254 290 264 360Z" fill="url(#${bd})"/>
      ${ruff}
      <path d="M150 52 L140 80 L128 58 L124 88 L108 72 L112 100 L150 92 L188 100 L192 72 L176 88 L172 58 L160 80Z" fill="#e0c58f" stroke="#b89a5a" stroke-width="1.5"/>
      <path d="M100 150 C96 96 126 80 150 80 C174 80 204 96 200 150 C198 196 184 226 150 248 C116 226 102 196 100 150Z" fill="url(#${hd})" stroke="#d9c7a0" stroke-width="1.5"/>
      ${eye(-1)}${eye(1)}
      <path d="M128 166 C128 146 172 146 172 166 C174 196 164 218 152 236 C150 228 144 222 138 220 C130 204 126 186 128 166Z" fill="url(#${bk})" stroke="#8a5a10" stroke-width="2.5"/>
      <path d="M136 172 q4 -3 8 0 M156 172 q4 -3 8 0" stroke="#8a5a10" stroke-width="2" fill="none"/>
      <path d="M134 198 Q150 ${hurt ? 200 : 208} 168 196" stroke="#8a5a10" stroke-width="2" fill="none"/>
      ${hurt ? '' : `<path d="M56 64 l14 12 M44 88 l18 4 M244 64 l-14 12 M256 88 l-18 4" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round"/>`}
      ${sparkle(30, 200, 6, '#fff6d0')}${sparkle(272, 220, 6, '#fff6d0')}`, 'char griffin');
  }
  function headstealer(expr = 'angry') {
    const h = uid('hh'), g = uid('hg'), w = uid('hw');
    const eyeOp = expr === 'hurt' ? 0.45 : 1;
    return svg('0 0 300 360', `
      <defs>${lin(h, [[0, '#4b3a62'], [1, '#140d1d']])}${glow(g, 3.5)}${rad(w, [[0, '#b46bff', 0.55], [1, '#b46bff', 0]])}</defs>
      <circle cx="150" cy="190" r="150" fill="url(#${w})"/>
      <path d="M38 360 C48 240 70 108 150 58 C230 108 252 240 262 360Z" fill="url(#${h})"/>
      <path d="M150 58 C120 90 100 140 96 196 M150 58 C180 90 200 140 204 196" stroke="#6c5a85" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M92 232 C84 150 110 102 150 96 C190 102 216 150 208 232 Q150 266 92 232Z" fill="#07040b"/>
      <g filter="url(#${g})" opacity="${eyeOp}">
        <polygon points="108,166 144,178 140,188 112,180" fill="#ff3b6b"/>
        <polygon points="192,166 156,178 160,188 188,180" fill="#ff3b6b"/>
        <circle cx="128" cy="179" r="2.5" fill="#fff"/><circle cx="172" cy="179" r="2.5" fill="#fff"/>
      </g>
      <path d="M100 200 Q150 220 200 200 L196 240 Q150 266 104 240Z" fill="#544468"/>
      <path d="M112 214 l6 8 M126 220 l4 8 M150 222 v9 M174 220 l-4 8 M188 214 l-6 8" stroke="#2a2036" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M70 360 L210 268 M230 360 L90 268" stroke="#2a1d35" stroke-width="14"/>
      <path d="M70 360 L210 268 M230 360 L90 268" stroke="#7d5a3a" stroke-width="3" stroke-dasharray="6 10"/>
      <g transform="translate(232 250) rotate(-35)">
        <rect x="-4" y="-6" width="8" height="22" rx="2" fill="#5a3b2a"/><rect x="-12" y="-10" width="24" height="5" rx="2" fill="#c9a24a"/>
        <polygon points="-5,-10 5,-10 0,-58" fill="#d9e2f2" stroke="#8b95ad" stroke-width="1.5"/>
      </g>
      <g transform="translate(68 250) rotate(35)">
        <rect x="-4" y="-6" width="8" height="22" rx="2" fill="#5a3b2a"/><rect x="-12" y="-10" width="24" height="5" rx="2" fill="#c9a24a"/>
        <polygon points="-5,-10 5,-10 0,-58" fill="#d9e2f2" stroke="#8b95ad" stroke-width="1.5"/>
      </g>
      <circle cx="150" cy="308" r="13" fill="#c9a24a" stroke="#7d5a1c" stroke-width="3"/>
      <circle cx="150" cy="308" r="5" fill="#ff3b6b"/>
      ${sparkle(60, 120, 6, '#d6a8ff', 0.8)}${sparkle(244, 90, 8, '#d6a8ff', 0.8)}${sparkle(262, 170, 4, '#d6a8ff', 0.7)}`, 'char headstealer');
  }

  function lion(expr = 'angry') {
    const f = uid('lf'), b = uid('lb');
    const hurt = expr === 'hurt';
    const eye = (cx, sd) => hurt
      ? `<path d="M${cx + sd * 18} ${150} L${cx - sd * 12} ${160} L${cx + sd * 18} ${170}" stroke="#2a1508" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M${cx + sd * 22} 164 Q${cx} 140 ${cx - sd * 20} 158 Q${cx} 178 ${cx + sd * 22} 164Z" fill="#ffd34d" stroke="#2a1508" stroke-width="3.5"/>
         <ellipse cx="${cx}" cy="161" rx="3.8" ry="11" fill="#1b1020"/>
         <circle cx="${cx - 5}" cy="155" r="3" fill="#fff"/>
         <path d="M${cx + sd * 24} 142 L${cx - sd * 20} 151" stroke="#5a3214" stroke-width="5" stroke-linecap="round"/>`;
    const fluff = (sd) => {
      const x = (v) => 150 + sd * v;
      return `<path d="M${x(-78)} 158 L${x(-104)} 176 L${x(-80)} 186 L${x(-108)} 204 L${x(-76)} 210 L${x(-96)} 236 L${x(-60)} 232 L${x(-64)} 252 L${x(-40)} 240Z" fill="url(#${f})"/>`;
    };
    const mouthD = hurt
      ? `<path d="M134 228 Q142 222 150 228 Q158 234 166 228" stroke="#2a1508" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M126 224 Q150 256 174 224 Q150 234 126 224Z" fill="#5a1a24"/>
         <polygon points="132,226 140,228 135,242" fill="#fff"/><polygon points="168,226 160,228 165,242" fill="#fff"/>`;
    return svg('0 0 300 360', `
      <defs>${lin(f, [[0, '#f0bd7c'], [1, '#b8763a']])}${lin(b, [[0, '#d99a58'], [1, '#8b5426']])}</defs>
      <path d="M36 360 C46 286 98 256 150 256 C202 256 254 286 264 360Z" fill="url(#${b})"/>
      <path d="M112 262 L124 300 L136 270 L150 316 L164 270 L176 300 L188 262 Q150 250 112 262Z" fill="#fbeedd"/>
      ${fluff(-1)}${fluff(1)}
      <path d="M84 124 L78 46 L136 90Z" fill="url(#${f})" stroke="#8b5426" stroke-width="3"/>
      <path d="M216 124 L222 46 L164 90Z" fill="url(#${f})" stroke="#8b5426" stroke-width="3"/>
      <path d="M92 110 L89 64 L124 92Z" fill="#f3a6a0"/><path d="M208 110 L211 64 L176 92Z" fill="#f3a6a0"/>
      <path d="M72 170 C72 100 110 72 150 72 C190 72 228 100 228 170 C228 230 196 268 150 272 C104 268 72 230 72 170Z" fill="url(#${f})"/>
      <path d="M150 88 L144 118 L150 126 L156 118Z M124 92 L126 112 L132 96Z M176 92 L174 112 L168 96Z" fill="#7d4a20" opacity=".6"/>
      <path d="M114 206 C112 180 188 180 186 206 C186 238 162 254 150 254 C138 254 114 238 114 206Z" fill="#fbeedd"/>
      ${eye(118, -1)}${eye(182, 1)}
      <path d="M190 130 L176 186" stroke="#e98a8a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <path d="M137 198 L163 198 L150 213Z" fill="#d77a7a"/>
      <path d="M150 213 L150 222" stroke="#2a1508" stroke-width="3"/>
      ${mouthD}
      <circle cx="126" cy="214" r="2" fill="#a0683a"/><circle cx="120" cy="222" r="2" fill="#a0683a"/>
      <circle cx="174" cy="214" r="2" fill="#a0683a"/><circle cx="180" cy="222" r="2" fill="#a0683a"/>
      <path d="M116 214 L64 204 M116 222 L62 226 M184 214 L236 204 M184 222 L238 226" stroke="#fff" stroke-width="2" opacity=".85"/>
      ${hurt ? '' : `<path d="M58 80 l14 10 M54 100 l16 4 M242 80 l-14 10 M246 100 l-16 4" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round"/>`}`, 'char lion');
  }

  function archmage(expr = 'angry') {
    const r = uid('ar'), ht = uid('aht'), bd = uid('abd'), orb = uid('aorb'), g = uid('ag');
    const hd = head({ expr, narrow: true, mouth: false, iris: ['#ffcc4d', '#8a4b00', '#fff3c4'], skin: '#f6d6c0', shade: '#dfb39b', noBlush: expr !== 'happy', brow: '#ffffff', browW: 0 });
    const browY = expr === 'angry' ? [138, 152] : expr === 'happy' ? [140, 140] : [140, 144];
    const brow = (sd) => {
      const o = 150 + sd * 46, i = 150 + sd * 8;
      return `<path d="M${o} ${browY[0]} Q${(o + i) / 2} ${browY[0] - 6} ${i} ${browY[1]} L${i} ${browY[1] + 9} Q${(o + i) / 2} ${browY[0] + 4} ${o + sd * 4} ${browY[0] + 10}Z" fill="#fbfbff" stroke="#b9bdd0" stroke-width="1.5"/>`;
    };
    return svg('0 0 300 360', `
      <defs>${lin(r, [[0, '#d6453a'], [1, '#5e1010']])}${lin(ht, [[0, '#4a2f86'], [1, '#1f123b']])}${lin(bd, [[0, '#ffffff'], [1, '#c6cadb']])}
        ${rad(orb, [[0, '#fff6c9'], [0.4, '#ffb347'], [1, '#ff4d1a', 0]])}${glow(g, 4)}</defs>
      <path d="M86 150 C66 200 70 290 84 340 L216 340 C230 290 234 200 214 150Z" fill="#e9ebf4"/>
      <path d="M36 360 C46 288 96 258 150 256 C204 258 254 288 264 360Z" fill="url(#${r})"/>
      <path d="M110 268 L120 360 M190 268 L180 360" stroke="#f2c65b" stroke-width="5"/>
      <path d="M262 360 L270 112" stroke="#6b4a2b" stroke-width="9" stroke-linecap="round"/>
      <path d="M254 132 Q270 92 286 132" stroke="#c9a24a" stroke-width="4" fill="none"/>
      <circle cx="270" cy="104" r="34" fill="url(#${orb})" filter="url(#${g})"/>
      <circle cx="270" cy="104" r="10" fill="#fff8de"/>
      ${hd.under}
      <path d="M90 140 C78 190 84 230 98 252 L112 196Z M210 140 C222 190 216 230 202 252 L188 196Z" fill="#f4f5fb"/>
      <path d="M96 188 C94 250 116 322 150 352 C184 322 206 250 204 188 C188 212 170 222 150 222 C130 222 112 212 96 188Z" fill="url(#${bd})"/>
      <path d="M122 240 Q130 290 146 330 M178 240 Q170 290 154 330 M150 236 L150 340" stroke="#aeb3c8" stroke-width="1.6" fill="none"/>
      <path d="M116 210 Q150 194 184 210 Q170 226 150 214 Q130 226 116 210Z" fill="#fbfbff" stroke="#b9bdd0" stroke-width="1.5"/>
      ${expr === 'happy' ? '<path d="M140 222 Q150 230 160 222" stroke="#6b2a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>' : ''}
      ${brow(-1)}${brow(1)}
      <path d="M150 112 C110 102 92 112 90 120 L210 120 C208 112 190 102 150 112Z" fill="#f4f5fb"/>
      <ellipse cx="150" cy="114" rx="104" ry="20" fill="url(#${ht})"/>
      <path d="M94 112 C116 82 130 40 168 16 C184 6 204 18 192 32 C178 52 196 86 206 112Z" fill="url(#${ht})"/>
      <path d="M96 104 Q150 90 204 104 L206 114 Q150 100 94 114Z" fill="#f2c65b"/>
      ${star(132, 76, 7, '#ffd85e')}${star(170, 52, 5, '#ffd85e')}${star(184, 86, 6, '#ffd85e')}
      ${sparkle(240, 60, 7, '#ffe6a8')}${sparkle(296, 160, 5, '#ffe6a8')}`, 'char archmage');
  }

  /* ---------------- backgrounds ---------------- */
  const BG = '0 0 800 600';
  const bgSvg = (body) => svg(BG, body, 'bg-art', 'xMidYMid slice');

  function starfield(R, count, h, op = 1) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const x = R() * 800, y = R() * h, r = R() * 1.8 + 0.4;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(op * (0.4 + R() * 0.6)).toFixed(2)}"/>`;
    }
    return s;
  }

  function cloud(x, y, s, fill, op = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${op}">
      <ellipse cx="0" cy="0" rx="60" ry="22"/><ellipse cx="-34" cy="-8" rx="30" ry="22"/><ellipse cx="20" cy="-18" rx="36" ry="28"/><ellipse cx="52" cy="-4" rx="26" ry="18"/></g>`;
  }

  function city() {
    const R = rng(7), sky = uid('cs'), sun = uid('cn');
    let far = '', near = '', win = '';
    for (let x = -20; x < 820;) {
      const w = 40 + R() * 50, h = 120 + R() * 140;
      far += `<rect x="${x}" y="${470 - h}" width="${w}" height="${h + 140}" fill="#7a4a9e"/>`;
      if (R() > 0.5) far += `<polygon points="${x - 4},${470 - h} ${x + w / 2},${470 - h - 40} ${x + w + 4},${470 - h}" fill="#7a4a9e"/>`;
      x += w + 4;
    }
    for (let x = -10; x < 820;) {
      const w = 60 + R() * 70, h = 80 + R() * 110, top = 560 - h;
      near += `<rect x="${x}" y="${top}" width="${w}" height="${h + 60}" fill="#3a2257"/>
        <polygon points="${x - 8},${top} ${x + w / 2},${top - 34 - R() * 20} ${x + w + 8},${top}" fill="#2a1842"/>`;
      for (let wy = top + 16; wy < 580; wy += 26)
        for (let wx = x + 12; wx < x + w - 14; wx += 22)
          if (R() > 0.35) win += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="10" height="13" rx="2" fill="#ffd98a" opacity="${(0.6 + R() * 0.4).toFixed(2)}"/>`;
      x += w + 10;
    }
    return bgSvg(`<defs>${lin(sky, [[0, '#2a1b5c'], [0.5, '#ff7eb3'], [1, '#ffcf96']])}${rad(sun, [[0, '#fff1c7'], [1, '#ffb38a', 0]])}</defs>
      <rect width="800" height="600" fill="url(#${sky})"/>
      ${starfield(R, 40, 180, 0.8)}
      <circle cx="560" cy="380" r="220" fill="url(#${sun})"/><circle cx="560" cy="380" r="80" fill="#fff0cf"/>
      ${cloud(140, 150, 1.4, '#ffb3d1', 0.8)}${cloud(620, 110, 1.1, '#ffc6dd', 0.7)}${cloud(400, 240, 0.9, '#ffd0b0', 0.6)}
      <path d="M220 330 L220 230 L240 200 L260 230 L260 330Z M320 330 L320 180 L345 130 L370 180 L370 330Z" fill="#8f5ab3"/>
      ${far}${near}${win}
      <rect y="560" width="800" height="40" fill="#1e1030"/>`);
  }

  function arena(tint = '') {
    const R = rng(21), sky = uid('as'), sand = uid('asd'), wall = uid('aw');
    let arches = '', crowd = '', banners = '';
    for (let x = -20; x < 820; x += 70) {
      arches += `<path d="M${x} 330 L${x} 290 Q${x + 30} 258 ${x + 60} 290 L${x + 60} 330Z" fill="#6a4a73"/>`;
    }
    const cols = ['#ff7fb5', '#7fd3ff', '#ffd85e', '#a98bff', '#8ef0c0', '#ff9b6b', '#ffffff'];
    for (let row = 0; row < 4; row++)
      for (let x = 0; x < 800; x += 13) {
        const y = 175 + row * 18 + (R() * 4);
        crowd += `<circle cx="${(x + R() * 6).toFixed(0)}" cy="${y.toFixed(0)}" r="${(5 + R() * 2).toFixed(1)}" fill="${cols[Math.floor(R() * cols.length)]}" opacity=".85"/>`;
      }
    for (const x of [60, 250, 550, 740]) {
      banners += `<path d="M${x} 60 L${x} 175" stroke="#5a3b2a" stroke-width="4"/>
        <path d="M${x} 64 L${x + 40} 70 L${x + 34} 92 L${x + 40} 114 L${x} 108Z" fill="${x < 400 ? '#ff5d8f' : '#5db7ff'}"/>
        ${star(x + 18, 88, 7, '#fff')}`;
    }
    return bgSvg(`<defs>${lin(sky, [[0, '#7fc8ff'], [1, '#e8f6ff']])}${lin(sand, [[0, '#f6dfb0'], [1, '#d9b47a']])}${lin(wall, [[0, '#a88bb8'], [1, '#7a5f8c']])}</defs>
      <rect width="800" height="600" fill="url(#${sky})"/>
      ${cloud(120, 70, 1.2, '#fff', 0.95)}${cloud(470, 50, 0.9, '#fff', 0.9)}${cloud(700, 90, 1.1, '#fff', 0.85)}
      ${banners}
      <rect y="160" width="800" height="90" fill="#5d4470"/>
      ${crowd}
      <rect y="246" width="800" height="90" fill="url(#${wall})"/>
      <rect y="246" width="800" height="8" fill="#f2c65b"/>
      ${arches}
      <rect y="330" width="800" height="270" fill="url(#${sand})"/>
      <ellipse cx="400" cy="470" rx="330" ry="90" fill="none" stroke="#c99a5e" stroke-width="5" opacity=".6"/>
      <ellipse cx="400" cy="470" rx="160" ry="42" fill="none" stroke="#c99a5e" stroke-width="3" opacity=".5"/>
      ${tint ? `<rect width="800" height="600" fill="${tint}"/>` : ''}`);
  }

  function countryside() {
    const R = rng(99), sky = uid('ks'), h1 = uid('kh');
    let flowers = '', flies = '';
    for (let i = 0; i < 70; i++) {
      flowers += `<circle cx="${(R() * 800).toFixed(0)}" cy="${(470 + R() * 130).toFixed(0)}" r="${(2 + R() * 3).toFixed(1)}" fill="${['#fff', '#ffd85e', '#ff9ccf', '#c9b6ff'][i % 4]}"/>`;
    }
    for (let i = 0; i < 22; i++) flies += sparkle((R() * 800).toFixed(0), (260 + R() * 260).toFixed(0), 3 + R() * 4, '#fff6b0', 0.85);
    return bgSvg(`<defs>${lin(sky, [[0, '#6b5bd6'], [0.45, '#ff9ec4'], [1, '#ffd59e']])}${lin(h1, [[0, '#8fd47a'], [1, '#4c9a5a']])}</defs>
      <rect width="800" height="600" fill="url(#${sky})"/>
      ${starfield(R, 25, 140, 0.7)}
      <circle cx="210" cy="330" r="70" fill="#fff0cf" opacity=".95"/>
      ${cloud(560, 130, 1.3, '#ffd0e4', 0.8)}${cloud(260, 180, 0.9, '#ffe2cf', 0.7)}
      <path d="M0 380 Q200 300 420 370 T800 350 L800 600 L0 600Z" fill="#9b8fd9" opacity=".8"/>
      <path d="M0 430 Q240 360 480 420 T800 400 L800 600 L0 600Z" fill="url(#${h1})"/>
      <g transform="translate(540 330)">
        <rect x="0" y="40" width="130" height="90" fill="#fff4e0"/>
        <polygon points="-16,44 65,-14 146,44" fill="#d9605a"/>
        <rect x="96" y="-8" width="16" height="34" fill="#8a5a44"/>
        <rect x="52" y="80" width="28" height="50" rx="4" fill="#8a5a44"/>
        <rect x="16" y="64" width="24" height="22" fill="#ffd98a"/><rect x="92" y="64" width="24" height="22" fill="#ffd98a"/>
        <circle cx="104" cy="-22" r="10" fill="#fff" opacity=".6"/><circle cx="112" cy="-42" r="14" fill="#fff" opacity=".45"/><circle cx="124" cy="-68" r="18" fill="#fff" opacity=".3"/>
      </g>
      <path d="M0 500 Q260 450 520 500 T800 490 L800 600 L0 600Z" fill="#5fb06a"/>
      <path d="M40 520 L760 500" stroke="#a0704a" stroke-width="5"/>
      ${[60, 160, 260, 360, 460, 560, 660, 740].map((x) => `<rect x="${x}" y="${500 - (x / 800) * 20}" width="8" height="40" fill="#a0704a"/>`).join('')}
      ${flowers}${flies}`);
  }

  function night() {
    const R = rng(3), sky = uid('ns'), m = uid('nm');
    return bgSvg(`<defs>${lin(sky, [[0, '#0b0926'], [0.55, '#3b1d6e'], [1, '#c45ab3']])}${rad(m, [[0, '#fff7e0'], [0.6, '#ffe7b0', 0.5], [1, '#ffe7b0', 0]])}</defs>
      <rect width="800" height="600" fill="url(#${sky})"/>
      ${starfield(R, 160, 420)}
      <circle cx="610" cy="140" r="160" fill="url(#${m})"/>
      <circle cx="610" cy="140" r="62" fill="#fff6dc"/>
      <circle cx="590" cy="124" r="10" fill="#f1e2bb"/><circle cx="628" cy="160" r="7" fill="#f1e2bb"/>
      <path d="M90 60 L230 120" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      ${sparkle(90, 60, 8)}${sparkle(320, 90, 6, '#fff', 0.8)}${sparkle(470, 230, 5, '#fff', 0.7)}
      <path d="M0 470 Q120 420 260 450 T520 440 T800 430 L800 600 L0 600Z" fill="#2a1546"/>
      <path d="M210 470 L210 360 Q400 300 590 360 L590 470Z" fill="#1c0e33"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${226 + i * 46} 470 L${226 + i * 46} 420 Q${244 + i * 46} 396 ${262 + i * 46} 420 L${262 + i * 46} 470Z" fill="#ffd98a" opacity=".22"/>`).join('')}
      <path d="M0 520 Q200 480 400 510 T800 500 L800 600 L0 600Z" fill="#150a28"/>`);
  }

  function speedlines(color = '#fff', seed = 5) {
    const R = rng(seed);
    let s = '';
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + R() * 0.05, w = 0.01 + R() * 0.02, r0 = 160 + R() * 120;
      const p = (ang, r) => `${(400 + Math.cos(ang) * r).toFixed(0)},${(300 + Math.sin(ang) * r).toFixed(0)}`;
      s += `<polygon points="${p(a - w, 900)} ${p(a + w, 900)} ${p(a, r0)}" fill="${color}"/>`;
    }
    return svg(BG, s, 'speedlines', 'xMidYMid slice');
  }

  /* ---------------- icons ---------------- */
  const icons = {
    frost: `<svg viewBox="-24 -24 48 48"><g stroke="#e9fbff" stroke-width="3.5" stroke-linecap="round">${[0, 60, 120].map((a) => `<g transform="rotate(${a})"><path d="M0 -20 V20"/><path d="M-6 -15 L0 -10 L6 -15 M-6 15 L0 10 L6 15"/></g>`).join('')}</g><circle r="4" fill="#fff"/></svg>`,
    fire: `<svg viewBox="-24 -24 48 48"><path d="M0 -22 C6 -10 18 -4 16 8 C14 18 6 22 0 22 C-8 22 -16 16 -16 6 C-16 -4 -8 -6 -6 -14 C-2 -8 0 -10 0 -22Z" fill="#ffe08a"/><path d="M0 -4 C4 2 9 6 7 12 C5 18 -5 18 -7 12 C-8 6 -2 4 0 -4Z" fill="#fff"/></svg>`,
    heal: `<svg viewBox="-24 -24 48 48"><path d="M0 18 C-26 2 -18 -20 0 -8 C18 -20 26 2 0 18Z" fill="#eafff4"/><path d="M0 -6 V8 M-7 1 H7" stroke="#2bb673" stroke-width="4" stroke-linecap="round"/></svg>`,
    barrier: `<svg viewBox="-24 -24 48 48"><path d="M0 -21 L18 -13 C18 6 10 16 0 21 C-10 16 -18 6 -18 -13Z" fill="#fde9ff" /><path d="M0 -13 L11 -8 C11 4 6 10 0 13Z" fill="#e58cff"/></svg>`,
  };

  return { lysa, grandma, headstealer, lion, minotaur, lamia, griffin, archmage, city, arena, countryside, night, speedlines, icons, sparkle };
})();
