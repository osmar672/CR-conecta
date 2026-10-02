import { useCallback, useEffect, useState } from 'react';
import { TriangleAlert, ArrowRightLeft } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './components/Logo';
import { GoogleAccessModal } from './components/GoogleAccessModal';
import { NeedDetailModal } from './components/NeedDetailModal';
import { Confirm, RoleAvatar, roleIcons } from './components/ShellParts';
import { api } from './lib/api';
import { useData } from './lib/useData';
import { AppRoutes } from './routes/AppRoutes';

function Shell() {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const { data: users = [], state: usersState, retry: retryUsers } = useData('/auth/demo-users');
  const navigate = useNavigate();
  const location = useLocation();

  const closeGoogleModal = useCallback(() => setGoogleModalOpen(false), []);
  const login = useCallback((user) => {
    setSession(user);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    api('/auth/session')
      .then(user => {
        if (mounted) setSession(user);
      })
      .catch(error => {
        if (error.status !== 401) console.error('No se pudo restaurar la sesión:', error);
      })
      .finally(() => {
        if (mounted) setSessionReady(true);
      });
    const handleUnauthorized = () => setSession(null);
    window.addEventListener('cr:unauthorized', handleUnauthorized);
    return () => {
      mounted = false;
      window.removeEventListener('cr:unauthorized', handleUnauthorized);
    };
  }, []);

  // Título de pestaña según la pantalla
  useEffect(() => {
    const titles = {
      '/': 'Inicio', '/necesidades': 'Necesidades', '/panel': 'Panel de gestión', '/acceso': 'Acceso',
      '/perfil': 'Perfil', '/donar': 'Donar', '/solicitar': 'Solicitar ayuda', '/chat': 'Asistente'
    };
    const t = titles[location.pathname];
    document.title = t ? `${t} · CR Conecta` : 'CR Conecta — Conectando personas · Construyendo paz';
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const logout = () => {
    setConfirm({
      title: 'Cerrar sesión',
      text: '¿Querés cerrar la sesión activa de demostración?',
      action: async () => {
        try {
          await api('/auth/logout', { method: 'POST' });
          setSession(null);
          setConfirm(null);
          navigate('/');
        } catch (error) {
          setConfirm(current => current ? { ...current, error: error.message || 'No se pudo cerrar la sesión.' } : current);
        }
      }
    });
  };

  return (
    <>
      {/* Top Banner Matching Mockup */}
      <div className="top-strip">
        PROPUESTA VISUAL · DATOS Y RECORRIDOS DE DEMOSTRACIÓN
      </div>

      {usersState === 'error' && (
        <div className="api-banner" role="alert">
          <TriangleAlert className="i i-l" size={15} />
          No se pudo conectar con la API local. Ejecutá <code>npm run server</code> en otra terminal.
          <button type="button" onClick={retryUsers}>Reintentar</button>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="header">
        <Link className="brand" to="/">
          <Logo />
        </Link>

        <nav>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/necesidades">Necesidades</NavLink>
          <NavLink to="/donar">Donar</NavLink>
          <NavLink to="/panel">Panel de gestión</NavLink>
          <NavLink to="/chat">Asistente</NavLink>
        </nav>

        <div className="header-actions">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="profile-chip" onClick={() => navigate('/perfil')}>
                <RoleAvatar src={roleIcons[session.role] || '/logo-mark.png'} alt={session.role} size={36} />
                <div>
                  <div style={{ lineHeight: '1.1' }}>{session.name.split(' ')[0]}</div>
                  <small style={{ fontSize: '11px', color: '#52758e', fontWeight: '600' }}>{session.role}</small>
                </div>
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setGoogleModalOpen(true)}
                title="Cambiar de cuenta de demostración (Google/Gmail)"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                Cambiar rol<ArrowRightLeft className="i i-r" size={14} />
              </button>
            </div>
          ) : (
            <button className="btn primary" onClick={() => setGoogleModalOpen(true)}>
              Quiero ayudar
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main aria-busy={!sessionReady}>
        <AppRoutes session={session} onLogin={login} onOpenGoogleAuth={() => setGoogleModalOpen(true)} onOpenNeedModal={setSelectedNeed} onLogout={logout} />
      </main>

      {/* Global Footer */}
      <footer>
        <div style={{ alignItems: 'center' }}>
          <img src="/logo-mark.png" width="32" height="32" alt="Logo de CR Conecta" style={{ borderRadius: 8 }} />
          <strong>CR CONECTA</strong>
          <span>Prototipo académico · Información ficticia para demostración</span>
        </div>
        <span>Google/Gmail · GPS · n8n · firmas · certificados: simulados</span>
      </footer>

      {/* Google/Gmail Visual Auth Modal (RF-01, RF-02) */}
      <GoogleAccessModal
        isOpen={googleModalOpen}
      onClose={closeGoogleModal}
        users={users || []}
        onSelectUser={(u) => {
          login(u);
          navigate('/panel');
        }}
      />

      {/* Limited Need Card Modal for Donors & Volunteers (RF-06) */}
      <NeedDetailModal
        isOpen={Boolean(selectedNeed)}
        onClose={() => setSelectedNeed(null)}
        need={selectedNeed}
      />

      {/* Logout confirmation modal */}
      {confirm && (
        <Confirm
          title={confirm.title}
          text={confirm.text}
          error={confirm.error}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return <Shell />;
}
