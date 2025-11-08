// src/pages/Dashboards.js
import React from 'react';

function Dashboards() {
  const metricas = {
    obrasAtivas: 12,
    colaboradores: 145,
    veiculosAtivos: 28,
    alertasSeguranca: 3
  };

  const dadosGrafico = [
    { mes: 'Jan', valor: 65 },
    { mes: 'Fev', valor: 75 },
    { mes: 'Mar', valor: 85 },
    { mes: 'Abr', valor: 70 },
    { mes: 'Mai', valor: 90 },
    { mes: 'Jun', valor: 95 },
  ];

  const maxValor = Math.max(...dadosGrafico.map(d => d.valor));

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboards</h1>
        <p>Visão geral de todas as operações</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card metric-blue">
          <div className="metric-icon">📋</div>
          <div className="metric-info">
            <h2>{metricas.obrasAtivas}</h2>
            <p>Obras Ativas</p>
            <span className="metric-trend positive">↑ 15% vs mês anterior</span>
          </div>
        </div>

        <div className="metric-card metric-green">
          <div className="metric-icon">👷</div>
          <div className="metric-info">
            <h2>{metricas.colaboradores}</h2>
            <p>Colaboradores</p>
            <span className="metric-trend positive">↑ 8% vs mês anterior</span>
          </div>
        </div>

        <div className="metric-card metric-purple">
          <div className="metric-icon">🚗</div>
          <div className="metric-info">
            <h2>{metricas.veiculosAtivos}</h2>
            <p>Veículos Ativos</p>
            <span className="metric-trend neutral">→ Estável</span>
          </div>
        </div>

        <div className="metric-card metric-orange">
          <div className="metric-icon">⚠️</div>
          <div className="metric-info">
            <h2>{metricas.alertasSeguranca}</h2>
            <p>Alertas de Segurança</p>
            <span className="metric-trend negative">↓ 25% vs mês anterior</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h2>Progresso Mensal - 2025</h2>
        <div className="bar-chart">
          {dadosGrafico.map((item, index) => (
            <div key={index} className="bar-wrapper">
              <div className="bar-column">
                <div 
                  className="bar-fill"
                  style={{ height: `${(item.valor / maxValor) * 100}%` }}
                >
                  <span className="bar-value">{item.valor}%</span>
                </div>
              </div>
              <div className="bar-label">{item.mes}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>🎯 Metas do Mês</h3>
          <div className="goal-list">
            <div className="goal-item">
              <span>Concluir 3 obras</span>
              <span className="goal-status complete">✓ Completo</span>
            </div>
            <div className="goal-item">
              <span>Reduzir acidentes em 20%</span>
              <span className="goal-status progress">Em andamento</span>
            </div>
            <div className="goal-item">
              <span>Manutenção preventiva</span>
              <span className="goal-status pending">Pendente</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>📅 Próximos Eventos</h3>
          <div className="event-list">
            <div className="event-item">
              <div className="event-date">10/11</div>
              <div className="event-info">
                <strong>Inspeção Obra Central</strong>
                <span>09:00 - Local: Centro</span>
              </div>
            </div>
            <div className="event-item">
              <div className="event-date">15/11</div>
              <div className="event-info">
                <strong>Treinamento de Segurança</strong>
                <span>14:00 - Todos os colaboradores</span>
              </div>
            </div>
            <div className="event-item">
              <div className="event-date">20/11</div>
              <div className="event-info">
                <strong>Reunião de Resultados</strong>
                <span>10:00 - Sala de Conferências</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboards;