import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TikTok Analytics - Marketing Machine LPDTM',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 Videos Publicados</h1>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Videos Publicados</p>
              <p className="text-3xl font-bold" id="videoCount">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-3xl font-bold" id="totalViews">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Likes</p>
              <p className="text-3xl font-bold" id="totalLikes">-</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Comentarios</p>
              <p className="text-3xl font-bold" id="totalComments">-</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Videos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3">Caption</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Likes</th>
                  <th className="pb-3">Comentarios</th>
                  <th className="pb-3">Publicado</th>
                  <th className="pb-3">Link</th>
                </tr>
              </thead>
              <tbody id="postsTable">
                <tr>
                  <td colSpan={6} className="text-gray-500 text-center py-8">
                    Cargando...
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
              document.getElementById('videoCount').textContent = data.posts.length;
              
              let totalViews = 0;
              let totalLikes = 0;
              let totalComments = 0;
              
              data.posts.forEach(post => {
                totalViews += post.views || 0;
                totalLikes += post.likes || 0;
                totalComments += post.comments || 0;
              });
              
              document.getElementById('totalViews').textContent = totalViews.toLocaleString();
              document.getElementById('totalLikes').textContent = totalLikes.toLocaleString();
              document.getElementById('totalComments').textContent = totalComments.toLocaleString();
              
              if (data.posts.length > 0) {
                const tbody = document.getElementById('postsTable');
                tbody.innerHTML = data.posts.map(post => \`
                  <tr class="border-t border-gray-700 hover:bg-gray-750">
                    <td class="py-4">\${post.caption ? post.caption.substring(0, 50) + '...' : 'N/A'}</td>
                    <td class="py-4">\${(post.views || 0).toLocaleString()}</td>
                    <td class="py-4">\${(post.likes || 0).toLocaleString()}</td>
                    <td class="py-4">\${(post.comments || 0).toLocaleString()}</td>
                    <td class="py-4 text-sm">\${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</td>
                    <td class="py-4">
                      \${post.publishedUrl ? \`
                        <a href="\${post.publishedUrl}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm">
                          Ver en TikTok →
                        </a>
                      \` : '-'}
                    </td>
                  </tr>
                \`).join('');
              } else {
                document.getElementById('postsTable').innerHTML = \`
                  <tr>
                    <td colspan="6" class="text-gray-500 text-center py-8">
                      No hay videos publicados aún. Publica tu primer video desde el dashboard.
                    </td>
                  </tr>
                \`;
              }
            } else {
              document.getElementById('postsTable').innerHTML = \`
                <tr>
                  <td colspan="6" class="text-red-400 text-center py-8">
                    Error: \${data.error}
                  </td>
                </tr>
              \`;
            }
          } catch (error) {
            console.error('Error:', error);
            document.getElementById('postsTable').innerHTML = \`
              <tr>
                <td colspan="6" class="text-red-400 text-center py-8">
                  Error al cargar los datos
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