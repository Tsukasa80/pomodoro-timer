import { useEffect } from 'react';
import { FaChartLine, FaClock } from 'react-icons/fa';
import { useAppStore } from './store';
import Timer from './components/Timer';
import TodoList from './components/TodoList';
import SettingsModal from './components/SettingsModal';
import ReportView from './components/ReportView';

function App() {
  const { currentView, setCurrentView } = useAppStore();

  // アプリ初期化時にユーザーアクションを記録
  useEffect(() => {
    const handleUserAction = () => {
      // セッションストレージにユーザーアクションを記録
      window.sessionStorage.setItem('pomodoro-user-gesture', 'true');
      console.log('👆 ユーザーアクションを記録（自動開始機能有効化）');
    };

    // より多くのイベントを監視（スマホ対応）
    const events = ['click', 'touchstart', 'touchend', 'keydown', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserAction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserAction);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 via-yellow-50 to-pink-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-red-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-64 h-64 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-25 animate-pulse"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-12">
          {/* Header Navigation */}
          <nav className="flex justify-center mb-12">
            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-3xl shadow-2xl p-2 border border-white border-opacity-30">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('timer')}
                  className={`flex items-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    currentView === 'timer'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl transform scale-105'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:scale-102'
                  }`}
                >
                  <FaClock className="mr-3" size={20} />
                  🍅 タイマー
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`flex items-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    currentView === 'reports'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl transform scale-105'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:scale-102'
                  }`}
                >
                  <FaChartLine className="mr-3" size={20} />
                  📊 レポート
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            {currentView === 'timer' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timer Section */}
                <div className="order-1 lg:order-1">
                  <Timer />
                </div>
                
                {/* Todo Section */}
                <div className="order-2 lg:order-2">
                  <TodoList />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <ReportView />
              </div>
            )}
          </div>

          {/* Settings Modal */}
          <SettingsModal />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8">
        <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl mx-auto max-w-md p-4 shadow-lg border border-white border-opacity-30">
          <div className="text-gray-700 font-medium text-lg">
            🍅✨ ポモドーロテクニックで生産性を向上させましょう！ ✨🍅
          </div>
          <div className="text-gray-500 text-sm mt-2">
            集中して、休憩して、成長しましょう 🚀
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;