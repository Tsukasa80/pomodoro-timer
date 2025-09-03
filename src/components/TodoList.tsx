import React, { useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaPlay, FaStop, FaCog, FaClock } from 'react-icons/fa';
import { useAppStore } from '../store';
import type { Todo } from '../types';

const TodoList: React.FC = () => {
  const {
    todos,
    activeTodoId,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    setActiveTodo,
    startPomodoroForTask,
  } = useAppStore();

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPomodoros, setNewTodoPomodoros] = useState(1);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPomodoros, setEditPomodoros] = useState(1);
  
  // Task-specific timer settings
  const [showCustomSettings, setShowCustomSettings] = useState<string | null>(null);
  const [customPomodoro, setCustomPomodoro] = useState(25);
  const [customShortBreak, setCustomShortBreak] = useState(5);
  const [customLongBreak, setCustomLongBreak] = useState(15);
  const [customAutoStartBreak, setCustomAutoStartBreak] = useState(true);
  const [customAutoStartPomodoro, setCustomAutoStartPomodoro] = useState(true);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      addTodo(newTodoTitle.trim(), newTodoPomodoros);
      setNewTodoTitle('');
      setNewTodoPomodoros(1);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditTitle(todo.title);
    setEditPomodoros(todo.estimatedPomodoros);
  };

  const handleSaveEdit = () => {
    if (editingTodoId && editTitle.trim()) {
      updateTodo(editingTodoId, {
        title: editTitle.trim(),
        estimatedPomodoros: editPomodoros,
      });
      setEditingTodoId(null);
      setEditTitle('');
      setEditPomodoros(1);
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditTitle('');
    setEditPomodoros(1);
  };

  const handleToggleActive = (todoId: string) => {
    if (activeTodoId === todoId) {
      // Deactivate the current task
      setActiveTodo(null);
    } else {
      // Start pomodoro for the selected task
      startPomodoroForTask(todoId);
    }
  };

  const handleShowCustomSettings = (todo: Todo) => {
    setShowCustomSettings(todo.id);
    // Load existing custom settings if any
    if (todo.customSettings) {
      setCustomPomodoro(todo.customSettings.pomodoroMinutes || 25);
      setCustomShortBreak(todo.customSettings.shortBreakMinutes || 5);
      setCustomLongBreak(todo.customSettings.longBreakMinutes || 15);
      setCustomAutoStartBreak(todo.customSettings.autoStartBreak ?? true);
      setCustomAutoStartPomodoro(todo.customSettings.autoStartPomodoro ?? true);
    } else {
      // Reset to defaults
      setCustomPomodoro(25);
      setCustomShortBreak(5);
      setCustomLongBreak(15);
      setCustomAutoStartBreak(true);
      setCustomAutoStartPomodoro(true);
    }
  };

  const handleSaveCustomSettings = (todoId: string) => {
    updateTodo(todoId, {
      customSettings: {
        pomodoroMinutes: customPomodoro,
        shortBreakMinutes: customShortBreak,
        longBreakMinutes: customLongBreak,
        autoStartBreak: customAutoStartBreak,
        autoStartPomodoro: customAutoStartPomodoro,
      }
    });
    setShowCustomSettings(null);
  };

  const handleClearCustomSettings = (todoId: string) => {
    updateTodo(todoId, {
      customSettings: undefined
    });
    setShowCustomSettings(null);
  };

  const activeTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">タスク管理</h2>
      
      {/* Add New Todo Form */}
      <form onSubmit={handleAddTodo} className="mb-6">
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            required
          />
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                見積もりポモドーロ数
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={newTodoPomodoros}
                onChange={(e) => setNewTodoPomodoros(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                追加
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Active Todos */}
      {activeTodos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            アクティブなタスク ({activeTodos.length})
          </h3>
          <div className="space-y-2">
            {activeTodos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 border rounded-lg transition-all ${
                  activeTodoId === todo.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {editingTodoId === todo.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">ポモドーロ数:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={editPomodoros}
                          onChange={(e) => setEditPomodoros(parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodoComplete(todo.id)}
                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 flex items-center">
                          {todo.title}
                          {todo.customSettings && (
                            <span className="ml-2 text-purple-500" title="カスタムタイマー設定あり">
                              <FaClock className="text-xs" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          見積もり: {todo.estimatedPomodoros} ポモドーロ
                          {todo.actualPomodoros > 0 && (
                            <span className="ml-2 text-green-600">
                              完了: {todo.actualPomodoros}
                            </span>
                          )}
                          {todo.customSettings && (
                            <span className="ml-2 text-purple-600 text-xs">
                              🕐 {todo.customSettings.pomodoroMinutes || 25}分設定
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleToggleActive(todo.id)}
                        className={`p-2 rounded transition-colors ${
                          activeTodoId === todo.id
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={activeTodoId === todo.id 
                          ? 'ポモドーロを停止' 
                          : 'このタスクでポモドーロを開始'
                        }
                      >
                        {activeTodoId === todo.id ? <FaStop /> : <FaPlay />}
                      </button>
                      <button
                        onClick={() => handleShowCustomSettings(todo)}
                        className={`p-2 rounded transition-colors ${
                          todo.customSettings
                            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="タイマー設定"
                      >
                        <FaClock />
                      </button>
                      <button
                        onClick={() => handleStartEdit(todo)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="編集"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="削除"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Custom Timer Settings Panel */}
                {showCustomSettings === todo.id && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-purple-800 flex items-center">
                        <FaClock className="mr-2" />
                        このタスク専用のタイマー設定
                      </h4>
                      <button
                        onClick={() => setShowCustomSettings(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ポモドーロ時間（分）
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={customPomodoro}
                          onChange={(e) => setCustomPomodoro(parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          短い休憩（分）
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={customShortBreak}
                          onChange={(e) => setCustomShortBreak(parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          長い休憩（分）
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={customLongBreak}
                          onChange={(e) => setCustomLongBreak(parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={customAutoStartBreak}
                          onChange={(e) => setCustomAutoStartBreak(e.target.checked)}
                          className="mr-2 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                        />
                        休憩を自動開始
                      </label>
                      <label className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={customAutoStartPomodoro}
                          onChange={(e) => setCustomAutoStartPomodoro(e.target.checked)}
                          className="mr-2 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                        />
                        ポモドーロを自動開始
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveCustomSettings(todo.id)}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => handleClearCustomSettings(todo.id)}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        デフォルトに戻す
                      </button>
                      <button
                        onClick={() => setShowCustomSettings(null)}
                        className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            完了したタスク ({completedTodos.length})
          </h3>
          <div className="space-y-2">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodoComplete(todo.id)}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-600 line-through">
                        {todo.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        見積もり: {todo.estimatedPomodoros} → 実際: {todo.actualPomodoros} ポモドーロ
                        {todo.completedAt && (
                          <span className="ml-2">
                            完了: {new Date(todo.completedAt).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    title="削除"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <div className="text-lg font-medium mb-2">タスクがありません</div>
          <div className="text-sm">新しいタスクを追加してポモドーロを始めましょう！</div>
        </div>
      )}

      {/* Active Todo Indicator */}
      {activeTodoId && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-sm font-medium text-red-800">
            🎯 現在のタスク: {todos.find(t => t.id === activeTodoId)?.title}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;