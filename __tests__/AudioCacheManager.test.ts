import { AudioCacheManager, AudioCacheConfig } from '@/app/utils/AudioCacheManager';

// Mock IndexedDB
class MockIDBDatabase {
  objectStoreNames = { contains: jest.fn(() => false) };
  transaction = jest.fn();
  close = jest.fn();
}

class MockIDBObjectStore {
  private data = new Map<string, any>();
  
  get = jest.fn((key: string) => ({
    onsuccess: null as any,
    onerror: null as any,
    result: this.data.get(key) || null
  }));
  
  put = jest.fn((value: any) => ({
    onsuccess: null as any,
    onerror: null as any
  }));
  
  clear = jest.fn(() => {
    this.data.clear();
    return {
      onsuccess: null as any,
      onerror: null as any
    };
  });
  
  createIndex = jest.fn();
  index = jest.fn(() => ({
    openCursor: jest.fn(() => ({
      onsuccess: null as any,
      onerror: null as any
    }))
  }));
  
  // Test helper
  _setData(key: string, value: any) {
    this.data.set(key, value);
  }
  
  _clearData() {
    this.data.clear();
  }
}

class MockIDBTransaction {
  objectStore = jest.fn(() => new MockIDBObjectStore());
}

const mockIndexedDB = {
  open: jest.fn(() => {
    const request = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: new MockIDBDatabase()
    };
    
    // Simulate successful connection
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  })
};

// Mock localStorage for stats storage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Setup global mocks
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AudioCacheManager', () => {
  let cacheManager: AudioCacheManager;
  const testConfig: Partial<AudioCacheConfig> = {
    keyPrefix: 'test-cache',
    maxCacheSize: 1024 * 1024, // 1MB
    enableLogging: false
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorageMock.clear();
    cacheManager = new AudioCacheManager(testConfig);
    
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultManager = new AudioCacheManager();
      expect(defaultManager).toBeInstanceOf(AudioCacheManager);
    });

    it('should initialize with custom config', () => {
      expect(cacheManager).toBeInstanceOf(AudioCacheManager);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys for same input', () => {
      const text = 'Hello world';
      const voiceConfig = { voice: 'Zephyr' };
      
      const key1 = cacheManager.generateCacheKey(text, voiceConfig);
      const key2 = cacheManager.generateCacheKey(text, voiceConfig);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]+$/); // Hex string (length varies based on implementation)
    });

    it('should generate different keys for different input', () => {
      const key1 = cacheManager.generateCacheKey('Hello world');
      const key2 = cacheManager.generateCacheKey('Hello world!');
      
      expect(key1).not.toBe(key2);
    });

    it('should handle undefined voice config', () => {
      const key = cacheManager.generateCacheKey('Hello world');
      expect(key).toMatch(/^[a-f0-9]+$/); // Hex string (length varies based on implementation)
    });

    it('should trim whitespace from text', () => {
      const key1 = cacheManager.generateCacheKey('  Hello world  ');
      const key2 = cacheManager.generateCacheKey('Hello world');
      
      expect(key1).toBe(key2);
    });
  });

  describe('getCachedAudio', () => {
    it('should return cached audio when data exists in localStorage', async () => {
      const testBuffer = Buffer.from('test audio data');
      const cacheKey = 'test-key';
      
      // Mock cached data in localStorage
      const cachedData = {
        data: testBuffer.toString('base64'),
        timestamp: Date.now(),
        size: testBuffer.length
      };
      
      // First cache the audio
      await cacheManager.cacheAudio(cacheKey, testBuffer);
      
      // Then retrieve it
      const result = await cacheManager.getCachedAudio(cacheKey);
      
      expect(result).toEqual(testBuffer);
    });

    it('should return null when data does not exist in localStorage', async () => {
      const cacheKey = 'non-existent-key';
      
      const result = await cacheManager.getCachedAudio(cacheKey);
      
      expect(result).toBeNull();
    });

    it('should update cache hit statistics', async () => {
      const testBuffer = Buffer.from('test audio data');
      const cacheKey = 'test-key';
      
      // First cache the audio
      await cacheManager.cacheAudio(cacheKey, testBuffer);
      
      const initialStats = cacheManager.getStats();
      await cacheManager.getCachedAudio(cacheKey);
      const updatedStats = cacheManager.getStats();
      
      expect(updatedStats.hits).toBe(initialStats.hits + 1);
    });

    it('should update cache miss statistics', async () => {
      const initialStats = cacheManager.getStats();
      await cacheManager.getCachedAudio('non-existent-key');
      const updatedStats = cacheManager.getStats();
      
      expect(updatedStats.misses).toBe(initialStats.misses + 1);
    });
  });

  describe('cacheAudio', () => {
    it('should cache audio successfully', async () => {
      const cacheKey = 'test-key';
      const audioBuffer = Buffer.from('test audio data');
      
      await cacheManager.cacheAudio(cacheKey, audioBuffer);
      
      // Verify data was stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Verify we can retrieve the cached audio
      const result = await cacheManager.getCachedAudio(cacheKey);
      expect(result).toEqual(audioBuffer);
    });

    it('should update cache statistics', async () => {
      const audioBuffer = Buffer.from('test audio data');
      
      const initialStats = cacheManager.getStats();
      await cacheManager.cacheAudio('test-key', audioBuffer);
      const updatedStats = cacheManager.getStats();
      
      expect(updatedStats.totalSize).toBe(initialStats.totalSize + audioBuffer.length);
      expect(updatedStats.fileCount).toBe(initialStats.fileCount + 1);
    });

    it('should handle localStorage quota errors', async () => {
      const audioBuffer = Buffer.from('test audio data');
      
      // Mock localStorage quota exceeded error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      
      await expect(cacheManager.cacheAudio('test-key', audioBuffer))
        .rejects.toThrow('Failed to cache audio: QuotaExceededError');
    });
  });

  describe('clearSessionCache', () => {
    it('should clear session cache successfully', async () => {
      // First cache some data
      const audioBuffer = Buffer.from('test data');
      await cacheManager.cacheAudio('test-key', audioBuffer);
      
      await cacheManager.clearSessionCache();
      
      // Verify cache was cleared
      const result = await cacheManager.getCachedAudio('test-key');
      expect(result).toBeNull();
    });

    it('should reset cache statistics', async () => {
      // Simulate some cached data
      const audioBuffer = Buffer.from('test data');
      await cacheManager.cacheAudio('test-key', audioBuffer);
      
      await cacheManager.clearSessionCache();
      const stats = cacheManager.getStats();
      
      expect(stats.totalSize).toBe(0);
      expect(stats.fileCount).toBe(0);
    });

    it('should handle clear errors gracefully', async () => {
      // Mock localStorage error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      await expect(cacheManager.clearSessionCache()).resolves.toBeUndefined();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache successfully', async () => {
      // First cache some data
      const audioBuffer = Buffer.from('test data');
      await cacheManager.cacheAudio('test-key', audioBuffer);
      
      // Verify data exists before clearing
      const beforeResult = await cacheManager.getCachedAudio('test-key');
      expect(beforeResult).not.toBeNull();
      
      await cacheManager.clearAllCache();
      
      // Verify all cache was cleared
      const result = await cacheManager.getCachedAudio('test-key');
      expect(result).toBeNull();
    });

    it('should reset all statistics', async () => {
      // First cache some data and generate hits/misses
      const audioBuffer = Buffer.from('test data');
      await cacheManager.cacheAudio('key1', audioBuffer);
      await cacheManager.getCachedAudio('key1'); // hit
      await cacheManager.getCachedAudio('key2'); // miss
      
      await cacheManager.clearAllCache();
      const stats = cacheManager.getStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.fileCount).toBe(0);
    });
  });

  describe('startNewSession', () => {
    it('should clear current session and generate new session ID', async () => {
      // First cache some data
      const audioBuffer = Buffer.from('test data');
      await cacheManager.cacheAudio('test-key', audioBuffer);
      
      await cacheManager.startNewSession();
      
      // Verify session cache was cleared
      const result = await cacheManager.getCachedAudio('test-key');
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return current cache statistics', () => {
      const stats = cacheManager.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('fileCount');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.fileCount).toBe('number');
    });
  });

  describe('getHitRate', () => {
    it('should return 0 for no requests', () => {
      expect(cacheManager.getHitRate()).toBe(0);
    });

    it('should calculate hit rate correctly', async () => {
      // Create 2 hits and 1 miss
      const audioBuffer = Buffer.from('test data');
      
      // Cache two items
      await cacheManager.cacheAudio('key1', audioBuffer);
      await cacheManager.cacheAudio('key2', audioBuffer);
      
      // Generate 2 hits and 1 miss
      await cacheManager.getCachedAudio('key1'); // hit
      await cacheManager.getCachedAudio('key2'); // hit  
      await cacheManager.getCachedAudio('key3'); // miss
      
      expect(cacheManager.getHitRate()).toBeCloseTo(66.67, 1);
    });
  });

  describe('getFormattedCacheSize', () => {
    it('should format bytes correctly', () => {
      expect(cacheManager.getFormattedCacheSize()).toMatch(/^\d+\.\d{2} B$/);
    });

    it('should format KB correctly', async () => {
      const largeBuffer = Buffer.alloc(2048); // 2KB
      
      await cacheManager.cacheAudio('test-key', largeBuffer);
      
      expect(cacheManager.getFormattedCacheSize()).toMatch(/^\d+\.\d{2} KB$/);
    });

    it('should format MB correctly', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB
      
      // Mock the cache manager to simulate cached stats with higher limit
      const largeCacheManager = new AudioCacheManager({
        ...testConfig,
        maxCacheSize: 10 * 1024 * 1024 // 10MB to prevent cleanup
      });
      
      await largeCacheManager.cacheAudio('test-key', largeBuffer);
      
      expect(largeCacheManager.getFormattedCacheSize()).toMatch(/^\d+\.\d{2} MB$/);
    });
  });

  describe('cache size enforcement', () => {
    it('should clear cache when size limit is exceeded', async () => {
      const smallConfig: Partial<AudioCacheConfig> = {
        ...testConfig,
        maxCacheSize: 100 // 100 bytes limit
      };
      const smallCacheManager = new AudioCacheManager(smallConfig);
      
      const largeBuffer = Buffer.alloc(200); // Exceeds limit
      
      await smallCacheManager.cacheAudio('test-key', largeBuffer);
      
      // Cache should have been cleared, so totalSize should be 0
      const stats = smallCacheManager.getStats();
      expect(stats.totalSize).toBe(0);
      expect(stats.fileCount).toBe(0);
    });
  });
});