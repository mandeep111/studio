
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Badge } from "./badge";
import { X } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "./command";
import { getTags } from "@/lib/firestore";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({ value, onChange, placeholder, disabled }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTags() {
      const tags = await getTags();
      setAllTags(tags);
    }
    fetchTags();
  }, []);

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
  
  const updateSuggestions = (text: string) => {
    if(text) {
        const lowerCaseValue = value.map(t => t.toLowerCase());
        const filteredSuggestions = allTags
            .filter(tag => tag.toLowerCase().includes(text.toLowerCase()))
            .filter(tag => !lowerCaseValue.includes(tag.toLowerCase()))
            .slice(0, 5); // Limit suggestions
        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
        setActiveIndex(filteredSuggestions.length > 0 ? 0 : -1); // Auto-select the first suggestion
    } else {
        setShowSuggestions(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    updateSuggestions(newValue);
  };

  const addTag = (tagToAdd: string) => {
    const newTag = tagToAdd.trim();
    if (newTag && !value.some(tag => tag.toLowerCase() === newTag.toLowerCase())) {
        onChange([...value, newTag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setActiveIndex(-1);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex > -1 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }
  };
  
  const addSuggestion = (tag: string) => {
    addTag(tag);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };
  
  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 rounded-md border border-input p-1">
        {value.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => updateSuggestions(inputValue)}
          placeholder={placeholder || "Add tags..."}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 p-1 h-8"
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
         <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <Command>
              <CommandList>
                <CommandGroup>
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => addSuggestion(suggestion)}
                      className={cn("cursor-pointer", activeIndex === index && "bg-accent aria-selected:bg-accent")}
                      onMouseEnter={() => setActiveIndex(index)}
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
