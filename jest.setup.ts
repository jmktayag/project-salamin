import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => ({ nanoseconds: 0, seconds: Date.now() / 1000 })),
  writeBatch: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ nanoseconds: 0, seconds: Date.now() / 1000 })),
    fromDate: jest.fn((date) => ({ nanoseconds: 0, seconds: date.getTime() / 1000 })),
  },
}));

jest.mock('@/app/lib/firebase/config', () => ({
  auth: {},
  db: {},
}));

// Mock the ProfileService
jest.mock('@/app/utils/ProfileService', () => ({
  profileService: {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    getUserStatistics: jest.fn(),
    updateLastLogin: jest.fn(),
    clearCache: jest.fn(),
    clearAllCache: jest.fn(),
    isProfileComplete: jest.fn(),
  },
  ProfileService: {
    getInstance: jest.fn(),
  },
}));

// Mock analytics
jest.mock('@/app/lib/firebase/analytics', () => ({
  trackUserSignedIn: jest.fn(),
  trackUserSignedUp: jest.fn(),
  trackUserSignedOut: jest.fn(),
  trackFeatureUsed: jest.fn(),
  trackSessionStarted: jest.fn(),
  trackQuestionAnswered: jest.fn(),
  trackSessionCompleted: jest.fn(),
  trackSessionAbandoned: jest.fn(),
}));

// Global test utilities
declare global {
  var mockFirestoreDoc: (data: any) => any;
  var mockFirestoreCollection: (docs: any[]) => any;
}

global.mockFirestoreDoc = (data: any) => ({
  exists: () => !!data,
  data: () => data,
  id: 'mock-doc-id',
});

global.mockFirestoreCollection = (docs: any[]) => ({
  docs: docs.map((doc, index) => ({
    id: `mock-doc-${index}`,
    data: () => doc,
    exists: () => true,
  })),
});

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
