// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { ObrasIcon, SegurancaIcon, FrotaIcon, DashboardsIcon } from './components/SVGIcon';
import Obras from './pages/Obras';
import Dashboards from './pages/Dashboards';

const API_URL = 'http://localhost:5000/api';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPage = location.pathname.substring(1) || 'home';

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
    navigate('/home');
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
          <button className="card card-blue" onClick={() => navigate('/obras')}>
            <div className="card-icon">
              <ObrasIcon size={80} color="#ffffff" />
            </div>
            <h3>Obras</h3>
            <p>Gerencie e acompanhe todas as obras em andamento</p>
          </button>

          <button className="card card-purple" onClick={() => navigate('/seguranca')}>
            <div className="card-icon">
              <SegurancaIcon size={80} color="#ffffff" />
            </div>
            <h3>Segurança</h3>
            <p>Controle de acesso e relatórios de segurança</p>
          </button>

          <button className="card card-pink" onClick={() => navigate('/frota')}>
            <div className="card-icon">
              <FrotaIcon size={80} color="#ffffff" />
            </div>
            <h3>Frota</h3>
            <p>Gestão completa da frota de veículos</p>
          </button>

          <button className="card card-green" onClick={() => navigate('/dashboards')}>
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
            <button className={currentPage === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/home')}>Home</button>
            <button className={currentPage === 'obras' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/obras')}>Obras</button>
            <button className={currentPage === 'seguranca' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/seguranca')}>Segurança</button>
            <button className={currentPage === 'frota' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/frota')}>Frota</button>
            <button className={currentPage === 'dashboards' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/dashboards')}>Dashboards</button>
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
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/seguranca" element={<SegurancaPage />} />
          <Route path="/frota" element={<FrotaPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;