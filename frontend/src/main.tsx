import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';

import FirstPage from './pagelight/Lfirstpage';
import Pantee from './pagelight/Lpantee';
import Panteefirstpage from './pagelight/Lpanteefirstpage';
import PermissionPage from './pagelight/Lpermission';
import DfirstPage from './pagedark/Dfirstpage';
import Dpantee from './pagedark/Dpantee';
import Dpermission from './pagedark/Dpermission';
import Test from './page/test';
import Lhome from './pagelight/Lhome';
import Dhome from './pagedark/Dhome';
import Ladd from './pagelight/Ladd';
import AddMap from './pagelight/Laddmap';
import LCardInfo from './pagelight/Lcardinfo';
import Loading from './pagelight/Loading';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/pantee" element={<Pantee />} />
        <Route path="/panteefirstpage" element={<Panteefirstpage />} />
        <Route path="/permission" element={<PermissionPage />} />
        <Route path="/d" element={<DfirstPage />} />
        <Route path="/dpantee" element={<Dpantee />} />
        <Route path="/dpermission" element={<Dpermission />} />
        <Route path="/test" element={<Test />} />
        <Route path="/home" element={<Lhome />} />
        <Route path="/dhome" element={<Dhome />} />
        <Route path="/add" element={<Ladd />} />
        <Route path="/addmap" element={<AddMap />} />
        <Route path="/cardinfo/:stripId" element={<LCardInfo />} />
        <Route path="/loading" element={<Loading />} />
      </Routes>
    </Router>
  </StrictMode>
);