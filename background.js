// ShieldVPN — Background Service Worker (Free + Paid)

// ─── Server Definitions ───────────────────────────────────────────────────────

const FREE_SERVERS = [
  {
    id: 'warp-us',   name: 'United States', city: 'Cloudflare WARP', flag: '🇺🇸',
    host: '127.0.0.1', port: 40000, type: 'socks5', ping: 18, tier: 'free',
    note: 'Requires Cloudflare WARP app'
  },
  {
    id: 'tor-any',   name: 'Anonymous',     city: 'Tor Network',    flag: '🧅',
    host: '127.0.0.1', port: 9050,  type: 'socks5', ping: 300, tier: 'free',
    note: 'Requires Tor Browser running'
  },
  {
    id: 'warp-alt',  name: 'United States', city: 'WARP (alt port)', flag: '🇺🇸',
    host: '127.0.0.1', port: 51820, type: 'socks5', ping: 20, tier: 'free',
    note: 'Cloudflare WARP alternate'
  }
];

const PAID_SERVERS = [
  { id: 'us-ny',   name: 'United States',   city: 'New York',     flag: '🇺🇸', host: '', port: 1080, type: 'socks5', ping: 32,  tier: 'paid' },
  { id: 'uk-lon',  name: 'United Kingdom',  city: 'London',       flag: '🇬🇧', host: '', port: 1080, type: 'socks5', ping: 48,  tier: 'paid' },
  { id: 'de-ber',  name: 'Germany',         city: 'Berlin',       flag: '🇩🇪', host: '', port: 1080, type: 'socks5', ping: 55,  tier: 'paid' },
  { id: 'jp-tok',  name: 'Japan',           city: 'Tokyo',        flag: '🇯🇵', host: '', port: 1080, type: 'socks5', ping: 120, tier: 'paid' },
  { id: 'sg-sin',  name: 'Singapore',       city: 'Singapore',    flag: '🇸🇬', host: '', port: 1080, type: 'socks5', ping: 95,  tier: 'paid' },
  { id: 'ca-tor',  name: 'Canada',          city: 'Toronto',      flag: '🇨🇦', host: '', port: 1080, type: 'socks5', ping: 42,  tier: 'paid' },
  { id: 'au-syd',  name: 'Australia',       city: 'Sydney',       flag: '🇦🇺', host: '', port: 1080, type: 'socks5', ping: 180, tier: 'paid' },
  { id: 'fr-par',  name: 'France',          city: 'Paris',        flag: '🇫🇷', host: '', port: 1080, type: 'socks5', ping: 50,  tier: 'paid' },
  { id: 'nl-ams',  name: 'Netherlands',     city: 'Amsterdam',    flag: '🇳🇱', host: '', port: 1080, type: 'socks5', ping: 45,  tier: 'paid' },
  { id: 'br-sao',  name: 'Brazil',          city: 'São Paulo',    flag: '🇧🇷', host: '', port: 1080, type: 'socks5', ping: 140, tier: 'paid' }
];

// ─── Install ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['freeServers', 'paidServers']);
  if (!existing.freeServers) {
    await chrome.storage.local.set({
      freeServers:      FREE_SERVERS,
      paidServers:      PAID_SERVERS,
      liveProxies:      [],
      liveProxiesAt:    null,
      connected:        false,
      activeServerId:   'warp-us',
      activeTier:       'free',
      killSwitch:       false,
      autoConnect:      false,
      bytesUp:          0,
      bytesDown:        0,
      connectedAt:      null,
      affiliateClicks:  {}
    });
  }
});

// ─── Live Free Proxy Fetch ────────────────────────────────────────────────────

async function fetchLiveProxies() {
  try {
    // Public SOCKS5 proxy list API
    const res = await fetch(
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=all&anonymity=elite',
      { signal: AbortSignal.timeout(8000) }
    );
    const text = await res.text();
    const lines = text.trim().split('\n').filter(l => l.includes(':'));
    const proxies = lines.slice(0, 20).map((line, i) => {
      const [host, port] = line.trim().split(':');
      return {
        id:   `live-${i}`,
        name: 'Public Proxy',
        city: `Server #${i + 1}`,
        flag: '🌐',
        host,
        port: parseInt(port) || 1080,
        type: 'socks5',
        ping: Math.floor(Math.random() * 200 + 80),
        tier: 'free',
        note: 'Public free proxy — may be slow'
      };
    });
    await chrome.storage.local.set({ liveProxies: proxies, liveProxiesAt: Date.now() });
    return proxies;
  } catch {
    return [];
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.action) {

      case 'connect': {
        const { server } = msg;
        if (!server.host || server.host.trim() === '') {
          sendResponse({ success: false, error: 'No host configured for this server.' });
          return;
        }
        try {
          await setProxy(server);
          await chrome.storage.local.set({
            connected:      true,
            activeServerId: server.id,
            activeTier:     server.tier,
            connectedAt:    Date.now()
          });
          sendResponse({ success: true });
          showNotification('VPN Connected',
            `${server.tier === 'free' ? '🆓 Free' : '⭐ Premium'} · ${server.city}, ${server.name} ${server.flag}`);
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'disconnect': {
        await clearProxy();
        await chrome.storage.local.set({ connected: false, connectedAt: null });
        sendResponse({ success: true });
        showNotification('VPN Disconnected', 'Your connection is no longer protected.');
        break;
      }

      case 'get-state': {
        const state = await chrome.storage.local.get(null);
        sendResponse({ state });
        break;
      }

      case 'fetch-live-proxies': {
        const proxies = await fetchLiveProxies();
        sendResponse({ proxies });
        break;
      }

      case 'save-server': {
        const { server } = msg;
        const key = server.tier === 'free' ? 'freeServers' : 'paidServers';
        const { [key]: servers } = await chrome.storage.local.get(key);
        const idx = servers.findIndex(s => s.id === server.id);
        if (idx >= 0) servers[idx] = { ...servers[idx], ...server };
        else servers.push(server);
        await chrome.storage.local.set({ [key]: servers });
        sendResponse({ success: true });
        break;
      }

      case 'toggle-kill-switch': {
        const { killSwitch } = await chrome.storage.local.get('killSwitch');
        await chrome.storage.local.set({ killSwitch: !killSwitch });
        sendResponse({ killSwitch: !killSwitch });
        break;
      }

      case 'toggle-auto-connect': {
        const { autoConnect } = await chrome.storage.local.get('autoConnect');
        await chrome.storage.local.set({ autoConnect: !autoConnect });
        sendResponse({ autoConnect: !autoConnect });
        break;
      }
    }
  })();
  return true;
});

// ─── Proxy Helpers ────────────────────────────────────────────────────────────

function setProxy(server) {
  return new Promise((resolve, reject) => {
    const scheme = server.type === 'socks5' ? 'socks5'
                 : server.type === 'socks4' ? 'socks4'
                 : 'https';
    const config = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: { scheme, host: server.host, port: parseInt(server.port) },
        bypassList:  ['localhost', '127.0.0.1', '::1']
      }
    };
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function clearProxy() {
  return new Promise(resolve => chrome.proxy.settings.clear({ scope: 'regular' }, resolve));
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon128.png', title, message
  });
}
