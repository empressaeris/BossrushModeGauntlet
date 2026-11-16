/* Havenwood Gauntlet — scenes, story, and real-time battle logic. */
(() => {
  const stage = document.getElementById('stage');
  const sceneRoot = document.getElementById('scene');
  const muteBtn = document.getElementById('mute');

  /* ---------------- data ---------------- */
  const CAST = {
    lysa: { name: 'Lysa', art: Art.lysa },
    grandma: { name: 'Grandmama', art: Art.grandma },
    headstealer: { name: 'The Headstealer', art: Art.headstealer },
    lion: { name: 'Mountain Lion', art: Art.lion },
    archmage: { name: 'The Archmage', art: Art.archmage },
  };

  const bgCache = {};
  const BGS = { city: Art.city, arena: Art.arena, countryside: Art.countryside, night: Art.night };
  const bg = (k) => (bgCache[k] ||= BGS[k]());

  const PLAYER = { maxHP: 100, maxMP: 100, mpRegen: 13 /* per second */ };

  const SPELLS = [
    { id: 'frost', name: 'Frostbolt', key: '1', cost: 20, cd: 900, dmg: 12, element: 'ice',
      desc: 'Deals 12 ice damage.' },
    { id: 'fire', name: 'Fireball', key: '2', cost: 20, cd: 900, dmg: 12, element: 'fire',
      desc: 'Deals 12 fire damage.' },
    { id: 'heal', name: 'Heal', key: '3', cost: 30, cd: 4000, amount: 25,
      desc: 'Restores 25 HP. 4s cooldown.' },
    { id: 'barrier', name: 'Barrier', key: '4', cost: 25, cd: 7000, duration: 5000, reduce: 0.6,
      desc: 'Blocks 60% of damage for 5s. 7s cooldown.' },
  ];

  const BOSSES = [
    {
      id: 'headstealer', title: 'Collector of Faces', maxHP: 120, weak: null, resist: null,
      interval: 2800, dmg: 9, attacks: ['Dagger Flurry', 'Shadow Step', 'Cutpurse Slash'],
      special: { every: 3, name: 'Pickpocket', charge: 2600, dmg: 5, type: 'drain', steal: 30 },
      intro: "That face... that hair... You smell just like the old thief who robbed me blind.",
      winQuote: "I should've KNOWN you were strong. You look just like her...",
      loseQuote: "Finally, I beat that little thief! Oh wait... she didn't use magic. Are you someone else?",
    },
    {
      id: 'lion', title: 'Terror of the Ridge', maxHP: 200, weak: 'fire', resist: 'ice',
      interval: 2400, dmg: 11, attacks: ['Pounce', 'Raking Claws', 'Savage Bite'],
      enrage: { below: 0.5, interval: 1700 },
      intro: '*A low growl rumbles through the arena. The crowd goes very, very quiet.*',
      winQuote: '*cries*',
      loseQuote: '*growls triumphantly*',
    },
    {
      id: 'archmage', title: 'Master of the Arena', maxHP: 280, weak: 'ice', resist: 'fire',
      interval: 3000, dmg: 12, attacks: ['Flame Lance', 'Ember Rain', 'Searing Ray'],
      special: { every: 3, name: 'Inferno Cataclysm', charge: 4500, dmg: 38, type: 'nuke' },
      intro: "So you're the one who made it this far. Let's see whose magic runs in your veins.",
      winQuote: "I'm glad you've won. When you see your grandmother, tell her I'm proud of you.",
      loseQuote: "You should be so much stronger, Lysa! I knew I should've trained you, but your grandmother was greedy!",
    },
  ];

  const STORY = [
    { bg: 'city', text: 'In the city of Havenwood lived Lysa and her grandmother, the latter being a well-renowned thief of ill repute.' },
    { bg: 'city', who: 'grandma', expr: 'smirk', side: 'right', text: 'Ohoho~ The relic was simply sitting there, dear. It practically asked to come home with me.' },
    { bg: 'city', text: "Unfortunately, Grandmama had stolen a rather valuable relic from the city's richest family. The fine was substantial, and the jail time even more so." },
    { bg: 'arena', who: 'lysa', expr: 'determined', side: 'left', text: "Then I'll enter the Havenwood Gauntlet. The grand prize will pay her fine, and leave our family wealthy for generations to come!" },
    { bg: 'arena', text: 'Three champions stand between Lysa and the prize. One after another, with no turning back.' },
  ];

  const ENDING = [
    { bg: 'countryside', text: "With the grand prize, Lysa paid every last coin of her grandmother's fine." },
    { bg: 'countryside', who: 'archmage', expr: 'happy', side: 'right', text: "Her nerve and my talent, all in one girl. I'd be honored to teach you properly, Lysa." },
    { bg: 'countryside', who: 'grandma', expr: 'smile', side: 'right', text: "Don't get sentimental, you old fool. ...Though I suppose you can stay for supper." },
    { bg: 'countryside', who: 'lysa', expr: 'happy', side: 'left', text: "So the Archmage is my GRANDPA?! ...This is going to take some getting used to." },
    { bg: 'countryside', text: 'Lysa moved her entire family, the Archmage included, to the countryside, and began training with her newly discovered grandfather.' },
  ];

  /* ---------------- helpers ---------------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  let sceneKeys = null;
  let stopTyping = () => {};

  let run = null; // stats for the current playthrough
  const newRun = () => ({ start: performance.now(), casts: 0, damage: 0, healed: 0, retries: 0, crits: 0 });

  function fit() {
    const s = Math.min(window.innerWidth / 800, window.innerHeight / 600);
    document.documentElement.style.setProperty('--scale', s);
  }
  window.addEventListener('resize', fit);
  fit();

  function setScene(html, cls) {
    stopBattle();
    timers.forEach(clearTimeout); timers = [];
    stopTyping(); stopTyping = () => {};
    sceneKeys = null;
    sceneRoot.className = `scene ${cls}`;
    sceneRoot.innerHTML = html;
    sceneRoot.onclick = null;
    return sceneRoot;
  }

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }
    if (sceneKeys) sceneKeys(e);
  });

  function toggleMute() {
    Sound.init();
    Sound.setMuted(!Sound.isMuted());
    updateMute();
  }
  function updateMute() {
    muteBtn.classList.toggle('off', Sound.isMuted());
    muteBtn.setAttribute('aria-label', Sound.isMuted() ? 'Unmute sound' : 'Mute sound');
    muteBtn.title = Sound.isMuted() ? 'Sound off (M)' : 'Sound on (M)';
  }
  muteBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });
  updateMute();

  // any interaction unlocks audio
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => Sound.init(), { capture: true }));

  const isAdvanceKey = (e) => e.key === ' ' || e.key === 'Enter';

  /* ---------------- title ---------------- */
  function title() {
    Sound.music('story');
    const el = setScene(`
      <div class="bg">${bg('night')}</div>
      <div class="title-char">${Art.lysa('determined')}</div>
      <div class="title-block">
        <div class="kicker">✦ Boss Rush Mode ✦</div>
        <h1 class="logo">Havenwood<span>Gauntlet</span></h1>
        <p class="tagline">Three champions. Four spells. One grandmother's freedom.</p>
        <button class="btn primary" data-act="start">Start Game</button>
        <p class="hint">Click, tap, or press Enter</p>
      </div>`, 'title');
    const start = () => { Sound.sfx('click'); run = newRun(); dialogue(STORY, tutorial); };
    el.querySelector('[data-act=start]').addEventListener('click', start);
    sceneKeys = (e) => { if (isAdvanceKey(e)) { e.preventDefault(); start(); } };
  }

  /* ---------------- dialogue ---------------- */
  function dialogue(lines, done) {
    Sound.music(lines === ENDING ? 'victory' : 'story');
    const el = setScene(`
      <div class="bg"></div>
      <div class="portrait"></div>
      <div class="dbox">
        <div class="nametag"></div>
        <div class="dtext"></div>
        <div class="dnext">▼</div>
      </div>
      <button class="skip">Skip ▸▸</button>`, 'dialogue');
    const bgEl = el.querySelector('.bg'), portrait = el.querySelector('.portrait');
    const box = el.querySelector('.dbox'), nameEl = el.querySelector('.nametag'), textEl = el.querySelector('.dtext');
    let i = -1, curBg = null, curWho = null, typing = null, full = '';

    const finishTyping = () => { clearInterval(typing); typing = null; textEl.textContent = full; box.classList.add('ready'); };

    function show() {
      const L = lines[i];
      if (L.bg && L.bg !== curBg) { bgEl.innerHTML = bg(L.bg); curBg = L.bg; }
      const key = L.who ? `${L.who}:${L.expr}` : null;
      if (key !== curWho) {
        portrait.className = `portrait ${L.side || 'right'}`;
        portrait.innerHTML = L.who ? CAST[L.who].art(L.expr) : '';
        if (L.who) { void portrait.offsetWidth; portrait.classList.add('in'); }
        curWho = key;
      }
      nameEl.textContent = L.who ? CAST[L.who].name : '';
      nameEl.classList.toggle('hidden', !L.who);
      box.classList.toggle('narrator', !L.who);
      box.classList.toggle('left', L.side === 'left');
      box.classList.remove('ready');
      full = L.text;
      let k = 0;
      textEl.textContent = '';
      clearInterval(typing);
      typing = setInterval(() => {
        k += 1;
        textEl.textContent = full.slice(0, k);
        if (k % 3 === 0) Sound.sfx('blip');
        if (k >= full.length) finishTyping();
      }, 22);
    }
    function advance() {
      if (typing) { finishTyping(); return; }
      i++;
      if (i >= lines.length) { clearInterval(typing); done(); return; }
      show();
    }
    el.onclick = advance;
    el.querySelector('.skip').addEventListener('click', (e) => { e.stopPropagation(); clearInterval(typing); done(); });
    sceneKeys = (e) => {
      if (isAdvanceKey(e)) { e.preventDefault(); advance(); }
      else if (e.key === 'Escape') { clearInterval(typing); done(); }
    };
    // setScene() calls this so the typewriter stops when the scene changes
    stopTyping = () => clearInterval(typing);
    advance();
  }

  /* ---------------- tutorial ---------------- */
  function tutorial() {
    const cards = SPELLS.map((s) => `
      <div class="tcard s-${s.id}">
        <div class="ticon">${Art.icons[s.id]}</div>
        <div><b>${s.name}</b> <kbd>${s.key}</kbd><br><span>${s.desc}</span><br><small>${s.cost} MP</small></div>
      </div>`).join('');
    const el = setScene(`
      <div class="bg dim">${bg('arena')}</div>
      <div class="panel tutorial-panel">
        <h2>Lysa's Spellbook</h2>
        <div class="tgrid">${cards}</div>
        <ul class="tips">
          <li>Enemies attack on a timer. <b>Watch the gauge</b> under them and raise a Barrier before big hits.</li>
          <li>Some foes are <b>weak</b> to fire or ice, and <b>resist</b> the other. Watch the damage numbers!</li>
          <li>MP refills on its own. Press <kbd>1</kbd>–<kbd>4</kbd> to cast, <kbd>P</kbd> to pause, <kbd>M</kbd> to mute.</li>
        </ul>
        <button class="btn primary" data-act="go">Enter the Arena</button>
      </div>`, 'tutorial');
    const go = () => { Sound.sfx('click'); versus(0); };
    el.querySelector('[data-act=go]').addEventListener('click', go);
    sceneKeys = (e) => { if (isAdvanceKey(e)) { e.preventDefault(); go(); } };
  }

  /* ---------------- versus splash ---------------- */
  function versus(i) {
    const b = BOSSES[i], who = CAST[b.id];
    Sound.music('battle');
    Sound.sfx('whoosh');
    const el = setScene(`
      <div class="vs-bg"></div>
      <div class="lines">${Art.speedlines('rgba(255,255,255,.35)', i + 3)}</div>
      <div class="vs-half left"><div class="vs-art">${Art.lysa('determined')}</div><div class="vs-name">Lysa</div></div>
      <div class="vs-half right b-${b.id}"><div class="vs-art">${who.art('angry')}</div><div class="vs-name">${who.name}<small>${b.title}</small></div></div>
      <div class="vs-mark">VS</div>
      <div class="vs-round">Round ${i + 1} / ${BOSSES.length}</div>
      <div class="vs-quote">“${esc(b.intro)}”</div>
      <div class="vs-go">Click or press Enter to fight!</div>`, `versus b-${b.id}`);
    let ready = false;
    later(() => { ready = true; el.classList.add('ready'); }, 700);
    const go = () => { if (!ready) return; Sound.sfx('click'); battle(i); };
    el.onclick = go;
    sceneKeys = (e) => { if (isAdvanceKey(e)) { e.preventDefault(); go(); } };
  }

  /* ---------------- battle ---------------- */
  let B = null;

  function stopBattle() {
    if (B) { cancelAnimationFrame(B.raf); B.over = true; B = null; }
  }

  function battle(i) {
    const boss = BOSSES[i];
    const spellBtns = SPELLS.map((s, k) => `
      <button class="spell s-${s.id}" data-k="${k}">
        <span class="sicon">${Art.icons[s.id]}</span>
        <span class="sname">${s.name}</span>
        <span class="scost">${s.cost} MP</span>
        <kbd>${s.key}</kbd>
        <span class="cd"></span>
      </button>`).join('');
    const el = setScene(`
      <div class="bg">${bg('arena')}</div>
      <div class="boss-hud">
        <div class="boss-label"><span class="round">R${i + 1}</span><span class="bname">${CAST[boss.id].name}</span><span class="tags"></span></div>
        <div class="bar hp boss-hp"><div class="ghost"></div><div class="fill"></div><span class="num"></span></div>
      </div>
      <div class="boss-area">
        <div class="boss-shadow"></div>
        <div class="boss-art"><div class="pose normal">${CAST[boss.id].art('angry')}</div><div class="pose hurt">${CAST[boss.id].art('hurt')}</div></div>
      </div>
      <div class="telegraph"><div class="tg-label"></div><div class="tg-bar"><div class="fill"></div></div></div>
      <div class="log"></div>
      <div class="player">
        <div class="pframe">
          <div class="pose normal">${Art.lysa('determined')}</div>
          <div class="pose hurt">${Art.lysa('hurt')}</div>
          <div class="pose happy">${Art.lysa('happy')}</div>
          <div class="shield"></div>
        </div>
        <div class="pstats">
          <div class="pname">Lysa <span class="status"></span></div>
          <div class="bar hp p-hp"><div class="ghost"></div><div class="fill"></div><span class="num"></span></div>
          <div class="bar mp p-mp"><div class="fill"></div><span class="num"></span></div>
        </div>
      </div>
      <div class="spells">${spellBtns}</div>
      <div class="fx"></div>
      <div class="banner"></div>
      <button class="pause-btn" aria-label="Pause">❚❚</button>
      <div class="pause-overlay hidden">
        <div class="panel"><h2>Paused</h2>
          <button class="btn primary" data-act="resume">Resume</button>
          <button class="btn" data-act="restart">Restart Round</button>
          <button class="btn" data-act="quit">Quit to Title</button>
        </div>
      </div>`, `battle b-${boss.id}`);

    const q = (s) => el.querySelector(s);
    B = {
      i, boss, el, t: 0, lastTs: null, raf: 0, over: false, paused: false,
      hp: boss.maxHP, ghostBoss: 1,
      php: PLAYER.maxHP, ghostP: 1, mp: PLAYER.maxMP,
      cds: {}, barrierUntil: 0, attackCount: 0, enraged: false,
      known: {}, charge: null, poseUntil: { boss: 0, player: 0 },
      dom: {
        bossFill: q('.boss-hp .fill'), bossGhost: q('.boss-hp .ghost'), bossNum: q('.boss-hp .num'),
        tags: q('.tags'), bossArt: q('.boss-art'),
        tgLabel: q('.tg-label'), tgFill: q('.tg-bar .fill'), telegraph: q('.telegraph'),
        pFill: q('.p-hp .fill'), pGhost: q('.p-hp .ghost'), pNum: q('.p-hp .num'),
        mFill: q('.p-mp .fill'), mNum: q('.p-mp .num'),
        status: q('.status'), pframe: q('.pframe'),
        spells: [...el.querySelectorAll('.spell')], fx: q('.fx'), banner: q('.banner'), log: q('.log'),
        pause: q('.pause-overlay'),
      },
    };
    nextCharge(1200);
    B.dom.spells.forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); cast(SPELLS[+btn.dataset.k], btn); }));
    q('.pause-btn').addEventListener('click', () => setPaused(true));
    q('[data-act=resume]').addEventListener('click', () => setPaused(false));
    q('[data-act=restart]').addEventListener('click', () => { run.retries++; battle(i); });
    q('[data-act=quit]').addEventListener('click', title);
    sceneKeys = (e) => {
      if (!B) return;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { setPaused(!B.paused); return; }
      const s = SPELLS.findIndex((sp) => sp.key === e.key);
      if (s >= 0) cast(SPELLS[s], B.dom.spells[s]);
    };
    banner(`Round ${i + 1}<br><span>Fight!</span>`, 'start');
    log(`${CAST[boss.id].name} enters the arena!`);
    render();
    B.raf = requestAnimationFrame(tick);
  }

  function setPaused(p) {
    if (!B || B.over) return;
    B.paused = p;
    B.dom.pause.classList.toggle('hidden', !p);
    Sound.sfx('click');
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && B && !B.over) setPaused(true); });

  function tick(ts) {
    if (!B || B.over) return;
    const dt = B.lastTs == null ? 0 : Math.min(100, ts - B.lastTs);
    B.lastTs = ts;
    if (!B.paused) {
      B.t += dt;
      update(dt);
    }
    if (B && !B.over) { render(); B.raf = requestAnimationFrame(tick); }
  }

  function update(dt) {
    B.mp = Math.min(PLAYER.maxMP, B.mp + (PLAYER.mpRegen * dt) / 1000);
    if (B.charge && B.t >= B.charge.end) bossAttack();
  }

  function nextCharge(extraDelay = 0) {
    const b = B.boss;
    const n = B.attackCount + 1;
    const special = b.special && n % b.special.every === 0;
    let dur, name, dmg, type = 'normal';
    if (special) {
      ({ name, dmg, type } = b.special);
      dur = b.special.charge;
    } else {
      name = b.attacks[Math.floor(Math.random() * b.attacks.length)];
      dmg = b.dmg;
      dur = B.enraged ? b.enrage.interval : b.interval;
    }
    B.charge = { name, dmg, type, special, start: B.t, end: B.t + dur + extraDelay, extra: extraDelay };
    B.dom.telegraph.classList.toggle('special', !!special);
    B.dom.tgLabel.textContent = special ? `⚠ ${name}` : name;
    if (special) {
      Sound.sfx('warn');
      if (type === 'nuke') banner(`${name}!<br><span>Raise a Barrier!</span>`, 'warn');
      else banner(`${name}!<br><span>It's after your MP!</span>`, 'warn');
    }
  }

  function bossAttack() {
    const c = B.charge, b = B.boss;
    B.attackCount++;
    let dmg = Math.round(c.dmg * rand(0.85, 1.15));
    const shielded = B.t < B.barrierUntil;
    if (shielded) dmg = Math.round(dmg * (1 - SPELLS[3].reduce));

    B.dom.bossArt.classList.remove('lunge'); void B.dom.bossArt.offsetWidth; B.dom.bossArt.classList.add('lunge');

    if (c.type === 'drain') {
      const stolen = Math.min(Math.floor(B.mp), b.special.steal);
      B.mp -= stolen;
      popup(150, 470, `-${stolen} MP`, 'mp');
      log(`${CAST[b.id].name} uses ${c.name}! Stole ${stolen} MP!`);
    }

    B.php = Math.max(0, B.php - dmg);
    popup(rand(60, 140), 450, shielded ? `${dmg} BLOCKED` : `-${dmg}`, shielded ? 'blocked' : 'hurt');
    slash(c.type === 'nuke');
    if (c.type === 'nuke') {
      flash('fire'); shake(true); Sound.sfx('bigHit');
    } else {
      shake(false); Sound.sfx(shielded ? 'blocked' : 'hit');
    }
    if (shielded) burst(95, 505, 10, 'shard', 60);
    if (c.type !== 'drain') log(`${CAST[b.id].name} uses ${c.name}! ${shielded ? 'The barrier absorbs most of it. ' : ''}-${dmg} HP`);
    setPose('player', 'hurt', 450);

    if (B.php <= 0) { lose(); return; }
    nextCharge();
  }

  function cast(spell, btn) {
    if (!B || B.over || B.paused) return;
    const b = B;
    if ((b.cds[spell.id] || 0) > b.t) { Sound.sfx('nope'); wiggle(btn); return; }
    if (b.mp < spell.cost) { Sound.sfx('nope'); wiggle(btn); log('Not enough MP!'); return; }
    b.mp -= spell.cost;
    b.cds[spell.id] = b.t + spell.cd;
    run.casts++;
    btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed');

    if (spell.element) {
      Sound.sfx(spell.id);
      const boss = b.boss;
      let mult = boss.weak === spell.element ? 2 : boss.resist === spell.element ? 0.5 : 1;
      const crit = Math.random() < 0.12;
      if (crit) mult *= 1.5;
      const dmg = Math.round(spell.dmg * mult * rand(0.92, 1.08));
      projectile(spell.id, { x: 100, y: 470 }, { x: 400 + rand(-30, 30), y: 210 + rand(-30, 30) }, 320, () => {
        if (B !== b || b.over) return;
        b.hp = Math.max(0, b.hp - dmg);
        run.damage += dmg;
        if (crit) run.crits++;
        burst(400, 210, 16, spell.id === 'frost' ? 'ice' : 'ember', 90);
        const tag = boss.weak === spell.element ? 'WEAK! ' : boss.resist === spell.element ? 'resist ' : '';
        popup(400 + rand(-50, 50), 190, `${crit ? 'CRIT ' : ''}${tag}${dmg}`, `dmg ${tag ? (boss.weak === spell.element ? 'weak' : 'resist') : ''} ${crit ? 'crit' : ''}`);
        if (crit) Sound.sfx('crit');
        if (boss.weak === spell.element) b.known.weak = spell.element;
        else if (boss.resist === spell.element) b.known.resist = spell.element;
        else b.known[`neutral-${spell.element}`] = true;
        renderTags();
        setPose('boss', 'hurt', 300);
        log(`${spell.name} hits for ${dmg}!${tag === 'WEAK! ' ? " It's super effective!" : tag ? ' It resisted...' : ''}`);
        if (b.hp <= 0) win();
      });
    } else if (spell.id === 'heal') {
      Sound.sfx('heal');
      const before = b.php;
      b.php = Math.min(PLAYER.maxHP, b.php + spell.amount);
      run.healed += b.php - before;
      popup(110, 450, `+${Math.round(b.php - before)}`, 'heal');
      burst(95, 510, 14, 'plus', 70);
      setPose('player', 'happy', 600);
      log(`Lysa heals for ${Math.round(b.php - before)} HP!`);
    } else if (spell.id === 'barrier') {
      Sound.sfx('barrier');
      b.barrierUntil = b.t + spell.duration;
      burst(95, 505, 12, 'shard', 70);
      log('A shimmering barrier surrounds Lysa!');
    }
  }

  function renderTags() {
    const k = B.known, tags = [];
    if (k.weak) tags.push(`<span class="tag weak">Weak: ${k.weak === 'fire' ? 'Fire' : 'Ice'}</span>`);
    if (k.resist) tags.push(`<span class="tag resist">Resists: ${k.resist === 'fire' ? 'Fire' : 'Ice'}</span>`);
    if (k['neutral-fire'] && k['neutral-ice']) tags.push('<span class="tag neutral">No weakness</span>');
    B.dom.tags.innerHTML = tags.join('');
  }

  function setPose(who, pose, ms) {
    const target = who === 'boss' ? B.dom.bossArt : B.dom.pframe;
    target.dataset.pose = pose;
    B.poseUntil[who] = B.t + ms;
  }

  function render() {
    const b = B, d = b.dom;
    const bf = b.hp / b.boss.maxHP, pf = b.php / PLAYER.maxHP;
    b.ghostBoss = b.ghostBoss > bf ? b.ghostBoss + (bf - b.ghostBoss) * 0.05 : bf;
    b.ghostP = b.ghostP > pf ? b.ghostP + (pf - b.ghostP) * 0.05 : pf;
    d.bossFill.style.transform = `scaleX(${bf})`;
    d.bossGhost.style.transform = `scaleX(${b.ghostBoss})`;
    d.bossNum.textContent = `${Math.ceil(b.hp)} / ${b.boss.maxHP}`;
    d.pFill.style.transform = `scaleX(${pf})`;
    d.pGhost.style.transform = `scaleX(${b.ghostP})`;
    d.pNum.textContent = `${Math.ceil(b.php)} / ${PLAYER.maxHP}`;
    d.pframe.classList.toggle('low', pf <= 0.3);
    d.mFill.style.transform = `scaleX(${b.mp / PLAYER.maxMP})`;
    d.mNum.textContent = `${Math.floor(b.mp)} / ${PLAYER.maxMP}`;

    if (b.charge) {
      const c = b.charge;
      const p = clamp((b.t - c.start - c.extra) / (c.end - c.start - c.extra), 0, 1);
      d.tgFill.style.transform = `scaleX(${p})`;
      d.telegraph.classList.toggle('imminent', p > 0.8);
    }

    const shield = b.t < b.barrierUntil;
    d.pframe.classList.toggle('shielded', shield);
    d.status.textContent = shield ? `Barrier ${((b.barrierUntil - b.t) / 1000).toFixed(1)}s` : '';

    SPELLS.forEach((s, k) => {
      const btn = d.spells[k];
      const left = Math.max(0, (b.cds[s.id] || 0) - b.t);
      btn.querySelector('.cd').style.transform = `scaleY(${left / s.cd})`;
      btn.classList.toggle('nomp', b.mp < s.cost);
      btn.classList.toggle('cooling', left > 0);
    });

    for (const who of ['boss', 'player']) {
      if (b.poseUntil[who] && b.t > b.poseUntil[who]) {
        (who === 'boss' ? d.bossArt : d.pframe).dataset.pose = '';
        b.poseUntil[who] = 0;
      }
    }

    if (!b.enraged && b.boss.enrage && bf <= b.boss.enrage.below && b.hp > 0) {
      b.enraged = true;
      d.bossArt.classList.add('enraged');
      banner('Enraged!<br><span>Its attacks are faster!</span>', 'warn');
      Sound.sfx('warn');
      log(`${CAST[b.boss.id].name} flies into a rage!`);
    }
  }

  function win() {
    const b = B;
    b.over = true;
    cancelAnimationFrame(b.raf);
    render();
    b.dom.bossArt.dataset.pose = 'hurt';
    b.dom.bossArt.classList.add('ko');
    b.dom.pframe.dataset.pose = 'happy';
    b.dom.telegraph.classList.add('hidden');
    flash('white');
    Sound.sfx('ko');
    banner('K.O.!', 'ko');
    later(() => afterWin(b.i), 2000);
  }

  function lose() {
    const b = B;
    b.over = true;
    cancelAnimationFrame(b.raf);
    render();
    b.dom.pframe.dataset.pose = 'hurt';
    b.el.classList.add('defeated');
    Sound.music(null);
    Sound.sfx('lose');
    banner('Defeated...', 'lose');
    later(() => afterLoss(b.i), 2000);
  }

  function afterWin(i) {
    const boss = BOSSES[i];
    const lines = [{ bg: 'arena', who: boss.id, expr: 'hurt', side: 'right', text: boss.winQuote }];
    if (i < BOSSES.length - 1) {
      lines.push({ bg: 'arena', who: 'lysa', expr: 'happy', side: 'left', text: 'One down! I can do this...' });
      lines.push({ bg: 'arena', text: `Lysa catches her breath. HP and MP fully restored! Up next: ${CAST[BOSSES[i + 1].id].name}.` });
      dialogue(lines, () => versus(i + 1));
    } else {
      dialogue(lines.concat(ENDING), credits);
    }
  }

  function afterLoss(i) {
    const boss = BOSSES[i];
    dialogue([{ bg: 'arena', who: boss.id, expr: 'angry', side: 'right', text: boss.loseQuote }], () => gameOver(i));
  }

  function gameOver(i) {
    Sound.music(null);
    const el = setScene(`
      <div class="bg dim">${bg('arena')}</div>
      <div class="panel over-panel">
        <h2 class="lose-title">Defeated</h2>
        <p>Lysa fell to ${CAST[BOSSES[i].id].name}. Don't give up. Grandmama is counting on you!</p>
        <button class="btn primary" data-act="retry">Retry Round ${i + 1}</button>
        <button class="btn" data-act="restart">Restart from Round 1</button>
        <button class="btn" data-act="title">Title Screen</button>
      </div>`, 'gameover');
    const retry = () => { Sound.sfx('click'); run.retries++; versus(i); };
    el.querySelector('[data-act=retry]').addEventListener('click', retry);
    el.querySelector('[data-act=restart]').addEventListener('click', () => { Sound.sfx('click'); run.retries++; versus(0); });
    el.querySelector('[data-act=title]').addEventListener('click', title);
    sceneKeys = (e) => { if (isAdvanceKey(e)) { e.preventDefault(); retry(); } };
  }

  function credits() {
    Sound.music('victory');
    const secs = Math.round((performance.now() - run.start) / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const el = setScene(`
      <div class="bg">${bg('countryside')}</div>
      <div class="ending-cast">
        <div class="ec grandma">${Art.grandma('smile')}</div>
        <div class="ec archmage">${Art.archmage('happy')}</div>
        <div class="ec lysa">${Art.lysa('happy')}</div>
      </div>
      <div class="panel credits-panel">
        <h2>Thanks for playing!</h2>
        <div class="stats">
          <div><b>${time}</b><span>Total time</span></div>
          <div><b>${run.casts}</b><span>Spells cast</span></div>
          <div><b>${run.damage}</b><span>Damage dealt</span></div>
          <div><b>${run.retries}</b><span>Retries</span></div>
        </div>
        <button class="btn primary" data-act="again">Play Again</button>
        <a class="inspo" href="https://www.youtube.com/watch?v=LWpTCkt52kw" target="_blank" rel="noopener">▶ The dev's inspiration for this game</a>
      </div>`, 'credits');
    const again = () => { Sound.sfx('click'); title(); };
    el.querySelector('[data-act=again]').addEventListener('click', again);
    sceneKeys = (e) => { if (isAdvanceKey(e)) { e.preventDefault(); again(); } };
  }

  /* ---------------- effects ---------------- */
  function fxEl(cls, x, y, html = '') {
    if (!B) return null;
    const d = document.createElement('div');
    d.className = cls;
    d.style.left = `${x}px`; d.style.top = `${y}px`;
    d.innerHTML = html;
    B.dom.fx.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
    return d;
  }

  function popup(x, y, text, cls) {
    const d = fxEl(`popup ${cls}`, x, y);
    if (d) d.textContent = text;
  }

  function burst(x, y, count, kind, spread) {
    for (let k = 0; k < count; k++) {
      const d = fxEl(`particle ${kind}`, x, y);
      if (!d) return;
      const a = rand(0, Math.PI * 2), r = rand(spread * 0.4, spread);
      d.style.setProperty('--dx', `${Math.cos(a) * r}px`);
      d.style.setProperty('--dy', `${Math.sin(a) * r - (kind === 'plus' ? 40 : 0)}px`);
      d.style.setProperty('--rot', `${rand(-180, 180)}deg`);
      d.style.animationDelay = `${rand(0, 80)}ms`;
    }
  }

  function projectile(kind, from, to, ms, onHit) {
    if (!B) return;
    const d = document.createElement('div');
    d.className = `orb ${kind}`;
    B.dom.fx.appendChild(d);
    const anim = d.animate([
      { transform: `translate(${from.x}px, ${from.y}px) scale(.5)` },
      { transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(from.y, to.y) - 60}px) scale(1)`, offset: 0.5 },
      { transform: `translate(${to.x}px, ${to.y}px) scale(1.4)` },
    ], { duration: ms, easing: 'ease-in' });
    anim.onfinish = () => { d.remove(); onHit(); };
  }

  function slash(big) {
    fxEl(`slash ${big ? 'big' : ''}`, 95, 505, `<svg viewBox="-60 -60 120 120">
      <path d="M-40 -46 L34 42" /><path d="M-22 -54 L48 30" /><path d="M-54 -30 L20 52" /></svg>`);
  }

  function flash(kind) { fxEl(`flash ${kind}`, 0, 0); }

  function shake(big) {
    const el = B && B.el;
    if (!el) return;
    el.classList.remove('shake', 'shake-big'); void el.offsetWidth;
    el.classList.add(big ? 'shake-big' : 'shake');
  }

  function wiggle(btn) {
    btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle');
  }

  function banner(html, cls) {
    if (!B) return;
    const old = B.dom.banner;
    const n = old.cloneNode(false);
    n.className = `banner show ${cls}`;
    n.innerHTML = html;
    old.replaceWith(n);
    B.dom.banner = n;
  }

  function log(text) {
    if (!B) return;
    const l = B.dom.log;
    l.textContent = text;
    l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop');
  }

  title();
})();
