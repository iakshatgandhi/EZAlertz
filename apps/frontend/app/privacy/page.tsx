import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — EZ Alertz",
  description: "Privacy Policy for EZ Alertz stock price alert application",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your information."
      lastUpdated="August 16, 2026"
    >
      <section>
        <h2>1. Information we collect</h2>
        <p>When you use EZ Alertz, we may collect:</p>
        <ul>
          <li>Account information: email address and hashed password</li>
          <li>Contact information: WhatsApp phone number (if you provide it)</li>
          <li>Alert data: stocks you monitor, target prices, and alert history</li>
          <li>Technical data: session cookies, IP address, and usage logs for security and debugging</li>
        </ul>
      </section>

      <section>
        <h2>2. How we use your information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Authenticate you and manage your account</li>
          <li>Monitor stock prices and send alert notifications</li>
          <li>Improve reliability, security, and performance of the Service</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>3. Third-party services</h2>
        <p>
          We integrate with third parties to operate the Service, including Upstox (market data),
          WhatsApp Cloud API (notifications), and hosting providers. These services process data
          according to their own privacy policies. We only share the minimum data required for each
          integration.
        </p>
      </section>

      <section>
        <h2>4. Data retention</h2>
        <p>
          Active alerts are stored while you maintain them. Triggered one-time alerts are kept in
          history for 24 hours, then automatically deleted. Account data is retained until you delete
          your account or we no longer need it for legitimate purposes.
        </p>
      </section>

      <section>
        <h2>5. Cookies and sessions</h2>
        <p>
          We use HTTP-only session cookies to keep you signed in. These are essential for the
          Service to function and are not used for advertising or cross-site tracking.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We implement reasonable technical measures to protect your data, including encrypted
          connections (HTTPS), hashed passwords, and secure session management. No system is
          completely secure; use a strong, unique password for your account.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting
          us. You can update your WhatsApp number and delete alerts directly in the app.
        </p>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>
          The Service is not intended for users under 18 years of age. We do not knowingly collect
          data from children.
        </p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected
          by updating the &quot;Last updated&quot; date above.
        </p>
      </section>
    </LegalPageLayout>
  );
}
