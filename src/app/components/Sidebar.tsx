'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Pendientes', icon: '📬' },
  { href: '/approved', label: 'Aprobados', icon: '✅' },
  { href: '/rejected', label: 'Rechazados', icon: '❌' },
];

interface TikTokStatus {
  connected: boolean;
  openId?: string;
  needsRefresh?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [tiktok, setTiktok] = useState<TikTokStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTikTokStatus();
    const interval = setInterval(checkTikTokStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkTikTokStatus = async () => {
    try {
      const res = await fetch('/api/tiktok/status');
      const data = await res.json();
      setTiktok(data);
    } catch (error) {
      console.error('Error checking TikTok status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTikTokLogin = () => {
    window.location.href = '/api/tiktok/oauth';
  };

  const handleDisconnect = async () => {
    if (confirm('¿Desconectar cuenta de TikTok?')) {
      await fetch('/api/tiktok/disconnect', { method: 'DELETE' });
      setTiktok({ connected: false });
    }
  };

  return (
    <aside className="w-64 bg-gray-900 min-h-screen p-4 fixed left-0 top-0 border-r border-gray-800">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">🎯 LPDTM</h1>
        <p className="text-gray-500 text-sm">Marketing Machine</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === item.href
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* TikTok Connection */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-xs uppercase text-gray-500 mb-3 font-medium">TikTok API</h3>

        {loading ? (
          <div className="bg-gray-800 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        ) : tiktok.connected ? (
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 text-lg">✓</span>
              <span className="text-white text-sm font-medium">Conectado</span>
            </div>
            {tiktok.openId && (
              <p className="text-xs text-gray-400 mb-2 truncate" title={tiktok.openId}>
                ID: {tiktok.openId.substring(0, 12)}...
              </p>
            )}
            {tiktok.needsRefresh && (
              <p className="text-xs text-yellow-400 mb-2">
                ⚠️ Token próximo a expirar
              </p>
            )}
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={handleTikTokLogin}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.24 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.69a6.34 6.34 0 0 0 10.86 4.49l.12-.11a6.33 6.33 0 0 0 1.86-4.48V9.13a8.16 8.16 0 0 0 4.1 1.13V6.84a4.81 4.81 0 0 1-1-.15l-.35-.21z"/>
            </svg>
            Conectar TikTok
          </button>
        )}
      </div>
    </aside>
  );
}