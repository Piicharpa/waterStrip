import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';

import FirstPage from './pagelight/Lfirstpage';
import Pantee from './pagelight/Lpantee';
import PermissionPage from './pagelight/Lpermission';
import Wave from './component/wave';
import DfirstPage from './pagedark/Dfirstpage';
import Dpantee from './pagedark/Dpantee';
import Dpermission from './pagedark/Dpermission';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/d" element={<DfirstPage />} />
        <Route path="/pantee" element={<Pantee />} />
        <Route path="/dpantee" element={<Dpantee />} />
        <Route path="/permission" element={<PermissionPage />} />
        <Route path="/dpermission" element={<Dpermission />} />
        <Route path="/wave" element={<Wave />} />
      </Routes>
    </Router>
  </StrictMode>
);