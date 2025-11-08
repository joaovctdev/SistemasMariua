// src/App.js - REFATORADO E MODULAR
import React, { useState, useEffect } from 'react';
import './App.css';
import { ObrasIcon, SegurancaIcon, FrotaIcon, DashboardsIcon } from './components/SVGIcon';

// Importar páginas modulares
import Home from './pages/Home';
import Obras from './pages/Obras';
import Seguranca from './pages/Seguranca';
import Frota from './pages/Frota';
import Dashboards from './pages/Dashboards';

const API_URL = 'http://localhost:5000/api';

function App() {
  // ===== ESTADOS =====
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // ===== VERIFICAR LOGIN SALVO =====
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    
    if (savedToken && savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  // ===== FUNÇÃO DE LOGIN =====
  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }

    // Modo de teste (remover em produção)
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

  // ===== FUNÇÃO DE LOGOUT =====
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    setCurrentUser('');
    setCurrentPage('home');
  };

  // ===== TELA DE LOGIN =====
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

  // ===== RENDERIZAR PÁGINA ATUAL =====
  const renderPage = () => {
    switch (currentPage) {
      case 'home': 
        return <Home currentUser={currentUser} onNavigate={setCurrentPage} />;
      case 'obras': 
        return <Obras />;
      case 'seguranca': 
        return <Seguranca />;
      case 'frota': 
        return <Frota />;
      case 'dashboards': 
        return <Dashboards />;
      default: 
        return <Home currentUser={currentUser} onNavigate={setCurrentPage} />;
    }
  };

  // ===== APLICAÇÃO PRINCIPAL =====
  return (
    <div className="app">
      {/* NAVBAR */}
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
            <button 
              className={currentPage === 'home' ? 'nav-link active' : 'nav-link'} 
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button 
              className={currentPage === 'obras' ? 'nav-link active' : 'nav-link'} 
              onClick={() => setCurrentPage('obras')}
            >
              Obras
            </button>
            <button 
              className={currentPage === 'seguranca' ? 'nav-link active' : 'nav-link'} 
              onClick={() => setCurrentPage('seguranca')}
            >
              Segurança
            </button>
            <button 
              className={currentPage === 'frota' ? 'nav-link active' : 'nav-link'} 
              onClick={() => setCurrentPage('frota')}
            >
              Frota
            </button>
            <button 
              className={currentPage === 'dashboards' ? 'nav-link active' : 'nav-link'} 
              onClick={() => setCurrentPage('dashboards')}
            >
              Dashboards
            </button>
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;