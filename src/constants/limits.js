// Configuración de límites estándar para solicitudes de ayuda (RF-10)
export const CATEGORY_LIMITS = {
  'Alimentos sellados': {
    maxPerRequest: 20,
    unit: 'paquetes',
    label: 'Alimentos sellados',
    description: 'Máximo 20 paquetes familiares por solicitud estándar.'
  },
  'Vestimenta': {
    maxPerRequest: 15,
    unit: 'piezas',
    label: 'Vestimenta',
    description: 'Máximo 15 piezas de ropa por núcleo familiar.'
  },
  'Mobiliario': {
    maxPerRequest: 2,
    unit: 'lotes',
    label: 'Mobiliario esencial',
    description: 'Máximo 2 lotes de mobiliario básico por solicitud.'
  },
  'Electrodomésticos': {
    maxPerRequest: 1,
    unit: 'unidades',
    label: 'Electrodomésticos',
    description: 'Máximo 1 unidad esencial (refrigerador, plantilla, etc.).'
  }
};

/**
 * Evalúa si una solicitud supera los límites configurados
 * @param {string} category 
 * @param {number} amount 
 * @param {Array} previousRequests 
 * @returns {Object} { exceeded: boolean, reason: string, maxAllowed: number }
 */
export function checkRequestLimits(category, amount, previousRequests = []) {
  const config = CATEGORY_LIMITS[category];
  const numAmount = Number(amount) || 0;
  
  if (!config) {
    return { exceeded: false, reason: '', maxAllowed: 999 };
  }

  // 1. Verificación de cantidad por solicitud
  if (numAmount > config.maxPerRequest) {
    return {
      exceeded: true,
      maxAllowed: config.maxPerRequest,
      reason: `La cantidad solicitada (${numAmount} ${config.unit}) excede el límite máximo configurado de ${config.maxPerRequest} ${config.unit} para la categoría ${category}.`
    };
  }

  // 2. Verificación de historial de ayudas recientes
  const activeSameCategory = previousRequests.filter(r => 
    r.category === category && (r.status === 'Aprobada' || r.status === 'En revisión')
  );
  const totalAccumulated = activeSameCategory.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  
  const historicalThreshold = config.maxPerRequest * 2;
  if (totalAccumulated + numAmount > historicalThreshold) {
    return {
      exceeded: true,
      maxAllowed: historicalThreshold,
      reason: `El historial acumulado de la familia en ${category} (${totalAccumulated + numAmount} ${config.unit}) supera el umbral de recurrencia bimestral (${historicalThreshold} ${config.unit}).`
    };
  }

  return { exceeded: false, reason: '', maxAllowed: config.maxPerRequest };
}
