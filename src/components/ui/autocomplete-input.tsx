
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Command, CommandGroup, CommandItem, CommandList } from "./command";

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
}

export function AutocompleteInput({ value, onChange, suggestions, placeholder, disabled, ...props }: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue) {
        const filtered = suggestions
            .filter(suggestion => suggestion.toLowerCase().includes(newValue.toLowerCase()))
            .slice(0, 5);
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    } else {
        setShowSuggestions(false);
    }
  };
  
  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
            if (inputValue) {
                const filtered = suggestions
                    .filter(suggestion => suggestion.toLowerCase().includes(inputValue.toLowerCase()))
                    .slice(0, 5);
                setShowSuggestions(filtered.length > 0);
            }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        {...props}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <Command>
              <CommandList>
                <CommandGroup>
                  {filteredSuggestions.map(suggestion => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => selectSuggestion(suggestion)}
                      className="cursor-pointer"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
      )}
    </div>
  );
}
