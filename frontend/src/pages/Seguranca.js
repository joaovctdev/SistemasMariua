// src/pages/Seguranca.js
import React, { useState } from 'react';

function Seguranca() {
  const [acessos] = useState([
    { id: 1, nome: 'João Silva', entrada: '08:15', saida: '17:30', data: '06/11/2025', local: 'Portaria Principal' },
    { id: 2, nome: 'Maria Santos', entrada: '07:45', saida: '16:20', data: '06/11/2025', local: 'Portaria Sul' },
    { id: 3, nome: 'Carlos Oliveira', entrada: '09:00', saida: '-', data: '06/11/2025', local: 'Portaria Principal' },
    { id: 4, nome: 'Ana Costa', entrada: '08:30', saida: '17:00', data: '06/11/2025', local: 'Portaria Norte' },
  ]);

  const [estatisticas] = useState({
    presentes: 45,
    ausentes: 12,
    visitantes: 8,
    alertas: 2
  });

  return (
    <div>
      <div className="page-header">
        <h1>🛡️ Controle de Segurança</h1>
        <p>Monitoramento de acessos e segurança</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-green">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{estatisticas.presentes}</h3>
            <p>Presentes</p>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <h3>{estatisticas.ausentes}</h3>
            <p>Ausentes</p>
          </div>
        </div>

        <div className="stat-card stat-blue">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{estatisticas.visitantes}</h3>
            <p>Visitantes</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">⚠</div>
          <div className="stat-content">
            <h3>{estatisticas.alertas}</h3>
            <p>Alertas</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <h2>Registros de Acesso Hoje</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Local</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {acessos.map(acesso => (
              <tr key={acesso.id}>
                <td><strong>{acesso.nome}</strong></td>
                <td>{acesso.entrada}</td>
                <td>{acesso.saida}</td>
                <td>{acesso.local}</td>
                <td>
                  <span className={`status-pill ${acesso.saida === '-' ? 'status-active' : 'status-complete'}`}>
                    {acesso.saida === '-' ? 'No Local' : 'Saiu'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Seguranca;