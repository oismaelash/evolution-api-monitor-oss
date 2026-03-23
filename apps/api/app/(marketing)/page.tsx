import { MarketingFeatures } from '@/components/marketing/marketing-features';
import { MarketingHero } from '@/components/marketing/marketing-hero';
import { MarketingOssVsCloud } from '@/components/marketing/marketing-oss-vs-cloud';

export default function MarketingPage() {
  return (
    <main>
      <MarketingHero />
      <MarketingFeatures />
      <MarketingOssVsCloud />
    </main>
  );
}
