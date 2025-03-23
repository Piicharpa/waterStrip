import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import FirstPage from './page/firstpage';
import Pantee from './page/pantee';
import PermissionPage from './page/permission';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/pantee" element={<Pantee />} />
        <Route path="/permission" element={<PermissionPage />} />
      </Routes>
    </Router>
  </StrictMode>
);