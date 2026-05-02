import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Marketing Machine LPDTM',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            <strong>Last updated:</strong> May 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using Marketing Machine LPDTM ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-300">
              Marketing Machine LPDTM is a social media content management platform that allows users to review, approve, and publish content to various social media platforms including TikTok. The Service facilitates content workflow management between content creators and reviewers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>You are responsible for all content you submit, approve, or publish through the Service</li>
              <li>You must have the right to publish any content you submit</li>
              <li>You agree to comply with all applicable laws and the terms of service of connected platforms (TikTok, Instagram, etc.)</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Content Guidelines</h2>
            <p className="text-gray-300">
              You agree not to submit, approve, or publish content that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
              <li>Violates any laws or regulations</li>
              <li>Infringes intellectual property rights of others</li>
              <li>Contains hate speech, harassment, or discrimination</li>
              <li>Is spam or deceptive</li>
              <li>Contains malware or harmful code</li>
              <li>Violates the terms of service of connected platforms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-gray-300">
              The Service integrates with third-party platforms including TikTok. Your use of these platforms is subject to their respective terms of service and privacy policies. We are not responsible for the actions, content, or policies of these third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Disclaimers</h2>
            <p className="text-gray-300">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE ARE NOT RESPONSIBLE FOR ANY DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Modifications</h2>
            <p className="text-gray-300">
              We reserve the right to modify these Terms at any time. Continued use of the Service after modifications constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-gray-300">
              We may terminate or suspend your access to the Service at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p className="text-gray-300">
              For questions about these Terms, please contact us at:{' '}
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