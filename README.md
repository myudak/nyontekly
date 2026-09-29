# Electron Web Tool

An always-on-top Electron window that opens ChatGPT by default. Its opacity starts at 85% so you can see the desktop behind it. Capture protection remains enabled.

## Use

Run `npm start` in this folder. The app stays out of the Windows taskbar. Use its **system tray icon** to show the window, open Settings, or quit. You can also open **Web Tool → Settings...** (or press **Ctrl+,**) while the window is visible. Settings change opacity, always-on-top behavior, and the HTTPS website. Changes apply immediately and are saved for next time.

For a fresh setup, run `npm install` first.

## Windows EXE

The GitHub Actions workflow builds a portable Windows `.exe` on each push to `main` and on manual dispatch. Download it from the workflow run's **Artifacts** section. To build it locally, run `npm run package:win`; the result appears in `dist/`.

The opacity slider fades the whole window, including page text. Capture protection works with supported operating-system capture APIs, but does not guarantee exclusion from every capture method.

## Sign-in

ChatGPT and Google use the same persistent Electron browser profile on every launch. Cookies and site storage stay in Windows app data for this app, not in this project folder or `settings.json`. Finish the sign-in flow before quitting; the app writes cookie changes to disk shortly afterward. Use **Quit** in the tray menu for a normal exit. A website may still ask you to sign in again if its session expires or it revokes your login.
