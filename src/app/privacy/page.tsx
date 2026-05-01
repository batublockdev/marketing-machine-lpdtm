import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Marketing Machine LPDTM',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            <strong>Last updated:</strong> May 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Account Information:</strong> When you connect your TikTok account, we collect your TikTok user ID and access tokens</li>
              <li><strong>Content Data:</strong> Videos, images, captions, and tags you submit for approval</li>
              <li><strong>Usage Data:</strong> How you interact with the Service, including posts created, approved, and published</li>
              <li><strong>Device Information:</strong> Browser type, IP address, device type</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process and publish content to connected platforms</li>
              <li>Send you technical notices and support messages</li>
              <li>Analyze usage to improve user experience</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-gray-300 mb-4">
              We do not sell your personal information. We may share your information:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>With Connected Platforms:</strong> When you publish content to TikTok, your content and associated data is shared with TikTok according to their privacy policy</li>
              <li><strong>With Service Providers:</strong> Third parties that help us operate the Service</li>
              <li><strong>For Legal Purposes:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. TikTok Data</h2>
            <p className="text-gray-300">
              When you connect your TikTok account, we collect and store:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
              <li>Your TikTok user ID (open ID)</li>
              <li>Access tokens for publishing content on your behalf</li>
              <li>Content you submit for approval and publishing</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We only use TikTok data for the purposes of the Service and in accordance with TikTok's terms of service. You can disconnect your TikTok account at any time from the Service, which will revoke our access to your TikTok account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-gray-300">
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
              <li>Encryption of data in transit (HTTPS)</li>
              <li>Secure storage of access tokens</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="text-gray-300 mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-gray-300">
              We retain your information for as long as necessary to provide the Service:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
              <li><strong>Content files:</strong> Automatically deleted 48 hours after approval/rejection</li>
              <li><strong>Post metadata:</strong> Retained in database indefinitely for analytics</li>
              <li><strong>Access tokens:</strong> Stored until you disconnect your account</li>
              <li><strong>Pending posts:</strong> Deleted after 7 days if not approved</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Disconnect connected social media accounts</li>
              <li>Object to certain processing of your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-300">
              We use essential cookies to operate the Service and maintain your session. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-gray-300">
              Our Service is not intended for children under 13. We do not knowingly collect information from children under 13. If we become aware of such collection, we will delete the information immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Users</h2>
            <p className="text-gray-300">
              The Service is operated from the United States. If you are accessing from outside the US, please be aware that your information may be transferred to, stored, and processed in the US.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-gray-300">
              For questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:support@marketing-machine-lpdtm.com" className="text-blue-400 hover:text-blue-300">
                support@marketing-machine-lpdtm.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}