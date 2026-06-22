import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import FilesPage from './pages/FilesPage';
import SharePage from './pages/SharePage';

function AppContent() {
  const location = useLocation();
  // Don't show navbar on share page (public-facing)
  const isSharePage = location.pathname.startsWith('/share/');

  return (
    <>
      {!isSharePage && <Navbar />}
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/share/:shareId" element={<SharePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}