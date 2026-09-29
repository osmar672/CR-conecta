import React, { useState } from 'react';
import { API_URL } from '../constants/config';
import { AlertTriangle, ArrowRight, Check, ClipboardList, Mail, MapPin, Pencil, Phone, Star } from 'lucide-react';
import { CATEGORY_LIMITS, checkRequestLimits } from '../constants/limits';

export function BeneficiarySection({ session, onOpenEditProfile, requests = [], onRefreshRequests }) {
  const [category, setCategory] = useState('Alimentos sellados');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('paquetes');
  const [zone, setZone] = useState(session?.zone || 'Barranca');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filter requests belonging to this beneficiary
  const myRequests = requests.filter(r => r.beneficiaryId === session?.id || r.beneficiaryId === 'u2');

  // Unit auto-adaptation by category
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'Alimentos sellados') setUnit('paquetes');
    else if (newCat === 'Vestimenta') setUnit('piezas');
    else if (newCat === 'Mobiliario') setUnit('lotes');
    else if (newCat === 'Electrodomésticos') setUnit('unidades');
  };

  // RF-10 Real-time limit verification
  const limitCheck = checkRequestLimits(category, amount, myRequests);
  const isLimitExceeded = limitCheck.exceeded;
  const categoryConfig = CATEGORY_LIMITS[category];

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    const newRequestId = `CC-${Math.floor(200 + Math.random() * 800)}`;
    const newRequest = {
      id: newRequestId,
      category,
      description,
      amount: Number(amount),
      unit,
      zone,
      date,
      status: 'En revisión', // RF-07: asignarle En revisión como estado inicial
      priority: 'Media',     // Default priority pending admin evaluation (RF-09)
      goal: Number(amount),
      received: 0,
      beneficiaryId: session?.id || 'u2',
      limitExceeded: isLimitExceeded, // RF-10: Comparación y alerta de exceso
      requiresException: isLimitExceeded,
      limitDetails: isLimitExceeded ? limitCheck.reason : null,
      decisionReason: null,
      decisionDate: null
    };

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (!res.ok) throw new Error('Error al registrar la solicitud');

      setNotification({
        type: 'success',
        text: `Solicitud #${newRequestId} registrada exitosamente con estado inicial "En revisión". ${isLimitExceeded ? 'Supera el límite estándar; pasará a revisión de excepción administrativa.' : ''}`
      });

      // Reset form
      setDescription('');
      setAmount(1);
      if (onRefreshRequests) onRefreshRequests();
    } catch (err) {
      setNotification({
        type: 'error',
        text: 'No se pudo guardar la solicitud en JSON Server. Verificá que el servidor esté activo.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async (req) => {
    try {
      await fetch(`${API_URL}/requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryConfirmed: true,
          deliveryConfirmationDate: new Date().toISOString().slice(0, 10)
        })
      });
      setNotification({
        type: 'success',
        text: `¡Entrega de la solicitud #${req.id} confirmada con éxito por la persona beneficiaria!`
      });
      if (onRefreshRequests) onRefreshRequests();
    } catch {
      setNotification({ type: 'error', text: 'Error al confirmar la entrega' });
    }
  };

  return (
    <div className="beneficiary-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* RF-05 Beneficiary Profile Card */}
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #dce7eb',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 8px 25px rgba(6,36,74,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div 
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#06244a',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '18px',
              fontWeight: '800'
            }}
          >
            BE
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#09274c' }}>{session?.name}</h2>
              <span style={{ background: '#e6f4ea', color: '#137333', border: '1px solid #ceead6', borderRadius: '14px', padding: '3px 10px', fontSize: '12px', fontWeight: '700' }}>
                Rol: Beneficiario (RF-05)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', color: '#627689', fontSize: '12.5px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span><Mail className="i i-l" size={13} />{session?.email}</span>
              <span><Phone className="i i-l" size={13} />{session?.phone || '+506 8888-0002'}</span>
              <span><MapPin className="i i-l" size={13} />{session?.zone || 'Barranca'}</span>
            </div>
            {session?.notes && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#7a8e9e' }}>
                <em>"{session.notes}"</em>
              </p>
            )}
          </div>
        </div>

        <button 
          type="button" 
          className="btn secondary" 
          onClick={onOpenEditProfile}
          style={{ padding: '9px 18px', fontSize: '12px', borderRadius: '10px' }}
        >
          Editar mis datos (RF-04)<Pencil className="i i-r" size={14} />
        </button>
      </div>

      {notification && (
        <div 
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: notification.type === 'success' ? '#eef7f2' : '#fef2f2',
            border: notification.type === 'success' ? '1px solid #b7e1cd' : '1px solid #fecaca',
            color: notification.type === 'success' ? '#0f5132' : '#b91c1c',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          {notification.text}
        </div>
      )}

      {/* Grid: Formulate Request (RF-07, RF-10) and My Requests (RF-05) */}
      <div className="beneficiary-grid">
        
        {/* Formulate Request Box */}
        <div 
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #dce7eb',
            padding: '24px 28px',
            boxShadow: '0 8px 25px rgba(6,36,74,0.03)'
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#2b789e', fontWeight: '800' }}>
              NUEVA SOLICITUD (RF-07)
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#09274c' }}>
              Formular solicitud de ayuda
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#687d91' }}>
              Ingresá el requerimiento. La solicitud quedará inicialmente en estado <b>En revisión</b>.
            </p>
          </div>

          <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Categoría de apoyo *
              </label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {Object.keys(CATEGORY_LIMITS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Descripción de la necesidad *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej. Alimentos sellados para núcleo familiar de 5 personas"
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Cantidad solicitada *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Unidad de medida *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Zona general *
                </label>
                <input
                  type="text"
                  required
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  placeholder="Ej. Barranca, El Roble"
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Fecha de solicitud *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* RF-10 Limits Alert indicator */}
            {isLimitExceeded ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#92400e', display: 'flex', gap: '10px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Aviso de límite (RF-10):</strong> {limitCheck.reason}
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#78350f' }}>
                    Podés enviar la solicitud, pero requerirá de una aprobación con excepción administrativa autorizada.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '9px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <Check className="i i-l" size={14} />Cantidad dentro del límite ordinario permitido ({categoryConfig?.maxPerRequest} {categoryConfig?.unit}).
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn primary"
              style={{ padding: '12px 24px', fontSize: '13.5px', background: '#06244a', marginTop: '6px' }}
            >
              {submitting ? 'Registrando solicitud...' : <>Enviar solicitud (En revisión)<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </form>
        </div>

        {/* Mis Solicitudes y Ayudas Consultadas (RF-05) */}
        <div 
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #dce7eb',
            padding: '24px 28px',
            boxShadow: '0 8px 25px rgba(6,36,74,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#2b789e', fontWeight: '800' }}>
              CONSULTA DE AYUDAS (RF-05)
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#09274c' }}>
              Mis solicitudes registradas
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#687d91' }}>
              Consultá el estado actual, prioridad y progreso de cada apoyo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '550px' }}>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#889baa' }}>
                <ClipboardList size={32} />
                <p style={{ margin: '10px 0 0', fontSize: '13px' }}>Aún no has registrado solicitudes de ayuda.</p>
              </div>
            ) : (
              myRequests.map(r => {
                const progress = Math.min(100, Math.round(((r.received || 0) / (r.goal || r.amount || 1)) * 100));
                const isApproved = r.status === 'Aprobada';
                const isDenied = r.status === 'Denegada';
                const isPending = r.status === 'En revisión';

                return (
                  <div
                    key={r.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '16px',
                      background: '#fafcff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', color: '#06244a', fontSize: '13px' }}>
                        #{r.id} · <span style={{ color: '#5b7185', fontWeight: '600' }}>{r.category}</span>
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: isApproved ? '#dcfce7' : isDenied ? '#fee2e2' : '#fef3c7',
                            color: isApproved ? '#15803d' : isDenied ? '#b91c1c' : '#b45309'
                          }}
                        >
                          {r.status}
                        </span>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: r.priority === 'Alta' ? '#ffebe8' : r.priority === 'Baja' ? '#e2f4f8' : '#fef4dc',
                            color: r.priority === 'Alta' ? '#c0392b' : r.priority === 'Baja' ? '#2980b9' : '#d35400'
                          }}
                        >
                          {r.priority}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
                      {r.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                      <span>Zona: {r.zone}</span>
                      <span>Cantidad: {r.amount} {r.unit}</span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        <span>Progreso de donaciones</span>
                        <span>{r.received || 0} / {r.goal || r.amount} {r.unit} ({progress}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#257f9f', borderRadius: '6px' }} />
                      </div>
                    </div>

                    {/* Admin decision reason if evaluated (RF-08) */}
                    {r.decisionReason && (
                      <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155' }}>
                        <strong>Dictamen administrativo:</strong> {r.decisionReason} ({r.decisionDate})
                        {r.exceptionGranted && (
                          <div style={{ color: '#b45309', fontWeight: '600', marginTop: '2px' }}>
                            <Star className="i i-l" size={14} />Aprobada con excepción administrativa: {r.exceptionReason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery confirmation action */}
                    {isApproved && (r.received > 0 || r.deliveryConfirmed) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        {r.deliveryConfirmed ? (
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
                            <Check className="i i-l" size={14} />Entrega confirmada por beneficiario ({r.deliveryConfirmationDate || 'Registrada'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConfirmDelivery(r)}
                            style={{ background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Confirmar recepción de ayuda<Check className="i i-r" size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
