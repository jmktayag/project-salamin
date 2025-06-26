import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

export class FirestoreConnectionTest {
  /**
   * Test basic Firestore connectivity and permissions
   */
  static async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details: {
      canConnect: boolean;
      canRead: boolean;
      canWrite: boolean;
      projectId?: string;
    };
  }> {
    const result = {
      success: false,
      details: {
        canConnect: false,
        canRead: false,
        canWrite: false,
        projectId: undefined as string | undefined
      }
    };

    try {
      // Test 1: Basic connection (try to get project info)
      console.log('[Firestore Test] Testing basic connection...');
      result.details.projectId = db.app.options.projectId;
      result.details.canConnect = true;
      console.log('[Firestore Test] ✓ Basic connection successful, Project ID:', result.details.projectId);

      // Test 2: Read permissions (try to read from a collection)
      console.log('[Firestore Test] Testing read permissions...');
      try {
        const testQuery = query(collection(db, 'interview_sessions'), limit(1));
        await getDocs(testQuery);
        result.details.canRead = true;
        console.log('[Firestore Test] ✓ Read permissions successful');
      } catch (readError) {
        console.log('[Firestore Test] ✗ Read test failed:', readError);
      }

      // Test 3: Check if db is initialized
      if (!db) {
        throw new Error('Firestore database not initialized');
      }

      result.success = result.details.canConnect;
      console.log('[Firestore Test] Overall test result:', result);
      
      return result;
    } catch (error) {
      console.error('[Firestore Test] Connection test failed:', error);
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test environment variables
   */
  static testEnvironmentVariables(): {
    success: boolean;
    missing: string[];
    present: string[];
  } {
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missing: string[] = [];
    const present: string[] = [];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
      } else {
        missing.push(varName);
      }
    });

    console.log('[Environment Test] Present variables:', present);
    console.log('[Environment Test] Missing variables:', missing);

    return {
      success: missing.length === 0,
      missing,
      present
    };
  }

  /**
   * Run comprehensive diagnostics
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 Running Firestore Diagnostics...');
    
    // Test environment variables
    const envTest = this.testEnvironmentVariables();
    console.log('📋 Environment Variables:', envTest.success ? '✓ All present' : `✗ Missing: ${envTest.missing.join(', ')}`);
    
    // Test Firestore connection
    const connectionTest = await this.testConnection();
    console.log('🔗 Firestore Connection:', connectionTest.success ? '✓ Connected' : `✗ Failed: ${connectionTest.error}`);
    console.log('📖 Read Permissions:', connectionTest.details.canRead ? '✓ Working' : '✗ Failed');
    
    // Summary
    if (envTest.success && connectionTest.success) {
      console.log('✅ All Firestore diagnostics passed');
    } else {
      console.log('❌ Firestore diagnostics failed - check the issues above');
    }
  }
}