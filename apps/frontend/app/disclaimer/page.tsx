import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Disclaimer — EZ Alertz",
  description: "Important disclaimer regarding EZ Alertz stock price alerts",
};

export default function DisclaimerPage() {
  return (
    <LegalPageLayout
      title="Disclaimer"
      description="Important information about market data and alerts."
      lastUpdated="August 16, 2026"
    >
      <section>
        <h2>Not financial advice</h2>
        <p>
          EZ Alertz is a price alert tool only. Nothing on this platform constitutes investment
          advice, a recommendation to buy or sell securities, or an offer of any financial product.
          Always do your own research or consult a qualified financial advisor before making
          investment decisions.
        </p>
      </section>

      <section>
        <h2>Market data accuracy</h2>
        <p>
          Live and delayed prices are provided by third-party data vendors and may contain errors,
          delays, or omissions. Prices shown in the app may differ from prices on your broker&apos;s
          platform or the exchange. Do not rely solely on EZ Alertz for trading decisions.
        </p>
      </section>

      <section>
        <h2>Alert delivery</h2>
        <p>
          Alerts are sent on a best-effort basis. Network issues, API outages, WhatsApp delivery
          limits, or system maintenance may cause delayed or failed notifications. EZ Alertz is not
          responsible for missed alerts or losses arising from notification failures.
        </p>
      </section>

      <section>
        <h2>Trading risks</h2>
        <p>
          Investing in securities involves risk, including the possible loss of principal. Past
          price movements do not guarantee future results. You are solely responsible for your
          trading and investment activity.
        </p>
      </section>

      <section>
        <h2>Regulatory notice</h2>
        <p>
          EZ Alertz is not registered with SEBI as an investment adviser or research analyst. The
          Service is a personal productivity tool for price monitoring and does not constitute
          regulated investment services.
        </p>
      </section>
    </LegalPageLayout>
  );
}
