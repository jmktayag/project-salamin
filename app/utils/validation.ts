export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FormValidator {
  private rules: Record<string, ValidationRule[]> = {};

  addRule(fieldName: string, rule: ValidationRule): void {
    if (!this.rules[fieldName]) {
      this.rules[fieldName] = [];
    }
    this.rules[fieldName].push(rule);
  }

  validateField(fieldName: string, value: any): ValidationResult {
    const fieldRules = this.rules[fieldName] || [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of fieldRules) {
      if (!rule.test(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateForm(formData: Record<string, any>): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};
    
    for (const fieldName in this.rules) {
      results[fieldName] = this.validateField(fieldName, formData[fieldName]);
    }

    return results;
  }

  isFormValid(formData: Record<string, any>): boolean {
    const results = this.validateForm(formData);
    return Object.values(results).every(result => result.isValid);
  }
}

// Validation rule factories
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      if (!value) return true; // Optional field
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  numberRange: (min: number, max: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message: message || `Must be between ${min} and ${max}`
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  noSpecialChars: (message = 'Special characters are not allowed'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const regex = /^[a-zA-Z0-9\s\-_.,!?]+$/;
      return regex.test(value);
    },
    message
  }),

  experienceRange: (message = 'Years of experience must be between 0 and 50'): ValidationRule => ({
    test: (value) => {
      if (value === null || value === undefined || value === '') return false; // Required field
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 50;
    },
    message
  }),

  sessionLength: (message = 'Session length must be between 5 and 120 minutes'): ValidationRule => ({
    test: (value) => {
      if (!value) return true; // Optional field
      const num = Number(value);
      return !isNaN(num) && num >= 5 && num <= 120;
    },
    message
  }),

  arrayNotEmpty: (message = 'Please select at least one option'): ValidationRule => ({
    test: (value) => Array.isArray(value) && value.length > 0,
    message
  })
};

// Profile-specific validation setup
export function createProfileValidator(): FormValidator {
  const validator = new FormValidator();

  // Personal Information
  validator.addRule('displayName', validationRules.required('Display name is required'));
  validator.addRule('displayName', validationRules.minLength(2, 'Display name must be at least 2 characters'));
  validator.addRule('displayName', validationRules.maxLength(50, 'Display name must be no more than 50 characters'));
  validator.addRule('displayName', validationRules.noSpecialChars('Display name contains invalid characters'));

  validator.addRule('email', validationRules.required('Email is required'));
  validator.addRule('email', validationRules.email());

  validator.addRule('bio', validationRules.maxLength(500, 'Bio must be no more than 500 characters'));

  validator.addRule('pronouns', validationRules.maxLength(20, 'Pronouns must be no more than 20 characters'));

  // Professional Information
  validator.addRule('yearsOfExperience', validationRules.experienceRange());

  validator.addRule('currentRole', validationRules.maxLength(100, 'Current role must be no more than 100 characters'));

  // Interview Preferences
  validator.addRule('sessionLengthPreference', validationRules.sessionLength());

  validator.addRule('timeZone', validationRules.maxLength(50, 'Time zone must be no more than 50 characters'));

  return validator;
}

// Real-time validation hook
import { useState, useCallback } from 'react';

export function useFormValidation(validator: FormValidator) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateField = useCallback((fieldName: string, value: any, showErrors = true) => {
    const result = validator.validateField(fieldName, value);
    
    if (showErrors || touchedFields.has(fieldName)) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: result.errors
      }));
      
      setValidationWarnings(prev => ({
        ...prev,
        [fieldName]: result.warnings
      }));
    }

    return result;
  }, [validator, touchedFields]);

  const markFieldTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(Array.from(prev).concat(fieldName)));
  }, []);

  const clearFieldErrors = useCallback((fieldName: string) => {
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
    
    setValidationWarnings(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  const validateForm = useCallback((formData: Record<string, any>) => {
    const results = validator.validateForm(formData);
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    for (const [fieldName, result] of Object.entries(results)) {
      if (result.errors.length > 0) {
        errors[fieldName] = result.errors;
      }
      if (result.warnings.length > 0) {
        warnings[fieldName] = result.warnings;
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    return validator.isFormValid(formData);
  }, [validator]);

  return {
    validationErrors,
    validationWarnings,
    validateField,
    validateForm,
    markFieldTouched,
    clearFieldErrors,
    hasErrors: Object.keys(validationErrors).length > 0
  };
}