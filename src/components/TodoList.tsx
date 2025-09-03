import React, { useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaPlay, FaStop } from 'react-icons/fa';
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
                        <div className="font-medium text-gray-800">{todo.title}</div>
                        <div className="text-sm text-gray-600">
                          見積もり: {todo.estimatedPomodoros} ポモドーロ
                          {todo.actualPomodoros > 0 && (
                            <span className="ml-2 text-green-600">
                              完了: {todo.actualPomodoros}
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