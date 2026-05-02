'use client';

import { useEffect, useState } from 'react';
import PostModal from '../components/PostModal';
import Sidebar from '../components/Sidebar';

interface Post {
  id: string;
  botId: string;
  platform: string;
  targetAccount: string | null;
  videoPath: string;
  mediaFiles: string | null;
  caption: string | null;
  status: string;
  rejectReason: string | null;
  tiktokPublished: boolean;
  instagramPublished: boolean;
  instagramPublishReady: boolean;
  createdAt: string;
  rejectedAt: string | null;
}

export default function RejectedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts?status=rejected');
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

  const grouped = posts.reduce((acc, post) => {
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
        <h1 className="text-2xl font-bold mb-6 text-white">❌ Contenido rechazado</h1>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-gray-300 text-sm">
            Los bots pueden obtener estos posts via <code className="bg-gray-700 px-2 py-1 rounded">GET /api/rejected</code>
            y eliminarlos una vez corregidos via <code className="bg-gray-700 px-2 py-1 rounded">DELETE /api/posts/[id]</code>
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">No hay posts rechazados</p>
          </div>
        ) : (
          Object.entries(grouped).map(([botId, botPosts]) => (
            <div key={botId} className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-red-400">{botId} ({botPosts.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {botPosts.map((post) => {
                  const previewPath = getPreviewMedia(post);
                  const previewIsVideo = isVideo(previewPath);

                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-gray-800 rounded-xl overflow-hidden border border-red-600 hover:border-red-400 transition-all text-left group"
                    >
                      <div className="aspect-video bg-gray-900 relative overflow-hidden">
                        {previewIsVideo ? (
                          <video
                            src={`/api/media?path=${encodeURIComponent(previewPath)}`}
                            className="w-full h-full object-cover opacity-60"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={`/api/media?path=${encodeURIComponent(previewPath)}`}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                          />
                        )}
                        {previewIsVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full w-10 h-10 flex items-center justify-center opacity-60">
                              <span className="text-xl">▶</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs ${
                            post.platform === 'tiktok' ? 'bg-pink-600' : 'bg-purple-600'
                          } text-white`}>
                            {post.platform}
                          </span>
                          {post.targetAccount && (
                            <span className="text-xs text-gray-400">
                              → @{post.targetAccount}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                          {post.caption || 'Sin caption'}
                        </p>

                        {post.rejectReason && (
                          <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-2">
                            <p className="text-red-400 text-xs font-medium mb-1">Razón del rechazo:</p>
                            <p className="text-gray-300 text-sm">{post.rejectReason}</p>
                          </div>
                        )}

                        <div className="flex gap-4 text-xs text-gray-500">
                          <p>Creado: {new Date(post.createdAt).toLocaleString('es-CO')}</p>
                          {post.rejectedAt && (
                            <p>Rechazado: {new Date(post.rejectedAt).toLocaleString('es-CO')}</p>
                          )}
                        </div>
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