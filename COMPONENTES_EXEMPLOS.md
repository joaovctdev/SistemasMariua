# 📚 GUIA DE USO - Componentes de Visualização

> Exemplos práticos de uso dos componentes criados para o Dashboard

---

## 🎯 Componentes Disponíveis

- **KPICard** - Cards de métricas com comparação mensal
- **LineChart** - Gráficos de linha temporal com zoom
- **BarChart** - Gráficos de barras (horizontal/vertical)
- **DonutChart** - Gráficos donut/pizza
- **GaugeChart** - Medidores de meta (circular/linear)

---

## 📊 KPICard

### Exemplo Básico
```jsx
import { KPICard } from './components';

<KPICard
  title="Total de Postes"
  value={1245}
  variation={12.5}
  icon="📍"
  color="#00989E"
  format="number"
/>
```

### Com Meta
```jsx
<KPICard
  title="Postes Mensal"
  value={52}
  variation={8.3}
  icon="📍"
  color="#00989E"
  format="number"
  meta={{ weekly: 15, monthly: 50 }}
/>
```

### Formato Moeda
```jsx
<KPICard
  title="Faturamento Total"
  value={1250000}
  variation={9.2}
  icon="💰"
  color="#00989E"
  format="currency"
/>
```

### Loading State
```jsx
<KPICard loading={true} />
```

### Props Completas
```typescript
{
  title: string          // Título do KPI
  value: number          // Valor principal
  variation: number      // Variação % (positivo/negativo)
  icon: string          // Emoji ou ícone
  color: string         // Cor hex (#00989E)
  format: 'number' | 'currency' | 'percentage'
  meta: {               // Opcional
    weekly: number      // Meta semanal
    monthly: number     // Meta mensal
  }
  loading: boolean      // Estado de carregamento
}
```

---

## 📈 LineChart

### Exemplo Básico
```jsx
import { LineChart } from './components';

const data = [
  { x: 'Jan', y: 42 },
  { x: 'Fev', y: 48 },
  { x: 'Mar', y: 55 },
  { x: 'Abr', y: 52 },
  { x: 'Mai', y: 60 },
];

<LineChart
  data={data}
  title="Postes por Mês"
  label="Postes"
  color="#00989E"
  height={350}
/>
```

### Com Linha de Meta
```jsx
<LineChart
  data={data}
  title="Evolução Mensal de Postes"
  label="Postes Instalados"
  color="#00989E"
  fill={true}
  metaLine={50}
  enableZoom={true}
  showDataLabels={false}
  height={400}
/>
```

### Múltiplas Linhas (preparação de dados)
```jsx
// Processar dados para mostrar previsto vs realizado
const dataPrevisto = [
  { x: 'Jan', y: 50 },
  { x: 'Fev', y: 50 },
  { x: 'Mar', y: 50 },
];

const dataRealizado = [
  { x: 'Jan', y: 42 },
  { x: 'Fev', y: 48 },
  { x: 'Mar', y: 55 },
];

// Nota: Para múltiplas linhas, renderizar 2 componentes ou extender o componente
```

### Props Completas
```typescript
{
  data: Array<{x: string, y: number}>  // Dados
  title: string                        // Título
  label: string                        // Label da série
  color: string                        // Cor da linha
  fill: boolean                        // Preencher área
  metaLine: number                     // Linha de meta
  enableZoom: boolean                  // Habilitar zoom
  showDataLabels: boolean              // Mostrar valores
  height: number                       // Altura em px
  loading: boolean                     // Carregamento
}
```

---

## 📊 BarChart

### Barras Verticais
```jsx
import { BarChart } from './components';

const data = [
  { label: 'ETEMILSON', value: 187 },
  { label: 'RENATO', value: 165 },
  { label: 'DJALMA', value: 152 },
  { label: 'HIAGO', value: 143 },
];

<BarChart
  data={data}
  title="Postes por Supervisor"
  orientation="vertical"
  height={350}
/>
```

### Barras Horizontais
```jsx
const dataEquipes = [
  { label: 'DOUGLAS-JAC', value: 187, color: '#00989E' },
  { label: 'ESMERALDO-IRC', value: 165, color: '#4FB8BC' },
  { label: 'ALEX-IRC', value: 152, color: '#00989E' },
];

<BarChart
  data={dataEquipes}
  title="Postes por Equipe"
  orientation="horizontal"
  showDataLabels={true}
  height={400}
/>
```

### Barras Empilhadas (Múltiplas Séries)
```jsx
const datasets = [
  {
    label: 'Energizadas',
    data: [45, 52, 38, 60],
    backgroundColor: '#00989E',
  },
  {
    label: 'Não Energizadas',
    data: [15, 18, 12, 20],
    backgroundColor: '#F78E3D',
  }
];

const labels = [
  { label: 'Jan' },
  { label: 'Fev' },
  { label: 'Mar' },
  { label: 'Abr' },
];

<BarChart
  data={labels}
  datasets={datasets}
  title="Obras Energizadas vs Não Energizadas"
  orientation="vertical"
  stacked={true}
  height={350}
/>
```

### Barras Agrupadas
```jsx
const datasetsAgrupados = [
  {
    label: 'JOSE-IRC',
    data: [45, 52, 48, 55],
    backgroundColor: '#00989E',
  },
  {
    label: 'VALMIR-JAC',
    data: [38, 42, 40, 45],
    backgroundColor: '#4FB8BC',
  }
];

<BarChart
  data={labels}
  datasets={datasetsAgrupados}
  title="Podas por Equipe e Período"
  orientation="vertical"
  stacked={false}
  height={350}
/>
```

### Props Completas
```typescript
{
  data: Array<{label: string, value: number, color?: string}>
  title: string
  orientation: 'vertical' | 'horizontal'
  colors: Array<string>              // Cores customizadas
  stacked: boolean                   // Empilhar barras
  showDataLabels: boolean            // Mostrar valores
  height: number
  xAxisLabel: string                 // Label eixo X
  yAxisLabel: string                 // Label eixo Y
  loading: boolean
  datasets: Array<{                  // Para múltiplas séries
    label: string
    data: Array<number>
    backgroundColor: string
  }>
}
```

---

## 🍩 DonutChart

### Donut Básico
```jsx
import { DonutChart } from './components';

const data = [
  { label: 'Energizadas', value: 91, color: '#00989E' },
  { label: 'Não Energizadas', value: 36, color: '#F78E3D' },
];

<DonutChart
  data={data}
  title="Status de Energização"
  type="donut"
  showPercentage={true}
  height={350}
/>
```

### Donut com Label Central
```jsx
<DonutChart
  data={data}
  title="Obras Energizadas"
  type="donut"
  showCenterLabel={true}
  centerLabel="72%"
  height={350}
/>
```

### Gráfico Pizza (Pie)
```jsx
<DonutChart
  data={data}
  title="Distribuição de Obras"
  type="pie"
  showPercentage={true}
  height={350}
/>
```

### Props Completas
```typescript
{
  data: Array<{label: string, value: number, color?: string}>
  title: string
  type: 'donut' | 'pie'
  colors: Array<string>              // Cores customizadas
  showPercentage: boolean            // Mostrar % ao invés de valores
  showCenterLabel: boolean           // Label no centro (donut)
  centerLabel: string                // Texto do centro
  height: number
  loading: boolean
}
```

---

## 🎯 GaugeChart

### Gauge Circular
```jsx
import { GaugeChart } from './components';

<GaugeChart
  title="Meta Semanal de Postes"
  value={18}
  target={15}
  label="Semanal"
  format="number"
  showProgress={false}
  height={350}
/>
```

### Barra de Progresso Linear
```jsx
<GaugeChart
  title="Meta Mensal de Cavas"
  value={48}
  target={50}
  label="Mensal"
  format="number"
  showProgress={true}
  height={250}
/>
```

### Com Percentual
```jsx
<GaugeChart
  title="Progresso do Projeto"
  value={72.5}
  target={100}
  label="Conclusão"
  format="percentage"
  showProgress={false}
  height={350}
/>
```

### Props Completas
```typescript
{
  title: string
  value: number                      // Valor atual
  target: number                     // Meta/objetivo
  label: string                      // Label do valor
  format: 'number' | 'percentage'
  showProgress: boolean              // Barra linear vs circular
  height: number
  loading: boolean
}
```

---

## 🛠️ Utilitários (chartUtils.js)

### Formatar Valores
```jsx
import { formatValue } from './utils/chartUtils';

formatValue(1250000, 'currency');  // "R$ 1.250.000"
formatValue(1245, 'number');       // "1.245"
formatValue(72.5, 'percentage');   // "72.5%"
formatValue(1250000, 'compact');   // "1,25 mi"
```

### Calcular Variação
```jsx
import { calculateVariation } from './utils/chartUtils';

const variation = calculateVariation(52, 48); // 8.33%
```

### Agrupar Dados
```jsx
import { groupBy } from './utils/chartUtils';

const rawData = [
  { equipe: 'DOUGLAS-JAC', postes: 10 },
  { equipe: 'DOUGLAS-JAC', postes: 15 },
  { equipe: 'ALEX-IRC', postes: 12 },
];

const grouped = groupBy(rawData, 'equipe', 'postes');
// Resultado:
// [
//   { label: 'DOUGLAS-JAC', value: 25, items: [...] },
//   { label: 'ALEX-IRC', value: 12, items: [...] }
// ]
```

### Processar Dados MainBD
```jsx
import { processMainBDData } from './utils/chartUtils';

const kpis = processMainBDData(mainBDData);
// Retorna:
// {
//   postes: 1245,
//   cavas: 856,
//   clientes: 342,
//   obrasEnergizadas: 127,
//   totalObras: 150,
//   faturamento: 1250000,
//   mediaPostesPorEquipe: 87.5,
//   mediaCavasPorEquipe: 61.1,
//   totalEquipes: 14
// }
```

### Gerar Gradiente de Cores
```jsx
import { generateColorGradient } from './utils/chartUtils';

const gradient = generateColorGradient('#00989E', '#4FB8BC', 5);
// ['#00989E', '#20a0a8', '#40a8b2', '#60b0bc', '#4FB8BC']
```

### Usar Cores do Projeto
```jsx
import { COLORS, CHART_COLORS } from './utils/chartUtils';

const primaryColor = COLORS.primary;        // '#00989E'
const chartPalette = CHART_COLORS;          // Array de 8 cores
```

---

## 🎨 Exemplo Completo: Seção de Postes

```jsx
import React, { useState, useEffect } from 'react';
import { KPICard, LineChart, BarChart, GaugeChart } from './components';
import { processMainBDData, groupPostesByEquipe, groupPostesBySupervisor } from './utils/chartUtils';

function PostesSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar dados da API
    fetch('http://localhost:5000/api/mainbd')
      .then(res => res.json())
      .then(mainBDData => {
        // Processar dados
        const kpis = processMainBDData(mainBDData);
        const postesPorEquipe = groupPostesByEquipe(mainBDData);
        const postesPorSupervisor = groupPostesBySupervisor(mainBDData);

        setData({
          kpis,
          postesPorEquipe,
          postesPorSupervisor,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <KPICard loading={true} />
        <BarChart loading={true} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <h2>📍 Análise de Postes</h2>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <KPICard
          title="Total de Postes"
          value={data.kpis.postes}
          variation={12.5}
          icon="📍"
          color="#00989E"
          format="number"
        />

        <KPICard
          title="Média por Equipe"
          value={data.kpis.mediaPostesPorEquipe}
          variation={5.2}
          icon="📊"
          color="#4FB8BC"
          format="number"
        />

        <GaugeChart
          title="Meta Mensal"
          value={data.kpis.postes}
          target={50}
          label="Postes"
          format="number"
          showProgress={true}
          height={200}
        />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <BarChart
          data={data.postesPorEquipe}
          title="Postes por Equipe"
          orientation="horizontal"
          height={400}
        />

        <BarChart
          data={data.postesPorSupervisor}
          title="Postes por Supervisor"
          orientation="vertical"
          height={400}
        />
      </div>
    </div>
  );
}

export default PostesSection;
```

---

## 📱 Responsividade

### Grid Responsivo Recomendado
```jsx
const styles = {
  // Mobile (<768px)
  gridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },

  // Tablet (768px-1024px)
  gridTablet: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '25px',
  },

  // Desktop (>1024px)
  gridDesktop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '30px',
  },
};

// Usar com media queries ou biblioteca como react-responsive
```

---

## 🎯 Boas Práticas

### 1. Sempre usar loading state
```jsx
<KPICard loading={isLoading} />
```

### 2. Tratar erros
```jsx
{error && <div>Erro ao carregar dados</div>}
{!error && !loading && <BarChart data={data} />}
```

### 3. Memoizar dados processados
```jsx
const processedData = useMemo(() => {
  return processMainBDData(rawData);
}, [rawData]);
```

### 4. Usar cores consistentes
```jsx
import { COLORS } from './utils/chartUtils';

<KPICard color={COLORS.primary} />
<BarChart colors={[COLORS.primary, COLORS.primaryLight]} />
```

### 5. Altura adequada para gráficos
- KPI Cards: auto (baseado em conteúdo)
- Gráficos pequenos: 250-300px
- Gráficos médios: 350-400px
- Gráficos grandes: 450-500px

---

**Documento criado em:** 14/11/2025
**Versão:** 1.0
**Referência:** FASE 3 - Componentes de Visualização
