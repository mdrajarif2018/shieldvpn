# 🛡️ ShieldVPN — Chrome Extension

A premium Chrome extension that protects your privacy using both **Free** and **Paid** VPN/proxy servers, with a built-in **affiliate earning** system.

![ShieldVPN](icons/icon128.png)

---

## ✨ Features

### 🆓 Free Tier
| Method | Description |
|---|---|
| **Cloudflare WARP** | Routes traffic via WARP local proxy (127.0.0.1:40000) |
| **Tor Network** | Anonymous routing via Tor Browser (127.0.0.1:9050) |
| **Live Proxies** | Auto-fetches fresh SOCKS5 proxies from public APIs |

### ⭐ Premium/Paid Tier
| Feature | Description |
|---|---|
| **10 Server Locations** | US, UK, Germany, Japan, Singapore, Canada, Australia, France, Netherlands, Brazil |
| **Custom Proxy Config** | Enter your own host/port from any VPN provider (NordVPN, Surfshark, etc.) |
| **SOCKS5/4, HTTPS, HTTP** | All major proxy protocols supported |

### 💰 Affiliate Earning
- Built-in affiliate deals page for NordVPN, Surfshark, ExpressVPN
- Earn up to **$36 per referral**
- Click tracking built-in

### 🔒 Security Features
- **Kill Switch** — Blocks traffic if VPN connection drops
- **Auto-Connect** — Connects automatically on browser start
- **IP Address Display** — Shows your real IP with Protected/Exposed status
- **Connection Timer & Traffic Stats**

---

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/mdrajarif2018/shieldvpn.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked** and select the `shieldvpn` folder
5. The ShieldVPN icon will appear in your toolbar

---

## 🆓 How to Use Free VPN (Cloudflare WARP)

1. Download the [Cloudflare 1.1.1.1 WARP app](https://1.1.1.1)
2. Install and connect WARP
3. In ShieldVPN → Select **"WARP"** server → Click the orb to **Connect**

> **No account needed. Completely free and unlimited.**

## 🆓 How to Use Tor (Free & Anonymous)

1. Download [Tor Browser](https://www.torproject.org)
2. Open Tor Browser and connect to the Tor network
3. In ShieldVPN → Select **"Tor Network"** server → Connect

## ⭐ How to Use Paid VPN Servers

1. Subscribe to any VPN (NordVPN, Surfshark, etc.)
2. Get your **proxy host, port, and protocol** from your VPN provider
3. In ShieldVPN → ⚙️ Settings → **Premium Setup** tab
4. Select a server location, enter the host/port → **Save**
5. Select the server → Connect

---

## 💰 Affiliate Setup (Earn Money)

1. Sign up for affiliate programs:
   - [NordVPN Affiliates](https://nordvpn.com/affiliates) — $3–$40 per sale
   - [Surfshark Affiliates](https://surfshark.com/affiliates) — 40% commission
   - [ExpressVPN Affiliates](https://www.expressvpn.com/affiliate) — $36 flat rate
2. Open `popup.html` and replace `YOUR_ID` with your affiliate ID in each link
3. Reload the extension
4. Users who click your affiliate links earn you commissions

---

## 📁 Project Structure

```
shieldvpn/
├── manifest.json      # Chrome Extension Manifest v3
├── background.js      # Service worker (proxy logic, live proxy fetch)
├── popup.html         # Extension popup UI
├── popup.css          # Styles (dark premium theme)
├── popup.js           # Popup logic (free/paid/live tabs, connect/disconnect)
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## ⚠️ Disclaimer

This extension manages your browser's proxy settings using Chrome's built-in `chrome.proxy` API. For the free tier:
- **WARP** requires Cloudflare's WARP app running locally
- **Tor** requires Tor Browser running locally
- **Live proxies** are public and may be slow or unreliable

For reliable performance, use a paid VPN provider with your own proxy credentials.

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

Made with ❤️ by [mdrajarif2018](https://github.com/mdrajarif2018)
