# Nyontekly

A floating AI workspace for quick answers, screenshots, voice transcription, and more.

## Features

- **Invisible window** — Keep Nyontekly on top and request that supported screen recorders and screen-sharing apps exclude it. Adjust the opacity, or hide and show it with a shortcut.
- **ExamBrowser bypass (experimental)** — Open an exam URL with Safe Exam Browser Config Key header emulation, using a supported `.seb` file or a Config Key Hash.
- **Clean images** — Reduce visible artifacts in GPT Image 2 images, compare the result, and save it as a PNG.
- **ChatGPT and more** — Sign in to ChatGPT, Claude, or Gemini and switch between them. Copy quick prompts for explanations, hints, translations, or step-by-step answers.
- **Screenshots** — Capture a screen or window, crop a region, copy or save it, and revisit recent captures.
- **Camera loop** — Record a short webcam loop and send it to a virtual camera, with controls to return to live video. [Setup guide](docs/video-pedal.md).
- **Screen recording** — Record a screen or window and save a silent WebM video.
- **Text from screenshots** — Extract editable text with OCR and prepare a prompt from an image.
- **Voice transcription** — Transcribe microphone or supported system audio locally with selectable Whisper models and English or Indonesian language options.
- **Session workspace** — Combine transcripts, notes, text references, and screenshot text into a prompt. Choose lecture, coding, interview practice, or custom instructions.
- **Notes and answer cards** — Keep a local scratchpad and save useful answers with searchable tags.
- **Practice mode** — Open text files or PDFs and work through questions.
- **Custom shortcuts** — Set shortcuts for showing the window and opening the screenshot picker.

## Download

Get the latest portable Windows build from [GitHub Actions](https://github.com/myudak/nyontekly/actions/workflows/windows-exe.yml). Open a successful run and download its artifact.

## Important details

- **Invisible window:** Capture protection is best effort, not guaranteed. Some recording and screen-sharing methods can still show the window. Test your actual setup.
- **ExamBrowser:** This implements a limited Config Key header check for the exact start URL. It does not reproduce SEB's full lockdown, Browser Exam Key, or every server check; many exams may still reject it.
- **Image cleaner:** Install [GPT Image 2 Artifact Cleaner](https://github.com/Larryvrh/gpt-image-2-artifact-cleaner) separately and select its folder in the app. Its upstream license is **noncommercial** unless separately licensed. It targets visual artifacts and does not guarantee removal of watermarks or provenance signals.
- **Camera loop:** Install [Video Pedal](https://github.com/haxybaxy/video-pedal) and a compatible virtual camera separately. [See setup](docs/video-pedal.md).
- **Voice and OCR:** Voice requires Python and [faster-whisper](https://github.com/SYSTRAN/faster-whisper); OCR requires [Tesseract](https://github.com/tesseract-ocr/tesseract). Voice models download on first use. Audio input availability depends on your system and permissions.
- **AI answers:** Prompts are copied for you to paste into your chosen AI website; answers and summaries are not generated automatically by Nyontekly. Sign-in support depends on the website.
