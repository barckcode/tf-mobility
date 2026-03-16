import { Header } from '@/components/Header/Header';
import { DataSources } from '@/components/DataSources/DataSources';
import { Hero } from '@/components/Hero/Hero';
import { Tourism } from '@/components/Tourism/Tourism';
import { Contracts } from '@/components/Contracts/Contracts';
import { Promises } from '@/components/Promises/Promises';
import { Alternatives } from '@/components/Alternatives/Alternatives';
import { Comparison } from '@/components/Comparison/Comparison';
import { Footer } from '@/components/Footer/Footer';
import { DataFreshness } from '@/components/DataFreshness/DataFreshness';

function App() {
  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <Header />
      <main>
        <DataSources />
        <Hero />
        <Tourism />
        <Contracts />
        <Promises />
        <Alternatives />
        <Comparison />
      </main>
      <DataFreshness />
      <Footer />
    </div>
  );
}

export default App;
