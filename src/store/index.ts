import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, TimerMode, Todo, PomodoroSession, DailyReport } from '../types';
import { 
  generateId, 
  formatDate, 
  updateDocumentTitle,
  triggerAllNotifications,
  requestNotificationPermission
} from '../utils';

interface AppStore extends AppState {
  // Timer Actions
  setMode: (mode: TimerMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setTimeLeft: (timeLeft: number) => void;
  completeSession: () => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  toggleSettings: () => void;
  resetSettings: () => void;
  
  // Todo Actions
  addTodo: (title: string, estimatedPomodoros: number) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;
  setActiveTodo: (id: string | null) => void;
  startPomodoroForTask: (todoId: string) => void;
  
  // Report Actions
  addSession: (session: PomodoroSession) => void;
  
  // UI Actions
  setCurrentView: (view: 'timer' | 'reports') => void;
  
  // Utility Actions
  loadPersistedData: () => void;
  savePersistedData: () => void;
  
  // Notification Actions
  requestNotificationPermission: () => Promise<void>;
}

const defaultSettings = {
  pomodoro: 25, // 25 minutes (standard pomodoro)
  shortBreak: 5, // 5 minutes (standard short break)
  longBreak: 15, // 15 minutes (standard long break)
  autoStartBreak: true,
  autoStartPomodoro: true,
  longBreakInterval: 4, // 4 pomodoros (standard)
  enableLongBreak: false, // デフォルトは短い休憩のみ
  // Notification settings
  enableSound: true,
  enableBrowserNotification: true,
  soundVolume: 80,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentMode: 'pomodoro',
      timeLeft: 25 * 60, // 25 minutes in seconds
      isRunning: false,
      completedPomodoros: 0,
      settings: defaultSettings,
      todos: [],
      activeTodoId: null,
      dailyReports: {},
      showSettings: false,
      currentView: 'timer',
      
      // Timer Actions
      setMode: (mode) => {
        const state = get();
        const duration = mode === 'pomodoro' 
          ? state.settings.pomodoro 
          : mode === 'short-break' 
          ? state.settings.shortBreak 
          : state.settings.longBreak;
          
        set({ 
          currentMode: mode, 
          timeLeft: duration * 60,
          isRunning: false 
        });
        
        updateDocumentTitle(mode, duration * 60);
      },
      
      startTimer: () => {
        set({ isRunning: true });
      },
      
      pauseTimer: () => {
        set({ isRunning: false });
      },
      
      resetTimer: () => {
        const state = get();
        const duration = state.currentMode === 'pomodoro' 
          ? state.settings.pomodoro 
          : state.currentMode === 'short-break' 
          ? state.settings.shortBreak 
          : state.settings.longBreak;
          
        set({ 
          timeLeft: duration * 60,
          isRunning: false,
          completedPomodoros: 0
        });
        
        updateDocumentTitle(state.currentMode, duration * 60);
      },
      
      tick: () => {
        const state = get();
        if (state.isRunning && state.timeLeft > 0) {
          const newTimeLeft = state.timeLeft - 1;
          set({ timeLeft: newTimeLeft });
          updateDocumentTitle(state.currentMode, newTimeLeft);
          
          if (newTimeLeft === 0) {
            get().completeSession();
          }
        }
      },
      
      setTimeLeft: (timeLeft: number) => {
        set({ timeLeft });
        const state = get();
        updateDocumentTitle(state.currentMode, timeLeft);
        
        // タイマー終了時は自動的にcompleteSessionを呼ぶ
        if (timeLeft === 0 && state.isRunning) {
          get().completeSession();
        }
      },
      
      completeSession: () => {
        const state = get();
        
        const session: PomodoroSession = {
          id: generateId(),
          mode: state.currentMode,
          duration: state.currentMode === 'pomodoro' 
            ? state.settings.pomodoro 
            : state.currentMode === 'short-break' 
            ? state.settings.shortBreak 
            : state.settings.longBreak,
          completed: true,
          todoId: state.activeTodoId || undefined,
          startTime: new Date(Date.now() - (state.currentMode === 'pomodoro' 
            ? state.settings.pomodoro 
            : state.currentMode === 'short-break' 
            ? state.settings.shortBreak 
            : state.settings.longBreak) * 60 * 1000),
          endTime: new Date(),
        };
        
        get().addSession(session);
        
        // Trigger notifications
        triggerAllNotifications(state.currentMode, {
          enableSound: state.settings.enableSound,
          enableBrowserNotification: state.settings.enableBrowserNotification,
          soundVolume: state.settings.soundVolume
        });
        
        console.log('📱 セッション完了 - 自動開始判定開始');
        alert('🔍 DEBUG: セッション完了！自動開始判定開始');
        console.log('📱 現在の設定（詳細）:', {
          autoStartBreak: state.settings.autoStartBreak,
          autoStartPomodoro: state.settings.autoStartPomodoro,
          enableLongBreak: state.settings.enableLongBreak,
          currentMode: state.currentMode,
          completedPomodoros: state.completedPomodoros,
          settings: state.settings // 全設定値を表示
        });
        
        if (state.currentMode === 'pomodoro') {
          const newCompletedPomodoros = state.completedPomodoros + 1;
          set({ completedPomodoros: newCompletedPomodoros });
          
          // Update active todo
          if (state.activeTodoId) {
            const todo = state.todos.find(t => t.id === state.activeTodoId);
            if (todo) {
              get().updateTodo(state.activeTodoId, {
                actualPomodoros: todo.actualPomodoros + 1
              });
            }
          }
          
          // Auto-switch to break
          const shouldLongBreak = state.settings.enableLongBreak && (newCompletedPomodoros % state.settings.longBreakInterval === 0);
          const nextMode = shouldLongBreak ? 'long-break' : 'short-break';
          
          console.log(`📱 休憩判定: autoStartBreak=${state.settings.autoStartBreak}, nextMode=${nextMode}`);
          
          if (state.settings.autoStartBreak) {
            console.log(`📱 休憩自動開始を実行: ${nextMode}`);
            
            console.log('✅ 休憩自動開始を実行（スマホ判定なし）');
            alert(`🔍 DEBUG: 休憩自動開始実行中 - ${nextMode}`);
            // モード変更
            get().setMode(nextMode);
            
            // 直接タイマー開始
            console.log('🚀 直接タイマー開始');
            alert('🔍 DEBUG: startTimer()実行');
            get().startTimer();
          } else {
            console.log(`📱 休憩自動開始はOFF - 手動モードに設定: ${nextMode}`);
            get().setMode(nextMode);
          }
        } else {
          // Auto-switch back to pomodoro
          console.log(`📱 ポモドーロ判定: autoStartPomodoro=${state.settings.autoStartPomodoro}`);
          
          if (state.settings.autoStartPomodoro) {
            console.log('✅ ポモドーロ自動開始を実行（スマホ判定なし）');
            // モード変更
            get().setMode('pomodoro');
            
            // 直接タイマー開始
            console.log('🚀 ポモドーロ直接タイマー開始');
            get().startTimer();
          } else {
            console.log('📱 ポモドーロ自動開始はOFF - 手動モードに設定');
            get().setMode('pomodoro');
          }
        }
      },
      
      // Settings Actions
      updateSettings: (newSettings) => {
        const state = get();
        const updatedSettings = { ...state.settings, ...newSettings };
        set({ settings: updatedSettings });
        
        // Update timeLeft if timer is not running and mode duration changed
        if (!state.isRunning) {
          const duration = state.currentMode === 'pomodoro' 
            ? updatedSettings.pomodoro 
            : state.currentMode === 'short-break' 
            ? updatedSettings.shortBreak 
            : updatedSettings.longBreak;
          set({ timeLeft: duration * 60 });
          updateDocumentTitle(state.currentMode, duration * 60);
        }
      },
      
      toggleSettings: () => {
        set(state => ({ showSettings: !state.showSettings }));
      },
      
      resetSettings: () => {
        console.log('📱 設定をデフォルト値にリセット');
        console.log('📱 リセット前:', get().settings);
        set({ settings: { ...defaultSettings } });
        console.log('📱 リセット後:', get().settings);
      },
      
      // Todo Actions
      addTodo: (title, estimatedPomodoros) => {
        const newTodo: Todo = {
          id: generateId(),
          title,
          completed: false,
          estimatedPomodoros,
          actualPomodoros: 0,
          createdAt: new Date(),
        };
        set(state => ({ todos: [...state.todos, newTodo] }));
      },
      
      updateTodo: (id, updates) => {
        set(state => ({
          todos: state.todos.map(todo => 
            todo.id === id ? { ...todo, ...updates } : todo
          )
        }));
      },
      
      deleteTodo: (id) => {
        set(state => ({
          todos: state.todos.filter(todo => todo.id !== id),
          activeTodoId: state.activeTodoId === id ? null : state.activeTodoId
        }));
      },
      
      toggleTodoComplete: (id) => {
        const state = get();
        const todo = state.todos.find(t => t.id === id);
        if (todo) {
          get().updateTodo(id, {
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : undefined
          });
        }
      },
      
      setActiveTodo: (id) => {
        set({ activeTodoId: id });
      },

      startPomodoroForTask: (todoId) => {
        const state = get();
        const todo = state.todos.find(t => t.id === todoId);
        
        if (todo) {
          // Set the task as active
          set({ activeTodoId: todoId });
          
          // Apply custom task settings if they exist
          if (todo.customSettings) {
            const newSettings = {
              ...state.settings,
              ...(todo.customSettings.pomodoroMinutes && { pomodoro: todo.customSettings.pomodoroMinutes }),
              ...(todo.customSettings.shortBreakMinutes && { shortBreak: todo.customSettings.shortBreakMinutes }),
              ...(todo.customSettings.longBreakMinutes && { longBreak: todo.customSettings.longBreakMinutes }),
              ...(todo.customSettings.autoStartBreak !== undefined && { autoStartBreak: todo.customSettings.autoStartBreak }),
              ...(todo.customSettings.autoStartPomodoro !== undefined && { autoStartPomodoro: todo.customSettings.autoStartPomodoro }),
              ...(todo.customSettings.enableLongBreak !== undefined && { enableLongBreak: todo.customSettings.enableLongBreak }),
            };
            get().updateSettings(newSettings);
          }
          
          // Start pomodoro mode
          get().setMode('pomodoro');
          get().startTimer();
        }
      },
      
      // Report Actions
      addSession: (session) => {
        const dateKey = formatDate(session.startTime);
        set(state => {
          const currentReport = state.dailyReports[dateKey] || {
            date: dateKey,
            completedPomodoros: 0,
            totalMinutes: 0,
            completedTodos: 0,
            sessions: []
          };
          
          const updatedReport: DailyReport = {
            ...currentReport,
            completedPomodoros: session.mode === 'pomodoro' 
              ? currentReport.completedPomodoros + 1 
              : currentReport.completedPomodoros,
            totalMinutes: currentReport.totalMinutes + session.duration,
            sessions: [...currentReport.sessions, session]
          };
          
          return {
            dailyReports: {
              ...state.dailyReports,
              [dateKey]: updatedReport
            }
          };
        });
      },
      
      // UI Actions
      setCurrentView: (view) => {
        set({ currentView: view });
      },
      
      // Utility Actions
      loadPersistedData: () => {
        // This will be handled by zustand persist middleware
      },
      
      savePersistedData: () => {
        // This will be handled by zustand persist middleware
      },
      
      // Notification Actions
      requestNotificationPermission: async () => {
        await requestNotificationPermission();
      },
    }),
    {
      name: 'pomodoro-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        todos: state.todos,
        dailyReports: state.dailyReports,
        completedPomodoros: state.completedPomodoros,
      }),
    }
  )
);