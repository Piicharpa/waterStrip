import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';

import FirstPage from './pagelight/Lfirstpage';
import Pantee from './pagelight/Lpantee';
import PermissionPage from './pagelight/Lpermission';
import DfirstPage from './pagedark/Dfirstpage';
import Dpantee from './pagedark/Dpantee';
import Dpermission from './pagedark/Dpermission';
import Test from './page/test';
import Lhome from './pagelight/Lhome';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/pantee" element={<Pantee />} />
        <Route path="/permission" element={<PermissionPage />} />
        <Route path="/d" element={<DfirstPage />} />
        <Route path="/dpantee" element={<Dpantee />} />
        <Route path="/dpermission" element={<Dpermission />} />
        <Route path="/t" element={<Test />} />
        <Route path="/home" element={<Lhome />} />
      </Routes>
    </Router>
  </StrictMode>
);