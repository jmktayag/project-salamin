/**
 * Input sanitization utilities for XSS protection and data cleaning
 */

// Basic HTML entity encoding
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'/]/g, (match) => htmlEntities[match] || match);
}

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for text fields (bio, display name, etc.)
 */
export function sanitizeText(input: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowSpecialChars?: boolean;
} = {}): string {
  if (typeof input !== 'string') return '';

  const {
    maxLength = 1000,
    allowNewlines = true,
    allowSpecialChars = true
  } = options;

  let sanitized = input;

  // Remove null bytes and other control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Remove potentially dangerous characters if not allowed
  if (!allowSpecialChars) {
    // eslint-disable-next-line no-useless-escape
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
  } else {
    // Escape HTML entities
    sanitized = escapeHtml(sanitized);
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove whitespace and convert to lowercase
  let sanitized = input.trim().toLowerCase();
  
  // Remove any characters that aren't valid in email addresses
  sanitized = sanitized.replace(/[^a-z0-9@._-]/g, '');
  
  return sanitized;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerInput = sanitized.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerInput.startsWith(protocol)) {
      return '';
    }
  }
  
  // If no protocol specified, assume https
  if (sanitized && !sanitized.match(/^https?:\/\//i)) {
    sanitized = 'https://' + sanitized;
  }
  
  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, options: {
  min?: number;
  max?: number;
  allowFloat?: boolean;
} = {}): number | null {
  const { min, max, allowFloat = false } = options;
  
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  let num = Number(input);
  
  if (isNaN(num)) {
    return null;
  }
  
  // Round to integer if float not allowed
  if (!allowFloat) {
    num = Math.round(num);
  }
  
  // Apply min/max constraints
  if (typeof min === 'number' && num < min) {
    num = min;
  }
  
  if (typeof max === 'number' && num > max) {
    num = max;
  }
  
  return num;
}

/**
 * Sanitize array input (for multi-select fields)
 */
export function sanitizeArray(input: any, options: {
  maxItems?: number;
  allowedValues?: string[];
  sanitizeItems?: boolean;
} = {}): string[] {
  const { maxItems = 50, allowedValues, sanitizeItems = true } = options;
  
  if (!Array.isArray(input)) {
    return [];
  }
  
  let sanitized = input
    .filter(item => typeof item === 'string' && item.trim() !== '')
    .map(item => sanitizeItems ? sanitizeText(item.trim()) : item.trim());
  
  // Filter by allowed values if specified
  if (allowedValues) {
    sanitized = sanitized.filter(item => allowedValues.includes(item));
  }
  
  // Remove duplicates
  sanitized = Array.from(new Set(sanitized));
  
  // Apply max items limit
  if (sanitized.length > maxItems) {
    sanitized = sanitized.slice(0, maxItems);
  }
  
  return sanitized;
}

/**
 * Sanitize profile data before saving
 */
export function sanitizeProfileData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case 'displayName':
        sanitized[key] = sanitizeText(value, { maxLength: 50, allowNewlines: false });
        break;
        
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
        
      case 'bio':
        sanitized[key] = sanitizeText(value, { maxLength: 500, allowNewlines: true });
        break;
        
      case 'pronouns':
        sanitized[key] = sanitizeText(value, { maxLength: 20, allowNewlines: false });
        break;
        
      case 'currentRole':
        sanitized[key] = sanitizeText(value, { maxLength: 100, allowNewlines: false });
        break;
        
      case 'yearsOfExperience':
        sanitized[key] = sanitizeNumber(value, { min: 0, max: 50 });
        break;
        
      case 'sessionLengthPreference':
        sanitized[key] = sanitizeNumber(value, { min: 5, max: 120 });
        break;
        
      case 'industry':
      case 'targetRoles':
      case 'targetCompanies':
      case 'preferredInterviewTypes':
        sanitized[key] = sanitizeArray(value, { maxItems: 10 });
        break;
        
      case 'timeZone':
        sanitized[key] = sanitizeText(value, { maxLength: 50, allowNewlines: false, allowSpecialChars: false });
        break;
        
      case 'photoURL':
        sanitized[key] = value ? sanitizeUrl(value) : null;
        break;
        
      default:
        // For other fields, apply basic sanitization
        if (typeof value === 'string') {
          sanitized[key] = sanitizeText(value);
        } else {
          sanitized[key] = value;
        }
    }
  }
  
  return sanitized;
}

/**
 * Content filtering for inappropriate content
 */
const inappropriateWords: string[] = [
  // Add your inappropriate words list here
  // This is a basic example - in production, you'd want a more comprehensive list
];

export function containsInappropriateContent(text: string): boolean {
  if (typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word.toLowerCase()));
}

/**
 * Rate limiting helper for client-side throttling
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove attempts outside the time window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  getRemainingAttempts(key: string): number {
    const attempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }
  
  getTimeUntilReset(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}