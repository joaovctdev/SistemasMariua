// src/components/GaugeChart.jsx
import React from 'react';

/**
 * GaugeChart - Gráfico tipo medidor/gauge para metas
 *
 * @param {Object} props
 * @param {string} props.title - Título do gauge
 * @param {number} props.value - Valor atual
 * @param {number} props.target - Meta/objetivo
 * @param {string} props.label - Label do valor (ex: "Semanal", "Mensal")
 * @param {string} props.format - Formato: 'number' | 'percentage'
 * @param {boolean} props.showProgress - Mostrar barra de progresso ao invés de circular
 * @param {number} props.height - Altura do componente
 * @param {boolean} props.loading - Estado de carregamento
 */
const GaugeChart = ({
  title = 'Meta',
  value = 0,
  target = 100,
  label = '',
  format = 'number',
  showProgress = false,
  height = 350,
  loading = false,
}) => {

  // Calcula percentual
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  // Determina cor baseada no atingimento da meta
  const getColor = () => {
    if (percentage >= 100) return '#00989E'; // Verde - Meta atingida
    if (percentage >= 80) return '#F78E3D';  // Laranja - Próximo da meta
    return '#F15137';                        // Vermelho - Abaixo da meta
  };

  const color = getColor();

  // Formata valores
  const formatValue = (val) => {
    if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  // Status text
  const getStatusText = () => {
    if (percentage >= 100) return '✓ Meta atingida!';
    if (percentage >= 80) return '⚠ Próximo da meta';
    return '✗ Abaixo da meta';
  };

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ ...styles.container, height: `${height}px` }}>
        <div style={styles.loadingSkeleton}>
          <div style={{...styles.skeletonTitle, width: '60%'}}></div>
          <div style={styles.skeletonGauge}></div>
        </div>
      </div>
    );
  }

  // Renderiza barra de progresso linear
  if (showProgress) {
    return (
      <div style={{ ...styles.container, height: `${height}px` }}>
        {title && <div style={styles.title}>{title}</div>}

        <div style={styles.progressContent}>
          {/* Valores */}
          <div style={styles.progressHeader}>
            <div>
              <div style={{...styles.progressValue, color: color}}>
                {formatValue(value)}
              </div>
              <div style={styles.progressLabel}>{label}</div>
            </div>
            <div style={styles.progressTarget}>
              Meta: {formatValue(target)}
            </div>
          </div>

          {/* Barra de progresso */}
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${percentage}%`,
                background: color,
              }}
            >
              <span style={styles.progressBarLabel}>{percentage.toFixed(0)}%</span>
            </div>
          </div>

          {/* Status */}
          <div style={{...styles.status, color: color}}>
            {getStatusText()}
          </div>

          {/* Faltam */}
          {value < target && (
            <div style={styles.remaining}>
              Faltam: {formatValue(target - value)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderiza gauge circular
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ ...styles.container, height: `${height}px` }}>
      {title && <div style={styles.title}>{title}</div>}

      <div style={styles.gaugeContent}>
        {/* SVG Circular Gauge */}
        <div style={styles.gaugeCircle}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="16"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
            {/* Center text */}
            <text
              x="100"
              y="90"
              textAnchor="middle"
              fontSize="32"
              fontWeight="bold"
              fill="#111827"
            >
              {formatValue(value)}
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              fontSize="14"
              fill="#6B7280"
            >
              de {formatValue(target)}
            </text>
            <text
              x="100"
              y="135"
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
              fill={color}
            >
              {percentage.toFixed(0)}%
            </text>
          </svg>
        </div>

        {/* Label e Status */}
        <div style={styles.gaugeInfo}>
          <div style={styles.gaugeLabel}>{label}</div>
          <div style={{...styles.status, color: color}}>
            {getStatusText()}
          </div>

          {value < target && (
            <div style={styles.remaining}>
              Faltam: {formatValue(target - value)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
  },

  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '20px',
    textAlign: 'center',
  },

  // Gauge Circular
  gaugeContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '20px',
  },

  gaugeCircle: {
    display: 'flex',
    justifyContent: 'center',
  },

  gaugeInfo: {
    textAlign: 'center',
  },

  gaugeLabel: {
    fontSize: '1rem',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: '500',
  },

  // Progress Bar
  progressContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
  },

  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  progressValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    lineHeight: '1',
  },

  progressLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginTop: '4px',
  },

  progressTarget: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },

  progressBarContainer: {
    width: '100%',
    height: '24px',
    backgroundColor: '#E5E7EB',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
  },

  progressBar: {
    height: '100%',
    borderRadius: '12px',
    transition: 'width 1s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
  },

  progressBarLabel: {
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: '700',
  },

  status: {
    fontSize: '1rem',
    fontWeight: '600',
    textAlign: 'center',
  },

  remaining: {
    fontSize: '0.875rem',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Loading skeleton
  loadingSkeleton: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
    justifyContent: 'center',
  },

  skeletonTitle: {
    height: '20px',
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
  },

  skeletonGauge: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
};

export default GaugeChart;
