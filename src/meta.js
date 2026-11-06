// 成就与本地排行榜：全部存 localStorage，无后端依赖。

const LS_STATS = 'pelican_ride_stats_v2';
const LS_BOARD = 'pelican_ride_board_v1';
const LS_NAME = 'pelican_ride_name_v1';
const BOARD_MAX = 10;

// prog(run, total) -> [当前值, 目标值]，当前值 >= 目标值即解锁。
export const ACHIEVEMENTS = [
  { id: 'first_run',    icon: '🚲', name: '初次上路',   desc: '完成第一局骑行',            prog: (r, t) => [Math.min(t.runs, 1), 1] },
  { id: 'run_coins_50', icon: '🪙', name: '攒钱第一步', desc: '单局吃到 50 枚金币',        prog: (r, t) => [r.coins, 50] },
  { id: 'coins_500',    icon: '💰', name: '金币收藏家', desc: '累计吃到 500 枚金币',       prog: (r, t) => [t.coins, 500] },
  { id: 'coins_2000',   icon: '👑', name: '金币大亨',   desc: '累计吃到 2000 枚金币',      prog: (r, t) => [t.coins, 2000] },
  { id: 'run_smash_10', icon: '💥', name: '拆除小队',   desc: '单局撞碎 10 个障碍',        prog: (r, t) => [r.smashed, 10] },
  { id: 'smash_100',    icon: '🔨', name: '破坏狂',     desc: '累计撞碎 100 个障碍',       prog: (r, t) => [t.smashed, 100] },
  { id: 'magnet_10',    icon: '🧲', name: '磁力爱好者', desc: '累计吸收 10 个磁铁道具',    prog: (r, t) => [t.magnets, 10] },
  { id: 'magnet_50',    icon: '💠', name: '磁力大师',   desc: '累计吸收 50 个磁铁道具',    prog: (r, t) => [t.magnets, 50] },
  { id: 'heal_20',      icon: '🩹', name: '心跳急救',   desc: '累计拾取 20 个血瓶',        prog: (r, t) => [t.healths, 20] },
  { id: 'jump_100',     icon: '🦘', name: '跳跃健将',   desc: '累计跳跃 100 次',           prog: (r, t) => [t.jumps, 100] },
  { id: 'run_jump_20',  icon: '🐇', name: '兔子心跳',   desc: '单局跳跃 20 次',            prog: (r, t) => [r.jumps, 20] },
  { id: 'run_dist_1k',  icon: '🛣️', name: '千米骑士',   desc: '单局骑行 1000 米',          prog: (r, t) => [Math.floor(r.dist), 1000] },
  { id: 'dist_10k',     icon: '🌅', name: '千里之行',   desc: '累计骑行 10 公里',          prog: (r, t) => [Math.floor(t.distance), 10000] },
  { id: 'score_1000',   icon: '🔢', name: '突破四位数', desc: '单局得分超过 1000',         prog: (r, t) => [Math.floor(r.score), 1000] },
  { id: 'score_5000',   icon: '🏆', name: '海岸传奇',   desc: '单局得分超过 5000',         prog: (r, t) => [Math.floor(r.score), 5000] },
  { id: 'combo_30',     icon: '🔥', name: '连击之王',   desc: '单局达成 30 连击',          prog: (r, t) => [r.bestCombo, 30] },
  { id: 'boost_120',    icon: '⚡', name: '极速猎人',   desc: '累计加速骑行 2 分钟',       prog: (r, t) => [Math.floor(t.boostTime), 120] },
  { id: 'nohit_500',    icon: '🛡️', name: '毫发无损',   desc: '单局连续 500 米不受伤',     prog: (r, t) => [Math.floor(r.noHitDist), 500] },
  { id: 'views_5',      icon: '🎬', name: '视角探索者', desc: '体验全部 5 种视角',         prog: (r, t) => [t.views, 5] },
];

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }

function freshStats() {
  return { runs: 0, coins: 0, smashed: 0, magnets: 0, healths: 0, jumps: 0, distance: 0, boostTime: 0, viewBits: 0, views: 0, maxScore: 0, unlocked: [] };
}
function freshRun() {
  return { score: 0, coins: 0, smashed: 0, jumps: 0, dist: 0, bestCombo: 0, noHitDist: 0, boostTime: 0 };
}
const fmt = (n) => Number(n).toLocaleString('zh-CN');

// ---------- 排行榜 ----------
export function loadBoard() { return loadJSON(LS_BOARD, []); }
export function boardQualifies(score) {
  const b = loadBoard();
  return score > 0 && (b.length < BOARD_MAX || score > b[b.length - 1].score);
}
export function boardAdd(entry) {
  const b = loadBoard();
  b.push(entry);
  b.sort((x, y) => y.score - x.score);
  const kept = b.slice(0, BOARD_MAX);
  saveJSON(LS_BOARD, kept);
  const rank = kept.indexOf(entry);
  return rank >= 0 ? rank + 1 : -1;
}
export function getName() { return localStorage.getItem(LS_NAME) || ''; }
export function setName(n) { try { localStorage.setItem(LS_NAME, n); } catch (e) { /* ignore */ } }

// ---------- 成就与统计 ----------
export function createMeta() {
  const stats = Object.assign(freshStats(), loadJSON(LS_STATS, {}));
  if (!Array.isArray(stats.unlocked)) stats.unlocked = [];
  if (!stats.viewBits) stats.viewBits = 0;
  const unlockedSet = new Set(stats.unlocked);
  let run = freshRun();
  const runNewly = [];
  const toastQueue = [];
  let toastBusy = false;
  let onUnlockCb = null;

  function save() {
    stats.unlocked = [...unlockedSet];
    saveJSON(LS_STATS, stats);
  }

  function evaluate() {
    let newly = null;
    for (const a of ACHIEVEMENTS) {
      if (unlockedSet.has(a.id)) continue;
      const [cur, goal] = a.prog(run, stats);
      if (cur >= goal) { unlockedSet.add(a.id); (newly || (newly = [])).push(a); }
    }
    if (newly) {
      save();
      for (const a of newly) { runNewly.push(a); queueToast(a); if (onUnlockCb) onUnlockCb(a); }
    }
    return newly;
  }

  function queueToast(a) {
    toastQueue.push(a);
    pump();
  }
  function pump() {
    if (toastBusy || !toastQueue.length) return;
    toastBusy = true;
    const a = toastQueue.shift();
    const host = document.getElementById('toasts');
    if (host) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<div class="toast-icon">' + a.icon + '</div>' +
        '<div class="toast-body"><div class="toast-title">成就解锁 · ' + a.name + '</div>' +
        '<div class="toast-desc">' + a.desc + '</div></div>';
      host.appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3100);
    }
    setTimeout(() => { toastBusy = false; pump(); }, 800);
  }

  function event(name) {
    switch (name) {
      case 'coin': stats.coins++; run.coins++; break;
      case 'smash': stats.smashed++; run.smashed++; break;
      case 'magnet': stats.magnets++; break;
      case 'health': stats.healths++; break;
      case 'jump': stats.jumps++; run.jumps++; break;
    }
    evaluate();
  }
  function viewMode(i) {
    stats.viewBits |= (1 << i);
    let c = 0, b = stats.viewBits;
    while (b) { c += b & 1; b >>= 1; }
    stats.views = c;
    evaluate();
  }

  function endRun() {
    stats.runs++;
    stats.distance += run.dist;
    stats.boostTime += run.boostTime;
    stats.maxScore = Math.max(stats.maxScore || 0, Math.floor(run.score));
    evaluate();
    const newly = runNewly.slice();
    runNewly.length = 0;
    return newly;
  }
  function resetRun() {
    // 原地重置，保证外部持有的 run 引用始终有效
    Object.assign(run, freshRun());
    runNewly.length = 0;
  }

  // ---------- 面板渲染 ----------
  function renderAchvPanel() {
    const el = document.getElementById('achv-list');
    if (el) {
      el.innerHTML = ACHIEVEMENTS.map((a) => {
        const [cur, goal] = a.prog(run, stats);
        const done = unlockedSet.has(a.id);
        const pct = Math.min(100, Math.round((cur / goal) * 100));
        return '<div class="achv' + (done ? ' done' : '') + '">' +
          '<div class="achv-icon">' + a.icon + '</div>' +
          '<div class="achv-info"><div class="achv-name">' + a.name + '</div>' +
          '<div class="achv-desc">' + a.desc + '</div>' +
          '<div class="achv-bar"><i style="width:' + pct + '%"></i></div></div>' +
          '<div class="achv-stat">' + (done ? '已解锁' : fmt(Math.floor(cur)) + ' / ' + fmt(goal)) + '</div></div>';
      }).join('');
    }
    const head = document.getElementById('achv-count');
    if (head) head.textContent = '已解锁 ' + unlockedSet.size + ' / ' + ACHIEVEMENTS.length;
  }

  function renderBoardPanel() {
    const el = document.getElementById('board-list');
    if (!el) return;
    const b = loadBoard();
    if (!b.length) { el.innerHTML = '<div class="board-empty">还没有记录<br>完成一局并保存成绩，就能登上榜单</div>'; return; }
    el.innerHTML = b.map((e, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
      const d = new Date(e.date || Date.now());
      const ds = (d.getMonth() + 1) + '/' + d.getDate();
      return '<div class="board-row' + (i < 3 ? ' top' : '') + '">' +
        '<div class="board-rank">' + medal + '</div>' +
        '<div class="board-name">' + escapeHtml(e.name) + '</div>' +
        '<div class="board-sub">' + e.coins + ' 金币 · ' + Math.floor(e.dist) + 'm · ' + ds + '</div>' +
        '<div class="board-score">' + fmt(e.score) + '</div></div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return {
    run, stats,
    event, viewMode, evaluate, endRun, resetRun,
    setOnUnlock(cb) { onUnlockCb = cb; },
    unlockedCount: () => unlockedSet.size,
    totalAchv: () => ACHIEVEMENTS.length,
    renderAchvPanel, renderBoardPanel,
    summary() {
      const km = (stats.distance / 1000).toFixed(1);
      return '最高分 ' + fmt(stats.maxScore || 0) + ' · 成就 ' + unlockedSet.size + '/' + ACHIEVEMENTS.length + ' · 累计 ' + km + 'km';
    },
  };
}
