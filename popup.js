// ShieldVPN — Popup Script (Free + Paid)

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const app         = document.getElementById('app');
const orbBtn      = document.getElementById('orbBtn');
const orbStatus   = document.getElementById('orbStatus');
const orbLabel    = document.getElementById('orbLabel');
const planBadge   = document.getElementById('planBadge');

const viewMain     = document.getElementById('viewMain');
const viewServers  = document.getElementById('viewServers');
const viewSettings = document.getElementById('viewSettings');
const viewAffiliate= document.getElementById('viewAffiliate');

const statUp    = document.getElementById('statUp');
const statDown  = document.getElementById('statDown');
const statTime  = document.getElementById('statTime');
const ipValue   = document.getElementById('ipValue');
const ipBadge   = document.getElementById('ipBadge');
const ipBadgeText = document.getElementById('ipBadgeText');

const selectorFlag  = document.getElementById('selectorFlag');
const selectorName  = document.getElementById('selectorName');
const selectorCity  = document.getElementById('selectorCity');
const selectorTier  = document.getElementById('selectorTier');
const pingVal       = document.getElementById('pingVal');

const toggleKillSwitch  = document.getElementById('toggleKillSwitch');
const toggleAutoConnect = document.getElementById('toggleAutoConnect');

const serverList    = document.getElementById('serverList');
const serverSearch  = document.getElementById('serverSearch');

const configServer  = document.getElementById('configServer');
const configHost    = document.getElementById('configHost');
const configPort    = document.getElementById('configPort');
const configType    = document.getElementById('configType');
const btnSaveConfig = document.getElementById('btnSaveConfig');
const saveMsg       = document.getElementById('saveMsg');

let state = {};
let activeTab = 'free';          // free | paid | live
let timerInterval = null;
let fakeDataInterval = null;

// ─── Util ─────────────────────────────────────────────────────────────────────
function send(action, data = {}) {
  return new Promise(resolve => chrome.runtime.sendMessage({ action, ...data }, resolve));
}
function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}
function formatDuration(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function allServers(s) {
  return [...(s.freeServers||[]), ...(s.paidServers||[]), ...(s.liveProxies||[])];
}
function findServer(s, id) {
  return allServers(s).find(x => x.id === id);
}

// ─── Views ────────────────────────────────────────────────────────────────────
function showView(name) {
  [viewMain, viewServers, viewSettings, viewAffiliate].forEach(v => v.classList.add('hidden'));
  if (name === 'main')      viewMain.classList.remove('hidden');
  if (name === 'servers')   viewServers.classList.remove('hidden');
  if (name === 'settings')  viewSettings.classList.remove('hidden');
  if (name === 'affiliate') viewAffiliate.classList.remove('hidden');
}

// ─── Apply State ──────────────────────────────────────────────────────────────
function applyState(s) {
  state = s;
  const server = findServer(s, s.activeServerId) || (s.freeServers||[])[0];
  const tier   = server?.tier || 'free';

  // Plan badge
  planBadge.textContent  = tier === 'paid' ? 'PRO' : 'FREE';
  planBadge.dataset.tier = tier;

  // Orb
  app.classList.remove('connected', 'connecting');
  if (s.connected) {
    app.classList.add('connected');
    orbStatus.textContent = 'Connected';
    orbLabel.textContent  = tier === 'paid' ? '⭐ Premium Protection' : '🆓 Free Protection';
  } else {
    orbStatus.textContent = 'Tap to connect';
    orbLabel.textContent  = 'Not protected';
  }

  // Server selector
  if (server) {
    selectorFlag.textContent = server.flag;
    selectorName.textContent = server.name;
    selectorCity.textContent = server.city;
    pingVal.textContent      = server.ping + 'ms';
    selectorTier.textContent = tier === 'paid' ? 'PRO' : 'FREE';
    selectorTier.dataset.tier = tier;
  }

  // IP badge
  if (s.connected) {
    ipBadge.dataset.status = 'protected';
    ipBadgeText.textContent = 'Protected';
  } else {
    ipBadge.dataset.status = 'exposed';
    ipBadgeText.textContent = 'Exposed';
  }

  // Toggles
  toggleKillSwitch.setAttribute('aria-checked', String(!!s.killSwitch));
  toggleAutoConnect.setAttribute('aria-checked', String(!!s.autoConnect));

  // Tab counts
  document.getElementById('tabFreeCount').textContent = (s.freeServers||[]).length;
  document.getElementById('tabPaidCount').textContent = (s.paidServers||[]).length;
  document.getElementById('tabLiveCount').textContent = (s.liveProxies||[]).length;

  // Timer
  clearInterval(timerInterval);
  if (s.connected && s.connectedAt) {
    timerInterval = setInterval(() => {
      statTime.textContent = formatDuration(Date.now() - s.connectedAt);
    }, 1000);
    statTime.textContent = formatDuration(Date.now() - s.connectedAt);
  } else {
    statTime.textContent = '00:00';
  }

  // Fake data counter
  clearInterval(fakeDataInterval);
  if (s.connected) {
    let up = 0, down = 0;
    fakeDataInterval = setInterval(() => {
      up   += Math.floor(Math.random() * 800 + 200);
      down += Math.floor(Math.random() * 3000 + 500);
      statUp.textContent   = formatBytes(up);
      statDown.textContent = formatBytes(down);
    }, 800);
  } else {
    statUp.textContent = statDown.textContent = '0 KB';
  }
}

// ─── IP Lookup ────────────────────────────────────────────────────────────────
async function fetchIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    ipValue.textContent = d.ip;
  } catch {
    ipValue.textContent = 'Unavailable';
  }
}

// ─── Orb Connect / Disconnect ─────────────────────────────────────────────────
orbBtn.addEventListener('click', async () => {
  if (state.connected) {
    app.classList.remove('connected');
    orbStatus.textContent = 'Disconnecting…';
    await send('disconnect');
    const { state: s } = await send('get-state');
    applyState(s);
    await fetchIP();
  } else {
    const server = findServer(state, state.activeServerId) || (state.freeServers||[])[0];
    if (!server) return;

    app.classList.add('connecting');
    orbStatus.textContent = 'Connecting…';
    orbLabel.textContent  = server.city;

    const res = await send('connect', { server });
    app.classList.remove('connecting');

    if (res?.success) {
      const { state: s } = await send('get-state');
      applyState(s);
      await fetchIP();
    } else {
      orbStatus.textContent = 'Failed to connect';
      orbLabel.textContent  = res?.error || 'Check server config';
      setTimeout(async () => {
        const { state: s } = await send('get-state');
        applyState(s);
      }, 3000);
    }
  }
});

// ─── Server Selector ──────────────────────────────────────────────────────────
document.getElementById('serverSelector').addEventListener('click', () => {
  // Open to the tab matching the active server tier
  const server = findServer(state, state.activeServerId);
  if (server?.tier === 'paid') switchTab('paid');
  else if ((state.liveProxies||[]).find(x => x.id === state.activeServerId)) switchTab('live');
  else switchTab('free');
  renderServerList();
  showView('servers');
});

// ─── Server Tabs ──────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tier-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('hintFree').classList.toggle('hidden', tab !== 'free');
  document.getElementById('hintPaid').classList.toggle('hidden', tab !== 'paid');
  document.getElementById('hintLive').classList.toggle('hidden', tab !== 'live');
  serverSearch.value = '';
  renderServerList();
}

document.querySelectorAll('.tier-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'live' && !(state.liveProxies||[]).length) {
      loadLiveProxies();
    }
    switchTab(btn.dataset.tab);
  });
});

async function loadLiveProxies() {
  document.getElementById('hintLiveText').textContent = 'Fetching live proxies…';
  document.getElementById('tabLiveCount').textContent = '…';
  const { proxies } = await send('fetch-live-proxies');
  state.liveProxies = proxies;
  document.getElementById('tabLiveCount').textContent = proxies.length;
  document.getElementById('hintLiveText').textContent =
    proxies.length ? `${proxies.length} live proxies loaded` : 'No proxies found — try refreshing';
  renderServerList();
}

document.getElementById('btnRefreshProxies').addEventListener('click', loadLiveProxies);

// ─── Render Server List ────────────────────────────────────────────────────────
function renderServerList() {
  const q = serverSearch.value.toLowerCase();
  let servers;
  if (activeTab === 'free') servers = state.freeServers || [];
  else if (activeTab === 'paid') servers = state.paidServers || [];
  else servers = state.liveProxies || [];

  if (q) servers = servers.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.city.toLowerCase().includes(q) ||
    (s.host||'').includes(q)
  );

  serverList.innerHTML = '';

  if (!servers.length) {
    serverList.innerHTML = `<div class="empty-list">${
      activeTab === 'live' ? '🌐 Click Refresh to load live proxies' : 'No servers found'
    }</div>`;
    return;
  }

  servers.forEach(s => {
    const isActive = s.id === state.activeServerId;
    const needsConfig = s.tier === 'paid' && !s.host;
    const item = document.createElement('div');
    item.className = 'server-item' + (isActive ? ' active' : '');
    item.innerHTML = `
      <div class="si-flag">${s.flag}</div>
      <div class="si-info">
        <div class="si-name">${s.name}</div>
        <div class="si-city">${s.city}${needsConfig ? ' <span class="needs-cfg">• needs config</span>' : ''}${s.note ? ` <span class="si-note">${s.note}</span>` : ''}</div>
      </div>
      <div class="si-right">
        <span class="tier-chip-sm" data-tier="${s.tier}">${s.tier === 'paid' ? 'PRO' : 'FREE'}</span>
        <span class="si-ping">${s.ping}ms</span>
        ${isActive ? `<svg class="si-check" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
      </div>
    `;
    item.addEventListener('click', async () => {
      state.activeServerId = s.id;
      await chrome.storage.local.set({ activeServerId: s.id });
      applyState(state);
      showView('main');
    });
    serverList.appendChild(item);
  });
}

serverSearch.addEventListener('input', renderServerList);

// ─── Navigation ───────────────────────────────────────────────────────────────
document.getElementById('btnBackFromServers').addEventListener('click', () => showView('main'));
document.getElementById('btnBackFromSettings').addEventListener('click', () => showView('main'));
document.getElementById('btnBackFromAffiliate').addEventListener('click', () => showView('main'));
document.getElementById('btnEarn').addEventListener('click', () => showView('affiliate'));
document.getElementById('promoCtaBtn').addEventListener('click', () => showView('affiliate'));

// ─── Settings ─────────────────────────────────────────────────────────────────
document.getElementById('btnSettings').addEventListener('click', () => {
  populatePaidConfig();
  showView('settings');
});

// Settings cfg tabs
document.querySelectorAll('[data-cfg]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-cfg]').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('cfgPanelFree').classList.toggle('hidden', btn.dataset.cfg !== 'free');
    document.getElementById('cfgPanelPaid').classList.toggle('hidden', btn.dataset.cfg !== 'paid');
  });
});

function populatePaidConfig() {
  configServer.innerHTML = '';
  (state.paidServers || []).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.flag} ${s.name} — ${s.city}`;
    configServer.appendChild(opt);
  });
  configServer.value = state.activeServerId;
  loadPaidConfigForSelected();
}

function loadPaidConfigForSelected() {
  const s = (state.paidServers||[]).find(x => x.id === configServer.value);
  if (!s) return;
  configHost.value = s.host || '';
  configPort.value = s.port || 1080;
  configType.value = s.type || 'socks5';
}

configServer.addEventListener('change', loadPaidConfigForSelected);

btnSaveConfig.addEventListener('click', async () => {
  const server = {
    id:   configServer.value,
    host: configHost.value.trim(),
    port: parseInt(configPort.value) || 1080,
    type: configType.value,
    tier: 'paid'
  };
  await send('save-server', { server });
  const { state: s } = await send('get-state');
  state = s;
  saveMsg.classList.remove('hidden');
  setTimeout(() => saveMsg.classList.add('hidden'), 2500);
});

// ─── Toggles ──────────────────────────────────────────────────────────────────
toggleKillSwitch.addEventListener('click', async () => {
  const { killSwitch } = await send('toggle-kill-switch');
  toggleKillSwitch.setAttribute('aria-checked', String(killSwitch));
});
toggleAutoConnect.addEventListener('click', async () => {
  const { autoConnect } = await send('toggle-auto-connect');
  toggleAutoConnect.setAttribute('aria-checked', String(autoConnect));
});

// ─── Affiliate Tracking ───────────────────────────────────────────────────────
['linkNord', 'linkSurf', 'linkExpress'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    chrome.storage.local.get('affiliateClicks', ({ affiliateClicks = {} }) => {
      affiliateClicks[id] = (affiliateClicks[id] || 0) + 1;
      chrome.storage.local.set({ affiliateClicks });
    });
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  const { state: s } = await send('get-state');
  applyState(s);
  await fetchIP();
})();
