import React, { useState } from 'react';
import { ArrowRight, ClipboardList, Handshake, House, Package, Shirt, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AidServicesSection({ displayNeeds = [], onOpenNeedModal }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'active-cases'

  const aidCategories = [
    {
      id: 'alimentos',
      name: 'Alimentos sellados',
      tag: 'SEGURIDAD ALIMENTARIA',
      icon: <Package size={22} />,
      headerBg: '#f6eedf',
      accentColor: '#b65b45',
      summary: 'Paquetes de víveres esenciales y no perecederos para la nutrición del núcleo familiar.',
      includes: [
        'Granos básicos: arroz, frijoles y cereales',
        'Leche en polvo y suplementos infantiles',
        'Aceite, pastas y alimentos enlatados sellados'
      ],
      limitTag: 'Hasta 20 paquetes estándar (RF-10)',
      targetCategory: 'Alimentos sellados'
    },
    {
      id: 'vestimenta',
      name: 'Vestimenta y calzado',
      tag: 'ABRIGO FAMILIAR',
      icon: <Shirt size={22} />,
      headerBg: '#def1f6',
      accentColor: '#1e6888',
      summary: 'Prendas limpias, seleccionadas y clasificadas por tallas para niñas, niños y adultos.',
      includes: [
        'Ropa escolar e infantil por edades',
        'Calzado adecuado para clima de la zona',
        'Cobijas, sábanas y abrigo para el hogar'
      ],
      limitTag: 'Hasta 15 piezas por hogar (RF-10)',
      targetCategory: 'Vestimenta'
    },
    {
      id: 'mobiliario',
      name: 'Mobiliario esencial',
      tag: 'HABITABILIDAD Y DIGNIDAD',
      icon: <House size={22} />,
      headerBg: '#eaf1f5',
      accentColor: '#3d6c82',
      summary: 'Artículos indispensables para restituir las condiciones mínimas de vivienda de la familia.',
      includes: [
        'Juegos de mesa y sillas esenciales',
        'Camas, bases y colchones básicos',
        'Muebles para almacenamiento de enseres'
      ],
      limitTag: 'Hasta 2 lotes esenciales (RF-10)',
      targetCategory: 'Mobiliario'
    },
    {
      id: 'electrodomesticos',
      name: 'Electrodomésticos básicos',
      tag: 'PRESERVACIÓN Y COCINA',
      icon: <Zap size={22} />,
      headerBg: '#f2ecf7',
      accentColor: '#6b3d82',
      summary: 'Equipamiento imprescindible para la preparación e higiene en la conservación de alimentos.',
      includes: [
        'Refrigeradoras de bajo consumo energético',
        'Plantillas de cocina eléctricas o de gas',
        'Artefactos para hervir o purificar agua'
      ],
      limitTag: 'Máximo 1 unidad esencial (RF-10)',
      targetCategory: 'Electrodomésticos'
    }
  ];

  return (
    <section className="needs-section animate-on-scroll" id="ayudas-ofrecidas">
      <div className="section-container">
        
        {/* Section Intro with Remodeled Heading */}
        <div className="section-intro" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '750px' }}>
            <span className="eyebrow" style={{ display: 'inline-block', marginBottom: '8px' }}>
              PROGRAMAS Y MODALIDADES DE APOYO
            </span>
            <h2 style={{ margin: '0 0 10px', fontSize: '38px', letterSpacing: '-1.5px', color: '#06244a', fontWeight: '800' }}>
              ¿Qué ayudas ofrecemos?
            </h2>
            <p style={{ margin: 0, fontSize: '15.5px', color: '#597084', lineHeight: '1.6' }}>
              En CR Conecta coordinamos y canalizamos asistencia en 4 líneas prioritarias para las familias en condición de vulnerabilidad de Puntarenas, con validación comunitaria y límites que aseguran equidad.
            </p>
          </div>

          {/* Switcher Toggle */}
          <div style={{ display: 'flex', gap: '8px', background: '#edf4f7', padding: '5px', borderRadius: '30px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              style={{
                border: 'none',
                background: activeTab === 'categories' ? '#06244a' : 'transparent',
                color: activeTab === 'categories' ? '#ffffff' : '#4b657c',
                padding: '9px 18px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Package className="i i-l" size={16} />Tipos de ayuda que brindamos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active-cases')}
              style={{
                border: 'none',
                background: activeTab === 'active-cases' ? '#06244a' : 'transparent',
                color: activeTab === 'active-cases' ? '#ffffff' : '#4b657c',
                padding: '9px 18px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ClipboardList className="i i-l" size={16} />Solicitudes activas cerca de vos
            </button>
          </div>
        </div>

        {/* TAB 1: 4 CATEGORIES OF ASSISTANCE WE OFFER */}
        {activeTab === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '30px' }} className="aid-categories-grid">
            {aidCategories.map((cat, idx) => (
              <div
                key={cat.id}
                className="aid-category-card card-gpu-optimized"
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #dce8ec',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(6, 36, 74, 0.04)'
                }}
              >
                {/* Visual Header matching Mockup Aesthetics */}
                <div
                  style={{
                    height: '92px',
                    background: cat.headerBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '22px',
                      color: '#06244a',
                      boxShadow: '0 4px 12px rgba(6, 36, 74, 0.08)'
                    }}
                  >
                    {cat.icon}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', color: cat.accentColor, marginBottom: '6px' }}>
                    {cat.tag}
                  </span>

                  <h3 style={{ fontSize: '18px', color: '#072448', margin: '0 0 8px', fontWeight: '700' }}>
                    {cat.name}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#5e758a', lineHeight: '1.5', margin: '0 0 14px' }}>
                    {cat.summary}
                  </p>

                  {/* Bullet Points */}
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #edf2f6', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>¿Qué incluye?</span>
                    {cat.includes.map((item, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#257a9e', fontWeight: '800' }}>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limit guideline */}
                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #edf2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                      {cat.limitTag}
                    </span>
                    <Link
                      to="/solicitar"
                      style={{ fontSize: '12px', color: '#257a9e', fontWeight: '800', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}
                    >
                      Solicitar<ArrowRight className="i i-r" size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: ACTIVE APPROVED CASES MATCHING MOCKUP */}
        {activeTab === 'active-cases' && (
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12.5px', color: '#5b7388' }}>
                Mostrando solicitudes aprobadas de demostración en Puntarenas con identidad protegida (RF-06):
              </span>
              <Link to="/necesidades" className="text-link" style={{ fontSize: '12.5px' }}>
                Ver todas en el catálogo<ArrowRight className="i i-r" size={14} />
              </Link>
            </div>

            <div className="need-grid">
              {displayNeeds.map((r, i) => {
                const mockPercentages = [45, 70, 25];
                const progress = r.received && r.goal 
                  ? Math.min(100, Math.round((r.received / r.goal) * 100))
                  : (mockPercentages[i % 3] || 50);

                const icons = [<Package size={22} />, <Shirt size={22} />, <House size={22} />];

                return (
                  <article key={r.id} className={`need-card c${i % 3} card-gpu-optimized`}>
                    <div className="need-top">
                      <div className="icon-square">
                        {icons[i % 3]}
                      </div>
                    </div>

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
                        <button type="button" onClick={() => onOpenNeedModal(r)}>
                          Ver ficha pública (RF-06)<ArrowRight className="i i-r" size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Strip */}
        <div 
          style={{
            marginTop: '34px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #dce8ec',
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(6, 36, 74, 0.02)'
          }}
          className="card-gpu-optimized"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Handshake size={26} />
            <div>
              <strong style={{ fontSize: '14px', color: '#06244a', display: 'block' }}>
                ¿Tu familia o comunidad necesita alguna de estas ayudas?
              </strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Podés formular una solicitud en línea. Se registrará en estado "En revisión" para validación comunitaria.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link className="btn primary" to="/solicitar" style={{ padding: '10px 20px', fontSize: '12.5px' }}>
              Solicitar ayuda (RF-07)<ArrowRight className="i i-r" size={14} />
            </Link>
            <Link className="btn secondary" to="/donar" style={{ padding: '10px 20px', fontSize: '12.5px' }}>
              Quiero donar<ArrowRight className="i i-r" size={14} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
