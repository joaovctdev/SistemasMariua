// src/components/DonutChart.jsx
import React from 'react';
import { Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

/**
 * DonutChart - Wrapper customizado para gráfico donut/pizza
 *
 * @param {Object} props
 * @param {Array} props.data - Dados: [{ label: 'Item 1', value: 100, color: '#00989E' }, ...]
 * @param {string} props.title - Título do gráfico
 * @param {string} props.type - 'donut' ou 'pie'
 * @param {Array<string>} props.colors - Array de cores customizadas
 * @param {boolean} props.showPercentage - Mostrar percentuais ao invés de valores
 * @param {boolean} props.showCenterLabel - Mostrar label no centro (apenas donut)
 * @param {string} props.centerLabel - Texto do centro (ex: "Total: 100")
 * @param {number} props.height - Altura do gráfico em pixels
 * @param {boolean} props.loading - Estado de carregamento
 */
const DonutChart = ({
  data = [],
  title = 'Gráfico Donut',
  type = 'donut',
  colors = null,
  showPercentage = true,
  showCenterLabel = true,
  centerLabel = '',
  height = 350,
  loading = false,
}) => {

  const isPie = type === 'pie';

  // Cores padrão
  const defaultColors = ['#00989E', '#F78E3D', '#4FB8BC', '#F15137', '#4CAF50', '#764ba2', '#667eea', '#f093fb'];

  const getColors = () => {
    if (colors && colors.length > 0) return colors;

    // Se cada item tem cor própria
    if (data.length > 0 && data[0].color) {
      return data.map(item => item.color);
    }

    // Usa cores padrão
    return data.map((_, i) => defaultColors[i % defaultColors.length]);
  };

  // Calcula total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Prepara dados para Chart.js
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: getColors(),
      borderColor: '#FFFFFF',
      borderWidth: 2,
      hoverOffset: 10,
    }],
  };

  // Plugin customizado para label central (apenas donut)
  const centerLabelPlugin = {
    id: 'centerLabel',
    afterDatasetsDraw(chart) {
      if (!showCenterLabel || isPie) return;

      const { ctx, chartArea: { left, right, top, bottom } } = chart;
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      ctx.save();

      // Texto principal (ex: "72%")
      const mainText = centerLabel || `${total}`;
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mainText, centerX, centerY - 10);

      // Subtexto (ex: "Energizadas")
      if (centerLabel) {
        ctx.font = '14px Arial, sans-serif';
        ctx.fillStyle = '#6B7280';
        ctx.fillText('Total', centerX, centerY + 20);
      }

      ctx.restore();
    }
  };

  // Configurações do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: isPie ? 0 : '70%', // Donut = 70%, Pie = 0

    plugins: {
      legend: {
        display: true,
        position: 'right',
        align: 'center',
        labels: {
          font: { size: 12, family: 'Arial, sans-serif' },
          color: '#374151',
          padding: 15,
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 12,
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            const labels = chart.data.labels;

            return labels.map((label, i) => {
              const value = datasets[0].data[i];
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

              return {
                text: showPercentage
                  ? `${label}: ${percentage}%`
                  : `${label}: ${new Intl.NumberFormat('pt-BR').format(value)}`,
                fillStyle: datasets[0].backgroundColor[i],
                hidden: false,
                index: i,
              };
            });
          }
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
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

            return `${label}: ${new Intl.NumberFormat('pt-BR').format(value)} (${percentage}%)`;
          }
        }
      },

      datalabels: {
        display: true,
        color: '#FFFFFF',
        font: { weight: 'bold', size: 14 },
        formatter: (value, context) => {
          if (value === 0) return '';
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

          // Mostra percentual apenas se > 5% (evita labels muito pequenos)
          return percentage > 5 ? `${percentage}%` : '';
        },
      },
    },

    animation: {
      animateRotate: true,
      animateScale: true,
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

  // Escolhe componente (Doughnut ou Pie)
  const ChartComponent = isPie ? Pie : Doughnut;

  return (
    <div style={{ ...styles.container, height: `${height}px` }}>
      <ChartComponent
        data={chartData}
        options={options}
        plugins={!isPie ? [centerLabelPlugin] : []}
      />
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
    borderRadius: '50%',
    margin: '0 auto',
    width: '80%',
    maxWidth: '300px',
  },
};

export default DonutChart;
