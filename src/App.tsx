import { useEffect } from 'react';
import { FaChartLine, FaClock } from 'react-icons/fa';
import { useAppStore } from './store';
import Timer from './components/Timer';
import TodoList from './components/TodoList';
import SettingsModal from './components/SettingsModal';
import ReportView from './components/ReportView';
import { enableVibrationOnUserAction } from './utils/notifications';

function App() {
  const { currentView, setCurrentView } = useAppStore();

  // アプリ初期化時にユーザーアクションでバイブレーションAPIを活性化
  useEffect(() => {
    const handleFirstUserAction = () => {
      enableVibrationOnUserAction();
      console.log('👆 初回ユーザーアクションでバイブレーションAPI活性化');
      
      // 一度実行したら削除
      document.removeEventListener('click', handleFirstUserAction);
      document.removeEventListener('touch', handleFirstUserAction);
    };

    document.addEventListener('click', handleFirstUserAction);
    document.addEventListener('touchstart', handleFirstUserAction);

    return () => {
      document.removeEventListener('click', handleFirstUserAction);
      document.removeEventListener('touchstart', handleFirstUserAction);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Navigation */}
        <nav className="flex justify-center mb-8">
          <div className="bg-white rounded-full shadow-lg p-1">
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentView('timer')}
                className={`flex items-center px-6 py-3 rounded-full font-medium transition-all ${
                  currentView === 'timer'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <FaClock className="mr-2" />
                タイマー
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`flex items-center px-6 py-3 rounded-full font-medium transition-all ${
                  currentView === 'reports'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <FaChartLine className="mr-2" />
                レポート
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

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-4">
        <div>
          🍅 ポモドーロテクニックで生産性を向上させましょう！
        </div>
      </footer>
    </div>
  );
}

export default App;