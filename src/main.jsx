import React, { useEffect, useMemo, useState } from 'react';
import { TriangleAlert, AlertTriangle, ArrowRight, ArrowRightLeft, ArrowUpRight, Check, CheckCircle2, FileText, House, Info, Lock, MapPin, MessageSquare, Package, PenLine, Pencil, QrCode, Shirt, Star } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import './styles/global.css';

import { Logo } from './components/Logo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { API_URL } from './constants/config';
import { GoogleAccessModal, GoogleIcon } from './components/GoogleAccessModal';
import { NeedDetailModal } from './components/NeedDetailModal';
import { RequestEvaluationModal } from './components/RequestEvaluationModal';
import { BeneficiarySection } from './components/BeneficiarySection';
import { ProfileEditModal } from './components/ProfileEditModal';
import { SponsorsSection } from './components/SponsorsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { CommunityCoverageSection } from './components/CommunityCoverageSection';
import { AidServicesSection } from './components/AidServicesSection';
import { CATEGORY_LIMITS, checkRequestLimits } from './constants/limits';

const API = API_URL;
const roles = ['Administrador', 'Beneficiario', 'Donante individual', 'Empresa donante', 'Voluntario', 'Aliado comunitario'];
const roleIcons = {
  'Administrador': 'AD',
  'Beneficiario': 'BE',
  'Donante individual': 'DO',
  'Empresa donante': 'EM',
  'Voluntario': 'VO',
  'Aliado comunitario': 'AL'
};

async function api(path, options = {}) {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!r.ok) throw new Error('No se pudo completar la operación con JSON Server');
  return r.status === 204 ? null : r.json();
}

function useData(path, refreshTrigger = 0) {
  const [data, setData] = useState([]);
  const [state, setState] = useState('loading');
  const load = () => {
    setState('loading');
    api(path)
      .then(x => { setData(Array.isArray(x) ? x : (x ?? [])); setState('ready'); })
      .catch(() => setState('error'));
  };
  useEffect(load, [path, refreshTrigger]);
  return { data, state, retry: load };
}

function Confirm({ title, text, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-mark">!</div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn primary" onClick={onConfirm}>Continuar</button>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cr_session') || 'null');
    } catch {
      return null;
    }
  });
  const [confirm, setConfirm] = useState(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const { data: users = [], state: usersState, retry: retryUsers } = useData('/users');
  const navigate = useNavigate();
  const location = useLocation();

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

  const login = (u) => {
    localStorage.setItem('cr_session', JSON.stringify(u));
    setSession(u);
  };

  const logout = () => {
    setConfirm({
      title: 'Cerrar sesión',
      text: '¿Querés cerrar la sesión activa de demostración?',
      action: () => {
        localStorage.removeItem('cr_session');
        setSession(null);
        setConfirm(null);
        navigate('/');
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
          No se pudo conectar con JSON Server ({API}). Ejecutá <code>npm run server</code> en otra terminal.
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
          <NavLink to="/panel">Panel de gestión</NavLink>
          <NavLink to="/chat">Asistente</NavLink>
        </nav>

        <div className="header-actions">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="profile-chip" onClick={() => navigate('/perfil')}>
                <span>{roleIcons[session.role] || 'US'}</span>
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
      <main>
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home onOpenNeedModal={setSelectedNeed} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/necesidades" element={<Needs session={session} onOpenNeedModal={setSelectedNeed} />} />
          <Route path="/panel" element={<Panel session={session} onLogin={login} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/acceso" element={<Access onLogin={login} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/perfil" element={<Profile session={session} onUpdateSession={login} onLogout={logout} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/donar" element={<Donate session={session} />} />
          <Route path="/solicitar" element={<RequestForm session={session} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Home onOpenNeedModal={setSelectedNeed} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
        </Routes>
        </ErrorBoundary>
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
        onClose={() => setGoogleModalOpen(false)}
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
        session={session}
      />

      {/* Logout confirmation modal */}
      {confirm && (
        <Confirm
          title={confirm.title}
          text={confirm.text}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// -------------------------------------------------------------
// HOME PAGE COMPONENT (MATCHING MOCKUP WITH EXTREME PRECISION)
// -------------------------------------------------------------
function Home({ onOpenNeedModal, onOpenGoogleAuth }) {
  const { data: reqs = [] } = useData('/requests');
  const { data: transfers = [] } = useData('/transfers');
  const { data: allies = [] } = useData('/allies');
  const { data: facilities = [] } = useData('/facilities');
  const navigate = useNavigate();

  // Pick sample requests or fallback to mockup items
  const displayNeeds = useMemo(() => {
    if (reqs && reqs.length > 0) {
      return reqs.filter(r => r.status === 'Aprobada' || r.id === 'CC-204' || r.id === 'CC-205' || r.id === 'CC-206').slice(0, 3);
    }
    return [
      { id: 'CC-204', category: 'Alimentos sellados', description: 'Paquete de alimentos sellados', amount: 18, unit: 'paquetes', zone: 'Barranca', priority: 'Alta', goal: 18, received: 8 },
      { id: 'CC-205', category: 'Vestimenta', description: 'Vestimenta para una familia', amount: 12, unit: 'piezas', zone: 'El Roble', priority: 'Media', goal: 12, received: 9 },
      { id: 'CC-206', category: 'Mobiliario', description: 'Mesa y sillas esenciales', amount: 1, unit: 'lote', zone: 'Chacarita', priority: 'Media', goal: 1, received: 0 }
    ];
  }, [reqs]);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">UNA RED DE APOYO PARA COSTA RICA</span>
          <h1>
            Cuando nos<br />
            conectamos,<br />
            <span className="accent-text">la ayuda llega.</span>
          </h1>
          <p>
            Un espacio para acercar necesidades, donaciones y personas voluntarias. Descubrí cómo podés aportar a tu comunidad.
          </p>
          <div className="hero-buttons">
            <Link className="btn primary" to="/necesidades">
              Ver necesidades<ArrowUpRight className="i i-r" size={14} />
            </Link>
            <Link className="btn secondary" to="/donar">
              Quiero donar<ArrowRight className="i i-r" size={14} />
            </Link>
          </div>
          <div className="micro">
            <i /> Prototipo académico · Información ficticia
          </div>
        </div>

        {/* Right Map Card matching Mockup */}
        <div className="map-card">
          <div className="section-head">
            <h3>Conexiones en la comunidad</h3>
            <span className="tag">MAPA SIMULADO</span>
          </div>

          <div className="map">
            {/* Ambient wavy SVG background */}
            <svg className="map-bg-svg" viewBox="0 0 500 330" preserveAspectRatio="none">
              <path d="M-10 140 Q 140 60 280 160 T 520 120 L 520 340 L -10 340 Z" fill="#c7e1ec" opacity="0.65" />
              <path d="M-10 190 Q 150 130 310 220 T 520 180 L 520 340 L -10 340 Z" fill="#e2f1f5" opacity="0.8" />
              {/* Dotted route curve with smooth GPU-optimized animated dash */}
              <path 
                className="route-dash-animated"
                d="M 140 89 Q 255 40 370 125 Q 330 190 240 181" 
                stroke="#257a9e" 
                strokeWidth="4" 
                strokeDasharray="6,8" 
                fill="none" 
                vectorEffect="non-scaling-stroke" 
              />
            </svg>

            <div className="map-label">PUNTARENAS</div>

            {/* Nodos del mapa (posición en % para que coincidan con la ruta) */}
            <div className="map-node" style={{ left: '28%', top: '27%' }}>1</div>
            <div className="map-node" style={{ left: '74%', top: '38%' }}>2</div>
            <div className="map-node alt" style={{ left: '48%', top: '55%' }}>3</div>

            {/* Floating Delivery Status Card at Bottom of Map */}
            <div className="delivery-card">
              <div className="delivery-card-top">
                <b>Ejemplo de entrega · #CC-204</b>
                <span>En ruta</span>
              </div>
              <div className="stepper-line">
                <div className="stepper-node n1" />
                <div className="stepper-node n2" />
                <div className="stepper-node n3" />
              </div>
              <div className="stepper-labels">
                <span>Registrada</span>
                <span style={{ color: '#257a9e', fontWeight: '700' }}>En traslado</span>
                <span>Entregada</span>
              </div>
            </div>
          </div>

          <div className="map-note">
            <i /> Ubicaciones representadas con datos de ejemplo
          </div>
        </div>
      </section>

      {/* Remodeled Section: ¿Qué ayudas ofrecemos? (Categorías de apoyo + Casos activos) */}
      <AidServicesSection 
        displayNeeds={displayNeeds} 
        onOpenNeedModal={onOpenNeedModal} 
      />

      {/* 1. Informative Section: How CR Conecta Works */}
      <HowItWorksSection />

      {/* 2. Informative Section: Sponsors & Strategic Allies */}
      <SponsorsSection allies={allies || []} />

      {/* 3. Informative Section: Territorial Coverage & Facilities */}
      <CommunityCoverageSection facilities={facilities || []} />

      {/* Impact Indicators */}
      <section className="impact-strip">
        <div>
          <span className="eyebrow">DATOS DEL PROTOTIPO</span>
          <h2>Una vista clara del recorrido.</h2>
        </div>
        <div className="metrics">
          <div className="metric">
            <strong>{reqs?.length || '04'}</strong>
            <span>Solicitudes registradas</span>
          </div>
          <div className="metric">
            <strong>{transfers?.length || '02'}</strong>
            <span>Traslados en curso</span>
          </div>
          <div className="metric">
            <strong>08</strong>
            <span>Estados simulados</span>
          </div>
        </div>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// NEED CARD MATCHING MOCKUP DESIGN
// -------------------------------------------------------------
function MockupNeedCard({ r, index, onSelect }) {
  // Pre-configured mock values for visual harmony matching mockup
  const mockPercentages = [45, 70, 25];
  const progress = r.received && r.goal 
    ? Math.min(100, Math.round((r.received / r.goal) * 100))
    : (mockPercentages[index % 3] || 50);

  const icons = [<Package size={22} />, <Shirt size={22} />, <House size={22} />];

  return (
    <article className={`need-card c${index % 3}`}>
      {/* Top Graphic Header */}
      <div className="need-top">
        <div className="icon-square">
          {icons[index % 3]}
        </div>
      </div>

      {/* Body Content */}
      <div className="need-body">
        <span className={`priority ${(r.priority || 'media').toLowerCase()}`}>
          PRIORIDAD {(r.priority || 'MEDIA').toUpperCase()}
        </span>

        <h3>{r.description}</h3>
        <p>{r.zone} · Progreso de ejemplo {progress}%</p>

        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="need-foot">
          <span>{r.category}</span>
          <button type="button" onClick={onSelect}>
            Ver ficha pública (RF-06)<ArrowRight className="i i-r" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// NEEDS PAGE (PUBLIC LIST WITH FILTERS & RF-06 ACCESS)
// -------------------------------------------------------------
function Needs({ session, onOpenNeedModal }) {
  const { data: reqs = [], state, retry } = useData('/requests');
  const [filter, setFilter] = useState('Todas');
  const navigate = useNavigate();

  const approvedList = useMemo(() => {
    return (reqs || []).filter(r => {
      const matchStatus = r.status === 'Aprobada';
      const matchPriority = filter === 'Todas' || r.priority === filter;
      return matchStatus && matchPriority;
    });
  }, [reqs, filter]);

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">OPORTUNIDADES PARA AYUDAR</span>
        <h1>Necesidades cerca de vos</h1>
        <p>
          Solicitudes aprobadas por la administración con datos generales para proteger la identidad de las personas beneficiarias (RF-06).
        </p>
      </div>

      <div className="filter-row">
        <div className="pills">
          <Link className="btn primary" to="/solicitar" style={{ padding: '8px 18px', fontSize: '12px' }}>
            + Solicitar ayuda (RF-07)
          </Link>
          {['Todas', 'Alta', 'Media', 'Baja'].map(x => (
            <button
              key={x}
              className={filter === x ? 'active' : ''}
              onClick={() => setFilter(x)}
            >
              {x === 'Todas' ? 'Todas las prioridades' : `Prioridad ${x}`}
            </button>
          ))}
        </div>
        <span className="simulated">
          Datos ficticios · Vista pública protegida (RF-06)
        </span>
      </div>

      {state === 'loading' ? (
        <div className="state"><div className="state-icon">…</div><h3>Cargando solicitudes...</h3></div>
      ) : state === 'error' ? (
        <div className="state">
          <div className="state-icon">!</div>
          <h3>Error de conexión con JSON Server</h3>
          <p>Verificá que el servidor local en el puerto 3001 esté activo.</p>
          <button className="btn secondary" onClick={retry}>Reintentar</button>
        </div>
      ) : approvedList.length === 0 ? (
        <div className="state">
          <div className="state-icon"><Check size={24} /></div>
          <h3>No hay solicitudes aprobadas con este filtro</h3>
          <p>Podés cambiar de filtro o ingresar al panel administrativo para evaluar solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="large-grid">
          {approvedList.map((r, i) => (
            <MockupNeedCard
              key={r.id}
              r={r}
              index={i}
              onSelect={() => onOpenNeedModal(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ACCESS PAGE (RF-01, RF-02 GOOGLE & ROLE SELECTION)
// -------------------------------------------------------------
function Access({ onLogin, onOpenGoogleAuth }) {
  const { data: users = [], state } = useData('/users');
  const navigate = useNavigate();

  const handleSelect = (u) => {
    onLogin(u);
    navigate('/panel');
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ACCESO Y PERFILES DE DEMOSTRACIÓN</span>
        <h1>Entrá a CR Conecta</h1>
        <p>
          Accedé mediante la simulación visual de Google/Gmail o seleccioná una cuenta precargada de prueba.
        </p>
      </div>

      {/* Prominent Google Access Card (RF-02) */}
      <div 
        style={{
          background: '#ffffff',
          border: '1px solid #dce8ec',
          borderRadius: '18px',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GoogleIcon size={24} />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#09274c' }}>
              Acceso visual tipo Google / Gmail (RF-02)
            </h3>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#63788b', maxWidth: '580px' }}>
            Simula la experiencia de autenticación de un clic vinculando un correo ficticio de <code>db.json</code> con su respectivo perfil y rol.
          </p>
        </div>

        <button 
          type="button" 
          className="btn secondary"
          onClick={onOpenGoogleAuth}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            border: '1.5px solid #d5e1e7',
            padding: '12px 24px',
            fontSize: '13.5px',
            fontWeight: '700'
          }}
        >
          <GoogleIcon size={18} />
          Continuar con Google<ArrowRight className="i i-r" size={14} />
        </button>
      </div>

      {/* Disclaimer Notice */}
      <div 
        style={{
          background: '#eef5f8',
          border: '1px solid #d5e6ec',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '28px',
          fontSize: '12px',
          color: '#34556e'
        }}
      >
        <Info size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Aviso institucional:</strong> Google, Gmail y los flujos con n8n no autentican realmente; no representan servicios ni entregas reales. Todas las operaciones usan datos ficticios almacenados en <code>db.json</code>.
        </div>
      </div>

      {/* Grid of All Preloaded Accounts */}
      <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: '#09274c' }}>
        O elegí directamente una cuenta de demostración por rol (RF-01):
      </h3>

      <div className="access-grid">
        {state === 'loading' ? (
          <div className="state"><div className="state-icon">…</div><h3>Cargando cuentas...</h3></div>
        ) : (
          (users || []).map(u => (
            <button
              key={u.id}
              className="account-card"
              onClick={() => handleSelect(u)}
            >
              <div className="avatar">
                {roleIcons[u.role] || 'US'}
              </div>
              <div>
                <b>{u.name}</b>
                <small>{u.role}</small>
                <span>{u.email} · Zona: {u.zone}</span>
              </div>
              <strong>Entrar<ArrowRight className="i i-r" size={14} /></strong>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PANEL DE GESTIÓN (RF-03, RF-08, RF-09, RF-10)
// -------------------------------------------------------------
function Panel({ session, onLogin, onOpenGoogleAuth }) {
  if (!session) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">PANEL DE GESTIÓN</span>
          <h1>Acceso restringido por rol</h1>
          <p>Para ver las funciones de demostración, iniciá sesión con una cuenta de prueba.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #dce8ec' }}>
          <h3 style={{ marginBottom: '12px', color: '#09274c' }}>Ingresá con una cuenta para ver su panel</h3>
          <button className="btn primary" onClick={onOpenGoogleAuth} style={{ display: 'inline-flex', gap: '8px' }}>
            <GoogleIcon size={18} /> Iniciar sesión de demostración
          </button>
        </div>
      </div>
    );
  }

  return <PanelInner session={session} />;
}

function PanelInner({ session }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = () => setRefreshCount(c => c + 1);

  const { data: reqs = [] } = useData('/requests', refreshCount);
  const { data: dons = [] } = useData('/donations', refreshCount);
  const { data: inv = [] } = useData('/inventory', refreshCount);
  const { data: trans = [] } = useData('/transfers', refreshCount);
  const { data: allies = [] } = useData('/allies', refreshCount);
  const { data: campaigns = [] } = useData('/campaigns', refreshCount);
  const { data: jobs = [] } = useData('/jobs', refreshCount);

  const role = session.role;
  const isAdmin = role === 'Administrador';
  const isBeneficiary = role === 'Beneficiario';
  const isDonor = role === 'Donante individual';
  const isCompany = role === 'Empresa donante';
  const isVolunteer = role === 'Voluntario';
  const isAlly = role === 'Aliado comunitario';

  const [tab, setTab] = useState(isBeneficiary ? 'beneficiario' : 'resumen');
  const [evaluatingRequest, setEvaluatingRequest] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todas');

  // Available tabs depending on role (RF-03)
  const availableTabs = useMemo(() => {
    if (isAdmin) return ['resumen', 'solicitudes (RF-08/09/10)', 'inventario', 'traslados', 'empresa y aliados'];
    if (isBeneficiary) return ['beneficiario', 'empleos'];
    if (isDonor) return ['resumen', 'mis donaciones', 'necesidades'];
    if (isCompany) return ['resumen', 'campañas y empleo', 'donaciones'];
    if (isVolunteer) return ['resumen', 'traslados asignados', 'necesidades'];
    return ['resumen', 'colaboraciones'];
  }, [isAdmin, isBeneficiary, isDonor, isCompany, isVolunteer]);

  // Request Evaluation Save Handler (RF-08, RF-09, RF-10)
  const handleSaveEvaluation = async (requestId, payload) => {
    await api(`/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    triggerRefresh();
  };

  return (
    <div className="page">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="eyebrow">PANEL DE GESTIÓN · {role.toUpperCase()} (RF-03)</span>
          <h1>Hola, {session.name.split(' ')[0]}.</h1>
          <p>
            Vistas y acciones configuradas acordes con el rol de demostración. Los cambios impactan directamente en <code>db.json</code>.
          </p>
        </div>

        <button 
          type="button" 
          className="btn secondary" 
          onClick={() => setEditingProfile(true)}
          style={{ padding: '9px 18px', fontSize: '12px' }}
        >
          Editar perfil (RF-04)<Pencil className="i i-r" size={14} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="panel-tabs">
        {availableTabs.map(t => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* BENEFICIARY DEDICATED VIEW (RF-05, RF-07, RF-10) */}
      {isBeneficiary && (tab === 'beneficiario' || tab === 'resumen') && (
        <BeneficiarySection
          session={session}
          requests={reqs}
          onOpenEditProfile={() => setEditingProfile(true)}
          onRefreshRequests={triggerRefresh}
        />
      )}

      {/* GENERAL DASHBOARD METRICS */}
      {tab === 'resumen' && !isBeneficiary && (
        <div className="dashboard">
          <div className="metric">
            <strong>{reqs?.length ?? 0}</strong>
            <span>Total solicitudes</span>
          </div>
          <div className="metric">
            <strong>{dons?.length ?? 0}</strong>
            <span>Donaciones registradas</span>
          </div>
          <div className="metric">
            <strong>{inv?.length ?? 0}</strong>
            <span>Artículos en inventario</span>
          </div>
          <div className="metric">
            <strong>{trans?.length ?? 0}</strong>
            <span>Traslados en ruta</span>
          </div>

          <div className="dashboard-card wide">
            <h3>Flujo operativo de demostración (CR Conecta)</h3>
            <div className="flow-steps">
              {['1. Solicitud (RF-07)', '2. Evaluación & Límites (RF-08/10)', '3. Donación directa', '4. Traslado simulado', '5. Entrega comunitaria'].map((t, i, arr) => (
                <span className="flow-step" key={t}>
                  <span className="flow-pill">{t}</span>
                  {i < arr.length - 1 && <ArrowRight className="i flow-arrow" size={14} />}
                </span>
              ))}
            </div>
            <p style={{ marginTop: '14px', fontSize: '12px', color: '#687e91' }}>
              Todas las operaciones se ejecutan en memoria y se persisten en <code>db.json</code> usando JSON Server.
            </p>
          </div>

          <div className="dashboard-card wide">
            <h3>Alertas de inventario y stock mínimo</h3>
            {(inv || []).filter(x => x.available <= x.minimum).map(x => (
              <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2f5', fontSize: '12px' }}>
                <b>{x.product}</b>
                <span style={{ color: '#b91c1c', fontWeight: '700' }}>{x.available} disp. (mín {x.minimum})</span>
              </div>
            ))}
            {(inv || []).every(x => x.available > x.minimum) && (
              <p style={{ fontSize: '12px', color: '#15803d' }}><Check className="i i-l" size={14} />Niveles óptimos en todos los centros.</p>
            )}
          </div>
        </div>
      )}

      {/* ADMIN EVALUATION OF REQUESTS (RF-08, RF-09, RF-10) */}
      {(tab === 'solicitudes (RF-08/09/10)' || (isAdmin && tab === 'solicitudes')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header filter controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #dce8ec', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Filtrar por estado:</span>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
              >
                <option value="Todas">Todos los estados</option>
                <option value="En revisión">En revisión</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Denegada">Denegada</option>
              </select>

              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginLeft: '10px' }}>Prioridad (RF-09):</span>
              <select 
                value={filterPriority} 
                onChange={e => setFilterPriority(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
              >
                <option value="Todas">Todas las prioridades</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Total: {(reqs || []).length} solicitudes registradas
            </span>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Necesidad / Categoría</th>
                  <th>Cantidad & Límites (RF-10)</th>
                  <th>Zona</th>
                  <th>Prioridad (RF-09)</th>
                  <th>Estado</th>
                  <th>Dictamen / Excepción</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(reqs || [])
                  .filter(r => (filterStatus === 'Todas' || r.status === filterStatus) && (filterPriority === 'Todas' || r.priority === filterPriority))
                  .map(r => {
                    const isExceeded = r.limitExceeded || r.requiresException;
                    const isApproved = r.status === 'Aprobada';
                    const isDenied = r.status === 'Denegada';
                    const isPending = r.status === 'En revisión';

                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '800', color: '#06244a' }}>#{r.id}</td>
                        <td>
                          <b>{r.description}</b>
                          <small>{r.category} · Beneficiario: {r.beneficiaryId}</small>
                        </td>
                        <td>
                          <strong>{r.amount} {r.unit}</strong>
                          {isExceeded && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#b91c1c', fontWeight: '800', marginTop: '2px' }}>
                              <AlertTriangle className="i i-l" size={14} />Excede límite estándar
                            </span>
                          )}
                        </td>
                        <td><MapPin className="i i-l" size={13} />{r.zone}</td>
                        <td>
                          <span 
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: r.priority === 'Alta' ? '#ffebe8' : r.priority === 'Baja' ? '#e2f4f8' : '#fef4dc',
                              color: r.priority === 'Alta' ? '#c0392b' : r.priority === 'Baja' ? '#2980b9' : '#d35400',
                              border: '1px solid currentColor'
                            }}
                          >
                            {r.priority || 'Media'}
                          </span>
                        </td>
                        <td>
                          <span 
                            style={{
                              padding: '4px 9px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              background: isApproved ? '#dcfce7' : isDenied ? '#fee2e2' : '#fef3c7',
                              color: isApproved ? '#15803d' : isDenied ? '#b91c1c' : '#b45309'
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          {r.decisionReason ? (
                            <div>
                              <span style={{ fontSize: '12px', color: '#334155' }}>{r.decisionReason}</span>
                              <small style={{ color: '#64748b' }}>Fecha: {r.decisionDate}</small>
                              {r.exceptionGranted && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>
                                  <Star className="i i-l" size={14} />Excepción concedida
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>Pendiente de evaluación</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setEvaluatingRequest(r)}
                            style={{
                              background: isPending ? '#06244a' : '#ffffff',
                              color: isPending ? '#ffffff' : '#06244a',
                              border: '1px solid #06244a',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isPending ? <>Evaluar (RF-08/10)<ArrowRight className="i i-r" size={14} /></> : 'Editar dictamen'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DONATIONS TABLE */}
      {(tab === 'donaciones' || tab === 'mis donaciones') && (
        <DonationsView data={dons} session={session} />
      )}

      {/* INVENTORY */}
      {tab === 'inventario' && (
        <div className="large-grid">
          {inv.map(item => (
            <div key={item.id} className="dashboard-card">
              <span className="eyebrow">{item.category}</span>
              <h3>{item.product}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '10px 0' }}>
                <strong style={{ fontSize: '36px', color: '#06244a' }}>{item.available}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>disponibles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', borderTop: '1px solid #edf2f5', paddingTop: '10px' }}>
                <span>Reservadas: {item.reserved}</span>
                <span>Entregadas: {item.delivered}</span>
              </div>
              {item.available <= item.minimum && (
                <div style={{ marginTop: '10px', background: '#fee2e2', color: '#b91c1c', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                  Alerta: Nivel por debajo del mínimo ({item.minimum})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TRANSFERS */}
      {(tab === 'traslados' || tab === 'traslados asignados') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
          {trans.map(t => (
            <div key={t.id} className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#06244a' }}>Traslado #{t.id}</strong>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                  {t.status}
                </span>
              </div>
              <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{t.origin} <ArrowRight className="i" size={14} /> {t.destination}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Donación {t.donationId} · Responsable: {t.responsible}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '16px 0', fontSize: '12px' }}>
                {(t.points || []).map((p, idx) => (
                  <React.Fragment key={p}>
                    <span style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontWeight: '600' }}>{p}</span>
                    {idx < t.points.length - 1 && <span style={{ color: '#64748b' }}><ArrowRight className="i" size={14} /></span>}
                  </React.Fragment>
                ))}
              </div>
              <small style={{ fontSize: '11px', color: '#64748b' }}>GPS Y RUTA SIMULADOS (PROTOTIPO ACADÉMICO)</small>
              {t.status === 'En ruta' && (
                <button 
                  className="btn primary" 
                  style={{marginTop:'12px', padding:'8px 12px', fontSize:'11px'}}
                  onClick={async () => {
                    await api(`/transfers/${t.id}`, { method: 'PATCH', body: JSON.stringify({status: 'Entregado'}) });
                    triggerRefresh();
                    alert('Firma y fotografía simulada recolectada exitosamente (RF-27).');
                  }}
                >
                  Completar entrega (Firma)<PenLine className="i i-r" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EMPRESA Y ALIADOS (ADMIN) */}
      {tab === 'empresa y aliados' && (
        <div className="large-grid">
          {allies.map(a => (
            <div key={a.id} className="dashboard-card">
              <span className="eyebrow">{a.type}</span>
              <h3>{a.name}</h3>
              <p style={{fontSize:'12px', color:'#64748b'}}>Zona: {a.zone} | Contacto: {a.contact}</p>
              <div style={{marginTop:'10px', background:'#e0f2fe', color:'#0369a1', padding:'6px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700'}}>
                Apoyo: {a.support}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMPAÑAS Y EMPLEO (EMPRESA) */}
      {tab === 'campañas y empleo' && (
        <div>
          <h2 style={{marginBottom:'10px'}}>Mis Campañas Activas</h2>
          <div className="large-grid">
            {campaigns.filter(c => c.companyId === session.id).map(c => (
              <div key={c.id} className="dashboard-card">
                <span className="eyebrow">{c.category}</span>
                <h3>{c.name}</h3>
                <p style={{fontSize:'12px', color:'#64748b'}}>{c.description}</p>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px', fontSize:'11px', fontWeight:'700'}}>
                  <span>Progreso: {c.progress} / {c.goal} {c.unit}</span>
                  <span style={{color:'#15803d'}}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>

          <h2 style={{marginTop:'30px', marginBottom:'10px'}}>Oportunidades de Empleo (RF-40)</h2>
          <div className="large-grid">
            {jobs.filter(j => j.companyId === session.id).map(j => (
              <div key={j.id} className="dashboard-card">
                <span className="eyebrow">{j.schedule}</span>
                <h3>{j.position}</h3>
                <p style={{fontSize:'12px', color:'#64748b'}}>{j.description}</p>
                <div style={{marginTop:'10px', fontSize:'11px', color:'#334155'}}>
                  <b>Requisitos:</b> {j.requirements}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPLEOS (BENEFICIARIO) (RF-41) */}
      {tab === 'empleos' && (
        <div className="large-grid">
          {jobs.map(j => (
            <div key={j.id} className="dashboard-card">
              <span className="eyebrow">{j.company} · {j.zone}</span>
              <h3>{j.position}</h3>
              <p style={{fontSize:'12px', color:'#64748b'}}>{j.description}</p>
              <div style={{marginTop:'10px', fontSize:'11px', color:'#334155', marginBottom:'16px'}}>
                <b>Requisitos:</b> {j.requirements}
              </div>
              <button className="btn primary" onClick={() => alert('Postulación de demostración enviada. (RF-41)')}>
                Postularme (Simulación)<ArrowRight className="i i-r" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* COLABORACIONES (ALIADO) */}
      {tab === 'colaboraciones' && (
        <div className="dashboard-card wide">
          <h3>Mis espacios comunitarios</h3>
          <p style={{fontSize:'12px', color:'#64748b'}}>Sos un aliado clave en el prototipo. Podés coordinar las entregas y facilitar el acopio local.</p>
          <div style={{marginTop:'16px'}}>
            <button className="btn secondary" onClick={() => alert('Función de demostración')}>
              Ver agenda comunitaria
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {evaluatingRequest && (
        <RequestEvaluationModal
          isOpen={Boolean(evaluatingRequest)}
          onClose={() => setEvaluatingRequest(null)}
          request={evaluatingRequest}
          allRequests={reqs}
          adminSession={session}
          onSave={handleSaveEvaluation}
        />
      )}

      {editingProfile && (
        <ProfileEditModal
          isOpen={editingProfile}
          onClose={() => setEditingProfile(false)}
          user={session}
          onSaved={(updated) => {
            localStorage.setItem('cr_session', JSON.stringify(updated));
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// DONATIONS VIEW WITH QR GENERATION
// -------------------------------------------------------------
function DonationsView({ data = [], session }) {
  const [qrModal, setQrModal] = useState(null);

  const generateQR = async (d) => {
    const url = await QRCode.toDataURL(`http://localhost:5174/donacion/${d.id}`);
    setQrModal({ donation: d, qrUrl: url });
  };

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto & Donante</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>QR Local</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: '800' }}>#{d.id}</td>
                <td>
                  <b>{d.product}</b>
                  <small>{d.anonymous ? <><Lock className="i i-l" size={12} />Anónimo (Protegido)</> : `Donante: ${d.donorType}`}</small>
                </td>
                <td>{d.category}</td>
                <td>{d.quantity}</td>
                <td>{d.destination}</td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: '700' }}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => generateQR(d)}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}
                  >
                    QR<QrCode className="i i-r" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Simulando generación de certificado PDF y subida a n8n... (RF-30)\n\nCertificado generado para la donación #' + d.id)}
                    style={{ background: '#0f5132', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    PDF (RF-30)<FileText className="i i-r" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrModal && (
        <div className="modal-backdrop" onClick={() => setQrModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <span className="eyebrow">CONSULTA LOCAL SIMULADA</span>
            <h3 style={{ margin: '8px 0 4px' }}>Comprobante #{qrModal.donation.id}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
              Código QR de demostración para verificar el aporte en centros comunitarios.
            </p>
            <img src={qrModal.qrUrl} alt="QR de donación" style={{ width: '160px', height: '160px', border: '1px solid #dce8ec', borderRadius: '12px', padding: '8px' }} />
            <div style={{ marginTop: '20px' }}>
              <button className="btn secondary" onClick={() => setQrModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PROFILE PAGE (RF-04 EDIT & SESSION DISPLAY)
// -------------------------------------------------------------
function Profile({ session, onUpdateSession, onLogout, onOpenGoogleAuth }) {
  const [editing, setEditing] = useState(false);

  if (!session) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">PERFIL</span>
          <h1>Sin sesión activa</h1>
          <p>Iniciá sesión con una cuenta de prueba para ver el perfil.</p>
        </div>
        <button className="btn primary" onClick={onOpenGoogleAuth}>Entrar con Google / Demo</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">PERFIL DE DEMOSTRACIÓN (RF-04)</span>
        <h1>{session.name}</h1>
        <p>Datos no sensibles y ficticios. Podés editar tu información y guardarla en <code>db.json</code>.</p>
      </div>

      <div 
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #dce8ec',
          padding: '30px',
          maxWidth: '680px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#06244a', color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: '800' }}>
            {roleIcons[session.role] || 'US'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#06244a' }}>{session.name}</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: '700' }}>
                Rol: {session.role}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Zona: {session.zone}</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div><strong>Correo ficticio:</strong> {session.email}</div>
          <div><strong>Teléfono:</strong> {session.phone || '+506 8888-0000'}</div>
          <div><strong>Zona comunitaria:</strong> {session.zone}</div>
          {session.notes && <div><strong>Notas del perfil:</strong> {session.notes}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => setEditing(true)}>
              Editar mis datos (RF-04)<Pencil className="i i-r" size={14} />
            </button>
            <button className="btn secondary" onClick={onOpenGoogleAuth}>
              Cambiar cuenta<ArrowRightLeft className="i i-r" size={14} />
            </button>
          </div>
          <button className="btn secondary" onClick={onLogout} style={{ color: '#b91c1c' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {editing && (
        <ProfileEditModal
          isOpen={editing}
          onClose={() => setEditing(false)}
          user={session}
          onSaved={(updated) => {
            onUpdateSession(updated);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// STANDALONE REQUEST REGISTRATION (RF-07, RF-10)
// -------------------------------------------------------------
function RequestForm({ session }) {
  const [category, setCategory] = useState('Alimentos sellados');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('paquetes');
  const [zone, setZone] = useState(session?.zone || 'Puntarenas');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCatChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'Alimentos sellados') setUnit('paquetes');
    else if (newCat === 'Vestimenta') setUnit('piezas');
    else if (newCat === 'Mobiliario') setUnit('lotes');
    else if (newCat === 'Electrodomésticos') setUnit('unidades');
  };

  const limitCheck = checkRequestLimits(category, amount);
  const isLimitExceeded = limitCheck.exceeded;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const newId = `CC-${Math.floor(200 + Math.random() * 800)}`;
    const newReq = {
      id: newId,
      category,
      description,
      amount: Number(amount),
      unit,
      zone,
      date,
      status: 'En revisión', // RF-07
      priority: 'Media',     // RF-09
      goal: Number(amount),
      received: 0,
      beneficiaryId: session?.id || 'u2',
      limitExceeded: isLimitExceeded, // RF-10
      requiresException: isLimitExceeded,
      limitDetails: isLimitExceeded ? limitCheck.reason : null,
      decisionReason: null,
      decisionDate: null
    };

    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify(newReq)
      });
      setSaved(true);
    } catch {
      setError('No se pudo registrar la solicitud en JSON Server.');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">SOLICITUD DE APOYO (RF-07, RF-10)</span>
        <h1>Formular una solicitud</h1>
        <p>Registrá el requerimiento de ayuda comunitaria. Quedará en estado inicial <b>En revisión</b>.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #dce8ec', padding: '30px', maxWidth: '640px', boxShadow: 'var(--shadow-sm)' }}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={42} />
            <h3 style={{ margin: '12px 0 6px', color: '#0f5132' }}>¡Solicitud enviada exitosamente!</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#556b80' }}>
              La solicitud fue guardada con estado inicial <b>En revisión</b>. Podés consultar su estado en el panel.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn primary" onClick={() => navigate('/necesidades')}>Ver necesidades</button>
              <button className="btn secondary" onClick={() => { setSaved(false); setDescription(''); }}>Crear otra solicitud</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Categoría de ayuda (RF-07) *</label>
              <select value={category} onChange={e => handleCatChange(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                {Object.keys(CATEGORY_LIMITS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Descripción del apoyo requerido *</label>
              <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. Paquetes de alimentos no perecederos para núcleo familiar" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Cantidad *</label>
                <input type="number" min="1" required value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Unidad *</label>
                <input required value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Zona general *</label>
                <input required value={zone} onChange={e => setZone(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Fecha *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* RF-10 Real-time check */}
            {isLimitExceeded && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#92400e' }}>
                <AlertTriangle className="i i-l" size={14} /><strong>Aviso de límite (RF-10):</strong> {limitCheck.reason} Requerirá autorización con excepción administrativa para ser aprobada.
              </div>
            )}

            {error && <div style={{ color: '#b91c1c', fontSize: '12px' }}>{error}</div>}

            <button type="submit" className="btn primary" style={{ padding: '13px', marginTop: '6px' }}>
              Registrar solicitud (En revisión)<ArrowRight className="i i-r" size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DONATE PAGE
// -------------------------------------------------------------
function Donate({ session }) {
  const [searchParams] = useSearchParams();
  const preselectedRequestId = searchParams.get('requestId') || '';

  const { data: reqs = [] } = useData('/requests');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    category: 'Alimentos sellados',
    product: '',
    quantity: 1,
    destination: preselectedRequestId,
    anonymous: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newDonationId = `DON-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          id: newDonationId,
          donorId: session?.id || 'demo-donor',
          donorType: session?.role || 'Donante individual',
          category: form.category,
          product: form.product,
          quantity: Number(form.quantity),
          date: new Date().toISOString().slice(0, 10),
          destination: form.destination || 'Institución',
          status: 'Registrada',
          anonymous: form.anonymous,
          requestId: form.destination !== 'Institución' ? form.destination : null
        })
      });
      setSaved(true);
    } catch {
      alert('Error al registrar la donación.');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">REGISTRO DE DONACIONES</span>
        <h1>Quiero donar</h1>
        <p>Registrá un aporte de demostración y elegí su destino comunitario.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #dce8ec', padding: '30px', maxWidth: '640px', boxShadow: 'var(--shadow-sm)' }}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={42} />
            <h3 style={{ margin: '12px 0 6px', color: '#0f5132' }}>¡Donación registrada con éxito!</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#556b80' }}>
              Tu aporte ha sido guardado en <code>db.json</code> y podés seguir su recorrido simulado en el panel.
            </p>
            <Link className="btn primary" to="/panel">Ver en el panel de gestión<ArrowRight className="i i-r" size={14} /></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Categoría de donación *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                {['Alimentos sellados', 'Vestimenta', 'Mobiliario', 'Electrodomésticos'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Producto / Descripción del aporte *</label>
              <input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} placeholder="Ej. Paquetes de arroz, frijoles y leche" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Cantidad de unidades *</label>
              <input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Destino del aporte *</label>
              <select required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <option value="">Seleccionar solicitud aprobada o institución...</option>
                {(reqs || []).filter(r => r.status === 'Aprobada').map(r => (
                  <option key={r.id} value={r.id}>Solicitud #{r.id} · {r.description} ({r.zone})</option>
                ))}
                <option value="Institución">Centro Comunitario Institucional (Puntarenas)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input type="checkbox" id="anon" checked={form.anonymous} onChange={e => setForm({ ...form, anonymous: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="anon" style={{ fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                <b>Modo anónimo:</b> Ocultar mi nombre públicamente en los registros de ayuda.
              </label>
            </div>

            <button type="submit" className="btn primary" style={{ padding: '13px', marginTop: '10px' }}>
              Registrar donación<ArrowRight className="i i-r" size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CHAT ORIENTATION
// -------------------------------------------------------------
function Chat() {
  const { data: answers = [], state: chatState } = useData('/chatbot');
  const [messages, setMessages] = useState([]);

  const ask = (q) => {
    const found = answers.find(x => x.question.toLowerCase() === q.toLowerCase());
    setMessages(prev => [...prev, { q, a: found?.answer || 'No tengo respuesta predeterminada para esa consulta en esta versión de demostración.' }]);
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ASISTENTE DE DEMOSTRACIÓN</span>
        <h1>Orientación comunitaria</h1>
        <p>Chatbot con respuestas configuradas para guiar el flujo de demostración académica.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #dce8ec', maxWidth: '750px', overflow: 'hidden' }}>
        <div style={{ minHeight: '260px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#7a8e9f' }}>
              <MessageSquare size={30} />
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                {chatState === 'loading' ? 'Cargando preguntas…' : chatState === 'error' ? 'No se pudieron cargar las preguntas. Revisá que JSON Server esté activo.' : 'Seleccioná una de las preguntas preparadas abajo:'}
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ alignSelf: 'flex-end', background: '#06244a', color: '#ffffff', padding: '10px 16px', borderRadius: '14px 14px 2px 14px', fontSize: '12.5px' }}>
                  {m.q}
                </div>
                <div style={{ alignSelf: 'flex-start', background: '#eef5f8', color: '#09274c', padding: '12px 16px', borderRadius: '2px 14px 14px 14px', fontSize: '13px', maxWidth: '85%' }}>
                  {m.a}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: '#f8fafc', padding: '16px 20px', borderTop: '1px solid #edf2f5', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {answers.map(a => (
            <button
              key={a.id}
              onClick={() => ask(a.question)}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '7px 14px', fontSize: '12px', color: '#06244a', fontWeight: '600' }}
            >
              {a.question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
function App() {
  return <Shell />;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
