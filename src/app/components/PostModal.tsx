'use client';

import { useState, useEffect } from 'react';

interface Post {
  id: string;
  botId: string;
  platform: string;
  targetAccount: string | null;
  videoPath: string;
  mediaFiles: string | null;
  caption: string | null;
  tags?: string | null;
  status: string;
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
  approvedAt?: string | null;
  rejectReason?: string | null;
}

interface TikTokCreatorInfo {
  creator_username?: string;
  creator_nickname?: string;
  privacy_level_options?: string[];
  max_video_post_duration_sec?: number;
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
}

interface PostModalProps {
  post: Post;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

export default function PostModal({ post, onClose, onApprove, onReject }: PostModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // TikTok publishing options
  const [showTikTokOptions, setShowTikTokOptions] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<TikTokCreatorInfo | null>(null);
  const [tiktokTitle, setTiktokTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<string>('');
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);

  // Instagram status
  const [instagramLoading, setInstagramLoading] = useState(false);

  // Parse media files
  const allFiles = post.mediaFiles
    ? JSON.parse(post.mediaFiles)
    : [post.videoPath];

  const currentFile = allFiles[currentIndex] || post.videoPath;
  const ext = currentFile.split('.').pop()?.toLowerCase() || '';
  const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isCarousel = allFiles.length > 1;
  const tags = post.tags ? JSON.parse(post.tags) : [];

  const canApprove = post.status === 'pending' && onApprove;
  const canReject = post.status === 'pending' && onReject;
  const canPublishTikTok = post.status === 'approved' && !post.tiktokPublished && isVideo;
  const canPublishInstagram = post.status === 'approved' && !post.instagramPublished;

  useEffect(() => {
    if (post.caption) {
      const title = `${post.caption} ${tags.map((t: string) => `#${t}`).join(' ')}`;
      setTiktokTitle(title.substring(0, 150));
    }
  }, [post.caption, tags]);

  useEffect(() => {
    if (showTikTokOptions && !creatorInfo) {
      fetchCreatorInfo();
    }
  }, [showTikTokOptions]);

  const fetchCreatorInfo = async () => {
    try {
      const response = await fetch('/api/tiktok/creator-info');
      const data = await response.json();

      if (data.success) {
        setCreatorInfo(data.creator);
        if (data.creator.privacy_level_options?.length > 0) {
          setPrivacyLevel(data.creator.privacy_level_options[0]);
        }
      } else {
        setPublishStatus(`❌ ${data.error || 'Failed to get creator info'}`);
      }
    } catch (error: any) {
      setPublishStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    await onApprove?.(post.id);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await onReject?.(post.id, rejectReason);
    setLoading(false);
  };

  const handlePublishTikTok = async () => {
    if (!privacyLevel) {
      setPublishStatus('❌ Debes seleccionar un nivel de privacidad');
      return;
    }

    if (!tiktokTitle.trim()) {
      setPublishStatus('❌ El título es requerido');
      return;
    }

    setPublishing(true);
    setPublishStatus(null);

    try {
      const response = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          videoPath: post.videoPath,
          title: tiktokTitle,
          privacyLevel: privacyLevel,
          allowComment: allowComment,
          allowDuet: allowDuet,
          allowStitch: allowStitch
        })
      });

      const data = await response.json();

      if (data.success) {
        setPublishStatus(`✅ Video enviado a TikTok! Estado: ${data.status}`);
        setShowTikTokOptions(false);
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setPublishStatus(`❌ Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      setPublishStatus(`❌ Error: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleInstagramReady = async () => {
    setInstagramLoading(true);
    setPublishStatus(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          platform: 'instagram'
        })
      });

      const data = await response.json();

      if (data.success) {
        setPublishStatus(`✅ Post marcado como listo para Instagram. El bot lo publicará.`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setPublishStatus(`❌ Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      setPublishStatus(`❌ Error: ${error.message}`);
    } finally {
      setInstagramLoading(false);
    }
  };

  const nextMedia = () => {
    setCurrentIndex((i) => (i + 1) % allFiles.length);
  };

  const prevMedia = () => {
    setCurrentIndex((i) => (i - 1 + allFiles.length) % allFiles.length);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl w-full max-w-4xl my-8 border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-900 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              post.platform === 'tiktok'
                ? 'bg-pink-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white'
            }`}>
              {post.platform}
            </span>
            <span className="text-gray-300 font-medium">{post.botId}</span>
            {post.targetAccount && (
              <span className="text-xs text-gray-400">→ @{post.targetAccount}</span>
            )}
            {isCarousel && (
              <span className="text-xs text-gray-500">
                {currentIndex + 1}/{allFiles.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl p-2"
          >
            ×
          </button>
        </div>

        {/* Media */}
        <div className="relative bg-black flex items-center justify-center" style={{ maxHeight: '50vh' }}>
          {isVideo ? (
            <video
              key={currentFile}
              src={`/api/media?path=${encodeURIComponent(currentFile)}`}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: '50vh' }}
            />
          ) : isImage ? (
            <img
              src={`/api/media?path=${encodeURIComponent(currentFile)}`}
              alt="Media"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '50vh' }}
            />
          ) : (
            <div className="text-gray-400 text-center p-8">
              <p className="text-xl mb-2">📷 Preview no disponible</p>
              <p className="text-sm text-gray-500">{currentFile.split('/').pop()}</p>
            </div>
          )}

          {isCarousel && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
              >
                ←
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
              >
                →
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {allFiles.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                    className={`w-3 h-3 rounded-full transition ${
                      i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-5 bg-gray-800 rounded-b-xl">
          <p className="text-white text-lg mb-3">{post.caption || 'Sin caption'}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-cyan-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Publication status */}
          {(post.tiktokPublished || post.instagramPublished) && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-4">
              <p className="text-green-400 font-medium mb-2">✓ Publicado en:</p>
              <div className="flex flex-wrap gap-4">
                {post.tiktokPublished && (
                  <div>
                    <span className="text-pink-400 font-medium">TikTok</span>
                    {post.tiktokUrl && (
                      <a
                        href={post.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm block"
                      >
                        🔗 Ver en TikTok
                      </a>
                    )}
                    {post.tiktokPublishedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(post.tiktokPublishedAt).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                )}
                {post.instagramPublished && (
                  <div>
                    <span className="text-purple-400 font-medium">Instagram</span>
                    {post.instagramUrl && (
                      <a
                        href={post.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm block"
                      >
                        🔗 Ver en Instagram
                      </a>
                    )}
                    {post.instagramPublishedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(post.instagramPublishedAt).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Publish status */}
          {publishStatus && (
            <div className={`rounded-lg p-4 mb-4 ${
              publishStatus.includes('✅')
                ? 'bg-green-900/30 border border-green-600'
                : 'bg-red-900/30 border border-red-600'
            }`}>
              <p className={publishStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                {publishStatus}
              </p>
            </div>
          )}

          <p className="text-gray-400 text-sm mb-5">
            📅 Creado: {new Date(post.createdAt).toLocaleString('es-CO')}
            {post.approvedAt && (
              <span className="ml-4">✓ Aprobado: {new Date(post.approvedAt).toLocaleString('es-CO')}</span>
            )}
          </p>

          {/* TikTok Publishing Options */}
          {showTikTokOptions && canPublishTikTok && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-pink-600">
              <h3 className="text-pink-400 font-medium mb-3">📱 Publicar en TikTok</h3>

              {creatorInfo && (
                <div className="mb-4 text-sm text-gray-400">
                  <p>Cuenta: <span className="text-white">@{creatorInfo.creator_username}</span></p>
                  <p>Max duración: <span className="text-white">{creatorInfo.max_video_post_duration_sec}s</span></p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm">Título *</label>
                <input
                  type="text"
                  value={tiktokTitle}
                  onChange={(e) => setTiktokTitle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                  placeholder="Título del video..."
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">{tiktokTitle.length}/150 caracteres</p>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm">Privacidad *</label>
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                >
                  <option value="">Seleccionar privacidad...</option>
                  {creatorInfo?.privacy_level_options?.map((level) => (
                    <option key={level} value={level}>
                      {level === 'PUBLIC_TO_EVERYONE' && '🌍 Público (Todos)'}
                      {level === 'MUTUAL_FOLLOW_FRIENDS' && '👥 Solo amigos'}
                      {level === 'SELF_ONLY' && '🔒 Solo yo'}
                      {!['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'].includes(level) && level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowComment}
                    onChange={(e) => setAllowComment(e.target.checked)}
                    disabled={creatorInfo?.comment_disabled}
                    className="w-4 h-4"
                  />
                  <span className={creatorInfo?.comment_disabled ? 'text-gray-500' : 'text-white'}>
                    💬 Permitir comentarios
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowDuet}
                    onChange={(e) => setAllowDuet(e.target.checked)}
                    disabled={creatorInfo?.duet_disabled}
                    className="w-4 h-4"
                  />
                  <span className={creatorInfo?.duet_disabled ? 'text-gray-500' : 'text-white'}>
                    🎭 Permitir Duet
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allowStitch}
                    onChange={(e) => setAllowStitch(e.target.checked)}
                    disabled={creatorInfo?.stitch_disabled}
                    className="w-4 h-4"
                  />
                  <span className={creatorInfo?.stitch_disabled ? 'text-gray-500' : 'text-white'}>
                    ✂️ Permitir Stitch
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePublishTikTok}
                  disabled={publishing || !privacyLevel || !tiktokTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-lg font-medium transition text-white"
                >
                  {publishing ? 'Publicando...' : 'Publicar'}
                </button>
                <button
                  onClick={() => setShowTikTokOptions(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && canReject ? (
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 font-medium">
                  📝 Razón del rechazo
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="El bot usará esta razón para mejorar el contenido..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition text-white"
                >
                  {loading ? 'Enviando...' : '✗ Confirmar rechazo'}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : canApprove && canReject ? (
            /* Approve/Reject buttons */
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-4 rounded-lg font-medium transition text-white text-lg"
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 px-6 py-4 rounded-lg font-medium transition text-white text-lg"
              >
                ✗ Rechazar
              </button>
            </div>
          ) : post.status === 'approved' ? (
            /* TikTok & Instagram buttons */
            <div className="space-y-3">
              {/* TikTok button */}
              <button
                onClick={() => setShowTikTokOptions(true)}
                disabled={!canPublishTikTok || post.tiktokPublished}
                className={`w-full px-6 py-4 rounded-lg font-medium transition text-white text-lg flex items-center justify-center gap-3 ${
                  post.tiktokPublished
                    ? 'bg-green-600 cursor-default'
                    : canPublishTikTok
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                      : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.24 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.69a6.34 6.34 0 0 0 10.86 4.49l.12-.11a6.33 6.33 0 0 0 1.86-4.48V9.13a8.16 8.16 0 0 0 4.1 1.13V6.84a4.81 4.81 0 0 1-1-.15l-.35-.21z"/>
                </svg>
                {post.tiktokPublished ? '✓ Publicado en TikTok' : 'Publicar en TikTok'}
              </button>

              {/* Instagram button */}
              <button
                onClick={handleInstagramReady}
                disabled={!canPublishInstagram || post.instagramPublished || post.instagramPublishReady}
                className={`w-full px-6 py-4 rounded-lg font-medium transition text-white text-lg flex items-center justify-center gap-3 ${
                  post.instagramPublished
                    ? 'bg-green-600 cursor-default'
                    : post.instagramPublishReady
                      ? 'bg-yellow-600 cursor-default'
                      : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                {post.instagramPublished
                  ? '✓ Publicado en Instagram'
                  : post.instagramPublishReady
                    ? '⏳ Listo para Instagram (esperando bot)'
                    : 'Marcar para Instagram'
                }
              </button>

              {post.instagramPublishReady && !post.instagramPublished && (
                <p className="text-xs text-yellow-400 text-center">
                  El bot detectará este post y lo publicará en Instagram
                </p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              {post.status === 'rejected' && '❌ Este post fue rechazado'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}