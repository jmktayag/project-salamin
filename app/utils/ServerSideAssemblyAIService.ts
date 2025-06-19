/**
 * Server-Side AssemblyAI Speech Service
 * Uses Next.js API routes for secure server-side AssemblyAI integration
 */

import { VoiceStatus, TranscriptionError } from '../types/speech';

export interface ServerSideAssemblyAICallbacks {
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
  onError: (error: TranscriptionError) => void;
  onStatusChange: (status: VoiceStatus) => void;
}

export interface TranscriptionConfig {
  language_code?: string;
  punctuate?: boolean;
  format_text?: boolean;
  speaker_labels?: boolean;
}

export interface TranscriptionResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  confidence?: number;
  words?: any[];
  audio_duration?: number;
  error?: string;
}

export class ServerSideAssemblyAIService {
  private callbacks: ServerSideAssemblyAICallbacks;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private currentTranscriptionId: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(callbacks: ServerSideAssemblyAICallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Initialize the service and check browser support
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }

      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      this.callbacks.onStatusChange('idle');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize ServerSideAssemblyAIService:', error);
      this.callbacks.onError({
        type: 'initialization',
        message: error instanceof Error ? error.message : 'Unknown initialization error'
      });
      this.callbacks.onStatusChange('error');
      return false;
    }
  }

  /**
   * Start recording audio for transcription
   */
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      this.callbacks.onStatusChange('recording');

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('🎤 Started recording audio');

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.callbacks.onError({
        type: 'recording',
        message: error instanceof Error ? error.message : 'Failed to start recording'
      });
      this.callbacks.onStatusChange('error');
    }
  }

  /**
   * Stop recording and send to server for transcription
   */
  async stopRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        console.warn('Not currently recording');
        return;
      }

      this.callbacks.onStatusChange('processing');
      
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }

      console.log('🛑 Stopped recording audio');

    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.callbacks.onError({
        type: 'recording',
        message: error instanceof Error ? error.message : 'Failed to stop recording'
      });
      this.callbacks.onStatusChange('error');
    }
  }

  /**
   * Process recorded audio and send to server
   */
  private async processRecording(): Promise<void> {
    try {
      if (this.audioChunks.length === 0) {
        console.warn('No audio data to process');
        this.callbacks.onStatusChange('idle');
        return;
      }

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log(`📁 Processing audio blob: ${audioBlob.size} bytes`);

      // Send to server for transcription
      const transcriptionId = await this.uploadAndTranscribe(audioBlob);
      
      if (transcriptionId) {
        this.currentTranscriptionId = transcriptionId;
        this.startPollingForResult(transcriptionId);
      } else {
        this.callbacks.onStatusChange('error');
      }

    } catch (error) {
      console.error('Failed to process recording:', error);
      this.callbacks.onError({
        type: 'processing',
        message: error instanceof Error ? error.message : 'Failed to process recording'
      });
      this.callbacks.onStatusChange('error');
    }
  }

  /**
   * Upload audio file and start transcription
   */
  private async uploadAndTranscribe(audioBlob: Blob, config: TranscriptionConfig = {}): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('config', JSON.stringify(config));

      const response = await fetch('/api/assemblyai/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload audio');
      }

      const data = await response.json();
      console.log(`✅ Transcription job created: ${data.id}`);
      
      return data.id;

    } catch (error) {
      console.error('Failed to upload and transcribe:', error);
      this.callbacks.onError({
        type: 'upload',
        message: error instanceof Error ? error.message : 'Failed to upload audio'
      });
      return null;
    }
  }

  /**
   * Poll for transcription results
   */
  private startPollingForResult(transcriptionId: string): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/assemblyai/status/${transcriptionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get transcription status');
        }

        const result: TranscriptionResult = await response.json();
        
        console.log(`📊 Transcription ${transcriptionId} status: ${result.status}`);

        if (result.status === 'completed' && result.text) {
          this.callbacks.onTranscriptUpdate(result.text, true);
          this.callbacks.onStatusChange('idle');
          this.stopPolling();
        } else if (result.status === 'error') {
          this.callbacks.onError({
            type: 'transcription',
            message: result.error || 'Transcription failed'
          });
          this.callbacks.onStatusChange('error');
          this.stopPolling();
        }
        // Continue polling for 'queued' and 'processing' statuses

      } catch (error) {
        console.error('Failed to poll transcription status:', error);
        this.callbacks.onError({
          type: 'polling',
          message: error instanceof Error ? error.message : 'Failed to get transcription status'
        });
        this.callbacks.onStatusChange('error');
        this.stopPolling();
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop polling for results
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Stop recording if active
      if (this.isRecording && this.mediaRecorder) {
        this.mediaRecorder.stop();
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      }

      // Stop polling
      this.stopPolling();

      // Reset state
      this.isRecording = false;
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.currentTranscriptionId = null;

      console.log('🧹 ServerSideAssemblyAIService cleanup complete');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get current recording status
   */
  getStatus(): VoiceStatus {
    if (this.isRecording) return 'recording';
    if (this.pollingInterval) return 'processing';
    return 'idle';
  }
}