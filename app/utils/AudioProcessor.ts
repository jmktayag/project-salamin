/**
 * Browser Audio Processor for AssemblyAI Integration
 * Handles microphone access, audio stream processing, and format conversion
 */

import { AudioConfig, IAudioProcessor } from '../types/speech';

export class AudioProcessor implements IAudioProcessor {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isRecording = false;
  private config: AudioConfig;

  // Callback for processed audio data
  private onAudioDataCallback: ((audioData: ArrayBuffer) => void) | null = null;

  constructor() {
    this.config = {
      sampleRate: 16000,
      channels: 1,
      audioType: 'pcm',
      bitDepth: 16
    };
  }

  /**
   * Request microphone permission from the user
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
        return false;
      }

      // Request microphone permission without actually starting the stream
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Stop the test stream immediately
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Microphone permission granted');
      return true;

    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start audio capture with the specified configuration
   */
  public async startAudioCapture(config?: Partial<AudioConfig>): Promise<MediaStream> {
    if (this.isRecording) {
      throw new Error('Audio capture is already active');
    }

    // Update configuration if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Get media stream from microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context with the desired sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create media stream source
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Set up audio processing
      await this.setupAudioProcessing();

      this.isRecording = true;
      console.log(`✅ Audio capture started (${this.config.sampleRate}Hz, ${this.config.channels} channel)`);
      
      return this.mediaStream;

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop audio capture and clean up resources
   */
  public stopAudioCapture(): void {
    if (!this.isRecording) {
      console.log('Audio capture is not active');
      return;
    }

    this.cleanup();
    this.isRecording = false;
    console.log('✅ Audio capture stopped');
  }

  /**
   * Process raw audio data (convert format, resample, etc.)
   */
  public processAudioData(audioData: ArrayBuffer): ArrayBuffer {
    // For now, return the audio data as-is
    // In a more advanced implementation, we could:
    // - Resample to target sample rate
    // - Convert between audio formats
    // - Apply audio filters
    return audioData;
  }

  /**
   * Set callback for receiving processed audio data
   */
  public setAudioDataCallback(callback: (audioData: ArrayBuffer) => void): void {
    this.onAudioDataCallback = callback;
  }

  /**
   * Get current recording status
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current audio configuration
   */
  public getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Update audio configuration (requires restart to take effect)
   */
  public updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set up audio processing using ScriptProcessorNode (fallback) or AudioWorklet
   */
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.mediaStreamSource) {
      throw new Error('Audio context or media stream source not available');
    }

    try {
      // Try to use AudioWorklet for better performance (modern browsers)
      await this.setupAudioWorklet();
    } catch (error) {
      console.warn('AudioWorklet not available, falling back to ScriptProcessorNode');
      this.setupScriptProcessor();
    }
  }

  /**
   * Set up AudioWorklet for modern browsers
   */
  private async setupAudioWorklet(): Promise<void> {
    if (!this.audioContext || !this.mediaStreamSource) return;

    try {
      // Register the audio worklet processor
      await this.audioContext.audioWorklet.addModule(
        this.createAudioWorkletProcessorBlob()
      );

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      // Handle messages from the worklet
      this.workletNode.port.onmessage = (event) => {
        const { audioData } = event.data;
        if (audioData && this.onAudioDataCallback) {
          this.onAudioDataCallback(audioData);
        }
      };

      // Connect the audio graph
      this.mediaStreamSource.connect(this.workletNode);

    } catch (error) {
      console.error('Failed to setup AudioWorklet:', error);
      throw error;
    }
  }

  /**
   * Set up ScriptProcessorNode as fallback for older browsers
   */
  private setupScriptProcessor(): void {
    if (!this.audioContext || !this.mediaStreamSource) return;

    // Create script processor node (deprecated but widely supported)
    const bufferSize = 4096;
    const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    scriptNode.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Convert Float32Array to Int16Array for AssemblyAI
      const outputData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Convert from [-1, 1] to [-32768, 32767]
        outputData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
      }

      if (this.onAudioDataCallback) {
        this.onAudioDataCallback(outputData.buffer);
      }
    };

    // Connect the audio graph
    this.mediaStreamSource.connect(scriptNode);
    scriptNode.connect(this.audioContext.destination);

    console.log('✅ Audio processing setup complete (ScriptProcessorNode)');
  }

  /**
   * Create AudioWorklet processor as a blob URL
   */
  private createAudioWorkletProcessorBlob(): string {
    const processorCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const inputData = input[0];
            
            // Convert Float32Array to Int16Array
            const outputData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              outputData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
            }
            
            // Send processed audio data to main thread
            this.port.postMessage({
              audioData: outputData.buffer
            });
          }
          
          return true;
        }
      }
      
      registerProcessor('audio-processor', AudioProcessor);
    `;

    const blob = new Blob([processorCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  /**
   * Clean up all audio resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Stop worklet node
      if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode = null;
      }

      // Stop media stream source
      if (this.mediaStreamSource) {
        this.mediaStreamSource.disconnect();
        this.mediaStreamSource = null;
      }

      // Close audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Stop media stream tracks
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  }

  /**
   * Get browser audio capabilities
   */
  public static async getBrowserCapabilities(): Promise<{
    hasGetUserMedia: boolean;
    hasAudioContext: boolean;
    hasAudioWorklet: boolean;
    supportedConstraints: MediaTrackSupportedConstraints | null;
  }> {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    
    let hasAudioWorklet = false;
    let supportedConstraints = null;

    if (hasAudioContext) {
      try {
        const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        hasAudioWorklet = !!(tempContext.audioWorklet);
        await tempContext.close();
      } catch (error) {
        console.warn('Could not test AudioWorklet capability');
      }
    }

    if (hasGetUserMedia) {
      supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    }

    return {
      hasGetUserMedia,
      hasAudioContext,
      hasAudioWorklet,
      supportedConstraints
    };
  }
}