'use client';

import React from 'react';

type Theme = 'light' | 'dark';

class ThemeManager {
  private static instance: ThemeManager;
  private currentThemeValue: Theme = 'light';
  private listeners: ((theme: Theme) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTheme();
    }
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private initializeTheme(): void {
    // Read from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentThemeValue = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentThemeValue);
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Persist to localStorage
    localStorage.setItem('theme', theme);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(theme));
  }

  currentTheme(): Theme {
    return this.currentThemeValue;
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentThemeValue === 'light' ? 'dark' : 'light';
    this.currentThemeValue = newTheme;
    this.applyTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    if (theme !== this.currentThemeValue) {
      this.currentThemeValue = theme;
      this.applyTheme(theme);
    }
  }

  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getThemeIcon(): string {
    return this.currentThemeValue === 'light' ? '☀️' : '🌙';
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Export hook for React components
export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(themeManager.currentTheme());
  
  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe(setTheme);
    return unsubscribe;
  }, []);
  
  return {
    theme,
    toggleTheme: () => themeManager.toggleTheme(),
    setTheme: (newTheme: Theme) => themeManager.setTheme(newTheme),
    themeIcon: themeManager.getThemeIcon()
  };
}

// For non-React usage
export { type Theme };