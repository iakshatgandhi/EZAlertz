import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Contact — EZ Alertz",
  description: "Contact EZ Alertz for support and inquiries",
};

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact"
      description="Get in touch for support, feedback, or legal inquiries."
      lastUpdated="August 16, 2026"
    >
      <section>
        <h2>Support</h2>
        <p>
          For help with your account, alerts, or WhatsApp notifications, email us at{" "}
          <a
            href="mailto:support@ezalertz.local"
            className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            support@ezalertz.local
          </a>
          . We aim to respond within 2–3 business days.
        </p>
      </section>

      <section>
        <h2>Privacy requests</h2>
        <p>
          To request access to, correction of, or deletion of your personal data, contact{" "}
          <a
            href="mailto:privacy@ezalertz.local"
            className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            privacy@ezalertz.local
          </a>
          . See our{" "}
          <Link href="/privacy" className="text-brand-600 hover:text-brand-500 dark:text-brand-400">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
      </section>

      <section>
        <h2>Feedback</h2>
        <p>
          We welcome suggestions to improve EZ Alertz. Share your ideas at{" "}
          <a
            href="mailto:feedback@ezalertz.local"
            className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            feedback@ezalertz.local
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Self-hosted deployments</h2>
        <p>
          If you are running EZ Alertz locally for personal use, support is community-based. Check
          the project README for setup and troubleshooting guidance.
        </p>
      </section>
    </LegalPageLayout>
  );
}
