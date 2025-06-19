/**
 * TypeScript interfaces for AssemblyAI Speech-to-Text integration
 */

/**
 * Configuration options for AssemblyAI real-time transcription
 */
export interface AssemblyAIConfig {
  apiKey: string;
  sampleRate: number;
  formatTurns: boolean;
  language?: string;
  enableAutoPunctuation?: boolean;
}

/**
 * Real-time transcription turn data from AssemblyAI
 */
export interface TranscriptionTurn {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
  audioStart?: number;
  audioEnd?: number;
}

/**
 * Error information from AssemblyAI
 */
export interface TranscriptionError {
  type: string;
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Connection status for real-time transcription
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Voice status for UI feedback
 */
export type VoiceStatus = 'idle' | 'recording' | 'processing' | 'error';

/**
 * Audio recording configuration
 */
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  audioType: 'wav' | 'pcm';
  bitDepth?: 16 | 24 | 32;
}

/**
 * Speech recognition event callbacks
 */
export interface SpeechRecognitionCallbacks {
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
  onError: (error: TranscriptionError) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

/**
 * Speech recognition service interface
 */
export interface ISpeechRecognitionService {
  isConnected(): boolean;
  isRecording(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
}

/**
 * Integrated speech service callback interface
 */
export interface IntegratedSpeechCallbacks {
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
  onError: (error: TranscriptionError) => void;
  onStatusChange: (status: VoiceStatus) => void;
  onConnectionChange: (status: ConnectionStatus) => void;
}

/**
 * Audio stream processor interface
 */
export interface IAudioProcessor {
  requestMicrophonePermission(): Promise<boolean>;
  startAudioCapture(config: AudioConfig): Promise<MediaStream>;
  stopAudioCapture(): void;
  processAudioData(audioData: ArrayBuffer): ArrayBuffer;
}