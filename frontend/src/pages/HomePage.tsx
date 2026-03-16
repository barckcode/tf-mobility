import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { TrafficIntensity } from '@/components/Traffic/TrafficIntensity';
import { Tourism } from '@/components/Tourism/Tourism';
import { Contracts } from '@/components/Contracts/Contracts';
import { Promises } from '@/components/Promises/Promises';
import { Alternatives } from '@/components/Alternatives/Alternatives';
import { Comparison } from '@/components/Comparison/Comparison';
import { Footer } from '@/components/Footer/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <Header />
      <main>
        <Hero />
        <TrafficIntensity />
        <Tourism />
        <Contracts />
        <Promises />
        <Alternatives />
        <Comparison />
      </main>
      <Footer />
    </div>
  );
}
