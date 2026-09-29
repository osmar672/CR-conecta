import React, { useState } from 'react';
import { API_URL } from '../constants/config';
import { ArrowRight, Info } from 'lucide-react';

export function ProfileEditModal({ isOpen, onClose, user, onSaved }) {
  if (!isOpen || !user) return null;

  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '+506 8888-0000',
    zone: user.zone || 'Puntarenas',
    notes: user.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          zone: form.zone,
          notes: form.notes
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el perfil en el servidor');
      }

      const updatedUser = await response.json();
      onSaved(updatedUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios en db.json');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="profile-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: 'min(500px, 94vw)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(6,36,74,0.22)',
          border: '1px solid #dce7eb',
          overflow: 'hidden'
        }}
      >
        <div style={{ background: '#06244a', padding: '20px 24px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#8ec5db', fontWeight: '800' }}>
              ACTUALIZACIÓN DE PERFIL (RF-04)
            </span>
            <h3 style={{ margin: '3px 0 0', fontSize: '19px', color: '#ffffff' }}>
              Editar datos de {user.name}
            </h3>
          </div>
          <span style={{ background: '#133e6f', color: '#d8ebf5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
            {user.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
              Nombre de demostración *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Teléfono de contacto ficticio *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+506 8888-0000"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Zona general *
              </label>
              <select
                value={form.zone}
                onChange={e => setForm({ ...form, zone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="Puntarenas">Puntarenas</option>
                <option value="Barranca">Barranca</option>
                <option value="El Roble">El Roble</option>
                <option value="Chacarita">Chacarita</option>
                <option value="San José">San José</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
              Descripción / Notas del perfil (datos no sensibles)
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Información general de rol, disponibilidad o condición comunitaria..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <Info className="i i-l" size={14} />Los cambios se persisten de inmediato en <code>db.json</code> mediante la API local de JSON Server.
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn secondary" onClick={onClose} style={{ padding: '9px 18px', fontSize: '12.5px' }}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={loading} style={{ padding: '9px 22px', fontSize: '12.5px', background: '#06244a' }}>
              {loading ? 'Guardando...' : <>Guardar en db.json<ArrowRight className="i i-r" size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
