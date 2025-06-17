# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **InterviewCard** (`app/components/InterviewCard.tsx`) - Main interview orchestrator that manages the complete interview flow, state, and user interactions
- **InterviewSummary** (`app/components/InterviewSummary.tsx`) - Displays comprehensive post-interview analysis with scores and recommendations
- **GhostInterviewer** (`app/components/GhostInterviewer.tsx`) - Alternative chat interface (currently unused)

### AI Integration Architecture
The application uses Google Gemini AI through three service classes in `app/utils/`:

- **FeedbackGenerator** - Provides per-question analysis using `gemini-2.0-flash-lite`
- **InterviewAnalyzer** - Generates comprehensive interview assessment
- **TextToSpeech** - Converts text to speech using `gemini-2.5-flash-preview-tts` with WAV format conversion

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

**Required Environment Variable:**
- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key for AI functionality

## Testing Approach

Uses Jest with React Testing Library for component integration testing. Tests focus on user interactions and UI state changes rather than isolated unit tests.

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