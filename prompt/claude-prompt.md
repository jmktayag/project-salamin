## Optimized Claude Code Prompt

Implement Firebase Analytics for the Salamin interview practice platform. Set up Firebase project, install SDK, and add custom event tracking for user behavior during interviews.

**Requirements:**

### 1. Firebase Setup
- Create new Firebase project with Analytics enabled
- Add web app configuration
- Install Firebase SDK in Next.js project

### 2. Basic Event Tracking
Track these key events for walk phase testing:
- `session_started` - When user begins interview
- `question_answered` - Each question response
- `session_completed` - Full interview finished
- `feature_used` - TTS, speech recognition usage
- `session_abandoned` - User exits early

### 3. Implementation Files
Create these files:
```
app/lib/firebase/
├── config.ts          # Firebase initialization
├── analytics.ts       # Event tracking functions
└── types.ts          # TypeScript interfaces

app/components/
└── FirebaseProvider.tsx  # React context provider
```

### 4. Integration Points
Add tracking to:
- `InterviewOrchestrator.tsx` - Session start/end tracking
- `InterviewSummary.tsx` - Completion tracking
- Feature components - Usage tracking

### 5. Environment Setup
Add Firebase config to `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Technical Requirements:**
- TypeScript implementation
- Next.js 14 App Router compatibility
- Privacy-compliant (no PII tracking)
- Development debugging support
- Zero performance impact

**Deliverables:**
1. Complete Firebase project setup guide
2. All necessary TypeScript files
3. Integration examples for existing components
4. Environment configuration
5. Basic privacy compliance

Focus on a clean, minimal implementation that gets Firebase Analytics working quickly with the essential events needed for walk phase testing.

Some information to consider:
apiKey: "AIzaSyBgXpFKKitbJx5_8j2U0hP0wbEy21xMvjA",
  authDomain: "project-salamin-5a2fd.firebaseapp.com",
  projectId: "project-salamin-5a2fd",
  storageBucket: "project-salamin-5a2fd.firebasestorage.app",
  messagingSenderId: "896862111946",
  appId: "1:896862111946:web:f344fd6bfd19228f334c33",
  measurementId: "G-3W0G7XFJLB"