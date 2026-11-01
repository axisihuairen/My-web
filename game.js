/* 植物大战僵尸 RH · 网页复刻版
   —— 基于 APK《PlantsVsZombiesRH-Mod v3.8.1》中的原始美术、音效与关卡数据结构复刻
*/
(() => {
'use strict';

const W = 1416, H = 616;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const loadingEl = document.getElementById('loading');
const loadingBar = loadingEl.querySelector('.bar i');
const overlayEl = document.getElementById('overlay');
const panelContent = document.getElementById('panelContent');

const LAWN = { x0: 206, y0: 120, x1: 1076, y1: 551, cols: 9, rows: 5 };
LAWN.cw = (LAWN.x1 - LAWN.x0) / LAWN.cols;
LAWN.ch = (LAWN.y1 - LAWN.y0) / LAWN.rows;
LAWN.waterRows = [2, 3];

const FONT = '"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';

/* ============ 植物定义（数值参照原版 PvZ 体系） ============ */
const PLANTS = {
  sunflower:  { name:'向日葵', family:'producer', cost:50,  cd:7.5, hp:300, produce:25, interval:24,
                desc:'每 24 秒产出 25 阳光，是草坪经济的基础。' },
  peashooter: { name:'豌豆射手', family:'shooter', cost:100, cd:7, hp:300, damage:20, interval:1.4,
                desc:'向本行发射豌豆，基础攻击植物。' },
  snowpea:    { name:'寒冰射手', family:'shooter', cost:175, cd:7, hp:300, damage:20, interval:1.5, slow:true,
                desc:'发射寒冰豌豆，命中后大幅减速僵尸。' },
  gatling:    { name:'机枪豌豆', family:'shooter', cost:250, cd:12, hp:300, damage:20, interval:0.55,
                desc:'高射速连发豌豆，输出极强，但价格昂贵。' },
  splitpea:   { name:'裂荚射手', family:'shooter', cost:125, cd:7, hp:300, damage:20, interval:1.4, both:true,
                desc:'向前后两个方向同时发射豌豆。' },
  threepeater:{ name:'三线射手', family:'three', cost:325, cd:12, hp:300, damage:20, interval:1.5,
                desc:'同时攻击上、中、下三条战线。' },
  cactus:     { name:'仙人掌', family:'shooter', cost:125, cd:7, hp:300, damage:24, interval:1.4,
                desc:'发射尖刺，对整行僵尸造成伤害。' },
  starfruit:  { name:'杨桃', family:'star', cost:125, cd:7, hp:300, damage:20, interval:1.5,
                desc:'向五个方向发射星星，可覆盖相邻战线。' },
  wallnut:    { name:'坚果墙', family:'barrier', cost:50, cd:20, hp:4000,
                desc:'坚实的防御植物，阻挡僵尸前进。' },
  tallnut:    { name:'高坚果', family:'barrier', cost:125, cd:20, hp:8000,
                desc:'加高版的坚果墙，连跳跳僵尸也无法越过。' },
  pumpkin:    { name:'南瓜头', family:'barrier', cost:125, cd:20, hp:4000,
                desc:'厚实的南瓜外壳，为防线提供额外保护。' },
  garlic:     { name:'大蒜', family:'garlic', cost:50, cd:7, hp:400,
                desc:'被啃食后会让僵尸改道到相邻行。' },
  potato:     { name:'土豆雷', family:'mine', cost:25, cd:12, hp:300, arm:14, damage:1800,
                desc:'埋入地下，14 秒后待命，踩中的僵尸会被炸飞。' },
  cherry:     { name:'樱桃炸弹', family:'instant', cost:150, cd:35, damage:1800, radius:1.6,
                desc:'爆炸并消灭周围 3×3 范围内的僵尸。' },
  jalapeno:   { name:'火爆辣椒', family:'instant', cost:125, cd:35,
                desc:'烧毁整条战线上的所有僵尸。' },
  squash:     { name:'窝瓜', family:'squash', cost:50, cd:20, hp:300, damage:3000,
                desc:'发现附近僵尸后一跃而下，将其压扁。' },
  chomper:    { name:'大嘴花', family:'chomper', cost:150, cd:10, hp:300, chew:16,
                desc:'一口吞掉面前的僵尸，之后需要长时间咀嚼。' },
  fume:       { name:'大喷菇', family:'fume', cost:75, cd:7, hp:300, damage:20, interval:1.5, range:4,
                desc:'喷射孢子，穿透攻击前方 4 格内的所有僵尸。' },
  scaredy:    { name:'胆小菇', family:'fume', cost:25, cd:7, hp:300, damage:20, interval:1.6, range:2.6,
                desc:'只攻击靠近自己的僵尸，价格低廉。' },
  torchwood:  { name:'火炬树桩', family:'torch', cost:175, cd:7, hp:300,
                desc:'经过的豌豆会被点燃，伤害翻倍。' },
  melonpult:  { name:'西瓜投手', family:'lobber', cost:300, cd:15, hp:300, damage:80, interval:2.2, splash:true, bullet:'melon',
                desc:'投掷西瓜，落点范围内的僵尸都会受伤。' },
  cabbagepult:{ name:'卷心菜投手', family:'lobber', cost:100, cd:7, hp:300, damage:40, interval:2.2, bullet:'cabbage',
                desc:'抛射卷心菜，可越过前方植物攻击。' },
  magnet:     { name:'磁力菇', family:'magnet', cost:100, cd:12, hp:300,
                desc:'吸走僵尸的金属护甲，让铁桶与铁门失效。' },
  iceshroom:  { name:'寒冰菇', family:'instant', cost:75, cd:35,
                desc:'冻结全场僵尸 5 秒，为防线争取时间。' },
  lilypad:    { name:'睡莲', family:'lily', cost:25, cd:7, hp:300, water:false, lily:true,
                desc:'水上平台，可让普通植物种在泳池中。' },
  seashroom:  { name:'水兵菇', family:'fume', cost:25, cd:7, hp:300, damage:20, interval:1.6, range:2.8, needWater:true, bullet:'fume',
                desc:'生长在水中的蘑菇，近距离喷射孢子。' },
  tanglekelp: { name:'缠绕海草', family:'kelp', cost:25, cd:20, needWater:true,
                desc:'把走进水格的僵尸拖入水底，一次性使用。' },
  spikerock:  { name:'地刺王', family:'spike', cost:125, cd:20, hp:300, damage:30,
                desc:'僵尸从上方走过时持续受到伤害。' },
  umbrella:   { name:'保护伞', family:'umbrella', cost:100, cd:15, hp:300,
                desc:'为周围植物遮挡投掷类攻击。' },
  blover:     { name:'三叶草', family:'blover', cost:100, cd:20,
                desc:'吹起强风，将场上僵尸向后击退。' }
};

/* ============ 僵尸定义 ============ */
const ZOMBIES = {
  normal:  { name:'普通僵尸', hp:220,  speed:22, dps:40, scale:1.00, armor:null },
  flag:    { name:'旗帜僵尸', hp:220,  speed:27, dps:40, scale:1.00, armor:null },
  cone:    { name:'路障僵尸', hp:620,  speed:22, dps:40, scale:1.02, armor:{amount:350, type:'cone'} },
  bucket:  { name:'铁桶僵尸', hp:1300, speed:20, dps:44, scale:1.04, armor:{amount:800, type:'bucket'} },
  door:    { name:'铁门僵尸', hp:300,  speed:20, dps:44, scale:1.03, armor:{amount:1000, type:'door'} },
  football:{ name:'橄榄球僵尸', hp:1700, speed:42, dps:70, scale:1.10, armor:null },
  pole:    { name:'撑杆僵尸', hp:500,  speed:36, dps:40, scale:1.04, vault:true },
  pogo:    { name:'跳跳僵尸', hp:520,  speed:46, dps:40, scale:1.02, hop:true }
};

/* ============ 关卡（三个世界，共 15 关） ============ */
const LEVELS = [
  { id:'1-1', title:'白天 · 草坪', world:'day',   waves:8,  sun:75,  tier:2, seeds:['sunflower','peashooter','wallnut','potato'] },
  { id:'1-2', title:'白天 · 草坪', world:'day',   waves:10, sun:50,  tier:2, seeds:['sunflower','peashooter','wallnut','potato','snowpea','cherry'] },
  { id:'1-3', title:'白天 · 草坪', world:'day',   waves:12, sun:50,  tier:3, seeds:['sunflower','peashooter','wallnut','snowpea','cabbagepult','squash'] },
  { id:'1-4', title:'白天 · 草坪', world:'day',   waves:14, sun:50,  tier:4, seeds:['sunflower','peashooter','wallnut','gatling','tallnut','jalapeno','spikerock'] },
  { id:'1-5', title:'白天 · 草坪', world:'day',   waves:16, sun:50,  tier:5, seeds:['sunflower','peashooter','threepeater','torchwood','melonpult','wallnut','cherry','spikerock'] },
  { id:'2-1', title:'夜晚 · 墓地', world:'night', waves:9,  sun:50,  tier:2, seeds:['sunflower','peashooter','fume','scaredy','wallnut','iceshroom'] },
  { id:'2-2', title:'夜晚 · 墓地', world:'night', waves:11, sun:50,  tier:3, seeds:['sunflower','peashooter','fume','scaredy','wallnut','iceshroom','magnet'] },
  { id:'2-3', title:'夜晚 · 墓地', world:'night', waves:13, sun:50,  tier:4, seeds:['sunflower','peashooter','fume','chomper','wallnut','iceshroom','magnet','cherry'] },
  { id:'2-4', title:'夜晚 · 墓地', world:'night', waves:15, sun:50,  tier:5, seeds:['sunflower','peashooter','fume','chomper','wallnut','iceshroom','magnet','gatling','cherry'] },
  { id:'3-1', title:'泳池 · 水面', world:'pool',  waves:10, sun:100, tier:3, seeds:['lilypad','seashroom','sunflower','peashooter','wallnut','cherry','tanglekelp'] },
  { id:'3-2', title:'泳池 · 水面', world:'pool',  waves:12, sun:100, tier:4, seeds:['lilypad','seashroom','sunflower','peashooter','wallnut','cherry','tanglekelp','melonpult'] },
  { id:'3-3', title:'泳池 · 水面', world:'pool',  waves:14, sun:100, tier:5, seeds:['lilypad','seashroom','sunflower','peashooter','wallnut','cherry','tanglekelp','melonpult','torchwood'] },
  { id:'3-4', title:'泳池 · 水面', world:'pool',  waves:16, sun:100, tier:6, seeds:['lilypad','seashroom','sunflower','peashooter','threepeater','wallnut','cherry','tanglekelp','melonpult','gatling'] },
  { id:'4-1', title:'白天 · 草坪', world:'day',   waves:18, sun:50,  tier:6, seeds:['sunflower','peashooter','gatling','threepeater','torchwood','melonpult','wallnut','cherry','spikerock'] },
  { id:'4-2', title:'夜晚 · 墓地', world:'night', waves:20, sun:50,  tier:7, seeds:['sunflower','peashooter','gatling','fume','chomper','iceshroom','magnet','wallnut','cherry','starfruit'] }
];
const ZROSTER = ['normal','cone','flag','bucket','door','pole','football','pogo'];

/* ============ 资源加载 ============ */
const IMG = { plants:{}, zombies:{}, ui:{}, bg:{} };
const SRC = {
  bg: { day:'day.jpg', night:'night.jpg', pool:'pool.jpg', roof:'roof.jpg', menu:'menu.jpg' },
  plants: {}, zombies:{}, ui:{
    seedpacket:'seedpacket.png', seedbank:'seedbank.png', sun:'sun.png',
    pea:'pea.png', snow:'snowpea_bullet.png', shovel:'shovel.png',
    shovelbank:'shovelbank.png', chooser:'chooser_bg.png',
    lawnmower:'lawnmower.png', cabbage:'cabbage_bullet.png',
    melon:'melon_bullet.png', butter:'butter_bullet.png', kernel:'kernel_bullet.png'
  }
};
Object.keys(PLANTS).forEach(k => SRC.plants[k] = `${k}.png`);
Object.keys(ZOMBIES).forEach(k => SRC.zombies[k] = `${k}.png`);

const AUDIO_NAMES = ['Day','Night','Pool','Roof','MainMenu','winmusic','LoseMusic','UltimateBattle',
  'Plant','Plant2','SeedLift','SelectCard','Tap','Tap2','Shoop','Splat','Splat2','Splat3','CherryBomb',
  'Jalapeno','PotatoMine','Chomp','BigChomp','SquashHmm','LawnMower','FinalWave','HugeWave','ReadySetPlant',
  'Gulp','Frozen','Explosion','Puff','Fume','MelonImpact','Coin','Points','Butter','Shovel','PoleVault',
  'Siren','Buzzer','Awooga','Bleep','DoomShroom','ZombieSplash','GrassStep','PlasticHit','ShieldHit','Swing','DirtRise'];

let assetsReady = false;
const loadImg = (src) => new Promise(res => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => { console.warn('missing', src); res(null); };
  im.src = src;
});
async function loadAssets() {
  const groups = [
    ['bg', SRC.bg], ['plants', SRC.plants], ['zombies', SRC.zombies], ['ui', SRC.ui]
  ];
  let total = 0, done = 0;
  groups.forEach(([, m]) => total += Object.keys(m).length);
  const all = [];
  groups.forEach(([g, m]) => {
    Object.keys(m).forEach(k => {
      all.push(loadImg(m[k]).then(im => { IMG[g][k] = im; done++; loadingBar.style.width = (done/total*100).toFixed(0)+'%'; }));
    });
  });
  await Promise.all(all);
  assetsReady = true;
  loadingEl.classList.add('hidden');
  setTimeout(() => { firstPaint = true; }, 0);
}

/* ============ 音频 ============ */
const sfxLast = {};
function sfx(name, vol = 0.6, rate = 1, throttle = 0) {
  const now = performance.now();
  if (throttle && sfxLast[name] && now - sfxLast[name] < throttle) return;
  sfxLast[name] = now;
  try {
    const a = new Audio(`${name}.mp3`);
    a.volume = Math.max(0, Math.min(1, vol));
    a.playbackRate = rate;
    a.play().catch(() => {});
    a.addEventListener('ended', () => { a.src = ''; });
  } catch (e) {}
}
let music = null, musicName = '';
function playMusic(name, vol = 0.55) {
  if (!name || musicName === name) return;
  if (music) { try { music.pause(); } catch (e) {} }
  musicName = name;
  music = new Audio(`${name}.mp3`);
  music.loop = true;
  music.volume = vol;
  music.play().catch(() => {});
}
function stopMusic() { if (music) { try { music.pause(); } catch (e) {} } musicName = ''; }

/* ============ 基础绘制工具 ============ */
function txt(s, x, y, size, color = '#fff', align = 'center', weight = '700', stroke = 'rgba(0,0,0,.55)', strokeW = 4, font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = stroke;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
function drawImg(img, x, y, w, h) { if (img) ctx.drawImage(img, x, y, w, h); }
function drawFit(img, cx, cy, maxW, maxH, anchorBottom = true) {
  if (!img) return;
  const r = Math.min(maxW/img.width, maxH/img.height);
  const w = img.width*r, h = img.height*r;
  const x = cx - w/2, y = anchorBottom ? cy - h : cy - h/2;
  ctx.drawImage(img, x, y, w, h);
  return { x, y, w, h };
}
function shadowEllipse(x, y, rx, ry, alpha = 0.28) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function cellCenter(col, row) { return { x: LAWN.x0 + (col+0.5)*LAWN.cw, y: LAWN.y0 + (row+0.5)*LAWN.ch }; }
function rowBottom(row) { return LAWN.y0 + (row+1)*LAWN.ch; }
function isWaterRow(row) { return LAWN.waterRows.includes(row); }

/* ============ 状态 ============ */
let state = 'menu';         // menu | select | playing
let firstPaint = false;
let menuTime = 0;
let pointer = { x: -999, y: -999, down: false };
let hitAreas = [];
let game = null;
let animId = null;

function makeGame(levelIndex) {
  const cfg = LEVELS[levelIndex];
  return {
    cfg, levelIndex, world: cfg.world, water: cfg.world === 'pool',
    sun: cfg.sun, plants: [], zombies: [], projectiles: [], suns: [], particles: [], mowers: [],
    seeds: cfg.seeds.map(k => ({ key: k, cd: 0, cost: PLANTS[k].cost })),
    selected: -1, shovel: false,
    waveIndex: 0, waveTimer: 12, spawnQueue: [], waveGap: Math.max(16, 25 - cfg.tier*1.1),
    huge: false, banner: null, bannerT: 0,
    paused: false, over: null, time: 0, naturalSun: 9, shootSfx: 0,
    hoverCell: null, screenShake: 0, finalMusic: false,
    mowersInit: true
  };
}
function initMowers(g) {
  g.mowers = [];
  for (let r = 0; r < LAWN.rows; r++) g.mowers.push({ row: r, x: LAWN.x0 - 62, active: true, running: false });
}

/* ============ 关卡开始 / 结束 ============ */
function startLevel(i) {
  game = makeGame(i);
  initMowers(game);
  state = 'playing';
  playMusic(game.world === 'day' ? 'Day' : game.world === 'night' ? 'Night' : 'Pool', 0.5);
  sfx('ReadySetPlant', 0.7);
  game.banner = { text: '准备… 种植！', sub: `${LEVELS[i].id}  ${LEVELS[i].title}`, t: 3.2 };
  game.bannerT = 3.2;
  last = 0;
}
function nextLevel() {
  if (!game) return;
  const n = game.levelIndex + 1;
  if (n < LEVELS.length) startLevel(n); else { state = 'select'; musicStopSafe(); }
}
function musicStopSafe() { stopMusic(); playMusic('MainMenu', 0.5); }

function endGame(win) {
  if (!game || game.over) return;
  game.over = win ? 'win' : 'lose';
  stopMusic();
  if (win) { sfx('winmusic', 0.8); }
  else { sfx('LoseMusic', 0.8); sfx('Siren', 0.4); }
}

/* ============ 更新 ============ */
let last = 0;
function update(dt) {
  if (state !== 'playing' || !game) return;
  if (game.paused || game.over) return;
  g_update(dt);
}

function g_update(dt) {
  const g = game;
  g.time += dt;
  g.screenShake = Math.max(0, g.screenShake - dt*30);

  // 自然阳光
  g.naturalSun -= dt;
  if (g.naturalSun <= 0) {
    g.naturalSun = (g.world === 'night' ? 11 : 8) + Math.random()*2;
    spawnSkySun(g);
  }

  // 冷却
  g.seeds.forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - dt); });

  // 波次
  if (!g.over) updateWaves(g, dt);

  // 植物
  g.plants.forEach(p => updatePlant(g, p, dt));
  g.plants = g.plants.filter(p => p.hp > 0 && !p.remove);

  // 僵尸
  g.zombies.forEach(z => updateZombie(g, z, dt));
  g.zombies = g.zombies.filter(z => !z.dead);

  // 抛射物
  g.projectiles.forEach(p => updateProjectile(g, p, dt));
  g.projectiles = g.projectiles.filter(p => !p.remove);

  // 阳光
  g.suns.forEach(s => {
    if (s.landed) { s.life -= dt; }
    else {
      s.y += s.vy*dt;
      if (s.y >= s.ty) { s.y = s.ty; s.landed = true; s.life = 9; }
    }
  });
  g.suns = g.suns.filter(s => s.life > 0 && !s.gone);

  // 粒子
  g.particles.forEach(p => {
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += (p.g||0)*dt; p.life -= dt;
  });
  g.particles = g.particles.filter(p => p.life > 0);

  // 小推车
  g.mowers.forEach(m => {
    if (m.running) {
      m.x += 780*dt;
      g.zombies.forEach(z => {
        if (z.row === m.row && !z.dead && z.x < m.x + 30 && z.x > m.x - 120) killZombie(g, z, true);
      });
      if (m.x > W + 100) m.running = false, m.active = false;
    }
  });

  // 失败判定
  if (!g.over) {
    g.zombies.forEach(z => {
      if (z.dead) return;
      if (z.x < LAWN.x0 - 16) {
        const m = g.mowers[z.row];
        if (m && m.active && !m.running) {
          m.running = true; sfx('LawnMower', 0.8);
        } else if (!m.active || (m && m.running === false)) {
          endGame(false);
        } else if (!m) endGame(false);
      }
    });
  }

  // 胜利判定
  if (!g.over && g.waveIndex >= g.cfg.waves && g.zombies.length === 0 && g.spawnQueue.length === 0) {
    // 确保最后一波已经完全刷出
    if (g.time - g.lastWaveTime > 4) endGame(true);
  }

  // 横幅
  if (g.bannerT > 0) g.bannerT -= dt;
}

function updateWaves(g, dt) {
  // 延迟生成队列
  for (let i = g.spawnQueue.length - 1; i >= 0; i--) {
    const q = g.spawnQueue[i];
    q.t -= dt;
    if (q.t <= 0) {
      spawnZombie(g, q.type, q.row);
      g.spawnQueue.splice(i, 1);
    }
  }
  if (g.waveIndex >= g.cfg.waves) return;
  g.waveTimer -= dt;
  if (g.waveTimer <= 0) {
    const isFinal = g.waveIndex === g.cfg.waves - 1;
    spawnWave(g, g.waveIndex, isFinal);
    g.waveIndex++;
    g.lastWaveTime = g.time;
    g.waveGap = Math.max(13, 24 - g.cfg.tier*1.2) + (isFinal ? 99 : 0);
    g.waveTimer = g.waveGap;
    if (isFinal) {
      g.huge = true;
      g.banner = { text: '一大波僵尸正在接近！', sub: '最终波 · FINAL WAVE', t: 3.4 };
      g.bannerT = 3.4;
      sfx('HugeWave', 0.9);
      playMusic('UltimateBattle', 0.5);
      g.finalMusic = true;
    } else if (g.waveIndex % 5 === 0) {
      g.banner = { text: '僵尸潮来袭！', sub: `第 ${g.waveIndex} 波 / 共 ${g.cfg.waves} 波`, t: 2.2 };
      g.bannerT = 2.2;
      sfx('FinalWave', 0.6);
    }
  }
}

function spawnWave(g, wave, isFinal) {
  const tier = Math.min(g.cfg.tier, ZROSTER.length);
  const allowed = ZROSTER.slice(0, tier);
  const base = Math.round(2 + wave * 0.8 + g.levelIndex * 0.35 + (isFinal ? 5 : 0));
  const count = Math.min(isFinal ? 22 : 12, base);
  for (let i = 0; i < count; i++) {
    let t;
    if (isFinal && i % 7 === 0) t = 'football';
    else if (wave >= 5 && i % 6 === 0 && allowed.includes('bucket')) t = 'bucket';
    else t = allowed[Math.floor(Math.random()*allowed.length)];
    const row = Math.floor(Math.random()*LAWN.rows);
    g.spawnQueue.push({ t: i*0.5 + Math.random()*0.6, type: t, row });
  }
  // 旗帜僵尸领队
  if (wave === 0 || wave % 5 === 4) g.spawnQueue.unshift({ t: 0, type:'flag', row: Math.floor(Math.random()*5) });
}

function spawnZombie(g, type, row) {
  const def = ZOMBIES[type];
  const x = LAWN.x1 + 40 + Math.random()*90;
  g.zombies.push({
    type, def, row, x, hp: def.hp, maxHp: def.hp,
    shield: def.armor ? def.armor.amount : 0, shieldMax: def.armor ? def.armor.amount : 0,
    speed: def.speed, slow: 0, frozen: 0, flash: 0, eating: false, dead: false,
    vaulting: 0, vaulted: false, hopPhase: Math.random()*Math.PI*2, biteTimer: 0, z: Math.random()
  });
}

function updateZombie(g, z, dt) {
  if (z.dead) return;
  z.flash = Math.max(0, z.flash - dt);
  if (z.frozen > 0) { z.frozen -= dt; return; }
  if (z.slow > 0) z.slow -= dt;
  if (z.vaulting > 0) { // 撑杆跳跃动画
    z.vaulting -= dt;
    z.x -= (LAWN.cw*2.1) * dt * 1.4;
    if (z.vaulting <= 0) z.vaulted = true;
    return;
  }
  const speed = z.speed * (z.slow > 0 ? 0.45 : 1);
  let target = null, lilyTarget = null;
  if (!z.def.hop) {
    for (const p of g.plants) {
      if (p.row !== z.row || p.remove) continue;
      const dx = z.x - p.x;
      if (dx <= LAWN.cw*0.30 && dx >= -LAWN.cw*0.14) {
        if (p.def.family === 'lily') { if (!lilyTarget) lilyTarget = p; continue; }
        target = p; break;
      }
    }
    if (!target) target = lilyTarget; // 睡莲是最后被啃的
  }
  if (target && z.def.vault && !z.vaulted) {
    z.vaulting = 0.45; sfx('PoleVault', 0.7);
    return;
  }
  if (target) {
    z.eating = true;
    z.biteTimer -= dt;
    target.hp -= z.def.dps * dt;
    if (target.def.family === 'garlic' && !target.garliced) {
      target.garliced = true;
      z.row = Math.max(0, Math.min(LAWN.rows-1, z.row + (z.row === 0 ? 1 : (z.row === LAWN.rows-1 ? -1 : (Math.random() < 0.5 ? -1 : 1)))));
      target.hp -= 200;
      z.eating = false;
      spawnParticles(g, target.x, target.y, 8, '#ffe9a8');
    }
    if (z.biteTimer <= 0) { z.biteTimer = 0.36; sfx('Chomp', 0.32, 0.95, 340); }
    if (target.hp <= 0) {
      target.remove = true;
      sfx('Gulp', 0.4, 0.9);
      spawnParticles(g, target.x, target.y - 10, 10, '#8ad06a');
    }
  } else {
    z.eating = false;
    z.x -= speed*dt;
  }
  if (z.def.hop) {
    z.hopPhase += dt*8;
    z.x -= speed*dt;
  }
  // 地刺伤害
  g.plants.forEach(p => {
    if (p.def.family === 'spike' && p.row === z.row && Math.abs(z.x - p.x) < LAWN.cw*0.5) {
      z.hp -= p.def.damage*dt;
    }
  });
  if (z.hp <= 0) killZombie(g, z, false);
}

function killZombie(g, z, silent) {
  if (z.dead) return;
  z.dead = true;
  if (!silent) { sfx('Splat', 0.4, 0.9 + Math.random()*0.3, 40); }
  spawnParticles(g, z.x, rowBottom(z.row) - 26, 14, '#b6d98a');
}

function hitZombie(g, z, dmg, opts = {}) {
  if (z.dead) return;
  z.flash = 0.12;
  if (z.shield > 0) {
    z.shield -= dmg;
    if (z.shield <= 0) {
      z.shield = 0;
      if (opts.sound !== false) sfx('ShieldHit', 0.4);
      spawnParticles(g, z.x, rowBottom(z.row) - 40, 8, '#d8d3c6');
      return;
    }
    if (opts.sound !== false) sfx('PlasticHit', 0.35, 1, 60);
    return;
  }
  z.hp -= dmg;
  if (opts.slow) z.slow = Math.max(z.slow, 4.5);
  if (opts.sound !== false && Math.random() < 0.55) sfx('Splat2', 0.25, 1, 60);
  if (z.hp <= 0) killZombie(g, z, false);
}

/* ============ 植物逻辑 ============ */
function updatePlant(g, p, dt) {
  const d = p.def;
  p.anim += dt;
  if (d.family === 'instant') {
    p.timer -= dt;
    if (p.timer <= 0) { plantEffect(g, p); p.remove = true; }
    return;
  }
  if (d.family === 'mine') {
    if (!p.armed) { p.armT -= dt; if (p.armT <= 0) { p.armed = true; sfx('DirtRise', 0.4); } return; }
    const z = g.zombies.find(z => !z.dead && z.row === p.row && Math.abs(z.x - p.x) < LAWN.cw*0.55);
    if (z) { explode(g, p.x, p.y, 1.2, 1800); sfx('PotatoMine', 0.8); p.remove = true; }
    return;
  }
  if (d.family === 'squash') {
    if (p.state === 'wait') {
      const z = g.zombies.find(z => !z.dead && z.row === p.row && z.x > p.x - LAWN.cw*0.3 && z.x < p.x + LAWN.cw*2.2);
      if (z) { p.state = 'jump'; p.jumpT = 0.5; p.targetX = z.x; p.targetRow = z.row; sfx('SquashHmm', 0.65); }
    } else if (p.state === 'jump') {
      p.jumpT -= dt;
      if (p.jumpT <= 0) {
        const victims = g.zombies.filter(z => !z.dead && z.row === p.row && Math.abs(z.x - p.targetX) < LAWN.cw*0.9);
        victims.forEach(z => { if (z.hp <= 4000) killZombie(g, z, true); else z.hp -= 3000; });
        sfx('SquashHmm2', 0.7); g.screenShake = 8;
        spawnParticles(g, p.x, p.y, 20, '#cfd879');
        p.remove = true;
      }
    }
    return;
  }
  if (d.family === 'kelp') {
    const z = g.zombies.find(z => !z.dead && z.row === p.row && Math.abs(z.x - p.x) < LAWN.cw*0.5);
    if (z) { sfx('ZombieSplash', 0.8); killZombie(g, z, true); spawnParticles(g, z.x, p.y, 18, '#6fc3e8'); p.remove = true; }
    return;
  }
  if (d.family === 'blover') {
    p.timer -= dt;
    if (p.timer <= 0) {
      g.zombies.forEach(z => { if (!z.dead) { z.x += LAWN.cw*1.8; hitZombie(g, z, 120, {sound:false}); } });
      sfx('Swing', 0.8); spawnParticles(g, W/2, H/2, 40, '#cfe9ff'); p.remove = true;
    }
    return;
  }
  if (d.family === 'chomper') {
    if (p.chew > 0) { p.chew -= dt; return; }
    const z = g.zombies.find(z => !z.dead && z.row === p.row && z.x > p.x - 6 && z.x < p.x + LAWN.cw*1.15);
    if (z) {
      if (z.hp + z.shield <= 1400) {
        killZombie(g, z, true); sfx('BigChomp', 0.8); p.chew = d.chew;
        spawnParticles(g, z.x, p.y, 10, '#e2b0d2');
      } else { hitZombie(g, z, 300); p.chew = 4; }
    }
    return;
  }
  if (d.family === 'producer') {
    p.timer -= dt;
    if (p.timer <= 0) { p.timer = d.interval; spawnPlantSun(g, p); }
    return;
  }
  if (d.family === 'torch' || d.family === 'lily' || d.family === 'barrier' || d.family === 'spike' || d.family === 'umbrella') return;
  if (d.family === 'magnet') {
    p.timer -= dt;
    if (p.timer <= 0) {
      p.timer = 8;
      const z = g.zombies.find(z => !z.dead && z.shield > 0 && Math.abs(z.row - p.row) <= 2 && z.x > p.x && z.x < p.x + LAWN.cw*4);
      if (z) { z.shield = 0; sfx('MagnetShroom', 0.6); spawnParticles(g, z.x, rowBottom(z.row)-40, 12, '#cfd8ff'); }
    }
    return;
  }
  if (d.family === 'three' || d.family === 'star') {
    p.timer -= dt;
    if (p.timer <= 0) {
      const rows = d.family === 'three' ? [p.row-1,p.row,p.row+1] : [p.row-1,p.row,p.row+1];
      let fired = false;
      rows.forEach(r => {
        if (r < 0 || r >= LAWN.rows) return;
        const z = g.zombies.find(z => !z.dead && z.row === r && z.x > p.x - LAWN.cw*0.2);
        if (z) { firePea(g, p, r, 20, false); fired = true; }
      });
      if (fired) p.timer = d.interval;
      if (d.family === 'star' && fired) { firePea(g, p, p.row, 20, false, -1); }
    }
    return;
  }
  if (d.family === 'lobber') {
    p.timer -= dt;
    if (p.timer <= 0) {
      const zs = g.zombies.filter(z => !z.dead && z.row === p.row && z.x > p.x + 20);
      if (zs.length) {
        const z = zs.reduce((a,b) => a.x < b.x ? a : b);
        fireLob(g, p, z, d);
        p.timer = d.interval;
      }
    }
    return;
  }
  if (d.family === 'fume') {
    p.timer -= dt;
    if (p.timer <= 0) {
      const range = LAWN.cw * (d.range || 4);
      const zs = g.zombies.filter(z => !z.dead && z.row === p.row && z.x > p.x - 10 && z.x < p.x + range);
      if (zs.length) {
        zs.forEach(z => hitZombie(g, z, d.damage, {sound:false}));
        p.timer = d.interval;
        sfx('Fume', 0.3, 0.95, 260);
        spawnParticles(g, p.x + 30, p.y, 8, 'rgba(190,150,220,.8)');
        if (d.bullet === 'fume') {} // 水兵菇同样近距离喷射
      }
    }
    return;
  }
  // 射手
  p.timer -= dt;
  if (p.timer <= 0) {
    let fired = false;
    const has = g.zombies.some(z => !z.dead && z.row === p.row && z.x > p.x - 6);
    if (has) { firePea(g, p, p.row, d.damage, d.slow); fired = true; }
    if (d.both && g.zombies.some(z => !z.dead && z.row === p.row && z.x < p.x)) { firePea(g, p, p.row, d.damage, d.slow, -1); fired = true; }
    if (fired) {
      p.timer = d.interval;
      const now = performance.now();
      if (!g.shootSfx || now - g.shootSfx > 150) { g.shootSfx = now; sfx('Shoop', 0.32, 0.95, 120); }
    }
  }
}

function plantEffect(g, p) {
  const d = p.def;
  if (d.family === 'instant' && (p.key === 'cherry')) {
    explode(g, p.x, p.y, d.radius, d.damage); sfx('CherryBomb', 0.85); g.screenShake = 14;
  } else if (p.key === 'jalapeno') {
    g.zombies.forEach(z => { if (!z.dead && z.row === p.row) killZombie(g, z, true); });
    sfx('Jalapeno', 0.9); g.screenShake = 12;
    for (let i=0;i<16;i++) spawnParticles(g, LAWN.x0 + Math.random()*(LAWN.x1-LAWN.x0), LAWN.y0 + (p.row+0.5)*LAWN.ch, 1, '#ff9a3c');
  } else if (p.key === 'iceshroom') {
    g.zombies.forEach(z => { if (!z.dead) z.frozen = 5.0; });
    sfx('Frozen', 0.85); spawnParticles(g, W/2, H/2, 30, '#bfe9ff');
  }
}

function explode(g, x, y, radiusCells, damage) {
  const r = LAWN.cw * radiusCells;
  g.zombies.forEach(z => {
    if (z.dead) return;
    const zy = rowBottom(z.row) - 25;
    if (Math.hypot(z.x - x, zy - y) < r) killZombie(g, z, true);
  });
  g.particles.push({ type:'ring', x, y, r: 10, maxR: r, life: .5, maxLife: .5 });
  spawnParticles(g, x, y, 26, '#ffb347');
  sfx('Explosion', 0.7);
}

function spawnParticles(g, x, y, n, color) {
  for (let i=0;i<n;i++) {
    const a = Math.random()*Math.PI*2, sp = 40 + Math.random()*180;
    g.particles.push({ type:'dot', x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 60, g: 220, life: .5+Math.random()*.6, maxLife: 1.1, color, size: 2+Math.random()*4 });
  }
}

function firePea(g, p, row, damage, slow, dir = 1) {
  const y = rowBottom(row) - 48;
  g.projectiles.push({ kind:'pea', x: p.x + dir*18, y, row, vx: dir*520, damage, slow, dir, fire:false, img:'pea' });
}
function fireLob(g, p, z, d) {
  g.projectiles.push({
    kind:'lob', x: p.x, y: rowBottom(p.row)-70, tx: z.x, row: p.row, t: 0, dur: 1.0,
    damage: d.damage, splash: !!d.splash, img: d.bullet || 'cabbage'
  });
  sfx('Throw', 0.35, 1, 120);
}

function updateProjectile(g, p, dt) {
  if (p.remove) return;
  if (p.kind === 'pea') {
    p.x += p.vx*dt;
    if (p.x < LAWN.x0 - 90 || p.x > W + 40) { p.remove = true; return; }
    // 火炬树桩
    if (!p.fire && p.dir > 0) {
      const tw = g.plants.find(pl => pl.def.family === 'torch' && pl.row === p.row && p.x > pl.x - 20 && p.x < pl.x + LAWN.cw*0.55);
      if (tw) { p.fire = true; p.damage *= 2; sfx('Ignite2', 0.4, 1, 200); }
    }
    for (const z of g.zombies) {
      if (z.dead || z.row !== p.row) continue;
      if (p.x >= z.x - 16 && p.x <= z.x + 30) {
        hitZombie(g, z, p.damage, { slow: p.slow });
        if (p.fire) spawnParticles(g, p.x, p.y, 6, '#ff9b3a');
        p.remove = true; return;
      }
    }
  } else if (p.kind === 'lob') {
    p.t += dt/p.dur;
    if (p.t >= 1) {
      const zy = rowBottom(p.row) - 26;
      const rr = p.splash ? LAWN.cw*0.95 : LAWN.cw*0.35;
      g.zombies.forEach(z => {
        if (z.dead) return;
        if (Math.hypot(z.x - p.tx, rowBottom(z.row)-26 - zy) < rr) {
          if (z.row === p.row || p.splash) killOrDamage(g, z, p.damage);
        }
      });
      sfx('MelonImpact', 0.5, 1, 60);
      spawnParticles(g, p.tx, zy, 12, p.splash ? '#8fd06a' : '#b9d97c');
      p.remove = true;
    }
  }
}
function killOrDamage(g, z, dmg) { hitZombie(g, z, dmg, {sound:false}); }

/* ============ 阳光 ============ */
function spawnSkySun(g) {
  const x = LAWN.x0 + 40 + Math.random()*(LAWN.x1-LAWN.x0-80);
  const ty = LAWN.y0 + 60 + Math.random()*(LAWN.y1-LAWN.y0-100);
  g.suns.push({ x, y: -30, ty, vy: 70, life: 10, landed: false, value: 25, glow: Math.random()*6 });
}
function spawnPlantSun(g, p) {
  const sun = { x: p.x + (Math.random()*30-15), y: p.y - 30, ty: Math.min(LAWN.y1-30, p.y + 20), vy: 45, life: 9, landed: false, value: 25, glow: Math.random()*6 };
  g.suns.push(sun);
  sfx('Points', 0.45, 1.05, 300);
}

/* ============ 波次进度 ============ */
function drawHUD(g) {
  const n = g.seeds.length;
  const bankW = 96 + n*60 + 10;
  drawImg(IMG.ui.seedbank, 12, 6, Math.min(bankW, W-140), 76);

  // 阳光计数
  ctx.save();
  drawImg(IMG.ui.sun, 28, 22, 60, 60);
  txt(String(g.sun), 58, 46, 26, '#2b1c09', 'center', '800', null, 0);
  ctx.restore();

  // 卡片
  hitAreas = [];
  g.seeds.forEach((s, i) => {
    const def = PLANTS[s.key];
    const x = 92 + i*60, y = 10, w = 56, h = 80;
    const affordable = g.sun >= def.cost;
    ctx.save();
    drawImg(IMG.ui.seedpacket, x, y, w, h);
    // 植物图标
    const pic = IMG.plants[s.key];
    if (pic) {
      const r = Math.min(40/pic.width, 42/pic.height);
      const pw = pic.width*r, ph = pic.height*r;
      ctx.drawImage(pic, x + w/2 - pw/2, y + 34 - ph/2, pw, ph);
    }
    // 价格
    txt(String(def.cost), x + 28, y + h - 16, 13, affordable ? '#1f3a0e' : '#8a2b1b', 'center', '800', 'rgba(255,255,255,.5)', 2);
    if (s.cd > 0) {
      const frac = s.cd / def.cd;
      ctx.fillStyle = 'rgba(20,20,20,.55)';
      ctx.fillRect(x + 2, y + 2, w - 4, (h - 4)*frac);
    }
    if (!affordable) {
      ctx.fillStyle = 'rgba(30,10,0,.45)';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    }
    if (g.selected === i) {
      ctx.strokeStyle = '#ffe36e'; ctx.lineWidth = 3;
      roundRect(x-1, y-1, w+2, h+2, 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1;
      roundRect(x+2, y+2, w-4, h-4, 4); ctx.stroke();
    }
    ctx.restore();
    hitAreas.push({ x, y, w, h, type:'card', idx:i });
  });

  // 铲子
  const sx = Math.min(bankW, W-140) + 22;
  drawImg(IMG.ui.shovelbank, sx, 14, 64, 64);
  drawImg(IMG.ui.shovel, sx + 8, 14, 48, 48);
  if (g.shovel) { ctx.strokeStyle = '#ffe36e'; ctx.lineWidth = 3; roundRect(sx+2, 8, 68, 70, 8); ctx.stroke(); }
  hitAreas.push({ x: sx, y: 8, w: 68, h: 72, type:'shovel' });

  // 暂停
  const px = W - 58, py = 18;
  ctx.fillStyle = 'rgba(30,18,8,.66)'; roundRect(px, py, 44, 44, 22); ctx.fill();
  ctx.strokeStyle = 'rgba(245,215,110,.65)'; ctx.lineWidth = 2; roundRect(px, py, 44, 44, 22); ctx.stroke();
  txt('Ⅱ', px+22, py+23, 22, '#f5d76e');
  hitAreas.push({ x: px, y: py, w: 44, h: 44, type:'pause' });

  // 进度条
  const pw = 300, ph = 18, bx = W - pw - 28, by = H - 38;
  ctx.fillStyle = 'rgba(20,12,6,.72)'; roundRect(bx, by, pw, ph, 9); ctx.fill();
  ctx.strokeStyle = 'rgba(210,170,90,.7)'; ctx.lineWidth = 1.5; roundRect(bx, by, pw, ph, 9); ctx.stroke();
  const prog = Math.min(1, g.waveIndex / g.cfg.waves);
  ctx.fillStyle = 'rgba(120,200,80,.55)'; roundRect(bx+2, by+2, (pw-4)*prog, ph-4, 7); ctx.fill();
  // 旗帜
  for (let f = 5; f <= g.cfg.waves; f += 5) {
    const fx = bx + 2 + (pw-4)*((f-1)/g.cfg.waves);
    ctx.fillStyle = '#e8d36b'; ctx.fillRect(fx, by-8, 2, ph+16);
    ctx.beginPath(); ctx.moveTo(fx+2, by-8); ctx.lineTo(fx+16, by-3); ctx.lineTo(fx+2, by+2); ctx.fillStyle='#c44536'; ctx.fill();
  }
  txt(`${g.waveIndex}/${g.cfg.waves} 波`, bx + pw - 12, by - 14, 13, '#f2e2bf', 'right', '700');
  txt(`${LEVELS[g.levelIndex].id}  ${LEVELS[g.levelIndex].title}`, bx + 4, by - 14, 13, '#f2e2bf', 'left', '700');

  if (g.huge) {
    // 最终波提示
    txt('FINAL WAVE', bx + pw/2, by - 14, 13, '#ff9c6b', 'center', '800');
  }
}

/* ============ 场景绘制 ============ */
function drawBackground(world) {
  const im = IMG.bg[world] || IMG.bg.day;
  if (im) ctx.drawImage(im, 0, 0, W, H);
  else { ctx.fillStyle = '#3d7a2a'; ctx.fillRect(0, 0, W, H); }
}
function drawBoardObjects(g) {
  // 小推车
  g.mowers.forEach(m => {
    if (!m.active && !m.running) return;
    const x = m.x, y = rowBottom(m.row) - 58;
    drawImg(IMG.ui.lawnmower, x, y, 82, 68);
  });

  // 植物
  g.plants.forEach(p => drawPlant(g, p));

  // 僵尸
  g.zombies.forEach(z => drawZombie(g, z));

  // 抛射物
  g.projectiles.forEach(p => drawProjectile(g, p));

  // 阳光
  g.suns.forEach(s => {
    const bob = Math.sin((g.time*2.4)+s.glow)*3;
    ctx.save();
    if (!s.landed) ctx.globalAlpha = Math.min(1, (s.y+30)/80);
    ctx.shadowColor = 'rgba(255,225,90,.85)'; ctx.shadowBlur = 18;
    drawImg(IMG.ui.sun, s.x - 27, s.y - 27 + bob, 54, 54);
    ctx.restore();
  });

  // 粒子
  g.particles.forEach(p => {
    if (p.type === 'ring') {
      const t = 1 - p.life/p.maxLife;
      ctx.strokeStyle = `rgba(255,175,70,${(1-t)*.85})`;
      ctx.lineWidth = 8*(1-t)+1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (p.maxR-p.r)*t, 0, Math.PI*2); ctx.stroke();
    } else {
      ctx.globalAlpha = Math.max(0, p.life/p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}
function drawPlant(g, p) {
  const pic = IMG.plants[p.key];
  const cy = rowBottom(p.row) - 4;
  shadowEllipse(p.x, cy - 2, LAWN.cw*0.36, 10, .3);
  let wob = Math.sin(g.time*3 + p.col*1.3 + p.row)*2;
  if (p.def.family === 'producer') wob = Math.sin(g.time*2 + p.col)*2.2;
  const maxH = p.key === 'tallnut' ? LAWN.ch*1.12 : p.key === 'pumpkin' ? LAWN.ch*0.86 : LAWN.ch*0.95;
  const maxW = p.key === 'pumpkin' ? LAWN.cw*0.94 : LAWN.cw*0.9;
  ctx.save();
  if (p.hp/p.maxHp < 0.35 && p.def.family === 'barrier') ctx.globalAlpha = 0.86;
  drawFit(pic, p.x, cy + wob, maxW, maxH, true);
  ctx.restore();
  if (p.def.family === 'mine' && !p.armed) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x, cy-2, LAWN.cw*0.3, 8, 0, 0, Math.PI*2); ctx.fill();
  }
  if (p.def.family === 'spike') {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(p.x - LAWN.cw*0.42, cy-8, LAWN.cw*0.84, 10);
  }
  if (p.def.family === 'lily') {
    ctx.fillStyle = 'rgba(80,180,90,.25)'; ctx.beginPath(); ctx.ellipse(p.x, cy-6, LAWN.cw*0.4, 12, 0, 0, Math.PI*2); ctx.fill();
  }
  // 血条
  if (p.hp < p.maxHp) {
    const w = LAWN.cw*0.62, x = p.x - w/2, y = cy - maxH - 8;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#7ad04f'; ctx.fillRect(x, y, w*Math.max(0, p.hp/p.maxHp), 5);
  }
}
function drawZombie(g, z) {
  const def = z.def;
  const bottom = rowBottom(z.row) + 14;
  const targetH = LAWN.ch*0.98*def.scale;
  const pic = IMG.zombies[z.type];
  let hop = 0;
  if (def.hop) hop = Math.abs(Math.sin(z.hopPhase))*14;
  if (z.vaulting > 0) hop = Math.sin((1 - z.vaulting/0.45)*Math.PI)*46;
  const wob = z.eating ? Math.sin(g.time*14)*2.5 : Math.sin(g.time*6 + z.z*9)*1.6;
  shadowEllipse(z.x, bottom - 2, 22, 7, .3);
  ctx.save();
  if (z.frozen > 0) ctx.globalAlpha = 0.95;
  ctx.translate(z.x, bottom - hop + wob*0.4);
  if (z.flash > 0) { ctx.save(); ctx.globalCompositeOperation='lighter'; }
  const r = Math.min(LAWN.cw*1.05/pic.width, targetH/pic.height);
  const w = pic.width*r, h = pic.height*r;
  ctx.drawImage(pic, -w/2, -h, w, h);
  if (z.flash > 0) ctx.restore();
  if (z.frozen > 0) {
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#9fe6ff';
    ctx.beginPath(); ctx.ellipse(0, -h/2, w*0.55, h*0.55, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // 生命/护甲条
  const barW = 44, bx = z.x - barW/2, by = bottom - targetH - 12;
  if (z.shieldMax > 0 && z.shield > 0) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by, barW, 4);
    ctx.fillStyle = '#cfd6dd'; ctx.fillRect(bx, by, barW*(z.shield/z.shieldMax), 4);
  }
  if (z.hp < z.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by+6, barW, 4);
    ctx.fillStyle = '#c44536'; ctx.fillRect(bx, by+6, barW*Math.max(0,z.hp/z.maxHp), 4);
  }
}
function drawProjectile(g, p) {
  if (p.kind === 'pea') {
    const im = p.fire ? IMG.ui.pea : (p.slow ? IMG.ui.snow : IMG.ui.pea);
    const s = 18;
    if (p.fire) {
      ctx.save(); ctx.shadowColor = '#ff8a2b'; ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(255,140,40,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    } else drawImg(im, p.x - s/2, p.y - s/2, s, s);
  } else {
    const t = p.t || 0;
    const x = p.x + (p.tx - p.x) * t;
    const y = p.y + 20*t - Math.sin(t*Math.PI)*95;
    const im = p.img === 'melon' ? IMG.ui.melon : IMG.ui.cabbage;
    const s = p.img === 'melon' ? 30 : 22;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t*6);
    drawImg(im, -s/2, -s/2, s, s);
    ctx.restore();
    shadowEllipse(x, rowBottom(p.row) - 6, 8, 4, .12);
  }
}

/* ============ 游戏画面 ============ */
function drawGame() {
  const g = game;
  ctx.save();
  if (g.screenShake > 0) ctx.translate((Math.random()-0.5)*g.screenShake, (Math.random()-0.5)*g.screenShake);
  drawBackground(g.world);

  // 水格提示
  if (g.water) {
    for (let r = 0; r < LAWN.rows; r++) if (isWaterRow(r)) {
      ctx.fillStyle = 'rgba(90,190,255,.10)';
      ctx.fillRect(LAWN.x0, LAWN.y0 + r*LAWN.ch, LAWN.x1-LAWN.x0, LAWN.ch);
    }
  }

  drawBoardObjects(g);
  ctx.restore();

  drawHUD(g);

  // 拖拽/放置预览
  if (g.hoverCell && g.selected >= 0) {
    const s = g.seeds[g.selected];
    const def = PLANTS[s.key];
    const { x, y } = cellCenter(g.hoverCell.col, g.hoverCell.row);
    const valid = canPlant(g, g.hoverCell.col, g.hoverCell.row, s.key) && g.sun >= def.cost && s.cd <= 0;
    ctx.fillStyle = valid ? 'rgba(120,240,120,.32)' : 'rgba(240,80,60,.32)';
    ctx.fillRect(x - LAWN.cw/2 + 2, y - LAWN.ch/2 + 2, LAWN.cw - 4, LAWN.ch - 4);
    const pic = IMG.plants[s.key];
    if (pic) { ctx.globalAlpha = .55; drawFit(pic, x, rowBottom(g.hoverCell.row)-4, LAWN.cw*.9, LAWN.ch*.95, true); ctx.globalAlpha = 1; }
    // 射程提示
    if (def.family === 'shooter' || def.family === 'fume') {
      ctx.strokeStyle = 'rgba(255,255,180,.22)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(LAWN.x1, y); ctx.stroke();
    }
  }
  if (g.shovel && g.hoverCell) {
    const { x, y } = cellCenter(g.hoverCell.col, g.hoverCell.row);
    ctx.strokeStyle = 'rgba(255,120,90,.65)'; ctx.lineWidth = 3;
    ctx.strokeRect(x - LAWN.cw/2 + 3, y - LAWN.ch/2 + 3, LAWN.cw - 6, LAWN.ch - 6);
  }

  // 横幅
  if (g.bannerT > 0 && g.banner) {
    const t = g.bannerT;
    const a = Math.min(1, t*2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(10,6,3,.62)'; ctx.fillRect(0, H*0.36, W, 96);
    txt(g.banner.text, W/2, H*0.36+40, 44, '#ffe36e', 'center', '900', 'rgba(120,30,10,.9)', 8);
    txt(g.banner.sub, W/2, H*0.36+78, 17, '#ffd0a0', 'center', '700');
    ctx.restore();
  }

  // 暂停
  if (g.paused && !g.over) drawPauseOverlay();
  // 结束
  if (g.over) drawOverOverlay();
}

function drawPauseOverlay() {
  hitAreas = [];
  ctx.fillStyle = 'rgba(8,5,3,.72)'; ctx.fillRect(0,0,W,H);
  txt('游戏暂停', W/2, H/2-80, 46, '#ffe36e', 'center', '900', 'rgba(90,40,10,.9)', 8);
  drawButton(W/2-130, H/2-10, 260, 54, '继续游戏', () => { game.paused = false; }, 'pauseResume');
  drawButton(W/2-130, H/2+62, 260, 54, '返回主菜单', () => { stopMusic(); state='menu'; game=null; playMusic('MainMenu',0.5); }, 'pauseMenu');
  drawButton(W/2-130, H/2+134, 260, 54, '重新开始', () => { startLevel(game.levelIndex); }, 'pauseRestart');
}
function drawOverOverlay() {
  hitAreas = [];
  const win = game.over === 'win';
  ctx.fillStyle = 'rgba(8,5,3,.78)'; ctx.fillRect(0,0,W,H);
  if (win) {
    txt('关卡完成！', W/2, H/2-108, 52, '#ffe36e', 'center', '900', 'rgba(90,40,10,.9)', 9);
    txt(`你守住了 ${LEVELS[game.levelIndex].id} ${LEVELS[game.levelIndex].title}`, W/2, H/2-50, 18, '#ffe0b0');
    if (game.levelIndex + 1 < LEVELS.length)
      drawButton(W/2-150, H/2+10, 300, 56, '进入下一关', () => nextLevel(), 'winNext');
    else
      txt('已经通关全部 15 个关卡！', W/2, H/2+16, 22, '#ffe0b0');
    drawButton(W/2-150, H/2+84, 300, 50, '选择关卡', () => { state='select'; game=null; musicStopSafe(); }, 'winSelect');
    drawButton(W/2-150, H/2+146, 300, 46, '返回主菜单', () => { state='menu'; game=null; musicStopSafe(); }, 'winMenu');
  } else {
    txt('僵尸吃掉了你的脑子！', W/2, H/2-108, 44, '#ff8b6b', 'center', '900', 'rgba(60,10,5,.9)', 9);
    txt('再试一次吧，调整阵型与阳光节奏。', W/2, H/2-54, 17, '#ffd6c0');
    drawButton(W/2-150, H/2+4, 300, 56, '重新开始', () => startLevel(game.levelIndex), 'loseRestart');
    drawButton(W/2-150, H/2+78, 300, 50, '选择关卡', () => { state='select'; game=null; musicStopSafe(); }, 'loseSelect');
    drawButton(W/2-150, H/2+140, 300, 46, '返回主菜单', () => { state='menu'; game=null; musicStopSafe(); }, 'loseMenu');
  }
}

/* ============ 菜单 ============ */
const menuButtons = [
  { id:'start', label:'开始冒险', sub:'从 1-1 开始' },
  { id:'select', label:'选择关卡', sub:'15 个关卡 · 3 个世界' },
  { id:'almanac', label:'植物图鉴', sub:'30 种植物资料' },
  { id:'data', label:'原版关卡资料', sub:'291 份原始 JSON' },
  { id:'help', label:'操作说明', sub:'怎么玩' }
];
function drawMenu() {
  hitAreas = [];
  const im = IMG.bg.menu;
  if (im) {
    const r = Math.max(W/im.width, H/im.height);
    const dw = im.width*r, dh = im.height*r;
    ctx.drawImage(im, (W-dw)/2, (H-dh)/2, dw, dh);
  }
  ctx.fillStyle = 'rgba(10,6,3,.38)'; ctx.fillRect(0,0,W,H);
  // 标题
  txt('植物大战僵尸', W/2, 84, 56, '#ffe36e', 'center', '900', 'rgba(90,40,10,.92)', 10);
  txt('RH · 网页复刻版', W/2, 142, 26, '#ffd78f', 'center', '800', 'rgba(60,25,5,.9)', 6);
  txt('原始美术 · 原始音效 · 原始关卡数据', W/2, 176, 15, '#e8dcc0');

  // 按钮面板
  ctx.fillStyle = 'rgba(20,12,6,.72)'; roundRect(W/2-200, 208, 400, 340, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(220,180,100,.55)'; ctx.lineWidth = 2; roundRect(W/2-200, 208, 400, 340, 16); ctx.stroke();
  menuButtons.forEach((b, i) => {
    const x = W/2-170, y = 228 + i*63, w = 340, h = 52;
    const hover = pointer.x >= x && pointer.x <= x+w && pointer.y >= y && pointer.y <= y+h;
    ctx.fillStyle = hover ? 'rgba(110,76,30,.92)' : 'rgba(58,42,23,.92)';
    roundRect(x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = hover ? '#ffe36e' : 'rgba(190,150,80,.7)'; ctx.lineWidth = hover ? 2.5 : 1.5;
    roundRect(x, y, w, h, 10); ctx.stroke();
    txt(b.label, x+22, y+h/2-5, 20, hover ? '#fff2c2' : '#f2d79a', 'left', '800');
    txt(b.sub, x+w-18, y+h/2+11, 11, 'rgba(230,205,160,.75)', 'right', '600', null, 0);
    hitAreas.push({ x, y, w, h, type:'menu', id:b.id });
  });
  txt('基于《PlantsVsZombiesRH-Mod v3.8.1》APK 资源复刻制作', W/2, H-18, 12, 'rgba(240,225,190,.65)');
}

function drawLevelSelect() {
  hitAreas = [];
  const im = IMG.bg.day;
  if (im) ctx.drawImage(im, 0, 0, W, H);
  ctx.fillStyle = 'rgba(8,5,3,.72)'; ctx.fillRect(0,0,W,H);
  txt('选择关卡', W/2, 52, 38, '#ffe36e', 'center', '900', 'rgba(90,40,10,.9)', 7);
  txt('已完成 0 / 15', W/2, 88, 14, '#e8dcc0');

  const cols = 5, tw = 232, th = 118, gx = 18, gy = 16;
  const startX = W/2 - (cols*tw + (cols-1)*gx)/2;
  const startY = 118;
  LEVELS.forEach((lv, i) => {
    const c = i % cols, r = Math.floor(i/cols);
    const x = startX + c*(tw+gx), y = startY + r*(th+gy);
    const hover = pointer.x>=x && pointer.x<=x+tw && pointer.y>=y && pointer.y<=y+th;
    ctx.fillStyle = hover ? 'rgba(84,60,28,.95)' : 'rgba(38,27,14,.95)';
    roundRect(x, y, tw, th, 12); ctx.fill();
    ctx.strokeStyle = hover ? '#ffe36e' : 'rgba(190,150,80,.6)'; ctx.lineWidth = hover?2.5:1.5;
    roundRect(x, y, tw, th, 12); ctx.stroke();
    // 缩略背景
    const b = IMG.bg[lv.world];
    if (b) {
      ctx.save(); ctx.globalAlpha = .5;
      ctx.drawImage(b, x+8, y+8, tw-16, th*0.55);
      ctx.restore();
      ctx.fillStyle = 'rgba(10,6,3,.35)'; ctx.fillRect(x+8, y+8, tw-16, th*0.55);
    }
    txt(lv.id, x+16, y+22, 20, '#ffe36e', 'left', '900');
    txt(lv.title, x+tw-16, y+22, 12, '#d9c8a2', 'right', '600');
    const wname = lv.world === 'day' ? '白天' : lv.world === 'night' ? '夜晚' : '泳池';
    txt(`${wname} · ${lv.waves} 波 · 初始阳光 ${lv.sun}`, x+16, y+th-54, 12, '#c8b184', 'left', '600');
    // 植物缩略
    lv.seeds.slice(0,8).forEach((s, k) => {
      const pic = IMG.plants[s];
      if (pic) { const sz=24; ctx.globalAlpha=.9; ctx.drawImage(pic, x+16+k*26, y+th-40, sz, sz); ctx.globalAlpha=1; }
    });
    txt(hover ? '点击开始' : '关卡', x+tw-16, y+th-24, 12, hover?'#ffe36e':'#9c8862', 'right', '700');
    hitAreas.push({ x, y, w: tw, h: th, type:'level', idx:i });
  });
  drawButton(24, H-62, 170, 44, '← 返回主菜单', () => { state='menu'; }, 'selBack');
}

function drawButton(x, y, w, h, label, cb, id) {
  const hover = pointer.x>=x && pointer.x<=x+w && pointer.y>=y && pointer.y<=y+h;
  ctx.fillStyle = hover ? 'rgba(120,84,34,.95)' : 'rgba(62,45,24,.92)';
  roundRect(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = hover ? '#ffe36e' : 'rgba(200,160,90,.7)'; ctx.lineWidth = hover?2.5:1.5;
  roundRect(x, y, w, h, 10); ctx.stroke();
  txt(label, x+w/2, y+h/2, Math.min(20, h*0.42), hover?'#fff2c2':'#f2d79a', 'center', '800');
  hitAreas.push({ x, y, w, h, type:'button', cb, id });
}

/* ============ 交互 ============ */
function canPlant(g, col, row, key) {
  if (col < 0 || col >= LAWN.cols || row < 0 || row >= LAWN.rows) return false;
  const def = PLANTS[key];
  const occ = g.plants.find(p => p.col === col && p.row === row && !p.remove);
  if (occ) {
    // 已有植物时，只有“睡莲上再种一株普通植物”这一种情况允许叠放
    const onLily = g.water && isWaterRow(row) && occ.def.family === 'lily' && !def.needWater && !def.lily;
    if (!onLily) return false;
  }
  if (g.water) {
    const water = isWaterRow(row);
    if (water) {
      // 水生植物可直接种；其它植物需要睡莲
      if (def.needWater || def.lily) return true;
      return !!(occ && occ.def.family === 'lily');
    }
  }
  if (def.needWater || def.lily) return false;
  return true;
}

function tryPlant(g, col, row, seedIdx) {
  const s = g.seeds[seedIdx], def = PLANTS[s.key];
  if (s.cd > 0) { sfx('Buzzer', 0.4); flashBanner('种子还在冷却'); return; }
  if (g.sun < def.cost) { sfx('Buzzer', 0.4); flashBanner('阳光不足'); return; }
  if (!canPlant(g, col, row, s.key)) { sfx('Buzzer', 0.4); flashBanner('这里不能种'); return; }
  const c = cellCenter(col, row);
  const p = {
    key: s.key, def, col, row, x: c.x, y: c.y,
    hp: def.hp, maxHp: def.hp, timer: def.family === 'producer' ? Math.min(6, def.interval*0.4) : 0.6,
    armT: def.arm || 0, armed: def.arm ? false : true,
    anim: 0, state: 'wait', chew: 0, remove: false,
    garliced: false
  };
  if (def.family === 'instant') p.timer = def.key === 'iceshroom' ? 0.7 : 1.0;
  if (def.family === 'blover') p.timer = 0.5;
  if (def.family === 'kelp') p.timer = 0.2;
  g.plants.push(p);
  g.sun -= def.cost;
  s.cd = def.cd;
  g.selected = -1;
  g.shovel = false;
  sfx('Plant', 0.65);
  if (Math.random() < .5) setTimeout(() => sfx('Plant2', 0.4), 120);
}

function flashBanner(text) {
  if (!game) return;
  game.banner = { text, sub: '', t: 0.9 };
  game.bannerT = 0.9;
}

function handleClick(x, y) {
  if (state === 'menu') {
    for (const a of hitAreas) if (x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h && a.type==='menu') {
      sfx('Tap', 0.6);
      if (a.id === 'start') startLevel(0);
      else if (a.id === 'select') { state='select'; sfx('Tap2',0.5); }
      else if (a.id === 'almanac') openAlmanac();
      else if (a.id === 'data') openLevelData();
      else if (a.id === 'help') openHelp();
      return;
    }
    return;
  }
  if (state === 'select') {
    for (const a of hitAreas) {
      if (x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h) {
        if (a.type === 'button') { a.cb(); return; }
        if (a.type === 'level') { sfx('SelectCard', 0.65); startLevel(a.idx); return; }
      }
    }
    return;
  }
  if (state === 'playing' && game) {
    const g = game;
    if (g.over || g.paused) {
      for (const a of hitAreas) if (a.type==='button' && x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h) { sfx('Tap',0.5); a.cb(); return; }
      return;
    }
    // 阳光
    for (let i = g.suns.length-1; i >= 0; i--) {
      const s = g.suns[i];
      if (Math.hypot(x-s.x, y-s.y) < 34) {
        s.gone = true; g.sun += s.value;
        sfx('Coin', 0.65, 1.02);
        spawnParticles(g, s.x, s.y, 6, '#ffe36e');
        return;
      }
    }
    // HUD
    for (const a of hitAreas) {
      if (x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h) {
        if (a.type === 'pause') { g.paused = true; sfx('Pause', 0.5); return; }
        if (a.type === 'card') {
          if (g.shovel) g.shovel = false;
          g.selected = (g.selected === a.idx ? -1 : a.idx);
          if (g.selected >= 0) sfx('SeedLift', 0.55);
          return;
        }
        if (a.type === 'shovel') { g.shovel = !g.shovel; g.selected = -1; sfx('Shovel', 0.5); return; }
      }
    }
    // 草坪
    const col = Math.floor((x - LAWN.x0)/LAWN.cw), row = Math.floor((y - LAWN.y0)/LAWN.ch);
    if (col < 0 || col >= LAWN.cols || row < 0 || row >= LAWN.rows) return;
    if (g.shovel) {
      let idx = g.plants.findIndex(p => p.col === col && p.row === row && !p.remove && p.def.family !== 'lily');
      if (idx < 0) idx = g.plants.findIndex(p => p.col === col && p.row === row && !p.remove);
      if (idx >= 0) { g.plants.splice(idx,1); sfx('Shovel',0.6); g.shovel=false; }
      return;
    }
    if (g.selected >= 0) tryPlant(g, col, row, g.selected);
  }
}

/* ============ DOM 面板 ============ */
function showOverlay(html) {
  panelContent.innerHTML = html;
  overlayEl.classList.remove('hidden');
  overlayEl.scrollTop = 0;
  panelContent.scrollTop = 0;
}
function hideOverlay() { overlayEl.classList.add('hidden'); }
document.getElementById('panelClose').addEventListener('click', hideOverlay);

function openAlmanac() {
  sfx('Tap', 0.5);
  const cards = Object.keys(PLANTS).map(k => {
    const d = PLANTS[k];
    return `<div class="pcard"><img src="${k}.png" alt="">
      <div class="info"><div class="nm">${d.name}</div>
      <div class="meta">阳光 ${d.cost} · 冷却 ${d.cd}s${d.hp?' · 生命 '+d.hp:''}</div>
      <div class="ds">${d.desc}</div></div></div>`;
  }).join('');
  showOverlay(`<h2>植物图鉴</h2><div class="sub">共 ${Object.keys(PLANTS).length} 种植物，美术素材全部来自原 APK</div><div class="plantGrid">${cards}</div>`);
}
function openHelp() {
  sfx('Tap', 0.5);
  showOverlay(`<h2>操作说明</h2><div class="sub">植物大战僵尸 RH 网页复刻版</div>
  <h3>基本操作</h3>
  <ul>
    <li>点击顶部的种子卡片，再点击草坪格子即可种植；右键或再次点击卡片取消。</li>
    <li>点击下落的阳光即可收集，向日葵也会持续产出阳光。</li>
    <li>点击铲子按钮进入铲除模式，再点击植物即可移除。</li>
    <li>僵尸走到最左侧时，小推车会自动启动；若该行小推车已用掉，游戏失败。</li>
    <li>撑过全部波次即可过关，红色旗帜标记第 5、10… 波。</li>
  </ul>
  <h3>泳池关卡</h3>
  <ul>
    <li>中间两行为水面：普通植物必须先种“睡莲”才能放置。</li>
    <li>水兵菇、缠绕海草可以直接种在水面。</li>
  </ul>
  <h3>素材说明</h3>
  <p>植物立绘、僵尸立绘、草坪背景、种子卡、小推车、阳光、音乐与音效均提取自原 APK 的 Unity 资源；数值与行为参照原版《植物大战僵尸》体系复刻。</p>`);
}
function openLevelData() {
  sfx('Tap', 0.5);
  const data = window.ORIGINAL_LEVELS;
  if (!data || !data.assets) { showOverlay('<h2>原版关卡资料</h2><p>未找到 levels.js。</p>'); return; }
  const items = data.assets.map((a,i) => `<div class="lvItem" data-i="${i}"><span>${escapeHtml(a.name)}</span><span>${a.content.length} 字符</span></div>`).join('');
  showOverlay(`<h2>原版关卡资料</h2>
    <div class="sub">从 APK 提取的全部 ${data.count} 份 TextAsset（关卡 / 自定义关卡 / 配置）。可直接查看原始 JSON 文本。</div>
    <div class="levelTools"><input id="lvSearch" placeholder="搜索关卡名，例如 1391、火炬、CustomIZ…"></div>
    <div class="lvList" id="lvList">${items}</div>
    <div id="lvViewer"><div class="hd"><span id="lvTitle"></span><button id="lvBack">← 返回列表</button></div><pre id="lvPre"></pre></div>`);
  const list = document.getElementById('lvList');
  const viewer = document.getElementById('lvViewer');
  const pre = document.getElementById('lvPre');
  const title = document.getElementById('lvTitle');
  const back = document.getElementById('lvBack');
  const search = document.getElementById('lvSearch');
  document.getElementById('panelContent').style.position = 'relative';
  list.addEventListener('click', e => {
    const it = e.target.closest('.lvItem');
    if (!it) return;
    const i = +it.dataset.i;
    title.textContent = data.assets[i].name;
    pre.textContent = data.assets[i].content;
    viewer.classList.add('show');
  });
  back.addEventListener('click', () => viewer.classList.remove('show'));
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    [...list.children].forEach((el, i) => {
      el.style.display = data.assets[i].name.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot'}[c])); }

/* ============ 输入 ============ */
function canvasPos(evt) {
  const r = canvas.getBoundingClientRect();
  const cx = (evt.clientX - r.left) / r.width * W;
  const cy = (evt.clientY - r.top) / r.height * H;
  return { x: cx, y: cy };
}
canvas.addEventListener('pointermove', e => {
  const p = canvasPos(e); pointer.x = p.x; pointer.y = p.y;
  if (state === 'playing' && game && !game.paused && !game.over) {
    const col = Math.floor((p.x - LAWN.x0)/LAWN.cw), row = Math.floor((p.y - LAWN.y0)/LAWN.ch);
    game.hoverCell = (col>=0 && col<LAWN.cols && row>=0 && row<LAWN.rows) ? { col, row } : null;
  }
});
canvas.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; if (game) game.hoverCell = null; });
canvas.addEventListener('pointerdown', e => {
  if (!firstPaint) return;
  if (!assetsReady) return;
  initAudioUnlock();
  const p = canvasPos(e);
  pointer.down = true;
  handleClick(p.x, p.y);
});
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (state === 'playing' && game) { game.selected = -1; game.shovel = false; }
});
window.addEventListener('keydown', e => {
  if (state === 'playing' && game) {
    if (e.key === 'Escape') { game.selected = -1; game.shovel = false; game.paused = !game.paused; }
    if (e.key === ' ') { e.preventDefault(); game.paused = !game.paused; }
  }
  if (e.key === 'Escape' && !overlayEl.classList.contains('hidden')) hideOverlay();
});

let audioUnlocked = false;
function initAudioUnlock() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (state === 'menu') playMusic('MainMenu', 0.5);
}

/* ============ 主循环 ============ */
function loop(ts) {
  if (!last) last = ts;
  let dt = (ts - last)/1000;
  last = ts;
  dt = Math.min(dt, 0.05);
  menuTime += dt;

  if (state === 'playing' && game) {
    update(dt);
    frameDrawGame();
  } else if (state === 'select') {
    frameDrawSelect();
  } else {
    frameDrawMenu();
  }
  requestAnimationFrame(loop);
}
function frameDrawGame() {
  ctx.clearRect(0, 0, W, H);
  drawGame();
}
function frameDrawMenu() {
  ctx.clearRect(0, 0, W, H);
  drawMenu();
}
function frameDrawSelect() {
  ctx.clearRect(0, 0, W, H);
  drawLevelSelect();
}

/* ============ 启动 ============ */
loadAssets().then(() => {
  requestAnimationFrame(loop);
});
// 面板打开时暂停键盘/游戏切换提示
window.ORIGINAL_LEVELS = window.ORIGINAL_LEVELS || null;
// 调试入口（不影响游戏）
window.PVZ = { get state(){ return state; }, get game(){ return game; }, startLevel };
})();
