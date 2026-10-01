import { useState } from 'react';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { RoleAvatar, roleIcons } from '../components/ShellParts';

export function Profile({ session, onUpdateSession, onLogout, onOpenGoogleAuth }) {
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
          <RoleAvatar src={roleIcons[session.role] || '/logo-mark.png'} alt={session.role} size={68} />
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
