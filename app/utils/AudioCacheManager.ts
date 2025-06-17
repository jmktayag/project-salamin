// Browser-compatible audio cache manager using IndexedDB
/**
 * Configuration options for the audio cache
 */
export interface AudioCacheConfig {
  /** Maximum cache size in bytes (default: 100MB for IndexedDB) */
  maxCacheSize: number;
  /** Cache key prefix for storage */
  keyPrefix: string;
  /** Whether to enable verbose logging */
  enableLogging: boolean;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  fileCount: number;
}

/**
 * AudioCacheManager handles browser-based caching of TTS audio files
 * Uses IndexedDB for storage with content hashing for cache keys
 */
export class AudioCacheManager {
  private config: AudioCacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalSize: 0,
    fileCount: 0
  };
  private sessionId: string;
  private dbName = 'salamin-audio-cache';
  private storeName = 'audio-files';
  private db: IDBDatabase | null = null;

  constructor(config?: Partial<AudioCacheConfig>) {
    this.config = {
      maxCacheSize: 100 * 1024 * 1024, // 100MB for IndexedDB
      keyPrefix: 'audio-cache',
      enableLogging: process.env.NODE_ENV === 'development', // Enable logging in development
      ...config
    };

    // Generate unique session ID
    this.sessionId = this.generateSessionId();
    
    this.log('AudioCacheManager initialized', {
      sessionId: this.sessionId,
      maxCacheSize: this.config.maxCacheSize
    });

    // Initialize database and load cache stats
    this.initDatabase().then(() => {
      this.loadCacheStats();
    });
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.log('IndexedDB not available, caching disabled');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        this.log('Failed to open IndexedDB', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for audio files
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Generate a cache key based on text content and voice settings
   */
  generateCacheKey(text: string, voiceConfig?: Record<string, unknown>): string {
    const content = JSON.stringify({
      text: text.trim(),
      voice: voiceConfig || {}
    });
    
    // Use browser crypto API if available, fallback to simple hash
    if (typeof window !== 'undefined') {
      // Browser environment - use simple hash approach
      return this.simpleHash(content);
    } else {
      // Node.js environment (for tests) - use crypto module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(content).digest('hex');
    }
  }

  /**
   * Simple hash function for browser compatibility
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use a more robust hash without timestamp to ensure consistency
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    
    // Add a second pass for better distribution
    let secondHash = 0;
    for (let i = 0; i < str.length; i++) {
      secondHash = ((secondHash << 3) - secondHash) + str.charCodeAt(i);
      secondHash = secondHash & secondHash;
    }
    const secondHashStr = Math.abs(secondHash).toString(16).padStart(8, '0');
    
    return hashStr + secondHashStr;
  }

  /**
   * Get the storage key for a cache key
   */
  private getStorageKey(cacheKey: string): string {
    return `${this.config.keyPrefix}_${this.sessionId}_${cacheKey}`;
  }

  /**
   * Check if audio is cached and return the buffer if available
   */
  async getCachedAudio(cacheKey: string): Promise<Buffer | null> {
    if (!this.db) {
      this.stats.misses++;
      this.log('Database not available for cache lookup');
      return null;
    }

    try {
      const storageKey = this.getStorageKey(cacheKey);
      
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(storageKey);

        request.onsuccess = () => {
          if (request.result) {
            const buffer = Buffer.from(request.result.data);
            this.stats.hits++;
            this.log('Cache hit', { cacheKey, size: buffer.length });
            resolve(buffer);
          } else {
            this.stats.misses++;
            this.log('Cache miss', { cacheKey });
            resolve(null);
          }
        };

        request.onerror = () => {
          this.stats.misses++;
          this.log('Cache lookup error', { cacheKey, error: request.error });
          resolve(null);
        };
      });
    } catch (error) {
      this.stats.misses++;
      this.log('Cache error', { cacheKey, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Cache audio data with the given key
   */
  async cacheAudio(cacheKey: string, audioBuffer: Buffer): Promise<void> {
    if (!this.db) {
      this.log('Database not available for caching');
      return;
    }

    try {
      const storageKey = this.getStorageKey(cacheKey);
      const data = {
        key: storageKey,
        data: Array.from(audioBuffer), // Store as array instead of base64
        timestamp: Date.now(),
        size: audioBuffer.length,
        sessionId: this.sessionId
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data);

        request.onsuccess = () => {
          // Update stats
          this.stats.totalSize += audioBuffer.length;
          this.stats.fileCount++;
          
          this.log('Audio cached', { 
            cacheKey, 
            size: audioBuffer.length 
          });

          // Save updated stats
          this.saveCacheStats();

          // Check if we need to cleanup due to size limits
          this.enforceCleanupPolicies().then(() => resolve());
        };

        request.onerror = () => {
          const error = request.error;
          this.log('Failed to cache audio', { cacheKey, error: error?.message || 'Unknown error' });
          reject(new Error(`Failed to cache audio: ${error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      this.log('Failed to cache audio', { cacheKey, error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to cache audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up all cached audio files for the current session
   */
  async clearSessionCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('sessionId');
        const request = index.openCursor(IDBKeyRange.only(this.sessionId));
        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            // Reset stats
            this.stats.totalSize = 0;
            this.stats.fileCount = 0;
            
            this.saveCacheStats();
            this.log('Session cache cleared', { sessionId: this.sessionId, deletedCount });
            resolve();
          }
        };

        request.onerror = () => {
          this.log('Failed to clear session cache', { 
            sessionId: this.sessionId, 
            error: request.error?.message 
          });
          resolve();
        };
      });
    } catch (error) {
      this.log('Failed to clear session cache', { 
        sessionId: this.sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Clean up all cache directories and files
   */
  async clearAllCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          // Reset all stats
          this.stats.totalSize = 0;
          this.stats.fileCount = 0;
          this.stats.hits = 0;
          this.stats.misses = 0;
          
          this.log('All cache cleared');
          resolve();
        };

        request.onerror = () => {
          this.log('Failed to clear all cache', { 
            error: request.error?.message 
          });
          resolve();
        };
      });
    } catch (error) {
      this.log('Failed to clear all cache', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Generate a new session ID and clear current session cache
   */
  async startNewSession(): Promise<void> {
    await this.clearSessionCache();
    this.sessionId = this.generateSessionId();
    
    this.log('New session started', { sessionId: this.sessionId });
  }

  /**
   * Enforce cache size limits and cleanup policies
   */
  private async enforceCleanupPolicies(): Promise<void> {
    if (this.stats.totalSize <= this.config.maxCacheSize) {
      return;
    }

    this.log('Cache size limit exceeded, cleaning up', {
      currentSize: this.stats.totalSize,
      maxSize: this.config.maxCacheSize
    });

    // Clear entire session cache if size limit exceeded (simple policy)
    await this.clearSessionCache();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load cache statistics from localStorage (fallback storage for stats)
   */
  private loadCacheStats(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const statsKey = `${this.config.keyPrefix}_stats`;
      const savedStats = localStorage.getItem(statsKey);
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        this.stats = { ...this.stats, ...parsedStats };
      }
    } catch (error) {
      this.log('Failed to load cache stats', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Save cache statistics to localStorage (fallback storage for stats)
   */
  private saveCacheStats(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const statsKey = `${this.config.keyPrefix}_stats`;
      localStorage.setItem(statsKey, JSON.stringify(this.stats));
    } catch (error) {
      this.log('Failed to save cache stats', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Log messages if logging is enabled
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.enableLogging) {
      console.log(`[AudioCacheManager] ${message}`, data || '');
    }
  }

  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total) * 100;
  }

  /**
   * Format cache size in human readable format
   */
  getFormattedCacheSize(): string {
    const size = this.stats.totalSize;
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let formattedSize = size;

    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }

    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
  }
}