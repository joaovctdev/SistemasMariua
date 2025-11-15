// src/components/BarChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

/**
 * BarChart - Wrapper customizado para gráfico de barras (vertical ou horizontal)
 *
 * @param {Object} props
 * @param {Array} props.data - Dados: [{ label: 'Item 1', value: 100, color: '#00989E' }, ...]
 * @param {string} props.title - Título do gráfico
 * @param {string} props.orientation - 'vertical' ou 'horizontal'
 * @param {Array<string>} props.colors - Array de cores (usa gradiente se não fornecido)
 * @param {boolean} props.stacked - Empilhar barras (para múltiplas séries)
 * @param {boolean} props.showDataLabels - Mostrar valores nas barras
 * @param {number} props.height - Altura do gráfico em pixels
 * @param {string} props.xAxisLabel - Label do eixo X
 * @param {string} props.yAxisLabel - Label do eixo Y
 * @param {boolean} props.loading - Estado de carregamento
 * @param {Array} props.datasets - Para gráficos com múltiplas séries (opcional)
 */
const BarChart = ({
  data = [],
  title = 'Gráfico de Barras',
  orientation = 'vertical',
  colors = null,
  stacked = false,
  showDataLabels = true,
  height = 350,
  xAxisLabel = '',
  yAxisLabel = '',
  loading = false,
  datasets = null, // Para gráficos com múltiplas séries
}) => {

  const isHorizontal = orientation === 'horizontal';

  // Gera gradiente de cores se não fornecido
  const defaultColors = ['#00989E', '#4FB8BC', '#F78E3D', '#F15137', '#4CAF50', '#764ba2', '#667eea', '#f093fb'];

  const getColors = () => {
    if (colors && colors.length > 0) return colors;

    // Se cada item tem cor própria
    if (data.length > 0 && data[0].color) {
      return data.map(item => item.color);
    }

    // Usa cores padrão repetindo se necessário
    return data.map((_, i) => defaultColors[i % defaultColors.length]);
  };

  // Prepara datasets - suporta single ou multiple series
  const prepareDatasets = () => {
    // Se datasets customizados foram fornecidos (múltiplas séries)
    if (datasets && datasets.length > 0) {
      return datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor || defaultColors[index % defaultColors.length],
        borderColor: ds.borderColor || defaultColors[index % defaultColors.length],
        borderWidth: 0,
        borderRadius: 6,
        barThickness: isHorizontal ? 'flex' : undefined,
        maxBarThickness: isHorizontal ? 30 : 60,
      }));
    }

    // Single series (padrão)
    return [{
      label: title,
      data: data.map(item => item.value),
      backgroundColor: getColors(),
      borderWidth: 0,
      borderRadius: 6,
      barThickness: isHorizontal ? 'flex' : undefined,
      maxBarThickness: isHorizontal ? 30 : 60,
    }];
  };

  const chartData = {
    labels: data.map(item => item.label),
    datasets: prepareDatasets(),
  };

  // Configurações do gráfico
  const options = {
    indexAxis: isHorizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        display: datasets ? true : false, // Mostra legenda apenas para múltiplas séries
        position: 'top',
        align: 'end',
        labels: {
          font: { size: 12, family: 'Arial, sans-serif' },
          color: '#374151',
          padding: 15,
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 12,
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
        borderColor: '#00989E',
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
            if (context.parsed.y !== null || context.parsed.x !== null) {
              const value = isHorizontal ? context.parsed.x : context.parsed.y;
              label += new Intl.NumberFormat('pt-BR').format(value);
            }
            return label;
          }
        }
      },

      datalabels: {
        display: showDataLabels,
        color: '#374151',
        font: { weight: 'bold', size: 11 },
        formatter: (value) => {
          if (value === 0) return '';
          return new Intl.NumberFormat('pt-BR', {
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value);
        },
        anchor: isHorizontal ? 'end' : 'end',
        align: isHorizontal ? 'right' : 'top',
        offset: 4,
      },
    },

    scales: {
      x: {
        stacked: stacked,
        grid: {
          display: isHorizontal,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          maxRotation: isHorizontal ? 0 : 45,
          minRotation: 0,
          callback: function(value, index, ticks) {
            if (isHorizontal) {
              // Horizontal: X-axis shows numbers, format them
              return new Intl.NumberFormat('pt-BR', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value);
            }
            // Vertical: X-axis shows labels (team/supervisor names), return as-is
            return this.getLabelForValue(value);
          }
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: '#6B7280',
          font: { size: 12, weight: '600' },
        },
      },
      y: {
        stacked: stacked,
        beginAtZero: true,
        grid: {
          display: !isHorizontal,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          callback: function(value, index, ticks) {
            if (!isHorizontal) {
              // Vertical: Y-axis shows numbers, format them
              return new Intl.NumberFormat('pt-BR', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value);
            }
            // Horizontal: Y-axis shows labels (team names), return as-is
            return this.getLabelForValue(value);
          }
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#6B7280',
          font: { size: 12, weight: '600' },
        },
      },
    },

    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

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
      <Bar data={chartData} options={options} />
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

export default BarChart;
