// src/pages/Home.js
import React, { useState, useEffect, useRef } from 'react';

function Home({ currentUser }) {
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
      {/* Carousel Infinito */}
      <div className="carousel-container">
        <div className="carousel-wrapper" ref={carouselRef}>
          <div className="carousel-track">
            {/* Duplicamos as imagens para o efeito infinito */}
            {[...images, ...images].map((img, index) => (
              <div key={index} className="carousel-item">
                <img src={img} alt={`Slide ${(index % 20) + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo da Home */}
      <div className="welcome-card">
        <h1>Olá, {currentUser}! 👋</h1>
        <p>Bem-vindo à sua página inicial. Navegue pelo menu abaixo para acessar as diferentes seções.</p>
      </div>

      <div className="cards-grid">
        <div className="card card-blue">
          <h3>📋 Obras</h3>
          <p>Gerencie e acompanhe todas as obras em andamento</p>
        </div>

        <div className="card card-purple">
          <h3>🛡️ Segurança</h3>
          <p>Controle de acesso e relatórios de segurança</p>
        </div>

        <div className="card card-pink">
          <h3>🚗 Frota</h3>
          <p>Gestão completa da frota de veículos</p>
        </div>

        <div className="card card-green">
          <h3>📊 Dashboards</h3>
          <p>Visualize métricas e indicadores importantes</p>
        </div>
      </div>
    </div>
  );
}

export default Home;