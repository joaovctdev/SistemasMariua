import React, { useState, useEffect, useRef } from 'react';
import './ProducaoDia.css';

const API_URL = 'http://localhost:5000/api';

function ProducaoDia() {
  const [producoes, setProducoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataAtual, setDataAtual] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('10-11-2025');
  const tableRef = useRef(null);

  useEffect(() => {
    fetchProducaoDia(dataSelecionada);
  }, [dataSelecionada]);

  const fetchProducaoDia = async (dataParam) => {
    setLoading(true);
    setError('');

    try {
      const url = dataParam ? `${API_URL}/producao-dia?data=${dataParam}` : `${API_URL}/producao-dia`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao carregar dados de produção');
      }

      const data = await response.json();

      if (data.success) {
        setProducoes(data.producoes);
        setDataAtual(data.data);
      } else {
        setError(data.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      console.error('Erro ao buscar produção do dia:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progresso) => {
    if (progresso >= 80) return '#10b981';
    if (progresso >= 50) return '#f59e0b';
    if (progresso >= 20) return '#ef4444';
    return '#6b7280';
  };

  const getProgressStatus = (producao) => {
    if (producao.status) {
      return producao.status;
    }
    const progresso = producao.progresso || 0;
    if (progresso >= 80) return 'Concluído';
    if (progresso >= 50) return 'Em Andamento';
    if (progresso > 0) return 'Iniciado';
    return 'Não Concluído';
  };

  const downloadTableAsImage = async () => {
    try {
      const html2canvasModule = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');
      const html2canvas = html2canvasModule.default;
      
      const tableContainer = tableRef.current;
      if (!tableContainer) return;

      const canvas = await html2canvas(tableContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: tableContainer.scrollWidth,
        windowHeight: tableContainer.scrollHeight
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `producao-dia-${dataSelecionada}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
      alert('Erro ao gerar imagem da tabela');
    }
  };

  if (loading) {
    return (
      <div className="producao-dia-container">
        <div className="loading">Carregando produção do dia...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="producao-dia-container">
        <div className="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
        <button onClick={() => fetchProducaoDia(dataSelecionada)} className="retry-button">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="producao-dia-container">
      <div className="producao-header">
        <div className="header-content">
          <div>
            <h1>Produção do Dia</h1>
            <p>Acompanhamento da produção por dia - {dataAtual}</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="date-selector">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <select
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="date-select"
              >
            
                <option value="10-11-2025">10/11/2025</option>
              </select>
            </div>
            <button onClick={downloadTableAsImage} className="download-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar
            </button>
            <button onClick={() => fetchProducaoDia(dataSelecionada)} className="refresh-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="resumo-cards">
        <div className="resumo-card">
          <div className="resumo-icon" style={{ background: 'linear-gradient(135deg, #eab766ff 0%, #ff9d00ff 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="resumo-content">
            <div className="resumo-value">{producoes.length}</div>
            <div className="resumo-label">Obras Programadas</div>
          </div>
        </div>

        <div className="resumo-card">
          <div className="resumo-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="resumo-content">
            <div className="resumo-value">{producoes.filter(p => p.progresso >= 80).length}</div>
            <div className="resumo-label">Concluídas</div>
          </div>
        </div>

        

        <div className="resumo-card">
          <div className="resumo-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="resumo-content">
            <div className="resumo-value">{producoes.filter(p => p.progresso === 0).length}</div>
            <div className="resumo-label">Não Concluídas</div>
          </div>
        </div>
      </div>

      <div className="producao-table-container" ref={tableRef}>
        <table className="producao-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Projeto</th>
              <th style={{ width: '10%' }}>Encarregado</th>
              <th style={{ width: '12%' }}>Título</th>
              <th style={{ width: '12%' }}>Atividade</th>
              <th style={{ width: '6%' }}>Locação</th>
              <th style={{ width: '7%' }}>Cava Real</th>
              <th style={{ width: '7%' }}>Poste Real</th>
              <th style={{ width: '10%' }}>Progresso</th>
              <th style={{ width: '8%' }}>Progresso</th>
              <th style={{ width: '13%' }}>Status</th>
              <th style={{ width: '30%' }}>Justificativa</th>
            </tr>
          </thead>
          <tbody>
            {producoes.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  Nenhuma obra programada para hoje
                </td>
              </tr>
            ) : (
              producoes.map((producao, index) => (
                <tr key={index}>
                  <td className="projeto-cell">{producao.projeto}</td>
                  <td>{producao.encarregado}</td>
                  <td className="titulo-cell">{producao.titulo}</td>
                  <td>{producao.atividadeProgramada}</td>
                  <td className="numeric-cell">{producao.locacao || 0}</td>
                  <td className="numeric-cell">{producao.cavaReal || 0}</td>
                  <td className="numeric-cell">{producao.cavaEmRocha || 0}</td>
                  <td className="numeric-cell">{producao.posteReal || 0}</td>
                  <td className="progress-cell">
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${producao.progresso}%`,
                          backgroundColor: getProgressColor(producao.progresso)
                        }}
                      >
                        <span className="progress-text">{producao.progresso}%</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getProgressColor(producao.progresso) }}
                    >
                      {getProgressStatus(producao)}
                    </span>
                  </td>
                  <td className="observacoes-cell">
                    
                   
                    {producao.justificativa && (
                      <div className="observacao-item">
                        <strong>Justificativa:</strong> {producao.justificativa}
                      </div>
                    )}
                    {!producao.evento && !producao.responsavel && !producao.justificativa && '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProducaoDia;