import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { Contracts } from '@/components/Contracts/Contracts';
import { Promises } from '@/components/Promises/Promises';
import { Footer } from '@/components/Footer/Footer';

function App() {
  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <Header />
      <main>
        <Hero />
        <Contracts />
        <Promises />
      </main>
      <Footer />
    </div>
  );
}

export default App;
