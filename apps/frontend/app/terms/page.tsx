import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service — EZ Alertz",
  description: "Terms of Service for EZ Alertz stock price alert application",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Please read these terms carefully before using EZ Alertz."
      lastUpdated="August 16, 2026"
    >
      <section>
        <h2>1. Acceptance of terms</h2>
        <p>
          By accessing or using EZ Alertz (&quot;the Service&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of service</h2>
        <p>
          EZ Alertz provides stock price monitoring and alert notifications for Indian equities
          listed on NSE and BSE. Alerts may be delivered via WhatsApp or other channels you
          configure. The Service is intended for personal, non-commercial use unless otherwise agreed.
        </p>
      </section>

      <section>
        <h2>3. User accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity under your account. You must provide accurate information when registering and
          keep your contact details up to date.
        </p>
      </section>

      <section>
        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of applicable regulations</li>
          <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
          <li>Interfere with or disrupt the Service, including automated scraping or abuse of APIs</li>
          <li>Resell, redistribute, or commercially exploit market data obtained through the Service</li>
        </ul>
      </section>

      <section>
        <h2>5. Market data and alerts</h2>
        <p>
          Price data is sourced from third-party providers (including Upstox) and may be delayed,
          incomplete, or inaccurate. Alerts are provided on a best-effort basis. We do not guarantee
          timely delivery of notifications or that alerts will trigger at exact price levels.
        </p>
      </section>

      <section>
        <h2>6. No investment advice</h2>
        <p>
          EZ Alertz does not provide investment, financial, legal, or tax advice. Alerts are
          informational tools only. You are solely responsible for your investment decisions.
        </p>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, EZ Alertz and its operators shall not be liable for
          any indirect, incidental, special, or consequential damages arising from your use of the
          Service, including losses related to trading decisions or missed alerts.
        </p>
      </section>

      <section>
        <h2>8. Changes and termination</h2>
        <p>
          We may modify these terms or discontinue the Service at any time. Continued use after
          changes constitutes acceptance. We may suspend or terminate accounts that violate these
          terms.
        </p>
      </section>

      <section>
        <h2>9. Governing law</h2>
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of courts in India.
        </p>
      </section>
    </LegalPageLayout>
  );
}
