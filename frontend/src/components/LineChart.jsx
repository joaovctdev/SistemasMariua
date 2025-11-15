// src/components/LineChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin,
  ChartDataLabels
);

/**
 * LineChart - Wrapper customizado para gráfico de linha temporal
 *
 * @param {Object} props
 * @param {Array} props.data - Dados do gráfico: [{ x: 'Jan', y: 50 }, ...]
 * @param {string} props.title - Título do gráfico
 * @param {string} props.label - Label da série de dados
 * @param {string} props.color - Cor principal da linha (hex)
 * @param {boolean} props.fill - Preencher área abaixo da linha
 * @param {number} props.metaLine - Valor da linha de meta (opcional)
 * @param {boolean} props.enableZoom - Habilitar zoom e pan
 * @param {boolean} props.showDataLabels - Mostrar valores nos pontos
 * @param {number} props.height - Altura do gráfico em pixels
 * @param {boolean} props.loading - Estado de carregamento
 */
const LineChart = ({
  data = [],
  title = 'Gráfico de Linha',
  label = 'Série 1',
  color = '#00989E',
  fill = true,
  metaLine = null,
  enableZoom = true,
  showDataLabels = false,
  height = 350,
  loading = false,
}) => {

  // Prepara os dados para o Chart.js
  const chartData = {
    labels: data.map(item => item.x),
    datasets: [
      {
        label: label,
        data: data.map(item => item.y),
        borderColor: color,
        backgroundColor: fill ? `${color}33` : 'transparent', // 33 = 20% opacity
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.4, // Curvatura da linha
        fill: fill,
      },
      // Linha de meta (se fornecida)
      ...(metaLine !== null ? [{
        label: `Meta (${metaLine})`,
        data: data.map(() => metaLine),
        borderColor: '#F15137',
        borderWidth: 2,
        borderDash: [10, 5],
        pointRadius: 0,
        fill: false,
        tension: 0,
      }] : []),
    ],
  };

  // Configurações do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          font: { size: 12, family: 'Arial, sans-serif' },
          color: '#374151',
          padding: 15,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
        },
      },

      title: {
        display: !!title,
        text: title,
        font: { size: 16, weight: '600', family: 'Arial, sans-serif' },
        color: '#111827',
        padding: { top: 10, bottom: 20 },
        align: 'start',
      },

      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: color,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR').format(context.parsed.y);
            }
            return label;
          }
        }
      },

      datalabels: {
        display: showDataLabels,
        color: '#374151',
        font: { weight: 'bold', size: 10 },
        formatter: (value) => {
          return new Intl.NumberFormat('pt-BR', {
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value);
        },
        align: 'top',
        offset: 5,
      },

      zoom: enableZoom ? {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl',
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        limits: {
          x: { min: 'original', max: 'original' },
        },
      } : undefined,
    },

    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          callback: function(value) {
            return new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        },
      },
    },

    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

  // Função para resetar zoom
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const chartRef = React.useRef(null);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ ...styles.container, height: `${height}px` }}>
        <div style={styles.loadingSkeleton}>
          <div style={{...styles.skeletonTitle, width: '40%'}}></div>
          <div style={styles.skeletonChart}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, height: `${height}px` }}>
      {/* Controles de Zoom */}
      {enableZoom && (
        <div style={styles.zoomControls}>
          <button onClick={resetZoom} style={styles.resetButton}>
            ↺ Resetar Zoom
          </button>
          <span style={styles.zoomHint}>Ctrl + Scroll para zoom</span>
        </div>
      )}

      <Line ref={chartRef} data={chartData} options={options} />
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
  },

  zoomControls: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 10,
  },

  resetButton: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    backgroundColor: '#00989E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background 0.2s',
  },

  zoomHint: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Loading skeleton
  loadingSkeleton: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  skeletonTitle: {
    height: '24px',
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
  },

  skeletonChart: {
    flex: 1,
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  },
};

// Adiciona hover effect ao botão
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      button:hover {
        opacity: 0.9;
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Ignora erro se a regra já existe
  }
}

export default LineChart;
