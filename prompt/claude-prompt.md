# Salamin - AI Interview Practice Platform

## Project Overview

**Salamin** is an AI-powered interview practice platform that helps job seekers prepare for technical and behavioral interviews. The application provides interactive interview sessions with real-time speech recognition, AI-powered feedback, text-to-speech playback, and comprehensive analysis.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **AI Services**: Google Gemini AI for question generation, feedback, and text-to-speech
- **Speech Recognition**: AssemblyAI Real-time API with WebSocket streaming
- **Audio Processing**: AudioWorklet (modern) with ScriptProcessor fallback
- **Testing**: Jest with React Testing Library
- **Build Tools**: ESLint, Prettier, TypeScript compiler

## Architecture

### Core Components
- **InterviewOrchestrator** (`app/components/InterviewOrchestrator.tsx`) - Main interview flow manager
- **InterviewConfiguration** (`app/components/InterviewConfiguration.tsx`) - Pre-interview setup
- **InterviewSummary** (`app/components/InterviewSummary.tsx`) - Post-interview analysis display
- **AutocompleteInput** (`app/components/AutocompleteInput.tsx`) - Job position input with suggestions

### AI Services (`app/utils/`)
- **InterviewFeedbackService** - Per-question feedback using `gemini-2.0-flash-lite`
- **InterviewAnalysisService** - Comprehensive interview assessment 
- **TextToSpeechService** - Audio generation using `gemini-2.5-flash-preview-tts`
- **QuestionGenerator** - Dynamic question generation based on job position and interview type
- **AssemblyAIStreamingService** - Real-time speech transcription via WebSocket

### Data Layer
- **interviewQuestions.ts** - Fallback questions database with categories and difficulty levels
- **jobPositions.ts** - Common job positions for autocomplete
- **interview.ts** - TypeScript interfaces and types

## Key Features

### Speech Recognition
- **Real-time transcription** using AssemblyAI WebSocket API
- **Universal browser support** through direct WebSocket implementation
- **Secure authentication** with temporary tokens generated server-side
- **Automatic retry logic** for connection failures
- **Audio processing** with modern AudioWorklet and legacy ScriptProcessor fallback

### AI Integration
- **Dynamic question generation** personalized for job position and interview type
- **Real-time feedback** with categorized suggestions (success/warning/suggestion)
- **Comprehensive analysis** with scoring, strengths, weaknesses, and hiring verdict
- **Text-to-speech** for question audio playback with WAV format conversion

### User Experience
- **Progressive interview flow** with configuration → questions → feedback → summary
- **Real-time progress tracking** with question count and completion percentage
- **Responsive design** optimized for mobile and desktop
- **Accessibility features** with proper ARIA labels and keyboard navigation

## Development Workflow

### Environment Setup
```bash
# Required environment variables
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here  # Server-side (preferred)
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here  # Client-side fallback
```

### Development Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run Jest tests
- `npm run format` - Format code with Prettier
- `npm run prompt` - Display this prompt file

### Git Workflow
- **NEVER commit directly to master branch**
- Create feature branches for all changes
- Use descriptive branch names (e.g., `feature/add-audio-caching`, `fix/tts-error-handling`)
- All changes must go through Pull Requests

## API Endpoints

### `/api/assemblyai/token` (POST)
- **Purpose**: Generate temporary authentication tokens for AssemblyAI Real-time API
- **Security**: Server-side only, uses environment variables for API key
- **Response**: `{ token: string }` - temporary token for WebSocket authentication
- **Error Handling**: Detailed error messages for debugging token generation issues

## Browser Compatibility

- **Speech Recognition**: Universal browser support via AssemblyAI WebSocket API
- **Audio Processing**: AudioWorklet (modern browsers) with ScriptProcessor fallback
- **Text-to-Speech**: All modern browsers
- **Audio Caching**: IndexedDB supported in all modern browsers
- **Microphone Access**: Requires HTTPS for secure microphone access
- **Authentication**: Server-side temporary token generation for secure API access

## Testing Strategy

- **Integration testing** with React Testing Library focusing on user interactions
- **Component testing** for interview flow, speech recognition, and feedback display
- **Mocking strategy** for AI services, speech recognition, and audio APIs
- **Accessibility testing** with proper ARIA labels and screen reader support

## Key Implementation Notes

### Security
- API keys managed through environment variables
- Temporary token authentication for browser-side API access
- No sensitive data exposure to client-side code
- Proper error boundaries and graceful degradation

### Performance
- Memoized components and callbacks for optimal rendering
- AudioWorklet for low-latency audio processing
- IndexedDB caching for TTS audio files
- Lazy loading and code splitting for bundle optimization

### Error Handling
- Comprehensive try-catch blocks with specific error messages
- Retry logic for network failures and API timeouts
- Fallback mechanisms for speech recognition and audio processing
- User-friendly error messages and recovery options

### Code Quality
- TypeScript strict mode with comprehensive type coverage
- ESLint and Prettier for consistent code style
- Comprehensive JSDoc documentation for all functions
- Modular architecture with separation of concerns

## Troubleshooting

### Common Issues
1. **Speech Recognition Errors**
   - Check microphone permissions and HTTPS
   - Verify AssemblyAI API key and token generation
   - Check WebSocket connection in browser console

2. **AI Service Failures**
   - Verify Gemini API key configuration
   - Check rate limits and API quotas
   - Monitor network connectivity

3. **Audio Issues**
   - Check browser audio permissions
   - Verify WAV format support
   - Clear audio cache if experiencing corruption

### Development Tips
- Use browser dev tools for debugging WebSocket connections
- Monitor network tab for API call failures
- Check console for TypeScript compilation errors
- Use React DevTools for component state debugging

## Future Enhancements

- Multi-language support for international users
- Advanced analytics and progress tracking
- Integration with calendar systems for scheduled practice
- Mobile app development with React Native
- Advanced AI models for more sophisticated feedback

---

*This prompt provides comprehensive context for working with the Salamin AI Interview Practice Platform. Use this information to understand the codebase structure, development workflow, and technical requirements when making changes or additions to the project.*