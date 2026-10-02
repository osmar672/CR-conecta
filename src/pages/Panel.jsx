import React, { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, CircleCheck, Clock3, HeartHandshake, MapPin, Package, PackageCheck, PenLine, Pencil, Route as RouteIcon, UsersRound } from 'lucide-react';
import { api } from '../lib/api';
import { useData } from '../lib/useData';
import { GoogleIcon } from '../components/GoogleAccessModal';
import { BeneficiarySection } from '../components/BeneficiarySection';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { DashboardBarChart, DashboardMetric, dashboardCounts } from '../components/DashboardCharts';
import { DonationsView } from '../components/DonationsView';
import { CampaignProjection } from '../components/CampaignProjection';

function AdminOverview({ dons, inv, trans, campaigns, jobs, refreshCount, onRefresh }) {
  const { data: users = [], state: usersState } = useData('/users', refreshCount);
  const { data: activity = [], state: activityState } = useData('/activity', refreshCount);
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
        <DashboardMetric icon={HeartHandshake} label="Donaciones" value={dons.length} detail={`${donationUnits} unidades aportadas`} tone="green" />
        <DashboardMetric icon={Package} label="Alertas de inventario" value={stockAlerts.length} detail={`${inv.length} productos registrados`} tone="red" />
        <DashboardMetric icon={RouteIcon} label="Traslados en ruta" value={inRouteTransfers.length} detail={`${trans.length} traslados registrados`} tone="blue" />
        <DashboardMetric icon={BarChart3} label="Campañas activas" value={campaigns.filter(campaign => campaign.status === 'Activa').length} detail={`${campaigns.length} campañas · ${jobs.length} oportunidades`} tone="green" />
      </div>
      <div className="dashboard-chart-grid">
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

function RoleDashboard({ role, session, dons, inv, trans, campaigns }) {
  const myDonations = dons.filter(donation => donation.donorId === session.id);
  const myDonationUnits = myDonations.reduce((sum, donation) => sum + (Number(donation.quantity) || 0), 0);
  const deliveredDonations = myDonations.filter(donation => donation.status === 'Entregada');
  const myCampaigns = campaigns.filter(campaign => campaign.companyId === session.id);
  const myTransfers = trans.filter(transfer => transfer.responsible === session.name);
  const normalizedZone = session.zone?.trim().toLowerCase();
  const localDonations = normalizedZone
    ? dons.filter(donation => donation.destination?.toLowerCase().includes(normalizedZone))
    : [];
  const stockAlerts = inv.filter(item => item.available <= item.minimum);
  const inRouteTransfers = trans.filter(transfer => transfer.status === 'En ruta');

  if (role === 'Administrador') {
    const donationCategories = dashboardCounts(dons, donation => donation.category);
    return (
      <div className="role-dashboard">
        <div className="dashboard-kpis">
          <DashboardMetric icon={Package} label="Alertas de stock" value={stockAlerts.length} detail="Productos bajo mínimo" tone="red" />
          <DashboardMetric icon={RouteIcon} label="En ruta" value={inRouteTransfers.length} detail="Traslados activos" tone="blue" />
          <DashboardMetric icon={HeartHandshake} label="Donaciones" value={dons.length} detail="Aportes registrados" tone="green" />
        </div>
        <div className="dashboard-chart-grid">
          <DashboardBarChart title="Donaciones por categoría" subtitle="Distribución de los aportes registrados" items={donationCategories} />
        </div>
        <section className="dashboard-card dashboard-insight">
          <span className="dashboard-insight-icon"><PackageCheck size={20} /></span>
          <div><strong>Seguimiento operativo</strong><p>La revisión y el dictamen de solicitudes se gestionan en la sección Solicitudes del menú principal.</p></div>
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

  const localCategories = dashboardCounts(localDonations, donation => donation.category);
  return (
    <div className="role-dashboard">
      <div className="dashboard-kpis">
        <DashboardMetric icon={MapPin} label="Zona de apoyo" value={session.zone || 'Comunidad'} detail="Centro comunitario asignado" tone="blue" />
        <DashboardMetric icon={HeartHandshake} label="Aportes locales" value={localDonations.length} detail="Donaciones vinculadas a tu zona" tone="green" />
      </div>
      <div className="dashboard-chart-grid">
        <DashboardBarChart title="Aportes por categoría en la zona" subtitle={`Donaciones vinculadas a ${session.zone || 'tu comunidad'}`} items={localCategories} />
        <section className="dashboard-card dashboard-chart-card">
          <div className="dashboard-chart-heading"><span className="dashboard-chart-icon"><UsersRound size={18} /></span><div><h3>Tu comunidad conectada</h3><p>Resumen de colaboración local</p></div></div>
          <div className="dashboard-community-summary">
            <strong>{localDonations.length}</strong><span>aportes vinculados a tu zona</span>
            <p>Coordiná con las personas donantes y el voluntariado para acercar los aportes a quienes más los necesitan.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function Panel({ session, onLogin, onOpenGoogleAuth }) {
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
  const [editingProfile, setEditingProfile] = useState(false);

  // Available tabs depending on role (RF-03)
  const availableTabs = useMemo(() => {
    if (isAdmin) return ['resumen', 'inventario', 'traslados', 'empresa y aliados'];
    if (isBeneficiary) return ['beneficiario', 'empleos'];
    if (isDonor) return ['resumen', 'mis donaciones', 'necesidades'];
    if (isCompany) return ['resumen', 'campañas y empleo', 'donaciones'];
    if (isVolunteer) return ['resumen', 'traslados asignados', 'necesidades'];
    return ['resumen', 'colaboraciones'];
  }, [isAdmin, isBeneficiary, isDonor, isCompany, isVolunteer]);

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
              dons={dons}
              inv={inv}
              trans={trans}
              campaigns={campaigns}
            />
      )}

 erian-feature
      {((isAdmin && tab === 'resumen') || (isCompany && tab === 'campañas y empleo')) && (
        <CampaignProjection campaigns={campaigns} />
      )}

      {/* ADMIN EVALUATION OF REQUESTS (RF-08, RF-09, RF-10) */}
      {(tab === 'solicitudes (RF-08/09/10)' || (isAdmin && tab === 'solicitudes')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header filter controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #dce8ec', flexWrap: 'wrap', gap: '10px' }}>
            <div className="request-filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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


 main
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
                <div style={{ marginTop: '10px', background: 'var(--danger-bg)', color: 'var(--danger-fg)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
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
                <span style={{ background: 'var(--info-bg)', color: 'var(--info-fg)', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
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
                    <span style={{ background: 'var(--tag-bg)', padding: '6px 10px', borderRadius: '6px', fontWeight: '600' }}>{p}</span>
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
              <p style={{fontSize:'12px', color:'var(--muted)'}}>Zona: {a.zone} | Contacto: {a.contact}</p>
              <div style={{marginTop:'10px', background: 'var(--info-bg)', color: 'var(--info-fg)', padding:'6px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700'}}>
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
                <p style={{fontSize:'12px', color:'var(--muted)'}}>{c.description}</p>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px', fontSize:'11px', fontWeight:'700'}}>
                  <span>Progreso: {c.progress} / {c.goal} {c.unit}</span>
                  <span style={{color: 'var(--ok-fg)'}}>{c.status}</span>
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
                <p style={{fontSize:'12px', color:'var(--muted)'}}>{j.description}</p>
                <div style={{marginTop:'10px', fontSize:'11px', color: 'var(--navy)'}}>
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
              <p style={{fontSize:'12px', color:'var(--muted)'}}>{j.description}</p>
              <div style={{marginTop:'10px', fontSize:'11px', color: 'var(--navy)', marginBottom:'16px'}}>
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
          <p style={{fontSize:'12px', color:'var(--muted)'}}>Sos un aliado clave en el prototipo. Podés coordinar las entregas y facilitar el acopio local.</p>
          <div style={{marginTop:'16px'}}>
            <button className="btn secondary" onClick={() => alert('Función de demostración')}>
              Ver agenda comunitaria
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
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
