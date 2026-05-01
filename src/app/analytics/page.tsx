import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TikTok Analytics - Marketing Machine LPDTM',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 TikTok Analytics</h1>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Account Stats</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Followers</p>
              <p className="text-3xl font-bold" id="followers">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Following</p>
              <p className="text-3xl font-bold" id="following">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Likes</p>
              <p className="text-3xl font-bold" id="likes">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Videos</p>
              <p className="text-3xl font-bold" id="videoCount">-</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2" id="statusText">Loading...</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Published Videos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">Video</th>
                  <th className="pb-4">Views</th>
                  <th className="pb-4">Likes</th>
                  <th className="pb-4">Comments</th>
                  <th className="pb-4">Shares</th>
                  <th className="pb-4">Published</th>
                </tr>
              </thead>
              <tbody id="postsTable">
                <tr>
                  <td colSpan={6} className="text-gray-500 text-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        async function loadAnalytics() {
          const statusEl = document.getElementById('statusText');
          
          try {
            statusEl.textContent = 'Loading account stats...';
            
            // Load stats
            const statsRes = await fetch('/api/tiktok/stats');
            const statsData = await statsRes.json();
            
            if (statsData.success) {
              document.getElementById('followers').textContent = (statsData.stats?.followers || 0).toLocaleString();
              document.getElementById('following').textContent = (statsData.stats?.following || 0).toLocaleString();
              document.getElementById('likes').textContent = (statsData.stats?.likes || 0).toLocaleString();
              document.getElementById('videoCount').textContent = (statsData.stats?.videoCount || 0).toLocaleString();
              statusEl.textContent = 'Stats loaded from ' + (statsData.source || 'TikTok');
            } else {
              statusEl.textContent = 'Error: ' + (statsData.error || 'Unknown error');
              statusEl.className = 'text-xs text-red-400 mt-2';
            }

            // Load videos
            const videosRes = await fetch('/api/tiktok/videos');
            const videosData = await videosRes.json();
            
            if (videosData.success && videosData.videos && videosData.videos.length > 0) {
              const tbody = document.getElementById('postsTable');
              tbody.innerHTML = videosData.videos.map(video => \`
                <tr class="border-t border-gray-700 hover:bg-gray-750">
                  <td class="py-4">
                    <div class="text-sm">
                      \${video.title ? video.title.substring(0, 40) + (video.title.length > 40 ? '...' : '') : 'No title'}
                    </div>
                    \${video.share_url ? \`
                      <a href="\${video.share_url}" target="_blank" class="text-xs text-blue-400 hover:text-blue-300">
                        View on TikTok →
                      </a>
                    \` : ''}
                  </td>
                  <td class="py-4 text-purple-400 font-medium">\${(video.view_count || 0).toLocaleString()}</td>
                  <td class="py-4 text-pink-400">\${(video.like_count || 0).toLocaleString()}</td>
                  <td class="py-4 text-gray-400">\${(video.comment_count || 0).toLocaleString()}</td>
                  <td class="py-4 text-gray-400">\${(video.share_count || 0).toLocaleString()}</td>
                  <td class="py-4 text-gray-500 text-sm">
                    \${video.create_time ? new Date(video.create_time).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              \`).join('');
            } else if (videosData.error) {
              document.getElementById('postsTable').innerHTML = \`
                <tr>
                  <td colspan="6" class="text-red-400 text-center py-8">
                    Error: \${videosData.error}
                  </td>
                </tr>
              \`;
            } else {
              document.getElementById('postsTable').innerHTML = \`
                <tr>
                  <td colspan="6" class="text-gray-500 text-center py-8">
                    No published videos found. Publish your first video from the dashboard!
                  </td>
                </tr>
              \`;
            }
          } catch (error) {
            console.error('Error loading analytics:', error);
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.className = 'text-xs text-red-400 mt-2';
            
            document.getElementById('postsTable').innerHTML = \`
              <tr>
                <td colspan="6" class="text-red-400 text-center py-8">
                  Failed to load analytics. Make sure TikTok is connected.
                </td>
              </tr>
            \`;
          }
        }
        
        loadAnalytics();
      `}} />
    </div>
  );
}