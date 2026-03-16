import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { TransitPage } from '@/pages/TransitPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/transporte-publico" element={<TransitPage />} />
    </Routes>
  );
}

export default App;
