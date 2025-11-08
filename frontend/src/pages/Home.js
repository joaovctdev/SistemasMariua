// src/pages/Home.js - ATUALIZADO COM NAVEGAÇÃO
import React, { useState, useEffect, useRef } from 'react';
import { ObrasIcon, SegurancaIcon, FrotaIcon, DashboardsIcon } from '../components/SVGIcon';

function Home({ currentUser, onNavigate }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);
  const images = Array.from({ length: 20 }, (_, i) => `/carousel/${i + 1}.jpeg`);

  // ===== AUTO-SCROLL DO CAROUSEL =====
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
      {/* CAROUSEL INFINITO */}
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

      {/* MENSAGEM DE BOAS-VINDAS */}
      <div className="welcome-card">
        <h1>Olá, {currentUser}! 👋</h1>
        <p>Bem-vindo à sua página inicial. Navegue pelo menu abaixo para acessar as diferentes seções.</p>
      </div>

      {/* CARDS DE NAVEGAÇÃO */}
      <div className="cards-grid">
        <button 
          className="card card-blue" 
          onClick={() => onNavigate('obras')}
        >
          <div className="card-icon">
            <ObrasIcon size={80} color="#ffffff" />
          </div>
          <h3>Obras</h3>
          <p>Gerencie e acompanhe todas as obras em andamento</p>
        </button>

        <button 
          className="card card-purple" 
          onClick={() => onNavigate('seguranca')}
        >
          <div className="card-icon">
            <SegurancaIcon size={80} color="#ffffff" />
          </div>
          <h3>Segurança</h3>
          <p>Controle de acesso e relatórios de segurança</p>
        </button>

        <button 
          className="card card-pink" 
          onClick={() => onNavigate('frota')}
        >
          <div className="card-icon">
            <FrotaIcon size={80} color="#ffffff" />
          </div>
          <h3>Frota</h3>
          <p>Gestão completa da frota de veículos</p>
        </button>

        <button 
          className="card card-green" 
          onClick={() => onNavigate('dashboards')}
        >
          <div className="card-icon">
            <DashboardsIcon size={80} color="#ffffff" />
          </div>
          <h3>Dashboards</h3>
          <p>Visualize métricas e indicadores importantes</p>
        </button>
      </div>
    </div>
  );
}

export default Home;