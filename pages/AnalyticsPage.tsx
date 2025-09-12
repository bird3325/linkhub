import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import { AuthContext } from '../contexts/AuthContext';
import { VisitorTracker } from '../utils/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  dailyStats: Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
  }>;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <div className="text-3xl font-bold text-[#4F46E5] mb-1">{value}</div>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

const AnalyticsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<VisitorStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    // 페이지 방문 로그 기록
    if (user) {
      VisitorTracker.logVisit('/analytics', user.username, true);
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const statsData = await VisitorTracker.getStats(days);
      if (statsData) {
        setStats(statsData);
      }
      setLoading(false);
    };

    loadStats();
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>통계를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4"># 내 통계</h1>
          
          {/* 기간 선택 */}
          <div className="mb-6">
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={7}>최근 7일</option>
              <option value={30}>최근 30일</option>
              <option value={90}>최근 90일</option>
            </select>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="총 방문수" 
              value={stats.totalVisits}
              description={`최근 ${days}일간`}
            />
            <StatCard 
              title="순 방문자" 
              value={stats.uniqueVisitors}
              description="고유 IP 기준"
            />
            <StatCard 
              title="일평균 방문" 
              value={Math.round(stats.totalVisits / days)}
              description="일일 평균 방문수"
            />
          </div>

          {/* 차트 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">## 일간 방문수 변화</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    name="방문수"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="순 방문자"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
