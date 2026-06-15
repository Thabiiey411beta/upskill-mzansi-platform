import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import BusinessSolutions from './pages/BusinessSolutions';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/business" element={<BusinessSolutions />} />
      </Routes>
    </Router>
  );
}

export default App;
