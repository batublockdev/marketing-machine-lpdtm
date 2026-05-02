'use client';

import { useEffect, useState } from 'react';
import PostModal from './components/PostModal';
import Sidebar from './components/Sidebar';

interface Post {
  id: string;
  botId: string;
  platform: string;
  targetAccount: string | null;
  videoPath: string;
  mediaFiles: string | null;
  caption: string | null;
  tags: string | null;
  status: string;
  // Legacy fields
  platformPostId?: string | null;
  publishedUrl?: string | null;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  publishedAt?: string | null;
  // TikTok
  tiktokPublished: boolean;
  instagramPublished: boolean;
  instagramPublishReady: boolean;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterBot, setFilterBot] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data.posts || data || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    setSelectedPost(null);
    fetchPosts();
  };

  const handleReject = async (id: string, reason: string) => {
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', rejectReason: reason }),
    });
    setSelectedPost(null);
    fetchPosts();
  };

  const bots = [...new Set(posts.map(p => p.botId))];
  const platforms = [...new Set(posts.map(p => p.platform))];

  const filteredPosts = posts.filter(p => {
    if (filterBot && p.botId !== filterBot) return false;
    if (filterPlatform && p.platform !== filterPlatform) return false;
    return true;
  });

  const grouped = filteredPosts.reduce((acc, post) => {
    const key = `${post.botId}-${post.platform}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  // Get preview media for a post
  const getPreviewMedia = (post: Post) => {
    const files = post.mediaFiles ? JSON.parse(post.mediaFiles) : [post.videoPath];
    return files[0];
  };

  const isVideo = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'mov', 'webm', 'avi'].includes(ext);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Cargando...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 text-white">📬 Pendientes de aprobación</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
            value={filterBot || ''} 
            onChange={(e) => setFilterBot(e.target.value || null)}
            className="bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Todos los bots</option>
            {bots.map(bot => (
              <option key={bot} value={bot}>{bot}</option>
            ))}
          </select>
          <select 
            value={filterPlatform || ''} 
            onChange={(e) => setFilterPlatform(e.target.value || null)}
            className="bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Todas las plataformas</option>
            {platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">No hay posts pendientes</p>
            <p className="text-gray-500 text-sm mt-2">Los bots enviarán contenido aquí automáticamente</p>
          </div>
        ) : (
          Object.entries(grouped).map(([key, groupPosts]) => (
            <div key={key} className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  groupPosts[0].platform === 'tiktok' 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white'
                }`}>
                  {groupPosts[0].platform}
                </span>
                <span className="text-purple-400">{groupPosts[0].botId}</span>
                <span className="text-gray-500 text-sm font-normal">({groupPosts.length})</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupPosts.map((post) => {
                  const previewPath = getPreviewMedia(post);
                  const previewIsVideo = isVideo(previewPath);
                  const mediaCount = post.mediaFiles ? JSON.parse(post.mediaFiles).length : 1;
                  
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-left group"
                    >
                      <div className="aspect-video bg-gray-900 relative overflow-hidden">
                        {previewIsVideo ? (
                          <video 
                            src={`/api/media?path=${encodeURIComponent(previewPath)}`}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img 
                            src={`/api/media?path=${encodeURIComponent(previewPath)}`}
                            alt="Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        {mediaCount > 1 && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {mediaCount} 📷
                          </div>
                        )}
                        {previewIsVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">
                              <span className="text-2xl">▶</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-white text-sm line-clamp-2 mb-2">
                          {post.caption || 'Sin caption'}
                        </p>
                        {post.targetAccount && (
                          <p className="text-purple-400 text-xs mb-1">
                            → @{post.targetAccount}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs">
                          📅 {new Date(post.createdAt).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {selectedPost && (
          <PostModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </main>
    </div>
  );
}