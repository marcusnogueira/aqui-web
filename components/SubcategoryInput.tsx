'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSubcategories, getSubcategoriesForBusinessType } from '@/lib/business-types';

interface SubcategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  businessType?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SubcategoryInput({
  value,
  onChange,
  businessType,
  placeholder = "e.g., Street Tacos, Vintage, Zines",
  className = "",
  id
}: SubcategoryInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSubcategories = async () => {
      if (businessType) {
        try {
          const subcategories = await getSubcategoriesForBusinessType(businessType);
          setSuggestions(subcategories);
        } catch (error) {
          console.error('Error loading subcategories:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    
    loadSubcategories();
  }, [businessType]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    try {
      if (inputValue.trim()) {
        const filteredSuggestions = await searchSubcategories(inputValue, businessType);
        setSuggestions(filteredSuggestions.slice(0, 8)); // Limit to 8 suggestions
        setShowSuggestions(true);
      } else {
        if (businessType) {
          const subcategories = await getSubcategoriesForBusinessType(businessType);
          setSuggestions(subcategories.slice(0, 8));
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Error searching subcategories:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  };

  const handleInputFocus = async () => {
    if (businessType) {
      try {
        const subcategories = value.trim() 
          ? await searchSubcategories(value, businessType)
          : await getSubcategoriesForBusinessType(businessType);
        setSuggestions(subcategories.slice(0, 8));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error loading subcategories on focus:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-2 text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`w-full px-4 py-2 text-left text-foreground hover:bg-muted focus:bg-muted focus:outline-none ${
              index === highlightedIndex ? 'bg-muted' : ''
            }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
          
          {businessType && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              Suggestions for {businessType} • Type to search or enter custom
            </div>
          )}
        </div>
      )}
    </div>
  );
}