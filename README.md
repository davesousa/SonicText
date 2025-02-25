# SonicText

SonicText is a powerful desktop application that converts speech to text in real-time, with advanced features for optimizing and managing your transcriptions. Built with Electron and powered by OpenAI's Whisper for speech recognition.

## Features

- 🎤 Real-time speech-to-text transcription
- 🔄 Smart text optimization with multiple modes:
  - Basic (cleanup and punctuation)
  - Professional (business-ready formatting)
  - Developer (technical documentation style)
- 📝 Rich transcription history with search and management
- ⌨️ Global hotkey support for quick access
- 🎨 Light/Dark theme support
- 🌐 Multi-language support
- 🎯 Automatic clipboard integration
- 🎛️ Customizable input device selection
- 🚀 Interactive welcome screen for easy setup

## Installation

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI Whisper for speech recognition
- Electron for the desktop framework
- OpenAI GPT for text optimization 