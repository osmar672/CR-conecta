import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, Ban, Check, CheckCircle2, MapPin, X } from 'lucide-react';
import { CATEGORY_LIMITS, checkRequestLimits } from '../constants/limits';

export function RequestEvaluationModal({ isOpen, onClose, request, allRequests = [], adminSession, onSave }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const limitCheck = request
    ? checkRequestLimits(request.category, request.amount, allRequests.filter(r => r.id !== request.id && r.beneficiaryId === request.beneficiaryId))
    : { exceeded: false, reason: '' };
  const isExceeded = request ? (request.limitExceeded || limitCheck.exceeded) : false;

  const [decision, setDecision] = useState(request?.status === 'Aprobada' ? 'Aprobada' : request?.status === 'Denegada' ? 'Denegada' : 'Aprobada');
  const [priority, setPriority] = useState(request.priority || 'Media');
  const [reason, setReason] = useState(request.decisionReason || '');
  const [decisionDate, setDecisionDate] = useState(request.decisionDate || todayStr);
  
  // RF-10: Exception fields
  const [grantException, setGrantException] = useState(Boolean(request.exceptionGranted));
  const [exceptionReason, setExceptionReason] = useState(request.exceptionReason || '');
  const [authorizedBy, setAuthorizedBy] = useState(request.exceptionAuthorizedBy || adminSession?.name || 'Administración CR Conecta');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !request) return null;

  useEffect(() => {
    if (!reason) {
      if (decision === 'Aprobada') {
        setReason(isExceeded ? 'Aprobada bajo excepción administrativa por vulnerabilidad comprobada.' : 'Cumple con los criterios de necesidad y validación de la comunidad.');
      } else {
        setReason('No se ajusta a los criterios de atención prioritaria del programa.');
      }
    }
  }, [decision, isExceeded]);

  const categoryConfig = CATEGORY_LIMITS[request.category];

  // RF-10 block rule: If exceeded and trying to approve, must have granted exception with a non-empty reason
  const isApprovalBlocked = decision === 'Aprobada' && isExceeded && (!grantException || !exceptionReason.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Debés ingresar el motivo de la decisión.');
      return;
    }

    if (decision === 'Aprobada' && isExceeded && !grantException) {
      setErrorMsg('La solicitud excede los límites configurados. Debés registrar una excepción administrativa para poder aprobarla.');
      return;
    }

    if (grantException && !exceptionReason.trim()) {
      setErrorMsg('Por favor especificá la justificación de la excepción administrativa.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        status: decision,
        priority: priority,
        decisionReason: reason,
        decisionDate: decisionDate,
        limitExceeded: isExceeded,
        exceptionGranted: decision === 'Aprobada' && isExceeded ? true : (request.exceptionGranted || false),
        exceptionReason: decision === 'Aprobada' && isExceeded ? exceptionReason : (request.exceptionReason || null),
        exceptionAuthorizedBy: decision === 'Aprobada' && isExceeded ? authorizedBy : (request.exceptionAuthorizedBy || null),
        exceptionDate: decision === 'Aprobada' && isExceeded ? decisionDate : (request.exceptionDate || null)
      };

      await onSave(request.id, payload);
      onClose();
    } catch (err) {
      setErrorMsg('Ocurrió un error al guardar la evaluación en db.json.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="evaluation-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: 'min(680px, 95vw)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(6,36,74,0.22)',
          border: '1px solid #dce7eb',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ background: '#06244a', padding: '20px 28px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#8ec5db', fontWeight: '800' }}>
              EVALUACIÓN ADMINISTRATIVA (RF-08, RF-09, RF-10)
            </span>
            <h3 style={{ margin: '3px 0 0', fontSize: '20px', color: '#ffffff' }}>
              Evaluar Solicitud #{request.id}
            </h3>
          </div>
          <span style={{ background: '#133e6f', color: '#d8ebf5', padding: '5px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '700' }}>
            Estado actual: {request.status}
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Summary Box */}
          <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Categoría & Ayuda</span>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{request.category}</strong>
              <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '2px' }}>{request.description}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Cantidad solicitada & Zona</span>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{request.amount} {request.unit}</strong>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}><MapPin className="i i-l" size={13} />{request.zone} · Fecha: {request.date}</div>
            </div>
          </div>

          {/* RF-10 Limits Comparison Card */}
          <div 
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              border: isExceeded ? '1.5px solid #f87171' : '1px solid #cbd5e1',
              background: isExceeded ? '#fff5f5' : '#f0fdf4'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{isExceeded ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
                <strong style={{ fontSize: '13.5px', color: isExceeded ? '#991b1b' : '#166534' }}>
                  {isExceeded ? 'Control de límites: EXCESO DETECTADO (RF-10)' : 'Control de límites: DENTRO DE LOS PARÁMETROS'}
                </strong>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: isExceeded ? '#fee2e2' : '#dcfce7', color: isExceeded ? '#b91c1c' : '#15803d' }}>
                {isExceeded ? 'Bloqueo activo' : 'Normal'}
              </span>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '12px', color: isExceeded ? '#7f1d1d' : '#14532d', lineHeight: '1.45' }}>
              {isExceeded 
                ? (request.limitDetails || limitCheck.reason || `La cantidad solicitada (${request.amount} ${request.unit}) supera el límite de ${categoryConfig?.maxPerRequest || 20} ${categoryConfig?.unit || 'unidades'} configurado para esta categoría.`)
                : `La cantidad solicitada (${request.amount} ${request.unit}) respeta el límite estándar de hasta ${categoryConfig?.maxPerRequest || 20} ${categoryConfig?.unit || 'unidades'}.`}
            </p>

            {isExceeded && (
              <div style={{ fontSize: '12px', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca', color: '#b91c1c' }}>
                <strong>Regla de negocio:</strong> La aprobación está <u>bloqueada</u> por defecto hasta que un administrador registre formalmente una excepción con su justificación correspondiente.
              </div>
            )}
          </div>

          {/* Decision and Priority Row (RF-08 & RF-09) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* RF-08 Decision */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Decisión administrativa (RF-08) *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDecision('Aprobada')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: decision === 'Aprobada' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: decision === 'Aprobada' ? '#ecfdf5' : '#ffffff',
                    color: decision === 'Aprobada' ? '#047857' : '#475569',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Check className="i i-l" size={14} />Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('Denegada')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: decision === 'Denegada' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    background: decision === 'Denegada' ? '#fef2f2' : '#ffffff',
                    color: decision === 'Denegada' ? '#b91c1c' : '#475569',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <X className="i i-l" size={14} />Denegar
                </button>
              </div>
            </div>

            {/* RF-09 Priority */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Asignar Prioridad (RF-09) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Alta', 'Media', 'Baja'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: '11px 6px',
                      borderRadius: '10px',
                      border: priority === p ? '2px solid #06244a' : '1px solid #cbd5e1',
                      background: priority === p 
                        ? (p === 'Alta' ? '#ffebe8' : p === 'Media' ? '#fef4dc' : '#e2f4f8')
                        : '#ffffff',
                      color: priority === p 
                        ? (p === 'Alta' ? '#c0392b' : p === 'Media' ? '#d35400' : '#2980b9')
                        : '#64748b',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RF-10 Administrative Exception Box */}
          {isExceeded && decision === 'Aprobada' && (
            <div style={{ background: '#fdfbf7', border: '1.5px dashed #f59e0b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="grantException"
                  checked={grantException}
                  onChange={e => setGrantException(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="grantException" style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', cursor: 'pointer' }}>
                  Registrar excepción administrativa y desbloquear aprobación
                </label>
              </div>

              {grantException && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', paddingLeft: '28px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#78350f', display: 'block', marginBottom: '4px' }}>
                      Justificación formal de la excepción *
                    </label>
                    <textarea
                      required={grantException}
                      value={exceptionReason}
                      onChange={e => setExceptionReason(e.target.value)}
                      placeholder="Ejemplo: Caso de familia extendida con 7 personas y pérdida total por emergencia en Barranca."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #d97706',
                        fontSize: '12px',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#78350f', display: 'block', marginBottom: '4px' }}>
                      Administrador que autoriza la excepción *
                    </label>
                    <input
                      type="text"
                      required={grantException}
                      value={authorizedBy}
                      onChange={e => setAuthorizedBy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #d97706',
                        fontSize: '12px',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Reason & Date (RF-08) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Motivo de la decisión (RF-08) *
              </label>
              <textarea
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ingresá los argumentos o criterios que sustentan esta resolución..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Fecha de la decisión *
              </label>
              <input
                type="date"
                required
                value={decisionDate}
                onChange={e => setDecisionDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '9px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Error notice if blocked */}
          {isApprovalBlocked && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
              <Ban className="i i-l" size={14} /><strong>Aprobación bloqueada:</strong> Esta solicitud supera el límite permitido. Marcá "Registrar excepción administrativa" y detallá la justificación para proceder.
            </div>
          )}

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
              {errorMsg}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              style={{ padding: '11px 20px', fontSize: '13px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || isApprovalBlocked}
              style={{
                padding: '11px 26px',
                fontSize: '13px',
                background: isApprovalBlocked ? '#64748b' : '#06244a',
                cursor: isApprovalBlocked ? 'not-allowed' : 'pointer',
                opacity: isApprovalBlocked ? 0.7 : 1
              }}
            >
              {submitting ? 'Guardando en db.json...' : <>{`Guardar resolución (${decision})`}<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
