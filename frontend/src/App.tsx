import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { TransitPage } from '@/pages/TransitPage';
import { ContractsPage } from '@/pages/ContractsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/transporte-publico" element={<TransitPage />} />
      <Route path="/contratos" element={<ContractsPage />} />
    </Routes>
  );
}

export default App;
