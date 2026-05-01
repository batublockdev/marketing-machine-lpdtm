'use client';

import { useEffect, useState } from 'react';
import PostModal from '../components/PostModal';
import Sidebar from '../components/Sidebar';

interface Post {
  id: string;
  botId: string;
  platform: string;
  videoPath: string;
  mediaFiles: string | null;
  caption: string | null;
  status: string;
  publishedUrl: string | null;
  platformPostId: string | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
}

export default function ApprovedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filter, setFilter] = useState<'approved' | 'published'>('approved');

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts?status=approved');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  const getPreviewMedia = (post: Post) => {
    const files = post.mediaFiles ? JSON.parse(post.mediaFiles) : [post.videoPath];
    return files[0];
  };

  const isVideo = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'mov', 'webm', 'avi'].includes(ext);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredPosts = posts.filter(p => 
    filter === 'approved' 
      ? p.status === 'approved' || p.status === 'published'
      : p.status === 'published'
  );

  const grouped = filteredPosts.reduce((acc, post) => {
    const key = post.botId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

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
        <h1 className="text-2xl font-bold mb-6 text-white">✅ Contenido aprobado</h1>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'approved'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'published'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Publicados
          </button>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">No hay posts aprobados</p>
          </div>
        ) : (
          Object.entries(grouped).map(([botId, botPosts]) => (
            <div key={botId} className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-purple-400">{botId}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {botPosts.map((post) => {
                  const previewPath = getPreviewMedia(post);
                  const previewIsVideo = isVideo(previewPath);
                  const isPublished = post.status === 'published' && post.publishedUrl;
                  
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`bg-gray-800 rounded-xl overflow-hidden border transition-all text-left group ${
                        isPublished 
                          ? 'border-green-600 hover:border-green-400' 
                          : 'border-yellow-600 hover:border-yellow-400'
                      }`}
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
                        {isPublished && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-green-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                              ✓ Publicado
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-white text-sm line-clamp-2 mb-2">
                          {post.caption || 'Sin caption'}
                        </p>
                        
                        {/* Status badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {isPublished ? (
                            <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                              Publicado
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs">
                              Pendiente publicación
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            post.platform === 'tiktok' ? 'bg-pink-600' : 'bg-purple-600'
                          } text-white`}>
                            {post.platform}
                          </span>
                        </div>

                        {/* Stats */}
                        {isPublished && (post.views > 0 || post.likes > 0) && (
                          <div className="flex gap-3 text-xs text-gray-400 mb-2">
                            {post.views > 0 && <span>👁 {formatNumber(post.views)}</span>}
                            {post.likes > 0 && <span>❤️ {formatNumber(post.likes)}</span>}
                            {post.comments > 0 && <span>💬 {formatNumber(post.comments)}</span>}
                          </div>
                        )}

                        {/* URL link */}
                        {isPublished && post.publishedUrl && (
                          <a 
                            href={post.publishedUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-400 hover:text-blue-300 truncate block mb-2"
                          >
                            🔗 {post.publishedUrl.replace('https://', '').substring(0, 30)}...
                          </a>
                        )}

                        <p className="text-gray-500 text-xs">
                          {post.publishedAt 
                            ? `Publicado: ${new Date(post.publishedAt).toLocaleString('es-CO')}`
                            : post.approvedAt 
                              ? `Aprobado: ${new Date(post.approvedAt).toLocaleString('es-CO')}`
                              : new Date(post.createdAt).toLocaleString('es-CO')
                          }
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
            onApprove={async () => {}}
            onReject={async () => {}}
          />
        )}
      </main>
    </div>
  );
}