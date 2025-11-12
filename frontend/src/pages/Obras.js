import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ptBR } from 'date-fns/locale'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:5000/api';

// Componente Gráfico de Gantt
function GanttChart({ obras }) {
  const [mesFiltro, setMesFiltro] = React.useState('todos');
  const [encarregadoFiltro, setEncarregadoFiltro] = React.useState('todos');

  const parseDataToDate = (dataStr) => {
    if (!dataStr || dataStr === 'nan') return null;

    try {
      // Verificar se é uma string no formato DD/MM/AAAA ou DD/MM/AA
      if (typeof dataStr === 'string' && dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          let dia = parseInt(partes[0], 10);
          let mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
          let ano = parseInt(partes[2], 10);

          // Se o ano tem 2 dígitos, assumir 20XX
          if (ano < 100) {
            ano += 2000;
          }

          const data = new Date(ano, mes, dia);
          if (!isNaN(data.getTime())) return data;
        }
      }

      // Tentar parse direto como fallback
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) return data;

      return null;
    } catch {
      return null;
    }
  };

  // Preparar dados para o gráfico
  const prepararDados = () => {
    const dadosGantt = [];

    obras.forEach(obra => {
      const dataInicio = parseDataToDate(obra.dataInicio);
      const dataFim = parseDataToDate(obra.prazo);

      if (dataInicio && dataFim && dataInicio < dataFim) {
        // Aplicar filtro de mês se necessário
        if (mesFiltro !== 'todos') {
          const mesSelecionado = parseInt(mesFiltro);
          const mesInicio = dataInicio.getMonth();
          const mesFim = dataFim.getMonth();
          const anoInicio = dataInicio.getFullYear();
          const anoFim = dataFim.getFullYear();

          // Verificar se o mês selecionado está dentro do intervalo da obra
          let obraContémMes = false;

          if (anoInicio === anoFim) {
            // Obra dentro do mesmo ano
            obraContémMes = mesSelecionado >= mesInicio && mesSelecionado <= mesFim;
          } else {
            // Obra atravessa anos
            if (anoInicio === 2025) {
              obraContémMes = mesSelecionado >= mesInicio;
            }
            if (anoFim === 2025) {
              obraContémMes = obraContémMes || mesSelecionado <= mesFim;
            }
          }

          if (!obraContémMes) {
            return; // Pular obra que não está ativa no mês filtrado
          }
        }

        // Aplicar filtro de encarregado se necessário
        if (encarregadoFiltro !== 'todos') {
          if (obra.encarregado !== encarregadoFiltro) {
            return; // Pular obra que não é do encarregado filtrado
          }
        }

        dadosGantt.push({
          label: `${obra.encarregado} - ${obra.projeto}`,
          dataInicio,
          dataFim,
          status: obra.obraSemana,
          progresso: obra.progresso,
          encarregado: obra.encarregado,
          projeto: obra.projeto
        });
      }
    });

    // Ordenar por encarregado e depois por data de início
    dadosGantt.sort((a, b) => {
      if (a.encarregado !== b.encarregado) {
        return a.encarregado.localeCompare(b.encarregado);
      }
      return a.dataInicio - b.dataInicio;
    });

    return dadosGantt;
  };

  // Calcular limites do eixo X baseado no filtro
  const getLimitesEixoX = () => {
    if (mesFiltro === 'todos') {
      return {
        min: new Date(2025, 0, 1).getTime(),
        max: new Date(2025, 11, 31).getTime()
      };
    } else {
      const mes = parseInt(mesFiltro);
      return {
        min: new Date(2025, mes, 1).getTime(),
        max: new Date(2025, mes + 1, 0).getTime() // Último dia do mês
      };
    }
  };

  const dadosGantt = prepararDados();
  const limitesEixo = getLimitesEixoX();

  const meses = [
    { value: 'todos', label: 'Todos os Meses' },
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' }
  ];

  // Obter lista de encarregados baseado no filtro de mês
  const getEncarregadosFiltrados = () => {
    const encarregadosSet = new Set();

    obras.forEach(obra => {
      // Filtrar por encarregado válido (não vazio, não null, não 'N/A')
      if (!obra.encarregado || obra.encarregado === 'N/A' || obra.encarregado.trim() === '') {
        return;
      }

      const dataInicio = parseDataToDate(obra.dataInicio);
      const dataFim = parseDataToDate(obra.prazo);

      if (!dataInicio || !dataFim || dataInicio >= dataFim) {
        return;
      }

      // Se há filtro de mês, verificar se a obra está ativa no mês
      if (mesFiltro !== 'todos') {
        const mesSelecionado = parseInt(mesFiltro);
        const mesInicio = dataInicio.getMonth();
        const mesFim = dataFim.getMonth();
        const anoInicio = dataInicio.getFullYear();
        const anoFim = dataFim.getFullYear();

        let obraContémMes = false;

        if (anoInicio === anoFim) {
          obraContémMes = mesSelecionado >= mesInicio && mesSelecionado <= mesFim;
        } else {
          if (anoInicio === 2025) {
            obraContémMes = mesSelecionado >= mesInicio;
          }
          if (anoFim === 2025) {
            obraContémMes = obraContémMes || mesSelecionado <= mesFim;
          }
        }

        if (!obraContémMes) {
          return;
        }
      }

      encarregadosSet.add(obra.encarregado);
    });

    return [...encarregadosSet].sort();
  };

  const encarregadosUnicos = getEncarregadosFiltrados();

  // Se o encarregado selecionado não está mais na lista filtrada, resetar para 'todos'
  React.useEffect(() => {
    if (encarregadoFiltro !== 'todos' && !encarregadosUnicos.includes(encarregadoFiltro)) {
      setEncarregadoFiltro('todos');
    }
  }, [mesFiltro, encarregadosUnicos, encarregadoFiltro]);

  if (dadosGantt.length === 0) {
    return (
      <div>
        {/* Filtro de Mês */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px',
          padding: '15px',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '10px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Filtrar por mês:
          </label>
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '2px solid #667eea',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {meses.map(mes => (
              <option key={mes.value} value={mes.value}>{mes.label}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <p>Nenhuma obra com datas válidas para exibir no cronograma{mesFiltro !== 'todos' ? ' neste mês' : ''}.</p>
        </div>
      </div>
    );
  }

  // Cores por status
  const getCorPorStatus = (status) => {
    const statusUpper = status?.toUpperCase() || '';
    if (statusUpper.includes('ENERGIZADA')) return 'rgba(16, 185, 129, 0.8)';
    if (statusUpper.includes('ATUANDO')) return 'rgba(245, 158, 11, 0.8)';
    if (statusUpper.includes('PROGRAMADA')) return 'rgba(59, 130, 246, 0.8)';
    if (statusUpper.includes('ATRASADA')) return 'rgba(239, 68, 68, 0.8)';
    return 'rgba(107, 114, 128, 0.8)';
  };

  // Plugin para remover qualquer renderização automática de texto
  const pluginRemoverLabels = {
    id: 'removerLabels',
    beforeDatasetsDraw(chart) {
      // Limpar qualquer texto que possa ser renderizado automaticamente
      const { ctx } = chart;
      ctx.save();
    },
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.restore();
    }
  };

  // Plugin customizado para desenhar texto nas barras
  const pluginDesenharTexto = {
    id: 'desenharTextoNasBarra',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);

        meta.data.forEach((bar, index) => {
          if (index >= dadosGantt.length) return;
          
          const projeto = dadosGantt[index].projeto;
          const { x, y, width } = bar;

          // Validar se projeto não é uma data (formato DD/MM/YYYY ou DD/MM/YY)
          // Também verificar se contém "GMT" ou "Horário" que indica data completa
          const isData = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(projeto?.trim() || '');
          const isDataCompleta = projeto?.includes('GMT') || projeto?.includes('Horário') || projeto?.includes('Nov') || projeto?.includes('2025');
          
          // Não desenhar se for uma data ou se projeto estiver vazio
          if (!projeto || isData || isDataCompleta || projeto.trim() === '' || projeto === 'nan') {
            return;
          }

          // Configurar texto
          ctx.save();
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';

          // Adicionar sombra para melhor legibilidade
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // Desenhar texto apenas se a barra for larga o suficiente
          const textWidth = ctx.measureText(projeto).width;
          if (width > textWidth + 20) {
            ctx.fillText(projeto, x - width / 2 + 10, y);
          }

          ctx.restore();
        });
      });
    }
  };

  // Preparar dados para Chart.js
  // Para gráfico de Gantt horizontal, usar ponto inicial (x) com timestamp
  const data = {
    labels: dadosGantt.map(d => d.label),
    datasets: [{
      label: 'Cronograma',
      data: dadosGantt.map((d, index) => ({
        x: [d.dataInicio, d.dataFim],
        y: index
      })),
      backgroundColor: dadosGantt.map(d => getCorPorStatus(d.status)),
      borderColor: dadosGantt.map(d => getCorPorStatus(d.status).replace('0.8', '1')),
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.8,
      categoryPercentage: 0.9,
      // Desabilitar qualquer renderização automática de labels
      datalabels: {
        display: false
      }
    }]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 15,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            return dadosGantt[index].projeto;
          },
          label: (context) => {
            const index = context.dataIndex;
            const item = dadosGantt[index];
            const inicio = item.dataInicio.toLocaleDateString('pt-BR');
            const fim = item.dataFim.toLocaleDateString('pt-BR');
            const dias = Math.ceil((item.dataFim - item.dataInicio) / (1000 * 60 * 60 * 24));

            return [
              `Encarregado: ${item.encarregado}`,
              `Status: ${item.status || 'N/A'}`,
              `Progresso: ${item.progresso}%`,
              `Início: ${inicio}`,
              `Término: ${fim}`,
              `Duração: ${dias} dias`
            ];
          }
        }
      },
      removerLabels: pluginRemoverLabels,
      desenharTextoNasBarra: pluginDesenharTexto
    },
    scales: {
      x: {
        type: 'time',
        min: limitesEixo.min,
        max: limitesEixo.max,
        time: {
          unit: mesFiltro === 'todos' ? 'month' : 'day',
          displayFormats: {
            month: 'MMM yyyy',
            day: 'dd/MM'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#374151',
          maxRotation: 0,
          autoSkip: false
        },
        title: {
          display: true,
          text: 'Período - 2025',
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#1f2937'
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#374151',
          autoSkip: false
        },
        title: {
          display: true,
          text: 'Equipe - Obra',
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#1f2937'
        }
      }
    }
  };

  // Altura fixa para cada barra + espaçamento
  const alturaTotal = dadosGantt.length * 60;

  return (
    <div>
      {/* Filtros */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px 20px',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap'
      }}>
        {/* Filtro de Mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Mês:
          </label>
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            style={{
              padding: '10px 40px 10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              border: '2px solid #667eea',
              borderRadius: '8px',
              background: 'white',
              color: '#667eea',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#5a67d8'}
            onMouseLeave={(e) => e.target.style.borderColor = '#667eea'}
          >
            {meses.map(mes => (
              <option key={mes.value} value={mes.value}>{mes.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro de Encarregado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Encarregado:
          </label>
          <select
            value={encarregadoFiltro}
            onChange={(e) => setEncarregadoFiltro(e.target.value)}
            style={{
              padding: '10px 40px 10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              border: '2px solid #10b981',
              borderRadius: '8px',
              background: 'white',
              color: '#10b981',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#059669'}
            onMouseLeave={(e) => e.target.style.borderColor = '#10b981'}
          >
            <option value="todos">Todos os Encarregados</option>
            {encarregadosUnicos.map(enc => (
              <option key={enc} value={enc}>{enc}</option>
            ))}
          </select>
        </div>

        <div style={{
          marginLeft: 'auto',
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {dadosGantt.length} {dadosGantt.length === 1 ? 'obra' : 'obras'}
        </div>
      </div>

      {/* Container do Gráfico */}
      <div style={{
        height: '600px',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: 'white'
      }}>
        <div style={{ height: `${alturaTotal}px`, width: '100%', minHeight: '600px' }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

function Obras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedObra, setSelectedObra] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [programacaoDia, setProgramacaoDia] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Estados dos filtros
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroSupervisor, setFiltroSupervisor] = useState('todos');
  const [filtroEncarregado, setFiltroEncarregado] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => {
    carregarObras();
    carregarProgramacaoDia();
  }, []);

  const carregarObras = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/obras`);
      const data = await response.json();

      if (response.ok) {
        setObras(data.obras);
      } else {
        setError(data.error || 'Erro ao carregar obras');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao conectar com o servidor. Certifique-se que o backend está rodando na porta 5000.');
    } finally {
      setLoading(false);
    }
  };

  const carregarProgramacaoDia = async () => {
    try {
      const response = await fetch(`${API_URL}/programacao-dia`);
      const data = await response.json();

      if (response.ok) {
        setProgramacaoDia(data.programacao || []);
      }
    } catch (err) {
      console.error('Erro ao carregar programação do dia:', err);
    }
  };

  const handleUploadProgramacaoDia = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validar tipo de arquivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('❌ Por favor, selecione apenas arquivos Excel (.xlsx ou .xls)');
      event.target.value = ''; // Limpar input
      return;
    }

    setUploadProgress('Fazendo upload...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/programacao-dia/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadProgress('✅ Upload concluído!');
        setTimeout(() => setUploadProgress(null), 3000);
        alert(`✅ Programação do dia carregada com sucesso!\n\nTotal de itens: ${data.total_itens || 0}`);
        // Atualizar programação do dia
        setProgramacaoDia(data.programacao || []);
      } else {
        setUploadProgress(null);
        console.error('Erro no upload:', data);
        alert('❌ Erro ao fazer upload: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setUploadProgress(null);
      alert('❌ Erro ao conectar com o servidor durante upload. Verifique se o backend está rodando na porta 5000.');
    }

    // Limpar input para permitir novo upload do mesmo arquivo
    event.target.value = '';
  };

  const salvarProgramacaoDia = async () => {
    if (programacaoDia.length === 0) {
      alert('❌ Nenhuma programação carregada. Faça upload de um arquivo primeiro.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/programacao-dia/salvar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programacao: programacaoDia })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Programação salva com sucesso!\n\nArquivo: ${data.filename}`);
      } else {
        alert('❌ Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('❌ Erro ao conectar com o servidor');
    }
  };

  const removerProgramacaoDia = () => {
    if (window.confirm('❓ Tem certeza que deseja remover a programação atual?')) {
      setProgramacaoDia([]);
      alert('✅ Programação removida com sucesso!');
    }
  };

  const baixarTabelaPNG = async () => {
    const tabela = document.getElementById('tabela-programacao-dia');
    if (!tabela) {
      alert('❌ Tabela não encontrada');
      return;
    }

    try {
      const canvas = await html2canvas(tabela, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.download = `programacao-obras-${dataHoje}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      alert('❌ Erro ao gerar imagem da tabela');
    }
  };

  const formatarData = (dataStr) => {
    // Se já estiver no formato DD/MM/AAAA, retornar
    if (dataStr && dataStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dataStr;
    }

    try {
      // Tentar criar data do string
      const data = new Date(dataStr);

      // Verificar se é uma data válida
      if (isNaN(data.getTime())) {
        return dataStr; // Retornar string original se não for data válida
      }

      // Formatar como DD/MM/AAAA
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();

      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      return dataStr; // Em caso de erro, retornar string original
    }
  };

  const abrirDetalhes = (obra) => {
    setSelectedObra(obra);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedObra(null), 300);
  };

  const getStatusColor = (obraSemana) => {
    // Usar a coluna obraSemana para definir cores
    const status = obraSemana?.toUpperCase() || '';

    if (status.includes('ENERGIZADA')) return '#10b981'; // Verde
    if (status.includes('ATUANDO')) return '#f59e0b'; // Laranja
    if (status.includes('PROGRAMADA')) return '#3b82f6'; // Azul
    if (status.includes('ATRASADA')) return '#ef4444'; // Vermelho

    return '#6b7280'; // Cinza padrão
  };

  // Função para obter mês de uma data
  const getMesDaData = (dataStr) => {
    if (!dataStr || dataStr === 'nan') return null;

    try {
      if (typeof dataStr === 'string' && dataStr.includes('/')) {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
          return parseInt(partes[1], 10) - 1; // Retorna mês 0-indexed
        }
      }
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) {
        return data.getMonth();
      }
    } catch {
      return null;
    }
    return null;
  };

  // Função de filtragem
  const aplicarFiltros = (obra) => {
    // Filtro de mês (baseado na data de início)
    if (filtroMes !== 'todos') {
      const mesObra = getMesDaData(obra.dataInicio);
      if (mesObra !== parseInt(filtroMes)) {
        return false;
      }
    }

    // Filtro de supervisor
    if (filtroSupervisor !== 'todos') {
      if (obra.supervisor !== filtroSupervisor) {
        return false;
      }
    }

    // Filtro de encarregado
    if (filtroEncarregado !== 'todos') {
      if (obra.encarregado !== filtroEncarregado) {
        return false;
      }
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const status = obra.obraSemana?.toUpperCase() || '';
      if (!status.includes(filtroStatus.toUpperCase())) {
        return false;
      }
    }

    return true;
  };

  // Obter listas únicas para os filtros
  const getSupervisoresUnicos = () => {
    const supervisores = new Set();
    obras.forEach(obra => {
      if (obra.supervisor && obra.supervisor !== 'N/A' && obra.supervisor.trim() !== '') {
        supervisores.add(obra.supervisor);
      }
    });
    return [...supervisores].sort();
  };

  const getEncarregadosUnicos = () => {
    const encarregados = new Set();
    obras.forEach(obra => {
      if (obra.encarregado && obra.encarregado !== 'N/A' && obra.encarregado.trim() !== '') {
        encarregados.add(obra.encarregado);
      }
    });
    return [...encarregados].sort();
  };

  // Aplicar filtros
  const obrasFiltradas = obras.filter(aplicarFiltros);

  // Calcular progresso do mês (obras energizadas / total de obras do mês)
  const calcularProgressoMes = () => {
    if (filtroMes === 'todos') {
      const energizadas = obras.filter(o => o.obraSemana?.toUpperCase().includes('ENERGIZADA')).length;
      return obras.length > 0 ? Math.round((energizadas / obras.length) * 100) : 0;
    } else {
      const obrasMes = obras.filter(o => {
        const mesObra = getMesDaData(o.dataInicio);
        return mesObra === parseInt(filtroMes);
      });
      const energizadasMes = obrasMes.filter(o => o.obraSemana?.toUpperCase().includes('ENERGIZADA')).length;
      return obrasMes.length > 0 ? Math.round((energizadasMes / obrasMes.length) * 100) : 0;
    }
  };

  const progressoMes = calcularProgressoMes();

  return (
    <div>
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Gestão de Obras</h1>
            <p>Acompanhe o andamento de todas as obras</p>
          </div>
          <button onClick={carregarObras} className="refresh-button" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {loading ? 'Carregando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {obras.length > 0 && (
        <>
          <div className="obras-summary">
            <div className="summary-card">
              <div className="summary-number">{obrasFiltradas.length}</div>
              <div className="summary-label">Total de Obras</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{obrasFiltradas.filter(o => o.obraSemana?.toUpperCase().includes('ATUANDO')).length}</div>
              <div className="summary-label">Atuando</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{obrasFiltradas.filter(o => o.obraSemana?.toUpperCase().includes('ENERGIZADA')).length}</div>
              <div className="summary-label">Energizadas</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{obrasFiltradas.filter(o => o.obraSemana?.toUpperCase().includes('ATRASADA')).length}</div>
              <div className="summary-label">Atrasadas</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{obrasFiltradas.filter(o => o.obraSemana?.toUpperCase().includes('PROGRAMADA')).length}</div>
              <div className="summary-label">Programadas</div>
            </div>
          </div>

          {/* Barra de Progresso do Mês */}
          <div style={{
            margin: '20px 0',
            padding: '25px 30px',
            background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4f8 100%)',
            borderRadius: '15px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 5px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Progresso de Energização {filtroMes !== 'todos' && `- Mês Selecionado`}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  Percentual de obras energizadas {filtroMes !== 'todos' ? 'no mês filtrado' : 'no total'}
                </p>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                color: progressoMes >= 75 ? '#10b981' : progressoMes >= 50 ? '#f59e0b' : progressoMes >= 25 ? '#3b82f6' : '#ef4444',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {progressoMes}%
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '30px',
              background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                width: `${progressoMes}%`,
                height: '100%',
                background: progressoMes >= 75
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : progressoMes >= 50
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : progressoMes >= 25
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                transition: 'width 0.6s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '10px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                {progressoMes > 10 && `${progressoMes}%`}
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            margin: '25px 0',
            padding: '25px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
            borderRadius: '15px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              flex: '1 1 200px',
              minWidth: '200px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos os Meses</option>
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

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              flex: '1 1 200px',
              minWidth: '200px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <select
                value={filtroSupervisor}
                onChange={(e) => setFiltroSupervisor(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos os Supervisores</option>
                {getSupervisoresUnicos().map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              flex: '1 1 200px',
              minWidth: '200px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <select
                value={filtroEncarregado}
                onChange={(e) => setFiltroEncarregado(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos os Encarregados</option>
                {getEncarregadosUnicos().map(enc => (
                  <option key={enc} value={enc}>{enc}</option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              flex: '1 1 200px',
              minWidth: '200px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos os Status</option>
                <option value="energizada">✅ Energizada</option>
                <option value="atuando">🔄 Atuando</option>
                <option value="programada">📋 Programada</option>
                <option value="atrasada">⚠️ Atrasada</option>
              </select>
            </div>

            {/* Badge com contador de resultados */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ffae00ff 0%, #ffae00ff 100%)',
              borderRadius: '10px',
              color: 'black',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
              minWidth: 'fit-content'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 3h18v18H3z"/>
                <path d="M9 9h6v6H9z"/>
              </svg>
              {obrasFiltradas.length} {obrasFiltradas.length === 1 ? 'Obra' : 'Obras'}
            </div>

            {/* Botão Limpar Filtros */}
            {(filtroMes !== 'todos' || filtroSupervisor !== 'todos' || filtroEncarregado !== 'todos' || filtroStatus !== 'todos') && (
              <button
                onClick={() => {
                  setFiltroMes('todos');
                  setFiltroSupervisor('todos');
                  setFiltroEncarregado('todos');
                  setFiltroStatus('todos');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 15px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Limpar Filtros
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="error-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          Carregando obras da planilha...
        </div>
      )}

      {obras.length === 0 && !loading && !error && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>Nenhuma obra encontrada</p>
          <p className="hint-text">Certifique-se que a planilha está em backend/uploads/</p>
        </div>
      )}

      <div className="obras-grid">
        {obrasFiltradas.map(obra => {
          const isAtrasada = obra.obraSemana?.toUpperCase()?.includes('ATRASADA') || false;
          const isEnergizada = obra.obraSemana?.toUpperCase()?.includes('ENERGIZADA') || false;

          return (
            <div
              key={obra.id}
              className={`obra-card ${isEnergizada ? 'energizada' : ''} ${isAtrasada ? 'atrasada' : ''}`}
              style={{ position: 'relative' }}
            >
              {/* Tooltip para programação LV (canto superior esquerdo) - NÃO aparece se energizada ou REALIZADO */}
              {obra.programacaoLv &&
               obra.programacaoLv !== 'nan' &&
               obra.programacaoLv.trim() !== '' &&
               !isEnergizada &&
               obra.programacaoLv.toUpperCase() !== 'REALIZADO' && (
                <div className="tooltip-programacao-lv">
                  <div className="tooltip-icon-lv">❗</div>
                  <div className="tooltip-text-lv">
                    <strong>Programação LV:</strong>
                    <p>{obra.programacaoLv}</p>
                  </div>
                </div>
              )}

              {/* Tooltip para obras com motivo de atraso preenchido (canto superior direito) */}
              {obra.motivoAtraso && obra.motivoAtraso !== 'nan' && obra.motivoAtraso.trim() !== '' && (
                <div className="tooltip-atraso">
                  <div className="tooltip-icon">⚠️</div>
                  <div className="tooltip-text">
                    <strong>Motivo do Atraso:</strong>
                    <p>{obra.motivoAtraso}</p>
                  </div>
                </div>
              )}

              <div className="obra-header">
                <h3>{obra.projeto}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(obra.obraSemana) }}
                >
                  {obra.obraSemana || 'N/A'}
                </span>
              </div>
            
            <div className="obra-info">
              <div className="info-item">
                <span className="label">Encarregado:</span>
                <span className="value">{obra.encarregado}</span>
              </div>
              <div className="info-item">
                <span className="label">Título:</span>
                <span className="value">{obra.cliente}</span>
              </div>
              <div className="info-item">
                <span className="label">Localidade:</span>
                <span className="value">{obra.localidade}</span>
              </div>
              <div className="info-item">
                <span className="label">Postes:</span>
                <span className="value">{obra.postesImplantados} / {obra.postesPrevistos}</span>
              </div>
              
              <div className="progress-section">
                <div className="progress-header">
                  <span className="label">Progresso</span>
                  <span className="value">{obra.progresso}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${obra.progresso}%`,
                      backgroundColor: getStatusColor(obra.obraSemana)
                    }}
                  />
                </div>
              </div>
            </div>

            <button className="btn-details" onClick={() => abrirDetalhes(obra)}>
              Ver Detalhes
            </button>
          </div>
          );
        })}
      </div>

      {/* PROGRAMAÇÃO DO DIA */}
      <div style={{ marginTop: '40px' }}>
        <div className="programacao-header" style={{ marginBottom: '20px' }}>
          <h2>📅 PROGRAMAÇÃO DO DIA</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label
              htmlFor="upload-programacao"
              className="btn-download"
              style={{
                cursor: 'pointer',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploadProgress || 'Upload Programação'}
            </label>
            <input
              id="upload-programacao"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadProgramacaoDia}
              style={{ display: 'none' }}
            />
            <button
              onClick={baixarTabelaPNG}
              className="btn-download"
              disabled={programacaoDia.length === 0}
              style={{ background: programacaoDia.length === 0 ? '#ccc' : '#007bff' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar PNG
            </button>
            <button
              onClick={salvarProgramacaoDia}
              className="btn-download"
              disabled={programacaoDia.length === 0}
              style={{ background: programacaoDia.length === 0 ? '#ccc' : '#10b981' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Salvar
            </button>
            <button
              onClick={removerProgramacaoDia}
              className="btn-download"
              disabled={programacaoDia.length === 0}
              style={{ background: programacaoDia.length === 0 ? '#ccc' : '#ef4444' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Remover
            </button>
          </div>
        </div>

        {programacaoDia.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f9fafb',
            borderRadius: '10px',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '16px', margin: 0 }}>
              📤 Nenhuma programação carregada. Faça upload de um arquivo Excel com as colunas:<br/>
              <strong>Data, Projeto, Supervisor, Encarregado, Título, Município, Atividade Programada, Critério</strong>
            </p>
          </div>
        ) : (
          <div id="tabela-programacao-dia" style={{
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header com Logo e Título */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '25px',
              padding: '25px 30px',
              background: 'linear-gradient(135deg, #666666ff 0%, #000000ff 100%)',
              position: 'relative'
            }}>
              {/* Logo à Esquerda */}
              <img
                src="/Logos/Mariua26Cor.png"
                alt="Logo Mariua"
                style={{
                  height: '80px',
                  
                  padding: '10px',
                
                }}
              />

              {/* Título e Data */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: '700',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                  letterSpacing: '0.5px'
                }}>
                  PROGRAMAÇÃO DE OBRAS
                </h3>
                <p style={{
                  margin: '8px 0 0 0',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  📅 {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Tabela */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #08cbcbff 0%, #0B9E9F 100%)',
                    color: 'white',
                    fontstyle: 'bold'
                  }}>
                   
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>PROJETO</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>LÍDER</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>RESPONSÁVEL</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>TÍTULO</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>MUNICÍPIO</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>ATIVIDADE PROGRAMADA</th>
                    <th style={{
                      padding: '15px 12px',
                      borderBottom: '3px solid #5a67d8',
                      fontSize: '13px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>CRITÉRIO</th>
                  </tr>
                </thead>
                <tbody>
                  {programacaoDia.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        background: index % 2 === 0 ? 'white' : 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #eef2ff 0%, #f3e8ff 100%)';
                        e.currentTarget.style.transform = 'scale(1.005)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'white' : 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                     
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}>
                        <strong style={{
                          color: '#000000ff',
                          fontWeight: '700'
                        }}>{item.projeto}</strong>
                      </td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>{item.supervisor}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#000000ff'
                      }}>{item.encarregado}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#000000ff'
                      }}>{item.titulo}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#000000ff',
                        whiteSpace: 'nowrap'
                      }}>{item.municipio}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>{item.atividadeProgramada}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #ffac26ff 0%, #ffa600ff 100%)',
                          color: 'BLACK',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.criterio}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* GRÁFICO DE GANTT */}
      {obras.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            background: 'white'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '25px',
              padding: '25px 30px',
              background: 'linear-gradient(135deg, #6f6f6fff 0%, #000000ff 100%)',
              position: 'relative'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: '700',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                  letterSpacing: '0.5px'
                }}>
                  CRONOGRAMA DE OBRAS - GRÁFICO DE GANTT
                </h3>
                <p style={{
                  margin: '8px 0 0 0',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Visualização temporal das obras por equipe
                </p>
              </div>

              {/* Legenda */}
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {[
                  { label: 'Energizada', cor: '#10b981' },
                  { label: 'Atuando', cor: '#f59e0b' },
                  { label: 'Programada', cor: '#3b82f6' },
                  { label: 'Atrasada', cor: '#ef4444' }
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: item.cor,
                      borderRadius: '3px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }} />
                    <span style={{
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico */}
            <div style={{ padding: '30px' }}>
              <GanttChart obras={obras} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DA OBRA */}
      {showModal && selectedObra && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={fecharModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header">
              <h2>{selectedObra.projeto}</h2>
              <span
                className="status-badge-large"
                style={{ backgroundColor: getStatusColor(selectedObra.obraSemana) }}
              >
                {selectedObra.obraSemana || 'N/A'}
              </span>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>👥 Equipe Responsável</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Supervisor:</span>
                    <span className="detail-value">{selectedObra.supervisor}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Encarregado:</span>
                    <span className="detail-value">{selectedObra.encarregado}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AR Coelba:</span>
                    <span className="detail-value">{selectedObra.arCoelba}</span>
                  </div>
                </div>
              </div>

              {selectedObra.hasCoordinates && (
                <div className="detail-section">
                  <h3>📍 Localização</h3>
                  <div className="map-container">
                    <iframe
                      width="100%"
                      height="300"
                      frameBorder="0"
                      style={{ border: 0, borderRadius: '10px' }}
                      src={`https://www.google.com/maps?q=${selectedObra.latitude},${selectedObra.longitude}&output=embed`}
                      allowFullScreen
                      title="Mapa da Obra"
                    />
                    <div className="coordinates">
                      📍 Lat: {selectedObra.latitude} | Long: {selectedObra.longitude}
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>🔍 Visita Prévia</h3>
                <div className="detail-grid">
                  {selectedObra.dataVisitaPrevia && selectedObra.dataVisitaPrevia !== 'nan' && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Data da Visita:</span>
                      <span className="detail-value">{selectedObra.dataVisitaPrevia}</span>
                    </div>
                  )}
                  {selectedObra.observacaoVisita && selectedObra.observacaoVisita !== 'nan' && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Observações:</span>
                      <span className="detail-value observation">{selectedObra.observacaoVisita}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>📋 Análises e Solicitações</h3>
                <div className="detail-grid">
                  {selectedObra.analisePreFechamento && selectedObra.analisePreFechamento !== 'nan' && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Análise Pré-Fechamento:</span>
                      <span className="detail-value">{selectedObra.analisePreFechamento}</span>
                    </div>
                  )}
                  {selectedObra.dataSolicitacaoReserva && selectedObra.dataSolicitacaoReserva !== 'nan' && (
                    <div className="detail-item">
                      <span className="detail-label">Data Solicitação Reserva:</span>
                      <span className="detail-value">{selectedObra.dataSolicitacaoReserva}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>⚡ Informações do Projeto</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Título:</span>
                    <span className="detail-value">{selectedObra.cliente}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Localidade:</span>
                    <span className="detail-value">{selectedObra.localidade}</span>
                  </div>
                  {selectedObra.projetoMedidor && selectedObra.projetoMedidor !== 'nan' && (
                    <div className="detail-item">
                      <span className="detail-label">Projeto Medidor:</span>
                      <span className="detail-value">{selectedObra.projetoMedidor}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Postes Previstos:</span>
                    <span className="detail-value">{selectedObra.postesPrevistos}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Postes Implantados:</span>
                    <span className="detail-value">{selectedObra.postesImplantados}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Progresso:</span>
                    <span className="detail-value">{selectedObra.progresso}%</span>
                  </div>
                  {selectedObra.dataInicio && selectedObra.dataInicio !== 'nan' && (
                    <div className="detail-item">
                      <span className="detail-label">Data Início:</span>
                      <span className="detail-value">{selectedObra.dataInicio}</span>
                    </div>
                  )}
                  {selectedObra.prazo && selectedObra.prazo !== 'nan' && (
                    <div className="detail-item">
                      <span className="detail-label">Prazo:</span>
                      <span className="detail-value">{selectedObra.prazo}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedObra.anotacoes && selectedObra.anotacoes !== 'nan' && (
                <div className="detail-section">
                  <h3>📝 Anotações</h3>
                  <div className="anotacoes-box">
                    {selectedObra.anotacoes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Obras;