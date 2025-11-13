import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';
import ProducaoDia from './ProducaoDia';
import './Dashboards.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels, zoomPlugin);

const API_URL = 'http://localhost:5000/api';

function Dashboards() {
  const [dados, setDados] = useState([]);
  const [obrasData, setObrasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroSupervisor, setFiltroSupervisor] = useState('todos');
  const [filtroMesGrafico, setFiltroMesGrafico] = useState('todos');
  const [filtroSemanaGrafico, setFiltroSemanaGrafico] = useState('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar dados do BD de programação
      const response1 = await fetch(`${API_URL}/dashboard/bd-programacao`);
      const data1 = await response1.json();

      // Carregar dados das obras (postes previstos)
      const response2 = await fetch(`${API_URL}/dashboard/obras-programacao`);
      const data2 = await response2.json();

      if (response1.ok && response2.ok) {
        setDados(data1.dados);
        setObrasData(data2.obras);
      } else {
        setError(data1.error || data2.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Função para extrair mês da data
  const getMesDaData = (dataStr) => {
    if (!dataStr || dataStr === 'nan') return null;
    try {
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) {
        return data.getMonth();
      }
    } catch {
      return null;
    }
    return null;
  };

  // Função para extrair semana do ano
  const getSemanaDoAno = (dataStr) => {
    if (!dataStr || dataStr === 'nan') return null;
    try {
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) {
        const primeiroDia = new Date(data.getFullYear(), 0, 1);
        const diasPassados = Math.floor((data - primeiroDia) / (24 * 60 * 60 * 1000));
        return Math.ceil((diasPassados + primeiroDia.getDay() + 1) / 7);
      }
    } catch {
      return null;
    }
    return null;
  };

  // Aplicar filtros
  const dadosFiltrados = dados.filter(d => {
    if (filtroMes !== 'todos') {
      const mes = getMesDaData(d.data);
      if (mes !== parseInt(filtroMes)) return false;
    }
    if (filtroSupervisor !== 'todos') {
      if (d.supervisor !== filtroSupervisor) return false;
    }
    return true;
  });

  // 1. Postes implantados por Encarregado (TODOS)
  const postesPorEncarregado = () => {
    const agrupado = {};
    dadosFiltrados.forEach(d => {
      if (d.encarregado && d.posteReal > 0 &&
          d.encarregado !== 'JOSÉ ROBERTO' &&
          d.encarregado !== 'WASHINGTON' &&
          d.encarregado !== 'VANDERLEI MENEZES' &&
          d.encarregado !== 'WESLEI REIS') {
        if (!agrupado[d.encarregado]) {
          agrupado[d.encarregado] = 0;
        }
        agrupado[d.encarregado] += d.posteReal;
      }
    });
    const sorted = Object.entries(agrupado).sort((a, b) => b[1] - a[1]); // Removido .slice(0, 10) para mostrar TODOS

    return {
      labels: sorted.map(([nome]) => nome),
      datasets: [{
        label: 'Postes Implantados',
        data: sorted.map(([, total]) => total),
        backgroundColor: '#015657',
       
        borderWidth: 2
      }]
    };
  };

  // Cavas realizadas por Encarregado (TODOS)
  const cavasPorEncarregado = () => {
    const agrupado = {};
    dadosFiltrados.forEach(d => {
      if (d.encarregado && d.cavaReal > 0 &&
          d.encarregado !== 'JOSE-IRC' &&
          d.encarregado !== 'WASHINGTON-IRC' &&
          d.encarregado !== 'JAIR-JAC' &&
          d.encarregado !== 'VALMIR-JAC') {
        if (!agrupado[d.encarregado]) {
          agrupado[d.encarregado] = 0;
        }
        agrupado[d.encarregado] += d.cavaReal;
      }
    });

    const sorted = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(([nome]) => nome),
      datasets: [{
        label: 'Cavas Realizadas',
        data: sorted.map(([, total]) => total),
        backgroundColor: '#0B9E9F',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      }]
    };
  };

  // 2. Evolução Mensal - Postes e Cavas
  const postesPorMes = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const agrupadoPostes = Array(12).fill(0);
    const agrupadoCavas = Array(12).fill(0);

    dadosFiltrados.forEach(d => {
      const mes = getMesDaData(d.data);
      if (mes !== null) {
        if (d.posteReal > 0) {
          agrupadoPostes[mes] += d.posteReal;
        }
        if (d.cavaReal > 0) {
          agrupadoCavas[mes] += d.cavaReal;
        }
      }
    });

    return {
      labels: meses,
      datasets: [
        {
          label: 'Postes Implantados',
          data: agrupadoPostes,
          backgroundColor: '#0B9E9F',
          borderColor: '#0B9E9F',
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: 'Cavas Realizadas',
          data: agrupadoCavas,
          backgroundColor: '#F5793D',
          borderColor: '#F5793D',
          borderWidth: 3,
          tension: 0.4
        }
      ]
    };
  };

  // 3. Postes implantados por Supervisor
  const postesPorSupervisor = () => {
    const agrupado = {};
    dadosFiltrados.forEach(d => {
      if (d.supervisor && d.posteReal > 0) {
        if (!agrupado[d.supervisor]) {
          agrupado[d.supervisor] = 0;
        }
        agrupado[d.supervisor] += d.posteReal;
      }
    });

    const sorted = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);

    const cores = [
      '#0B9E9F',
      '#077A7B',
      '#7DC8C8',
      '#B7E7E7',
      '#015657'
    ];

    return {
      labels: sorted.map(([nome]) => nome),
      datasets: [{
        label: 'Postes Implantados',
        data: sorted.map(([, total]) => total),
        backgroundColor: cores.slice(0, sorted.length),
        borderColor: cores.slice(0, sorted.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    };
  };

  // Calcular médias por equipe (Total / Número de Equipes)
  const calcularMedias = () => {
    const equipesUnicas = new Set();

    dadosFiltrados.forEach(d => {
      if (d.encarregado && d.encarregado !== 'nan') {
        equipesUnicas.add(d.encarregado);
      }
    });

    const totalPostes = dadosFiltrados.reduce((sum, d) => sum + d.posteReal, 0);
    const totalCavas = dadosFiltrados.reduce((sum, d) => sum + d.cavaReal, 0);
    const numEquipes = Math.max(equipesUnicas.size, 1);

    const mediaPostes = totalPostes / numEquipes;
    const mediaCavas = totalCavas / numEquipes;

    return { mediaPostes, mediaCavas };
  };

  // Função para obter semanas de um mês específico
  const getSemanasDoMes = (mes) => {
    if (mes === 'todos') return [];

    // Obter todas as datas do mês filtrado nos dados
    const datasDoMes = dadosFiltrados
      .filter(d => {
        const mesDaData = getMesDaData(d.data);
        return mesDaData === parseInt(mes);
      })
      .map(d => d.data);

    // Extrair semanas únicas
    const semanasUnicas = new Set();
    datasDoMes.forEach(dataStr => {
      const semana = getSemanaDoAno(dataStr);
      if (semana !== null) {
        semanasUnicas.add(semana);
      }
    });

    return Array.from(semanasUnicas).sort((a, b) => a - b);
  };

  // 4. Postes por Equipe (Eixo X = Equipes, com filtro de mês e semana)
  const postesPorEquipe = () => {
    // Filtrar por mês se selecionado
    let dadosParaGrafico = dados;
    if (filtroMesGrafico !== 'todos') {
      dadosParaGrafico = dados.filter(d => {
        const mes = getMesDaData(d.data);
        return mes === parseInt(filtroMesGrafico);
      });
    }

    // Filtrar por semana se selecionada
    if (filtroSemanaGrafico !== 'todos') {
      dadosParaGrafico = dadosParaGrafico.filter(d => {
        const semana = getSemanaDoAno(d.data);
        return semana === parseInt(filtroSemanaGrafico);
      });
    }

    const encarregadosExcluidos = [
      'MENEZES-IRC',
      'VAGNO-IRC',
      'JOSE-IRC',
      'WASHINGTON-IRC',
      'WESLEY-IRC',
      'JOAO-JAC',
      'OSIMAR-JAC',
      'TIAGO-JAC',
      'VALMIR-JAC',
      'JENILSON-JAC',
      'JAIR-JAC',
      'GABRIEL-IRC',
      'PATRICIO-JAC'
    ];
    
    const agrupado = {};
    dadosParaGrafico.forEach(d => {
      if (d.encarregado && d.encarregado !== 'nan') {
        const encarregadoUpper = d.encarregado.toUpperCase().trim();
        // Verificar se o encarregado está na lista de exclusões
        const deveExcluir = encarregadosExcluidos.some(excluido => 
          encarregadoUpper === excluido.toUpperCase().trim() ||
          encarregadoUpper.includes('RETRO') && (
            encarregadoUpper.includes('WESLEI REIS') ||
            encarregadoUpper.includes('VANDERLEI MENESES') ||
            encarregadoUpper.includes('VAGNO')
          )
        );
        
        if (!deveExcluir) {
          if (!agrupado[d.encarregado]) {
            agrupado[d.encarregado] = 0;
          }
          agrupado[d.encarregado] += d.posteReal;
        }
      }
    });

    const equipes = Object.keys(agrupado).sort();
    const postesRealizados = equipes.map(e => agrupado[e]);

    // Cada equipe tem 15 postes previstos por semana
    const postesPrevistos = equipes.map(() => 15);

    const datasets = [
      {
        type: 'bar',
        label: 'Postes Realizados',
        data: postesRealizados,
        backgroundColor: '#077A7B',
        borderColor: 'rgba(245, 245, 245, 1)',
        borderWidth: 2,
        datalabels: {
          display: true
        }
      },
      {
        type: 'line',
        label: 'Postes Previstos (15/semana)',
        data: postesPrevistos,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        datalabels: {
          display: false
        }
      }
    ];

    // Adicionar linha de meta mensal (50 postes) apenas quando mostrar todas as semanas
    if (filtroSemanaGrafico === 'todos') {
      datasets.push({
        type: 'line',
        label: 'Meta Mensal (50 postes)',
        data: equipes.map(() => 50),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 5,
        datalabels: {
          display: false
        }
      });
    }

    return {
      labels: equipes,
      datasets: datasets
    };
  };

  // 5. Comparação Previsto vs Real (usando dados da planilha PROGRAMAÇÃO)
  const previstoVsReal = () => {
    const totalPrevisto = obrasData.reduce((sum, obra) => sum + obra.postesPrevisto, 0);
    const totalReal = dadosFiltrados.reduce((sum, d) => sum + d.posteReal, 0);

    return {
      labels: ['Previsto', 'Realizado'],
      datasets: [{
        data: [totalPrevisto, totalReal],
        backgroundColor: [
          'rgba(253, 188, 9, 0.8)',
          '#0D9091'
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',
          '#0D9091'
        ],
        borderWidth: 2
      }]
    };
  };

  // 6. Postes por Mês (novo gráfico substituindo Top 5 Municípios)
  const postesPorMesGrafico = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const agrupado = Array(12).fill(0);

    dadosFiltrados.forEach(d => {
      const mes = getMesDaData(d.data);
      if (mes !== null && d.posteReal > 0) {
        agrupado[mes] += d.posteReal;
      }
    });

    return {
      labels: meses,
      datasets: [{
        data: agrupado,
        backgroundColor: [
          '#0B9E9F',
          '#00CCCC',
          '#077A7B',
          '#45B9BA',
          '#7DC8C8',
          '#a2f1f1ff',
          '#08898A',
          '#1CBFC0',
          '#9CE1E1',
          '#015657',
          '#B7E7E7',
          '#0D9091'
        ],
        borderWidth: 2
      }]
    };
  };

  const supervisoresUnicos = [...new Set(dados.map(d => d.supervisor).filter(s => s && s !== 'nan'))].sort();

  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: (value) => value,
        color: '#1f2937',
        font: {
          size: 11,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12
      },
      datalabels: {
        display: false
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
        limits: {
          x: {min: 'original', max: 'original'},
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: '600'
          }
        },
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        hitRadius: 10
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const optionsPie = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 11,
            weight: '600'
          },
          padding: 10
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          size: 11,
          weight: 'bold'
        },
        formatter: (value, context) => {
          if (value === 0) return '';
          // Retorna o label (mês) ao invés do valor
          return context.chart.data.labels[context.dataIndex];
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 10
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboards-container">
        <div className="loading-message">
          <div className="spinner"></div>
          Carregando dados dos dashboards...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboards-container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboards-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Dashboards Analiticos</h1>
            <p>Analise detalhada das operações </p>
          </div>
          <button onClick={carregarDados} className="refresh-button" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="dashboard-filters">
        <div className="filter-item">
          <label>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Mes:
          </label>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="todos">Todos os Meses</option>
            <option value="0">Janeiro</option>
            <option value="1">Fevereiro</option>
            <option value="2">Marco</option>
            <option value="3">Abril</option>
            <option value="4">Maio</option>
            <option value="5">Junho</option>
            <option value="6">Julho</option>
            <option value="7">Agosto</option>
            <option value="8">Setembro</option>
            <option value="9">Outubro</option>
            <option value="10">Novembro</option>
            <option value="11">Dezembro</option>
          </select>
        </div>

        <div className="filter-item">
          <label>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Supervisor:
          </label>
          <select value={filtroSupervisor} onChange={(e) => setFiltroSupervisor(e.target.value)}>
            <option value="todos">Todos os Supervisores</option>
            {supervisoresUnicos.map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        
      </div>

      {/* Cards de Resumo */}
      <div className="stats-cards">
        <div className="stat-card blue">
          <div className="stat-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{dadosFiltrados.reduce((sum, d) => sum + d.posteReal, 0)}</div>
            <div className="stat-label">Postes Realizados</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2v6a2 2 0 0 0 2 2h6"/>
              <path d="M5 17a3 3 0 0 1 3-3h8"/>
              <path d="M5 17v5h14v-5"/>
              <path d="M5 22v-5"/>
              <path d="M19 22v-5"/>
              <circle cx="8" cy="7" r="3"/>
              <path d="M8 4v3"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{dadosFiltrados.reduce((sum, d) => sum + d.cavaReal, 0)}</div>
            <div className="stat-label">Cavas Realizadas</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {calcularMedias().mediaPostes.toFixed(1)}
            </div>
            <div className="stat-label">Média Postes/Equipe</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {calcularMedias().mediaCavas.toFixed(1)}
            </div>
            <div className="stat-label">Média Cavas/Equipe</div>
          </div>
        </div>
      </div>

      {/* Graficos */}
      <div className="charts-grid">
        <div className="chart-card large scrollable">
          <h3>Postes Realizados por Encarregado (Todos)</h3>
          <div className="chart-wrapper-scrollable">
            <Bar data={postesPorEncarregado()} options={optionsBar} />
          </div>
        </div>

        <div className="chart-card large scrollable">
          <h3>Cavas Realizadas por Encarregado (Todos)</h3>
          <div className="chart-wrapper-scrollable">
            <Bar data={cavasPorEncarregado()} options={optionsBar} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Evolucao Mensal - Postes</h3>
          <div className="chart-wrapper">
            <Line data={postesPorMes()} options={optionsLine} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Previsto vs Realizado - Postes</h3>
          <div className="chart-wrapper">
            <Doughnut data={previstoVsReal()} options={optionsPie} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Postes por Supervisor</h3>
          <div className="chart-wrapper">
            <Pie data={postesPorSupervisor()} options={optionsPie} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Postes por Mes</h3>
          <div className="chart-wrapper">
            <Doughnut data={postesPorMesGrafico()} options={optionsPie} />
          </div>
        </div>

        <div className="chart-card large">
          <div className="chart-header-with-filter">
            <h3>Postes por Equipe</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="chart-filter">
                <label>
                  <svg width="20" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Mês:
                </label>
                <select value={filtroMesGrafico} onChange={(e) => {
                  setFiltroMesGrafico(e.target.value);
                  setFiltroSemanaGrafico('todos'); // Reset semana quando muda o mês
                }}>
                  <option value="todos">Todos</option>
                  <option value="0">Janeiro</option>
                  <option value="1">Fevereiro</option>
                  <option value="2">Março</option>
                  <option value="3">Abril</option>
                  <option value="4">Maio</option>
                  <option value="5">Junho</option>
                  <option value="6">Julho</option>
                  <option value="7">Agosto</option>
                  <option value="8">Setembro</option>
                  <option value="9">Outubro</option>
                  <option value="10">Novembro</option>
                  <option value="11">Dezembro</option>
                </select>
              </div>

              {filtroMesGrafico !== 'todos' && (
                <div className="chart-filter">
                  <label>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Semana:
                  </label>
                  <select value={filtroSemanaGrafico} onChange={(e) => setFiltroSemanaGrafico(e.target.value)}>
                    <option value="todos">Todas</option>
                    {getSemanasDoMes(filtroMesGrafico).map((semana, index) => (
                      <option key={semana} value={semana}>Semana {index + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="chart-wrapper">
            <Bar data={postesPorEquipe()} options={optionsBar} />
          </div>
        </div>
      </div>

      {/* Tabela de Produção do Dia */}
      <ProducaoDia />
    </div>
  );
}

export default Dashboards;
