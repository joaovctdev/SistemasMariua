import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:5000/api';

function Obras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedObra, setSelectedObra] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [programacaoDia, setProgramacaoDia] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);

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
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes');

    // Validar tipo de arquivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('❌ Por favor, selecione apenas arquivos Excel (.xlsx ou .xls)');
      event.target.value = ''; // Limpar input
      return;
    }

    setUploadProgress('Fazendo upload...');
    const formData = new FormData();
    formData.append('file', file);

    console.log('Iniciando upload para:', `${API_URL}/programacao-dia/upload`);

    try {
      const response = await fetch(`${API_URL}/programacao-dia/upload`, {
        method: 'POST',
        body: formData
      });

      console.log('Resposta recebida. Status:', response.status);

      const data = await response.json();
      console.log('Dados recebidos:', data);

      if (response.ok) {
        setUploadProgress('✅ Upload concluído!');
        setTimeout(() => setUploadProgress(null), 3000);
        alert(`✅ Programação do dia carregada com sucesso!\n\nTotal de itens: ${data.total_itens || 0}`);
        // Atualizar programação do dia
        setProgramacaoDia(data.programacao || []);
        console.log('Programação atualizada:', data.programacao?.length, 'itens');
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
            <div className="summary-number">{obras.filter(o => o.obraSemana?.toUpperCase().includes('ATUANDO')).length}</div>
            <div className="summary-label">Atuando</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.obraSemana?.toUpperCase().includes('ENERGIZADA')).length}</div>
            <div className="summary-label">Energizadas</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.obraSemana?.toUpperCase().includes('ATRASADA')).length}</div>
            <div className="summary-label">Atrasadas</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{obras.filter(o => o.obraSemana?.toUpperCase().includes('PROGRAMADA')).length}</div>
            <div className="summary-label">Programadas</div>
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
        {obras.map(obra => {
          const isAtrasada = obra.obraSemana?.toUpperCase().includes('ATRASADA');
          const isEnergizada = obra.obraSemana?.toUpperCase().includes('ENERGIZADA');

          return (
            <div
              key={obra.id}
              className={`obra-card ${isEnergizada ? 'energizada' : ''} ${isAtrasada ? 'atrasada' : ''}`}
            >
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
                        color: '#374151'
                      }}>{item.encarregado}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>{item.titulo}</td>
                      <td style={{
                        padding: '14px 12px',
                        fontSize: '14px',
                        color: '#374151',
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