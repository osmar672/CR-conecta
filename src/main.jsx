import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

HEAD
import { Logo } from './components/Logo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './lib/api';
import { useData } from './lib/useData';
import { useModalAccessibility } from './lib/useModalAccessibility';
import { GoogleAccessModal, GoogleIcon } from './components/GoogleAccessModal';
import { NeedDetailModal } from './components/NeedDetailModal';
import { RequestEvaluationModal } from './components/RequestEvaluationModal';
import { BeneficiarySection } from './components/BeneficiarySection';
import { ProfileEditModal } from './components/ProfileEditModal';
import { SponsorsSection } from './components/SponsorsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { CommunityCoverageSection } from './components/CommunityCoverageSection';
import { AidServicesSection } from './components/AidServicesSection';
import { DisplayPreferencesControls } from './components/DisplayPreferencesControls';
import { CATEGORY_LIMITS, CATEGORY_OPTIONS, checkRequestLimits, getCategoryUnit } from './constants/limits';

const roleIcons = {
  'Administrador': '/logo-mark.png',
  'Beneficiario': '/logo-mark.png',
  'Donante individual': '/logo-mark.png',
  'Empresa donante': '/logo.jpg',
  'Voluntario': '/logo-mark.png',
  'Aliado comunitario': '/logo.jpg'
};

function RoleAvatar({ src, alt, size = 42 }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '12px',
        display: 'block',
        border: '1px solid rgba(6, 36, 74, 0.08)',
        background: 'var(--white)'
      }}
    />
  );
}

function Confirm({ title, text, error, onConfirm, onCancel }) {
  const modalRef = useRef(null);
  useModalAccessibility(modalRef, true, onCancel);
  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabIndex={-1}>
        <div className="modal-mark">!</div>
        <h3 id="confirm-title">{title}</h3>
        <p>{text}</p>
        {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn primary" onClick={onConfirm}>Continuar</button>
        </div>
      </div>
    </div>
  );
}

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
          <NavLink to="/panel">Panel de gestión</NavLink>
          <NavLink to="/chat">Asistente</NavLink>
        </nav>

        <div className="header-actions">
          <DisplayPreferencesControls />

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
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home onOpenNeedModal={setSelectedNeed} />} />
          <Route path="/necesidades" element={<Needs onOpenNeedModal={setSelectedNeed} />} />
          <Route path="/panel" element={<Panel session={session} onLogin={login} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/acceso" element={<Access onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/perfil" element={<Profile session={session} onUpdateSession={login} onLogout={logout} onOpenGoogleAuth={() => setGoogleModalOpen(true)} />} />
          <Route path="/donar" element={<Donate session={session} />} />
          <Route path="/solicitar" element={<RequestForm session={session} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Home onOpenNeedModal={setSelectedNeed} />} />
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

// -------------------------------------------------------------
// HOME PAGE COMPONENT (MATCHING MOCKUP WITH EXTREME PRECISION)
// -------------------------------------------------------------
function Home({ onOpenNeedModal }) {
  const { data: reqs = [] } = useData('/requests');
  const { data: transfers = [] } = useData('/transfers');
  const { data: allies = [] } = useData('/allies');
  const { data: facilities = [] } = useData('/facilities');
  const [selectedMapZone, setSelectedMapZone] = useState('Puntarenas Centro');

  const mapZones = [
    { name: 'Puntarenas Centro', lat: 9.9763, lon: -84.8384, detail: 'Centro de coordinación y acopio' },
    { name: 'Barranca', lat: 9.9846, lon: -84.7163, detail: 'Atención y entrega de víveres' },
    { name: 'El Roble', lat: 9.9882, lon: -84.7348, detail: 'Vestimenta y apoyo comunitario' },
    { name: 'Chacarita', lat: 9.9778, lon: -84.7467, detail: 'Red vecinal y artículos para el hogar' }
  ];
  const activeMapZone = mapZones.find(zone => zone.name === selectedMapZone) || mapZones[0];
  const mapBounds = `${activeMapZone.lon - 0.018},${activeMapZone.lat - 0.012},${activeMapZone.lon + 0.018},${activeMapZone.lat + 0.012}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(mapBounds)}&layer=mapnik&marker=${activeMapZone.lat},${activeMapZone.lon}`;
  const mapLinkUrl = `https://www.openstreetmap.org/?mlat=${activeMapZone.lat}&mlon=${activeMapZone.lon}#map=15/${activeMapZone.lat}/${activeMapZone.lon}`;

  // Pick sample requests or fallback to mockup items
  const displayNeeds = useMemo(() => {
    if (reqs && reqs.length > 0) {
      return reqs.filter(r => r.status === 'Aprobada').slice(0, 3);
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

        {/* Interactive community map without an API key */}
        <div className="map-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">RED LOCAL · PUNTARENAS</span>
              <h3>La ayuda, más cerca</h3>
            </div>
            <a className="map-open-link" href={mapLinkUrl} target="_blank" rel="noreferrer">
              Abrir mapa<ArrowUpRight size={15} />
            </a>
          </div>

          <div className="map-zone-list" aria-label="Seleccionar zona comunitaria">
            {mapZones.map(zone => (
              <button
                key={zone.name}
                type="button"
                className={selectedMapZone === zone.name ? 'map-zone-button active' : 'map-zone-button'}
                aria-pressed={selectedMapZone === zone.name}
                onClick={() => setSelectedMapZone(zone.name)}
              >
                {zone.name}
              </button>
            ))}
          </div>

          <div className="map-frame">
            <iframe
              key={selectedMapZone}
              title={`Mapa de referencia: ${activeMapZone.name}, Puntarenas`}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-location-card">
              <span className="map-location-icon"><MapPin size={17} /></span>
              <span><strong>{activeMapZone.name}</strong><small>{activeMapZone.detail}</small></span>
              <span className="map-active-indicator">Zona de referencia</span>
            </div>
          </div>

          <div className="map-note">
            <i /> Mapa de OpenStreetMap. Zonas referenciales; no representan domicilios exactos.
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
            <strong>{reqs?.length ?? 0}</strong>
            <span>Solicitudes visibles</span>
          </div>
          <div className="metric">
            <strong>{transfers?.length ?? 0}</strong>
            <span>Traslados visibles</span>
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
// Public need card with category-specific imagery
// -------------------------------------------------------------
function MockupNeedCard({ r, index, onSelect }) {
  const mockPercentages = [45, 70, 25];
  const progress = r.received && r.goal 
    ? Math.min(100, Math.round((r.received / r.goal) * 100))
    : (mockPercentages[index % 3] || 50);

  const requestText = `${r.description || ''} ${r.category || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const needVisuals = [
    {
      match: ['utiles escolares', 'mochila escolar', 'cuadernos', 'mochila'],
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
      alt: 'Libros y materiales escolares para apoyar a estudiantes'
    },
    {
      match: ['uniformes escolares', 'uniforme escolar', 'uniforme'],
      image: 'https://images.unsplash.com/photo-1591219233007-4ac041f8c2be?auto=format&fit=crop&w=900&q=80',
      alt: 'Estudiantes con uniforme escolar caminando hacia clases'
    },
    {
      match: ['zapatos escolares', 'calzado escolar'],
      image: 'https://images.unsplash.com/photo-1653868250317-144a0c4f5884?auto=format&fit=crop&w=900&q=80',
      alt: 'Par de zapatos negros de vestir, similares al calzado escolar solicitado'
    },
    {
      match: ['ropa de abrigo', 'chaqueta', 'sueter'],
      image: 'https://images.unsplash.com/photo-1611911813383-67769b37a149?auto=format&fit=crop&w=900&q=80',
      alt: 'Suéter tejido abrigado para donar'
    },
    {
      match: ['alimento', 'comida', 'víveres'],
      image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=900&q=80',
      alt: 'Bolsas de donación con alimentos empacados y productos de despensa'
    },
    {
      match: ['ropa interior', 'bebe', 'infantil'],
      image: 'https://images.unsplash.com/photo-1768693602418-260d828b878d?auto=format&fit=crop&w=900&q=80',
      alt: 'Ropa de bebé preparada para entregar a una familia'
    },
    {
      match: ['vestimenta', 'ropa'],
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80',
      alt: 'Ropa organizada para donación'
    },
    {
      match: ['calzado', 'zapatos'],
      image: 'https://images.unsplash.com/photo-1653868250317-144a0c4f5884?auto=format&fit=crop&w=900&q=80',
      alt: 'Par de zapatos negros de vestir para donar'
    },
    {
      match: ['mobiliario', 'mueble', 'hogar'],
      image: 'https://images.unsplash.com/photo-1713365829670-d8df1e593248?auto=format&fit=crop&w=900&q=80',
      alt: 'Mesa de comedor con sillas para equipar un hogar'
    },
    {
      match: ['electrodoméstico', 'electrodomestico', 'cocina'],
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      alt: 'Electrodomésticos para el hogar'
    },
    {
      match: ['salud', 'medicamento'],
      image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80',
      alt: 'Insumos de salud y primeros auxilios'
    },
    {
      match: ['higiene', 'cuidado personal'],
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80',
      alt: 'Productos de higiene y cuidado personal'
    },
    {
      match: ['tecnología', 'tecnologia', 'conectividad', 'digital'],
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      alt: 'Computadora portátil para acceso digital'
    },
    {
      match: ['transporte', 'movilidad'],
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
      alt: 'Vehículo para traslados comunitarios'
    },
    {
      match: ['legal', 'documentación', 'documentacion'],
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
      alt: 'Documentos para asistencia legal'
    },
    {
      match: ['adultos mayores', 'adulto mayor', 'acompañamiento'],
      image: 'https://images.unsplash.com/photo-1777904257177-f520bc1b10c3?auto=format&fit=crop&w=900&q=80',
      alt: 'Acompañamiento y cuidado comunitario'
    },
    {
      match: ['emergencia', 'contingencia'],
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
      alt: 'Paquetes de ayuda para emergencias'
    },
    {
      match: [],
      image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?auto=format&fit=crop&w=900&q=80',
      alt: 'Voluntariado organizando productos de apoyo comunitario'
    }
  ];
  const visual = needVisuals.find(item => item.match.some(term => requestText.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))))
    || needVisuals[needVisuals.length - 1];

  return (
    <article className={`need-card needs-list-card c${index % 3}`} style={{ animationDelay: `${index * 75}ms` }}>
      <div className="need-top">
        <img className="need-photo" src={visual.image} alt={visual.alt} loading="lazy" />
        <span className="need-zone"><MapPin size={13} />{r.zone}</span>
        <span className="need-photo-label">CR CONECTA · APOYO COMUNITARIO</span>
      </div>

      <div className="need-body">
        <div className="need-card-meta">
          <span className="need-category-label">{r.category}</span>
          <span className={`priority ${(r.priority || 'media').toLowerCase()}`}>
            PRIORIDAD {(r.priority || 'MEDIA').toUpperCase()}
          </span>
        </div>

        <h3>{r.description}</h3>
        <p className="need-progress-copy">Apoyo comunitario · {progress}% reunido</p>

        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="need-foot">
          <button type="button" onClick={onSelect}>
            Conocer esta necesidad<ArrowRight className="i i-r" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// NEEDS PAGE (PUBLIC LIST WITH FILTERS & RF-06 ACCESS)
// -------------------------------------------------------------
function Needs({ onOpenNeedModal }) {
  const { data: reqs = [], state, retry } = useData('/requests');
  const [filter, setFilter] = useState('Todas');

  const approvedList = useMemo(() => {
    return (reqs || []).filter(r => {
      const matchStatus = r.status === 'Aprobada';
      const matchPriority = filter === 'Todas' || r.priority === filter;
      return matchStatus && matchPriority;
    });
  }, [reqs, filter]);

  return (
    <div className="page needs-page">
      <div className="needs-page-hero">
        <div className="page-head">
          <span className="eyebrow">OPORTUNIDADES PARA AYUDAR</span>
          <h1>Tu ayuda puede cambiar un día.</h1>
          <p>
            Conocé las necesidades aprobadas en tu comunidad y elegí cómo colaborar. La identidad y ubicación exacta de las familias se mantienen protegidas.
          </p>
        </div>
        <div className="needs-hero-note">
          <span className="needs-hero-icon"><HeartHandshake size={22} /></span>
          <strong>Apoyo cercano,<br />impacto real.</strong>
          <span>Cada aporte suma a una red comunitaria más fuerte.</span>
        </div>
      </div>

      <div className="filter-row">
        <div className="pills">
          <Link className="btn primary" to="/solicitar" style={{ padding: '8px 18px', fontSize: '12px' }}>
            Solicitar ayuda
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
        <span className="needs-count-note">
          {approvedList.length} {approvedList.length === 1 ? 'necesidad aprobada' : 'necesidades aprobadas'} · Privacidad protegida
        </span>
      </div>

      {state === 'loading' ? (
        <div className="state"><div className="state-icon">…</div><h3>Cargando solicitudes...</h3></div>
      ) : state === 'error' ? (
        <div className="state">
          <div className="state-icon">!</div>
          <h3>Error de conexión con la API</h3>
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
function Access({ onOpenGoogleAuth }) {
  const { data: users = [], state } = useData('/auth/demo-users');

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
          background: 'var(--white)',
          border: '1px solid var(--line)',
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
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>
              Acceso visual tipo Google / Gmail (RF-02)
            </h3>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', maxWidth: '580px' }}>
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
            border: '1.5px solid var(--line)',
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
          background: 'var(--surface-soft)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '28px',
          fontSize: '12px',
          color: 'var(--muted)'
        }}
      >
        <Info size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Aviso institucional:</strong> Google, Gmail y los flujos con n8n no autentican realmente; no representan servicios ni entregas reales. Todas las operaciones usan datos ficticios almacenados en <code>db.json</code>.
        </div>
      </div>

      {/* Grid of All Preloaded Accounts */}
      <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: 'var(--navy)' }}>
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
              onClick={onOpenGoogleAuth}
            >
              <div className="avatar">
                <RoleAvatar src={roleIcons[u.role] || '/logo-mark.png'} alt={u.role} size={40} />
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
function DashboardBarChart({ title, subtitle, items, variant = 'bars', emptyLabel = 'Aún no hay datos para mostrar.' }) {
  const maximum = Math.max(1, ...items.map(item => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    'linear-gradient(135deg, #05b8a5, #26d7c4)',
    'linear-gradient(135deg, #ff7043, #ffad42)',
    'linear-gradient(135deg, #7256e8, #ad78ff)',
    'linear-gradient(135deg, #1788e8, #45bdff)',
    'linear-gradient(135deg, #e84e91, #ff7fb1)',
    'linear-gradient(135deg, #8bbd22, #c5e94d)'
  ];

  return (
    <section className="dashboard-card dashboard-chart-card">
      <div className="dashboard-chart-heading">
        <span className="dashboard-chart-icon"><BarChart3 size={18} /></span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        {items.length > 0 && <span className="dashboard-chart-total"><strong>{total}</strong><small>registros</small></span>}
      </div>
      {items.length ? (
        <div className={`dashboard-bars ${variant === 'columns' ? 'dashboard-bars-columns' : ''}`}>
          {items.map((item, index) => (
            <div className="dashboard-bar-row" key={item.label} style={{ '--bar-delay': `${index * 90}ms` }}>
              {variant === 'columns' ? (
                <>
                  <div className="dashboard-column-value">{item.value}</div>
                  <div className="dashboard-column-track">
                    <span style={{
                      '--bar-height': `${Math.max(item.value > 0 ? 10 : 0, (item.value / maximum) * 100)}%`,
                      '--bar-color': colors[index % colors.length],
                      '--bar-delay': `${index * 90}ms`
                    }} />
                  </div>
                  <div className="dashboard-column-label">
                    <strong>{item.label}</strong>
                    <small>{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="dashboard-bar-label">
                    <span><i style={{ background: colors[index % colors.length] }} />{item.label}</span>
                    <strong>{item.value}<small>{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</small></strong>
                  </div>
                  <div className="dashboard-bar-track">
                    <span style={{
                      '--bar-width': `${Math.max(item.value > 0 ? 7 : 0, (item.value / maximum) * 100)}%`,
                      '--bar-color': colors[index % colors.length],
                      '--bar-delay': `${index * 90}ms`
                    }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : <p className="dashboard-empty-note">{emptyLabel}</p>}
    </section>
  );
}

function DashboardMetric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <div className={`dashboard-metric-card tone-${tone}`}>
      <span className="dashboard-metric-icon"><Icon size={19} /></span>
      <span className="dashboard-metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function dashboardCounts(items, getLabel, limit = 5) {
  const counts = items.reduce((result, item) => {
    const label = getLabel(item) || 'Sin clasificar';
    result.set(label, (result.get(label) || 0) + 1);
    return result;
  }, new Map());
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function AdminOverview({ reqs, dons, inv, trans, campaigns, jobs, refreshCount, onRefresh }) {
  const { data: users = [], state: usersState } = useData('/users', refreshCount);
  const { data: activity = [], state: activityState } = useData('/activity', refreshCount);
  const pendingRequests = reqs.filter(request => request.status === 'En revisión');
  const stockAlerts = inv.filter(item => Number(item.available) <= Number(item.minimum));
  const inRouteTransfers = trans.filter(transfer => transfer.status === 'En ruta');
  const donationUnits = dons.reduce((sum, donation) => sum + (Number(donation.quantity) || 0), 0);
  const inventoryByStatus = [
    { label: 'Bajo mínimo', value: stockAlerts.length },
    { label: 'En nivel', value: Math.max(0, inv.length - stockAlerts.length) }
  ];
  const loadError = usersState === 'error' || activityState === 'error';

  return (
    <div className="role-dashboard">
      <div className="admin-dashboard-toolbar">
        <div>
          <strong>Vista general de CR Conecta</strong>
          <p>Indicadores de operación y acciones registradas en el sistema.</p>
        </div>
        <button type="button" className="btn secondary" onClick={onRefresh}>Actualizar datos</button>
      </div>
      {loadError && (
        <div className="api-banner" role="alert">
          No se pudieron cargar los usuarios o la actividad reciente.
          <button type="button" onClick={onRefresh}>Reintentar</button>
        </div>
      )}
      <div className="dashboard-kpis">
        <DashboardMetric icon={UsersRound} label="Cuentas" value={users.length} detail="Perfiles registrados" tone="blue" />
        <DashboardMetric icon={Clock3} label="Por evaluar" value={pendingRequests.length} detail={`${reqs.length} solicitudes en total`} tone="amber" />
        <DashboardMetric icon={HeartHandshake} label="Donaciones" value={dons.length} detail={`${donationUnits} unidades aportadas`} tone="green" />
        <DashboardMetric icon={Package} label="Alertas de inventario" value={stockAlerts.length} detail={`${inv.length} productos registrados`} tone="red" />
        <DashboardMetric icon={RouteIcon} label="Traslados en ruta" value={inRouteTransfers.length} detail={`${trans.length} traslados registrados`} tone="blue" />
        <DashboardMetric icon={BarChart3} label="Campañas activas" value={campaigns.filter(campaign => campaign.status === 'Activa').length} detail={`${campaigns.length} campañas · ${jobs.length} oportunidades`} tone="green" />
      </div>
      <div className="dashboard-chart-grid">
        <DashboardBarChart title="Solicitudes por estado" subtitle="Seguimiento de todos los casos" items={dashboardCounts(reqs, request => request.status)} />
        <DashboardBarChart title="Solicitudes por comunidad" subtitle="Zonas con necesidades registradas" items={dashboardCounts(reqs, request => request.zone)} variant="columns" />
        <DashboardBarChart title="Donaciones por categoría" subtitle="Tipos de aporte registrados" items={dashboardCounts(dons, donation => donation.category)} variant="columns" />
        <DashboardBarChart title="Donaciones por estado" subtitle="Avance de los aportes" items={dashboardCounts(dons, donation => donation.status)} />
        <DashboardBarChart title="Estado del inventario" subtitle="Productos bajo mínimo o en nivel" items={inventoryByStatus} variant="columns" />
        <DashboardBarChart title="Traslados por estado" subtitle="Distribución de entregas logísticas" items={dashboardCounts(trans, transfer => transfer.status)} variant="columns" />
        <DashboardBarChart title="Cuentas por tipo" subtitle="Perfiles registrados por rol" items={dashboardCounts(users, user => user.role)} />
        <DashboardBarChart title="Campañas por estado" subtitle="Campañas de empresas y aliados" items={dashboardCounts(campaigns, campaign => campaign.status)} />
      </div>
      <section className="dashboard-card dashboard-chart-card">
        <div className="dashboard-chart-heading">
          <span className="dashboard-chart-icon"><Clock3 size={18} /></span>
          <div><h3>Actividad reciente</h3><p>Últimas acciones registradas por el sistema</p></div>
        </div>
        {activity.length ? (
          <div className="dashboard-activity-list">
            {activity.slice(0, 10).map(event => {
              const occurredAt = new Date(event.timestamp);
              const formattedDate = Number.isNaN(occurredAt.getTime())
                ? 'Fecha no disponible'
                : occurredAt.toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' });
              const subject = event.entity === 'sesión'
                ? ''
                : ` ${event.entity?.toLowerCase()}${event.entityId ? ` #${event.entityId}` : ''}`;
              return (
                <div className="dashboard-activity-row" key={event.id}>
                  <span className="dashboard-activity-dot done" />
                  <div>
                    <strong>{event.actor} {event.action}{subject}</strong>
                    <small>{event.actorRole} · {formattedDate}{event.detail ? ` · ${event.detail}` : ''}</small>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="dashboard-empty-note">Todavía no hay acciones registradas. Las nuevas acciones aparecerán aquí.</p>}
      </section>
    </div>
  );
}

function RoleDashboard({ role, session, reqs, dons, inv, trans, campaigns }) {
  const myDonations = dons.filter(donation => donation.donorId === session.id);
  const myDonationUnits = myDonations.reduce((sum, donation) => sum + (Number(donation.quantity) || 0), 0);
  const deliveredDonations = myDonations.filter(donation => donation.status === 'Entregada');
  const myCampaigns = campaigns.filter(campaign => campaign.companyId === session.id);
  const myTransfers = trans.filter(transfer => transfer.responsible === session.name);
  const normalizedZone = session.zone?.trim().toLowerCase();
  const localRequests = normalizedZone
    ? reqs.filter(request => request.zone?.trim().toLowerCase() === normalizedZone)
    : [];
  const localRequestIds = new Set(localRequests.map(request => request.id));
  const localDonations = normalizedZone
    ? dons.filter(donation =>
      localRequestIds.has(donation.requestId)
      || donation.destination?.toLowerCase().includes(normalizedZone)
    )
    : [];
  const stockAlerts = inv.filter(item => item.available <= item.minimum);
  const pendingRequests = reqs.filter(request => request.status === 'En revisión');
  const approvedRequests = reqs.filter(request => request.status === 'Aprobada');
  const inRouteTransfers = trans.filter(transfer => transfer.status === 'En ruta');

  if (role === 'Administrador') {
    const requestStatus = dashboardCounts(reqs, request => request.status);
    const donationCategories = dashboardCounts(dons, donation => donation.category);
    return (
      <div className="role-dashboard">
        <div className="dashboard-kpis">
          <DashboardMetric icon={Clock3} label="Por evaluar" value={pendingRequests.length} detail="Solicitudes en revisión" tone="amber" />
          <DashboardMetric icon={CircleCheck} label="Aprobadas" value={approvedRequests.length} detail="Casos activos" tone="green" />
          <DashboardMetric icon={Package} label="Alertas de stock" value={stockAlerts.length} detail="Productos bajo mínimo" tone="red" />
          <DashboardMetric icon={RouteIcon} label="En ruta" value={inRouteTransfers.length} detail="Traslados activos" tone="blue" />
        </div>
        <div className="dashboard-chart-grid">
          <DashboardBarChart title="Estado de solicitudes" subtitle="Casos registrados en el sistema" items={requestStatus} />
          <DashboardBarChart title="Donaciones por categoría" subtitle="Distribución de los aportes registrados" items={donationCategories} />
        </div>
        <section className="dashboard-card dashboard-insight">
          <span className="dashboard-insight-icon"><PackageCheck size={20} /></span>
          <div><strong>Seguimiento operativo</strong><p>{pendingRequests.length ? `${pendingRequests.length} solicitudes esperan evaluación. Revisá el listado para continuar con su validación.` : 'No hay solicitudes pendientes de evaluación en este momento.'}</p></div>
          <span className="dashboard-insight-tag">{reqs.length} casos en total</span>
        </section>
      </div>
    );
  }

  if (role === 'Donante individual') {
    const categories = dashboardCounts(myDonations, donation => donation.category);
    const recentDonations = [...myDonations].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
    return (
      <div className="role-dashboard">
        <div className="dashboard-kpis">
          <DashboardMetric icon={HeartHandshake} label="Mis aportes" value={myDonations.length} detail="Donaciones registradas" tone="blue" />
          <DashboardMetric icon={Package} label="Unidades aportadas" value={myDonationUnits} detail="Productos y paquetes" tone="green" />
          <DashboardMetric icon={CircleCheck} label="Entregadas" value={deliveredDonations.length} detail="Aportes completados" tone="green" />
          <DashboardMetric icon={RouteIcon} label="En seguimiento" value={myDonations.filter(donation => donation.status !== 'Entregada').length} detail="En inventario o traslado" tone="amber" />
        </div>
        <div className="dashboard-chart-grid">
          <DashboardBarChart title="Mis aportes por categoría" subtitle="Tipos de ayuda que has compartido" items={categories} />
          <section className="dashboard-card dashboard-chart-card">
            <div className="dashboard-chart-heading"><span className="dashboard-chart-icon"><Clock3 size={18} /></span><div><h3>Actividad reciente</h3><p>Últimas donaciones registradas</p></div></div>
            {recentDonations.length ? <div className="dashboard-activity-list">
              {recentDonations.map(donation => <div className="dashboard-activity-row" key={donation.id}>
                <span className="dashboard-activity-dot" />
                <div><strong>{donation.product}</strong><small>{donation.category} · {donation.date}</small></div>
                <span className="dashboard-activity-status">{donation.status}</span>
              </div>)}
            </div> : <p className="dashboard-empty-note">Todavía no registrás donaciones. Podés explorar las necesidades de tu comunidad.</p>}
          </section>
        </div>
      </div>
    );
  }

  if (role === 'Empresa donante') {
    const donatedUnits = myDonations.reduce((sum, donation) => sum + (Number(donation.quantity) || 0), 0);
    const categories = dashboardCounts(myDonations, donation => donation.category);
    return (
      <div className="role-dashboard">
        <div className="dashboard-kpis">
          <DashboardMetric icon={BarChart3} label="Campañas activas" value={myCampaigns.filter(campaign => campaign.status === 'Activa').length} detail={`${myCampaigns.length} campañas propias`} tone="blue" />
          <DashboardMetric icon={Package} label="Unidades aportadas" value={donatedUnits} detail="A través de donaciones" tone="green" />
          <DashboardMetric icon={CircleCheck} label="Aportes entregados" value={myDonations.filter(donation => donation.status === 'Entregada').length} detail="Donaciones completadas" tone="green" />
          <DashboardMetric icon={UsersRound} label="Oportunidades" value={myCampaigns.reduce((sum, campaign) => sum + (Number(campaign.goal) || 0), 0)} detail="Meta total de campaña" tone="amber" />
        </div>
        <div className="dashboard-chart-grid">
          <DashboardBarChart title="Aportes por categoría" subtitle="Resumen de donaciones de la empresa" items={categories} />
          <section className="dashboard-card dashboard-chart-card">
            <div className="dashboard-chart-heading"><span className="dashboard-chart-icon"><BarChart3 size={18} /></span><div><h3>Avance de campañas</h3><p>Progreso frente a la meta</p></div></div>
            {myCampaigns.length ? <div className="dashboard-campaign-list">
              {myCampaigns.slice(0, 4).map(campaign => {
                const goal = Number(campaign.goal) || 0;
                const progress = goal ? Math.min(100, Math.round(((Number(campaign.progress) || 0) / goal) * 100)) : 0;
                return <div className="dashboard-campaign-row" key={campaign.id}>
                  <div className="dashboard-bar-label"><span>{campaign.name}</span><strong>{progress}%</strong></div>
                  <div className="dashboard-bar-track"><span style={{ width: `${progress}%` }} /></div>
                </div>;
              })}
            </div> : <p className="dashboard-empty-note">Aún no hay campañas vinculadas a esta cuenta.</p>}
          </section>
        </div>
      </div>
    );
  }

  if (role === 'Voluntario') {
    const transferStatuses = dashboardCounts(myTransfers, transfer => transfer.status);
    return (
      <div className="role-dashboard">
        <div className="dashboard-kpis">
          <DashboardMetric icon={RouteIcon} label="Mis traslados" value={myTransfers.length} detail="Asignados a tu perfil" tone="blue" />
          <DashboardMetric icon={Clock3} label="En ruta" value={myTransfers.filter(transfer => transfer.status === 'En ruta').length} detail="Pendientes de entrega" tone="amber" />
          <DashboardMetric icon={CircleCheck} label="Completados" value={myTransfers.filter(transfer => transfer.status === 'Entregado').length} detail="Entregas confirmadas" tone="green" />
          <DashboardMetric icon={MapPin} label="Mi zona" value={session.zone || 'Sin zona'} detail="Área de colaboración" tone="blue" />
        </div>
        <div className="dashboard-chart-grid">
          <DashboardBarChart title="Estado de mis traslados" subtitle="Seguimiento de rutas asignadas" items={transferStatuses} />
          <section className="dashboard-card dashboard-chart-card">
            <div className="dashboard-chart-heading"><span className="dashboard-chart-icon"><RouteIcon size={18} /></span><div><h3>Próximas entregas</h3><p>Rutas asignadas a tu perfil</p></div></div>
            {myTransfers.length ? <div className="dashboard-activity-list">
              {myTransfers.map(transfer => <div className="dashboard-activity-row" key={transfer.id}>
                <span className={`dashboard-activity-dot ${transfer.status === 'Entregado' ? 'done' : ''}`} />
                <div><strong>{transfer.origin} → {transfer.destination}</strong><small>{transfer.scheduledDate} · {transfer.donationId}</small></div>
                <span className="dashboard-activity-status">{transfer.status}</span>
              </div>)}
            </div> : <p className="dashboard-empty-note">No hay traslados asignados a tu nombre por ahora.</p>}
          </section>
        </div>
      </div>
    );
  }

  const localCategories = dashboardCounts(localRequests, request => request.category);
  return (
    <div className="role-dashboard">
      <div className="dashboard-kpis">
        <DashboardMetric icon={MapPin} label="Zona de apoyo" value={session.zone || 'Comunidad'} detail="Centro comunitario asignado" tone="blue" />
        <DashboardMetric icon={HeartHandshake} label="Casos locales" value={localRequests.length} detail="Solicitudes de tu zona" tone="amber" />
        <DashboardMetric icon={Package} label="Aportes locales" value={localDonations.length} detail="Donaciones vinculadas" tone="green" />
        <DashboardMetric icon={CircleCheck} label="Casos aprobados" value={localRequests.filter(request => request.status === 'Aprobada').length} detail="En tu comunidad" tone="green" />
      </div>
      <div className="dashboard-chart-grid">
        <DashboardBarChart title="Necesidades de la zona" subtitle={`Solicitudes registradas en ${session.zone || 'tu comunidad'}`} items={localCategories} />
        <section className="dashboard-card dashboard-chart-card">
          <div className="dashboard-chart-heading"><span className="dashboard-chart-icon"><UsersRound size={18} /></span><div><h3>Tu comunidad conectada</h3><p>Resumen de colaboración local</p></div></div>
          <div className="dashboard-community-summary">
            <strong>{localRequests.length}</strong><span>solicitudes vinculadas a tu zona</span>
            <p>Coordiná con las personas donantes y el voluntariado para acercar los aportes a quienes más los necesitan.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Panel({ session, onLogin, onOpenGoogleAuth }) {
  if (!session) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">PANEL DE GESTIÓN</span>
          <h1>Acceso restringido por rol</h1>
          <p>Para ver las funciones de demostración, iniciá sesión con una cuenta de prueba.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: '18px', border: '1px solid var(--line)' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--navy)' }}>Ingresá con una cuenta para ver su panel</h3>
          <button className="btn primary" onClick={onOpenGoogleAuth} style={{ display: 'inline-flex', gap: '8px' }}>
            <GoogleIcon size={18} /> Iniciar sesión de demostración
          </button>
        </div>
      </div>
    );
  }

  return <PanelInner session={session} onUpdateSession={onLogin} />;
}

function PanelInner({ session, onUpdateSession }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [actionNotice, setActionNotice] = useState('');
  const triggerRefresh = () => setRefreshCount(c => c + 1);

  const { data: reqs = [], state: requestsState } = useData('/requests', refreshCount);
  const { data: dons = [], state: donationsState } = useData('/donations', refreshCount);
  const { data: inv = [], state: inventoryState } = useData('/inventory', refreshCount);
  const { data: trans = [], state: transfersState } = useData('/transfers', refreshCount);
  const { data: allies = [], state: alliesState } = useData('/allies', refreshCount);
  const { data: campaigns = [], state: campaignsState } = useData('/campaigns', refreshCount);
  const { data: jobs = [], state: jobsState } = useData('/jobs', refreshCount);
  const hasLoadError = [requestsState, donationsState, inventoryState, transfersState, alliesState, campaignsState, jobsState]
    .includes('error');

  const role = session.role;
  const isAdmin = role === 'Administrador';
  const isBeneficiary = role === 'Beneficiario';
  const isDonor = role === 'Donante individual';
  const isCompany = role === 'Empresa donante';
  const isVolunteer = role === 'Voluntario';
  const roleDescriptions = {
    Administrador: 'Resumen de solicitudes, inventario y traslados para coordinar la operación comunitaria.',
    Beneficiario: 'Consultá tus solicitudes y el avance de los apoyos asignados a tu hogar.',
    'Donante individual': 'Seguí tus aportes, revisá su estado y descubrí cómo están ayudando a tu comunidad.',
    'Empresa donante': 'Medí el avance de tus campañas y el impacto de los aportes de tu organización.',
    Voluntario: 'Consultá tus rutas asignadas y el estado de las entregas comunitarias.',
    'Aliado comunitario': `Información de apoyo y necesidades vinculadas con ${session.zone || 'tu comunidad'}.`
  };

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
            {roleDescriptions[role] || 'Resumen personalizado de tu actividad en CR Conecta.'}
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

      {hasLoadError && (
        <div className="api-banner" role="alert">
          No se pudieron cargar algunos datos del panel.
          <button type="button" onClick={triggerRefresh}>Reintentar</button>
        </div>
      )}
      {actionNotice && <div role="status" className="api-banner">{actionNotice}</div>}

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

      {/* Role-specific summary and analytics */}
      {tab === 'resumen' && !isBeneficiary && (
        isAdmin
          ? <AdminOverview
              reqs={reqs}
              dons={dons}
              inv={inv}
              trans={trans}
              campaigns={campaigns}
              jobs={jobs}
              refreshCount={refreshCount}
              onRefresh={triggerRefresh}
            />
          : <RoleDashboard
              role={role}
              session={session}
              reqs={reqs}
              dons={dons}
              inv={inv}
              trans={trans}
              campaigns={campaigns}
            />
      )}

      {/* ADMIN EVALUATION OF REQUESTS (RF-08, RF-09, RF-10) */}
      {(tab === 'solicitudes (RF-08/09/10)' || (isAdmin && tab === 'solicitudes')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header filter controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '10px' }}>
            <div className="request-filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>Filtrar por estado:</span>
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

              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginLeft: '10px' }}>Prioridad (RF-09):</span>
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

            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
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
                        <td style={{ fontWeight: '800', color: 'var(--navy)' }}>#{r.id}</td>
                        <td>
                          <b>{r.description}</b>
                          <small>{r.category} · Beneficiario: {r.beneficiaryId}</small>
                        </td>
                        <td>
                          <strong>{r.amount} {r.unit}</strong>
                          {isExceeded && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--danger)', fontWeight: '800', marginTop: '2px' }}>
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
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{r.decisionReason}</span>
                              <small style={{ color: 'var(--muted)' }}>Fecha: {r.decisionDate}</small>
                              {r.exceptionGranted && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>
                                  <Star className="i i-l" size={14} />Excepción concedida
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Pendiente de evaluación</span>
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
        <DonationsView data={dons} />
      )}

      {/* INVENTORY */}
      {tab === 'inventario' && (
        <div className="large-grid">
          {inv.map(item => (
            <div key={item.id} className="dashboard-card">
              <span className="eyebrow">{item.category}</span>
              <h3>{item.product}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '10px 0' }}>
                <strong style={{ fontSize: '36px', color: 'var(--navy)' }}>{item.available}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>disponibles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid var(--line-light)', paddingTop: '10px' }}>
                <span>Reservadas: {item.reserved}</span>
                <span>Entregadas: {item.delivered}</span>
              </div>
              {item.available <= item.minimum && (
                <div style={{ marginTop: '10px', background: '#fee2e2', color: 'var(--danger)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                  Alerta: Nivel por debajo del mínimo ({item.minimum})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TRANSFERS */}
      {(tab === 'traslados' || tab === 'traslados asignados') && (
        <div className="transfer-grid">
          {trans.map(t => (
            <div key={t.id} className="dashboard-card">
              <div className="transfer-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--navy)' }}>Traslado #{t.id}</strong>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                  {t.status}
                </span>
              </div>
              <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{t.origin} <ArrowRight className="i" size={14} /> {t.destination}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Donación {t.donationId} · Responsable: {t.responsible}
              </p>
              <div className="transfer-points" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '16px 0', fontSize: '12px' }}>
                {(t.points || []).map((p, idx) => (
                  <React.Fragment key={p}>
                    <span style={{ background: 'var(--surface-soft)', padding: '6px 10px', borderRadius: '6px', fontWeight: '600' }}>{p}</span>
                    {idx < t.points.length - 1 && <span style={{ color: 'var(--muted)' }}><ArrowRight className="i" size={14} /></span>}
                  </React.Fragment>
                ))}
              </div>
              <small style={{ fontSize: '11px', color: 'var(--muted)' }}>GPS Y RUTA SIMULADOS (PROTOTIPO ACADÉMICO)</small>
              {t.status === 'En ruta' && (
                <button 
                  className="btn primary" 
                  style={{marginTop:'12px', padding:'8px 12px', fontSize:'11px'}}
                  onClick={async () => {
                    setActionNotice('');
                    try {
                      await api(`/transfers/${t.id}`, { method: 'PATCH', body: JSON.stringify({status: 'Entregado'}) });
                      triggerRefresh();
                      setActionNotice('Entrega actualizada. La firma y fotografía siguen siendo simuladas (RF-27).');
                    } catch (error) {
                      setActionNotice(error.message || 'No se pudo actualizar el traslado.');
                    }
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
              <p style={{fontSize:'12px', color: 'var(--muted)'}}>Zona: {a.zone} | Contacto: {a.contact}</p>
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
                <p style={{fontSize:'12px', color: 'var(--muted)'}}>{c.description}</p>
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
                <p style={{fontSize:'12px', color: 'var(--muted)'}}>{j.description}</p>
                <div style={{marginTop:'10px', fontSize:'11px', color: 'var(--muted)'}}>
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
              <p style={{fontSize:'12px', color: 'var(--muted)'}}>{j.description}</p>
              <div style={{marginTop:'10px', fontSize:'11px', color: 'var(--muted)', marginBottom:'16px'}}>
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
          <p style={{fontSize:'12px', color: 'var(--muted)'}}>Sos un aliado clave en el prototipo. Podés coordinar las entregas y facilitar el acopio local.</p>
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
            onUpdateSession(updated);
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
function DonationsView({ data = [] }) {
  const [qrModal, setQrModal] = useState(null);
  const qrModalRef = useRef(null);
  useModalAccessibility(qrModalRef, Boolean(qrModal), () => setQrModal(null));

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
                    style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}
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
          <div className="modal" ref={qrModalRef} role="dialog" aria-modal="true" aria-labelledby="qr-title" tabIndex={-1} onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <span className="eyebrow">CONSULTA LOCAL SIMULADA</span>
            <h3 id="qr-title" style={{ margin: '8px 0 4px' }}>Comprobante #{qrModal.donation.id}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--muted)' }}>
              Código QR de demostración para verificar el aporte en centros comunitarios.
            </p>
            <img src={qrModal.qrUrl} alt="QR de donación" style={{ width: '160px', height: '160px', border: '1px solid var(--line)', borderRadius: '12px', padding: '8px' }} />
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
          background: 'var(--white)',
          borderRadius: '20px',
          border: '1px solid var(--line)',
          padding: '30px',
          maxWidth: '680px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
          <RoleAvatar src={roleIcons[session.role] || '/logo-mark.png'} alt={session.role} size={68} />
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--navy)' }}>{session.name}</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: '700' }}>
                Rol: {session.role}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Zona: {session.zone}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', padding: '18px', borderRadius: '12px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
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
          <button className="btn secondary" onClick={onLogout} style={{ color: 'var(--danger)' }}>
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
function localDateInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
}

function RequestForm({ session }) {
  const [category, setCategory] = useState('Alimentos sellados');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('paquetes');
  const [zone, setZone] = useState(session?.zone || 'Puntarenas');
  const [date, setDate] = useState(localDateInputValue);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: priorRequests = [] } = useData('/requests');
  const today = localDateInputValue();
  const categoryLimit = CATEGORY_LIMITS[category];

  const handleCatChange = (newCat) => {
    setCategory(newCat);
    setUnit(getCategoryUnit(newCat));
    setError('');
  };

  const limitCheck = checkRequestLimits(
    category,
    amount,
    priorRequests.filter(request => request.beneficiaryId === session?.id)
  );
  const isLimitExceeded = limitCheck.exceeded;

  if (!session || session.role !== 'Beneficiario') {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">SOLICITUD DE APOYO</span>
          <h1>Acceso para personas beneficiarias</h1>
          <p>Iniciá sesión con una cuenta beneficiaria para registrar y consultar solicitudes propias.</p>
        </div>
        <Link className="btn primary" to="/acceso">Iniciar sesión</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (saving) return;

    const cleanDescription = description.trim();
    const parsedAmount = Number(amount);

    if (!cleanDescription || cleanDescription.length > 500) {
      setError('Escribí una descripción clara de hasta 500 caracteres.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (!date || date > today) {
      setError('Elegí una fecha válida que no sea posterior a hoy.');
      return;
    }

    const newReq = {
      category,
      description: cleanDescription,
      amount: parsedAmount,
      unit,
      zone,
      date,
      status: 'En revisión', // RF-07
      priority: 'Media',     // RF-09
      goal: parsedAmount,
      received: 0,
      limitExceeded: isLimitExceeded, // RF-10
      requiresException: isLimitExceeded,
      limitDetails: isLimitExceeded ? limitCheck.reason : null,
      decisionReason: null,
      decisionDate: null
    };

    try {
      setSaving(true);
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify(newReq)
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo registrar la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">SOLICITUD DE APOYO (RF-07, RF-10)</span>
        <h1>Formular una solicitud</h1>
        <p>Registrá el requerimiento de ayuda comunitaria. Quedará en estado inicial <b>En revisión</b>.</p>
      </div>

      <div className="help-form-card">
        {saved ? (
          <div className="help-form-success">
            <span className="help-form-success-icon"><CheckCircle2 size={28} /></span>
            <h3>¡Solicitud enviada!</h3>
            <p>
              La solicitud fue guardada con estado inicial <b>En revisión</b>. Podés consultar su estado en el panel.
            </p>
            <div className="help-form-actions">
              <button type="button" className="btn primary" onClick={() => navigate('/panel')}>Ver mi solicitud</button>
              <button type="button" className="btn secondary" onClick={() => {
                setSaved(false);
                setDescription('');
                setAmount('1');
                setDate(localDateInputValue());
                setError('');
              }}>Crear otra solicitud</button>
            </div>
          </div>
        ) : (
          <form className="help-form" onSubmit={handleSubmit}>
            <div className="help-form-intro">
              <span className="help-form-step">SOLICITUD DE APOYO</span>
              <h2>Contanos qué necesitás</h2>
              <p>Compartí solo información general, sin direcciones exactas ni datos sensibles.</p>
            </div>

            <div className="help-form-field">
              <label htmlFor="request-category">Categoría de ayuda <span aria-hidden="true">*</span></label>
              <select id="request-category" required value={category} onChange={e => handleCatChange(e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <small className="help-form-hint">{categoryLimit.description}</small>
            </div>

            <div className="help-form-field">
              <label htmlFor="request-description">¿Qué apoyo necesitás? <span aria-hidden="true">*</span></label>
              <textarea
                id="request-description"
                required
                maxLength={500}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describí brevemente qué ayudaría a tu hogar o comunidad."
                aria-describedby="request-description-count"
                aria-invalid={Boolean(error && !description.trim())}
              />
              <small id="request-description-count" className="help-form-hint help-form-counter">{description.length}/500 caracteres</small>
            </div>

            <div className="help-form-grid">
              <div className="help-form-field">
                <label htmlFor="request-amount">Cantidad <span aria-hidden="true">*</span></label>
                <input id="request-amount" type="number" min="1" max="100000" step="1" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="help-form-field">
                <label htmlFor="request-unit">Unidad</label>
                <input id="request-unit" value={unit} readOnly aria-describedby="request-unit-hint" />
                <small id="request-unit-hint" className="help-form-hint">Se define según la categoría.</small>
              </div>
            </div>

            <div className="help-form-grid">
              <div className="help-form-field">
                <label htmlFor="request-zone">Zona general <span aria-hidden="true">*</span></label>
                <input id="request-zone" required maxLength={100} value={zone} onChange={e => setZone(e.target.value)} placeholder="Ej. Barranca" />
              </div>
              <div className="help-form-field">
                <label htmlFor="request-date">Fecha de solicitud <span aria-hidden="true">*</span></label>
                <input id="request-date" type="date" max={today} required value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {/* RF-10 Real-time check */}
            {isLimitExceeded && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#92400e' }}>
                <AlertTriangle className="i i-l" size={14} /><strong>Aviso de límite (RF-10):</strong> {limitCheck.reason} Requerirá autorización con excepción administrativa para ser aprobada.
              </div>
            )}

            {error && <div className="help-form-error" role="alert">{error}</div>}

            <button type="submit" className="btn primary help-form-submit" disabled={saving}>
              {saving ? 'Enviando solicitud…' : 'Enviar solicitud'}{!saving && <ArrowRight className="i i-r" size={14} />}
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: 'Alimentos sellados',
    product: '',
    quantity: 1,
    destination: preselectedRequestId,
    anonymous: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (saving) return;

    const productName = form.product.trim();
    const quantityNumber = Number(form.quantity);
    if (!productName || productName.length > 200) {
      setError('Describí el producto o aporte con un máximo de 200 caracteres.');
      return;
    }
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError('La cantidad de donación debe ser mayor que cero.');
      return;
    }

    try {
      setSaving(true);
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          category: form.category,
          product: productName,
          quantity: quantityNumber,
          destination: form.destination || 'Institución',
          anonymous: form.anonymous,
          requestId: form.destination !== 'Institución' ? form.destination : null
        })
      });
      setSaved(true);
    } catch (donationError) {
      setError(donationError.message || 'No se pudo registrar la donación.');
    } finally {
      setSaving(false);
    }
  };

  if (!session || !['Donante individual', 'Empresa donante'].includes(session.role)) {
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">REGISTRO DE DONACIONES</span>
          <h1>Acceso para personas donantes</h1>
          <p>Iniciá sesión con una cuenta donante para registrar aportes y darles seguimiento.</p>
        </div>
        <Link className="btn primary" to="/acceso">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">REGISTRO DE DONACIONES</span>
        <h1>Quiero donar</h1>
        <p>Registrá un aporte de demostración y elegí su destino comunitario.</p>
      </div>

      <div className="help-form-card">
        {saved ? (
          <div className="help-form-success">
            <span className="help-form-success-icon"><CheckCircle2 size={28} /></span>
            <h3>¡Donación registrada!</h3>
            <p>
              Tu aporte ficticio se guardó en el servidor local y podés seguir su recorrido simulado en el panel.
            </p>
            <div className="help-form-actions">
              <Link className="btn primary" to="/panel">Ver mi aporte<ArrowRight className="i i-r" size={14} /></Link>
              <button type="button" className="btn secondary" onClick={() => {
                setSaved(false);
                setForm(current => ({ ...current, product: '', quantity: 1 }));
                setError('');
              }}>Registrar otra donación</button>
            </div>
          </div>
        ) : (
          <form className="help-form" onSubmit={handleSubmit}>
            <div className="help-form-intro">
              <span className="help-form-step">REGISTRO DE APORTE</span>
              <h2>Tu aporte puede ayudar</h2>
              <p>              Elegí una necesidad aprobada o el centro comunitario.</p>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-category">Categoría de donación <span aria-hidden="true">*</span></label>
              <select id="donation-category" required value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-product">¿Qué vas a aportar? <span aria-hidden="true">*</span></label>
              <input
                id="donation-product"
                required
                maxLength={200}
                value={form.product}
                onChange={e => setForm(current => ({ ...current, product: e.target.value }))}
                placeholder="Ej. Paquetes de arroz y frijoles"
                aria-describedby="donation-product-count"
              />
              <small id="donation-product-count" className="help-form-hint help-form-counter">{form.product.length}/200 caracteres</small>
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-quantity">Cantidad de unidades <span aria-hidden="true">*</span></label>
              <input id="donation-quantity" type="number" min="1" max="100000" step="1" required value={form.quantity} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} />
            </div>

            <div className="help-form-field">
              <label htmlFor="donation-destination">Destino del aporte <span aria-hidden="true">*</span></label>
              <select id="donation-destination" required value={form.destination} onChange={e => setForm(current => ({ ...current, destination: e.target.value }))}>
                <option value="">Seleccionar solicitud aprobada o institución...</option>
                {(reqs || []).filter(r => r.status === 'Aprobada').map(r => (
                  <option key={r.id} value={r.id}>Solicitud #{r.id} · {r.description} ({r.zone})</option>
                ))}
                <option value="Institución">Centro Comunitario Institucional (Puntarenas)</option>
              </select>
            </div>

            <div className="help-form-checkbox">
              <input type="checkbox" id="anon" checked={form.anonymous} onChange={e => setForm(current => ({ ...current, anonymous: e.target.checked }))} />
              <label htmlFor="anon">
                <b>Modo anónimo:</b> Ocultar mi nombre públicamente en los registros de ayuda.
              </label>
            </div>

            {error && <div className="help-form-error" role="alert">{error}</div>}
            <button type="submit" className="btn primary help-form-submit" disabled={saving}>
              {saving ? 'Guardando aporte…' : 'Registrar aporte'}{!saving && <ArrowRight className="i i-r" size={14} />}
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
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const conversationEnd = useRef(null);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const ask = async (value) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion || sending) return;

    const history = messages.slice(-4).flatMap(message => [
      { role: 'user', content: message.question },
      { role: 'assistant', content: message.answer }
    ]);
    setMessages(previous => [...previous, { question: cleanQuestion, answer: null }]);
    setQuestion('');
    setError('');
    setSending(true);
    try {
      const response = await api('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ question: cleanQuestion, history })
      });
      setMessages(previous => previous.map((message, index) => (
        index === previous.length - 1 && message.answer === null
          ? { ...message, answer: response.answer }
          : message
      )));
    } catch (assistantError) {
      setMessages(previous => previous.slice(0, -1));
      setError(assistantError.message || 'No se pudo obtener una respuesta del asistente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">ASISTENTE IA · CR CONECTA</span>
        <h1>Orientación comunitaria</h1>
        <p>Preguntame cómo usar el sitio, sus roles o los flujos de solicitudes y donaciones. El asistente responde solo sobre CR Conecta.</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: '20px', border: '1px solid var(--line)', maxWidth: '750px', overflow: 'hidden' }}>
        <div aria-live="polite" aria-busy={sending} style={{ minHeight: '260px', maxHeight: '520px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#7a8e9f' }}>
              <MessageSquare size={30} />
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                {chatState === 'loading' ? 'Preparando el asistente…' : '¡Hola! Puedo orientarte sobre cómo funciona CR Conecta.'}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${index}-${message.question}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ alignSelf: 'flex-end', background: '#06244a', color: '#ffffff', padding: '10px 16px', borderRadius: '14px 14px 2px 14px', fontSize: '12.5px', maxWidth: '85%' }}>
                  {message.question}
                </div>
                {message.answer === null
                  ? <div role="status" style={{ alignSelf: 'flex-start', color: 'var(--muted)', padding: '10px', fontSize: '13px' }}>Estoy buscando en la información del sitio…</div>
                  : <div style={{ alignSelf: 'flex-start', background: 'var(--surface-soft)', color: 'var(--navy)', padding: '12px 16px', borderRadius: '2px 14px 14px 14px', fontSize: '13px', maxWidth: '85%', whiteSpace: 'pre-wrap' }}>{message.answer}</div>}
              </div>
            ))
          )}
          <div ref={conversationEnd} />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--danger)', padding: '0 20px', margin: '0 0 12px', fontSize: '13px' }}>
            {error}
          </p>
        )}

        <form onSubmit={event => { event.preventDefault(); void ask(question); }} style={{ background: 'var(--surface-soft)', padding: '16px 20px', borderTop: '1px solid var(--line-light)' }}>
          <label htmlFor="assistant-question" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Tu pregunta sobre CR Conecta</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="assistant-question"
              value={question}
              maxLength={1200}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ej. ¿Cómo registro una donación?"
              style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: '20px', border: '1px solid var(--line)' }}
              disabled={sending}
            />
            <button className="btn primary" type="submit" disabled={sending || !question.trim()}>
              {sending ? 'Consultando…' : 'Enviar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {answers.map(answer => (
              <button
                key={answer.id}
                type="button"
                disabled={sending}
                onClick={() => void ask(answer.question)}
                style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '20px', padding: '7px 14px', fontSize: '12px', color: 'var(--navy)', fontWeight: '600' }}
              >
                {answer.question}
              </button>
            ))}
          </div>
        </form>
      </div>
      <p style={{ maxWidth: '750px', fontSize: '12px', color: 'var(--muted)' }}>
        La IA solo orienta sobre el prototipo. No compartas información personal o sensible; sus respuestas pueden equivocarse.
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
function App() {
  return <Shell />;
}

 76fd0abefbfa11cbb3ed2e7504579328fb183949
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
