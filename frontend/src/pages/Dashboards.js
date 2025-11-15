// src/pages/Dashboards.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  KPICard,
  LineChart,
  BarChart,
  DonutChart,
  GaugeChart
} from '../components';
import {
  processMainBDData,
  groupPostesByEquipe,
  groupPostesBySupervisor,
  groupPostesByBase,
  groupCavasByEquipe,
  groupCavasByOperador,
  groupClientesByEquipe,
  groupObrasByAR,
  calculateVariation,
  formatValue,
  COLORS
} from '../utils/chartUtils';
import '../styles/charts.css';

const API_URL = 'http://localhost:5000/api';

function Dashboards() {
  // ========================================
  // ESTADOS
  // ========================================
  const [mainBDData, setMainBDData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastMonthData, setLastMonthData] = useState([]);

  // ========================================
  // CARREGAR DADOS DA API
  // ========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Buscar dados do MainBD.xlsx
        const response = await fetch(`${API_URL}/mainbd`);

        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Dados recebidos em formato inválido');
        }

        setMainBDData(data);

        // Calcular dados de 30 dias atrás para comparação
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        const lastPeriodData = data.filter(row => {
          if (!row.data_servico) return false;
          const dataServico = new Date(row.data_servico);
          return dataServico >= thirtyDaysAgo && dataServico < now;
        });

        setLastMonthData(lastPeriodData.length > 0 ? lastPeriodData : data);

        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar dados do servidor');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ========================================
  // PROCESSAR DADOS COM USEMEMO
  // ========================================
  const kpis = useMemo(() => {
    if (!mainBDData.length) return null;
    return processMainBDData(mainBDData);
  }, [mainBDData]);

  const kpisLastMonth = useMemo(() => {
    if (!lastMonthData.length) return null;
    return processMainBDData(lastMonthData);
  }, [lastMonthData]);

  // Calcular variações mês a mês
  const variations = useMemo(() => {
    if (!kpis || !kpisLastMonth) {
      return {
        postes: 0,
        cavas: 0,
        clientes: 0,
        obrasEnergizadas: 0,
        faturamento: 0,
        mediaPostes: 0,
        mediaCavas: 0,
        taxaEnergizacao: 0,
      };
    }

    return {
      postes: calculateVariation(kpis.postes, kpisLastMonth.postes),
      cavas: calculateVariation(kpis.cavas, kpisLastMonth.cavas),
      clientes: calculateVariation(kpis.clientes, kpisLastMonth.clientes),
      obrasEnergizadas: calculateVariation(kpis.obrasEnergizadas, kpisLastMonth.obrasEnergizadas),
      faturamento: calculateVariation(kpis.faturamento, kpisLastMonth.faturamento),
      mediaPostes: calculateVariation(kpis.mediaPostesPorEquipe, kpisLastMonth.mediaPostesPorEquipe),
      mediaCavas: calculateVariation(kpis.mediaCavasPorEquipe, kpisLastMonth.mediaCavasPorEquipe),
      taxaEnergizacao: calculateVariation(
        (kpis.obrasEnergizadas / kpis.totalObras) * 100,
        (kpisLastMonth.obrasEnergizadas / kpisLastMonth.totalObras) * 100
      ),
    };
  }, [kpis, kpisLastMonth]);

  // Agrupar dados para gráficos
  const postesPorEquipe = useMemo(() => {
    if (!mainBDData.length) return [];
    const result = groupPostesByEquipe(mainBDData);
    console.log('postesPorEquipe:', result.slice(0, 3));
    return result;
  }, [mainBDData]);

  const postesPorSupervisor = useMemo(() => {
    if (!mainBDData.length) return [];
    return groupPostesBySupervisor(mainBDData);
  }, [mainBDData]);

  const cavasPorEquipe = useMemo(() => {
    if (!mainBDData.length) return [];
    return groupCavasByEquipe(mainBDData);
  }, [mainBDData]);

  const cavasPorOperador = useMemo(() => {
    if (!mainBDData.length) return [];
    return groupCavasByOperador(mainBDData);
  }, [mainBDData]);

  // Postes por Base (IRC vs JAC)
  // ETEMILSON e GILVANDO = Jacobina, resto = Irecê
  const postesPorBase = useMemo(() => {
    if (!mainBDData.length) return [];
    const baseData = groupPostesByBase(mainBDData);

    // Adicionar cores
    return baseData.map(item => ({
      ...item,
      color: item.label === 'JACOBINA' ? COLORS.primaryLight : COLORS.primary
    }));
  }, [mainBDData]);

  // Obras energizadas vs não energizadas
  const obrasEnergizacao = useMemo(() => {
    if (!mainBDData.length) return [];

    const obrasUnicas = [...new Set(mainBDData.map(row => row['SS/OT']))];

    const energizadas = obrasUnicas.filter(ssot => {
      const obra = mainBDData.find(row => row['SS/OT'] === ssot && row.data_energ);
      return obra !== undefined;
    }).length;

    const naoEnergizadas = obrasUnicas.length - energizadas;

    return [
      { label: 'Energizadas', value: energizadas, color: COLORS.primary },
      { label: 'Não Energizadas', value: naoEnergizadas, color: COLORS.secondary },
    ];
  }, [mainBDData]);

  // Clientes ligados por equipe
  // Clientes por Equipe - soma qtd_atividade onde des_atividade = "LIGAÇÃO CLIENTE"
  const clientesPorEquipe = useMemo(() => {
    if (!mainBDData.length) return [];
    return groupClientesByEquipe(mainBDData);
  }, [mainBDData]);

  // Obras por AR_COELBA
  const obrasPorAR = useMemo(() => {
    if (!mainBDData.length) return [];
    const result = groupObrasByAR(mainBDData);
    console.log('obrasPorAR:', result.slice(0, 5));
    console.log('Total de ARs:', result.length);
    return result;
  }, [mainBDData]);

  // ========================================
  // LOADING E ERROR STATES
  // ========================================
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #00989E 0%, #4FB8BC 100%)',
          padding: '30px',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>📊 Dashboards</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Carregando dados...</p>
        </div>

        {/* Loading Skeletons */}
        <div className="kpi-card-grid" style={{ marginBottom: '30px' }}>
          {[...Array(8)].map((_, i) => (
            <KPICard key={i} loading={true} />
          ))}
        </div>

        <div className="chart-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="loading-skeleton" style={{
              height: '350px',
              background: '#F3F4F6',
              borderRadius: '12px'
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          padding: '20px',
          borderRadius: '12px',
          color: '#991B1B'
        }}>
          <h2 style={{ margin: '0 0 10px 0' }}>❌ Erro ao carregar dashboards</h2>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#00989E',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div style={{ padding: '20px' }} className="custom-scrollbar">
      {/* ========================================
          HEADER
          ======================================== */}
      <div className="section-header">
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>📊 Dashboards</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Visualize métricas e indicadores do Sistema Mariuá -
          Total de {formatValue(mainBDData.length, 'number')} registros
        </p>
      </div>

      {/* ========================================
          SEÇÃO: KPIs PRINCIPAIS
          ======================================== */}
      <div className="kpi-card-grid" style={{ marginBottom: '40px' }}>
        <KPICard
          title="Total de Postes"
          value={kpis?.postes || 0}
          variation={variations.postes}
          icon="📍"
          color={COLORS.primary}
          format="number"
          meta={{ weekly: 15, monthly: 50 }}
        />

        <KPICard
          title="Total de Cavas"
          value={kpis?.cavas || 0}
          variation={variations.cavas}
          icon="⛏️"
          color={COLORS.primaryLight}
          format="number"
          meta={{ weekly: 12, monthly: 45 }}
        />

        <KPICard
          title="Clientes Ligados"
          value={kpis?.clientes || 0}
          variation={variations.clientes}
          icon="🏠"
          color={COLORS.secondary}
          format="number"
        />

        <KPICard
          title="Obras Energizadas"
          value={kpis?.obrasEnergizadas || 0}
          variation={variations.obrasEnergizadas}
          icon="⚡"
          color={COLORS.primary}
          format="number"
        />

        <KPICard
          title="Faturamento Total"
          value={kpis?.faturamento || 0}
          variation={variations.faturamento}
          icon="💰"
          color={COLORS.primary}
          format="compact"
        />

        <KPICard
          title="Cavas por Retro"
          value={kpis?.cavasPorRetro || 0}
          variation={0}
          icon="🚜"
          color={COLORS.secondary}
          format="number"
        />
      </div>

      {/* ========================================
          SEÇÃO: POSTES
          ======================================== */}
      <div className="section-header">
        <h2>📍 Análise de Postes</h2>
        <p>Distribuição e evolução de postes instalados</p>
      </div>

      <div className="chart-grid" style={{ marginBottom: '40px' }}>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
          <BarChart
            data={postesPorEquipe}
            title="Postes por Equipe (Todas)"
            orientation="horizontal"
            height={Math.max(400, postesPorEquipe.length * 40)}
            showDataLabels={true}
          />
        </div>

        <BarChart
          data={postesPorSupervisor}
          title="Postes por Supervisor"
          orientation="vertical"
          height={400}
          showDataLabels={true}
        />

        <DonutChart
          data={postesPorBase}
          title="Postes por Base (IRC vs JAC)"
          type="donut"
          showPercentage={true}
          height={350}
        />

        <GaugeChart
          title="Meta Mensal de Postes"
          value={kpis?.postes || 0}
          target={50}
          label="Mensal"
          format="number"
          showProgress={true}
          height={350}
        />
      </div>

      {/* ========================================
          SEÇÃO: CAVAS
          ======================================== */}
      <div className="section-header">
        <h2>⛏️ Análise de Cavas</h2>
        <p>Escavações realizadas por equipe</p>
      </div>

      <div className="chart-grid" style={{ marginBottom: '40px' }}>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
          <BarChart
            data={cavasPorEquipe}
            title="Cavas por Equipe (Todas)"
            orientation="horizontal"
            height={Math.max(400, cavasPorEquipe.length * 40)}
            showDataLabels={true}
          />
        </div>

        <BarChart
          data={cavasPorOperador}
          title="Cavas por Operador (Retro)"
          orientation="vertical"
          height={400}
          showDataLabels={true}
        />

        <GaugeChart
          title="Meta Mensal de Cavas"
          value={kpis?.cavas || 0}
          target={45}
          label="Mensal"
          format="number"
          showProgress={false}
          height={400}
        />
      </div>

      {/* ========================================
          SEÇÃO: OBRAS E ENERGIZAÇÃO
          ======================================== */}
      <div className="section-header">
        <h2>⚡ Obras e Energização</h2>
        <p>Status de energização das obras</p>
      </div>

      <div className="chart-grid" style={{ marginBottom: '40px' }}>
        <DonutChart
          data={obrasEnergizacao}
          title="Status de Energização"
          type="donut"
          showPercentage={true}
          showCenterLabel={true}
          centerLabel={`${kpis?.obrasEnergizadas || 0}`}
          height={350}
        />

        <div className="chart-container" style={{ height: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '600' }}>
            Resumo de Obras
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
            <div style={{
              padding: '20px',
              background: '#F3F4F6',
              borderRadius: '8px',
              borderLeft: '4px solid #00989E'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '4px' }}>
                Total de Obras
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                {kpis?.totalObras || 0}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#D1FAE5',
              borderRadius: '8px',
              borderLeft: '4px solid #00989E'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#065F46', marginBottom: '4px' }}>
                Obras Energizadas
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#065F46' }}>
                {kpis?.obrasEnergizadas || 0}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#FEF3C7',
              borderRadius: '8px',
              borderLeft: '4px solid #F78E3D'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '4px' }}>
                Pendentes de Energização
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#92400E' }}>
                {(kpis?.totalObras || 0) - (kpis?.obrasEnergizadas || 0)}
              </div>
            </div>
          </div>
        </div>

        <BarChart
          data={obrasPorAR}
          title="Obras por AR COELBA"
          orientation="horizontal"
          height={350}
          showDataLabels={true}
        />
      </div>

      {/* ========================================
          SEÇÃO: CLIENTES
          ======================================== */}
      <div className="section-header">
        <h2>🏠 Clientes Ligados</h2>
        <p>Conexões realizadas por equipe</p>
      </div>

      <div className="chart-grid" style={{ marginBottom: '40px' }}>
        <BarChart
          data={clientesPorEquipe}
          title="Clientes por Equipe"
          orientation="vertical"
          height={350}
          showDataLabels={true}
        />

        <GaugeChart
          title="Meta Mensal de Clientes"
          value={kpis?.clientes || 0}
          target={100}
          label="Clientes"
          format="number"
          showProgress={true}
          height={350}
        />
      </div>

      {/* ========================================
          FOOTER
          ======================================== */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        color: '#6B7280',
        fontSize: '0.875rem',
        borderTop: '1px solid #E5E7EB'
      }}>
        <p style={{ margin: 0 }}>
          Dashboard atualizado em {new Date().toLocaleString('pt-BR')} •
          Total de {formatValue(mainBDData.length, 'number')} registros processados
        </p>
      </div>
    </div>
  );
}

export default Dashboards;
