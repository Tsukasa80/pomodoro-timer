export type TimerMode = 'pomodoro' | 'short-break' | 'long-break';

export interface TimerSettings {
  pomodoro: number; // minutes
  shortBreak: number; // minutes
  longBreak: number; // minutes
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
  longBreakInterval: number; // after how many pomodoros
  enableLongBreak: boolean; // whether to use long breaks
  // Notification settings
  enableSound: boolean;
  enableVibration: boolean;
  enableBrowserNotification: boolean;
  soundVolume: number; // 0-100
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  estimatedPomodoros: number;
  actualPomodoros: number;
  createdAt: Date;
  completedAt?: Date;
  // Task-specific timer settings
  customSettings?: {
    pomodoroMinutes?: number;
    shortBreakMinutes?: number;
    longBreakMinutes?: number;
    autoStartBreak?: boolean;
    autoStartPomodoro?: boolean;
  };
}

export interface PomodoroSession {
  id: string;
  mode: TimerMode;
  duration: number; // minutes
  completed: boolean;
  todoId?: string;
  startTime: Date;
  endTime?: Date;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  completedPomodoros: number;
  totalMinutes: number;
  completedTodos: number;
  sessions: PomodoroSession[];
}

export interface AppState {
  // Timer State
  currentMode: TimerMode;
  timeLeft: number; // seconds
  isRunning: boolean;
  completedPomodoros: number;
  settings: TimerSettings;
  
  // Todo State  
  todos: Todo[];
  activeTodoId: string | null;
  
  // Report State
  dailyReports: Record<string, DailyReport>; // date -> report
  
  // UI State
  showSettings: boolean;
  currentView: 'timer' | 'reports';
}