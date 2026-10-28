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

## Local voice mode

Voice mode records short chunks from your microphone or from a selected screen's system audio and transcribes them locally with [faster-whisper](https://github.com/SYSTRAN/faster-whisper). It is separate from the ChatGPT website login: no API key is required. You must start and stop capture explicitly. The text is editable and retained in local browser storage until cleared.

Install Python and faster-whisper **on the machine running Nyontekly**:

```bash
python -m pip install -r voice/requirements.txt
```

On Linux/macOS use `python3 -m pip ...`. For the portable Windows EXE, install Python on PATH and run `python -m pip install "faster-whisper>=1.1,<2"`. Model files download from Hugging Face on first use; subsequent transcription runs locally from the cache. Choose `tiny` or `base` for lighter CPU use; larger models need more memory and can be slow. `distil-large-v3` is English-only. Auto, Indonesian and English language options are available; accuracy and speed vary. This is chunked transcription rather than true word-by-word streaming. If transcription falls behind, stop and select a smaller model.

To capture system audio, first select a screen in **Capture**, then choose **System audio** in **Voice**. Loopback capture and permissions depend on your OS and Electron; on macOS additional system-audio permission may be required and a track can be silent. If unavailable, use a microphone. Stop when finished, and obtain any consent required for recording other people.

## Session workflow

Use **Session** to combine lecture/coding/interview instructions with notes, a text/Markdown reference, the editable transcript, and screenshot OCR. **Build & copy prompt** prepares text for pasting into ChatGPT or another supported website; **Copy screenshot** copies the image separately. Summary is a prompt for your selected AI website, not an automatic model call. Paste useful answers into tagged, locally stored answer cards to search later. PDF files can be viewed in Practice, but are not parsed into session context automatically.

The microphone, system-audio capture, local model download, OCR, PDF display, sign-in, and screenshot protection still require testing on your target desktop. To test worker protocol without downloading a model: `python -m unittest discover -s voice -p 'test_*.py'`.

**Ask this** in Capture runs OCR on the selected screenshot and copies a session prompt containing the extracted text; paste the image separately if needed. In the Session tab, Ctrl/Cmd+Enter copies the current prompt. Session instructions, questions, and text references also persist locally.

## Optional GPT Image 2 Artifact Cleaner

The **Cleaner** tab integrates [Larryvrh's GPT Image 2 Artifact Cleaner](https://github.com/Larryvrh/gpt-image-2-artifact-cleaner) as a separately installed local program. It targets visual artifacts specific to GPT Image 2. It does not verify or promise removal of invisible watermarks or provenance signals. The cleaner converts the image to RGB, so this integration composites transparency on white. Stronger settings can soften genuine details; start at 0.5 and compare the images. Outputs are PNG, with the input never overwritten.

The upstream project and its residual weights are licensed under the **PolyForm Noncommercial License 1.0.0**. Read the [upstream license](https://github.com/Larryvrh/gpt-image-2-artifact-cleaner/blob/main/LICENSE) and obtain a separate license for commercial use. Nyontekly does not bundle upstream code or weights. The FLUX.2-VAE model is distributed separately under Apache 2.0.

Setup on the machine running Nyontekly:

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and Git, then restart Nyontekly so `uv` is on PATH.
2. Clone the upstream repository: `git clone https://github.com/Larryvrh/gpt-image-2-artifact-cleaner.git`.
3. Open **Cleaner → Choose cleaner folder** and select the cloned folder. Select an image, strength and device, then run. `uv run` installs the upstream dependencies if needed; the upstream VAE downloads from Hugging Face on first use. GPU is recommended; CPU can take significantly longer. Enable tiling for large images.
4. Compare the result and save it explicitly. Select the folder again after restarting Nyontekly.

Your image is processed locally and copied to a temporary file while the job runs; temporary files are removed afterward. Running this feature executes code in the selected folder with your user permissions, so select only a trusted upstream checkout. Model downloads and dependency installation require internet access; consult the upstream project for its model, hardware and licensing details. Results are not guaranteed to be bit-identical across hardware or software versions.
