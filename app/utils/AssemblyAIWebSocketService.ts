/**
 * AssemblyAI WebSocket Speech Service
 * Browser-compatible implementation using direct WebSocket connection
 * Based on AssemblyAI WebSocket API v3
 */

import {
  ConnectionStatus,
  VoiceStatus,
  SpeechRecognitionCallbacks,
  ISpeechRecognitionService,
  TranscriptionError
} from '../types/speech';

interface AssemblyAIMessage {
  type: 'Begin' | 'Turn' | 'Termination' | 'Error';
  id?: string;
  expires_at?: number;
  transcript?: string;
  turn_is_formatted?: boolean;
  audio_duration_seconds?: number;
  session_duration_seconds?: number;
  error?: string;
}

export class AssemblyAIWebSocketService implements ISpeechRecognitionService {
  private ws: WebSocket | null = null;
  private callbacks: SpeechRecognitionCallbacks;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private isCurrentlyRecording = false;
  private sessionId: string | null = null;
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  // WebSocket configuration
  private readonly wsEndpoint: string;
  private readonly connectionParams = {
    sample_rate: 16000,
    format_turns: true
  };

  constructor(callbacks: SpeechRecognitionCallbacks, apiKey?: string) {
    this.callbacks = callbacks;
    
    // Get API key from parameter or environment
    this.apiKey = apiKey || 
      process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || 
      process.env.ASSEMBLYAI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('AssemblyAI API key is required');
    }

    // Build WebSocket endpoint with parameters
    const params = new URLSearchParams(this.connectionParams as any);
    this.wsEndpoint = `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`;
    
    console.log('🔧 AssemblyAI WebSocket service initialized');
  }

  /**
   * Check if service is connected to AssemblyAI
   */
  public isConnected(): boolean {
    return this.connectionStatus === 'connected' && 
           this.ws?.readyState === WebSocket.OPEN;
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
   * Connect to AssemblyAI WebSocket service
   */
  public async connect(): Promise<void> {
    if (this.connectionStatus === 'connected') {
      console.log('Already connected to AssemblyAI WebSocket');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionStatus('connecting');
        console.log(`🔌 Connecting to AssemblyAI WebSocket: ${this.wsEndpoint}`);

        // Create WebSocket connection
        // Try different authentication methods for browser compatibility
        try {
          // Method 1: Try with API key as subprotocol
          this.ws = new WebSocket(this.wsEndpoint, [this.apiKey]);
        } catch (subprotocolError) {
          console.warn('Subprotocol auth failed, trying URL parameter:', subprotocolError);
          // Method 2: Try with API key in URL
          this.ws = new WebSocket(`${this.wsEndpoint}&token=${encodeURIComponent(this.apiKey)}`);
        }

        // Set up event listeners
        this.setupWebSocketListeners(resolve, reject);

      } catch (error) {
        this.setConnectionStatus('error');
        const transcriptionError: TranscriptionError = {
          type: 'CONNECTION_FAILED',
          message: `Failed to connect to AssemblyAI WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        };
        this.callbacks.onError(transcriptionError);
        reject(error);
      }
    });
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupWebSocketListeners(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connection opened');
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      resolve();
    };

    this.ws.onmessage = (event) => {
      this.handleWebSocketMessage(event.data);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.setConnectionStatus('error');
      
      const transcriptionError: TranscriptionError = {
        type: 'WEBSOCKET_ERROR',
        message: 'WebSocket connection error',
        details: error
      };
      this.callbacks.onError(transcriptionError);
      reject(new Error('WebSocket connection failed'));
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      this.setConnectionStatus('disconnected');
      this.sessionId = null;
      this.isCurrentlyRecording = false;

      // Attempt to reconnect if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    try {
      const message: AssemblyAIMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'Begin':
          this.handleSessionBegin(message);
          break;
          
        case 'Turn':
          this.handleTranscriptTurn(message);
          break;
          
        case 'Termination':
          this.handleSessionTermination(message);
          break;
          
        case 'Error':
          this.handleSessionError(message);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      console.error('Message data:', data);
    }
  }

  /**
   * Handle session begin message
   */
  private handleSessionBegin(message: AssemblyAIMessage): void {
    this.sessionId = message.id || null;
    const expiresAt = message.expires_at;
    
    console.log(`🎯 Session began: ID=${this.sessionId}, ExpiresAt=${expiresAt ? new Date(expiresAt * 1000).toISOString() : 'N/A'}`);
    
    // Trigger audio start callback
    this.callbacks.onAudioStart?.();
  }

  /**
   * Handle transcript turn message
   */
  private handleTranscriptTurn(message: AssemblyAIMessage): void {
    const transcript = message.transcript || '';
    const isFormatted = message.turn_is_formatted || false;
    
    if (transcript) {
      // Call transcript update callback
      this.callbacks.onTranscriptUpdate(transcript, isFormatted);
      
      if (isFormatted) {
        console.log('📝 Final transcript:', transcript);
      }
    }
  }

  /**
   * Handle session termination message
   */
  private handleSessionTermination(message: AssemblyAIMessage): void {
    const audioDuration = message.audio_duration_seconds;
    const sessionDuration = message.session_duration_seconds;
    
    console.log(`🏁 Session terminated: Audio=${audioDuration}s, Session=${sessionDuration}s`);
    
    this.isCurrentlyRecording = false;
    this.callbacks.onAudioEnd?.();
  }

  /**
   * Handle session error message
   */
  private handleSessionError(message: AssemblyAIMessage): void {
    const errorMessage = message.error || 'Unknown session error';
    console.error('🚨 Session error:', errorMessage);
    
    const transcriptionError: TranscriptionError = {
      type: 'SESSION_ERROR',
      message: errorMessage,
      details: message
    };
    this.callbacks.onError(transcriptionError);
  }

  /**
   * Disconnect from AssemblyAI WebSocket service
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.isCurrentlyRecording) {
        await this.stopRecording();
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send termination message
        const terminateMessage = { type: 'Terminate' };
        this.ws.send(JSON.stringify(terminateMessage));
        
        // Close WebSocket
        this.ws.close(1000, 'Normal closure');
      }

      this.ws = null;
      this.sessionId = null;
      this.setConnectionStatus('disconnected');
      
      console.log('✅ Disconnected from AssemblyAI WebSocket');

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
      console.log('🎤 Started recording audio for transcription');
      
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
      console.log('🛑 Stopped recording audio');
      
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
    if (!this.isConnected() || !this.ws) {
      throw new Error('Not connected to AssemblyAI WebSocket');
    }

    if (!this.isCurrentlyRecording) {
      return; // Ignore audio data when not recording
    }

    try {
      // Send raw audio data as binary
      this.ws.send(audioData);
      
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
   * Attempt to reconnect to WebSocket
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    
    console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.connect();
        console.log('✅ Reconnected successfully');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
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
}