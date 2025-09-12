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
    enableLongBreak?: boolean;
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

// GritTracker Types
export interface GritLog {
  id: string;
  date: string; // YYYY-MM-DD format
  taskName: string;
  difficultyScore: number; // 1-10
  enduredTime: number; // minutes
  enduranceScore: number; // difficultyScore * enduredTime
  details?: string;
  wasSuccessful?: boolean;
  createdAt: Date;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD format (Monday)
  weekEndDate: string; // YYYY-MM-DD format (Sunday)
  bestOfWeek: string[]; // Array of GritLog IDs
  reflections: {
    emotions: string; // 今週、どんな感情と闘ったか？
    results: string; // 粘った後、どんなことが起きたか？
    messageToSelf: string; // 「粘った過去の自分」に、今どう言いたいか？
  };
  createdAt: Date;
}

export interface RewardSetting {
  id: string;
  targetScore: number;
  rewardContent: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
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
  
  // Debug State
  debugInfo: string[];
}