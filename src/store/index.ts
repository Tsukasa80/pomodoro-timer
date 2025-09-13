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
  // Debug Info
  debugInfo: string[];
  addDebugInfo: (info: string) => void;
  clearDebugInfo: () => void;
  
  // Migration Info
  migrationInfo: string | null;
  clearMigrationInfo: () => void;
  
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

// データバージョン管理
const CURRENT_DATA_VERSION = "2.0.0"; // バグ修正後のバージョン
const DATA_VERSION_KEY = "pomodoro-data-version";

// マイグレーション関数
const migrateData = (storedData: any, setMigrationInfo: (info: string) => void): any => {
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY) || "1.0.0";
  
  console.log(`🔄 データマイグレーション: ${storedVersion} → ${CURRENT_DATA_VERSION}`);
  
  // バージョン1.0.0からの移行（バグ修正前のデータ）
  if (storedVersion === "1.0.0") {
    console.log("📦 バグ修正前のデータを検出 - 設定をリセットして最新版に移行");
    
    const migrationMessage = "🔄 データをバグ修正版に更新しました！タイマー設定が最新版にリセットされ、無限ループ問題が解決されています。";
    setMigrationInfo(migrationMessage);
    
    // 重要なデータは保持、問題のある設定はリセット
    const migratedData = {
      ...storedData,
      settings: { ...defaultSettings }, // 設定は最新版にリセット
      // todos と dailyReports は保持
      completedPomodoros: storedData.completedPomodoros || 0,
      migrationInfo: migrationMessage,
    };
    
    // バージョン更新
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    
    return migratedData;
  }
  
  // 既に最新バージョンの場合はそのまま
  if (storedVersion === CURRENT_DATA_VERSION) {
    return storedData;
  }
  
  // その他のバージョンは安全のため設定リセット
  console.log("⚠️ 不明なバージョンのデータ - 安全のため設定をリセット");
  
  const migrationMessage = "⚠️ データを最新版に更新しました。安全のため設定をリセットしています。";
  setMigrationInfo(migrationMessage);
  
  localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
  
  return {
    ...storedData,
    settings: { ...defaultSettings },
    migrationInfo: migrationMessage,
  };
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
      debugInfo: [`${new Date().toLocaleTimeString()}: アプリ初期化完了`],
      migrationInfo: null,
      
      // Debug Actions
      addDebugInfo: (info: string) => {
        const timestamp = new Date().toLocaleTimeString();
        set(state => ({
          debugInfo: [...state.debugInfo.slice(-9), `${timestamp}: ${info}`] // 最新10件のみ保持
        }));
      },
      
      clearDebugInfo: () => {
        set({ debugInfo: [] });
      },
      
      // Migration Actions
      clearMigrationInfo: () => {
        set({ migrationInfo: null });
      },
      
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
        
        get().addDebugInfo(`モード変更: ${mode} (${duration}分)`);
        updateDocumentTitle(mode, duration * 60);
      },
      
      startTimer: () => {
        const state = get();
        
        // 時間が0の場合は、現在のモードの時間をリセットしてから開始
        if (state.timeLeft <= 0) {
          const duration = state.currentMode === 'pomodoro' 
            ? state.settings.pomodoro 
            : state.currentMode === 'short-break' 
            ? state.settings.shortBreak 
            : state.settings.longBreak;
          
          get().addDebugInfo(`タイマー時間リセット: ${duration}分`);
          set({ timeLeft: duration * 60 });
        }
        
        set({ isRunning: true });
        get().addDebugInfo('タイマー開始！');
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
        // 最新の状態を再確認（Zustandの状態更新遅延対策）
        const currentState = get();
        if (!currentState.isRunning) {
          get().addDebugInfo('tick: タイマー停止中のため処理スキップ');
          return;
        }
        
        get().addDebugInfo(`tick: isRunning=${currentState.isRunning}, timeLeft=${currentState.timeLeft}`);
        
        // timeLeft=0の場合は即座に処理を停止
        if (currentState.timeLeft <= 0) {
          get().addDebugInfo('⚠️ 緊急停止: timeLeft=0でtick実行 → 強制停止');
          set({ isRunning: false, timeLeft: 0 });
          
          // completeSessionは一度だけ実行する仕組み
          const hasAlreadyCompleted = window.sessionStorage.getItem('session-completing');
          if (!hasAlreadyCompleted) {
            window.sessionStorage.setItem('session-completing', 'true');
            setTimeout(() => {
              get().completeSession();
              window.sessionStorage.removeItem('session-completing');
            }, 100);
          }
          return;
        }
        
        // 正常なtick処理
        if (currentState.timeLeft > 0) {
          const newTimeLeft = currentState.timeLeft - 1;
          set({ timeLeft: newTimeLeft });
          updateDocumentTitle(currentState.currentMode, newTimeLeft);
          
          // タイマー終了のデバッグ
          if (newTimeLeft <= 5) {
            get().addDebugInfo(`タイマー残り${newTimeLeft}秒`);
          }
          
          if (newTimeLeft === 0) {
            get().addDebugInfo('タイマー終了！セッション完了処理開始');
            set({ isRunning: false });
            
            // completeSessionの重複実行を防ぐ
            const hasAlreadyCompleted = window.sessionStorage.getItem('session-completing');
            if (!hasAlreadyCompleted) {
              window.sessionStorage.setItem('session-completing', 'true');
              setTimeout(() => {
                get().completeSession();
                window.sessionStorage.removeItem('session-completing');
              }, 100);
            }
          }
        }
      },
      
      setTimeLeft: (timeLeft: number) => {
        set({ timeLeft });
        const state = get();
        updateDocumentTitle(state.currentMode, timeLeft);
        
        // デバッグ情報
        if (timeLeft <= 5) {
          console.log(`🔍 DEBUG: setTimeLeft - 残り${timeLeft}秒, isRunning=${state.isRunning}`);
        }
        
        // タイマー終了時は自動的にcompleteSessionを呼ぶ
        if (timeLeft === 0 && state.isRunning) {
          console.log('🔍 DEBUG: setTimeLeft処理でcompleteSession呼び出し');
          alert('🔍 DEBUG: setTimeLeft処理でタイマー終了！completeSession呼び出し');
          get().completeSession();
        }
      },
      
      completeSession: () => {
        const state = get();
        
        get().addDebugInfo('セッション完了！自動開始判定開始');
        
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
            get().addDebugInfo(`休憩自動開始実行: ${nextMode}`);
            
            // モード変更
            get().setMode(nextMode);
            
            // 直接タイマー開始
            get().addDebugInfo('startTimer()実行');
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
        // debugInfoは永続化しない
      }),
      onRehydrateStorage: () => {
        console.log('🔄 データ復元開始 - バージョンチェック実行');
        
        // 初回実行時にバージョンを設定
        if (!localStorage.getItem(DATA_VERSION_KEY)) {
          console.log('🆕 初回実行 - データバージョンを設定');
          localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
        }
        
        return (state, error) => {
          if (error) {
            console.error('❌ データ復元エラー:', error);
            // エラー時は最新バージョンに設定
            localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
            return;
          }
          
          if (state) {
            console.log('✅ データ復元完了 - マイグレーション確認');
            
            // マイグレーション実行
            const setMigrationInfo = (info: string) => {
              // ストアの更新は次のtickで実行
              setTimeout(() => {
                useAppStore.setState({ migrationInfo: info });
              }, 100);
            };
            
            const migratedState = migrateData(state, setMigrationInfo);
            
            // マイグレーションが発生した場合は状態更新
            if (migratedState !== state) {
              console.log('🔄 マイグレーション実行 - 状態更新');
              // 必要に応じてストアを更新
              Object.assign(state, migratedState);
            }
          }
        };
      },
    }
  )
);