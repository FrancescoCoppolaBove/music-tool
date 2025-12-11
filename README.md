# 🎹 Piano Voicings Generator

A modern web application that generates professional piano voicings for any chord symbol in international notation.

## ✨ Features

- 🎵 **Comprehensive Chord Parsing**: Supports all standard chord notations (major, minor, dominant, diminished, half-diminished, augmented, sus2, sus4, slash chords, extensions, alterations)
- 🎹 **Multiple Voicing Styles**: Basic, Jazz/Rootless, Drop-2, Drop-3, Shell voicings
- 🎨 **Visual Piano Keyboard**: See exactly which keys to play
- 🎼 **Detailed Voice Information**: MIDI numbers, octaves, and note names for both hands
- 🚀 **Fast & Responsive**: Built with React + TypeScript + Vite
- 🌐 **Easy Deployment**: One-click deploy to Netlify

## 🎯 Supported Chord Notation

### Basic Chords
- Major: `C`, `Cmaj`, `CM`, `CΔ`
- Minor: `Cm`, `Cmin`, `C-`
- Dominant: `C7`, `C9`, `C13`

### Advanced Chords
- Diminished: `Cdim`, `C°`, `Cdim7`, `C°7`
- Half-diminished: `Cø7`, `Cm7b5`
- Augmented: `Caug`, `C+`, `C+7`
- Suspended: `Csus2`, `Csus4`, `C7sus4`

### Extensions & Alterations
- `Cmaj7`, `Cm9`, `C13`
- `C7b9`, `C7#9`, `C7#11`, `C7b13`
- `Cmaj9#11`, `Cm11b5`
- `Cadd9`, `Cadd11`

### Slash Chords
- `C/E`, `C7/Bb`, `F#m7/A`, `Bb13#11/G`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/piano-voicings-generator.git
cd piano-voicings-generator

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 📦 Project Structure
```
piano-voicings-generator/
├── src/
│   ├── features/
│   │   ├── chord-voicings/          # Main feature
│   │   │   ├── components/          # React components
│   │   │   ├── services/            # Business logic
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   └── types/               # TypeScript types
│   │   └── scale-recognition/       # Future feature
│   ├── shared/                      # Shared utilities
│   │   ├── types/                   # Shared types
│   │   └── utils/                   # Utility functions
│   ├── api/                         # Backend API
│   └── App.tsx                      # Main component
├── netlify/
│   └── functions/                   # Serverless functions
├── public/                          # Static assets
└── README.md
```

## 🛠️ Available Scripts
```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Build
npm run build            # Production build
npm run build:netlify    # Build for Netlify

# Preview
npm run preview          # Preview production build

# Lint
npm run lint             # Run ESLint
```

## 🌐 Deployment to Netlify

### Option 1: Via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Configure:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
6. Add environment variables in Site settings
7. Deploy!

### Option 2: Via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

## 🔮 Future Features

- [ ] **Scale Recognition**: Input notes, get possible scales/modes
- [ ] **Progression Analyzer**: Analyze chord progressions
- [ ] **AI-Generated Voicings**: Creative voicings via AI API
- [ ] **MIDI Integration**: Real-time chord recognition
- [ ] **Audio Playback**: Hear the voicings
- [ ] **Save & Export**: Save favorite voicings, export as MIDI

## 🎼 Usage Examples
```typescript
// Example 1: Basic major 7th chord
Input: "Cmaj7"
Output: Multiple voicings including root position, inversions, jazz voicings

// Example 2: Complex altered dominant
Input: "Bb7#9#11"
Output: Voicings with proper voice leading for altered tones

// Example 3: Slash chord
Input: "Dm7/G"
Output: Voicings with G in the bass

// Example 4: Half-diminished
Input: "F#m7b5"
Output: Various voicings suitable for ii-V-i progressions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '✨ Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by jazz theory and modern voicing techniques
- Built with React, TypeScript, and Vite
- UI components styled with custom CSS

## 📧 Contact

Francesco - [@YourTwitter](https://twitter.com/yourhandle)

Project Link: [https://github.com/yourusername/piano-voicings-generator](https://github.com/yourusername/piano-voicings-generator)

---

Made with ❤️ and 🎹 by Francesco