import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:5000/api';

function Obras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedObra, setSelectedObra] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [obrasDoDia, setObrasDoDia] = useState([]);
  const [showAdicionarModal, setShowAdicionarModal] = useState(false);
  const [atividades, setAtividades] = useState([]);
  
  // Estado para nova obra
  const [novaObra, setNovaObra] = useState({
    projeto: '',
    encarregado: '',
    supervisor: '',
    cliente: '',
    localidade: '',
    criterio: '',
    atividadeDia: 'IMPLANTAÇÃO',
    postesPrevistos: 0,
    dataInicio: '',
    prazo: ''
  });

  useEffect(() => {
    carregarObras();
    carregarAtividades();
  }, []);

  const carregarAtividades = async () => {
    try {
      const response = await fetch(`${API_URL}/atividades`);
      const data = await response.json();
      if (response.ok) {
        setAtividades(data.atividades);
      }
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    }
  };

  const carregarObras = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/obras`);
      const data = await response.json();

      if (response.ok) {
        setObras(data.obras);
        filtrarObrasDoDia(data.obras);
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

  const filtrarObrasDoDia = (todasObras) => {
    const obrasFiltradas = todasObras.filter(obra => {
      return obra.status === 'Em Andamento';
    });
    setObrasDoDia(obrasFiltradas);
  };

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
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      alert('Erro ao gerar imagem da tabela');
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

  const abrirModalAdicionar = () => {
    setNovaObra({
      projeto: '',
      encarregado: '',
      supervisor: '',
      cliente: '',
      localidade: '',
      criterio: '',
      atividadeDia: 'IMPLANTAÇÃO',
      postesPrevistos: 0,
      dataInicio: '',
      prazo: ''
    });
    setShowAdicionarModal(true);
  };

  const fecharModalAdicionar = () => {
    setShowAdicionarModal(false);
  };

  const handleProjetoChange = async (e) => {
    const projetoId = e.target.value.toUpperCase();
    setNovaObra({ ...novaObra, projeto: projetoId });

    // Se o projeto começa com B-, buscar configurações
    if (projetoId.startsWith('B-')) {
      try {
        const response = await fetch(`${API_URL}/projeto-config/${projetoId}`);
        const data = await response.json();
        
        if (response.ok && data.config && Object.keys(data.config).length > 0) {
          setNovaObra(prev => ({
            ...prev,
            projeto: projetoId,
            supervisor: data.config.supervisor || prev.supervisor,
            cliente: data.config.cliente || prev.cliente,
            localidade: data.config.localidade || prev.localidade,
            criterio: data.config.criterio || prev.criterio
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar config do projeto:', err);
      }
    }
  };

  const adicionarObra = async () => {
    if (!novaObra.projeto || !novaObra.encarregado) {
      alert('❌ Projeto e Encarregado são obrigatórios!');
      return;
    }

    try {
      console.log('Enviando nova obra:', novaObra);
      
      const response = await fetch(`${API_URL}/obras/adicionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaObra)
      });

      const data = await response.json();
      console.log('Resposta do servidor:', data);

      if (response.ok) {
        alert('✅ Obra adicionada com sucesso!');
        fecharModalAdicionar();
        await carregarObras();
      } else {
        console.error('Erro na resposta:', data);
        alert('❌ Erro ao adicionar obra: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao conectar:', err);
      alert('❌ Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    }
  };

  const atualizarAtividadeDia = async (obraId, novaAtividade) => {
    try {
      console.log(`Atualizando obra ID ${obraId} com atividade: ${novaAtividade}`);
      
      const response = await fetch(`${API_URL}/obras/atualizar/${obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atividadeDia: novaAtividade })
      });

      const data = await response.json();
      console.log('Resposta do servidor:', data);

      if (response.ok) {
        console.log('Atividade atualizada com sucesso!');
        // Recarregar obras após sucesso
        await carregarObras();
      } else {
        console.error('Erro na resposta:', data);
        alert('Erro ao atualizar atividade: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao conectar:', err);
      alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    }
  };

  const getStatusColor = (status, isEnergizada) => {
    if (isEnergizada) return '#10b981';
    switch (status) {
      case 'Em Andamento': return '#3b82f6';
      case 'Concluída': return '#10b981';
      case 'Programada': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div>
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

      {obras.length > 0 && (
        <div className="obras-summary">
          <div className="summary-card">
            <div className="summary-number">{obras.length}</div>
            <div className="summary-label">Total de Obras</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obrasDoDia.length}</div>
            <div className="summary-label">Obras do Dia</div>
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
                    style={{ 
                      width: `${obra.progresso}%`,
                      backgroundColor: getStatusColor(obra.status, obra.isEnergizada)
                    }} 
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

      {/* PROGRAMAÇÃO DO DIA - MOVIDA PARA BAIXO */}
      {obrasDoDia.length > 0 && (
        <div className="programacao-dia-container" style={{ marginTop: '40px' }}>
          <div className="programacao-header">
            <h2>📅 PROGRAMAÇÃO DO DIA</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={abrirModalAdicionar} className="btn-download" style={{ background: '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nova Obra
              </button>
              <button onClick={baixarTabelaPNG} className="btn-download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Baixar PNG
              </button>
            </div>
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
                    <td>
                      <select 
                        value={obra.atividadeDia || 'IMPLANTAÇÃO'}
                        onChange={(e) => atualizarAtividadeDia(obra.id, e.target.value)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          border: '1px solid #ddd',
                          background: 'white',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {atividades.map(atividade => (
                          <option key={atividade} value={atividade}>
                            {atividade}
                          </option>
                        ))}
                      </select>
                    </td>
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

      {/* MODAL DE ADICIONAR OBRA */}
      {showAdicionarModal && (
        <div className="modal-overlay" onClick={fecharModalAdicionar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={fecharModalAdicionar}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header">
              <h2>➕ Adicionar Nova Obra</h2>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>📋 Informações Principais</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Projeto *:</span>
                    <input
                      type="text"
                      value={novaObra.projeto}
                      onChange={handleProjetoChange}
                      placeholder="Ex: B-0001"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Encarregado *:</span>
                    <input
                      type="text"
                      value={novaObra.encarregado}
                      onChange={(e) => setNovaObra({ ...novaObra, encarregado: e.target.value })}
                      placeholder="Nome do encarregado"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Supervisor:</span>
                    <input
                      type="text"
                      value={novaObra.supervisor}
                      onChange={(e) => setNovaObra({ ...novaObra, supervisor: e.target.value })}
                      placeholder="Nome do supervisor"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Título/Cliente:</span>
                    <input
                      type="text"
                      value={novaObra.cliente}
                      onChange={(e) => setNovaObra({ ...novaObra, cliente: e.target.value })}
                      placeholder="Título da obra"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Município:</span>
                    <input
                      type="text"
                      value={novaObra.localidade}
                      onChange={(e) => setNovaObra({ ...novaObra, localidade: e.target.value })}
                      placeholder="Localidade"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Critério:</span>
                    <input
                      type="text"
                      value={novaObra.criterio}
                      onChange={(e) => setNovaObra({ ...novaObra, criterio: e.target.value })}
                      placeholder="Ex: QLP, QLU"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Atividade do Dia:</span>
                    <select
                      value={novaObra.atividadeDia}
                      onChange={(e) => setNovaObra({ ...novaObra, atividadeDia: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      {atividades.map(atividade => (
                        <option key={atividade} value={atividade}>
                          {atividade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Postes Previstos:</span>
                    <input
                      type="number"
                      value={novaObra.postesPrevistos}
                      onChange={(e) => setNovaObra({ ...novaObra, postesPrevistos: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Data Início:</span>
                    <input
                      type="date"
                      value={novaObra.dataInicio}
                      onChange={(e) => setNovaObra({ ...novaObra, dataInicio: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Prazo:</span>
                    <input
                      type="date"
                      value={novaObra.prazo}
                      onChange={(e) => setNovaObra({ ...novaObra, prazo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={adicionarObra}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Adicionar Obra
                </button>
                <button 
                  onClick={fecharModalAdicionar}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✗ Cancelar
                </button>
              </div>
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
                style={{ backgroundColor: getStatusColor(selectedObra.status, selectedObra.isEnergizada) }}
              >
                {selectedObra.status}
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