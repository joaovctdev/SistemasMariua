// src/pages/Frota.js
import React, { useState } from 'react';

function Frota() {
  const [veiculos] = useState([
    { id: 1, placa: 'ABC-1234', modelo: 'Caminhão Basculante', status: 'Em Uso', km: 45230, manutencao: '15/12/2025' },
    { id: 2, placa: 'XYZ-5678', modelo: 'Van de Transporte', status: 'Disponível', km: 32100, manutencao: '20/11/2025' },
    { id: 3, placa: 'DEF-9012', modelo: 'Escavadeira', status: 'Manutenção', km: 12500, manutencao: '10/11/2025' },
    { id: 4, placa: 'GHI-3456', modelo: 'Pickup 4x4', status: 'Em Uso', km: 78900, manutencao: '25/12/2025' },
    { id: 5, placa: 'JKL-7890', modelo: 'Betoneira', status: 'Disponível', km: 23450, manutencao: '05/01/2026' },
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Em Uso': return '🚗';
      case 'Disponível': return '✅';
      case 'Manutenção': return '🔧';
      default: return '📋';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Em Uso': return 'status-using';
      case 'Disponível': return 'status-available';
      case 'Manutenção': return 'status-maintenance';
      default: return '';
    }
  };

  return (
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

      <div className="veiculos-grid">
        {veiculos.map(veiculo => (
          <div key={veiculo.id} className="veiculo-card">
            <div className="veiculo-header">
              <div className="veiculo-icon">{getStatusIcon(veiculo.status)}</div>
              <div>
                <h3>{veiculo.placa}</h3>
                <p className="veiculo-modelo">{veiculo.modelo}</p>
              </div>
            </div>

            <div className={`veiculo-status ${getStatusClass(veiculo.status)}`}>
              {veiculo.status}
            </div>

            <div className="veiculo-details">
              <div className="detail-row">
                <span className="detail-label">Quilometragem:</span>
                <span className="detail-value">{veiculo.km.toLocaleString()} km</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Próxima Manutenção:</span>
                <span className="detail-value">{veiculo.manutencao}</span>
              </div>
            </div>

            <button className="btn-vehicle-action">Ver Histórico</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Frota;