<div align="center">
  <h1>🚀 WA-Hook</h1>
  <p><b>The ultimate local WhatsApp Cloud API simulator and interactive webhook engine.</b></p>
  
  [![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)](https://github.com/Praneethe358/WA-Hook/packages)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#how-it-works">How it Works</a> •
    <a href="#configuration">Configuration</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 🎯 The Problem

Developing against the official Meta WhatsApp Cloud API is notoriously painful. You need an active Facebook Developer account, a verified business, live webhooks exposed to the public internet (via ngrok/localtunnel), and constant token refreshes just to test a simple message. 

**WA-Hook solves this.** It acts as a local proxy and simulator, allowing you to build and test your WhatsApp integrations entirely locally, completely bypassing Meta's friction during the development cycle.

## ✨ Features

- 🖥️ **Stunning Interactive TUI:** Built-in zero-framework Terminal User Interface with vibrant themes for real-time fleet overview.
- 🔄 **Webhook Verification Handshake:** Automatically handles the annoying `hub.verify_token` challenge natively.
- 📨 **Payload Simulation:** Dispatch simulated WhatsApp messages directly to your local application from the CLI.
- 📡 **Graph API Mocking:** Intercepts outbound `POST /v19.0/:phoneNumberId/messages` requests so you can test sending messages without real API limits.
- ⚡ **Zero-Config:** Works out of the box with intelligent defaults.

## 🚀 Quick Start

Since this package is securely hosted on GitHub Packages, running it is incredibly simple. You don't even need to clone the repository!

Run the CLI instantly via your terminal:

```bash
npm --registry=https://npm.pkg.github.com/ exec -- @praneethe358/wa-local-hook start
```

This command tells your terminal: *"Don't look at NPM, look at GitHub, find the wa-local-hook package, and start the local server."*

## 💻 Local Development

If you want to contribute or run the project from source:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Praneethe358/WA-Hook.git
   cd WA-Hook
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Adjust variables in `.env` if your local API is running on a different port).*

4. **Launch the Engine:**
   ```bash
   npm run dev
   ```

## 🔌 Endpoints

When running locally, WA-Hook exposes the following mock endpoints:

- **Webhook Verification & Reception:** `GET/POST /webhook`
- **Outbound Mock Graph API:** `POST /v19.0/:phoneNumberId/messages`

## 🤝 Contributing (DotDev Cohort & Beyond!)

WA-Hook is an open-source project and we absolutely love community contributions! 

Whether you're part of the DotDev cohort looking for your first PR or a seasoned engineer wanting to add new simulation features, you are welcome here.

1. Check out the [Issues](https://github.com/Praneethe358/WA-Hook/issues) tab and look for the **`good first issue`** tag.
2. Fork the repository.
3. Create a feature branch (`git checkout -b feat/amazing-feature`).
4. Commit your changes (`git commit -m 'feat: added an amazing feature'`).
5. Push to the branch (`git push origin feat/amazing-feature`).
6. Open a Pull Request!

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
