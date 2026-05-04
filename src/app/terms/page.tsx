import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - LPDTM Marketing Machine',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            <strong>Last updated:</strong> May 4, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">LPDTM Marketing Machine</h2>
            <p className="text-gray-300">
              These Terms of Service ("Terms") govern your use of the LPDTM Marketing Machine application ("App", "Service"), operated by LPDTM. By accessing and using LPDTM Marketing Machine, you accept and agree to be bound by these Terms. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Description of Service</h2>
            <p className="text-gray-300">
              LPDTM Marketing Machine is a social media content management platform that allows users to review, approve, and publish content to various social media platforms including TikTok. The App facilitates content workflow management between content creators and reviewers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. User Responsibilities</h2>
            <p className="text-gray-300 mb-2">
              By using LPDTM Marketing Machine, you agree to the following responsibilities:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>You are responsible for all content you submit, approve, or publish through LPDTM Marketing Machine</li>
              <li>You must have the right to publish any content you submit</li>
              <li>You agree to comply with all applicable laws and the terms of service of connected platforms (TikTok, Instagram, etc.)</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You will not use LPDTM Marketing Machine for any unlawful purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Content Guidelines</h2>
            <p className="text-gray-300 mb-2">
              When using LPDTM Marketing Machine, you agree not to submit, approve, or publish content that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
              <li>Violates any laws or regulations</li>
              <li>Infringes intellectual property rights of others</li>
              <li>Contains hate speech, harassment, or discrimination</li>
              <li>Is spam or deceptive</li>
              <li>Contains malware or harmful code</li>
              <li>Violates the terms of service of connected platforms</li>
              <li>Is otherwise harmful to users or the App</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-gray-300">
              LPDTM Marketing Machine integrates with third-party platforms including TikTok. Your use of these platforms is subject to their respective terms of service and privacy policies. LPDTM is not responsible for the actions, content, or policies of these third-party services. You are solely responsible for understanding and complying with the terms of any connected platforms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-gray-300">
              You retain ownership of all content you submit to LPDTM Marketing Machine. By submitting content, you grant LPDTM a limited license to process, store, and publish such content through the App in accordance with your instructions. LPDTM Marketing Machine and its original content, features, and functionality are owned by LPDTM and are protected by international copyright, trademark, and other laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Disclaimers</h2>
            <p className="text-gray-300">
              LPDTM MARKETING MACHINE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE ARE NOT RESPONSIBLE FOR ANY DAMAGES ARISING FROM YOUR USE OF LPDTM MARKETING MACHINE, INCLUDING BUT NOT LIMITED TO DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300">
              To the maximum extent permitted by law, LPDTM shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use or inability to use LPDTM Marketing Machine.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Modifications</h2>
            <p className="text-gray-300">
              LPDTM reserves the right to modify these Terms at any time. We will notify users of significant changes by posting a notice on the App or through other reasonable means. Your continued use of LPDTM Marketing Machine after such modifications constitutes your acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-gray-300">
              We may terminate or suspend your access to LPDTM Marketing Machine at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the App will immediately cease. You may also terminate your account at any time by disconnecting all connected platforms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-gray-300">
              You agree to indemnify and hold harmless LPDTM and its affiliates from any claims, damages, liabilities, costs, and expenses arising from your use of LPDTM Marketing Machine or your violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-gray-300">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-gray-300">
              For questions about these Terms or LPDTM Marketing Machine, please contact us at:{' '}
              <a href="mailto:support@lpdtm.com" className="text-blue-400 hover:text-blue-300">
                support@lpdtm.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}