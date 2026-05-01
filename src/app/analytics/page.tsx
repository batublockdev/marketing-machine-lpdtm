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
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Published Posts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">Caption</th>
                  <th className="pb-4">Views</th>
                  <th className="pb-4">Likes</th>
                  <th className="pb-4">Shares</th>
                  <th className="pb-4">Comments</th>
                  <th className="pb-4">Published</th>
                </tr>
              </thead>
              <tbody id="postsTable">
                <tr>
                  <td colSpan={6} className="text-gray-500 text-center py-8">
                    Loading...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        async function loadAnalytics() {
          try {
            const res = await fetch('/api/tiktok/stats');
            const data = await res.json();
            
            if (data.success) {
              document.getElementById('followers').textContent = data.stats.followers?.toLocaleString() || '0';
              document.getElementById('following').textContent = data.stats.following?.toLocaleString() || '0';
              document.getElementById('likes').textContent = data.stats.likes?.toLocaleString() || '0';
              document.getElementById('videoCount').textContent = data.stats.videoCount?.toLocaleString() || '0';
              
              if (data.posts && data.posts.length > 0) {
                const tbody = document.getElementById('postsTable');
                tbody.innerHTML = data.posts.map(post => \`
                  <tr class="border-t border-gray-700">
                    <td class="py-4">\${post.caption?.substring(0, 50) || 'N/A'}...</td>
                    <td class="py-4">\${post.views?.toLocaleString() || 0}</td>
                    <td class="py-4">\${post.likes?.toLocaleString() || 0}</td>
                    <td class="py-4">\${post.shares?.toLocaleString() || 0}</td>
                    <td class="py-4">\${post.comments?.toLocaleString() || 0}</td>
                    <td class="py-4">\${new Date(post.publishedAt).toLocaleDateString()}</td>
                  </tr>
                \`).join('');
              } else {
                document.getElementById('postsTable').innerHTML = \`
                  <tr>
                    <td colspan="6" class="text-gray-500 text-center py-8">
                      No published posts yet
                    </td>
                  </tr>
                \`;
              }
            } else {
              console.error('Failed to load analytics:', data.error);
            }
          } catch (error) {
            console.error('Error loading analytics:', error);
          }
        }
        
        loadAnalytics();
      `}} />
    </div>
  );
}