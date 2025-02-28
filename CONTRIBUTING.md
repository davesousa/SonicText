# Contributing to SonicText

Thank you for your interest in contributing to SonicText! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

There are several ways you can contribute to SonicText:

1. **Reporting Bugs**: Open an issue describing the bug, how to reproduce it, and your environment.
2. **Suggesting Features**: Open an issue describing your feature idea with clear use cases.
3. **Code Contributions**: Submit pull requests with bug fixes or new features.
4. **Documentation**: Improve or extend the documentation.
5. **Translations**: Help translate the application to other languages.

## Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/sonictext.git
   cd sonictext
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bugfix-name
   ```

2. Make your changes

3. Run the application to test your changes:
   ```bash
   npm start
   ```

4. Build the application to verify it builds correctly:
   ```bash
   npm run build
   ```

5. Commit your changes with meaningful commit messages:
   ```bash
   git commit -m "feat: add new feature" 
   ```
   or
   ```bash
   git commit -m "fix: resolve issue with microphone selection"
   ```

6. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a pull request on GitHub

## Pull Request Guidelines

- Keep pull requests focused on a single topic
- Follow the coding style and conventions used in the project
- Include tests if applicable
- Update documentation as needed
- Make sure all tests pass and the application builds correctly
- Reference relevant issues in your PR description

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style (indentation, naming conventions, etc.)
- Add comments for complex logic
- Use descriptive variable and function names
- Keep functions small and focused on a single task

## Design Guidelines

When modifying the UI:

- Maintain consistency with the existing design
- Support both light and dark themes
- Ensure all UI elements are accessible
- Test on different screen sizes

## Testing

Before submitting a pull request:

- Test on Windows, macOS, and Linux if possible
- Test with different audio devices
- Verify that all features continue to work correctly

## Release Process

The core team will handle releases using the following process:

1. Update the version number in package.json
2. Update the CHANGELOG.md file
3. Create a new release on GitHub
4. Build and publish packages for all platforms

## Getting Help

If you have questions or need help with contributing:

- Open a discussion on GitHub
- Reach out to the maintainers directly

Thank you for contributing to SonicText! 