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
  platformPostId?: string | null;
  publishedUrl?: string | null;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  publishedAt?: string | null;
  tiktokPublished: boolean;
  tiktokPostId?: string | null;
  tiktokUrl?: string | null;
  tiktokPublishedAt?: string | null;
  instagramPublished: boolean;
  instagramPostId?: string | null;
  instagramUrl?: string | null;
  instagramPublishedAt?: string | null;
  instagramPublishReady: boolean;
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

  // Instagram publishing
  const [instagramLoading, setInstagramLoading] = useState(false);

  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [allowComment, setAllowComment] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);

  const canPublishTikTok = post.platform === 'tiktok' && post.status === 'approved' && !post.tiktokPublished;
  const canPublishInstagram = post.platform === 'instagram' && post.status === 'approved' && !post.instagramPublished && !post.instagramPublishReady;
  const isApproved = post.status === 'approved';
  const isRejected = post.status === 'rejected';

  const allFiles = post.mediaFiles ? JSON.parse(post.mediaFiles) : [post.videoPath];
  const currentFile = allFiles[currentIndex] || allFiles[0];
  const isCarousel = allFiles.length > 1;

  const ext = currentFile.split('.').pop()?.toLowerCase() || '';
  const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

  const tags = post.tags ? JSON.parse(post.tags) : [];

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
        className="bg-gray-800 rounded-xl w-full max-w-4xl my-8 border border-gray-600 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-900 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              post.platform === 'tiktok'
                ? 'bg-pink-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white'
            }`}>
              {post.platform}
            </span>
            <span className="text-gray-300 font-medium text-sm lg:text-base">{post.botId}</span>
            {post.targetAccount && (
              <span className="text-xs text-gray-400 hidden sm:inline">→ @{post.targetAccount}</span>
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
        <div className="relative bg-black flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '40vh' }}>
          {isVideo ? (
            <video
              key={currentFile}
              src={`/api/media?path=${encodeURIComponent(currentFile)}`}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: '40vh' }}
            />
          ) : isImage ? (
            <img
              src={`/api/media?path=${encodeURIComponent(currentFile)}`}
              alt="Media"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '40vh' }}
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-lg lg:text-xl"
              >
                ←
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-lg lg:text-xl"
              >
                →
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {allFiles.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                    className={`w-2 h-2 rounded-full transition ${
                      i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-4 lg:p-5 bg-gray-800 rounded-b-xl">
          <p className="text-white text-base lg:text-lg mb-3">{post.caption || 'Sin caption'}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="px-2 lg:px-3 py-1 bg-gray-700 rounded-full text-xs lg:text-sm text-cyan-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Publication status */}
          {(post.tiktokPublished || post.instagramPublished) && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-3 lg:p-4 mb-4">
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
            <div className={`rounded-lg p-3 lg:p-4 mb-4 text-sm lg:text-base ${
              publishStatus.includes('✅')
                ? 'bg-green-900/30 border border-green-600'
                : 'bg-red-900/30 border border-red-600'
            }`}>
              <p className={publishStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                {publishStatus}
              </p>
            </div>
          )}

          <p className="text-gray-400 text-xs lg:text-sm mb-4">
            📅 Creado: {new Date(post.createdAt).toLocaleString('es-CO')}
            {post.approvedAt && (
              <span className="block sm:inline sm:ml-4 mt-1 sm:mt-0">✓ Aprobado: {new Date(post.approvedAt).toLocaleString('es-CO')}</span>
            )}
          </p>

          {/* TikTok Publishing Options */}
          {showTikTokOptions && canPublishTikTok && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
              <h3 className="text-white font-medium mb-3">Publicar en TikTok</h3>

              {creatorInfo && (
                <div className="mb-3 p-3 bg-gray-800 rounded text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Cuenta:</span> @{creatorInfo.creator_username || 'N/A'}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Título *</label>
                  <input
                    type="text"
                    value={tiktokTitle}
                    onChange={(e) => setTiktokTitle(e.target.value)}
                    placeholder="Título del video"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm lg:text-base"
                    maxLength={150}
                  />
                  <p className="text-gray-500 text-xs mt-1">{tiktokTitle.length}/150</p>
                </div>

                <div>
                  <label className="text-gray-300 text-sm block mb-1">Privacidad</label>
                  <select
                    value={privacyLevel}
                    onChange={(e) => setPrivacyLevel(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm lg:text-base"
                  >
                    {creatorInfo?.privacy_level_options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    )) || (
                      <>
                        <option value="PUBLIC_TO_EVERYONE">Público</option>
                        <option value="MUTUAL_FOLLOW_FRIENDS">Solo amigos</option>
                        <option value="SELF_ONLY">Solo yo</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={allowComment}
                      onChange={(e) => setAllowComment(e.target.checked)}
                      className="rounded"
                    />
                    Comentarios
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={allowDuet}
                      onChange={(e) => setAllowDuet(e.target.checked)}
                      className="rounded"
                    />
                    Duet
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={allowStitch}
                      onChange={(e) => setAllowStitch(e.target.checked)}
                      className="rounded"
                    />
                    Stitch
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handlePublishTikTok}
                    disabled={publishing}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
                  >
                    {publishing ? 'Publicando...' : 'Publicar en TikTok'}
                  </button>
                  <button
                    onClick={() => setShowTikTokOptions(false)}
                    className="sm:w-auto px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instagram Ready Status */}
          {post.instagramPublishReady && !post.instagramPublished && (
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 lg:p-4 mb-4">
              <p className="text-yellow-400 font-medium">⏳ Listo para Instagram</p>
              <p className="text-yellow-300 text-sm mt-1">El bot publicará este contenido automáticamente.</p>
            </div>
          )}

          {/* Rejection reason */}
          {isRejected && post.rejectReason && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 lg:p-4 mb-4">
              <p className="text-red-400 font-medium mb-1">Razón del rechazo:</p>
              <p className="text-gray-300">{post.rejectReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* Approve/Reject buttons for pending posts */}
            {post.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 text-sm lg:text-base"
                >
                  {loading ? 'Aprobando...' : '✓ Aprobar'}
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="sm:w-auto px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm lg:text-base"
                >
                  ✗ Rechazar
                </button>
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Razón del rechazo (obligatoria)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mb-3 text-sm lg:text-base"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={loading || !rejectReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg disabled:opacity-50 text-sm lg:text-base"
                  >
                    {loading ? 'Rechazando...' : 'Confirmar rechazo'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm lg:text-base"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Publish buttons for approved posts */}
            {isApproved && !post.tiktokPublished && !post.instagramPublished && !post.instagramPublishReady && (
              <div className="flex flex-col sm:flex-row gap-2">
                {post.platform === 'tiktok' && (
                  <button
                    onClick={() => setShowTikTokOptions(true)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    <span>📱</span>
                    <span>Publicar en TikTok</span>
                  </button>
                )}
                {post.platform === 'instagram' && (
                  <button
                    onClick={handleInstagramReady}
                    disabled={instagramLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    <span>📸</span>
                    <span>{instagramLoading ? 'Marcando...' : 'Listo para Instagram'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full mt-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm lg:text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}