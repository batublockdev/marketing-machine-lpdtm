'use client';

import { useState, useEffect } from 'react';

interface Post {
  id: string;
  botId: string;
  platform: string;
  videoPath: string;
  mediaFiles: string | null;
  caption: string | null;
  tags?: string | null;
  status: string;
  publishedUrl?: string | null;
  platformPostId?: string | null;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  createdAt: string;
  approvedAt?: string | null;
  publishedAt?: string | null;
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
  const isPublished = post.status === 'published' && post.publishedUrl;
  const canApprove = post.status === 'pending' && onApprove;
  const canReject = post.status === 'pending' && onReject;
  const canPublish = post.status === 'approved' && post.platform === 'tiktok' && isVideo;

  // Initialize title from caption
  useEffect(() => {
    if (post.caption) {
      const title = `${post.caption} ${tags.map((t: string) => `#${t}`).join(' ')}`;
      setTiktokTitle(title.substring(0, 150));
    }
  }, [post.caption, tags]);

  // Fetch creator info when showing TikTok options
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
        // Set default privacy level (first option)
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
        // Refresh after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setPublishStatus(`❌ Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      setPublishStatus(`❌ Error: ${error.message}`);
    } finally {
      setPublishing(false);
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

          {/* Carousel controls */}
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

          {/* Published info */}
          {isPublished && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-4">
              <p className="text-green-400 font-medium mb-2">✓ Publicado</p>
              {post.publishedUrl && (
                <a 
                  href={post.publishedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  🔗 {post.publishedUrl}
                </a>
              )}
              
              {/* Stats */}
              {(post.views || post.likes) && (
                <div className="flex gap-4 mt-3 text-gray-300">
                  {post.views !== undefined && post.views > 0 && (
                    <span className="flex items-center gap-1">
                      <span>👁</span> {formatNumber(post.views)}
                    </span>
                  )}
                  {post.likes !== undefined && post.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <span>❤️</span> {formatNumber(post.likes)}
                    </span>
                  )}
                  {post.comments !== undefined && post.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <span>💬</span> {formatNumber(post.comments)}
                    </span>
                  )}
                  {post.shares !== undefined && post.shares > 0 && (
                    <span className="flex items-center gap-1">
                      <span>🔄</span> {formatNumber(post.shares)}
                    </span>
                  )}
                </div>
              )}
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
          {showTikTokOptions && canPublish && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-pink-600">
              <h3 className="text-pink-400 font-medium mb-3">📱 Publicar en TikTok</h3>
              
              {/* Creator info */}
              {creatorInfo && (
                <div className="mb-4 text-sm text-gray-400">
                  <p>Cuenta: <span className="text-white">@{creatorInfo.creator_username}</span></p>
                  <p>Max duración: <span className="text-white">{creatorInfo.max_video_post_duration_sec}s</span></p>
                </div>
              )}

              {/* Title */}
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

              {/* Privacy Level */}
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

              {/* Interaction options */}
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
                    {creatorInfo?.comment_disabled && ' (desactivado en cuenta)'}
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
                    {creatorInfo?.duet_disabled && ' (desactivado en cuenta)'}
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
                    {creatorInfo?.stitch_disabled && ' (desactivado en cuenta)'}
                  </span>
                </label>
              </div>

              {/* Consent declaration */}
              <div className="bg-gray-800 rounded p-3 mb-4 text-xs text-gray-400">
                Al publicar, aceptas la <span className="text-pink-400">Confirmación de Uso de Música de TikTok</span>.
              </div>

              {/* Publish button */}
              <div className="flex gap-3">
                <button
                  onClick={handlePublishTikTok}
                  disabled={publishing || !privacyLevel || !tiktokTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-lg font-medium transition text-white flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.24 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.69a6.34 6.34 0 0 0 10.86 4.49l.12-.11a6.33 6.33 0 0 0 1.86-4.48V9.13a8.16 8.16 0 0 0 4.1 1.13V6.84a4.81 4.81 0 0 1-1-.15l-.35-.21z"/>
                  </svg>
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
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition text-white"
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
          ) : canPublish && !showTikTokOptions ? (
            /* Show TikTok options button */
            <div className="space-y-3">
              <button
                onClick={() => setShowTikTokOptions(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-4 rounded-lg font-medium transition text-white text-lg flex items-center justify-center gap-3"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.24 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.69a6.34 6.34 0 0 0 10.86 4.49l.12-.11a6.33 6.33 0 0 0 1.86-4.48V9.13a8.16 8.16 0 0 0 4.1 1.13V6.84a4.81 4.81 0 0 1-1-.15l-.35-.21z"/>
                </svg>
                Publicar en TikTok
              </button>
              <p className="text-xs text-gray-500 text-center">
                Selecciona las opciones de publicación
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              {post.status === 'approved' && post.platform !== 'tiktok' && '⏳ Pendiente de publicación manual'}
              {post.status === 'approved' && post.platform === 'tiktok' && !isVideo && '⚠️ Solo videos pueden publicarse en TikTok'}
              {post.status === 'rejected' && '❌ Este post fue rechazado'}
              {post.status === 'published' && '✅ Este post ya fue publicado'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}