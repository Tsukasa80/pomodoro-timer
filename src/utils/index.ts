import type { TimerMode } from '../types';

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getTimerModeLabel = (mode: TimerMode): string => {
  switch (mode) {
    case 'pomodoro':
      return 'ポモドーロ';
    case 'short-break':
      return '短い休憩';
    case 'long-break':
      return '長い休憩';
    default:
      return '';
  }
};

export const getTimerModeColor = (mode: TimerMode): string => {
  switch (mode) {
    case 'pomodoro':
      return 'bg-red-500';
    case 'short-break':
      return 'bg-green-500';
    case 'long-break':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const updateDocumentTitle = (mode: TimerMode, timeLeft: number): void => {
  const timeString = formatTime(timeLeft);
  const modeLabel = getTimerModeLabel(mode);
  document.title = `${timeString} - ${modeLabel}`;
};