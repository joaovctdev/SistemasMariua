// src/pages/Obras.js - MODAL COMPLETO COM TODOS OS CAMPOS
import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:5000/api';

function Obras() {
  // ===== ESTADOS =====
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedObra, setSelectedObra] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [obrasDoDia, setObrasDoDia] = useState([]);

  // ===== CARREGAR OBRAS AO MONTAR =====
  useEffect(() => {
    carregarObras();
  }, []);

  // ===== FUNÇÃO: CARREGAR OBRAS =====
  const carregarObras = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/obras`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Obras carregadas:', data.total);
        console.log('📊 Estatísticas:', {
          total: data.obras.length,
          emAndamento: data.obras.filter(o => o.status === 'Em Andamento').length,
          concluidas: data.obras.filter(o => o.status === 'Concluída').length,
          programadas: data.obras.filter(o => o.status === 'Programada').length,
        });
        setObras(data.obras);
        filtrarObrasDoDia(data.obras);
      } else {
        setError(data.error || 'Erro ao carregar obras');
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setError('Erro ao conectar com o servidor. Certifique-se que o backend está rodando na porta 5000.');
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNÇÃO: FILTRAR OBRAS DO DIA =====
  const filtrarObrasDoDia = (todasObras) => {
    const obrasFiltradas = todasObras.filter(obra => 
      obra.status === 'Em Andamento'
    );

    console.log('📅 Obras do dia (Em Andamento):', obrasFiltradas.length);
    setObrasDoDia(obrasFiltradas);
  };

  // ===== FUNÇÃO: BAIXAR TABELA PNG =====
  const baixarTabelaPNG = async () => {
    const tabela = document.getElementById('tabela-programacao-dia');
    if (!tabela) {
      alert('Tabela não encontrada');
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
      
      console.log('✅ PNG baixado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao gerar PNG:', error);
      alert('Erro ao gerar imagem da tabela');
    }
  };

  // ===== FUNÇÃO: ABRIR DETALHES =====
  const abrirDetalhes = (obra) => {
    console.log('📋 Abrindo detalhes da obra:', obra.projeto);
    setSelectedObra(obra);
    setShowModal(true);
  };

  // ===== FUNÇÃO: FECHAR MODAL =====
  const fecharModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedObra(null), 300);
  };

  // ===== FUNÇÃO: COR DO STATUS =====
  const getStatusColor = (status, isEnergizada) => {
    if (isEnergizada) return '#10b981';
    switch (status) {
      case 'Em Andamento': return '#3b82f6';
      case 'Concluída': return '#10b981';
      case 'Programada': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // ===== DATA DE HOJE =====
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div>
      {/* ===== CABEÇALHO ===== */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>📋 Gestão de Obras</h1>
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

      {/* ===== PROGRAMAÇÃO DO DIA ===== */}
      {obrasDoDia.length > 0 && (
        <div className="programacao-dia-container">
          <div className="programacao-header">
            <h2>📅 PROGRAMAÇÃO DO DIA</h2>
            <button onClick={baixarTabelaPNG} className="btn-download">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar PNG
            </button>
          </div>

          <div id="tabela-programacao-dia" className="tabela-programacao">
            <div className="tabela-header-prog">
              <img src="/Logos/Mariua26Cor.png" alt="Logo Mariua" className="logo-tabela" />
              <div className="tabela-title">
                <h3>🏗️ PROGRAMAÇÃO DE OBRAS</h3>
                <p>Controle e acompanhamento de Obras - Novembro</p>
                <p className="data-hoje">Data de hoje: {dataHoje}</p>
              </div>
            </div>

            <table className="table-prog-dia">
              <thead>
                <tr>
                  <th>OBRA</th>
                  <th>ENCARREGADO</th>
                  <th>SUPERVISOR</th>
                  <th>TÍTULO</th>
                  <th>MUNICÍPIO</th>
                  <th>ATIVIDADE DO DIA</th>
                  <th>CRITÉRIO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {obrasDoDia.map(obra => (
                  <tr key={obra.id}>
                    <td><strong>{obra.projeto}</strong></td>
                    <td>{obra.encarregado}</td>
                    <td>{obra.supervisor}</td>
                    <td>{obra.cliente}</td>
                    <td>{obra.localidade}</td>
                    <td>{obra.necessidade || 'IMPLANTAÇÃO'}</td>
                    <td>{obra.criterio || 'QLP'}</td>
                    <td>
                      <span 
                        className="status-pill-prog" 
                        style={{ backgroundColor: getStatusColor(obra.status, obra.isEnergizada) }}
                      >
                        {obra.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== RESUMO ===== */}
      {obras.length > 0 && (
        <div className="obras-summary">
          <div className="summary-card">
            <div className="summary-number">{obras.length}</div>
            <div className="summary-label">Total de Obras</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.status === 'Em Andamento').length}</div>
            <div className="summary-label">Em Andamento</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.isEnergizada).length}</div>
            <div className="summary-label">Energizadas</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.status === 'Concluída').length}</div>
            <div className="summary-label">Concluídas</div>
          </div>
        </div>
      )}

      {/* ===== ERRO ===== */}
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

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          Carregando obras da planilha...
        </div>
      )}

      {/* ===== VAZIO ===== */}
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

      {/* ===== GRID DE OBRAS ===== */}
      <div className="obras-grid">
        {obras.map(obra => (
          <div 
            key={obra.id} 
            className={`obra-card ${obra.isEnergizada ? 'energizada' : ''}`}
          >
            <div className="obra-header">
              <h3>{obra.projeto}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(obra.status, obra.isEnergizada) }}
              >
                {obra.status}
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
                    style={{ width: `${obra.progresso}%` }} 
                  />
                </div>
              </div>
            </div>

            <button className="btn-details" onClick={() => abrirDetalhes(obra)}>
              Ver Detalhes
            </button>
          </div>
        ))}
      </div>

      {/* ===== MODAL DE DETALHES COMPLETO ===== */}
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
                style={{ backgroundColor: getStatusColor(selectedObra.status, selectedObra.isEnergizada) }}
              >
                {selectedObra.status}
              </span>
            </div>

            <div className="modal-body">
              {/* ===== EQUIPE ===== */}
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

              {/* ===== INFORMAÇÕES DO PROJETO ===== */}
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
                  <div className="detail-item">
                    <span className="detail-label">Critério:</span>
                    <span className="detail-value">{selectedObra.criterio || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Postes Previstos:</span>
                    <span className="detail-value">{selectedObra.postesPrevistos}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Postes Implantados:</span>
                    <span className="detail-value">{selectedObra.postesImplantados}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cavas Realizadas:</span>
                    <span className="detail-value">{selectedObra.cavasRealizadas}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Clientes Previstos:</span>
                    <span className="detail-value">{selectedObra.clientesPrevistos}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Progresso:</span>
                    <span className="detail-value">{selectedObra.progresso}%</span>
                  </div>
                </div>
              </div>

              {/* ===== DATAS E PRAZOS ===== */}
              <div className="detail-section">
                <h3>📅 Datas e Prazos</h3>
                <div className="detail-grid">
                  {selectedObra.dataInicio && (
                    <div className="detail-item">
                      <span className="detail-label">Data de Início:</span>
                      <span className="detail-value">{selectedObra.dataInicio}</span>
                    </div>
                  )}
                  {selectedObra.dataTermino && (
                    <div className="detail-item">
                      <span className="detail-label">Data de Término:</span>
                      <span className="detail-value">{selectedObra.dataTermino}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== PROJETOS RELACIONADOS ===== */}
              {(selectedObra.projetoKit || selectedObra.projetoMedidor) && (
                <div className="detail-section">
                  <h3>📋 Projetos Relacionados</h3>
                  <div className="detail-grid">
                    {selectedObra.projetoKit && (
                      <div className="detail-item">
                        <span className="detail-label">Projeto Kit:</span>
                        <span className="detail-value">{selectedObra.projetoKit}</span>
                      </div>
                    )}
                    {selectedObra.projetoMedidor && (
                      <div className="detail-item">
                        <span className="detail-label">Projeto Medidor:</span>
                        <span className="detail-value">{selectedObra.projetoMedidor}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== VISITA PRÉVIA ===== */}
              {(selectedObra.dataVisitaPrevia || selectedObra.observacaoVisita) && (
                <div className="detail-section">
                  <h3>🔍 Visita Prévia</h3>
                  <div className="detail-grid">
                    {selectedObra.dataVisitaPrevia && (
                      <div className="detail-item">
                        <span className="detail-label">Data da Visita:</span>
                        <span className="detail-value">{selectedObra.dataVisitaPrevia}</span>
                      </div>
                    )}
                    {selectedObra.observacaoVisita && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Observações da Visita:</span>
                        <span className="detail-value observation">{selectedObra.observacaoVisita}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== PRÉ-FECHAMENTO E RESERVAS ===== */}
              {(selectedObra.analisePreFechamento || selectedObra.dataSolicitacaoReserva) && (
                <div className="detail-section">
                  <h3>📋 Análises e Solicitações</h3>
                  <div className="detail-grid">
                    {selectedObra.analisePreFechamento && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Análise Pré-Fechamento:</span>
                        <span className="detail-value">{selectedObra.analisePreFechamento}</span>
                      </div>
                    )}
                    {selectedObra.dataSolicitacaoReserva && (
                      <div className="detail-item">
                        <span className="detail-label">Data Solicitação Reserva:</span>
                        <span className="detail-value">{selectedObra.dataSolicitacaoReserva}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== MAPA ===== */}
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

              {/* ===== ANOTAÇÕES ===== */}
              {selectedObra.anotacoes && (
                <div className="detail-section">
                  <h3>📝 Anotações Gerais</h3>
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