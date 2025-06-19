/**
 * Integrated Speech Service
 * Provides both server-side (secure) and client-side (fallback) speech recognition
 */

import { ServerSideAssemblyAIService } from './ServerSideAssemblyAIService';
import { AssemblyAIWebSocketService } from './AssemblyAIWebSocketService';
import { AudioProcessor } from './AudioProcessor';
import {
  AudioConfig,
  ConnectionStatus,
  VoiceStatus,
  SpeechRecognitionCallbacks,
  TranscriptionError
} from '../types/speech';

export interface IntegratedSpeechCallbacks {
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
  onError: (error: TranscriptionError) => void;
  onStatusChange: (status: VoiceStatus) => void;
  onConnectionChange: (status: ConnectionStatus) => void;
}

export class IntegratedSpeechService {
  private serverSideService: ServerSideAssemblyAIService | null = null;
  private assemblyAIService: AssemblyAIWebSocketService | null = null;
  private audioProcessor: AudioProcessor | null = null;
  private callbacks: IntegratedSpeechCallbacks;
  private currentStatus: VoiceStatus = 'idle';
  private isInitialized = false;
  private useServerSide = true; // Prefer server-side by default

  constructor(callbacks: IntegratedSpeechCallbacks, apiKey?: string) {
    this.callbacks = callbacks;

    // Initialize server-side service (preferred)
    this.initializeServerSideService();

    // Keep client-side as fallback
    if (apiKey) {
      this.initializeClientSideService(apiKey);
    }
  }

  private initializeServerSideService(): void {
    const serverCallbacks = {
      onTranscriptUpdate: (transcript: string, isFinal: boolean) => {
        this.callbacks.onTranscriptUpdate(transcript, isFinal);
      },
      onError: (error: TranscriptionError) => {
        console.error('Server-side speech error:', error);
        this.setStatus('error');
        this.callbacks.onError(error);
        
        // Fallback to client-side if server fails
        if (this.assemblyAIService && !this.isInitialized) {
          console.log('Falling back to client-side speech recognition');
          this.useServerSide = false;
        }
      },
      onStatusChange: (status: VoiceStatus) => {
        this.setStatus(status);
      }
    };

    this.serverSideService = new ServerSideAssemblyAIService(serverCallbacks);
  }

  private initializeClientSideService(apiKey: string): void {
    this.audioProcessor = new AudioProcessor();

    // Create AssemblyAI service with wrapped callbacks
    const assemblyCallbacks: SpeechRecognitionCallbacks = {
      onTranscriptUpdate: (transcript, isFinal) => {
        this.callbacks.onTranscriptUpdate(transcript, isFinal);
      },
      onError: (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        this.setStatus('error');
        this.callbacks.onError(error);
      },
      onConnectionStatusChange: (status) => {
        this.callbacks.onConnectionChange(status);
      },
      onAudioStart: () => {
        this.setStatus('recording');
      },
      onAudioEnd: () => {
        this.setStatus('idle');
      }
    };

    this.assemblyAIService = new AssemblyAIWebSocketService(assemblyCallbacks, apiKey);

    // Set up audio data callback
    if (this.audioProcessor) {
      this.audioProcessor.setAudioDataCallback((audioData) => {
        this.handleAudioData(audioData);
      });
    }
  }

  /**
   * Initialize the speech service (request permissions and connect)
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('Speech service already initialized');
      return true;
    }

    try {
      this.setStatus('processing');

      // Try server-side first
      if (this.useServerSide && this.serverSideService) {
        const serverInitialized = await this.serverSideService.initialize();
        if (serverInitialized) {
          this.isInitialized = true;
          this.setStatus('idle');
          console.log('✅ Server-side speech service initialized successfully');
          return true;
        } else {
          console.log('Server-side initialization failed, trying client-side fallback');
          this.useServerSide = false;
        }
      }

      // Fallback to client-side
      if (!this.useServerSide && this.assemblyAIService && this.audioProcessor) {
        // Check browser capabilities
        const capabilities = await AudioProcessor.getBrowserCapabilities();
        if (!capabilities.hasGetUserMedia) {
          throw new Error('Browser does not support microphone access');
        }
        if (!capabilities.hasAudioContext) {
          throw new Error('Browser does not support Web Audio API');
        }

        // Request microphone permission
        const hasPermission = await this.audioProcessor.requestMicrophonePermission();
        if (!hasPermission) {
          throw new Error('Microphone permission denied');
        }

        // Connect to AssemblyAI WebSocket
        await this.assemblyAIService.connect();
        console.log('✅ AssemblyAI WebSocket service initialized successfully');

        this.isInitialized = true;
        this.setStatus('idle');
        
        console.log('✅ Client-side speech service initialized (fallback mode)');
        return true;
      }

      throw new Error('No speech service available');

    } catch (error) {
      this.setStatus('error');
      const transcriptionError: TranscriptionError = {
        type: 'initialization',
        message: `Failed to initialize speech service: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.callbacks.onError(transcriptionError);
      return false;
    }
  }

  /**
   * Start recording and transcription
   */
  public async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Speech service not initialized. Call initialize() first.');
    }

    if (this.currentStatus === 'recording') {
      console.log('Already recording');
      return;
    }

    try {
      this.setStatus('processing');

      if (this.useServerSide && this.serverSideService) {
        // Use server-side service
        await this.serverSideService.startRecording();
      } else if (this.assemblyAIService && this.audioProcessor) {
        // Use client-side service
        await this.assemblyAIService.startRecording();

        // Start audio capture
        const audioConfig: AudioConfig = {
          sampleRate: 16000,
          channels: 1,
          audioType: 'pcm',
          bitDepth: 16
        };

        await this.audioProcessor.startAudioCapture(audioConfig);
      } else {
        throw new Error('No speech service available');
      }

      this.setStatus('recording');
      console.log('✅ Recording started');

    } catch (error) {
      this.setStatus('error');
      const transcriptionError: TranscriptionError = {
        type: 'recording',
        message: `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }

  /**
   * Stop recording and transcription
   */
  public async stopRecording(): Promise<void> {
    if (this.currentStatus !== 'recording') {
      console.log('Not currently recording');
      return;
    }

    try {
      this.setStatus('processing');

      if (this.useServerSide && this.serverSideService) {
        // Use server-side service
        await this.serverSideService.stopRecording();
      } else if (this.assemblyAIService && this.audioProcessor) {
        // Use client-side service
        this.audioProcessor.stopAudioCapture();
        await this.assemblyAIService.stopRecording();
      }

      // Don't set status to 'idle' here - let the individual services control status
      // based on their transcription completion
      console.log('✅ Recording stopped');

    } catch (error) {
      this.setStatus('error');
      const transcriptionError: TranscriptionError = {
        type: 'recording',
        message: `Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.callbacks.onError(transcriptionError);
      throw error;
    }
  }

  /**
   * Toggle recording on/off
   */
  public async toggleRecording(): Promise<void> {
    if (this.currentStatus === 'recording') {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  /**
   * Clean up and disconnect
   */
  public async cleanup(): Promise<void> {
    try {
      // Stop recording if active
      if (this.currentStatus === 'recording') {
        await this.stopRecording();
      }

      // Cleanup server-side service
      if (this.serverSideService) {
        await this.serverSideService.cleanup();
      }

      // Cleanup client-side services
      if (this.audioProcessor) {
        this.audioProcessor.stopAudioCapture();
      }

      if (this.assemblyAIService) {
        await this.assemblyAIService.disconnect();
      }

      this.isInitialized = false;
      this.setStatus('idle');
      
      console.log('✅ Speech service cleaned up');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get current status
   */
  public getStatus(): VoiceStatus {
    return this.currentStatus;
  }

  /**
   * Check if service is ready to record
   */
  public isReady(): boolean {
    if (!this.isInitialized || this.currentStatus !== 'idle') {
      return false;
    }

    if (this.useServerSide) {
      return true; // Server-side service handles its own connection
    } else {
      return this.assemblyAIService?.isConnected() || false;
    }
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.currentStatus === 'recording';
  }

  /**
   * Get connection information
   */
  public getConnectionInfo(): {
    isInitialized: boolean;
    assemblyAIConnected: boolean;
    connectionStatus: ConnectionStatus;
    voiceStatus: VoiceStatus;
    serviceType: 'server' | 'client' | 'none';
  } {
    let connectionStatus: ConnectionStatus = 'disconnected';
    let assemblyAIConnected = false;

    if (this.useServerSide) {
      connectionStatus = 'connected'; // Assume server is available
      assemblyAIConnected = true;
    } else if (this.assemblyAIService) {
      connectionStatus = this.assemblyAIService.getConnectionStatus();
      assemblyAIConnected = this.assemblyAIService.isConnected();
    }

    return {
      isInitialized: this.isInitialized,
      assemblyAIConnected,
      connectionStatus,
      voiceStatus: this.currentStatus,
      serviceType: this.useServerSide ? 'server' : 
                  (this.assemblyAIService ? 'client' : 'none')
    };
  }

  /**
   * Handle audio data from the processor (client-side only)
   */
  private async handleAudioData(audioData: ArrayBuffer): Promise<void> {
    if (this.currentStatus !== 'recording' || this.useServerSide) {
      return; // Ignore audio data when not recording or using server-side
    }

    try {
      if (this.audioProcessor && this.assemblyAIService) {
        // Process the audio data if needed
        const processedAudio = this.audioProcessor.processAudioData(audioData);
        
        // Send to AssemblyAI
        await this.assemblyAIService.sendAudioData(processedAudio);
      }

    } catch (error) {
      console.error('Error handling audio data:', error);
      const transcriptionError: TranscriptionError = {
        type: 'processing',
        message: `Failed to process audio data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      this.callbacks.onError(transcriptionError);
    }
  }

  /**
   * Update status and notify callbacks
   */
  private setStatus(status: VoiceStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Get browser capabilities for audio recording
   */
  public static async getBrowserCapabilities() {
    return await AudioProcessor.getBrowserCapabilities();
  }

  /**
   * Test if the browser supports all required features
   */
  public static async isBrowserSupported(): Promise<{
    supported: boolean;
    missingFeatures: string[];
  }> {
    const capabilities = await AudioProcessor.getBrowserCapabilities();
    const missingFeatures: string[] = [];

    if (!capabilities.hasGetUserMedia) {
      missingFeatures.push('getUserMedia (microphone access)');
    }
    if (!capabilities.hasAudioContext) {
      missingFeatures.push('Web Audio API');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures
    };
  }
}