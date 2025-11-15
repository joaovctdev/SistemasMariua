// src/components/KPICard.jsx
import React from 'react';

/**
 * KPICard - Componente de card para exibir KPIs (Key Performance Indicators)
 *
 * @param {Object} props
 * @param {string} props.title - Título do KPI
 * @param {number|string} props.value - Valor principal do KPI
 * @param {number} props.variation - Variação percentual em relação ao mês anterior
 * @param {string} props.icon - Emoji ou ícone a ser exibido
 * @param {string} props.color - Cor principal do card (hex)
 * @param {string} props.format - Formato do valor: 'number' | 'currency' | 'percentage'
 * @param {Object} props.meta - Metas (opcional): { weekly: number, monthly: number }
 * @param {boolean} props.loading - Estado de carregamento
 */
const KPICard = ({
  title = 'KPI',
  value = 0,
  variation = 0,
  icon = '📊',
  color = '#00989E',
  format = 'number',
  meta = null,
  loading = false
}) => {

  // Formata o valor conforme o tipo
  const formatValue = (val, formatType) => {
    if (val === null || val === undefined) return '-';

    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);

      case 'percentage':
        return `${val.toFixed(1)}%`;

      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  // Determina a cor da variação (verde para positivo, vermelho para negativo)
  const getVariationColor = () => {
    if (variation > 0) return '#00989E'; // Verde
    if (variation < 0) return '#F15137'; // Vermelho
    return '#6B7280'; // Cinza neutro
  };

  // Ícone de seta
  const getVariationIcon = () => {
    if (variation > 0) return '↑';
    if (variation < 0) return '↓';
    return '→';
  };

  // Calcula progresso em relação à meta (se houver)
  const getMetaProgress = () => {
    if (!meta || !meta.monthly) return null;
    const progress = (value / meta.monthly) * 100;
    return Math.min(progress, 100);
  };

  const metaProgress = getMetaProgress();

  // Loading skeleton
  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.loadingSkeleton}>
          <div style={{...styles.skeletonBar, width: '60%', height: '16px'}}></div>
          <div style={{...styles.skeletonBar, width: '80%', height: '36px', marginTop: '12px'}}></div>
          <div style={{...styles.skeletonBar, width: '40%', height: '14px', marginTop: '8px'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card} className="kpi-card">
      {/* Header com ícone */}
      <div style={styles.header}>
        <div style={{...styles.iconCircle, background: `${color}20`}}>
          <span style={{...styles.icon, color: color}}>{icon}</span>
        </div>
      </div>

      {/* Título */}
      <div style={styles.title}>{title}</div>

      {/* Valor principal */}
      <div style={{...styles.value, color: color}}>
        {formatValue(value, format)}
      </div>

      {/* Variação mensal */}
      <div style={styles.variationContainer}>
        <span style={{...styles.variation, color: getVariationColor()}}>
          {getVariationIcon()} {Math.abs(variation).toFixed(1)}%
        </span>
        <span style={styles.variationLabel}>vs mês anterior</span>
      </div>

      {/* Barra de progresso de meta (opcional) */}
      {meta && meta.monthly && (
        <div style={styles.metaContainer}>
          <div style={styles.progressBarBackground}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${metaProgress}%`,
                background: metaProgress >= 100 ? '#00989E' : '#F78E3D',
              }}
            ></div>
          </div>
          <div style={styles.metaLabel}>
            Meta: {formatValue(meta.monthly, format)} | {metaProgress?.toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos inline (podem ser movidos para CSS/styled-components depois)
const styles = {
  card: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },

  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: '24px',
  },

  title: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  value: {
    fontSize: '2.25rem',
    fontWeight: '700',
    lineHeight: '1',
    marginBottom: '12px',
  },

  variationContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },

  variation: {
    fontSize: '0.875rem',
    fontWeight: '600',
  },

  variationLabel: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
  },

  metaContainer: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #E5E7EB',
  },

  progressBarBackground: {
    width: '100%',
    height: '4px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '6px',
  },

  progressBarFill: {
    height: '100%',
    transition: 'width 0.8s ease-out',
    borderRadius: '2px',
  },

  metaLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },

  // Loading skeleton
  loadingSkeleton: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },

  skeletonBar: {
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
  },
};

// Adiciona CSS de animação para o skeleton
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `, styleSheet.cssRules.length);

    styleSheet.insertRule(`
      .kpi-card:hover {
        transform: scale(1.02);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Ignora erro se a regra já existe
  }
}

export default KPICard;
