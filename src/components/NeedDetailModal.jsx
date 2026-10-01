import { useRef } from 'react';
import { ArrowRight, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModalAccessibility } from '../lib/useModalAccessibility';

export function NeedDetailModal({ isOpen, onClose, need }) {
  const modalRef = useRef(null);
  useModalAccessibility(modalRef, isOpen && Boolean(need), onClose);
  const navigate = useNavigate();
  if (!isOpen || !need) return null;

  const progress = Math.min(100, Math.round(((need.received || 0) / (need.goal || need.amount || 1)) * 100));
  const handleDonate = () => {
    onClose();
    navigate(`/donar?requestId=${need.id}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="need-detail-title"
        tabIndex={-1}
        className="need-detail-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          width: 'min(580px, 94vw)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(6,36,74,0.22)',
          border: '1px solid var(--line)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ background: '#06244a', padding: '20px 26px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#8ec5db', fontWeight: '800', textTransform: 'uppercase' }}>
              Ficha limitada de necesidad aprobada
            </span>
            <h3 id="need-detail-title" style={{ margin: '4px 0 0', fontSize: '20px', color: '#ffffff' }}>
              Solicitud #{need.id}
            </h3>
          </div>
          <span 
            className={`priority-badge priority-${(need.priority || 'media').toLowerCase()}`}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800',
              background: need.priority === 'Alta' ? '#ffebe8' : need.priority === 'Baja' ? '#e2f4f8' : '#fef4dc',
              color: need.priority === 'Alta' ? '#c0392b' : need.priority === 'Baja' ? '#2980b9' : '#d35400',
              border: '1px solid currentColor'
            }}
          >
            PRIORIDAD {(need.priority || 'MEDIA').toUpperCase()}
          </span>
        </div>

        {/* Protection Notice Banner for RF-06 */}
        <div style={{ background: 'var(--surface-soft)', padding: '12px 24px', borderBottom: '1px solid var(--line-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3281a6', color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '13px', flexShrink: 0 }}>
            <ShieldCheck size={16} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4' }}>
            <strong>Protección de datos (RF-06):</strong> Ficha autorizada para donantes y voluntariado. Los datos de contacto personal y ubicación exacta permanecen resguardados por seguridad.
          </div>
        </div>

        {/* Content details */}
        <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Descripción de la necesidad
            </label>
            <p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: '600', color: 'var(--navy)', lineHeight: '1.45' }}>
              {need.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', background: 'var(--surface-soft)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line-light)' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Categoría</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--navy)' }}>{need.category}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Zona general</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--navy)' }}><MapPin className="i i-l" size={13} />{need.zone}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Meta de apoyo</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--navy)' }}>{need.goal || need.amount} {need.unit}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Aporte recibido</span>
              <strong style={{ fontSize: '13.5px', color: '#257f9f' }}>{need.received || 0} {need.unit} ({progress}%)</strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '600' }}>
              <span>Progreso de recolección comunitaria</span>
              <span>{progress}% cubierto</span>
            </div>
            <div style={{ height: '8px', background: '#e2ebf0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#3381a6', borderRadius: '10px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Masked beneficiary privacy display */}
          <div style={{ background: 'var(--surface-soft)', border: '1px dashed var(--line-light)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '700', color: 'var(--navy)' }}>Persona solicitante:</span>
              <span style={{ background: 'var(--surface-soft)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#276885', fontWeight: '600' }}>
                <Lock className="i i-l" size={13} />Identidad protegida (Núcleo en {need.zone})
              </span>
            </div>
            <span>Validada por administración de CR Conecta según criterios de vulnerabilidad comunitaria.</span>
          </div>

          {/* Decision details if available */}
          {need.decisionReason && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', borderLeft: '3px solid #7cb1c7', paddingLeft: '10px' }}>
              <em>Dictamen administrativo: {need.decisionReason} ({need.decisionDate})</em>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ padding: '16px 26px', background: 'var(--surface-soft)', borderTop: '1px solid var(--line-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <button type="button" className="btn secondary" onClick={onClose} style={{ padding: '10px 18px', fontSize: '12px' }}>
            Cerrar ficha
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn primary" 
              onClick={handleDonate}
              style={{ padding: '10px 22px', fontSize: '12.5px', background: '#06244a' }}
            >
              Quiero aportar a este caso<ArrowRight className="i i-r" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
