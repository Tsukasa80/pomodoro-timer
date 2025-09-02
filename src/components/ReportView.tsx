import React, { useMemo } from 'react';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTasks } from 'react-icons/fa';
import { useAppStore } from '../store';
import { formatDate, getTimerModeLabel } from '../utils';

const ReportView: React.FC = () => {
  const { dailyReports, todos } = useAppStore();

  const reportData = useMemo(() => {
    const reports = Object.values(dailyReports).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalPomodoros = reports.reduce((sum, report) => sum + report.completedPomodoros, 0);
    const totalMinutes = reports.reduce((sum, report) => sum + report.totalMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const completedTodos = todos.filter(todo => todo.completed).length;

    return {
      reports: reports.slice(0, 30), // Last 30 days
      totalPomodoros,
      totalHours,
      totalMinutes: totalMinutes % 60,
      completedTodos,
    };
  }, [dailyReports, todos]);

  const formatDurationDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${remainingMinutes}分`;
    }
    return `${remainingMinutes}分`;
  };

  const getDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (formatDate(date) === formatDate(today)) {
      return '今日';
    } else if (formatDate(date) === formatDate(yesterday)) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">レポート</h2>
        <p className="text-gray-600">あなたの生産性の記録をチェックしましょう</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 text-white rounded-lg mr-3">
              <FaClock size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {reportData.totalPomodoros}
              </div>
              <div className="text-sm text-red-700">合計ポモドーロ</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 text-white rounded-lg mr-3">
              <FaCalendarAlt size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.totalHours}
              </div>
              <div className="text-sm text-blue-700">総作業時間（時）</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 text-white rounded-lg mr-3">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {reportData.completedTodos}
              </div>
              <div className="text-sm text-green-700">完了タスク</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 text-white rounded-lg mr-3">
              <FaTasks size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {reportData.reports.length}
              </div>
              <div className="text-sm text-purple-700">活動日数</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Reports */}
      {reportData.reports.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            日別レポート（過去30日）
          </h3>
          {reportData.reports.map((report) => (
            <div
              key={report.date}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-gray-800">
                    {getDateLabel(report.date)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(report.date).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {report.completedPomodoros} ポモドーロ
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDurationDisplay(report.totalMinutes)}
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              {report.sessions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">セッション履歴:</div>
                  <div className="flex flex-wrap gap-2">
                    {report.sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.mode === 'pomodoro'
                            ? 'bg-red-100 text-red-800'
                            : session.mode === 'short-break'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getTimerModeLabel(session.mode)} ({session.duration}分)
                        {session.startTime && (
                          <span className="ml-1 opacity-75">
                            {new Date(session.startTime).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>効率性</span>
                  <span>
                    {report.completedPomodoros > 0 
                      ? `${Math.round((report.completedPomodoros / Math.max(report.sessions.filter(s => s.mode === 'pomodoro').length, 1)) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${report.completedPomodoros > 0 
                        ? Math.min((report.completedPomodoros / 8) * 100, 100)
                        : 0
                      }%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  目標: 8ポモドーロ/日
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl font-medium text-gray-600 mb-2">
            まだレポートがありません
          </div>
          <div className="text-gray-500">
            ポモドーロセッションを完了すると、ここにデータが表示されます
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">💡 生産性向上のヒント</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• 1日8ポモドーロ（約4時間の集中作業）を目標にしましょう</div>
          <div>• 長期的な傾向を把握して、自分の最も生産的な時間帯を見つけましょう</div>
          <div>• 休憩時間も大切です。しっかりとリフレッシュしましょう</div>
          <div>• タスクの見積もりと実際の時間を比較して、計画スキルを向上させましょう</div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;