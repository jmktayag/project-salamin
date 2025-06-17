# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Salamin** is an AI-powered interview practice platform that helps job seekers prepare for technical and behavioral interviews. The application provides:

- **Interactive Interview Sessions** - Simulated interview experience with AI-generated questions
- **Real-time Speech Recognition** - Practice speaking answers naturally
- **AI-powered Feedback** - Instant analysis and suggestions for improvement
- **Text-to-Speech Playback** - Audio feedback for accessibility and engagement
- **Comprehensive Analysis** - Post-interview scoring and detailed recommendations

The platform uses Google Gemini AI for question generation, response analysis, and text-to-speech conversion, creating a realistic interview preparation experience.

## Prerequisites & Installation

**System Requirements:**
- Node.js 18.0 or higher
- npm or yarn package manager
- Modern web browser with Web Speech API support (Chrome, Edge, Safari)

**Installation Steps:**
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd salamin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see Environment Setup section)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Development Commands

**Core Development:**
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run all Jest tests
- `npm run format` - Format code with Prettier

**Single Test Execution:**
```bash
npm test -- InterviewCard.test.tsx
npm test -- --testNamePattern="specific test name"
```

## Architecture Overview

### Application Structure
This is a Next.js 14 App Router application with TypeScript. The main application logic is in `/app` with the following key components:

- **InterviewOrchestrator** (`app/components/InterviewOrchestrator.tsx`) - Main interview orchestrator that manages the complete interview flow, state, and user interactions
- **InterviewSummary** (`app/components/InterviewSummary.tsx`) - Displays comprehensive post-interview analysis with scores and recommendations
- **InterviewConfiguration** (`app/components/InterviewConfiguration.tsx`) - Pre-interview setup form for job position and interview type selection
- **ChatInterface** (`app/components/ChatInterface.tsx`) - Alternative chat interface (currently unused)

### AI Integration Architecture
The application uses Google Gemini AI through four service classes in `app/utils/`:

<<<<<<< refactor/improve-naming-consistency
- **InterviewFeedbackService** - Provides per-question analysis using `gemini-2.0-flash-lite`
- **InterviewAnalysisService** - Generates comprehensive interview assessment
- **TextToSpeechService** - Converts text to speech using `gemini-2.5-flash-preview-tts` with WAV format conversion
=======
- **FeedbackGenerator** - Provides per-question analysis using `gemini-2.0-flash-lite`
- **InterviewAnalyzer** - Generates comprehensive interview assessment
- **TextToSpeech** - Converts text to speech using `gemini-2.5-flash-preview-tts` with WAV format conversion
- **AudioCacheManager** - Browser-based IndexedDB caching for TTS audio files to improve performance and reduce API calls
>>>>>>> master

### Interview Flow State Machine
```
Not Started → Started → Question Loop (Response → AI Feedback) → Final Analysis → Summary Display
```

### Key Data Structures
- **InterviewQuestion** - Question object with category, difficulty, and tips
- **FeedbackItem** - Categorized feedback (success/warning/suggestion)
- **InterviewAnalysis** - Complete assessment with strengths, weaknesses, score, and hiring verdict

### State Management Pattern
Uses React hooks for local state with multiple state slices:
- Interview state (started, current question index)
- User responses and AI feedback arrays
- UI state (loading, speech recognition)

## Environment Setup

**Required Environment Variables:**

Create a `.env.local` file in the project root:

```bash
# Google Gemini AI API Key (required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new key
4. Copy the key to your `.env.local` file

**Security Notes:**
- Never commit API keys to version control
- The `NEXT_PUBLIC_` prefix makes this key accessible to the browser
- Consider implementing server-side API proxy for production
- Monitor API usage to avoid unexpected charges

## Testing Approach

Uses Jest with React Testing Library for component integration testing. Tests focus on user interactions and UI state changes rather than isolated unit tests.

**Browser Compatibility:**
- **Speech Recognition**: Chrome/Edge (full support), Safari (limited), Firefox (not supported)
- **Text-to-Speech**: All modern browsers
- **Audio Caching**: IndexedDB supported in all modern browsers
- **Recommended**: Chrome or Edge for full functionality

## Troubleshooting

**Common Issues:**

1. **Speech Recognition Not Working**
   - Ensure you're using Chrome or Edge browser
   - Check microphone permissions in browser settings
   - Verify HTTPS is enabled (required for Web Speech API)

2. **Gemini API Errors**
   - Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
   - Check API key validity at [Google AI Studio](https://aistudio.google.com/)
   - Monitor rate limits and quotas

3. **Audio Playback Issues**
   - Check browser audio permissions
   - Verify WAV format support
   - Clear audio cache if experiencing corruption

4. **Build/Type Errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Ensure all dependencies are installed
   - Check Node.js version compatibility

5. **Performance Issues**
   - Monitor IndexedDB cache size (100MB limit)
   - Clear browser cache if needed
   - Check network connectivity for API calls

## Git Workflow Rules

**Branch Protection:**
- NEVER commit or push directly to the `master` branch
- ALL changes must go through Pull Requests (PRs)
- Create feature branches for all development work
- Use descriptive branch names (e.g., `feature/add-audio-caching`, `fix/tts-error-handling`)

## Key Implementation Notes

- AI responses are parsed using regex JSON extraction with fallback error handling
- Speech recognition uses Web Speech API with browser compatibility detection
- Audio generation includes complex WAV format conversion for cross-platform support
- TypeScript strict mode enabled with comprehensive type coverage
- All AI service calls include proper error boundaries and graceful degradation