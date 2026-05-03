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
  tiktokPostId?: string | null;
  tiktokUrl?: string | null;
  tiktokPublishedAt?: string | null;
  // Instagram
  instagramPublished: boolean;
  instagramPostId?: string | null;
  instagramUrl?: string | null;
  instagramPublishedAt?: string | null;
  instagramPublishReady: boolean;
  // Timestamps
  createdAt: string;
  approvedAt: string | null;
}

export default function ApprovedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts?status=approved');
    const data = await res.json();
    setPosts(data.posts || data || []);
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
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
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
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
        <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-white">✅ Contenido aprobado</h1>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 lg:py-20">
            <div className="text-5xl lg:text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">No hay posts aprobados</p>
          </div>
        ) : (
          Object.entries(grouped).map(([botId, botPosts]) => (
            <div key={botId} className="mb-6 lg:mb-8">
              <h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-purple-400">{botId}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {botPosts.map((post) => {
                  const previewPath = getPreviewMedia(post);
                  const previewIsVideo = isVideo(previewPath);

                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-gray-800 rounded-xl overflow-hidden border border-yellow-600 hover:border-yellow-400 transition-all text-left group"
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

                        {/* Status badges */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          {post.tiktokPublished && (
                            <span className="px-2 py-1 bg-pink-600 text-white rounded text-xs flex items-center gap-1">
                              ✓ TikTok
                            </span>
                          )}
                          {post.instagramPublished && (
                            <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded text-xs flex items-center gap-1">
                              ✓ Instagram
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-white text-sm line-clamp-2 mb-2">
                          {post.caption || 'Sin caption'}
                        </p>

                        {/* Platform & account info */}
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

                        {/* Status summary */}
                        <div className="flex gap-2 text-xs text-gray-400 mb-2">
                          {!post.tiktokPublished && !post.instagramPublished && (
                            <span className="text-yellow-400">Pendiente publicación</span>
                          )}
                          {post.tiktokPublished && !post.instagramPublished && (
                            <span>TikTok ✓</span>
                          )}
                          {!post.tiktokPublished && post.instagramPublished && (
                            <span>Instagram ✓</span>
                          )}
                          {post.tiktokPublished && post.instagramPublished && (
                            <span className="text-green-400">Ambos ✓</span>
                          )}
                        </div>

                        <p className="text-gray-500 text-xs">
                          Aprobado: {post.approvedAt
                            ? new Date(post.approvedAt).toLocaleString('es-CO')
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