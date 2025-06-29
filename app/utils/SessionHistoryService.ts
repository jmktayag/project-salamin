import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { 
  InterviewSession, 
  SessionSummary, 
  SessionFilters, 
  SessionQuestion,
  SessionAnalysis 
} from '../types/session';

export class SessionHistoryService {
  private static readonly COLLECTION_NAME = 'interview_sessions';

  /**
   * Create a new interview session
   */
  static async createSession(
    userId: string, 
    position: string, 
    interviewType: 'behavioral' | 'technical' | 'mixed',
    totalQuestions: number
  ): Promise<string> {
    console.log('[SessionHistoryService] Creating session:', {
      userId,
      position,
      interviewType,
      totalQuestions,
      collectionName: this.COLLECTION_NAME
    });
    
    try {
      const sessionData = {
        userId,
        position,
        interviewType,
        status: 'in_progress' as const,
        startedAt: Date.now(),
        questions: [],
        questionsAnswered: 0,
        totalQuestions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('[SessionHistoryService] Session data prepared:', sessionData);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), sessionData);
      
      console.log('[SessionHistoryService] Document created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[SessionHistoryService] Error creating session:', error);
      const errorDetails = error as Error;
      console.error('[SessionHistoryService] Error details:', {
        name: errorDetails?.name,
        message: errorDetails?.message
      });
      throw new Error(`Failed to create interview session: ${errorDetails?.message || 'Unknown error'}`);
    }
  }

  /**
   * Update session with a new question and response
   */
  static async updateSessionWithQuestion(
    sessionId: string,
    question: SessionQuestion
  ): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const currentData = sessionDoc.data() as InterviewSession;
      const updatedQuestions = [...(currentData.questions || []), question];

      await updateDoc(sessionRef, {
        questions: updatedQuestions,
        questionsAnswered: updatedQuestions.length,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session with question:', error);
      throw new Error('Failed to update session');
    }
  }

  /**
   * Complete session with final analysis
   */
  static async completeSession(
    sessionId: string,
    analysis: SessionAnalysis
  ): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const now = Date.now();

      await updateDoc(sessionRef, {
        status: 'completed',
        completedAt: now,
        analysis,
        updatedAt: serverTimestamp()
      });

      // Calculate duration if session exists
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const data = sessionDoc.data() as InterviewSession;
        const duration = Math.floor((now - data.startedAt) / 1000);
        await updateDoc(sessionRef, { duration });
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error('Failed to complete session');
    }
  }

  /**
   * Mark session as abandoned
   */
  static async abandonSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const now = Date.now();

      await updateDoc(sessionRef, {
        status: 'abandoned',
        completedAt: now,
        updatedAt: serverTimestamp()
      });

      // Calculate duration
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const data = sessionDoc.data() as InterviewSession;
        const duration = Math.floor((now - data.startedAt) / 1000);
        await updateDoc(sessionRef, { duration });
      }
    } catch (error) {
      console.error('Error abandoning session:', error);
      throw new Error('Failed to abandon session');
    }
  }

  /**
   * Get user's session history with filtering
   */
  static async getUserSessions(
    userId: string,
    filters?: SessionFilters,
    limitCount: number = 50
  ): Promise<SessionSummary[]> {
    try {
      const queryConstraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('startedAt', 'desc'),
        limit(limitCount)
      ];

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        queryConstraints.splice(1, 0, where('status', '==', filters.status));
      }

      if (filters?.interviewType && filters.interviewType !== 'all') {
        queryConstraints.splice(1, 0, where('interviewType', '==', filters.interviewType));
      }

      const q = query(collection(db, this.COLLECTION_NAME), ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const sessions: SessionSummary[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as InterviewSession;
        
        // Apply client-side filtering for date range and position
        let includeSession = true;
        
        if (filters?.dateRange) {
          const sessionDate = data.startedAt;
          if (sessionDate < filters.dateRange.start || sessionDate > filters.dateRange.end) {
            includeSession = false;
          }
        }

        if (filters?.position && !data.position.toLowerCase().includes(filters.position.toLowerCase())) {
          includeSession = false;
        }

        if (includeSession) {
          sessions.push({
            id: doc.id,
            position: data.position,
            interviewType: data.interviewType,
            status: data.status,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            duration: data.duration,
            questionsAnswered: data.questionsAnswered,
            totalQuestions: data.totalQuestions,
            overallScore: data.analysis?.overallScore
          });
        }
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw new Error('Failed to fetch session history');
    }
  }

  /**
   * Get full session details by ID
   */
  static async getSessionById(sessionId: string, userId: string): Promise<InterviewSession | null> {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        return null;
      }

      const data = sessionDoc.data() as InterviewSession;
      
      // Security check - ensure user owns this session
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to session');
      }

      return {
        ...data,
        id: sessionDoc.id
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      throw new Error('Failed to fetch session details');
    }
  }

  /**
   * Delete a session
   */
  static async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      // First verify the user owns this session
      const session = await this.getSessionById(sessionId, userId);
      if (!session) {
        throw new Error('Session not found or unauthorized');
      }

      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Get session statistics for a user
   */
  static async getUserSessionStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageScore?: number;
    totalInterviewTime: number; // in seconds
  }> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      let totalSessions = 0;
      let completedSessions = 0;
      let totalScore = 0;
      let totalTime = 0;
      let scoresCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as InterviewSession;
        totalSessions++;
        
        if (data.status === 'completed') {
          completedSessions++;
          if (data.analysis?.overallScore) {
            totalScore += data.analysis.overallScore;
            scoresCount++;
          }
        }
        
        if (data.duration) {
          totalTime += data.duration;
        }
      });

      return {
        totalSessions,
        completedSessions,
        averageScore: scoresCount > 0 ? Math.round(totalScore / scoresCount) : undefined,
        totalInterviewTime: totalTime
      };
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw new Error('Failed to fetch session statistics');
    }
  }
}