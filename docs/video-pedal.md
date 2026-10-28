# Camera loop setup

Nyontekly can launch [Video Pedal](https://github.com/haxybaxy/video-pedal) from a local checkout. Video Pedal opens its own webcam preview and publishes the feed to an installed virtual camera. Nyontekly does not bundle Video Pedal's code or install a camera driver.

## Install

1. Install Python 3.9 or later and Git. Clone Video Pedal:

   ```bash
   git clone https://github.com/haxybaxy/video-pedal.git
   cd video-pedal
   python -m venv .venv
   ```

2. Install its dependencies. On Windows:

   ```powershell
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

   On macOS/Linux:

   ```bash
   .venv/bin/python -m pip install -r requirements.txt
   ```

3. Install a virtual camera device: [OBS Studio](https://obsproject.com/) on Windows/macOS, or v4l2loopback on Linux. On macOS, OBS's camera extension must be allowed in system settings first. Close OBS while Video Pedal uses its virtual camera. For details and Linux setup, follow [Video Pedal's setup guide](https://github.com/haxybaxy/video-pedal#setup).
4. In Nyontekly, open **Camera → Choose Video Pedal folder** and select the checkout containing `loop_pedal.py` and `.venv`. Choose your options and click **Start camera loop**. Run it before opening your meeting app, then select the virtual camera in that app.

Choose only a trusted checkout: its Python code runs locally with your user permissions. The linked repository did not contain a license file when this integration was added; consult its owner before redistributing its code.

## Controls

In the separate preview window, press **r** to start or finish recording a loop, **l** to return to the live feed, and **q** to quit. With global hotkeys enabled, hold the selected record key and release it to start looping; press the selected live key to return to the live feed. Nyontekly defaults to right Alt and right Ctrl. Global keyboard permissions and support depend on the OS; on Wayland, choose **Disable global hotkeys** and use the preview keys. On some keyboard layouts right Alt is AltGr, so select `alt_gr` instead.

Use **Preview only** to try the webcam without a virtual camera driver. Start/Stop controls manage the Video Pedal process; the separate preview shows whether it is LIVE, recording or looping. Nyontekly doesn't verify whether a meeting app accepted the virtual camera. Virtual-camera behavior varies by platform; the upstream author reports testing primarily on macOS. Video Pedal uses the local camera, and meeting apps can transmit its output when you select it.
