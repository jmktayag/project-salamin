'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions: string[];
  maxSuggestions?: number;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export default function AutocompleteInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  suggestions,
  maxSuggestions = 8,
  debounceMs = 300,
  className = '',
  disabled = false,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce the input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  // Filter suggestions based on debounced input
  const filteredSuggestions = useMemo(() => {
    if (!debouncedValue.trim()) {
      return [];
    }

    const normalizedQuery = debouncedValue.toLowerCase().trim();
    
    // First, find exact matches at the beginning
    const startsWithMatches = suggestions.filter(suggestion => 
      suggestion.toLowerCase().startsWith(normalizedQuery)
    );

    // Then, find matches that contain the query
    const containsMatches = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(normalizedQuery) && 
      !suggestion.toLowerCase().startsWith(normalizedQuery)
    );

    // Combine and limit results
    return [...startsWithMatches, ...containsMatches].slice(0, maxSuggestions);
  }, [debouncedValue, suggestions, maxSuggestions]);

  // Show dropdown when there are suggestions and input is focused
  useEffect(() => {
    const shouldShow = filteredSuggestions.length > 0 && document.activeElement === inputRef.current;
    setIsOpen(shouldShow);
    
    if (!shouldShow) {
      setHighlightedIndex(-1);
    }
  }, [filteredSuggestions.length]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    if (filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  }, [filteredSuggestions.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      onBlur?.();
    }, 150);
  }, [onBlur]);

  const selectSuggestion = useCallback((suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          selectSuggestion(filteredSuggestions[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, filteredSuggestions, highlightedIndex, selectSuggestion]);

  const dropdownId = `${id || 'autocomplete'}-dropdown`;
  const hasError = className.includes('border-red');

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`${className} pr-10`}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? dropdownId : undefined}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 
              ? `${dropdownId}-option-${highlightedIndex}`
              : undefined
          }
          autoComplete="off"
          role="combobox"
        />
        
        {/* Dropdown indicator */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${hasError ? 'text-red-400' : 'text-gray-400'}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id={dropdownId}
          className="absolute gi-autocomplete-dropdown w-full mt-1 max-h-60 overflow-auto"
          role="listbox"
          aria-label="Job position suggestions"
        >
          <ul ref={listRef} className="py-2">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`${dropdownId}-option-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`gi-autocomplete-option flex items-center justify-between ${
                  index === highlightedIndex ? '' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="truncate gi-text-primary">{suggestion}</span>
                {value === suggestion && (
                  <Check className="w-4 h-4 text-teal-600 ml-2 flex-shrink-0" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}