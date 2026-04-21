'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface TopQuestion {
  question: string;
  count: number;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  conversations: number;
}

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConv: number;
  topQuestions: TopQuestion[];
  recentMessages: Message[];
  chartData: ChartDataPoint[];
}

export default function Analytics() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // Check if logged in
    const storedChatbotId = sessionStorage.getItem('chatbot_id');
    const storedBusinessName = sessionStorage.getItem('business_name');
    
    if (!storedChatbotId) {
      router.push('/dashboard');
      return;
    }

    setBusinessName(storedBusinessName || '');
    loadAnalytics(storedChatbotId, timeRange);
  }, [timeRange, router]);

  const loadAnalytics = async (id: string, days: number) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('chatbot_id', id)
        .gte('started_at', startDate.toISOString());

      // Get messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chatbot_id', id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Calculate top questions
      const userMessages = messages?.filter(m => m.role === 'user') || [];
      const questionCounts: { [key: string]: number } = {};
      
      userMessages.forEach(msg => {
        const question = msg.content.substring(0, 80);
        questionCounts[question] = (questionCounts[question] || 0) + 1;
      });

      const topQuestions: TopQuestion[] = Object.entries(questionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([question, count]) => ({ question, count }));

      // Group conversations by day for chart
      const conversationsByDay: { [key: string]: number } = {};
      conversations?.forEach(conv => {
        const date = new Date(conv.started_at).toLocaleDateString();
        conversationsByDay[date] = (conversationsByDay[date] || 0) + 1;
      });

      const chartData: ChartDataPoint[] = Object.entries(conversationsByDay)
        .map(([date, count]) => ({ date, conversations: count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAnalytics({
        totalConversations: conversations?.length || 0,
        totalMessages: messages?.length || 0,
        avgMessagesPerConv: conversations?.length ? (messages?.length || 0) / conversations.length : 0,
        topQuestions,
        recentMessages: (messages?.slice(0, 20) || []) as Message[],
        chartData
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chatbot_id');
    sessionStorage.removeItem('business_name');
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
              <p className="text-sm text-gray-600">Analytics Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Filter */}
        <div className="mb-6 flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === days
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-600'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalConversations}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages Exchanged</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Messages/Conv</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.avgMessagesPerConv.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="conversations" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Questions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Questions</h2>
          <div className="space-y-3">
            {analytics.topQuestions.map((item: TopQuestion, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 mr-2">{index + 1}.</span>
                  <span className="text-sm text-gray-700">{item.question}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{item.count}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h2>
          <div className="space-y-3">
            {analytics.recentMessages.map((msg: Message) => (
              <div key={msg.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    msg.role === 'user' ? 'bg-emerald-100' : 'bg-green-100'
                  }`}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.role === 'user' ? 'Guest' : 'AI Assistant'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}