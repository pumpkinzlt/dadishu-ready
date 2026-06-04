(() => {
  'use strict';

  const SAVE_KEY = 'moleRushArenaSave_v1';
  const ACCOUNTS_KEY = 'moleRushArenaAccounts_v1';
  const CURRENT_USER_KEY = 'moleRushArenaCurrentUser_v1';
  const PAYMENT_PENDING_KEY = 'moleRushArenaPendingPayment_v1';
  const VERSION = 1;
  const DAILY_REWARD_AMOUNT = 50;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const formatDate = stamp => new Date(stamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const shortName = name => (name || 'Player').slice(0, 16);

  const coinPacks = [
    { id: 'starter', name: 'Starter Pack', price: '$0.99', amount: 0.99, coins: 100, emoji: '🪙', desc: 'A light coin boost for casual runs.' },
    { id: 'mini', name: 'Mini Pack', price: '$2.99', amount: 2.99, coins: 350, emoji: '💰', desc: 'Great for unlocking your first item set.' },
    { id: 'popular', name: 'Popular Pack', price: '$4.99', amount: 4.99, coins: 650, emoji: '✨', desc: 'A balanced choice for skins and power-ups.' },
    { id: 'best', name: 'Best Value Pack', price: '$9.99', amount: 9.99, coins: 1400, emoji: '🏆', desc: 'Best value for competitive players.' },
    { id: 'pro', name: 'Pro Pack', price: '$19.99', amount: 19.99, coins: 3000, emoji: '🚀', desc: 'A strong arcade upgrade bundle.' },
    { id: 'mega', name: 'Mega Pack', price: '$49.99', amount: 49.99, coins: 8000, emoji: '👑', desc: 'The largest coin pack for collectors.' }
  ];

  const paymentMethods = [
    { type: 8004, label: 'Credit Card', icon: '💳', hint: 'Visa / Mastercard', badge: 'Recommended' },
    { type: 8003, label: 'Apple Pay', icon: '', hint: 'Fast checkout', badge: 'iOS' },
    { type: 8012, label: 'Google Pay', icon: 'G', hint: 'Android / Chrome', badge: 'Quick' }
  ];
  let currentPaymentType = 8004;

  const itemDefs = {
    shield: { name: 'Forgiving Hammer', emoji: '🛡️', cost: 120, duration: 36000, cooldown: 6000, shortcut: '1', desc: 'Forgives one missed swing, escaped mole, or trap penalty so your run can continue.', how: 'Use before a risky streak. The HUD shows FORGIVING HAMMER, and the next mistake displays Forgiven! instead of adding a miss.' },
    magnet: { name: 'Golden Bait', emoji: '🍯', cost: 150, duration: 30000, cooldown: 8000, shortcut: '2', desc: 'Greatly boosts golden mole spawns for a longer window and adds +5 bonus coins on every hit.', how: 'Use when the board is clear. It immediately attracts gold moles and keeps them appearing for a short time.' },
    double: { name: 'Combo Mallet', emoji: '🔨', cost: 180, duration: 28000, cooldown: 9000, shortcut: '3', desc: 'Longer combo power window with triple combo growth, double score, and triple coin rewards.', how: 'Use after you find a rhythm. The HUD shows Combo x3 and every hit gives much bigger rewards.' },
    bomb: { name: 'Stun Smash', emoji: '💥', cost: 220, duration: 0, cooldown: 8000, shortcut: '4', desc: 'Instantly stuns and clears all visible moles without trap penalties.', how: 'Use when the board is crowded. It creates a full-board shockwave and clears visible targets once.' },
    speed: { name: 'Slow-Mo Clock', emoji: '⏱️', cost: 160, duration: 32000, cooldown: 8000, shortcut: '5', desc: 'Strongly slows the board for a longer window and makes all moles stay up much longer.', how: 'Use when the game gets too fast. Existing moles receive extra time and new moles move slower.' },
    revive: { name: 'Second Chance', emoji: '❤️', cost: 300, duration: 0, cooldown: 0, shortcut: 'Auto', desc: 'Automatically rescues one failed run and restores time/miss allowance.', how: 'No manual button. If owned, it visibly triggers when the run would end.' }
  };

  const skins = [
    { id: 'classic', name: 'Classic', cost: 0, emoji: '🔨', colors: { head: '#8b5a3c', face: '#c88b55', accent: '#ffc54d', hammer: '#f0d5a4' }, desc: 'The default arcade look.' },
    { id: 'neon', name: 'Neon Nova', cost: 500, emoji: '💎', colors: { head: '#3547ff', face: '#35f1ff', accent: '#ff4dff', hammer: '#43e3ff' }, desc: 'Bright cyber arcade style.' },
    { id: 'pirate', name: 'Pirate Pop', cost: 650, emoji: '🏴‍☠️', colors: { head: '#4d2d20', face: '#d18a55', accent: '#ff4d55', hammer: '#e5b35b' }, desc: 'A mischievous pirate mole crew.' },
    { id: 'robot', name: 'Robo Tapper', cost: 850, emoji: '🤖', colors: { head: '#536477', face: '#a8d9ff', accent: '#63ff9a', hammer: '#c7d5e6' }, desc: 'Chrome, lights, and clean hits.' },
    { id: 'royal', name: 'Royal Smash', cost: 1100, emoji: '👑', colors: { head: '#6c3fa6', face: '#ffd083', accent: '#ffe36b', hammer: '#ffe36b' }, desc: 'Premium crown energy.' },
    { id: 'ice', name: 'Arctic Blink', cost: 1250, emoji: '❄️', colors: { head: '#6cc7ff', face: '#e6fbff', accent: '#9ffff1', hammer: '#b8f4ff' }, desc: 'Cool, clean, and frosty.' }
  ];

  const levels = Array.from({ length: 12 }, (_, i) => ({
    level: i + 1,
    // Longer levels give players enough time to learn items instead of ending before they react.
    time: clamp(95 - i * 2, 72, 95),
    target: 95 + i * 32,
    missLimit: clamp(8 - Math.floor(i / 4), 4, 8),
    star2: 140 + i * 40,
    star3: 190 + i * 50
  }));

  const defaultLeaderboard = [
    { name: 'Mia', score: 780, mode: 'Arena', date: Date.now() - 86400000 * 3 },
    { name: 'Noah', score: 710, mode: 'Classic', date: Date.now() - 86400000 * 2 },
    { name: 'Ava', score: 640, mode: 'Level', date: Date.now() - 86400000 * 5 },
    { name: 'Leo', score: 585, mode: 'Classic', date: Date.now() - 86400000 * 1 },
    { name: 'Zoe', score: 540, mode: 'Arena', date: Date.now() - 86400000 * 4 }
  ];


  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(normalizeEmail(email));
  }

  function shortHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(36);
  }

  function passwordHash(email, password) {
    return shortHash(`${normalizeEmail(email)}::${String(password || '')}::mole-rush-local-demo`);
  }

  function loadAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (err) {
      console.warn('Account load failed, using empty account list.', err);
      return {};
    }
  }

  function saveAccounts() {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function safeAccountKey(email) {
    return normalizeEmail(email).replace(/[^a-z0-9._-]/g, '_');
  }

  function loadCurrentUser(accountsMap) {
    const email = normalizeEmail(localStorage.getItem(CURRENT_USER_KEY));
    return email && accountsMap[email] ? email : '';
  }

  let accounts = loadAccounts();
  let currentUser = loadCurrentUser(accounts);

  function currentSaveKey(email = currentUser) {
    return email ? `${SAVE_KEY}_account_${safeAccountKey(email)}` : SAVE_KEY;
  }

  function defaultSave() {
    return {
      version: VERSION,
      playerName: 'Player',
      bestScore: 0,
      coins: 300,
      ownedSkins: ['classic'],
      equippedSkin: 'classic',
      ownedItems: { shield: 1, magnet: 1, double: 1, bomb: 1, speed: 1, revive: 1 },
      levelProgress: { unlocked: 1, stars: {} },
      leaderboard: defaultLeaderboard,
      settings: { music: true, sfx: true, accessibility: false, highContrast: false, reduceMotion: false },
      dailyReward: { claimed: false, amount: DAILY_REWARD_AMOUNT, claimedDate: '', streak: 0, lastClaimAt: 0 },
      lastLoginDate: ''
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(currentSaveKey());
      const base = defaultSave();
      if (currentUser && accounts[currentUser] && accounts[currentUser].playerName) base.playerName = accounts[currentUser].playerName;
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        ownedItems: { ...base.ownedItems, ...(parsed.ownedItems || {}) },
        levelProgress: { ...base.levelProgress, ...(parsed.levelProgress || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        dailyReward: { ...base.dailyReward, ...(parsed.dailyReward || {}), amount: DAILY_REWARD_AMOUNT },
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : base.leaderboard
      };
    } catch (err) {
      console.warn('Save load failed, using default save.', err);
      return defaultSave();
    }
  }

  let save = loadSave();

  function persist() {
    save.version = VERSION;
    localStorage.setItem(currentSaveKey(), JSON.stringify(save));
  }

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove('show'), 1900);
  }

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.musicTimer = null;
      this.musicOn = false;
      this.musicStep = 0;
      this.musicMode = 'classic';
      this.master = null;
    }
    ensure() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return null;
          this.ctx = new AudioCtx();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.82;
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch?.(() => {});
        return this.ctx;
      } catch (err) {
        console.warn('Audio is unavailable in this browser session.', err);
        return null;
      }
    }
    destination() {
      return this.master || this.ensure()?.destination;
    }
    tone(freq, duration = 0.12, type = 'sine', gain = 0.06, slide = 0, when = 0, isMusic = false) {
      if (isMusic ? !save.settings.music : !save.settings.sfx) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime + Math.max(0, when);
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(35, freq), now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(35, freq + slide), now + duration);
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.014);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp).connect(this.destination());
      osc.start(now);
      osc.stop(now + duration + 0.035);
    }
    noise(duration = 0.12, gain = 0.035, filterFreq = 900, when = 0, isMusic = false) {
      if (isMusic ? !save.settings.music : !save.settings.sfx) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime + Math.max(0, when);
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const amp = ctx.createGain();
      src.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(1.8, now);
      amp.gain.setValueAtTime(gain, now);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter).connect(amp).connect(this.destination());
      src.start(now);
      src.stop(now + duration + 0.02);
    }
    chord(notes, duration = 0.18, type = 'triangle', gain = 0.028, isMusic = false) {
      notes.forEach((n, i) => this.tone(n, duration, type, gain / Math.max(1, notes.length), 0, i * 0.012, isMusic));
    }
    play(name) {
      try {
        const map = {
          click: () => this.tone(620, 0.055, 'triangle', 0.032, 90),
          back: () => this.tone(360, 0.08, 'triangle', 0.026, -60),
          locked: () => { this.tone(180, 0.09, 'square', 0.032, -25); this.noise(0.06, 0.012, 300, 0.02); },
          start: () => { this.tone(392, 0.08, 'triangle', 0.04); this.tone(523, 0.08, 'triangle', 0.036, 0, 0.055); this.tone(784, 0.11, 'sine', 0.032, 0, 0.11); },
          pause: () => { this.tone(480, 0.06, 'triangle', 0.028); this.tone(320, 0.08, 'triangle', 0.024, 0, 0.07); },
          resume: () => { this.tone(320, 0.06, 'triangle', 0.026); this.tone(480, 0.08, 'triangle', 0.028, 0, 0.07); },
          pop: () => { this.tone(250 + Math.random() * 80, 0.055, 'sine', 0.012, 120); },
          whack: () => { this.noise(0.08, 0.034, 680); this.tone(130, 0.07, 'square', 0.026, -45, 0.01); },
          miss: () => { this.noise(0.11, 0.028, 260); this.tone(150, 0.13, 'sawtooth', 0.032, -45); },
          score: () => { this.tone(720, 0.055, 'square', 0.033); this.tone(960, 0.06, 'triangle', 0.03, 0, 0.052); },
          combo: () => { this.tone(820, 0.05, 'square', 0.032); this.tone(1060, 0.055, 'triangle', 0.03, 0, 0.045); this.tone(1320, 0.07, 'sine', 0.028, 0, 0.09); },
          coin: () => { this.tone(980, 0.055, 'triangle', 0.038); this.tone(1320, 0.06, 'sine', 0.03, 0, 0.05); this.tone(1568, 0.065, 'sine', 0.023, 0, 0.1); },
          item: () => { this.tone(380, 0.09, 'sawtooth', 0.032, 40); this.tone(620, 0.11, 'triangle', 0.034, 0, 0.08); },
          shield: () => { this.chord([392, 523, 659], 0.18, 'triangle', 0.065); this.tone(784, 0.12, 'sine', 0.026, 0, 0.12); },
          bomb: () => { this.tone(95, 0.22, 'sawtooth', 0.055, -35); this.noise(0.22, 0.045, 180, 0.01); },
          revive: () => { this.chord([330, 440, 660], 0.18, 'triangle', 0.06); this.tone(880, 0.12, 'sine', 0.03, 0, 0.15); },
          hurt: () => { this.noise(0.08, 0.026, 220); this.tone(160, 0.18, 'sawtooth', 0.048, -80); },
          over: () => { this.tone(260, 0.16, 'triangle', 0.05, -70); this.tone(190, 0.2, 'sawtooth', 0.04, -45, 0.14); this.tone(130, 0.24, 'triangle', 0.036, -35, 0.32); },
          purchase: () => { this.tone(660, 0.06, 'triangle', 0.038); this.tone(880, 0.07, 'triangle', 0.036, 0, 0.06); this.tone(1180, 0.09, 'sine', 0.031, 0, 0.13); },
          equip: () => { this.tone(460, 0.07, 'triangle', 0.032); this.chord([690, 920], 0.12, 'sine', 0.042); },
          login: () => { this.chord([392, 494, 659], 0.16, 'triangle', 0.058); },
          payment: () => { this.tone(520, 0.08, 'triangle', 0.034); this.tone(740, 0.08, 'triangle', 0.032, 0, 0.08); }
        };
        map[name]?.();
      } catch (err) {
        console.warn('Sound effect failed safely.', err);
      }
    }
    startMusic(mode = 'classic') {
      if (!save.settings.music) return;
      if (this.musicOn && this.musicMode === mode) return;
      if (this.musicOn) this.stopMusic();
      const ctx = this.ensure();
      if (!ctx) return;
      this.musicOn = true;
      this.musicMode = mode || 'classic';
      this.musicStep = 0;
      const tracks = {
        beginner: { tempo: 560, melody: [392, 440, 494, 523, 494, 440, 392, 330], bass: [196, 196, 220, 247], wave: 'triangle', perc: 0.18 },
        classic: { tempo: 430, melody: [392, 494, 587, 659, 587, 494, 440, 494], bass: [196, 247, 220, 247], wave: 'triangle', perc: 0.25 },
        arena: { tempo: 320, melody: [330, 392, 494, 659, 740, 659, 494, 392], bass: [110, 130, 146, 165], wave: 'square', perc: 0.48 },
        level: { tempo: 470, melody: [349, 440, 523, 587, 659, 587, 523, 440], bass: [174, 220, 196, 247], wave: 'triangle', perc: 0.28 }
      };
      const playStep = () => {
        if (!this.musicOn || !save.settings.music) return;
        const track = tracks[this.musicMode] || tracks.classic;
        const i = this.musicStep;
        if (i % 2 === 0) this.tone(track.melody[i % track.melody.length], track.tempo / 1200, track.wave, this.musicMode === 'arena' ? 0.018 : 0.016, 0, 0, true);
        if (i % 4 === 0) this.tone(track.bass[Math.floor(i / 4) % track.bass.length], track.tempo / 900, 'sine', 0.014, 0, 0, true);
        if (i % 4 === 2) this.tone(track.bass[(Math.floor(i / 4) + 1) % track.bass.length] * 1.5, track.tempo / 1500, 'triangle', 0.009, 0, 0, true);
        if (track.perc > 0 && i % (this.musicMode === 'arena' ? 2 : 4) === 0) this.noise(0.035, 0.006 + track.perc * 0.01, 1200, 0, true);
        if (i % 16 === 15) this.chord([track.melody[1], track.melody[3], track.melody[5]], 0.18, 'triangle', 0.026, true);
        this.musicStep += 1;
      };
      playStep();
      const track = tracks[this.musicMode] || tracks.classic;
      this.musicTimer = setInterval(playStep, track.tempo / 2);
    }
    stopMusic() {
      this.musicOn = false;
      clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.musicStep = 0;
    }
  }

  const audio = new AudioManager();

  const screens = [...document.querySelectorAll('.screen')];
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const pointer = { x: 0, y: 0, down: false, active: false, lastMove: 0 };
  const keyState = new Set();

  const UI = {
    playerNameInput: document.getElementById('playerNameInput'),
    authStatus: document.getElementById('authStatus'),
    authCard: document.getElementById('authCard'),
    authForm: document.getElementById('authForm'),
    logoutBtn: document.getElementById('logoutBtn'),
    startGameBtn: document.getElementById('startGameBtn'),
    authEmailInput: document.getElementById('authEmailInput'),
    authPasswordInput: document.getElementById('authPasswordInput'),
    authMessage: document.getElementById('authMessage'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    dailyRewardCard: document.getElementById('dailyRewardCard'),
    dailyRewardTitle: document.getElementById('dailyRewardTitle'),
    dailyRewardDesc: document.getElementById('dailyRewardDesc'),
    dailyRewardBtn: document.getElementById('dailyRewardBtn'),
    homeCoins: document.getElementById('homeCoins'),
    homeBest: document.getElementById('homeBest'),
    homeSkin: document.getElementById('homeSkin'),
    hudScore: document.getElementById('hudScore'),
    hudBest: document.getElementById('hudBest'),
    hudCoins: document.getElementById('hudCoins'),
    hudMode: document.getElementById('hudMode'),
    miniLeaderboard: document.getElementById('miniLeaderboard'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    goScore: document.getElementById('goScore'),
    goBest: document.getElementById('goBest'),
    goCoins: document.getElementById('goCoins'),
    goStars: document.getElementById('goStars'),
    goTip: document.getElementById('goTip'),
    shopCoins: document.getElementById('shopCoins'),
    leaderboardBody: document.getElementById('leaderboardBody'),
    musicToggle: document.getElementById('musicToggle'),
    sfxToggle: document.getElementById('sfxToggle'),
    accessibilityToggle: document.getElementById('accessibilityToggle'),
    contrastToggle: document.getElementById('contrastToggle'),
    motionToggle: document.getElementById('motionToggle'),
    levelGrid: document.getElementById('levelGrid')
  };

  function accessibilityOn() {
    return !!save.settings.accessibility;
  }

  function highContrastOn() {
    return !!(save.settings.highContrast || save.settings.accessibility);
  }

  function reduceMotionOn() {
    return !!save.settings.reduceMotion;
  }

  function accessibilityMultiplier() {
    return accessibilityOn() ? 1.28 : 1;
  }

  function applyAccessibilitySettings() {
    document.body.classList.toggle('accessibility-mode', accessibilityOn());
    document.body.classList.toggle('high-contrast-targets', highContrastOn());
    document.body.classList.toggle('reduced-motion', reduceMotionOn());
  }

  class MoleGame {
    constructor() {
      this.mode = 'classic';
      this.level = 1;
      this.running = false;
      this.paused = false;
      this.finished = false;
      this.last = performance.now();
      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.holes = [];
      this.moles = [];
      this.particles = [];
      this.texts = [];
      this.coins = [];
      this.ripples = [];
      this.ai = [];
      this.score = 0;
      this.coinsEarned = 0;
      this.misses = 0;
      this.combo = 0;
      this.timeLeft = 100;
      this.sessionBaseTime = 100;
      this.missLimit = 7;
      this.targetScore = 0;
      this.spawnTimer = 0;
      this.spawnInterval = 900;
      this.hammer = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, swing: 0, radius: 36 };
      this.effects = { shield: 0, magnet: 0, double: 0, speed: 0, revived: false };
      this.cooldowns = { shield: 0, magnet: 0, double: 0, bomb: 0, speed: 0, revive: 0 };
      this.shake = 0;
      this.bgTime = 0;
      this.activeLoopToken = 0;
      this.forceGoldSpawns = 0;
      this.itemBanner = null;
      this.loop = this.loop.bind(this);
    }

    resize() {
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      this.w = Math.floor(rect.width);
      this.h = Math.floor(rect.height);
      canvas.width = Math.floor(this.w * this.dpr);
      canvas.height = Math.floor(this.h * this.dpr);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.buildHoles();
      if (!this.hammer.x) {
        this.hammer.x = this.w / 2;
        this.hammer.y = this.h * 0.55;
      }
    }

    buildHoles() {
      const compactGameUI = this.w < 680;
      const landscapeCompact = this.h < 560;
      const usableTop = landscapeCompact ? 90 : 120;
      const usableBottom = compactGameUI ? (landscapeCompact ? 160 : 220) : (landscapeCompact ? 110 : 120);
      const cols = this.w < 680 ? 3 : 4;
      const rows = this.h < 520 ? 2 : 3;
      const marginX = this.w < 680 ? 38 : 90;
      const areaW = Math.max(220, this.w - marginX * 2 - (this.w > 980 ? 170 : 0));
      const areaH = Math.max(190, this.h - usableTop - usableBottom);
      const startX = marginX;
      const startY = usableTop;
      this.holes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + (areaW * (c + 0.5)) / cols;
          const y = startY + (areaH * (r + 0.5)) / rows;
          const size = clamp(Math.min(areaW / cols, areaH / rows) * 0.36, 42, 76);
          this.holes.push({ x, y, r: size, mole: null });
        }
      }
    }

    start(mode = this.mode, level = this.level) {
      this.mode = mode;
      this.level = level;
      this.running = true;
      this.paused = false;
      this.finished = false;
      document.getElementById('gameScreen').classList.remove('menu-cursor');
      pointer.down = false;
      pointer.active = false;
      keyState.clear();
      this.score = 0;
      this.coinsEarned = 0;
      this.misses = 0;
      this.combo = 0;
      this.particles.length = 0;
      this.texts.length = 0;
      this.coins.length = 0;
      this.ripples.length = 0;
      this.moles.length = 0;
      this.shake = 0;
      this.spawnTimer = 200;
      this.effects = { shield: 0, magnet: 0, double: 0, speed: 0, revived: false };
      this.cooldowns = { shield: 0, magnet: 0, double: 0, bomb: 0, speed: 0, revive: 0 };
      this.forceGoldSpawns = 0;
      this.itemBanner = null;
      this.ai = [
        { name: 'Rex', score: rand(0, 25), speed: rand(0.5, 1.1) },
        { name: 'Luna', score: rand(0, 25), speed: rand(0.5, 1.2) },
        { name: 'Bolt', score: rand(0, 25), speed: rand(0.6, 1.3) }
      ];
      if (mode === 'level') {
        const cfg = levels[level - 1] || levels[0];
        this.timeLeft = cfg.time;
        this.missLimit = cfg.missLimit;
        this.targetScore = cfg.target;
      } else if (mode === 'arena') {
        // Arena remains the fastest mode, but is long enough to understand items and ranking.
        this.timeLeft = 95;
        this.missLimit = 6;
        this.targetScore = 0;
      } else if (mode === 'beginner') {
        // Beginner is now a real practice run, not a short demo.
        this.timeLeft = 120;
        this.missLimit = 14;
        this.targetScore = 0;
      } else {
        this.timeLeft = 100;
        this.missLimit = 8;
        this.targetScore = 0;
      }
      this.sessionBaseTime = this.timeLeft;
      if (accessibilityOn()) {
        this.timeLeft += this.mode === 'arena' ? 12 : 18;
        this.sessionBaseTime = this.timeLeft;
        this.missLimit += this.mode === 'beginner' ? 4 : 3;
      }
      this.resize();
      this.hammer.x = this.w / 2;
      this.hammer.y = Math.min(this.h - 150, this.h * 0.65);
      this.last = performance.now();
      this.activeLoopToken += 1;
      UI.pauseOverlay.classList.add('hidden');
      UI.gameOverOverlay.classList.add('hidden');
      updateHUD();
      this.updateItemButtons();
      const theme = getModeTheme(this.mode);
      const intro = this.mode === 'level'
        ? `Level ${this.level}: Target ${this.targetScore}`
        : this.mode === 'arena'
          ? 'Arena Rush: beat the AI rivals!'
          : this.mode === 'beginner'
            ? 'Beginner Training: 2-minute practice run!' 
            : 'Classic Mode: 100-second high score run!';
      if (accessibilityOn()) this.floatText('Accessibility Assist On', this.w / 2, Math.min(166, this.h * 0.26), '#64ff9a');
      this.floatText(intro, this.w / 2, Math.min(132, this.h * 0.2), theme.spark);
      this.floatText('Items last longer now: tap the dock or press 1-5', this.w / 2, Math.min(158, this.h * 0.24), '#f6fbff');
      audio.play('start');
      audio.startMusic(this.mode);
      const token = this.activeLoopToken;
      requestAnimationFrame(now => this.loop(now, token));
    }

    loop(now, token = this.activeLoopToken) {
      if (token !== this.activeLoopToken) return;
      const dt = Math.min(33, now - this.last);
      this.last = now;
      if (this.running && !this.paused && !this.finished) this.update(dt);
      this.draw();
      if (this.running) requestAnimationFrame(nextNow => this.loop(nextNow, token));
    }

    update(dt) {
      this.bgTime += dt * 0.001;
      const sec = dt / 1000;
      this.timeLeft -= sec;
      this.spawnTimer -= dt;
      this.shake = reduceMotionOn() ? 0 : Math.max(0, this.shake - dt * 0.04);
      Object.keys(this.effects).forEach(k => {
        if (typeof this.effects[k] === 'number') this.effects[k] = Math.max(0, this.effects[k] - dt);
      });
      Object.keys(this.cooldowns).forEach(k => this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt));
      if (this.itemBanner) {
        this.itemBanner.life = Math.max(0, this.itemBanner.life - dt);
        if (this.itemBanner.life <= 0) this.itemBanner = null;
      }
      this.updateHammer(dt);
      const elapsedBase = this.sessionBaseTime || this.timeLeft || 100;
      let difficulty = 1 + Math.min(1.1, (this.score / 620) + ((elapsedBase - this.timeLeft) / 155));
      if (this.mode === 'beginner') difficulty = 1 + Math.min(0.55, (this.score / 820) + ((elapsedBase - this.timeLeft) / 230));
      if (this.mode === 'arena') difficulty += 0.24;
      if (this.mode === 'level') difficulty += Math.min(0.45, this.level * 0.045);
      if (accessibilityOn()) difficulty *= 0.82;
      const speedMod = (this.effects.speed > 0 ? 0.45 : 1) * (accessibilityOn() ? 0.86 : 1);
      if (this.mode === 'beginner') this.spawnInterval = clamp(1450 / difficulty, 780, 1450);
      else if (this.mode === 'arena') this.spawnInterval = clamp(880 / difficulty, 390, 880);
      else if (this.mode === 'level') this.spawnInterval = clamp((1180 - this.level * 16) / difficulty, 520, 1120);
      else this.spawnInterval = clamp(1120 / difficulty, 540, 1120);
      if (this.spawnTimer <= 0) {
        this.spawnMole(difficulty);
        if (this.mode === 'arena' && Math.random() > 0.48) this.spawnMole(difficulty);
        if (this.mode === 'level' && this.level >= 8 && Math.random() > 0.78) this.spawnMole(difficulty);
        this.spawnTimer = this.spawnInterval * rand(0.75, 1.18) * accessibilityMultiplier() * (this.effects.speed > 0 ? 1.55 : 1);
      }
      for (const mole of this.moles) mole.update(dt * speedMod);
      this.moles = this.moles.filter(mole => {
        if (mole.dead) {
          if (mole.hole.mole === mole) mole.hole.mole = null;
          return false;
        }
        return true;
      });
      this.updateParticles(dt);
      this.updateCoins(dt);
      this.updateRipples(dt);
      if (this.mode === 'arena') {
        for (const rival of this.ai) rival.score += rival.speed * difficulty * sec * 8;
      }
      if (this.timeLeft <= 0 || this.misses >= this.missLimit) {
        if (this.canRevive()) {
          this.consumeRevive();
        } else {
          this.endGame();
        }
      }
      updateHUD();
      this.updateItemButtons();
    }

    updateHammer(dt) {
      const step = (this.effects.speed > 0 ? 0.55 : 0.42) * dt;
      let dx = 0, dy = 0;
      if (keyState.has('arrowleft') || keyState.has('a')) dx -= 1;
      if (keyState.has('arrowright') || keyState.has('d')) dx += 1;
      if (keyState.has('arrowup') || keyState.has('w')) dy -= 1;
      if (keyState.has('arrowdown') || keyState.has('s')) dy += 1;
      if (dx || dy) {
        const len = Math.hypot(dx, dy) || 1;
        this.hammer.x = clamp(this.hammer.x + dx / len * step, 16, this.w - 16);
        this.hammer.y = clamp(this.hammer.y + dy / len * step, 70, this.h - 42);
      } else if (pointer.active) {
        // Keep the custom hammer cursor locked to the real pointer.
        // The previous eased interpolation made the hammer visibly trail behind the mouse.
        this.hammer.x = clamp(pointer.x, 16, this.w - 16);
        this.hammer.y = clamp(pointer.y, 70, this.h - 42);
      }
      this.hammer.swing = Math.max(0, this.hammer.swing - dt * 0.005);
      this.hammer.angle = Math.sin(this.bgTime * 3.2) * 0.08 - this.hammer.swing * 1.2;
    }

    spawnMole(difficulty, forcedType = '') {
      const free = this.holes.filter(h => !h.mole);
      if (!free.length) return;
      const hole = pick(free);
      const roll = Math.random();
      let type = forcedType || 'normal';
      if (!forcedType && this.forceGoldSpawns > 0) {
        type = 'gold';
        this.forceGoldSpawns -= 1;
      } else if (!forcedType && this.mode === 'beginner') {
        if (roll > 0.9) type = 'gold';
        else if (roll > 0.9 && this.score > 260) type = 'fast';
      } else if (!forcedType && this.mode === 'arena') {
        if (roll > 0.88) type = 'gold';
        else if (roll > 0.72 && this.score > 90) type = 'bad';
        else if (roll > 0.50 && this.score > 130) type = 'fast';
      } else if (!forcedType && this.mode === 'level') {
        if (roll > 0.88) type = 'gold';
        else if (roll > 0.8 && this.level >= 4) type = 'bad';
        else if (roll > 0.68 && this.level >= 3) type = 'fast';
      } else if (!forcedType) {
        if (roll > 0.88) type = 'gold';
        else if (roll > 0.84 && this.score > 180) type = 'bad';
        else if (roll > 0.73 && this.score > 240) type = 'fast';
      }
      if (accessibilityOn()) {
        if (type === 'bad' && Math.random() < 0.78) type = 'normal';
        if (type === 'fast' && Math.random() < 0.45) type = 'normal';
      }
      if (this.effects.magnet > 0) {
        // Golden Bait should be obvious: lots more gold targets, almost no trap surprises.
        if (type === 'bad' && Math.random() < 0.9) type = 'normal';
        if (type === 'normal' && Math.random() < 0.62) type = 'gold';
        if (type === 'fast' && Math.random() < 0.34) type = 'gold';
      }
      const baseLife = this.mode === 'beginner' ? rand(1650, 2250) : this.mode === 'arena' ? rand(980, 1450) : this.mode === 'level' ? rand(1250, 1850) : rand(1300, 1900);
      const minLife = this.mode === 'beginner' ? 1050 : this.mode === 'arena' ? 650 : 820;
      const maxLife = this.mode === 'beginner' ? 2350 : this.mode === 'arena' ? 1650 : 2050;
      const life = clamp(baseLife / difficulty, minLife, maxLife) * (type === 'fast' ? 0.72 : 1) * (this.effects.speed > 0 ? 1.75 : 1) * (accessibilityOn() ? 1.34 : 1);
      const mole = new Mole(hole, type, life, this);
      audio.play('pop');
      hole.mole = mole;
      this.moles.push(mole);
    }

    whack(x = this.hammer.x, y = this.hammer.y, fromBomb = false) {
      if (!this.running || this.paused || this.finished) return;
      this.hammer.swing = 1;
      audio.play('whack');
      this.ripples.push({ x, y, r: 0, a: 1, color: 'rgba(255,207,77,' });
      const hitRadius = fromBomb ? Infinity : clamp(this.w * 0.045, 38, 62) * (accessibilityOn() ? 1.34 : 1);
      let hit = false;
      const visible = this.moles.filter(m => m.isHittable());
      visible.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
      for (const mole of visible) {
        if (Math.hypot(mole.x - x, mole.y - y) <= hitRadius || fromBomb) {
          this.hitMole(mole, fromBomb);
          hit = true;
          if (!fromBomb) break;
        }
      }
      if (!hit && !fromBomb) this.registerMiss(x, y, 'Miss');
    }

    hitMole(mole, fromBomb) {
      if (!mole.isHittable()) return;
      mole.hit();
      if (mole.type === 'bad') {
        if (fromBomb) {
          this.score += 4;
          this.floatText('Stunned!', mole.x, mole.y - 32, '#ffcf4d');
          this.spark(mole.x, mole.y, '#ffcf4d', 14);
          return;
        }
        this.registerMiss(mole.x, mole.y, 'Trap!');
        return;
      }
      this.combo += this.effects.double > 0 ? 3 : 1;
      const base = mole.type === 'gold' ? 24 : mole.type === 'fast' ? 16 : 10;
      const comboBonus = Math.min(14, Math.floor(this.combo / 4));
      const modeBonus = this.mode === 'arena' ? 1.18 : this.mode === 'level' ? 1.05 + Math.min(this.level, 12) * 0.012 : 1;
      const powerBonus = this.effects.double > 0 ? 2 : 1;
      const points = Math.round((base + comboBonus + (fromBomb ? 3 : 0)) * modeBonus * powerBonus);
      const coinBase = mole.type === 'gold' ? 6 : this.mode === 'arena' ? 3 : 2;
      const baitBonus = this.effects.magnet > 0 ? 5 : 0;
      const coinGain = (coinBase + baitBonus + Math.floor(this.combo / 5)) * (this.effects.double > 0 ? 3 : 1);
      this.score += points;
      this.coinsEarned += coinGain;
      audio.play(mole.type === 'gold' ? 'coin' : (this.combo >= 4 && this.combo % 4 === 0 ? 'combo' : 'score'));
      this.floatText(`+${points}`, mole.x, mole.y - 38, mole.type === 'gold' ? '#ffdf64' : '#ffffff');
      this.floatText(`+${coinGain} 🪙`, mole.x + 16, mole.y - 12, '#ffcf4d');
      if (this.effects.double > 0) this.floatText('COMBO x3', mole.x - 18, mole.y + 22, '#64ff9a');
      if (this.effects.magnet > 0) this.floatText('BAIT +5', mole.x + 22, mole.y + 38, '#ffdf64');
      this.spawnCoinBurst(mole.x, mole.y, coinGain);
      this.spark(mole.x, mole.y, mole.type === 'gold' ? '#ffdf64' : '#43e3ff', 16);
    }

    registerMiss(x, y, label) {
      if (this.effects.shield > 0) {
        this.effects.shield = 0;
        this.floatText('Forgiven!', x, y - 25, '#64ff9a');
        this.spark(x, y, '#64ff9a', 20);
        audio.play('shield');
        return;
      }
      this.misses += 1;
      this.combo = 0;
      this.shake = reduceMotionOn() ? 0 : (accessibilityOn() ? 4 : 9);
      this.floatText(label, x, y - 18, '#ff5470');
      this.spark(x, y, '#ff5470', 12);
      audio.play(label === 'Miss' || label === 'Escaped!' ? 'miss' : 'hurt');
    }

    showItemBanner(title, subtitle, color = '#64ff9a') {
      this.itemBanner = { title, subtitle, color, life: 1700 };
      this.floatText(title, this.w / 2, Math.min(172, this.h * 0.28), color);
    }

    useItem(id) {
      if (!this.running || this.paused || this.finished) return;
      const item = itemDefs[id];
      if (!item) return;
      if (id === 'revive') return toast('Second Chance is automatic. It triggers when a run would end.');
      if ((save.ownedItems[id] || 0) <= 0) return toast(`You need to buy ${item.name} first.`);
      if (this.cooldowns[id] > 0) return toast(`${item.name} is cooling down.`);
      if (['shield', 'magnet', 'double', 'speed'].includes(id) && this.effects[id] > 0) return toast(`${item.name} is already active.`);
      save.ownedItems[id] -= 1;
      this.cooldowns[id] = item.cooldown;
      if (id === 'bomb') {
        const visibleCount = this.moles.filter(m => m.isHittable()).length;
        audio.play('bomb');
        this.showItemBanner('STUN SMASH!', `Cleared ${visibleCount} visible target${visibleCount === 1 ? '' : 's'}`, '#ffcf4d');
        this.whack(this.w / 2, this.h / 2, true);
        this.ripples.push({ x: this.w / 2, y: this.h / 2, r: 10, a: 1, color: 'rgba(255,84,112,' });
        this.spark(this.w / 2, this.h / 2, '#ffcf4d', 46);
        this.shake = reduceMotionOn() ? 0 : (accessibilityOn() ? 7 : 15);
      } else {
        this.effects[id] = item.duration;
        if (id === 'shield') {
          audio.play('shield');
          this.showItemBanner('FORGIVING HAMMER', 'Next mistake will be forgiven', '#64ff9a');
          this.spark(this.hammer.x, this.hammer.y, '#64ff9a', 28);
        } else if (id === 'magnet') {
          audio.play('item');
          this.forceGoldSpawns = Math.max(this.forceGoldSpawns, 4);
          for (let i = 0; i < 2; i++) this.spawnMole(0.7, 'gold');
          this.showItemBanner('GOLDEN BAIT!', 'Gold moles boosted + bonus coins', '#ffdf64');
          this.spark(this.hammer.x, this.hammer.y, '#ffdf64', 34);
        } else if (id === 'double') {
          audio.play('combo');
          this.showItemBanner('COMBO MALLET!', 'Score x2 • Combo x3 • Coins x3', '#70f1ff');
          this.spark(this.hammer.x, this.hammer.y, '#70f1ff', 30);
        } else if (id === 'speed') {
          audio.play('item');
          this.moles.forEach(m => { if (m.isHittable()) m.life += 2600; });
          this.showItemBanner('SLOW-MO ON!', 'Moles stay up much longer', '#b8a7ff');
          this.spark(this.hammer.x, this.hammer.y, '#b8a7ff', 32);
        }
      }
      persist();
      updateAllUI();
      this.updateItemButtons();
    }

    canRevive() {
      return !this.effects.revived && (save.ownedItems.revive || 0) > 0;
    }

    consumeRevive() {
      save.ownedItems.revive -= 1;
      persist();
      this.effects.revived = true;
      this.timeLeft = Math.max(this.timeLeft, 30);
      this.misses = Math.max(0, this.missLimit - 3);
      this.floatText('Second Chance!', this.w / 2, this.h / 2 - 80, '#ff94a6');
      this.spark(this.w / 2, this.h / 2, '#ff94a6', 42);
      this.shake = 0;
      audio.play('revive');
      updateAllUI();
    }

    pause() {
      if (!this.running || this.finished) return;
      this.paused = true;
      pointer.down = false;
      pointer.active = false;
      document.getElementById('gameScreen').classList.add('menu-cursor');
      UI.pauseOverlay.classList.remove('hidden');
      audio.play('pause');
      audio.stopMusic();
    }

    resume() {
      if (!this.running || this.finished) return;
      this.paused = false;
      this.last = performance.now();
      document.getElementById('gameScreen').classList.remove('menu-cursor');
      UI.pauseOverlay.classList.add('hidden');
      audio.play('resume');
      audio.startMusic(this.mode);
    }

    endGame() {
      if (this.finished) return;
      this.finished = true;
      this.running = false;
      this.activeLoopToken += 1;
      pointer.down = false;
      pointer.active = false;
      keyState.clear();
      document.getElementById('gameScreen').classList.add('menu-cursor');
      audio.play('over');
      audio.stopMusic();
      save.coins += this.coinsEarned;
      const modeName = modeDisplayName(this.mode, this.level);
      save.bestScore = Math.max(save.bestScore || 0, this.score);
      save.leaderboard.push({ name: shortName(save.playerName), score: this.score, mode: modeName, date: Date.now(), isLocal: true });
      save.leaderboard = save.leaderboard.sort((a, b) => b.score - a.score).slice(0, 30);
      let stars = '—';
      if (this.mode === 'level') {
        const cfg = levels[this.level - 1];
        const starCount = this.score >= cfg.star3 ? 3 : this.score >= cfg.star2 ? 2 : this.score >= cfg.target ? 1 : 0;
        stars = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);
        save.levelProgress.stars[this.level] = Math.max(save.levelProgress.stars[this.level] || 0, starCount);
        if (starCount > 0) save.levelProgress.unlocked = Math.max(save.levelProgress.unlocked, this.level + 1);
      }
      persist();
      updateAllUI();
      UI.goScore.textContent = this.score;
      UI.goBest.textContent = save.bestScore;
      UI.goCoins.textContent = this.coinsEarned;
      UI.goStars.textContent = stars;
      const outcome = this.mode === 'level' && this.score < this.targetScore
        ? `Target was ${this.targetScore}. Upgrade items and try again.`
        : this.mode === 'arena'
          ? `Final arena rank: #${this.getArenaRank()}.`
          : this.mode === 'beginner'
            ? 'Beginner run complete. Register or log in to keep progress under an account.'
            : 'Nice run. Keep your combo alive for bigger coin rewards.';
      UI.goTip.textContent = outcome;
      UI.gameOverOverlay.classList.remove('hidden');
    }

    getArenaRank() {
      const rows = [{ name: shortName(save.playerName), score: this.score }, ...this.ai.map(a => ({ name: a.name, score: Math.floor(a.score) }))]
        .sort((a, b) => b.score - a.score);
      return rows.findIndex(r => r.name === shortName(save.playerName) && r.score === this.score) + 1;
    }

    updateParticles(dt) {
      for (const p of this.particles) {
        p.x += p.vx * dt / 16;
        p.y += p.vy * dt / 16;
        p.vy += 0.045 * dt / 16;
        p.life -= dt;
        p.rot += p.spin * dt / 16;
      }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const t of this.texts) {
        t.y -= t.vy * dt / 16;
        t.life -= dt;
        t.scale += dt * 0.0003;
      }
      this.texts = this.texts.filter(t => t.life > 0);
    }

    updateCoins(dt) {
      const rect = UI.hudCoins.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const target = { x: rect.left + rect.width / 2 - canvasRect.left, y: rect.top + rect.height / 2 - canvasRect.top };
      for (const c of this.coins) {
        const shouldFly = c.life < 650 || this.effects.magnet > 0;
        if (shouldFly) {
          const dx = target.x - c.x;
          const dy = target.y - c.y;
          const d = Math.hypot(dx, dy) || 1;
          c.vx += dx / d * (this.effects.magnet > 0 ? 0.56 : 0.34);
          c.vy += dy / d * (this.effects.magnet > 0 ? 0.56 : 0.34);
          if (d < 16) c.life = 0;
        }
        c.x += c.vx * dt / 16;
        c.y += c.vy * dt / 16;
        if (!shouldFly) c.vy += 0.06 * dt / 16;
        c.vx *= 0.99;
        c.vy *= 0.99;
        c.life -= dt;
      }
      this.coins = this.coins.filter(c => c.life > 0);
    }

    updateRipples(dt) {
      for (const r of this.ripples) {
        r.r += dt * 0.25;
        r.a -= dt * 0.0028;
      }
      this.ripples = this.ripples.filter(r => r.a > 0);
    }

    floatText(text, x, y, color) {
      this.texts.push({ text, x, y, color, life: 850, vy: 1.2, scale: 1 });
    }

    spark(x, y, color, count = 10) {
      if (reduceMotionOn()) count = Math.min(4, Math.ceil(count * 0.25));
      for (let i = 0; i < count; i++) {
        const a = rand(0, Math.PI * 2);
        const s = rand(1.4, 6.3);
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.2, size: rand(2, 6), color, life: rand(350, 820), rot: rand(0, 6), spin: rand(-0.2, 0.2) });
      }
    }

    spawnCoinBurst(x, y, amount) {
      const count = clamp(Math.ceil(amount / 2), 1, 9);
      for (let i = 0; i < count; i++) {
        this.coins.push({ x, y, vx: rand(-2.4, 2.4), vy: rand(-4.5, -1.4), life: rand(650, 1150), r: rand(5, 8) });
      }
    }

    updateItemButtons() {
      document.querySelectorAll('.item-btn').forEach(btn => {
        const id = btn.dataset.item;
        const count = save.ownedItems[id] || 0;
        const countEl = btn.querySelector('em');
        if (countEl) countEl.textContent = count;
        btn.classList.toggle('empty', count <= 0);
        btn.classList.toggle('cooldown', this.cooldowns[id] > 0);
        btn.classList.toggle('active-effect', this.effects[id] > 0);
        const seconds = Math.ceil((this.cooldowns[id] || 0) / 1000);
        if (itemDefs[id]) btn.dataset.shortcut = itemDefs[id].shortcut || '';
        btn.dataset.state = this.effects[id] > 0 ? 'ON' : seconds > 0 ? `${seconds}s` : count > 0 ? 'READY' : 'EMPTY';
        btn.title = seconds > 0 ? `${itemDefs[id].name} cooldown: ${seconds}s` : `${itemDefs[id].name} • Press ${itemDefs[id].shortcut}`;
      });
    }

    draw() {
      const sx = this.shake ? rand(-this.shake, this.shake) : 0;
      const sy = this.shake ? rand(-this.shake, this.shake) : 0;
      ctx.save();
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.translate(sx, sy);
      this.drawBackground();
      for (const hole of this.holes) this.drawHole(hole);
      for (const mole of this.moles) mole.draw(ctx);
      this.drawCoins();
      this.drawRipples();
      this.drawParticles();
      this.drawTexts();
      this.drawStatusBar();
      this.drawItemBanner();
      this.drawHammer();
      ctx.restore();
    }

    drawBackground() {
      const theme = getModeTheme(this.mode);
      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      g.addColorStop(0, theme.top);
      g.addColorStop(0.56, theme.mid);
      g.addColorStop(1, theme.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.save();
      for (let i = 0; i < 65; i++) {
        const x = (i * 97 + Math.sin(this.bgTime + i) * 20) % this.w;
        const y = (i * 53 + Math.cos(this.bgTime * 0.8 + i) * 12) % this.h;
        ctx.globalAlpha = this.mode === 'arena' ? 0.26 : 0.18;
        ctx.fillStyle = i % 3 === 0 ? theme.spark : '#ffffff';
        ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.7 : 1.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      const groundY = this.h * 0.72;
      const grd = ctx.createLinearGradient(0, groundY - 120, 0, this.h);
      grd.addColorStop(0, theme.ground1);
      grd.addColorStop(0.45, 'rgba(255,255,255,0.08)');
      grd.addColorStop(1, theme.ground2);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, groundY + Math.sin(this.bgTime) * 8);
      for (let x = 0; x <= this.w; x += 60) {
        ctx.lineTo(x, groundY + Math.sin(this.bgTime + x * 0.018) * 16);
      }
      ctx.lineTo(this.w, this.h);
      ctx.lineTo(0, this.h);
      ctx.closePath();
      ctx.fill();
    }

    drawHole(hole) {
      ctx.save();
      ctx.translate(hole.x, hole.y);
      ctx.scale(1.45, 0.55);
      const g = ctx.createRadialGradient(0, -4, hole.r * 0.15, 0, 0, hole.r);
      g.addColorStop(0, '#120a08');
      g.addColorStop(0.58, '#251511');
      g.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, hole.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();
      ctx.restore();
    }

    drawCoins() {
      for (const c of this.coins) {
        ctx.save();
        ctx.globalAlpha = clamp(c.life / 400, 0, 1);
        ctx.fillStyle = '#ffcf4d';
        ctx.strokeStyle = '#fff2a6';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6d4500';
        ctx.font = `${c.r * 1.25}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y + 0.5);
        ctx.restore();
      }
    }

    drawRipples() {
      for (const r of this.ripples) {
        ctx.save();
        ctx.globalAlpha = r.a;
        ctx.strokeStyle = `${r.color}${r.a})`;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }

    drawParticles() {
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = clamp(p.life / 450, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    drawTexts() {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const t of this.texts) {
        ctx.globalAlpha = clamp(t.life / 300, 0, 1);
        ctx.font = `900 ${Math.floor(22 * t.scale)}px Inter, Arial`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }

    drawItemBanner() {
      if (!this.itemBanner) return;
      const alpha = clamp(this.itemBanner.life / 350, 0, 1);
      const w = clamp(this.w * 0.48, 260, 520);
      const x = this.w / 2 - w / 2;
      const y = Math.min(this.h * 0.2 + 34, 178);
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(x, y, x + w, y + 54);
      g.addColorStop(0, 'rgba(8,17,31,.84)');
      g.addColorStop(1, 'rgba(77,225,255,.18)');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, w, 58, 20); ctx.fill();
      ctx.strokeStyle = this.itemBanner.color;
      ctx.lineWidth = 2;
      roundRect(ctx, x + 1, y + 1, w - 2, 56, 19); ctx.stroke();
      ctx.fillStyle = this.itemBanner.color;
      ctx.font = '1000 18px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.itemBanner.title, this.w / 2, y + 22);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 12px Inter, Arial';
      ctx.fillText(this.itemBanner.subtitle, this.w / 2, y + 42);
      ctx.restore();
    }

    drawStatusBar() {
      const barW = clamp(this.w * 0.32, 190, 360);
      const x = this.w / 2 - barW / 2;
      const y = this.h < 560 ? 72 : 78;
      const baseTime = this.sessionBaseTime || this.timeLeft || 100;
      const pct = clamp(this.timeLeft / baseTime, 0, 1);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      roundRect(ctx, x, y, barW, 16, 8); ctx.fill();
      const g = ctx.createLinearGradient(x, 0, x + barW, 0);
      g.addColorStop(0, '#64ff9a');
      g.addColorStop(0.55, '#ffcf4d');
      g.addColorStop(1, '#ff5470');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, barW * pct, 16, 8); ctx.fill();
      const theme = getModeTheme(this.mode);
      ctx.fillStyle = theme.chip;
      roundRect(ctx, this.w / 2 - 110, y - 46, 220, 24, 12); ctx.fill();
      ctx.fillStyle = theme.spark;
      ctx.font = '1000 12px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(theme.label.toUpperCase(), this.w / 2, y - 34);
      ctx.fillStyle = '#f6fbff';
      ctx.font = '900 13px Inter, Arial';
      ctx.textBaseline = 'bottom';
      const detail = this.mode === 'level'
        ? `Level ${this.level} • Target ${this.targetScore} • Misses ${this.misses}/${this.missLimit}`
        : this.mode === 'arena'
          ? `Arena • Rank #${this.getArenaRank()} • Time ${Math.ceil(this.timeLeft)}s • Misses ${this.misses}/${this.missLimit}`
          : this.mode === 'beginner'
            ? `Beginner • Practice Run • Time ${Math.ceil(this.timeLeft)}s • Misses ${this.misses}/${this.missLimit}`
            : `Classic • 100s High Score • Time ${Math.ceil(this.timeLeft)}s • Misses ${this.misses}/${this.missLimit}`;
      const assistSuffix = accessibilityOn() ? ' • Assist ON' : '';
      ctx.fillText(detail + assistSuffix, this.w / 2, y - 5);
      const effectLabels = [];
      if (this.effects.shield > 0) effectLabels.push(`Forgive ${Math.ceil(this.effects.shield / 1000)}s`);
      if (this.effects.magnet > 0) effectLabels.push(`Golden Bait ${Math.ceil(this.effects.magnet / 1000)}s`);
      if (this.effects.double > 0) effectLabels.push(`Combo x3 ${Math.ceil(this.effects.double / 1000)}s`);
      if (this.effects.speed > 0) effectLabels.push(`Slow-Mo ${Math.ceil(this.effects.speed / 1000)}s`);
      if (!this.effects.revived && (save.ownedItems.revive || 0) > 0) effectLabels.push('Second Chance Ready');
      if (effectLabels.length) {
        ctx.fillStyle = 'rgba(100,255,154,.16)';
        const chipW = clamp(effectLabels.join(' • ').length * 8 + 36, 210, this.w - 34);
        roundRect(ctx, this.w / 2 - chipW / 2, y + 22, chipW, 28, 14); ctx.fill();
        ctx.fillStyle = '#64ff9a';
        ctx.textBaseline = 'middle';
        ctx.fillText(effectLabels.join(' • '), this.w / 2, y + 36);
      }
      ctx.restore();
    }

    drawHammer() {
      const skin = skins.find(s => s.id === save.equippedSkin) || skins[0];
      const x = this.hammer.x;
      const y = this.hammer.y;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.hammer.angle);
      ctx.globalAlpha = 0.95;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4b2f22';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(18, 24); ctx.lineTo(52, 70); ctx.stroke();
      ctx.strokeStyle = skin.colors.hammer;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(52, 70); ctx.stroke();
      ctx.fillStyle = '#30242b';
      roundRect(ctx, -33, -24, 70, 32, 12); ctx.fill();
      const hg = ctx.createLinearGradient(-33, -24, 37, 8);
      hg.addColorStop(0, skin.colors.hammer);
      hg.addColorStop(1, '#ffffff');
      ctx.fillStyle = hg;
      roundRect(ctx, -26, -18, 58, 22, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      roundRect(ctx, -18, -14, 20, 6, 3); ctx.fill();
      ctx.restore();
    }
  }

  class Mole {
    constructor(hole, type, life, game) {
      this.hole = hole;
      this.type = type;
      this.game = game;
      this.life = life;
      this.maxLife = life;
      this.phase = 'rise';
      this.t = 0;
      this.hitTime = 0;
      this.dead = false;
      this.pop = 0;
      this.x = hole.x;
      this.y = hole.y;
      this.seed = Math.random() * 100;
    }
    update(dt) {
      this.t += dt;
      if (this.phase === 'rise') {
        this.pop = clamp(this.t / 190, 0, 1);
        if (this.pop >= 1) { this.phase = 'up'; this.t = 0; }
      } else if (this.phase === 'up') {
        this.life -= dt;
        if (this.life <= 0) { this.phase = 'hide'; this.t = 0; }
      } else if (this.phase === 'hit') {
        this.hitTime += dt;
        this.pop = clamp(1 - this.hitTime / 420, 0, 1);
        if (this.hitTime > 500) this.dead = true;
      } else if (this.phase === 'hide') {
        this.pop = clamp(1 - this.t / 210, 0, 1);
        if (this.pop <= 0) {
          if (this.type !== 'bad') this.game.registerMiss(this.x, this.y, 'Escaped!');
          this.dead = true;
        }
      }
    }
    isHittable() { return this.phase === 'up' || this.phase === 'rise'; }
    hit() { this.phase = 'hit'; this.hitTime = 0; this.pop = 1; }
    draw(ctx) {
      const skin = skins.find(s => s.id === save.equippedSkin) || skins[0];
      const r = this.hole.r;
      const pop = easeOutBack(this.pop);
      const bodyY = this.hole.y + r * 0.18 - pop * r * 1.2;
      const scale = this.phase === 'hit' ? 1 + Math.sin(this.hitTime * 0.04) * 0.05 : 1;
      this.x = this.hole.x;
      this.y = bodyY;
      ctx.save();
      ctx.translate(this.hole.x, bodyY);
      ctx.scale(scale, scale);
      const typeAccent = this.type === 'gold' ? '#ffdf64' : this.type === 'bad' ? '#ff5470' : this.type === 'fast' ? '#64ff9a' : skin.colors.accent;
      ctx.globalAlpha = clamp(pop + 0.1, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(0, r * 1.02, r * 0.72, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      if (this.phase === 'hit') {
        ctx.fillStyle = 'rgba(255,84,112,.18)';
        ctx.beginPath(); ctx.arc(0, r * -0.1, r * 1.08, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = skin.colors.head;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.64, Math.PI, 0); ctx.lineTo(r * 0.64, r * 0.62); ctx.quadraticCurveTo(0, r * 0.85, -r * 0.64, r * 0.62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = skin.colors.face;
      ctx.beginPath(); ctx.ellipse(0, r * 0.26, r * 0.42, r * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      // ears
      ctx.fillStyle = skin.colors.head;
      ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.18, r * 0.2, 0, Math.PI * 2); ctx.arc(r * 0.45, -r * 0.18, r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = skin.colors.face;
      ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.18, r * 0.11, 0, Math.PI * 2); ctx.arc(r * 0.45, -r * 0.18, r * 0.11, 0, Math.PI * 2); ctx.fill();
      // eyes
      ctx.fillStyle = '#0d1320';
      const eyeY = this.phase === 'hit' ? -r * 0.04 : -r * 0.02;
      if (this.phase === 'hit') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0d1320';
        ctx.beginPath(); ctx.moveTo(-r * 0.28, eyeY - 5); ctx.lineTo(-r * 0.14, eyeY + 5); ctx.moveTo(-r * 0.14, eyeY - 5); ctx.lineTo(-r * 0.28, eyeY + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r * 0.14, eyeY - 5); ctx.lineTo(r * 0.28, eyeY + 5); ctx.moveTo(r * 0.28, eyeY - 5); ctx.lineTo(r * 0.14, eyeY + 5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(-r * 0.22, eyeY, r * 0.055, 0, Math.PI * 2); ctx.arc(r * 0.22, eyeY, r * 0.055, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#5d3324';
      ctx.beginPath(); ctx.ellipse(0, r * 0.18, r * 0.11, r * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5d3324';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, r * 0.24); ctx.quadraticCurveTo(-r * 0.12, r * 0.34, -r * 0.24, r * 0.27); ctx.moveTo(0, r * 0.24); ctx.quadraticCurveTo(r * 0.12, r * 0.34, r * 0.24, r * 0.27); ctx.stroke();
      // type icon / helmet
      ctx.fillStyle = typeAccent;
      if (this.type === 'bad') {
        ctx.beginPath(); ctx.moveTo(-r * 0.42, -r * 0.54); ctx.lineTo(-r * 0.14, -r * 0.28); ctx.lineTo(-r * 0.5, -r * 0.18); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r * 0.42, -r * 0.54); ctx.lineTo(r * 0.14, -r * 0.28); ctx.lineTo(r * 0.5, -r * 0.18); ctx.closePath(); ctx.fill();
      } else {
        roundRect(ctx, -r * 0.25, -r * 0.64, r * 0.5, r * 0.18, r * 0.08); ctx.fill();
      }
      if (this.type === 'gold') {
        ctx.fillStyle = '#fff3a8';
        ctx.font = `900 ${r * 0.25}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, -r * 0.52);
      }
      // tears and bump on hit
      if (highContrastOn() && this.phase !== 'hit') {
        const labelMap = { gold: 'GOLD', bad: 'TRAP', fast: 'FAST', normal: 'HIT' };
        const colorMap = { gold: '#ffe36b', bad: '#ff6f87', fast: '#77ffaf', normal: '#70f1ff' };
        ctx.save();
        ctx.globalAlpha = clamp(pop, 0, 1);
        ctx.strokeStyle = colorMap[this.type] || '#70f1ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.76, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = colorMap[this.type] || '#70f1ff';
        roundRect(ctx, -r * 0.42, r * 0.72, r * 0.84, r * 0.25, r * 0.09);
        ctx.fill();
        ctx.fillStyle = this.type === 'bad' ? '#19060b' : '#04131f';
        ctx.font = `1000 ${Math.max(10, r * 0.16)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelMap[this.type] || 'HIT', 0, r * 0.85);
        ctx.restore();
      }
      if (this.phase === 'hit') {
        ctx.fillStyle = '#74dcff';
        ctx.beginPath(); ctx.ellipse(-r * 0.31, r * 0.18 + this.hitTime * 0.02, r * 0.055, r * 0.12, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(r * 0.31, r * 0.2 + this.hitTime * 0.018, r * 0.055, r * 0.12, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6c8c';
        ctx.beginPath(); ctx.arc(0, -r * 0.68, r * 0.12 + Math.sin(this.hitTime * 0.04) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.beginPath(); ctx.arc(-r * 0.04, -r * 0.71, r * 0.035, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  const game = new MoleGame();

  function isLoggedIn() {
    return !!(currentUser && accounts[currentUser]);
  }

  function modeDisplayName(mode, level = 1) {
    if (mode === 'level') return `Level ${level}`;
    if (mode === 'arena') return 'Arena';
    if (mode === 'beginner') return 'Beginner';
    return 'Classic';
  }

  function modeButtonLabel(mode) {
    if (mode === 'arena') return 'Enter Arena';
    if (mode === 'level') return 'Select Level';
    return 'Play Classic';
  }

  function getModeTheme(mode) {
    const themes = {
      beginner: { top: '#0b2542', mid: '#143a47', bottom: '#12342d', ground1: 'rgba(76,185,115,0.14)', ground2: 'rgba(56,148,87,0.52)', spark: '#64ff9a', label: 'Beginner Training', chip: 'rgba(100,255,154,.17)' },
      classic: { top: '#09172a', mid: '#102e40', bottom: '#0a201f', ground1: 'rgba(45,154,116,0.08)', ground2: 'rgba(55,139,77,0.72)', spark: '#43e3ff', label: 'Classic High Score', chip: 'rgba(67,227,255,.16)' },
      arena: { top: '#170c2f', mid: '#371345', bottom: '#111b3a', ground1: 'rgba(255,84,112,0.12)', ground2: 'rgba(117,48,147,0.68)', spark: '#ff5470', label: 'Arena Rival Rush', chip: 'rgba(255,84,112,.18)' },
      level: { top: '#072622', mid: '#0f433f', bottom: '#0b1f31', ground1: 'rgba(255,207,77,0.11)', ground2: 'rgba(30,125,99,0.72)', spark: '#ffcf4d', label: 'Level Target Run', chip: 'rgba(255,207,77,.18)' }
    };
    return themes[mode] || themes.classic;
  }

  function getMainStartMode() {
    return isLoggedIn() ? (game.mode && game.mode !== 'beginner' ? game.mode : 'classic') : 'beginner';
  }

  function requireLoginForMode(mode) {
    if (isLoggedIn() || mode === 'beginner') return true;
    const message = 'Register or log in to unlock Classic, Arena, and Level modes.';
    setAuthMessage(message, 'error');
    audio.play('locked');
    toast(message);
    return false;
  }

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    if (id !== 'gameScreen') {
      game.running = false;
      game.activeLoopToken += 1;
      pointer.down = false;
      pointer.active = false;
      keyState.clear();
      audio.stopMusic();
      canvas.style.cursor = 'auto';
      document.getElementById('gameScreen').classList.add('menu-cursor');
    }
    updateAllUI();
  }


  function setAuthMessage(message, type = 'info') {
    if (!UI.authMessage) return;
    UI.authMessage.textContent = message || '';
    UI.authMessage.classList.toggle('error', type === 'error');
    UI.authMessage.classList.toggle('success', type === 'success');
  }

  function updateAuth() {
    if (!UI.authStatus) return;
    const loggedIn = isLoggedIn();
    UI.authCard?.classList.toggle('signed-in', loggedIn);
    UI.authCard?.classList.toggle('guest-account', !loggedIn);

    if (loggedIn) {
      UI.authStatus.textContent = `Signed in: ${accounts[currentUser].email}`;
      if (UI.authForm) {
        UI.authForm.hidden = true;
        UI.authForm.style.display = 'none';
      }
      UI.logoutBtn.hidden = false;
      setGroupActive('.auth-actions', null);
      if (UI.startGameBtn) {
        UI.startGameBtn.textContent = 'Start Game';
        UI.startGameBtn.title = 'Start the selected game mode.';
      }
      setAuthMessage('Signed in. Your progress is saved under this account.', 'success');
    } else {
      UI.authStatus.textContent = 'Guest Mode';
      if (UI.authForm) {
        UI.authForm.hidden = false;
        UI.authForm.style.display = '';
      }
      UI.logoutBtn.hidden = true;
      if (UI.startGameBtn) {
        UI.startGameBtn.textContent = 'Beginner Mode';
        UI.startGameBtn.title = 'Start a beginner run without logging in.';
      }
      const authDefault = activeAuthAction === 'register' ? UI.registerBtn : UI.loginBtn;
      setGroupActive('.auth-actions', authDefault);
      setAuthMessage('Enter email and password, then choose Log In or Register.', 'info');
    }
  }

  function updateHome() {
    UI.playerNameInput.value = save.playerName || 'Player';
    UI.homeCoins.textContent = save.coins || 0;
    UI.homeBest.textContent = save.bestScore || 0;
    UI.homeSkin.textContent = (skins.find(s => s.id === save.equippedSkin) || skins[0]).name;
  }

  function updateHUD() {
    UI.hudScore.textContent = game.score;
    UI.hudBest.textContent = save.bestScore || 0;
    UI.hudCoins.textContent = (save.coins || 0) + game.coinsEarned;
    UI.hudMode.textContent = modeDisplayName(game.mode, game.level);
    updateMiniLeaderboard();
  }

  function updateMiniLeaderboard() {
    const player = { name: shortName(save.playerName), score: game.score };
    const rows = game.mode === 'arena'
      ? [player, ...game.ai.map(a => ({ name: a.name, score: Math.floor(a.score) }))].sort((a, b) => b.score - a.score)
      : [player, ...save.leaderboard.slice(0, 4).map(r => ({ name: r.name, score: r.score }))].sort((a, b) => b.score - a.score).slice(0, 5);
    UI.miniLeaderboard.innerHTML = rows.map(r => `<li><span>${escapeHTML(r.name)}</span><b>${Math.floor(r.score)}</b></li>`).join('');
  }

  function updateShop() {
    UI.shopCoins.textContent = save.coins || 0;
    const signedIn = isLoggedIn();
    const paymentMethodCards = paymentMethods.map(method => {
      const active = currentPaymentType === method.type;
      return `
        <button type="button" class="payment-method-card ${active ? 'ui-active' : ''}" data-payment-type="${method.type}" ${signedIn ? '' : 'disabled'} aria-pressed="${active ? 'true' : 'false'}">
          <span class="method-icon">${method.icon}</span>
          <span class="method-copy">
            <b>${method.label}</b>
            <small>${method.hint}</small>
          </span>
          <span class="method-badge">${method.badge}</span>
        </button>`;
    }).join('');
    document.getElementById('coinsShop').innerHTML = `
      <div class="payment-box ${signedIn ? '' : 'payment-locked'}">
        <div class="payment-copy">
          <span class="payment-kicker">Payment Method</span>
          <h3>${signedIn ? 'Choose How to Pay' : 'Account Required for Coin Purchases'}</h3>
          <p>${signedIn
            ? 'Select a checkout method first, then choose a coin pack. Purchased coins are saved to your signed-in account.'
            : 'Beginner Mode can be played without login, but paid coins must be tied to a registered account so they do not get lost.'}</p>
        </div>
        <div class="payment-method-grid" role="radiogroup" aria-label="Payment method">
          ${paymentMethodCards}
        </div>
      </div>
      <div class="shop-card-grid">
        ${coinPacks.map(pack => `
          <article class="shop-card ${signedIn ? '' : 'locked-card'}">
            <div class="emoji">${pack.emoji}</div>
            <h3>${pack.name}</h3>
            <p>${pack.desc}</p>
            <div class="price"><span>${pack.price}</span><span>${pack.coins} Coins</span></div>
            <button type="button" class="btn primary small ${signedIn ? '' : 'login-required'}" data-buy-pack="${pack.id}">${signedIn ? 'Pay Now' : 'Log In to Buy'}</button>
          </article>
        `).join('')}
      </div>
    `;
    document.getElementById('itemsShop').innerHTML = `
      <div class="item-usage-panel">
        <div>
          <span class="payment-kicker">Item Guide</span>
          <h3>Use items without blocking the play field</h3>
          <p>Buy items here. During a run, use the compact item dock on the left side of PC screens or above the mobile controls. You can also press 1-5 on PC.</p>
        </div>
        <div class="item-shortcut-grid">
          <span><b>1</b> Forgive</span><span><b>2</b> Bait</span><span><b>3</b> Combo</span><span><b>4</b> Stun</span><span><b>5</b> Slow-Mo</span><span><b>Auto</b> Second Chance</span>
        </div>
      </div>
      <div class="shop-card-grid item-card-grid">
        ${Object.entries(itemDefs).map(([id, item]) => `
          <article class="shop-card item-shop-card">
            <div class="emoji">${item.emoji}</div>
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <p class="item-use-copy"><b>Use:</b> ${item.how}</p>
            <div class="price"><span>${item.cost} Coins</span><span>${item.shortcut === 'Auto' ? 'Auto-use' : `Shortcut ${item.shortcut}`} • Owned: ${save.ownedItems[id] || 0}</span></div>
            <button type="button" class="btn primary small" data-buy-item="${id}">Buy</button>
          </article>
        `).join('')}
      </div>
    `;
    document.getElementById('skinsShop').innerHTML = skins.map(skin => {
      const owned = save.ownedSkins.includes(skin.id);
      const equipped = save.equippedSkin === skin.id;
      const action = equipped ? 'Equipped' : owned ? 'Equip' : `Unlock ${skin.cost}`;
      return `
        <article class="shop-card">
          <div class="emoji" style="background:linear-gradient(135deg, ${skin.colors.head}, ${skin.colors.accent});">${skin.emoji}</div>
          <h3>${skin.name}</h3>
          <p>${skin.desc}</p>
          <div class="price"><span>${skin.cost ? skin.cost + ' Coins' : 'Free'}</span><span>${owned ? 'Owned' : 'Locked'}</span></div>
          <button type="button" class="btn ${equipped ? '' : 'primary'} small" data-skin-action="${skin.id}" ${equipped ? 'disabled' : ''}>${action}</button>
        </article>
      `;
    }).join('');
  }

  function updateLeaderboard() {
    const rows = [...save.leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
    UI.leaderboardBody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>#${i + 1}</td>
        <td>${escapeHTML(r.isLocal ? shortName(save.playerName) : r.name)}</td>
        <td>${escapeHTML(r.mode || 'Classic')}</td>
        <td><b>${Math.floor(r.score)}</b></td>
        <td>${formatDate(r.date || Date.now())}</td>
      </tr>
    `).join('');
  }

  function updateSettings() {
    UI.musicToggle.checked = !!save.settings.music;
    UI.sfxToggle.checked = !!save.settings.sfx;
    if (UI.accessibilityToggle) UI.accessibilityToggle.checked = !!save.settings.accessibility;
    if (UI.contrastToggle) UI.contrastToggle.checked = !!save.settings.highContrast;
    if (UI.motionToggle) UI.motionToggle.checked = !!save.settings.reduceMotion;
    applyAccessibilitySettings();
  }

  function updateLevels() {
    if (!isLoggedIn()) {
      UI.levelGrid.innerHTML = '<div class="level-login-lock">🔒 Register or log in to unlock Level Mode, level targets, and saved stars.</div>';
      return;
    }
    const unlocked = save.levelProgress.unlocked || 1;
    UI.levelGrid.innerHTML = levels.map(cfg => {
      const locked = cfg.level > unlocked;
      const starCount = save.levelProgress.stars[cfg.level] || 0;
      return `<button type="button" class="level-tile ${locked ? 'locked' : ''}" data-level="${cfg.level}" ${locked ? 'disabled' : ''}>
        <span>Level ${cfg.level}</span><span class="stars">${'★'.repeat(starCount)}${'☆'.repeat(3 - starCount)}</span>
      </button>`;
    }).join('');
  }

  function updateModeAccess() {
    const loggedIn = isLoggedIn();
    document.querySelectorAll('[data-mode-start]').forEach(btn => {
      const mode = btn.dataset.modeStart;
      const locked = !loggedIn && mode !== 'beginner';
      const card = btn.closest('.mode-card');
      card?.classList.toggle('locked-mode', locked);
      card?.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.textContent = locked ? 'Log In to Play' : modeButtonLabel(mode);
      btn.classList.toggle('primary', !locked);
      btn.classList.toggle('ghost', locked);
      btn.title = locked ? 'Register or log in to unlock this mode.' : '';
    });
    syncModeVisualSelection();
  }

  function updateAllUI() {
    updateAuth();
    updateHome();
    updateShop();
    updateLeaderboard();
    updateSettings();
    updateDailyRewardUI();
    updateLevels();
    updateModeAccess();
    syncDefaultButtonStates();
    if (game.running) {
      updateHUD();
      game.updateItemButtons();
    }
  }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function syncName() {
    const name = UI.playerNameInput.value.trim() || 'Player';
    save.playerName = shortName(name);
    save.leaderboard = save.leaderboard.map(row => row.isLocal ? { ...row, name: save.playerName } : row);
    if (currentUser && accounts[currentUser]) {
      accounts[currentUser].playerName = save.playerName;
      saveAccounts();
    }
    persist();
  }

  function isoDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function isDailyRewardClaimedToday() {
    return !!(save.dailyReward && save.dailyReward.claimedDate === todayISO());
  }

  function updateDailyRewardUI() {
    if (!UI.dailyRewardCard) return;
    const loggedIn = isLoggedIn();
    const claimed = loggedIn && isDailyRewardClaimedToday();
    const streak = Number(save.dailyReward?.streak || 0);

    UI.dailyRewardCard.classList.toggle('locked', !loggedIn);
    UI.dailyRewardCard.classList.toggle('claimable', loggedIn && !claimed);
    UI.dailyRewardCard.classList.toggle('claimed', claimed);

    if (!loggedIn) {
      UI.dailyRewardTitle.textContent = 'Log in to claim coins';
      UI.dailyRewardDesc.textContent = 'Daily rewards are tied to your registered account so coins will not be stored in a temporary guest save.';
      UI.dailyRewardBtn.textContent = 'Log In to Claim';
      UI.dailyRewardBtn.disabled = false;
      UI.dailyRewardBtn.classList.add('primary');
      return;
    }

    if (claimed) {
      UI.dailyRewardTitle.textContent = `Claimed Today: +${DAILY_REWARD_AMOUNT} Coins`;
      UI.dailyRewardDesc.textContent = `Come back tomorrow for another reward. Current streak: ${streak || 1} day${(streak || 1) > 1 ? 's' : ''}.`;
      UI.dailyRewardBtn.textContent = 'Claimed';
      UI.dailyRewardBtn.disabled = true;
      UI.dailyRewardBtn.classList.remove('primary');
      return;
    }

    UI.dailyRewardTitle.textContent = `Ready to Claim: +${DAILY_REWARD_AMOUNT} Coins`;
    UI.dailyRewardDesc.textContent = `Collect once per calendar day. Current streak: ${streak || 0} day${(streak || 0) === 1 ? '' : 's'}.`;
    UI.dailyRewardBtn.textContent = `Claim +${DAILY_REWARD_AMOUNT}`;
    UI.dailyRewardBtn.disabled = false;
    UI.dailyRewardBtn.classList.add('primary');
  }

  function claimDailyReward({ silent = false } = {}) {
    if (!isLoggedIn()) {
      updateDailyRewardUI();
      if (!silent) {
        setAuthMessage('Please register or log in to claim the daily reward.', 'error');
        toast('Log in to claim daily coins.');
      }
      return false;
    }

    const today = todayISO();
    if (isDailyRewardClaimedToday()) {
      updateDailyRewardUI();
      if (!silent) toast('Daily reward already claimed today.');
      return false;
    }

    const previousClaimDate = save.dailyReward?.claimedDate || '';
    const yesterday = isoDateOffset(-1);
    const previousStreak = Number(save.dailyReward?.streak || 0);
    const nextStreak = previousClaimDate === yesterday ? previousStreak + 1 : 1;

    save.dailyReward = {
      ...(save.dailyReward || {}),
      claimed: true,
      amount: DAILY_REWARD_AMOUNT,
      claimedDate: today,
      streak: nextStreak,
      lastClaimAt: Date.now()
    };
    save.lastLoginDate = today;
    save.coins = Number(save.coins || 0) + DAILY_REWARD_AMOUNT;
    persist();
    updateDailyRewardUI();
    updateHome();
    updateShop();
    audio.play('coin');
    if (!silent) toast(`Daily login reward: +${DAILY_REWARD_AMOUNT} Coins!`);
    else toast(`Daily login reward claimed: +${DAILY_REWARD_AMOUNT} Coins!`);
    return true;
  }


  function getAuthInput() {
    return {
      email: normalizeEmail(UI.authEmailInput.value),
      password: UI.authPasswordInput.value || ''
    };
  }

  function validateAuthInput(email, password) {
    if (!isValidEmail(email)) {
      setAuthMessage('Please enter a valid email address.', 'error');
      toast('Enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setAuthMessage('Password must be at least 6 characters.', 'error');
      toast('Password must be at least 6 characters.');
      return false;
    }
    return true;
  }

  function switchAccount(email) {
    currentUser = normalizeEmail(email);
    if (currentUser) localStorage.setItem(CURRENT_USER_KEY, currentUser);
    else localStorage.removeItem(CURRENT_USER_KEY);
    save = loadSave();
    if (currentUser) claimDailyReward({ silent: true });
    updateAllUI();
  }

  function registerAccount() {
    const { email, password } = getAuthInput();
    if (!validateAuthInput(email, password)) return;
    if (accounts[email]) {
      setAuthMessage('This email is already registered. Please log in.', 'error');
      return toast('This email is already registered. Please log in.');
    }
    const nickname = shortName(UI.playerNameInput.value.trim() || email.split('@')[0] || 'Player');
    const accountSave = JSON.parse(JSON.stringify(save));
    accountSave.playerName = nickname;
    accountSave.leaderboard = Array.isArray(accountSave.leaderboard)
      ? accountSave.leaderboard.map(row => row.isLocal ? { ...row, name: nickname } : row)
      : defaultSave().leaderboard;
    accounts[email] = { email, password: passwordHash(email, password), playerName: nickname, createdAt: Date.now(), lastLoginAt: Date.now() };
    saveAccounts();
    localStorage.setItem(currentSaveKey(email), JSON.stringify(accountSave));
    UI.authPasswordInput.value = '';
    switchAccount(email);
    setAuthMessage('Account registered. You are now signed in.', 'success');
    audio.play('login');
    toast('Account registered. Your progress is now saved to this login.');
  }

  function loginAccount() {
    const { email, password } = getAuthInput();
    if (!validateAuthInput(email, password)) return;
    const account = accounts[email];
    if (!account || account.password !== passwordHash(email, password)) {
      setAuthMessage('Incorrect email or password.', 'error');
      return toast('Incorrect email or password.');
    }
    account.lastLoginAt = Date.now();
    saveAccounts();
    UI.authPasswordInput.value = '';
    switchAccount(email);
    setAuthMessage('Logged in successfully.', 'success');
    audio.play('login');
    toast('Logged in successfully.');
  }

  function logoutAccount() {
    activeAuthAction = 'login';
    syncName();
    game.mode = 'beginner';
    game.level = 1;
    switchAccount('');
    setAuthMessage('Logged out. Beginner Mode is active now.', 'info');
    audio.play('back');
    toast('Logged out. Beginner Mode is active now.');
  }


  function getActiveScreenId() {
    return document.querySelector('.screen.active')?.id || 'startScreen';
  }

  let activeHomeButton = null;
  let activeAuthAction = 'login';

  function getDefaultHomeButton() {
    return UI.startGameBtn || document.querySelector('.home-actions .btn');
  }

  function setHomeButtonActive(btn) {
    const group = document.querySelector('.home-actions');
    if (!group) return;
    const target = btn && group.contains(btn) && !btn.disabled ? btn : getDefaultHomeButton();
    group.querySelectorAll('.btn.ui-active').forEach(el => el.classList.remove('ui-active'));
    if (target) {
      target.classList.add('ui-active');
      activeHomeButton = target;
    }
  }

  function getActiveHomeButton() {
    if (activeHomeButton && document.body.contains(activeHomeButton) && !activeHomeButton.disabled) return activeHomeButton;
    return getDefaultHomeButton();
  }

  function setGroupActive(groupSelector, activeEl) {
    const group = document.querySelector(groupSelector);
    if (!group) return;
    group.querySelectorAll('.ui-active').forEach(el => el.classList.remove('ui-active'));
    if (activeEl && !activeEl.disabled) activeEl.classList.add('ui-active');
  }

  function getButtonGroup(btn) {
    if (!btn) return null;
    return btn.closest('.auth-actions, .home-actions, .shop-tabs, .cards, .shop-list, .level-grid, .settings-card');
  }

  function shouldKeepButtonActive(btn) {
    if (!btn || btn.disabled) return false;
    if (btn.matches('[data-move], #mobileSkillBtn, .skill-btn, .item-btn, .hud-button, .icon-btn')) return false;
    return btn.matches('.btn, .tab');
  }

  function setPersistentButtonActive(btn) {
    if (!shouldKeepButtonActive(btn)) return;
    const group = getButtonGroup(btn);
    if (!group) return;
    if (group.classList.contains('home-actions')) {
      setHomeButtonActive(btn);
      return;
    }
    group.querySelectorAll('.ui-active').forEach(el => {
      if (el !== btn && shouldKeepButtonActive(el)) el.classList.remove('ui-active');
    });
    btn.classList.add('ui-active');
  }

  function syncModeVisualSelection(forcedMode = null) {
    const formalModes = ['classic', 'arena', 'level'];
    let selectedMode = forcedMode || (formalModes.includes(game.mode) ? game.mode : 'classic');
    if (!isLoggedIn()) selectedMode = null;

    document.querySelectorAll('.mode-card').forEach(card => {
      card.classList.toggle('selected', !!selectedMode && card.dataset.mode === selectedMode);
    });
    document.querySelectorAll('[data-mode-start]').forEach(btn => {
      const active = !!selectedMode && btn.dataset.modeStart === selectedMode && !btn.classList.contains('ghost');
      btn.classList.toggle('ui-active', active);
    });
  }

  function updatePersistentModeButton(mode) {
    syncModeVisualSelection(mode);
  }

  function syncShopTabState() {
    const activeTab = document.querySelector('.shop-tabs .tab.active') || document.querySelector('[data-shop-tab="coins"]');
    document.querySelectorAll('.shop-tabs .tab').forEach(tab => {
      tab.classList.toggle('ui-active', tab === activeTab);
    });
  }

  function syncDefaultButtonStates() {
    const screenId = getActiveScreenId();

    // Login/Register has a clear default: Log In. Register stays highlighted only after the user chooses it.
    if (!isLoggedIn() && UI.authForm && !UI.authForm.hidden) {
      const activeAuthButton = activeAuthAction === 'register' ? UI.registerBtn : UI.loginBtn;
      setGroupActive('.auth-actions', activeAuthButton);
    } else {
      setGroupActive('.auth-actions', null);
    }

    // The home screen keeps one clear selected action. Fresh loads default to Beginner Mode / Start Game;
    // after the user chooses Mode Select / Shop / Leaderboard / Settings, that chosen button remains selected.
    if (screenId === 'startScreen') {
      setHomeButtonActive(getActiveHomeButton());
    }

    // Shop defaults to Coin Packs unless the user has selected another visible tab.
    if (screenId === 'shopScreen') {
      syncShopTabState();
    }

    // Mode Select defaults to Classic for signed-in users; guests see locked cards without a fake selection.
    if (screenId === 'modeScreen') {
      syncModeVisualSelection();
    }
  }

  function clearHiddenPanelButtonState() {
    syncDefaultButtonStates();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn && !btn.disabled) {
      setPersistentButtonActive(btn);
      btn.classList.add('clicked');
      setTimeout(() => btn.classList.remove('clicked'), 160);
      audio.play('click');
    }

    const authBtn = e.target.closest('[data-auth]');
    if (authBtn) {
      e.preventDefault();
      const action = authBtn.dataset.auth;
      if (action === 'register') {
        activeAuthAction = 'register';
        setGroupActive('.auth-actions', UI.registerBtn);
        registerAccount();
      }
      if (action === 'login') {
        activeAuthAction = 'login';
        setGroupActive('.auth-actions', UI.loginBtn);
        loginAccount();
      }
      if (action === 'logout') {
        activeAuthAction = 'login';
        logoutAccount();
      }
      return;
    }

    const screenTarget = e.target.closest('[data-screen]');
    if (screenTarget) {
      syncName();
      const homeButton = screenTarget.closest('.home-actions .btn');
      if (homeButton) setHomeButtonActive(homeButton);
      showScreen(screenTarget.dataset.screen);
      clearHiddenPanelButtonState();
      if (screenTarget.dataset.screen === 'modeScreen' && !isLoggedIn()) {
        toast('Only Beginner Mode is available before login. Register or log in to unlock more modes.');
      }
    }
    const start = e.target.closest('[data-action="start-game"]');
    if (start) {
      syncName();
      setHomeButtonActive(start);
      const startMode = getMainStartMode();
      showScreen('gameScreen');
      clearHiddenPanelButtonState();
      game.start(startMode, startMode === 'level' ? (game.level || 1) : 1);
    }
    const modeStart = e.target.closest('[data-mode-start]');
    if (modeStart) {
      syncName();
      const mode = modeStart.dataset.modeStart;
      if (!requireLoginForMode(mode)) return;
      updatePersistentModeButton(mode);
      game.mode = mode;
      if (mode === 'level') {
        toast('Choose an unlocked level below.');
      } else {
        showScreen('gameScreen');
        clearHiddenPanelButtonState();
        game.start(mode, 1);
      }
    }
    const levelTile = e.target.closest('[data-level]');
    if (levelTile && !levelTile.disabled) {
      syncName();
      if (!requireLoginForMode('level')) return;
      const level = Number(levelTile.dataset.level) || 1;
      game.level = level;
      updatePersistentModeButton('level');
      showScreen('gameScreen');
      clearHiddenPanelButtonState();
      game.start('level', level);
    }
    const tab = e.target.closest('[data-shop-tab]');
    if (tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.shop-panel').forEach(panel => panel.classList.remove('active'));
      document.getElementById(`${tab.dataset.shopTab}Shop`).classList.add('active');
      syncShopTabState();
    }
    const payTypeBtn = e.target.closest('[data-payment-type]');
    if (payTypeBtn && !payTypeBtn.disabled) {
      setPaymentType(payTypeBtn.dataset.paymentType);
      toast(`${paymentMethods.find(m => m.type === currentPaymentType)?.label || 'Payment method'} selected.`);
    }
    const dailyBtn = e.target.closest('[data-claim-daily]');
    if (dailyBtn) {
      if (!isLoggedIn()) {
        setHomeButtonActive(UI.startGameBtn);
        setGroupActive('.auth-actions', UI.loginBtn);
        activeAuthAction = 'login';
        setAuthMessage('Please log in or register to claim your daily reward.', 'error');
        UI.authEmailInput?.focus();
        toast('Log in to claim daily coins.');
      } else {
        claimDailyReward();
      }
    }
    const packBtn = e.target.closest('[data-buy-pack]');
    if (packBtn) buyPack(packBtn.dataset.buyPack);
    const itemBtn = e.target.closest('[data-buy-item]');
    if (itemBtn) buyItem(itemBtn.dataset.buyItem);
    const skinBtn = e.target.closest('[data-skin-action]');
    if (skinBtn) skinAction(skinBtn.dataset.skinAction);
    const gameItem = e.target.closest('.item-btn[data-item]');
    if (gameItem) game.useItem(gameItem.dataset.item);
  });

  [UI.authEmailInput, UI.authPasswordInput].forEach(input => {
    input?.addEventListener('keydown', evt => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        loginAccount();
      }
    });
    input?.addEventListener('input', () => setAuthMessage('Enter email and password, then choose Log In or Register.', 'info'));
  });

  document.getElementById('pauseBtn').addEventListener('click', () => game.paused ? game.resume() : game.pause());
  document.getElementById('resumeBtn').addEventListener('click', () => game.resume());
  document.getElementById('restartFromPauseBtn').addEventListener('click', () => { UI.pauseOverlay.classList.add('hidden'); game.start(game.mode, game.level); });
  document.getElementById('homeFromPauseBtn').addEventListener('click', () => { UI.pauseOverlay.classList.add('hidden'); showScreen('startScreen'); });
  document.getElementById('restartBtn').addEventListener('click', () => { pointer.down = false; pointer.active = false; keyState.clear(); UI.gameOverOverlay.classList.add('hidden'); showScreen('gameScreen'); game.start(game.mode, game.level); });
  document.getElementById('homeBtn').addEventListener('click', () => { pointer.down = false; pointer.active = false; keyState.clear(); UI.gameOverOverlay.classList.add('hidden'); showScreen('startScreen'); });
  document.getElementById('mobileSkillBtn').addEventListener('click', () => game.whack());

  UI.playerNameInput.addEventListener('change', () => { syncName(); updateAllUI(); });
  UI.playerNameInput.addEventListener('blur', () => { syncName(); updateAllUI(); });
  UI.musicToggle.addEventListener('change', () => {
    save.settings.music = UI.musicToggle.checked;
    persist();
    if (save.settings.music && game.running && !game.paused) audio.startMusic(); else audio.stopMusic();
  });
  UI.sfxToggle.addEventListener('change', () => { save.settings.sfx = UI.sfxToggle.checked; persist(); });
  UI.accessibilityToggle?.addEventListener('change', () => {
    save.settings.accessibility = UI.accessibilityToggle.checked;
    persist();
    applyAccessibilitySettings();
    if (game.running) {
      game.missLimit += save.settings.accessibility ? 2 : -2;
      game.missLimit = Math.max(2, game.missLimit);
      game.updateItemButtons();
      updateHUD();
    }
    toast(save.settings.accessibility ? 'Accessibility Mode enabled.' : 'Accessibility Mode disabled.');
  });
  UI.contrastToggle?.addEventListener('change', () => {
    save.settings.highContrast = UI.contrastToggle.checked;
    persist();
    applyAccessibilitySettings();
    toast(save.settings.highContrast ? 'High Contrast Targets enabled.' : 'High Contrast Targets disabled.');
  });
  UI.motionToggle?.addEventListener('change', () => {
    save.settings.reduceMotion = UI.motionToggle.checked;
    persist();
    applyAccessibilitySettings();
    if (save.settings.reduceMotion) game.shake = 0;
    toast(save.settings.reduceMotion ? 'Reduced Motion enabled.' : 'Reduced Motion disabled.');
  });
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('Reset all local game data?')) {
      localStorage.removeItem(currentSaveKey());
      save = defaultSave();
      if (currentUser && accounts[currentUser]) save.playerName = accounts[currentUser].playerName || save.playerName;
      persist();
      updateAllUI();
      toast('Local data reset.');
    }
  });

  function selectedPaymentType() {
    const activeCard = document.querySelector('.payment-method-card.ui-active[data-payment-type]');
    const type = Number(activeCard?.dataset.paymentType || currentPaymentType || 8004);
    return paymentMethods.some(method => method.type === type) ? type : 8004;
  }

  function setPaymentType(type) {
    const normalized = Number(type);
    if (!paymentMethods.some(method => method.type === normalized)) return;
    currentPaymentType = normalized;
    document.querySelectorAll('.payment-method-card[data-payment-type]').forEach(card => {
      const active = Number(card.dataset.paymentType) === currentPaymentType;
      card.classList.toggle('ui-active', active);
      card.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function paymentReturnUrl(status, packId, orderId) {
    try {
      const base = `${window.location.origin}${window.location.pathname}`;
      const url = new URL(base);
      url.searchParams.set('payment', status);
      url.searchParams.set('pack', packId);
      url.searchParams.set('orderId', orderId);
      return url.toString();
    } catch (err) {
      console.warn('Payment return URL fallback used.', err);
      return status === 'success' ? 'https://www.test.com' : 'https://www.failed.com';
    }
  }

  function grantCoinPack(pack, orderId = '', targetSaveKey = currentSaveKey()) {
    if (!pack || !targetSaveKey) return;
    let targetSave;
    try {
      const raw = localStorage.getItem(targetSaveKey);
      targetSave = raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
    } catch (err) {
      console.warn('Could not load target save for payment grant.', err);
      targetSave = defaultSave();
    }
    const grantedOrders = targetSave.grantedPaymentOrders || [];
    if (orderId && grantedOrders.includes(orderId)) return;
    targetSave.coins = (targetSave.coins || 0) + pack.coins;
    if (orderId) targetSave.grantedPaymentOrders = [...grantedOrders, orderId].slice(-20);
    targetSave.version = VERSION;
    localStorage.setItem(targetSaveKey, JSON.stringify(targetSave));
    if (targetSaveKey === currentSaveKey()) save = { ...save, ...targetSave };
    updateAllUI();
    audio.play('coin');
    toast(`${pack.name} added ${pack.coins} Coins.`);
  }

  function handlePaymentReturn() {
    let params;
    try { params = new URLSearchParams(window.location.search); } catch (err) { return; }
    const status = params.get('payment');
    const packId = params.get('pack');
    const orderId = params.get('orderId');
    if (!status || !packId) return;
    const pendingRaw = localStorage.getItem(PAYMENT_PENDING_KEY);
    let pending = null;
    try { pending = pendingRaw ? JSON.parse(pendingRaw) : null; } catch (err) { pending = null; }
    const pack = coinPacks.find(p => p.id === packId);
    if (status === 'success' && pack && pending && pending.orderId === orderId && pending.packId === packId) {
      grantCoinPack(pack, orderId, pending.saveKey || currentSaveKey());
      localStorage.removeItem(PAYMENT_PENDING_KEY);
    } else if (status === 'success' && pack) {
      console.warn('Payment success return ignored because no matching pending order was found.', { orderId, packId, pending });
      toast('Payment returned, but no matching pending order was found. Please contact support.');
    } else if (status === 'failed') {
      audio.play('miss');
      toast('Payment was not completed. No coins were added.');
      localStorage.removeItem(PAYMENT_PENDING_KEY);
    }
    if (window.history && window.history.replaceState) {
      try {
        const cleanUrl = new URL(window.location.href);
        ['payment', 'pack', 'orderId'].forEach(key => cleanUrl.searchParams.delete(key));
        window.history.replaceState({}, document.title, cleanUrl.toString());
      } catch (err) {
        console.warn('Could not clean payment query params.', err);
      }
    }
  }

  function makePaymentOrderId(packId) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `MRA${Date.now()}${suffix}`.replace(/[^A-Z0-9]/gi, '').slice(0, 32);
  }

  function paymentScriptReady() {
    return typeof window.DoRequest === 'function' && typeof window.CryptoJS !== 'undefined';
  }

  function showPaymentScriptError() {
    console.warn('Payment script status:', {
      hasDoRequest: typeof window.DoRequest === 'function',
      hasCryptoJS: typeof window.CryptoJS !== 'undefined'
    });
    toast('Payment service is not ready. Refresh the page and try again.');
  }

  function getPaymentEmail() {
    return isLoggedIn() && isValidEmail(currentUser) ? normalizeEmail(currentUser) : '';
  }

  function buyPack(id) {
    const pack = coinPacks.find(p => p.id === id);
    if (!pack) return;
    syncName();

    if (!isLoggedIn()) {
      setAuthMessage('Please register or log in before buying coins. Paid coins are saved to your account.', 'error');
      toast('Please register or log in before buying coins.');
      showScreen('startScreen');
      clearHiddenPanelButtonState();
      return;
    }

    if (!paymentScriptReady()) {
      showPaymentScriptError();
      return;
    }

    const payType = selectedPaymentType();
    const orderId = makePaymentOrderId(pack.id);
    const email = getPaymentEmail();
    const nameParts = String(save.playerName || 'Player').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Player';
    const lastName = nameParts.slice(1).join(' ') || 'Player';
    const options = {
      orderId,
      amount: Number(pack.amount.toFixed(2)),
      currency: 'USD',
      payTypes: payType,
      name: pack.name,
      email,
      firstName,
      lastName,
      phone: '13500000000',
      successUrl: paymentReturnUrl('success', pack.id, orderId),
      backUrl: paymentReturnUrl('failed', pack.id, orderId)
    };

    localStorage.setItem(PAYMENT_PENDING_KEY, JSON.stringify({
      orderId,
      packId: pack.id,
      amount: pack.amount,
      coins: pack.coins,
      payType,
      createdAt: Date.now(),
      saveKey: currentSaveKey(),
      accountEmail: currentUser,
      email
    }));

    audio.play('payment');
    const checkoutLabel = paymentMethods.find(m => m.type === payType)?.label || 'payment';
    const beforeCheckoutUrl = window.location.href;
    try {
      const result = window.DoRequest(options);
      console.info('Payment request sent:', options, result);
      toast(`Opening ${checkoutLabel} checkout...`);
    } catch (err) {
      // Some third-party checkout scripts throw after starting a redirect or popup.
      // Do not show a hard failure or clear the pending order here, otherwise users see
      // a false error even when the payment page opens correctly.
      console.warn('Payment checkout raised a script warning after launch attempt.', err);
      console.info('Payment request options:', options);
      toast(`Opening ${checkoutLabel} checkout...`);
    }

    window.setTimeout(() => {
      const pendingStillExists = localStorage.getItem(PAYMENT_PENDING_KEY);
      if (!document.hidden && window.location.href === beforeCheckoutUrl && pendingStillExists) {
        toast('If checkout did not open, please try again or choose another payment method.');
      }
    }, 4500);
  }

  window.MoleRushPayDebug = () => ({
    hasDoRequest: typeof window.DoRequest === 'function',
    hasCryptoJS: typeof window.CryptoJS !== 'undefined',
    currentUser,
    paymentType: selectedPaymentType(),
    pendingPayment: localStorage.getItem(PAYMENT_PENDING_KEY),
    url: window.location.href
  });

  function buyItem(id) {
    const item = itemDefs[id];
    if (!item) return;
    if (save.coins < item.cost) return toast('Not enough coins.');
    save.coins -= item.cost;
    save.ownedItems[id] = (save.ownedItems[id] || 0) + 1;
    persist();
    updateAllUI();
    audio.play('purchase');
    toast(`${item.name} purchased.`);
  }

  function skinAction(id) {
    const skin = skins.find(s => s.id === id);
    if (!skin) return;
    const owned = save.ownedSkins.includes(id);
    if (!owned) {
      if (save.coins < skin.cost) return toast('Not enough coins.');
      save.coins -= skin.cost;
      save.ownedSkins.push(id);
      save.equippedSkin = id;
      audio.play('purchase');
      toast(`${skin.name} unlocked and equipped.`);
    } else {
      save.equippedSkin = id;
      audio.play('equip');
      toast(`${skin.name} equipped.`);
    }
    persist();
    updateAllUI();
  }

  function getPointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const t = evt.touches && evt.touches[0] ? evt.touches[0] : evt.changedTouches && evt.changedTouches[0] ? evt.changedTouches[0] : evt;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function syncHammerToPointer(pos) {
    pointer.x = pos.x;
    pointer.y = pos.y;
    pointer.active = true;
    pointer.lastMove = performance.now();
    if (game.running && !game.paused && !game.finished) {
      game.hammer.x = clamp(pos.x, 16, game.w - 16);
      game.hammer.y = clamp(pos.y, 70, game.h - 42);
    }
  }

  canvas.addEventListener('pointermove', evt => {
    evt.preventDefault();
    syncHammerToPointer(getPointerPos(evt));
  }, { passive: false });
  canvas.addEventListener('pointerenter', evt => {
    syncHammerToPointer(getPointerPos(evt));
  }, { passive: false });
  canvas.addEventListener('pointerdown', evt => {
    evt.preventDefault();
    const pos = getPointerPos(evt);
    syncHammerToPointer(pos);
    pointer.down = true;
    if (game.running && !game.paused) game.whack(pos.x, pos.y);
  }, { passive: false });
  window.addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });

  document.querySelectorAll('[data-move]').forEach(btn => {
    const keyMap = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' };
    const start = evt => { evt.preventDefault(); keyState.add(keyMap[btn.dataset.move]); };
    const end = evt => { evt.preventDefault(); keyState.delete(keyMap[btn.dataset.move]); };
    btn.addEventListener('pointerdown', start, { passive: false });
    btn.addEventListener('pointerup', end, { passive: false });
    btn.addEventListener('pointerleave', end, { passive: false });
    btn.addEventListener('pointercancel', end, { passive: false });
  });

  window.addEventListener('keydown', evt => {
    const key = evt.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'spacebar'].includes(key) || ['w','a','s','d','p','r'].includes(key)) evt.preventDefault();
    if (key === ' ') keyState.add('space'); else keyState.add(key);
    if (key === ' ' || key === 'spacebar') game.whack();
    const shortcutMap = { '1': 'shield', '2': 'magnet', '3': 'double', '4': 'bomb', '5': 'speed' };
    const typingTarget = ['input', 'textarea', 'select'].includes((document.activeElement?.tagName || '').toLowerCase());
    if (!typingTarget && shortcutMap[key] && document.getElementById('gameScreen').classList.contains('active')) {
      evt.preventDefault();
      game.useItem(shortcutMap[key]);
    }
    if (key === 'p') game.paused ? game.resume() : game.pause();
    if (key === 'r' && document.getElementById('gameScreen').classList.contains('active')) game.start(game.mode, game.level);
  });
  window.addEventListener('keyup', evt => {
    const key = evt.key.toLowerCase();
    if (key === ' ') keyState.delete('space'); else keyState.delete(key);
  });
  window.addEventListener('resize', () => game.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => game.resize(), 120));
  // Keep right-click enabled so developers can inspect the page on GitHub Pages builds.

  // First boot
  handlePaymentReturn();
  claimDailyReward();
  updateAllUI();
  showScreen('startScreen');
  game.resize();
})();
