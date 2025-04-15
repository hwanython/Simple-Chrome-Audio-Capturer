# Simple Chrome Audio Capturer

A simple Chrome extension that captures audio from the active tab and automatically downloads the recording as a file. Built using Chrome's `tabCapture` API and the MediaRecorder API.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Future Plans](#future-plans)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project provides a basic example of how to capture audio from a Chrome tab using the `chrome.tabCapture` API (Manifest V3), and to record, process, and download the audio using the MediaRecorder API. It is intended to serve as a starting point for developers looking to build more complex audio capture or processing Chrome extensions.

## Features

- Captures audio from the active browser tab.
- Uses MediaRecorder API to record and process the audio stream.
- Automatically downloads the captured audio as a WebM file.
- Simple and clean user interface via an extension popup.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/Simple-Chrome-Audio-Capturer.git
   cd Simple-Chrome-Audio-Capturer
   ```

2. Open Google Chrome and navigate to:

   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** (toggle on the top right).

4. Click **Load unpacked** and select the folder containing this extension.

## Usage

1. Open a browser tab with audio playing (e.g., YouTube).
2. Click the extension icon in the Chrome toolbar.
3. In the popup:
   - Click **녹음 시작** to begin recording.
   - Click **녹음 중지** to stop and download the recording.
4. The recorded file will be saved as `recorded_audio.webm`.

## Development

Project structure:

```
Simple-Chrome-Audio-Capturer/
│
├── manifest.json       # Chrome extension config (Manifest V3)
├── popup.html          # HTML for the popup UI
├── popup.js            # JS logic for audio capture and download
└── README.md           # This documentation file
```

## Future Plans

- [ ] Visual recording timer or waveform display
- [ ] Audio format selection (e.g., mp3, wav)
- [ ] Settings page for quality control
- [ ] Upload to cloud (Google Drive, Dropbox, etc.)
- [ ] Integration with real-time STT APIs

## Contributing

Contributions are welcome!  
Please fork the repo, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for more details.
