# SonicText

SonicText is a powerful desktop (Windows) application that converts speech to text in near real-time, with advanced AI features for optimizing and managing your transcriptions. Built with Electron and powered by OpenAI's Whisper for speech recognition.

This is the open source version of the application. A OpenAI API key is required to use the application.

## Features

- 🎤 Real-time speech-to-text transcription
- 🔄 Smart text optimization with multiple modes:
  - Basic (cleanup filler words and grammar only)
  - Professional (business-ready formatting)
  - Developer (technical documentation style)
- 📝 Rich transcription history with search and management
- ⌨️ Global hotkey support for quick access
- 🎨 Light/Dark theme support
- 🌐 Multi-language support (untested)
- 🎯 Automatic clipboard integration
- 🎛️ Customizable input device selection

## Installation

1. Download the latest release from the [Releases](https://github.com/davesousa/sonictext/releases) page
2. Extract the zip file
3. Run the `SonicText.exe` file to start the application.

## First-Time Setup

When you first launch SonicText, you'll be greeted with a welcome screen that will guide you through:

1. Choosing your preferred theme (Light/Dark)
2. Setting up your global hotkey (default: Ctrl+Alt+D)
3. Entering your OpenAI API key
   - Get your API key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
   - Enter it in the welcome screen or later in settings

## Usage

1. Press your chosen global hotkey (default: Ctrl+Alt+D) anywhere to activate the transcription window
2. Speak into your microphone
3. The transcribed text will automatically be copied to your clipboard
4. Use the optimization options to clean up and format the text as needed
5. Access your transcription history through the history panel

The app is portable, so you can extract it to any location and run it from there.


## Development

1. Clone the repository:
```bash
git clone https://github.com/davesousa/sonictext.git
cd sonictext
```

2. Install dependencies:
```bash
npm install
```

3. Build and run:
```bash
npm run build
npm start
```

### Additional Settings

Click the gear icon to access settings where you can:
- Change your microphone input device
- Select transcription language
- Modify the global hotkey
- Switch between light and dark themes
- Update your OpenAI API key

## Development

- `npm run dev` - Start the app in development mode
- `npm run build` - Build the app for production
- `npm run package` - Package the app for distribution

## Contributing

-Contributions are welcome! Please feel free to submit a Pull Request.

## Known issues

- Working on getting transcript to enter into the selected text field instead of to clipboard.
- Several UI inconsistencies
- Untested on Mac

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI Whisper for speech recognition
- Electron for the desktop framework
- OpenAI GPT for text optimization 
