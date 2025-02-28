# SonicText

A powerful desktop application that converts speech to text in real-time, with AI-powered text optimization.

![SonicText](screenshots/sonictext.png)

## Features

- **Real-time Speech Recognition** - Convert your voice to text with high accuracy
- **Global Hotkey** - Start recording from anywhere with a customizable keyboard shortcut
- **Text Optimization** - Enhance your transcribed text using OpenAI's API
- **Multiple Languages** - Support for various languages and dialects
- **History Management** - Access and manage your previous transcriptions
- **Sleek UI** - Modern interface with dark and light themes
- **Cross-Platform** - Available for Windows, macOS, and Linux

## Installation

### Windows

1. Download the latest release from the [Releases](https://github.com/davesousa/sonictext/releases) page
2. Choose either the installer (.exe) or portable (.zip) version
3. Run the application and follow the setup wizard

### macOS

1. Download the latest .dmg file from the [Releases](https://github.com/davesousa/sonictext/releases) page
2. Open the .dmg file and drag SonicText to your Applications folder
3. Launch from the Applications folder

### Linux

1. Download the .AppImage or .deb file from the [Releases](https://github.com/davesousa/sonictext/releases) page
2. Make the AppImage executable: `chmod +x SonicText-*.AppImage`
3. Run the AppImage or install the .deb package

## Usage

### Basic Usage

1. Press the global hotkey (default: `Ctrl+Alt+D`) to start recording
2. Speak clearly into your microphone
3. Release the hotkey to stop recording and process your speech
4. Your transcribed text will appear in a floating window
5. The text is automatically copied to your clipboard for easy pasting

### Text Optimization

SonicText can improve your transcriptions with AI-powered optimization:

1. Click the optimization icon in the toolbar
2. Enable text optimization and choose your preferred mode:
   - **Basic** - Fixes grammar, removes filler words, adds punctuation
   - **Professional** - Polishes text for business communication
   - **Concise** - Condenses text to essential points

*Note: Text optimization requires an OpenAI API key.*

### Settings

Access the settings panel by clicking the gear icon:

- **General** - Customize hotkey, theme, and startup behavior
- **Audio** - Select your preferred microphone and language
- **API Integration** - Add your OpenAI API key for text optimization
- **Advanced** - Clear history and reset settings

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/davesousa/sonictext.git
cd sonictext

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

### Project Structure

```
sonictext/
├── src/                 # Source code
│   ├── css/             # Stylesheets
│   ├── main.ts          # Main Electron process
│   ├── index.html       # Main UI
│   ├── settings.html    # Settings UI
│   ├── history.html     # History UI
│   ├── optimize.html    # Optimization UI
│   └── welcome.html     # Welcome/setup UI
├── dist/                # Compiled output
├── build/               # Build output
└── package.json         # Project metadata
```

## Configuration

SonicText stores user settings in:

- Windows: `%APPDATA%\sonictext\settings.json`
- macOS: `~/Library/Application Support/sonictext/settings.json`
- Linux: `~/.config/sonictext/settings.json`

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/) - For the cross-platform framework
- [OpenAI](https://openai.com/) - For the powerful text optimization API
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - For speech recognition capabilities
