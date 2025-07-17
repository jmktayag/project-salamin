# Phase 2: Peer-to-Peer System (Weeks 5-8)

**Objective**: Build live peer interview matching and collaboration platform to compete directly with Pramp  
**Timeline**: 4 weeks  
**Team Size**: 10 people  
**Budget**: $200,000  

---

## Overview

Phase 2 introduces the most competitive differentiating feature: peer-to-peer interview practice. This system allows users to practice with each other in real-time, alternating between interviewer and interviewee roles, with collaborative tools for technical interviews.

### Success Metrics
- **Peer Session Volume**: 500+ weekly peer interview sessions
- **Session Quality**: 4.5/5.0+ average session rating
- **User Adoption**: 40%+ of active users participate in peer sessions monthly
- **Session Completion Rate**: 90%+ of started sessions completed successfully
- **Matching Efficiency**: <30 seconds average wait time for matches

---

## Feature 1: Live Peer Interview Platform

### 1.1 Real-Time Communication Infrastructure

#### WebRTC Integration Architecture
```typescript
// Core WebRTC types and interfaces
interface PeerConnection {
  id: string;
  userId: string;
  role: 'interviewer' | 'interviewee';
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

interface SessionOffer {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  offer: RTCSessionDescriptionInit;
  metadata: SessionMetadata;
  expiresAt: Timestamp;
}

interface SessionMetadata {
  sessionType: 'behavioral' | 'technical' | 'case_study' | 'mixed';
  estimatedDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rolePreference?: 'interviewer' | 'interviewee' | 'flexible';
  requiresWhiteboard: boolean;
  requiresCodeEditor: boolean;
}

// WebRTC Service Implementation
export class WebRTCService {
  private connections = new Map<string, PeerConnection>();
  private localStream?: MediaStream;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'your-username',
        credential: 'your-password'
      }
    ],
    iceCandidatePoolSize: 10
  };
  
  async initializeLocalStream(audio = true, video = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera/microphone access required for peer sessions');
    }
  }
  
  async createPeerConnection(sessionId: string, userId: string, role: 'interviewer' | 'interviewee'): Promise<PeerConnection> {
    const connection = new RTCPeerConnection(this.configuration);
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }
    
    // Set up data channel for session coordination
    const dataChannel = connection.createDataChannel('session-coordination', {
      ordered: true,
      maxRetransmits: 3
    });
    
    const peerConnection: PeerConnection = {
      id: sessionId,
      userId,
      role,
      connection,
      dataChannel,
      localStream: this.localStream,
      connectionState: 'connecting'
    };
    
    this.setupConnectionHandlers(peerConnection);
    this.connections.set(sessionId, peerConnection);
    
    return peerConnection;
  }
  
  private setupConnectionHandlers(pc: PeerConnection): void {
    // Handle remote stream
    pc.connection.ontrack = (event) => {
      pc.remoteStream = event.streams[0];
      this.onRemoteStreamReceived?.(pc.id, pc.remoteStream);
    };
    
    // Handle connection state changes
    pc.connection.onconnectionstatechange = () => {
      pc.connectionState = pc.connection.connectionState as any;
      this.onConnectionStateChange?.(pc.id, pc.connectionState);
      
      if (pc.connectionState === 'failed') {
        this.handleConnectionFailure(pc);
      }
    };
    
    // Handle ICE candidates
    pc.connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(pc.id, event.candidate);
      }
    };
    
    // Handle data channel messages
    pc.dataChannel.onopen = () => {
      this.onDataChannelOpen?.(pc.id);
    };
    
    pc.dataChannel.onmessage = (event) => {
      this.onDataChannelMessage?.(pc.id, JSON.parse(event.data));
    };
  }
  
  async createOffer(sessionId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.connections.get(sessionId);
    if (!pc) throw new Error('Peer connection not found');
    
    const offer = await pc.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await pc.connection.setLocalDescription(offer);
    return offer;
  }
  
  async createAnswer(sessionId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.connections.get(sessionId);
    if (!pc) throw new Error('Peer connection not found');
    
    await pc.connection.setRemoteDescription(offer);
    const answer = await pc.connection.createAnswer();
    await pc.connection.setLocalDescription(answer);
    
    return answer;
  }
  
  async addIceCandidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.connections.get(sessionId);
    if (!pc) return;
    
    await pc.connection.addIceCandidate(candidate);
  }
  
  sendDataChannelMessage(sessionId: string, message: any): void {
    const pc = this.connections.get(sessionId);
    if (pc?.dataChannel?.readyState === 'open') {
      pc.dataChannel.send(JSON.stringify(message));
    }
  }
  
  toggleAudio(sessionId: string, enabled: boolean): void {
    const pc = this.connections.get(sessionId);
    if (pc?.localStream) {
      pc.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  toggleVideo(sessionId: string, enabled: boolean): void {
    const pc = this.connections.get(sessionId);
    if (pc?.localStream) {
      pc.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  disconnectPeer(sessionId: string): void {
    const pc = this.connections.get(sessionId);
    if (pc) {
      pc.connection.close();
      pc.localStream?.getTracks().forEach(track => track.stop());
      this.connections.delete(sessionId);
    }
  }
  
  private handleConnectionFailure(pc: PeerConnection): void {
    // Implement reconnection logic
    console.warn(`Connection failed for session ${pc.id}, attempting to reconnect...`);
    // Add reconnection attempts with exponential backoff
  }
  
  // Event handlers (to be set by consuming components)
  onRemoteStreamReceived?: (sessionId: string, stream: MediaStream) => void;
  onConnectionStateChange?: (sessionId: string, state: string) => void;
  onIceCandidate?: (sessionId: string, candidate: RTCIceCandidate) => void;
  onDataChannelOpen?: (sessionId: string) => void;
  onDataChannelMessage?: (sessionId: string, message: any) => void;
}
```

#### Signaling Server Implementation
```typescript
// SignalingService.ts - Firebase-based signaling
export class SignalingService {
  private db = getFirestore();
  private unsubscribers = new Map<string, (() => void)[]>();
  
  async createSessionOffer(offer: Omit<SessionOffer, 'expiresAt'>): Promise<void> {
    const offerRef = doc(collection(this.db, 'sessionOffers'));
    const sessionOffer: SessionOffer = {
      ...offer,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30000)) // 30 seconds
    };
    
    await setDoc(offerRef, sessionOffer);
    
    // Clean up expired offers
    setTimeout(() => this.cleanupExpiredOffer(offerRef.id), 35000);
  }
  
  async acceptSessionOffer(offerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const offerRef = doc(this.db, 'sessionOffers', offerId);
    await updateDoc(offerRef, {
      answer,
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
  }
  
  subscribeToSessionOffers(userId: string, callback: (offer: SessionOffer) => void): () => void {
    const offersQuery = query(
      collection(this.db, 'sessionOffers'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          callback({ id: change.doc.id, ...change.doc.data() } as SessionOffer);
        }
      });
    });
    
    return unsubscribe;
  }
  
  subscribeToIceCandidates(sessionId: string, callback: (candidate: RTCIceCandidateInit) => void): () => void {
    const candidatesQuery = query(
      collection(this.db, 'sessions', sessionId, 'iceCandidates'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(candidatesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          callback(data.candidate);
        }
      });
    });
    
    return unsubscribe;
  }
  
  async addIceCandidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const candidateRef = doc(collection(this.db, 'sessions', sessionId, 'iceCandidates'));
    await setDoc(candidateRef, {
      candidate,
      createdAt: serverTimestamp()
    });
  }
  
  private async cleanupExpiredOffer(offerId: string): Promise<void> {
    const offerRef = doc(this.db, 'sessionOffers', offerId);
    const offer = await getDoc(offerRef);
    
    if (offer.exists() && offer.data().status === 'pending') {
      await deleteDoc(offerRef);
    }
  }
}
```

### 1.2 User Matching Algorithm

#### Smart Matching System
```typescript
// User matching types
interface MatchingPreferences {
  userId: string;
  availableNow: boolean;
  sessionTypes: string[];
  difficultyLevels: string[];
  maxWaitTime: number; // seconds
  rolePreference: 'interviewer' | 'interviewee' | 'flexible';
  languages: string[];
  industries: string[];
  targetRoles: string[];
  timeZone: string;
  experienceLevel: 'entry' | 'mid' | 'senior';
  lastMatchedWith: string[]; // avoid immediate re-matching
}

interface MatchingCriteria {
  sessionType: string;
  difficulty: string;
  complementaryRoles: boolean; // one interviewer, one interviewee
  skillLevelRange: number; // acceptable difference in experience
  industryAlignment: boolean;
  languageMatch: boolean;
  timeZoneCompatibility: number; // max hours difference
}

interface MatchCandidate {
  userId: string;
  preferences: MatchingPreferences;
  compatibilityScore: number;
  waitTime: number;
  lastActivity: Timestamp;
}

// MatchingService.ts
export class MatchingService {
  private db = getFirestore();
  private matchingQueue = new Map<string, MatchingPreferences>();
  private activeMatches = new Map<string, string>(); // userId -> sessionId
  
  async addToMatchingQueue(preferences: MatchingPreferences): Promise<void> {
    // Add user to queue
    this.matchingQueue.set(preferences.userId, preferences);
    
    // Store in Firestore for persistence
    const queueRef = doc(this.db, 'matchingQueue', preferences.userId);
    await setDoc(queueRef, {
      ...preferences,
      joinedAt: serverTimestamp(),
      status: 'waiting'
    });
    
    // Attempt immediate match
    await this.attemptMatch(preferences.userId);
    
    // Set timeout for max wait time
    setTimeout(() => {
      this.handleMatchTimeout(preferences.userId);
    }, preferences.maxWaitTime * 1000);
  }
  
  async removeFromMatchingQueue(userId: string): Promise<void> {
    this.matchingQueue.delete(userId);
    
    const queueRef = doc(this.db, 'matchingQueue', userId);
    await deleteDoc(queueRef);
  }
  
  private async attemptMatch(userId: string): Promise<boolean> {
    const userPrefs = this.matchingQueue.get(userId);
    if (!userPrefs || this.activeMatches.has(userId)) return false;
    
    const candidates = await this.findMatchCandidates(userPrefs);
    
    if (candidates.length === 0) return false;
    
    // Select best match
    const bestMatch = candidates.reduce((best, current) => 
      current.compatibilityScore > best.compatibilityScore ? current : best
    );
    
    // Create session
    const sessionId = await this.createPeerSession(userId, bestMatch.userId, userPrefs);
    
    // Remove both users from queue
    await this.removeFromMatchingQueue(userId);
    await this.removeFromMatchingQueue(bestMatch.userId);
    
    // Track active match
    this.activeMatches.set(userId, sessionId);
    this.activeMatches.set(bestMatch.userId, sessionId);
    
    return true;
  }
  
  private async findMatchCandidates(userPrefs: MatchingPreferences): Promise<MatchCandidate[]> {
    const candidates: MatchCandidate[] = [];
    
    for (const [candidateId, candidatePrefs] of this.matchingQueue.entries()) {
      if (candidateId === userPrefs.userId) continue;
      if (this.activeMatches.has(candidateId)) continue;
      if (userPrefs.lastMatchedWith.includes(candidateId)) continue;
      
      const compatibility = this.calculateCompatibility(userPrefs, candidatePrefs);
      
      if (compatibility > 0.5) { // Minimum compatibility threshold
        candidates.push({
          userId: candidateId,
          preferences: candidatePrefs,
          compatibilityScore: compatibility,
          waitTime: Date.now() - candidatePrefs.joinedAt.toDate().getTime(),
          lastActivity: candidatePrefs.joinedAt
        });
      }
    }
    
    return candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
  
  private calculateCompatibility(user1: MatchingPreferences, user2: MatchingPreferences): number {
    let score = 0;
    let factors = 0;
    
    // Session type compatibility (weight: 0.3)
    const commonSessionTypes = user1.sessionTypes.filter(type => user2.sessionTypes.includes(type));
    if (commonSessionTypes.length > 0) {
      score += 0.3;
    }
    factors += 0.3;
    
    // Difficulty level compatibility (weight: 0.2)
    const commonDifficulties = user1.difficultyLevels.filter(diff => user2.difficultyLevels.includes(diff));
    if (commonDifficulties.length > 0) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Role complementarity (weight: 0.25)
    const rolesComplement = (
      (user1.rolePreference === 'interviewer' && user2.rolePreference === 'interviewee') ||
      (user1.rolePreference === 'interviewee' && user2.rolePreference === 'interviewer') ||
      (user1.rolePreference === 'flexible' || user2.rolePreference === 'flexible')
    );
    if (rolesComplement) {
      score += 0.25;
    }
    factors += 0.25;
    
    // Industry alignment (weight: 0.15)
    const commonIndustries = user1.industries.filter(ind => user2.industries.includes(ind));
    if (commonIndustries.length > 0) {
      score += 0.15 * (commonIndustries.length / Math.max(user1.industries.length, user2.industries.length));
    }
    factors += 0.15;
    
    // Language compatibility (weight: 0.1)
    const commonLanguages = user1.languages.filter(lang => user2.languages.includes(lang));
    if (commonLanguages.length > 0) {
      score += 0.1;
    }
    factors += 0.1;
    
    return score / factors;
  }
  
  private async createPeerSession(user1Id: string, user2Id: string, initiatorPrefs: MatchingPreferences): Promise<string> {
    const sessionRef = doc(collection(this.db, 'peerSessions'));
    
    // Determine roles
    const user1Prefs = this.matchingQueue.get(user1Id)!;
    const user2Prefs = this.matchingQueue.get(user2Id)!;
    
    let user1Role: 'interviewer' | 'interviewee';
    let user2Role: 'interviewer' | 'interviewee';
    
    if (user1Prefs.rolePreference === 'interviewer' && user2Prefs.rolePreference !== 'interviewer') {
      user1Role = 'interviewer';
      user2Role = 'interviewee';
    } else if (user2Prefs.rolePreference === 'interviewer' && user1Prefs.rolePreference !== 'interviewer') {
      user1Role = 'interviewee';
      user2Role = 'interviewer';
    } else {
      // Random assignment or based on experience
      const random = Math.random() > 0.5;
      user1Role = random ? 'interviewer' : 'interviewee';
      user2Role = random ? 'interviewee' : 'interviewer';
    }
    
    const session: PeerSession = {
      id: sessionRef.id,
      participants: [
        { userId: user1Id, role: user1Role },
        { userId: user2Id, role: user2Role }
      ],
      status: 'matched',
      sessionType: initiatorPrefs.sessionTypes[0], // Use first preferred type
      difficulty: initiatorPrefs.difficultyLevels[0],
      estimatedDuration: 30, // Default 30 minutes
      createdAt: serverTimestamp(),
      matchedAt: serverTimestamp(),
      requiresWhiteboard: false,
      requiresCodeEditor: initiatorPrefs.sessionTypes.includes('technical')
    };
    
    await setDoc(sessionRef, session);
    
    // Notify both users
    await this.notifyUsersOfMatch(user1Id, user2Id, sessionRef.id);
    
    return sessionRef.id;
  }
  
  private async notifyUsersOfMatch(user1Id: string, user2Id: string, sessionId: string): Promise<void> {
    const notification = {
      type: 'peer_match_found',
      title: 'Match Found!',
      message: 'We found you a practice partner. Click to start your session.',
      sessionId,
      createdAt: serverTimestamp(),
      read: false
    };
    
    // Send to both users
    await setDoc(doc(collection(this.db, 'users', user1Id, 'notifications')), notification);
    await setDoc(doc(collection(this.db, 'users', user2Id, 'notifications')), notification);
  }
  
  private async handleMatchTimeout(userId: string): Promise<void> {
    if (!this.matchingQueue.has(userId)) return; // Already matched or removed
    
    await this.removeFromMatchingQueue(userId);
    
    // Send timeout notification
    const notification = {
      type: 'match_timeout',
      title: 'No Match Found',
      message: 'We couldn\'t find a practice partner right now. Try again later or adjust your preferences.',
      createdAt: serverTimestamp(),
      read: false
    };
    
    await setDoc(doc(collection(this.db, 'users', userId, 'notifications')), notification);
  }
}
```

### 1.3 Session Management

#### Peer Session Lifecycle
```typescript
// Peer session data structures
interface PeerSession {
  id: string;
  participants: PeerSessionParticipant[];
  status: 'matched' | 'starting' | 'active' | 'ending' | 'completed' | 'cancelled';
  sessionType: 'behavioral' | 'technical' | 'case_study' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  currentPhase: 'introduction' | 'interview' | 'role_switch' | 'feedback' | 'wrap_up';
  questionSet?: InterviewQuestion[];
  currentQuestionIndex?: number;
  requiresWhiteboard: boolean;
  requiresCodeEditor: boolean;
  recordingEnabled: boolean;
  recordingUrl?: string;
  feedback?: PeerSessionFeedback;
  createdAt: Timestamp;
  matchedAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
}

interface PeerSessionParticipant {
  userId: string;
  role: 'interviewer' | 'interviewee';
  joinedAt?: Timestamp;
  leftAt?: Timestamp;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

interface PeerSessionFeedback {
  [userId: string]: {
    rating: number; // 1-5 stars
    feedback: string;
    tags: string[]; // helpful, prepared, technical_skills, communication, etc.
    wouldPracticeAgain: boolean;
  };
}

// PeerSessionService.ts
export class PeerSessionService {
  private db = getFirestore();
  private activeSessions = new Map<string, PeerSession>();
  private sessionTimers = new Map<string, NodeJS.Timeout>();
  
  async joinSession(sessionId: string, userId: string): Promise<PeerSession> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }
    
    const session = sessionSnap.data() as PeerSession;
    
    // Verify user is a participant
    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not authorized for this session');
    }
    
    // Update participant status
    const updatedParticipants = session.participants.map(p => 
      p.userId === userId 
        ? { ...p, joinedAt: serverTimestamp(), connectionStatus: 'connected' as const }
        : p
    );
    
    await updateDoc(sessionRef, {
      participants: updatedParticipants,
      status: this.shouldStartSession(updatedParticipants) ? 'starting' : session.status
    });
    
    // Start session if both participants joined
    if (this.shouldStartSession(updatedParticipants)) {
      await this.startSession(sessionId);
    }
    
    const updatedSession = { ...session, participants: updatedParticipants };
    this.activeSessions.set(sessionId, updatedSession);
    
    return updatedSession;
  }
  
  private shouldStartSession(participants: PeerSessionParticipant[]): boolean {
    return participants.every(p => p.connectionStatus === 'connected');
  }
  
  async startSession(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    
    // Generate questions for the session
    const questions = await this.generateSessionQuestions(sessionId);
    
    await updateDoc(sessionRef, {
      status: 'active',
      currentPhase: 'introduction',
      startedAt: serverTimestamp(),
      questionSet: questions,
      currentQuestionIndex: 0
    });
    
    // Set up session duration timer
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const timer = setTimeout(() => {
        this.handleSessionTimeout(sessionId);
      }, session.estimatedDuration * 60 * 1000);
      
      this.sessionTimers.set(sessionId, timer);
    }
    
    // Notify participants that session started
    await this.notifySessionStarted(sessionId);
  }
  
  async advanceSessionPhase(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const phaseOrder = ['introduction', 'interview', 'role_switch', 'feedback', 'wrap_up'];
    const currentIndex = phaseOrder.indexOf(session.currentPhase);
    const nextPhase = phaseOrder[currentIndex + 1];
    
    if (nextPhase) {
      await updateDoc(sessionRef, {
        currentPhase: nextPhase
      });
      
      // Handle phase-specific logic
      if (nextPhase === 'role_switch') {
        await this.handleRoleSwitch(sessionId);
      } else if (nextPhase === 'wrap_up') {
        await this.prepareSessionEnd(sessionId);
      }
    } else {
      await this.endSession(sessionId);
    }
  }
  
  private async handleRoleSwitch(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    // Switch participant roles
    const updatedParticipants = session.participants.map(p => ({
      ...p,
      role: p.role === 'interviewer' ? 'interviewee' as const : 'interviewer' as const
    }));
    
    // Generate new questions for the switched role
    const newQuestions = await this.generateSessionQuestions(sessionId);
    
    await updateDoc(sessionRef, {
      participants: updatedParticipants,
      questionSet: newQuestions,
      currentQuestionIndex: 0
    });
    
    // Update local state
    this.activeSessions.set(sessionId, {
      ...session,
      participants: updatedParticipants,
      questionSet: newQuestions,
      currentQuestionIndex: 0
    });
  }
  
  async submitSessionFeedback(sessionId: string, userId: string, feedback: PeerSessionFeedback[string]): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    
    await updateDoc(sessionRef, {
      [`feedback.${userId}`]: feedback
    });
    
    // Check if both participants submitted feedback
    const session = await getDoc(sessionRef);
    const sessionData = session.data() as PeerSession;
    
    if (sessionData.feedback && Object.keys(sessionData.feedback).length === 2) {
      // Both participants provided feedback, complete the session
      await this.completeSession(sessionId);
    }
  }
  
  async endSession(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    
    await updateDoc(sessionRef, {
      status: 'ending',
      endedAt: serverTimestamp(),
      actualDuration: this.calculateSessionDuration(sessionId)
    });
    
    // Clear session timer
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }
    
    // Prompt for feedback
    await this.promptForFeedback(sessionId);
  }
  
  private async completeSession(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'peerSessions', sessionId);
    
    await updateDoc(sessionRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    
    // Update user statistics
    const session = await getDoc(sessionRef);
    const sessionData = session.data() as PeerSession;
    
    for (const participant of sessionData.participants) {
      await this.updateUserPeerStats(participant.userId, sessionData);
    }
    
    // Clean up active session
    this.activeSessions.delete(sessionId);
  }
  
  private async updateUserPeerStats(userId: string, session: PeerSession): Promise<void> {
    const statsRef = doc(this.db, 'users', userId, 'statistics', 'peer');
    
    const currentStats = await getDoc(statsRef);
    const stats = currentStats.exists() ? currentStats.data() : {
      totalSessions: 0,
      completedSessions: 0,
      averageRating: 0,
      totalDuration: 0
    };
    
    const userFeedback = session.feedback?.[userId];
    const partnerFeedback = Object.values(session.feedback || {}).find(f => f !== userFeedback);
    
    await setDoc(statsRef, {
      totalSessions: stats.totalSessions + 1,
      completedSessions: stats.completedSessions + 1,
      averageRating: partnerFeedback ? 
        ((stats.averageRating * stats.completedSessions) + partnerFeedback.rating) / (stats.completedSessions + 1) :
        stats.averageRating,
      totalDuration: stats.totalDuration + (session.actualDuration || 0),
      lastSessionAt: serverTimestamp()
    }, { merge: true });
  }
  
  private async generateSessionQuestions(sessionId: string): Promise<InterviewQuestion[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];
    
    // Use existing QuestionGenerator service
    const questionGenerator = new QuestionGenerator();
    return await questionGenerator.generateQuestions(
      'Generic Role', // Could be enhanced with participant preferences
      session.sessionType,
      5 // Number of questions per phase
    );
  }
}
```

---

## Feature 2: Collaborative Interview Tools

### 2.1 Shared Whiteboard System

#### Real-time Collaborative Whiteboard
```typescript
// Whiteboard types and interfaces
interface WhiteboardState {
  sessionId: string;
  elements: WhiteboardElement[];
  version: number;
  lastUpdated: Timestamp;
  activeUsers: string[];
}

interface WhiteboardElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image';
  points: Point[];
  style: ElementStyle;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

interface Point {
  x: number;
  y: number;
}

interface ElementStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

interface WhiteboardAction {
  type: 'add' | 'update' | 'delete' | 'clear';
  elementId?: string;
  element?: WhiteboardElement;
  userId: string;
  timestamp: number;
}

// WhiteboardService.ts
export class WhiteboardService {
  private db = getFirestore();
  private localState = new Map<string, WhiteboardState>();
  private actionQueue = new Map<string, WhiteboardAction[]>();
  
  async initializeWhiteboard(sessionId: string, userId: string): Promise<WhiteboardState> {
    const whiteboardRef = doc(this.db, 'whiteboards', sessionId);
    const whiteboardSnap = await getDoc(whiteboardRef);
    
    let whiteboard: WhiteboardState;
    
    if (whiteboardSnap.exists()) {
      whiteboard = whiteboardSnap.data() as WhiteboardState;
    } else {
      whiteboard = {
        sessionId,
        elements: [],
        version: 0,
        lastUpdated: serverTimestamp(),
        activeUsers: []
      };
      await setDoc(whiteboardRef, whiteboard);
    }
    
    // Add user to active users
    await this.addActiveUser(sessionId, userId);
    
    this.localState.set(sessionId, whiteboard);
    this.actionQueue.set(sessionId, []);
    
    return whiteboard;
  }
  
  async addElement(sessionId: string, element: Omit<WhiteboardElement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const elementId = this.generateElementId();
    const fullElement: WhiteboardElement = {
      ...element,
      id: elementId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Update local state immediately
    const localState = this.localState.get(sessionId);
    if (localState) {
      localState.elements.push(fullElement);
      localState.version++;
    }
    
    // Queue action for synchronization
    const action: WhiteboardAction = {
      type: 'add',
      elementId,
      element: fullElement,
      userId: element.createdBy,
      timestamp: Date.now()
    };
    
    this.queueAction(sessionId, action);
    await this.syncActions(sessionId);
    
    return elementId;
  }
  
  async updateElement(sessionId: string, elementId: string, updates: Partial<WhiteboardElement>, userId: string): Promise<void> {
    const localState = this.localState.get(sessionId);
    if (!localState) return;
    
    const elementIndex = localState.elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return;
    
    // Update local state
    localState.elements[elementIndex] = {
      ...localState.elements[elementIndex],
      ...updates,
      updatedAt: Date.now()
    };
    localState.version++;
    
    // Queue action
    const action: WhiteboardAction = {
      type: 'update',
      elementId,
      element: localState.elements[elementIndex],
      userId,
      timestamp: Date.now()
    };
    
    this.queueAction(sessionId, action);
    await this.syncActions(sessionId);
  }
  
  async deleteElement(sessionId: string, elementId: string, userId: string): Promise<void> {
    const localState = this.localState.get(sessionId);
    if (!localState) return;
    
    // Update local state
    localState.elements = localState.elements.filter(e => e.id !== elementId);
    localState.version++;
    
    // Queue action
    const action: WhiteboardAction = {
      type: 'delete',
      elementId,
      userId,
      timestamp: Date.now()
    };
    
    this.queueAction(sessionId, action);
    await this.syncActions(sessionId);
  }
  
  async clearWhiteboard(sessionId: string, userId: string): Promise<void> {
    const localState = this.localState.get(sessionId);
    if (!localState) return;
    
    // Update local state
    localState.elements = [];
    localState.version++;
    
    // Queue action
    const action: WhiteboardAction = {
      type: 'clear',
      userId,
      timestamp: Date.now()
    };
    
    this.queueAction(sessionId, action);
    await this.syncActions(sessionId);
  }
  
  private queueAction(sessionId: string, action: WhiteboardAction): void {
    const queue = this.actionQueue.get(sessionId) || [];
    queue.push(action);
    this.actionQueue.set(sessionId, queue);
  }
  
  private async syncActions(sessionId: string): Promise<void> {
    const queue = this.actionQueue.get(sessionId);
    if (!queue || queue.length === 0) return;
    
    const batch = writeBatch(this.db);
    const whiteboardRef = doc(this.db, 'whiteboards', sessionId);
    const localState = this.localState.get(sessionId);
    
    if (!localState) return;
    
    // Update whiteboard state
    batch.update(whiteboardRef, {
      elements: localState.elements,
      version: localState.version,
      lastUpdated: serverTimestamp()
    });
    
    // Add actions to history for conflict resolution
    queue.forEach(action => {
      const actionRef = doc(collection(this.db, 'whiteboards', sessionId, 'actions'));
      batch.set(actionRef, action);
    });
    
    await batch.commit();
    
    // Clear local queue
    this.actionQueue.set(sessionId, []);
  }
  
  subscribeToWhiteboardChanges(sessionId: string, callback: (state: WhiteboardState) => void): () => void {
    const whiteboardRef = doc(this.db, 'whiteboards', sessionId);
    
    return onSnapshot(whiteboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteState = snapshot.data() as WhiteboardState;
        const localState = this.localState.get(sessionId);
        
        // Merge remote changes if version is newer
        if (!localState || remoteState.version > localState.version) {
          this.localState.set(sessionId, remoteState);
          callback(remoteState);
        }
      }
    });
  }
  
  private generateElementId(): string {
    return `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async addActiveUser(sessionId: string, userId: string): Promise<void> {
    const whiteboardRef = doc(this.db, 'whiteboards', sessionId);
    await updateDoc(whiteboardRef, {
      activeUsers: arrayUnion(userId)
    });
  }
  
  async removeActiveUser(sessionId: string, userId: string): Promise<void> {
    const whiteboardRef = doc(this.db, 'whiteboards', sessionId);
    await updateDoc(whiteboardRef, {
      activeUsers: arrayRemove(userId)
    });
  }
}

// WhiteboardComponent.tsx
export function CollaborativeWhiteboard({ sessionId, userId, enabled }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboardState, setWhiteboardState] = useState<WhiteboardState | null>(null);
  const [currentTool, setCurrentTool] = useState<'pen' | 'rectangle' | 'circle' | 'text' | 'eraser'>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const whiteboardService = useRef(new WhiteboardService());
  
  useEffect(() => {
    if (!enabled) return;
    
    const initializeWhiteboard = async () => {
      const state = await whiteboardService.current.initializeWhiteboard(sessionId, userId);
      setWhiteboardState(state);
    };
    
    initializeWhiteboard();
    
    // Subscribe to changes
    const unsubscribe = whiteboardService.current.subscribeToWhiteboardChanges(sessionId, (state) => {
      setWhiteboardState(state);
      redrawCanvas(state);
    });
    
    return () => {
      unsubscribe();
      whiteboardService.current.removeActiveUser(sessionId, userId);
    };
  }, [sessionId, userId, enabled]);
  
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled || !whiteboardState) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setIsDrawing(true);
    
    const element: Omit<WhiteboardElement, 'id' | 'createdAt' | 'updatedAt'> = {
      type: currentTool === 'pen' ? 'line' : currentTool,
      points: [point],
      style: {
        strokeColor: '#000000',
        strokeWidth: 2,
        fillColor: currentTool !== 'line' ? 'transparent' : undefined
      },
      createdBy: userId
    };
    
    setCurrentElement(element as WhiteboardElement);
  };
  
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement || !enabled) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    const updatedElement = { ...currentElement };
    if (currentTool === 'pen') {
      updatedElement.points.push(point);
    } else {
      // For shapes, update the second point
      if (updatedElement.points.length === 1) {
        updatedElement.points.push(point);
      } else {
        updatedElement.points[1] = point;
      }
    }
    
    setCurrentElement(updatedElement);
    
    // Draw preview on canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && whiteboardState) {
      redrawCanvas(whiteboardState);
      drawElement(ctx, updatedElement);
    }
  };
  
  const handleMouseUp = async () => {
    if (!isDrawing || !currentElement || !enabled) return;
    
    setIsDrawing(false);
    
    // Add element to whiteboard
    await whiteboardService.current.addElement(sessionId, currentElement);
    setCurrentElement(null);
  };
  
  const redrawCanvas = (state: WhiteboardState) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all elements
    state.elements.forEach(element => {
      drawElement(ctx, element);
    });
  };
  
  const drawElement = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    ctx.strokeStyle = element.style.strokeColor;
    ctx.lineWidth = element.style.strokeWidth;
    
    if (element.style.fillColor && element.style.fillColor !== 'transparent') {
      ctx.fillStyle = element.style.fillColor;
    }
    
    switch (element.type) {
      case 'line':
        ctx.beginPath();
        element.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        break;
        
      case 'rectangle':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const width = end.x - start.x;
          const height = end.y - start.y;
          
          if (element.style.fillColor && element.style.fillColor !== 'transparent') {
            ctx.fillRect(start.x, start.y, width, height);
          }
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;
        
      case 'circle':
        if (element.points.length >= 2) {
          const [center, edge] = element.points;
          const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
          );
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          
          if (element.style.fillColor && element.style.fillColor !== 'transparent') {
            ctx.fill();
          }
          ctx.stroke();
        }
        break;
    }
  };
  
  const clearWhiteboard = async () => {
    await whiteboardService.current.clearWhiteboard(sessionId, userId);
  };
  
  if (!enabled) {
    return (
      <div className="gi-whiteboard-disabled">
        <p>Whiteboard not available for this session type</p>
      </div>
    );
  }
  
  return (
    <div className="gi-whiteboard-container">
      <div className="gi-whiteboard-toolbar">
        <div className="gi-tool-group">
          {['pen', 'rectangle', 'circle', 'text', 'eraser'].map(tool => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool as any)}
              className={`gi-tool-button ${currentTool === tool ? 'active' : ''}`}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              <ToolIcon tool={tool} />
            </button>
          ))}
        </div>
        
        <div className="gi-tool-group">
          <button onClick={clearWhiteboard} className="gi-clear-button" title="Clear Whiteboard">
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="gi-active-users">
          {whiteboardState?.activeUsers.map(activeUserId => (
            <div key={activeUserId} className="gi-active-user-indicator">
              {activeUserId === userId ? 'You' : 'Partner'}
            </div>
          ))}
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="gi-whiteboard-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
```

### 2.2 Code Editor Integration

#### Collaborative Code Editor
```typescript
// Code editor types
interface CodeDocument {
  sessionId: string;
  documentId: string;
  language: 'javascript' | 'python' | 'java' | 'cpp' | 'typescript' | 'sql';
  content: string;
  version: number;
  cursors: UserCursor[];
  lastUpdated: Timestamp;
}

interface UserCursor {
  userId: string;
  line: number;
  column: number;
  selection?: TextSelection;
}

interface TextSelection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface CodeOperation {
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

// CodeEditorService.ts
export class CodeEditorService {
  private db = getFirestore();
  private documents = new Map<string, CodeDocument>();
  private operationQueue = new Map<string, CodeOperation[]>();
  
  async initializeCodeDocument(sessionId: string, language: string = 'javascript'): Promise<CodeDocument> {
    const documentId = `${sessionId}_code`;
    const docRef = doc(this.db, 'codeDocuments', documentId);
    const docSnap = await getDoc(docRef);
    
    let document: CodeDocument;
    
    if (docSnap.exists()) {
      document = docSnap.data() as CodeDocument;
    } else {
      document = {
        sessionId,
        documentId,
        language: language as any,
        content: this.getStarterCode(language),
        version: 0,
        cursors: [],
        lastUpdated: serverTimestamp()
      };
      await setDoc(docRef, document);
    }
    
    this.documents.set(documentId, document);
    this.operationQueue.set(documentId, []);
    
    return document;
  }
  
  async applyOperation(documentId: string, operation: Omit<CodeOperation, 'timestamp'>): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;
    
    const fullOperation: CodeOperation = {
      ...operation,
      timestamp: Date.now()
    };
    
    // Apply operation to local document
    this.applyOperationToDocument(document, fullOperation);
    
    // Queue for synchronization
    const queue = this.operationQueue.get(documentId) || [];
    queue.push(fullOperation);
    this.operationQueue.set(documentId, queue);
    
    // Sync with server
    await this.syncOperations(documentId);
  }
  
  private applyOperationToDocument(document: CodeDocument, operation: CodeOperation): void {
    const lines = document.content.split('\n');
    
    switch (operation.type) {
      case 'insert':
        const line = lines[operation.position.line] || '';
        const before = line.substring(0, operation.position.column);
        const after = line.substring(operation.position.column);
        lines[operation.position.line] = before + (operation.content || '') + after;
        break;
        
      case 'delete':
        const deleteLine = lines[operation.position.line] || '';
        const beforeDelete = deleteLine.substring(0, operation.position.column);
        const afterDelete = deleteLine.substring(operation.position.column + (operation.length || 0));
        lines[operation.position.line] = beforeDelete + afterDelete;
        break;
        
      case 'replace':
        const replaceLine = lines[operation.position.line] || '';
        const beforeReplace = replaceLine.substring(0, operation.position.column);
        const afterReplace = replaceLine.substring(operation.position.column + (operation.length || 0));
        lines[operation.position.line] = beforeReplace + (operation.content || '') + afterReplace;
        break;
    }
    
    document.content = lines.join('\n');
    document.version++;
  }
  
  async updateCursor(documentId: string, userId: string, cursor: Omit<UserCursor, 'userId'>): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;
    
    // Update local cursor state
    const existingCursorIndex = document.cursors.findIndex(c => c.userId === userId);
    const newCursor: UserCursor = { ...cursor, userId };
    
    if (existingCursorIndex >= 0) {
      document.cursors[existingCursorIndex] = newCursor;
    } else {
      document.cursors.push(newCursor);
    }
    
    // Sync cursor position with server
    const docRef = doc(this.db, 'codeDocuments', documentId);
    await updateDoc(docRef, {
      cursors: document.cursors
    });
  }
  
  async runCode(documentId: string, language: string, code: string): Promise<CodeExecutionResult> {
    // This would integrate with a code execution service
    // For now, return a mock result
    return {
      success: true,
      output: 'Code executed successfully!\nResult: Hello, World!',
      executionTime: 123,
      memoryUsed: 2048
    };
  }
  
  private async syncOperations(documentId: string): Promise<void> {
    const operations = this.operationQueue.get(documentId);
    if (!operations || operations.length === 0) return;
    
    const batch = writeBatch(this.db);
    const document = this.documents.get(documentId);
    
    if (!document) return;
    
    // Update document state
    const docRef = doc(this.db, 'codeDocuments', documentId);
    batch.update(docRef, {
      content: document.content,
      version: document.version,
      lastUpdated: serverTimestamp()
    });
    
    // Add operations to history
    operations.forEach(operation => {
      const opRef = doc(collection(this.db, 'codeDocuments', documentId, 'operations'));
      batch.set(opRef, operation);
    });
    
    await batch.commit();
    
    // Clear operation queue
    this.operationQueue.set(documentId, []);
  }
  
  subscribeToDocumentChanges(documentId: string, callback: (document: CodeDocument) => void): () => void {
    const docRef = doc(this.db, 'codeDocuments', documentId);
    
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteDocument = snapshot.data() as CodeDocument;
        const localDocument = this.documents.get(documentId);
        
        // Merge remote changes if version is newer
        if (!localDocument || remoteDocument.version > localDocument.version) {
          this.documents.set(documentId, remoteDocument);
          callback(remoteDocument);
        }
      }
    });
  }
  
  private getStarterCode(language: string): string {
    const templates = {
      javascript: `// Write your solution here
function solution() {
    // Your code here
    return "Hello, World!";
}

console.log(solution());`,
      
      python: `# Write your solution here
def solution():
    # Your code here
    return "Hello, World!"

print(solution())`,
      
      java: `public class Solution {
    public static void main(String[] args) {
        System.out.println(solution());
    }
    
    public static String solution() {
        // Your code here
        return "Hello, World!";
    }
}`,
      
      cpp: `#include <iostream>
#include <string>

std::string solution() {
    // Your code here
    return "Hello, World!";
}

int main() {
    std::cout << solution() << std::endl;
    return 0;
}`,
      
      typescript: `// Write your solution here
function solution(): string {
    // Your code here
    return "Hello, World!";
}

console.log(solution());`,
      
      sql: `-- Write your SQL query here
SELECT 'Hello, World!' as result;`
    };
    
    return templates[language] || templates.javascript;
  }
}

interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
}

// CollaborativeCodeEditor.tsx
export function CollaborativeCodeEditor({ sessionId, language, enabled }: CodeEditorProps) {
  const [document, setDocument] = useState<CodeDocument | null>(null);
  const [code, setCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const editorRef = useRef<any>(null);
  const codeEditorService = useRef(new CodeEditorService());
  
  useEffect(() => {
    if (!enabled) return;
    
    const initializeEditor = async () => {
      const doc = await codeEditorService.current.initializeCodeDocument(sessionId, language);
      setDocument(doc);
      setCode(doc.content);
    };
    
    initializeEditor();
    
    // Subscribe to document changes
    const unsubscribe = codeEditorService.current.subscribeToDocumentChanges(
      `${sessionId}_code`,
      (updatedDoc) => {
        setDocument(updatedDoc);
        if (updatedDoc.content !== code) {
          setCode(updatedDoc.content);
        }
      }
    );
    
    return unsubscribe;
  }, [sessionId, language, enabled]);
  
  const handleCodeChange = async (newCode: string) => {
    if (!document) return;
    
    setCode(newCode);
    
    // Calculate operation (simplified - in production, use proper diff algorithm)
    const operation: Omit<CodeOperation, 'timestamp'> = {
      type: 'replace',
      position: { line: 0, column: 0 },
      content: newCode,
      length: document.content.length,
      userId: 'current-user' // Replace with actual user ID
    };
    
    await codeEditorService.current.applyOperation(document.documentId, operation);
  };
  
  const handleCursorChange = async (line: number, column: number) => {
    if (!document) return;
    
    await codeEditorService.current.updateCursor(document.documentId, 'current-user', {
      line,
      column
    });
  };
  
  const executeCode = async () => {
    if (!document || isExecuting) return;
    
    setIsExecuting(true);
    try {
      const result = await codeEditorService.current.runCode(
        document.documentId,
        document.language,
        code
      );
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        output: '',
        error: error.message,
        executionTime: 0,
        memoryUsed: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  if (!enabled) {
    return (
      <div className="gi-code-editor-disabled">
        <p>Code editor not available for this session type</p>
      </div>
    );
  }
  
  return (
    <div className="gi-code-editor-container">
      <div className="gi-code-editor-header">
        <select
          value={document?.language || 'javascript'}
          onChange={(e) => {
            // Handle language change
          }}
          className="gi-language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="sql">SQL</option>
        </select>
        
        <button
          onClick={executeCode}
          disabled={isExecuting}
          className="gi-run-button"
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <div className="gi-code-editor-content">
        <div className="gi-editor-pane">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="gi-code-textarea"
            placeholder="Write your code here..."
            spellCheck={false}
          />
          
          {document?.cursors && document.cursors.length > 0 && (
            <div className="gi-cursor-indicators">
              {document.cursors.map(cursor => (
                <div
                  key={cursor.userId}
                  className="gi-cursor-indicator"
                  style={{
                    top: `${cursor.line * 20}px`,
                    left: `${cursor.column * 8}px`
                  }}
                >
                  {cursor.userId}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {executionResult && (
          <div className="gi-execution-result">
            <h4>Output</h4>
            <pre className={`gi-output ${executionResult.success ? 'success' : 'error'}`}>
              {executionResult.success ? executionResult.output : executionResult.error}
            </pre>
            {executionResult.success && (
              <div className="gi-execution-stats">
                Execution time: {executionResult.executionTime}ms | Memory: {executionResult.memoryUsed}KB
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.3 Screen Sharing Implementation

#### Screen Sharing Service
```typescript
// ScreenSharingService.ts
export class ScreenSharingService {
  private localScreenStream?: MediaStream;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private isSharing = false;
  
  async startScreenShare(sessionId: string): Promise<MediaStream> {
    try {
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 15 }
        },
        audio: true
      });
      
      this.isSharing = true;
      
      // Handle screen share end
      this.localScreenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare(sessionId);
      };
      
      // Update peer connections
      await this.updatePeerConnections(sessionId);
      
      return this.localScreenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }
  
  async stopScreenShare(sessionId: string): Promise<void> {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = undefined;
    }
    
    this.isSharing = false;
    
    // Update peer connections to remove screen share
    await this.updatePeerConnections(sessionId);
  }
  
  private async updatePeerConnections(sessionId: string): Promise<void> {
    // This would integrate with the WebRTC service
    // to update peer connections with screen share stream
  }
  
  isCurrentlySharing(): boolean {
    return this.isSharing;
  }
}
```

---

## Feature 3: Community Features

### 3.1 User Profiles & Ratings

#### Enhanced User Profiles for Peer Sessions
```typescript
// Community profile types
interface CommunityProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  experience: ExperienceLevel;
  specialties: string[];
  industries: string[];
  languages: string[];
  availability: AvailabilitySettings;
  peerStats: PeerSessionStats;
  badges: string[];
  preferences: CommunityPreferences;
  reputation: number;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

interface PeerSessionStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalRatings: number;
  asInterviewer: SessionRoleStats;
  asInterviewee: SessionRoleStats;
  specialtyBreakdown: Record<string, SessionRoleStats>;
}

interface SessionRoleStats {
  sessionCount: number;
  averageRating: number;
  totalDuration: number; // minutes
}

interface CommunityPreferences {
  availableForRandomMatching: boolean;
  preferredSessionTypes: string[];
  maxSessionsPerDay: number;
  feedbackStyle: 'detailed' | 'concise' | 'encouraging';
  mentorshipInterest: 'seeking' | 'offering' | 'both' | 'none';
}

// CommunityService.ts
export class CommunityService {
  private db = getFirestore();
  
  async createCommunityProfile(userId: string, profileData: Partial<CommunityProfile>): Promise<void> {
    const profileRef = doc(this.db, 'communityProfiles', userId);
    
    const defaultProfile: CommunityProfile = {
      userId,
      displayName: profileData.displayName || 'Anonymous User',
      experience: 'intermediate',
      specialties: [],
      industries: [],
      languages: ['english'],
      availability: {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
        timeSlots: [
          { start: '09:00', end: '17:00' }
        ],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      peerStats: {
        totalSessions: 0,
        completedSessions: 0,
        averageRating: 0,
        totalRatings: 0,
        asInterviewer: { sessionCount: 0, averageRating: 0, totalDuration: 0 },
        asInterviewee: { sessionCount: 0, averageRating: 0, totalDuration: 0 },
        specialtyBreakdown: {}
      },
      badges: [],
      preferences: {
        availableForRandomMatching: true,
        preferredSessionTypes: ['behavioral', 'technical'],
        maxSessionsPerDay: 3,
        feedbackStyle: 'detailed',
        mentorshipInterest: 'none'
      },
      reputation: 100, // Starting reputation
      joinedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      ...profileData
    };
    
    await setDoc(profileRef, defaultProfile);
  }
  
  async updatePeerStats(userId: string, sessionData: PeerSession, userRole: 'interviewer' | 'interviewee', rating: number): Promise<void> {
    const profileRef = doc(this.db, 'communityProfiles', userId);
    const profile = await getDoc(profileRef);
    
    if (!profile.exists()) return;
    
    const currentStats = profile.data().peerStats as PeerSessionStats;
    const roleKey = userRole === 'interviewer' ? 'asInterviewer' : 'asInterviewee';
    const roleStats = currentStats[roleKey];
    
    const updatedStats: PeerSessionStats = {
      ...currentStats,
      totalSessions: currentStats.totalSessions + 1,
      completedSessions: currentStats.completedSessions + 1,
      averageRating: this.calculateNewAverage(currentStats.averageRating, currentStats.totalRatings, rating),
      totalRatings: currentStats.totalRatings + 1,
      [roleKey]: {
        sessionCount: roleStats.sessionCount + 1,
        averageRating: this.calculateNewAverage(roleStats.averageRating, roleStats.sessionCount, rating),
        totalDuration: roleStats.totalDuration + (sessionData.actualDuration || 0)
      }
    };
    
    // Update specialty breakdown
    if (sessionData.sessionType) {
      const specialtyStats = updatedStats.specialtyBreakdown[sessionData.sessionType] || {
        sessionCount: 0,
        averageRating: 0,
        totalDuration: 0
      };
      
      updatedStats.specialtyBreakdown[sessionData.sessionType] = {
        sessionCount: specialtyStats.sessionCount + 1,
        averageRating: this.calculateNewAverage(specialtyStats.averageRating, specialtyStats.sessionCount, rating),
        totalDuration: specialtyStats.totalDuration + (sessionData.actualDuration || 0)
      };
    }
    
    await updateDoc(profileRef, {
      peerStats: updatedStats,
      lastActiveAt: serverTimestamp()
    });
  }
  
  private calculateNewAverage(currentAverage: number, currentCount: number, newValue: number): number {
    return ((currentAverage * currentCount) + newValue) / (currentCount + 1);
  }
  
  async searchProfiles(filters: ProfileSearchFilters): Promise<CommunityProfile[]> {
    let query = collection(this.db, 'communityProfiles') as Query;
    
    if (filters.experience) {
      query = query(query, where('experience', '==', filters.experience));
    }
    
    if (filters.minimumRating) {
      query = query(query, where('peerStats.averageRating', '>=', filters.minimumRating));
    }
    
    if (filters.specialties && filters.specialties.length > 0) {
      query = query(query, where('specialties', 'array-contains-any', filters.specialties));
    }
    
    query = query(query, where('preferences.availableForRandomMatching', '==', true));
    query = query(query, orderBy('peerStats.averageRating', 'desc'));
    query = query(query, limit(20));
    
    const profiles = await getDocs(query);
    return profiles.docs.map(doc => doc.data() as CommunityProfile);
  }
}

interface ProfileSearchFilters {
  experience?: ExperienceLevel;
  specialties?: string[];
  industries?: string[];
  languages?: string[];
  minimumRating?: number;
  availability?: {
    timeZone?: string;
    timeSlots?: TimeSlot[];
  };
}
```

### 3.2 Community Directory & Search

#### Community Directory Component
```typescript
// CommunityDirectory.tsx
export function CommunityDirectory({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [filters, setFilters] = useState<ProfileSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'sessions' | 'recent'>('rating');
  
  const communityService = useRef(new CommunityService());
  
  useEffect(() => {
    searchProfiles();
  }, [filters, sortBy]);
  
  const searchProfiles = async () => {
    setLoading(true);
    try {
      const results = await communityService.current.searchProfiles(filters);
      setProfiles(results);
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.displayName.toLowerCase().includes(searchLower) ||
      profile.bio?.toLowerCase().includes(searchLower) ||
      profile.specialties.some(s => s.toLowerCase().includes(searchLower)) ||
      profile.industries.some(i => i.toLowerCase().includes(searchLower))
    );
  });
  
  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.peerStats.averageRating - a.peerStats.averageRating;
      case 'sessions':
        return b.peerStats.totalSessions - a.peerStats.totalSessions;
      case 'recent':
        return b.lastActiveAt.toDate().getTime() - a.lastActiveAt.toDate().getTime();
      default:
        return 0;
    }
  });
  
  return (
    <div className="gi-community-directory">
      <div className="gi-directory-header">
        <h1>Community Directory</h1>
        <p>Find practice partners and connect with other interview candidates</p>
      </div>
      
      <div className="gi-search-controls">
        <div className="gi-search-bar">
          <Search className="gi-search-icon" />
          <input
            type="text"
            placeholder="Search by name, skills, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gi-search-input"
          />
        </div>
        
        <div className="gi-filters">
          <select
            value={filters.experience || ''}
            onChange={(e) => setFilters({...filters, experience: e.target.value as any})}
            className="gi-filter-select"
          >
            <option value="">All Experience Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
          
          <select
            value={filters.minimumRating || ''}
            onChange={(e) => setFilters({...filters, minimumRating: parseFloat(e.target.value) || undefined})}
            className="gi-filter-select"
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="gi-filter-select"
          >
            <option value="rating">Sort by Rating</option>
            <option value="sessions">Sort by Sessions</option>
            <option value="recent">Sort by Recent Activity</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="gi-loading-state">
          <Loader className="gi-spinner" />
          <p>Finding practice partners...</p>
        </div>
      ) : (
        <div className="gi-profiles-grid">
          {sortedProfiles.map(profile => (
            <CommunityProfileCard
              key={profile.userId}
              profile={profile}
              currentUserId={currentUserId}
            />
          ))}
          
          {sortedProfiles.length === 0 && (
            <div className="gi-empty-state">
              <Users className="gi-empty-icon" />
              <h3>No profiles found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CommunityProfileCard.tsx
function CommunityProfileCard({ profile, currentUserId }: { profile: CommunityProfile; currentUserId: string }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const inviteToPractice = async () => {
    // Implement invitation logic
    console.log('Inviting user to practice:', profile.userId);
  };
  
  return (
    <div className="gi-profile-card">
      <div className="gi-profile-header">
        <div className="gi-avatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.displayName} />
          ) : (
            <div className="gi-avatar-placeholder">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="gi-profile-info">
          <h3>{profile.displayName}</h3>
          <p className="gi-experience">{profile.experience} level</p>
          
          <div className="gi-rating">
            <StarRating rating={profile.peerStats.averageRating} readonly />
            <span>({profile.peerStats.totalRatings} reviews)</span>
          </div>
        </div>
      </div>
      
      {profile.bio && (
        <p className="gi-profile-bio">{profile.bio}</p>
      )}
      
      <div className="gi-profile-stats">
        <div className="gi-stat">
          <span className="gi-stat-value">{profile.peerStats.totalSessions}</span>
          <span className="gi-stat-label">Sessions</span>
        </div>
        <div className="gi-stat">
          <span className="gi-stat-value">{Math.round(profile.peerStats.asInterviewer.totalDuration / 60)}h</span>
          <span className="gi-stat-label">Practice Time</span>
        </div>
        <div className="gi-stat">
          <span className="gi-stat-value">{profile.reputation}</span>
          <span className="gi-stat-label">Reputation</span>
        </div>
      </div>
      
      <div className="gi-profile-tags">
        {profile.specialties.slice(0, 3).map(specialty => (
          <span key={specialty} className="gi-tag">{specialty}</span>
        ))}
        {profile.specialties.length > 3 && (
          <span className="gi-tag-more">+{profile.specialties.length - 3} more</span>
        )}
      </div>
      
      <div className="gi-profile-actions">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="gi-action-button secondary"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        
        {profile.userId !== currentUserId && (
          <button
            onClick={inviteToPractice}
            className="gi-action-button primary"
          >
            Invite to Practice
          </button>
        )}
      </div>
      
      {showDetails && (
        <div className="gi-profile-details">
          <div className="gi-detail-section">
            <h4>Industries</h4>
            <div className="gi-tags">
              {profile.industries.map(industry => (
                <span key={industry} className="gi-tag">{industry}</span>
              ))}
            </div>
          </div>
          
          <div className="gi-detail-section">
            <h4>Languages</h4>
            <div className="gi-tags">
              {profile.languages.map(language => (
                <span key={language} className="gi-tag">{language}</span>
              ))}
            </div>
          </div>
          
          <div className="gi-detail-section">
            <h4>Session Breakdown</h4>
            <div className="gi-session-stats">
              <div>As Interviewer: {profile.peerStats.asInterviewer.sessionCount} sessions</div>
              <div>As Interviewee: {profile.peerStats.asInterviewee.sessionCount} sessions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Testing Strategy

### 4.1 WebRTC Testing
```typescript
// WebRTCService.test.ts
describe('WebRTCService', () => {
  let webRTCService: WebRTCService;
  let mockGetUserMedia: jest.Mock;
  
  beforeEach(() => {
    webRTCService = new WebRTCService();
    mockGetUserMedia = jest.fn();
    
    // Mock WebRTC APIs
    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia
    } as any;
    
    global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
      createOffer: jest.fn().mockResolvedValue({}),
      createAnswer: jest.fn().mockResolvedValue({}),
      setLocalDescription: jest.fn().mockResolvedValue(undefined),
      setRemoteDescription: jest.fn().mockResolvedValue(undefined),
      addTrack: jest.fn(),
      createDataChannel: jest.fn().mockReturnValue({
        onopen: null,
        onmessage: null
      }),
      ontrack: null,
      onconnectionstatechange: null,
      onicecandidate: null
    }));
  });
  
  it('should initialize local stream with correct constraints', async () => {
    const mockStream = { getTracks: () => [] } as MediaStream;
    mockGetUserMedia.mockResolvedValue(mockStream);
    
    const stream = await webRTCService.initializeLocalStream();
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });
    expect(stream).toBe(mockStream);
  });
  
  it('should create peer connection with proper configuration', async () => {
    const connection = await webRTCService.createPeerConnection('session-1', 'user-1', 'interviewer');
    
    expect(RTCPeerConnection).toHaveBeenCalledWith({
      iceServers: expect.arrayContaining([
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]),
      iceCandidatePoolSize: 10
    });
    expect(connection.role).toBe('interviewer');
  });
});
```

### 4.2 Matching Algorithm Testing
```typescript
// MatchingService.test.ts
describe('MatchingService', () => {
  let matchingService: MatchingService;
  
  beforeEach(() => {
    matchingService = new MatchingService();
  });
  
  it('should calculate high compatibility for complementary users', () => {
    const user1: MatchingPreferences = {
      userId: 'user1',
      rolePreference: 'interviewer',
      sessionTypes: ['behavioral', 'technical'],
      difficultyLevels: ['intermediate'],
      industries: ['technology'],
      languages: ['english'],
      // ... other properties
    };
    
    const user2: MatchingPreferences = {
      userId: 'user2',
      rolePreference: 'interviewee',
      sessionTypes: ['behavioral'],
      difficultyLevels: ['intermediate'],
      industries: ['technology'],
      languages: ['english'],
      // ... other properties
    };
    
    const compatibility = matchingService['calculateCompatibility'](user1, user2);
    
    expect(compatibility).toBeGreaterThan(0.8); // High compatibility
  });
  
  it('should find suitable match candidates', async () => {
    // Mock queue with test users
    const testUsers = [
      { userId: 'user1', rolePreference: 'interviewer' },
      { userId: 'user2', rolePreference: 'interviewee' },
      { userId: 'user3', rolePreference: 'flexible' }
    ];
    
    // Test matching logic
    const candidates = await matchingService['findMatchCandidates'](testUsers[0]);
    
    expect(candidates).toHaveLength(2);
    expect(candidates[0].compatibilityScore).toBeGreaterThan(0.5);
  });
});
```

### 4.3 Integration Testing
```typescript
// PeerSessionIntegration.test.ts
describe('Peer Session Integration', () => {
  it('should complete full peer session workflow', async () => {
    // Create mock users
    const user1 = await createTestUser({ rolePreference: 'interviewer' });
    const user2 = await createTestUser({ rolePreference: 'interviewee' });
    
    // Add users to matching queue
    await matchingService.addToMatchingQueue(user1.preferences);
    await matchingService.addToMatchingQueue(user2.preferences);
    
    // Verify match creation
    const session = await waitForMatch(user1.id);
    expect(session.participants).toHaveLength(2);
    
    // Test session lifecycle
    await peerSessionService.joinSession(session.id, user1.id);
    await peerSessionService.joinSession(session.id, user2.id);
    
    expect(session.status).toBe('active');
    
    // Test feedback submission
    await peerSessionService.submitSessionFeedback(session.id, user1.id, {
      rating: 5,
      feedback: 'Great practice partner!',
      tags: ['helpful', 'prepared'],
      wouldPracticeAgain: true
    });
    
    // Verify completion
    const completedSession = await getSession(session.id);
    expect(completedSession.status).toBe('completed');
  });
});
```

---

## Deployment Plan

### Week 5-6: Core Infrastructure
1. **WebRTC Service Deployment**
   - Deploy signaling service with Firebase
   - Set up TURN/STUN server infrastructure
   - Test video/audio communication

2. **Matching Algorithm Implementation**
   - Deploy matching service with queue management
   - Implement compatibility scoring
   - Add timeout and cleanup logic

### Week 7: Collaboration Tools
1. **Whiteboard System**
   - Deploy real-time collaborative whiteboard
   - Test synchronization and conflict resolution
   - Add drawing tools and persistence

2. **Code Editor Integration**
   - Deploy collaborative code editor
   - Add syntax highlighting and execution
   - Test multi-user editing

### Week 8: Community Features
1. **Community Directory**
   - Deploy profile search and discovery
   - Add rating and feedback systems
   - Test user interaction flows

2. **Session Management**
   - Deploy complete session lifecycle
   - Add feedback and rating collection
   - Test session analytics

### Performance Targets
- **Connection Time**: <5 seconds for peer connection establishment
- **Latency**: <100ms for real-time collaboration features
- **Match Time**: <30 seconds average wait time for matches
- **Session Quality**: 95%+ successful session completion rate

---

## Success Metrics & KPIs

### Peer Session Metrics
- **Weekly Sessions**: Target 500+ peer sessions per week
- **Session Completion Rate**: Target 90%+ completion rate
- **User Satisfaction**: Target 4.5/5.0+ average session rating
- **Return Usage**: Target 60%+ of users booking second session

### Technical Performance
- **Connection Success Rate**: Target 95%+ successful peer connections
- **Audio/Video Quality**: Target <2% of sessions with quality issues
- **Feature Usage**: Target 40%+ adoption of collaborative tools
- **Platform Stability**: Target 99.5%+ uptime

### Community Growth
- **Active Community Size**: Target 2,000+ active peer practitioners
- **Profile Completeness**: Target 80%+ users with complete profiles
- **Network Effects**: Target 70%+ users finding matches within 5 minutes
- **Community Engagement**: Target 30%+ users participating in community features

This comprehensive Phase 2 plan establishes Salamin as a true competitor to Pramp by implementing peer-to-peer interview capabilities with advanced collaboration tools. The real-time video communication, collaborative whiteboard, code editor, and community features will create a compelling platform for mutual interview practice.