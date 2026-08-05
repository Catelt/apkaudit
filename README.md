# Link Auditor — Android Deep Link Extractor & Tester

[English](README.md) | [Tiếng Việt](README.vi.md)

**Live tool:** [https://apkaudit.catelt.com/](https://apkaudit.catelt.com/)

Link Auditor extracts and displays **Deep Links** (custom schemes) and **App Links** (HTTP/HTTPS) from **APK** and **XAPK** files directly in your browser.

Binary `AndroidManifest.xml` decoding and analysis run entirely **client-side**. Your application files are never uploaded to a server, which keeps the process private and fast.

---

## Features

1. **APK and XAPK support** — Unpacks XAPK bundles, identifies split packages, and analyzes the core `base.apk` without command-line tools.
2. **Smart filtering and search** — Filters App Links and custom schemes, with real-time search by activity, host, scheme, or path.
3. **Real-time URL tester** — Converts Android wildcard rules such as `.*` and `*` into regular expressions and shows which activity matches a test URL.
4. **ADB command generation** — Generates complete `adb shell am start` commands for testing each deep link on a device or emulator.
5. **QR codes** — Creates a QR code for each link so it can be opened quickly on a mobile device.
6. **Decoded manifest viewer** — Displays the decoded `AndroidManifest.xml` as formatted XML for easy inspection.

---

## Getting Started

### Option 1: Open directly

The application is a static SPA and runs entirely in the browser:

1. Open the project directory.
2. Open `index.html` in Chrome, Edge, or Firefox.
3. Drop an APK or XAPK file into the page.

### Option 2: Use the development server

Use the Vite development server for hot reload and local development:

```bash
npm install
npm run dev
```

Then open the address shown in the terminal, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

---

## Project Structure

- `index.html` — Main user interface and application layout.
- `style.css` — Responsive styling and visual effects.
- `parser.js` — Binary XML decoder, deep-link extractor, and URL matcher.
- `app.js` — File processing, UI state, hashing, and interactive features.
- `i18n.js` — English and Vietnamese interface translations.
- `package.json` — Vite scripts and project dependencies.

---

## Privacy

- APK and XAPK files are not uploaded to an external server.
- Archive contents are processed locally as `ArrayBuffer` data in browser memory.
- The tool is suitable for inspecting private or internal applications.
