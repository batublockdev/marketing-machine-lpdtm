'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

interface Stats {
  botId: string;
  platform: string;
  posts: number;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats[]>([]);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const bots = [...new Set(stats.map((s) => s.botId))];
  const filteredStats = selectedBot
    ? stats.filter((s) => s.botId === selectedBot)
    : stats;

  const totals = filteredStats.reduce(
    (acc, s) => ({
      posts: acc.posts + s.posts,
      views: acc.views + s.views,
      likes: acc.likes + s.likes,
      shares: acc.shares + s.shares,
      comments: acc.comments + s.comments,
    }),
    { posts: 0, views: 0, likes: 0, shares: 0, comments: 0 }
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 text-white">📊 Estadísticas</h1>

        {/* Bot Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedBot(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedBot === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Todos
          </button>
          {bots.map((bot) => (
            <button
              key={bot}
              onClick={() => setSelectedBot(bot)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedBot === bot
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {bot}
            </button>
          ))}
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl">
            <p className="text-purple-200 text-sm mb-1">Posts</p>
            <p className="text-4xl font-bold text-white">{formatNumber(totals.posts)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
            <p className="text-blue-200 text-sm mb-1">Views</p>
            <p className="text-4xl font-bold text-white">{formatNumber(totals.views)}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-800 p-6 rounded-xl">
            <p className="text-pink-200 text-sm mb-1">Likes</p>
            <p className="text-4xl font-bold text-white">{formatNumber(totals.likes)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl">
            <p className="text-green-200 text-sm mb-1">Shares</p>
            <p className="text-4xl font-bold text-white">{formatNumber(totals.shares)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl">
            <p className="text-orange-200 text-sm mb-1">Comments</p>
            <p className="text-4xl font-bold text-white">{formatNumber(totals.comments)}</p>
          </div>
        </div>

        {/* Stats Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Bot</th>
                <th className="text-left p-4 text-gray-400 font-medium">Plataforma</th>
                <th className="text-right p-4 text-gray-400 font-medium">Posts</th>
                <th className="text-right p-4 text-gray-400 font-medium">Views</th>
                <th className="text-right p-4 text-gray-400 font-medium">Likes</th>
                <th className="text-right p-4 text-gray-400 font-medium">Shares</th>
                <th className="text-right p-4 text-gray-400 font-medium">Comments</th>
                <th className="text-right p-4 text-gray-400 font-medium">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat, i) => {
                const engagement = stat.views > 0 
                  ? (((stat.likes + stat.comments + stat.shares) / stat.views) * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <tr key={i} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-4 font-medium text-white">{stat.botId}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stat.platform === 'tiktok'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white'
                        }`}
                      >
                        {stat.platform}
                      </span>
                    </td>
                    <td className="p-4 text-right text-white">{stat.posts}</td>
                    <td className="p-4 text-right text-white">{formatNumber(stat.views)}</td>
                    <td className="p-4 text-right text-white">{formatNumber(stat.likes)}</td>
                    <td className="p-4 text-right text-white">{formatNumber(stat.shares)}</td>
                    <td className="p-4 text-right text-white">{formatNumber(stat.comments)}</td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${
                        parseFloat(engagement) > 5 ? 'text-green-400' :
                        parseFloat(engagement) > 2 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {engagement}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Sin datos aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <p className="text-gray-500 text-sm mt-6 text-center">
          Los bots deben actualizar sus estadísticas en <code className="bg-gray-800 px-2 py-1 rounded">stats/bot-name.json</code>
        </p>
      </main>
    </div>
  );
}