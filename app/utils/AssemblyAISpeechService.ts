/**
 * AssemblyAI Speech-to-Text Service
 * Provides real-time streaming transcription using AssemblyAI API
 */

import { AssemblyAI, StreamingTranscriber } from 'assemblyai';
import {
  AssemblyAIConfig,
  TranscriptionTurn,
  TranscriptionError,
  ConnectionStatus,
  SpeechRecognitionCallbacks,
  ISpeechRecognitionService
} from '../types/speech';

export class AssemblyAISpeechService implements ISpeechRecognitionService {
  private client: AssemblyAI;
  private transcriber: StreamingTranscriber | null = null;
  private config: AssemblyAIConfig;
  private callbacks: SpeechRecognitionCallbacks;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private isCurrentlyRecording = false;
  private sessionId: string | null = null;
  private currentToken: string | null = null;

  constructor(callbacks: SpeechRecognitionCallbacks, apiKey?: string) {
    // For browser environments, we'll use temporary tokens
    // The API key is only used for server-side token generation
    const finalApiKey = apiKey || 
      process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || 
      process.env.ASSEMBLYAI_API_KEY;

    // In browser, we don't need the client for token-based auth
    // We'll initialize it differently based on environment
    if (typeof window !== 'undefined') {
      // Browser environment - will use tokens
      this.client = new AssemblyAI({ apiKey: 'dummy' }); // Placeholder for browser
    } else {
      // Server environment - use API key
      if (!finalApiKey) {
        throw new Error('AssemblyAI API key is required');
      }
      this.client = new AssemblyAI({ apiKey: finalApiKey });
    }

    this.callbacks = callbacks;
    this.config = {
      apiKey: finalApiKey || '',
      sampleRate: 16000,
      formatTurns: true,
      language: 'en_us',
      enableAutoPunctuation: true
    };
  }

  /**
   * Check if service is connected to AssemblyAI
   */
  public isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.transcriber !== null;
  }

  /**
   * Check if currently recording audio
   */
  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get temporary token for browser authentication
   */
  private async getTemporaryToken(): Promise<string> {
    try {
      const response = await fetch('/api/assemblyai/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in: 3600 // 1 hour
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if this is a paid feature error
        if (errorData.isPaidFeatureError || errorData.fallbackRequired) {
          console.log('⚠️ AssemblyAI streaming requires paid account, falling back to Web Speech API');
          throw new Error('PAID_FEATURE_REQUIRED: AssemblyAI streaming transcription requires a paid account');
        }
        
        throw new Error(`Failed to get temporary token: ${errorData.error || response.statusText}`);
      }

      const tokenData = await response.json();
      this.currentToken = tokenData.token;
      
      console.log('✅ Generated temporary AssemblyAI token');
      return tokenData.token;

    } catch (error) {
      console.error('Failed to get temporary token:', error);
      throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to AssemblyAI streaming service
   */
  public async connect(): Promise<void> {
    if (this.connectionStatus === 'connected') {
      console.log('Already connected to AssemblyAI');
      return;
    }

    try {
      this.setConnectionStatus('connecting');

      // For browser environments, get a temporary token
      if (typeof window !== 'undefined') {
        const token = await this.getTemporaryToken();
        
        // Create streaming transcriber with token
        this.transcriber = this.client.streaming.transcriber({
          token: token,
          sampleRate: this.config.sampleRate,
          formatTurns: this.config.formatTurns
        });
      } else {
        // Server environment - use API key
        this.transcriber = this.client.streaming.transcriber({
          sampleRate: this.config.sampleRate,
          formatTurns: this.config.formatTurns
        });
      }

      // Set up event listeners
      this.setupEventListeners();

      // Connect to the streaming service
      await this.transcriber.connect();

    } catch (error) {
      this.setConnectionStatus('error');
      const transcriptionError: TranscriptionError = {
        type: 'CONNECTION_FAILED',
        message: `Failed to connect to AssemblyAI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }

  /**
   * Disconnect from AssemblyAI streaming service
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.isCurrentlyRecording) {
        await this.stopRecording();
      }

      if (this.transcriber) {
        await this.transcriber.close();
        this.transcriber = null;
      }

      this.sessionId = null;
      this.setConnectionStatus('disconnected');
      
    } catch (error) {
      console.error('Error during disconnect:', error);
      this.setConnectionStatus('error');
      throw error;
    }
  }

  /**
   * Start recording and transcribing audio
   */
  public async startRecording(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Must be connected before starting recording');
    }

    if (this.isCurrentlyRecording) {
      console.log('Already recording');
      return;
    }

    try {
      this.isCurrentlyRecording = true;
      this.callbacks.onAudioStart?.();
      
    } catch (error) {
      this.isCurrentlyRecording = false;
      const transcriptionError: TranscriptionError = {
        type: 'RECORDING_START_FAILED',
        message: `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  public async stopRecording(): Promise<void> {
    if (!this.isCurrentlyRecording) {
      console.log('Not currently recording');
      return;
    }

    try {
      this.isCurrentlyRecording = false;
      this.callbacks.onAudioEnd?.();
      
    } catch (error) {
      const transcriptionError: TranscriptionError = {
        type: 'RECORDING_STOP_FAILED',
        message: `Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }

  /**
   * Send audio data to AssemblyAI for transcription
   */
  public async sendAudioData(audioData: ArrayBuffer): Promise<void> {
    if (!this.isConnected() || !this.transcriber) {
      throw new Error('Not connected to AssemblyAI');
    }

    if (!this.isCurrentlyRecording) {
      return; // Ignore audio data when not recording
    }

    try {
      // Send audio data directly as ArrayBuffer
      await this.transcriber.sendAudio(audioData);
      
    } catch (error) {
      const transcriptionError: TranscriptionError = {
        type: 'AUDIO_SEND_FAILED',
        message: `Failed to send audio data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      this.callbacks.onError(transcriptionError);
    }
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<AssemblyAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AssemblyAIConfig {
    return { ...this.config };
  }

  /**
   * Set up event listeners for the transcriber
   */
  private setupEventListeners(): void {
    if (!this.transcriber) return;

    this.transcriber.on('open', (event) => {
      console.log(`AssemblyAI session opened: ${event.id}`);
      this.sessionId = event.id;
      this.setConnectionStatus('connected');
    });

    this.transcriber.on('error', (error) => {
      console.error('AssemblyAI transcription error:', error);
      this.setConnectionStatus('error');
      
      const transcriptionError: TranscriptionError = {
        type: 'TRANSCRIPTION_ERROR',
        message: error.message || 'Unknown transcription error',
        details: error
      };
      this.callbacks.onError(transcriptionError);
    });

    this.transcriber.on('close', (code, reason) => {
      console.log(`AssemblyAI session closed: ${code} - ${reason}`);
      this.setConnectionStatus('disconnected');
      this.sessionId = null;
      this.isCurrentlyRecording = false;
    });

    this.transcriber.on('turn', (turn: any) => {
      if (!turn.transcript) return;

      // Handle partial and final transcripts
      const transcriptionTurn: TranscriptionTurn = {
        transcript: turn.transcript,
        isFinal: true, // turns are always final
        confidence: turn.confidence,
        audioStart: turn.audio_start,
        audioEnd: turn.audio_end
      };

      this.callbacks.onTranscriptUpdate(transcriptionTurn.transcript, transcriptionTurn.isFinal);
    });
  }

  /**
   * Update connection status and notify callbacks
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.callbacks.onConnectionStatusChange(status);
    }
  }

  /**
   * Get session information
   */
  public getSessionInfo(): { sessionId: string | null; status: ConnectionStatus } {
    return {
      sessionId: this.sessionId,
      status: this.connectionStatus
    };
  }

  /**
   * Reconnect to AssemblyAI (useful for error recovery)
   */
  public async reconnect(): Promise<void> {
    console.log('Attempting to reconnect to AssemblyAI...');
    
    try {
      await this.disconnect();
      // Wait a brief moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.connect();
      
    } catch (error) {
      const transcriptionError: TranscriptionError = {
        type: 'RECONNECTION_FAILED',
        message: `Failed to reconnect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }
}