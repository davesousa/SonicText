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

3. Create a configuration file:
Create `src/config.ts` with your OpenAI API key:
```typescript
export const OPENAI_API_KEY = 'your-api-key-here';
```

4. Build and run:
```bash
npm run build
npm start
```

## Usage

1. Press the global hotkey (default: Ctrl+Shift+D) to activate the transcription window
2. Speak into your microphone
3. The transcribed text will automatically be copied to your clipboard
4. Use the optimization options to clean up and format the text as needed
5. Access your transcription history through the history panel

## Development

- `npm run dev` - Start the app in development mode
- `npm run build` - Build the app for production
- `npm run package` - Package the app for distribution

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI Whisper for speech recognition
- Electron for the desktop framework
- OpenAI GPT for text optimization 