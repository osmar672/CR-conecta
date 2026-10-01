import { Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Home } from '../pages/Home';
import { Needs } from '../pages/Needs';
import { Panel } from '../pages/Panel';
import { Access } from '../pages/Access';
import { Profile } from '../pages/Profile';
import { Donate } from '../pages/Donate';
import { RequestForm } from '../pages/RequestForm';
import { Chat } from '../pages/Chat';

export function AppRoutes({ session, onLogin, onOpenGoogleAuth, onOpenNeedModal, onLogout }) {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home onOpenNeedModal={onOpenNeedModal} />} />
        <Route path="/necesidades" element={<Needs onOpenNeedModal={onOpenNeedModal} />} />
        <Route path="/panel" element={<Panel session={session} onLogin={onLogin} onOpenGoogleAuth={onOpenGoogleAuth} />} />
        <Route path="/acceso" element={<Access onOpenGoogleAuth={onOpenGoogleAuth} />} />
        <Route path="/perfil" element={<Profile session={session} onUpdateSession={onLogin} onLogout={onLogout} onOpenGoogleAuth={onOpenGoogleAuth} />} />
        <Route path="/donar" element={<Donate session={session} />} />
        <Route path="/solicitar" element={<RequestForm session={session} />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Home onOpenNeedModal={onOpenNeedModal} />} />
      </Routes>
    </ErrorBoundary>
  );
}
