
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { MOCK_ANALYTICS } from '../constants';
import type { AnalyticsData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
    </div>
);

const AnalyticsPage: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        // In a real app, this would be an API call
        setAnalytics(MOCK_ANALYTICS);
    }, []);

    if (!analytics) {
        return <div>Loading...</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">내 통계</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="이번 주 총 클릭" value={`${analytics.totalClicks}회`} />
                    <StatCard title="이번 주 방문자" value={`${analytics.totalVisitors}명`} />
                    <StatCard title="모바일 접속 비율" value={`${analytics.mobilePercentage}%`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">일주일간 클릭 수 변화</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={analytics.weeklyClicks}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="clicks" name="클릭 수" stroke="#4F46E5" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">링크별 성과</h2>
                        <ul className="space-y-4">
                            {analytics.linkPerformance.map((link) => (
                                <li key={link.title} className="flex justify-between items-center">
                                    <span className="text-gray-700">{link.title}</span>
                                    <span className="font-semibold text-gray-900">{link.clicks}회</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnalyticsPage;
