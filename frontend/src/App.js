// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ObrasIcon, SegurancaIcon, FrotaIcon, DashboardsIcon } from './components/SVGIcon';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    
    if (savedToken && savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }

    if (username === 'admin' && password === '123456') {
      localStorage.setItem('token', 'fake-token-123');
      localStorage.setItem('username', username);
      setCurrentUser(username);
      setPassword('');
      setUsername('');
      setLoading(false);
      setIsLoggedIn(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setCurrentUser(data.username);
        setPassword('');
        setUsername('');
        setIsLoggedIn(true);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Backend não está rodando. Usando modo de teste (admin/123456)');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    setCurrentUser('');
    setCurrentPage('home');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <img 
          src="/Logos/Mariua26Cor.png" 
          alt="Mariua Logo" 
          className="login-logo"
        />
        <div className="login-box">
          <div className="login-header">
            <div className="icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1>Bem-vindo!</h1>
            <p>Faça login para continuar</p>
          </div>

          <div className="login-form">
            <div className="form-group">
              <label>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button onClick={handleLogin} className="btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </div>
        </div>
      </div>
    );
  }

  const HomePage = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const carouselRef = useRef(null);
    const images = Array.from({ length: 20 }, (_, i) => `/carousel/${i + 1}.jpeg`);

    useEffect(() => {
      const interval = setInterval(() => {
        setScrollPosition(prev => prev + 1);
      }, 30);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (carouselRef.current) {
        const maxScroll = carouselRef.current.scrollWidth / 2;
        if (scrollPosition >= maxScroll) {
          setScrollPosition(0);
        }
        carouselRef.current.scrollLeft = scrollPosition;
      }
    }, [scrollPosition]);

    return (
      <div>
        <div className="carousel-container">
          <div className="carousel-wrapper" ref={carouselRef}>
            <div className="carousel-track">
              {[...images, ...images].map((img, index) => (
                <div key={index} className="carousel-item">
                  <img src={img} alt={`Slide ${(index % 20) + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <img 
            src="/Logos/Mariua25Branca.png" 
            alt="Mariua Branca" 
            className="carousel-logo"
          />
        </div>

        <div className="welcome-card">
          <h1>Olá, {currentUser}! 👋</h1>
          <p>Bem-vindo à sua página inicial. Navegue pelo menu abaixo para acessar as diferentes seções.</p>
        </div>

        <div className="cards-grid">
          <button className="card card-blue" onClick={() => setCurrentPage('obras')}>
            <div className="card-icon">
              <ObrasIcon size={80} color="#ffffff" />
            </div>
            <h3>Obras</h3>
            <p>Gerencie e acompanhe todas as obras em andamento</p>
          </button>

          <button className="card card-purple" onClick={() => setCurrentPage('seguranca')}>
            <div className="card-icon">
              <SegurancaIcon size={80} color="#ffffff" />
            </div>
            <h3>Segurança</h3>
            <p>Controle de acesso e relatórios de segurança</p>
          </button>

          <button className="card card-pink" onClick={() => setCurrentPage('frota')}>
            <div className="card-icon">
              <FrotaIcon size={80} color="#ffffff" />
            </div>
            <h3>Frota</h3>
            <p>Gestão completa da frota de veículos</p>
          </button>

          <button className="card card-green" onClick={() => setCurrentPage('dashboards')}>
            <div className="card-icon">
              <DashboardsIcon size={80} color="#ffffff" />
            </div>
            <h3>Dashboards</h3>
            <p>Visualize métricas e indicadores importantes</p>
          </button>
        </div>
      </div>
    );
  };

  const ObrasPage = () => {
    const [obras, setObras] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedObra, setSelectedObra] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
      carregarObras();
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
        setError('Erro ao conectar com o servidor. Certifique-se que o backend está rodando.');
      } finally {
        setLoading(false);
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

    const getStatusColor = (status, isEnergizada) => {
      if (isEnergizada) return '#10b981';
      switch (status) {
        case 'Em Andamento': return '#3b82f6';
        case 'Concluída': return '#10b981';
        case 'Programada': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    return (
      <div>
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1> Gestão de Obras</h1>
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
                  <span className="label">Titúlo:</span>
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

        {/* MODAL DE DETALHES */}
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
                {/* EQUIPE */}
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

                {/* MAPA */}
                {selectedObra.latitude && selectedObra.longitude && (
                  <div className="detail-section">
                    <h3>📍 Localização</h3>
                    <div className="map-container">
                      <iframe
                        width="100%"
                        height="300"
                        
                        style={{ border: 0, borderRadius: '10px' }}
                        src={`https://www.google.com/maps?q=${selectedObra.latitude},${selectedObra.longitude}&output=embed`}
                        allowFullScreen
                      />
                      <div className="coordinates">
                        📍 Lat: {selectedObra.latitude} | Long: {selectedObra.longitude}
                      </div>
                    </div>
                  </div>
                )}

                {/* VISITA PRÉVIA */}
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

                {/* PRÉ-FECHAMENTO */}
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

                {/* INFORMAÇÕES DO PROJETO */}
                <div className="detail-section">
                  <h3>⚡ Informações do Projeto</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Titúlo:</span>
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

                {/* ANOTAÇÕES */}
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
  };

  const SegurancaPage = () => (
    <div>
      <div className="page-header">
        <h1>🛡️ Controle de Segurança</h1>
        <p>Monitoramento de acessos e segurança</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card stat-green">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>45</h3>
            <p>Presentes</p>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <h3>12</h3>
            <p>Ausentes</p>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>8</h3>
            <p>Visitantes</p>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⚠</div>
          <div className="stat-content">
            <h3>2</h3>
            <p>Alertas</p>
          </div>
        </div>
      </div>
    </div>
  );

  const FrotaPage = () => (
    <div>
      <div className="page-header">
        <h1>🚗 Gestão de Frota</h1>
        <p>Controle completo de veículos e equipamentos</p>
      </div>
      <div className="frota-summary">
        <div className="summary-item">
          <div className="summary-number">5</div>
          <div className="summary-label">Total de Veículos</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">2</div>
          <div className="summary-label">Em Uso</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">2</div>
          <div className="summary-label">Disponíveis</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">1</div>
          <div className="summary-label">Em Manutenção</div>
        </div>
      </div>
    </div>
  );

  const DashboardsPage = () => (
    <div>
      <div className="page-header">
        <h1>📊 Dashboards</h1>
        <p>Visão geral de todas as operações</p>
      </div>
      <div className="metrics-grid">
        <div className="metric-card metric-blue">
          <div className="metric-icon">📋</div>
          <div className="metric-info">
            <h2>12</h2>
            <p>Obras Ativas</p>
            <span className="metric-trend positive">↑ 15% vs mês anterior</span>
          </div>
        </div>
        <div className="metric-card metric-green">
          <div className="metric-icon">👷</div>
          <div className="metric-info">
            <h2>145</h2>
            <p>Colaboradores</p>
            <span className="metric-trend positive">↑ 8% vs mês anterior</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'obras': return <ObrasPage />;
      case 'seguranca': return <SegurancaPage />;
      case 'frota': return <FrotaPage />;
      case 'dashboards': return <DashboardsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <img 
              src="/Logos/LogoMariua.png" 
              alt="Logo Mariua" 
              className="nav-logo"
            />
            <span>Sistema de Gestão - Mariuá</span>
          </div>

          <div className="nav-menu">
            <button className={currentPage === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setCurrentPage('home')}>Home</button>
            <button className={currentPage === 'obras' ? 'nav-link active' : 'nav-link'} onClick={() => setCurrentPage('obras')}>Obras</button>
            <button className={currentPage === 'seguranca' ? 'nav-link active' : 'nav-link'} onClick={() => setCurrentPage('seguranca')}>Segurança</button>
            <button className={currentPage === 'frota' ? 'nav-link active' : 'nav-link'} onClick={() => setCurrentPage('frota')}>Frota</button>
            <button className={currentPage === 'dashboards' ? 'nav-link active' : 'nav-link'} onClick={() => setCurrentPage('dashboards')}>Dashboards</button>
          </div>
          
          <div className="nav-actions">
            <div className="user-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{currentUser}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;