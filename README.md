# Nyontekly

A compact Electron workspace for ChatGPT and other AI websites, screenshots, notes, and a separate experimental exam-browser window. Sign in on the websites themselves; no API key is needed.

## Get started

Install Node.js 24 and run:

```bash
npm ci
npm start
```

The GitHub Actions **Build Windows EXE** workflow builds a portable Windows executable on pushes to `main`. Download the artifact from the workflow run, or build it locally with `npm run package:win`.

## Workspace

- **Assistant:** switch between ChatGPT, Claude and Gemini. Each has a separate persistent browser session; choose a quick prompt and copy it to paste into the site. Sign-in providers may block Electron or open a browser session that does not return to the app.
- **Capture:** refresh and select a screen or window, then copy a screenshot or record silent WebM. Drag over the screenshot preview and select **Crop region** to copy a region. Recent screenshots are saved locally in the app's browser storage (up to eight; storage size limits apply), and can be copied or deleted.
- **OCR:** select **OCR** on a screenshot to extract editable text locally using the `tesseract` command. Install [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) and put it on PATH. The current language is English. Nothing is sent to an OCR server.
- **Notes & practice:** notes persist locally; search highlights the first match. Practice opens local `.txt`, `.md`, or `.pdf` files. PDF display depends on Electron's PDF viewer. Copying a practice question applies to text, not PDF pages.
- **Settings:** pin the overlay, adjust opacity and assistant zoom, change global shortcuts, and request capture protection. Shortcuts are saved locally; registration may fail when another application already uses them.
- **Exam:** open an ordinary browser with a Config Key header for the exact configured start URL, using a plain XML `.seb` file or an already calculated hash. Status shows observed HTTP response codes, not proof of compatibility. An optional local mock provides a test page.

The exam mode implements only limited, flat XML configurations. It cannot open encrypted or binary `.seb` files, and does not emulate the Browser Exam Key, SEB JavaScript API, lockdown, or other identity checks. Config normalization follows the narrow approach used by [SiapDips](https://github.com/myudak/siapdips/blob/main/src/lib/seb/shared.ts) and may not match official SEB normalization for real files. A server may reject the browser even if a header is present.

## Screenshots for this README

On a machine with a graphical desktop and Electron installed, run `npm run screenshot`. It captures the actual app shell to `docs/workspace.png`. To show it on GitHub, add that generated file to the repository and insert `![Nyontekly workspace](docs/workspace.png)` here. The hosted AI page may be blank in a screenshot until it loads and is signed in.

## Capture and privacy limits

Capture protection is a best-effort OS request, not guaranteed invisibility. On macOS, ScreenCaptureKit applications can capture protected windows; remote sessions and other capture methods may also show them. Test the actual recording setup. Linux/PipeWire and macOS screen permission behavior vary. Recordings are held in memory until saved, so keep them short; stopping opens a save dialog and cancel discards the recording. Recording contains no audio.

Notes, recent screenshots, shortcut settings, and website sessions remain on the device. Screenshots pasted or uploaded to an AI website are sent to that provider. Never assume a third-party login will work in an embedded browser. This project is not affiliated with those providers.

## Development

Run `npm run check` for syntax checks and `npm test` for Config Key and header-scoping tests. Desktop capture, OCR installation, embedded sign-in, protection, PDF rendering, and real exam-server behavior still require verification on the target machine.
