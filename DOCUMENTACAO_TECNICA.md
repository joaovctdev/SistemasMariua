# Documentação Técnica - Sistema Mariua

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Backend - Flask API](#backend---flask-api)
4. [Frontend - React](#frontend---react)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Fluxo de Dados](#fluxo-de-dados)

---

## 🎯 Visão Geral

**Sistema de Gestão de Obras de Construção Civil - Mariua**

Sistema full-stack para gerenciamento e monitoramento de obras de infraestrutura elétrica, incluindo:
- Gestão de obras e equipes
- Dashboards analíticos com KPIs
- Acompanhamento de produção diária
- Visualização de cronogramas (Gantt)
- Controle de cavas por retroescavadeira

### Tecnologias Principais
- **Backend**: Flask 3.0.0 (Python)
- **Frontend**: React 18.2.0
- **Banco de Dados**: Arquivos Excel (.xlsx) via pandas/openpyxl
- **Visualizações**: Chart.js 4.5.1
- **Autenticação**: JWT

---

## 🏗️ Arquitetura do Sistema

```
SistemasMariua/
├── backend/
│   ├── app.py                 # API Flask principal
│   ├── requirements.txt       # Dependências Python
│   └── uploads/              # Armazenamento de dados
│       ├── PROGRAMACAO - NOVEMBRO.xlsx  # Programação de obras
│       ├── BD/
│       │   └── MainBD.xlsx             # Base de dados principal
│       └── ProgramacaoNovembro/        # Programações diárias
│
├── frontend/
│   ├── src/
│   │   ├── App.js           # Roteamento e autenticação
│   │   ├── pages/
│   │   │   ├── Obras.js         # Gantt chart de obras
│   │   │   ├── Dashboards.js    # Dashboards analíticos
│   │   │   └── ProducaoDia.js   # Produção diária
│   │   └── components/
│   │       └── Login.js
│   └── public/
│       ├── carousel/        # Imagens da empresa
│       └── Logos/          # Logos
│
└── DOCUMENTACAO_TECNICA.md
```

---

## 🔧 Backend - Flask API

### Arquivo Principal: `backend/app.py`

#### Configuração Inicial

```python
app = Flask(__name__)
CORS(app)  # Permite requisições do frontend React

app.config['SECRET_KEY'] = 'sua-chave-secreta-super-segura'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB máx
```

#### Principais Endpoints

### 1. **POST /api/login**
**Função:** Autenticação de usuário

**Credenciais de Produção:**
- Email: `admin@mariua.net`
- Senha: `MARIUA2025` (hash SHA-256)

**Retorna:** Token JWT com validade de 24 horas

**Fluxo:**
1. Recebe email e senha
2. Valida contra `users_db`
3. Gera token JWT
4. Frontend armazena em localStorage

---

### 2. **GET /api/dashboard/bd-programacao**
**Função:** Dados do banco de dados principal para dashboards

**Fonte:** `uploads/BD/BDProgramacao.xlsx`

**Estrutura do Excel (16 colunas):**
- Coluna D: Código do projeto (chave para relacionamento)
- Data, Encarregado, Supervisor
- Postes/Cavas Previstos vs Realizados
- Atividades (Locação, Implantação, Energização)

**Retorna:**
```json
{
  "success": true,
  "dados": [
    {
      "data": "2025-11-13",
      "encarregado": "JOAO-JAC",
      "supervisor": "GILVANDO",
      "projeto": "B-1234567",
      "postePrevisto": 10,
      "posteReal": 8,
      "cavaPrevista": 10,
      "cavaReal": 9
    }
  ]
}
```

**Usado em:** Todos os gráficos do Dashboard.js

---

### 3. **GET /api/dashboard/cavas-por-retro**
**Função:** Dados de escavações por retroescavadeira

**Query Parameters:**
- `mes` (opcional): 1-12, default 'todos'
- `semana` (opcional): 1-5, default 'todos'

**Fonte:** `uploads/BD/MainBD.xlsx` (página BD)

**Equipes Monitoradas:**
- JOAO-JAC, MENEZES-IRC, TIAGO-JAC
- VAGNO-IRC, WESLEY-IRC, OSIMAR-JAC

**Classificação de Cavas:**
- **Cava Normal:** Solo comum
- **Cava com Rompedor:** Requer rompedor hidráulico
- **Cava em Rocha:** Terreno rochoso

**Lógica de Filtragem:**
```python
# Filtro de mês: seleciona mês específico
if filtro_mes != 'todos':
    df = df[df['data_servico'].dt.month == mes_num]

# Filtro de semana: calcula intervalo de 7 dias
if filtro_semana != 'todos':
    inicio_semana = primeiro_dia_mes + timedelta(days=(semana - 1) * 7)
    fim_semana = inicio_semana + timedelta(days=6)
    df = df[(df['data_servico'] >= inicio) & (df['data_servico'] <= fim)]
```

**Retorna:**
```json
{
  "success": true,
  "dados": [
    {
      "equipe": "JOAO-JAC",
      "total_cavas": 41.0,
      "cavas_normal": 30.0,
      "cavas_rompedor": 8.0,
      "cavas_rocha": 3.0
    }
  ],
  "filtros_aplicados": {
    "mes": "11",
    "semana": "1"
  }
}
```

**Usado em:** Gráfico de Cavas por Retro no Dashboard

---

### 4. **GET /api/dashboard/utd-dados**
**Função:** Dados consolidados das UTDs (Unidades de Trabalho Descentralizadas)

**Fonte:** `uploads/BD/MainBD.xlsx` (páginas UTDIRECE e UTDJACOBINA)

**Estrutura do MainBD (21 colunas por UTD):**

| Coluna | Nome | Descrição | Uso |
|--------|------|-----------|-----|
| 0 | pep_obra | Código único do projeto | Identificação |
| 1 | titulo | Nome da obra | **Contagem de obras** |
| 2 | municipio | Cidade | Localização |
| 3 | localidade | Bairro/região | Detalhamento |
| 4 | status | Estado atual | **Filtro ENERGIZADA** |
| 5 | encarregado | Responsável equipe | Gestão |
| 6 | supervisor | Supervisor | Gestão/Filtros |
| 7 | ar_coelba | Agente Regional | **Gráfico AR** |
| 13 | clientes_prev | Nº clientes | **Soma para cards** |
| 18 | valor_projeto | Valor em R$ | **Soma para cards** |

**Função de Limpeza de Valores:**
```python
def limpar_valor_moeda(valor):
    # Converte "R$ 116.999,07" -> 116999.07
    # Remove "R$", espaços, pontos (milhares)
    # Substitui vírgula por ponto (decimal)
    valor_str = str(valor).replace('R$', '').replace(' ', '')
    valor_str = valor_str.replace('.', '').replace(',', '.')
    return float(valor_str)
```

**Processamento por Região:**
```python
def processar_regiao(df):
    # 1. Conta obras pelo campo 'titulo' (não vazio)
    total_obras = df['titulo'].notna().sum()

    # 2. Conta obras energizadas
    obras_energizadas = df[
        df['status'].str.upper().str.contains('ENERGIZADA', na=False)
    ].shape[0]

    # 3. Soma clientes (converte para numérico)
    clientes = pd.to_numeric(df['clientes_prev'], errors='coerce').sum()

    # 4. Soma valores (limpa formato brasileiro)
    df['valor_limpo'] = df['valor_projeto'].apply(limpar_valor_moeda)
    valor_total = df['valor_limpo'].sum()

    # 5. Conta obras por AR_COELBA
    obras_por_ar = df.groupby('ar_coelba').size().to_dict()
```

**Retorna:**
```json
{
  "success": true,
  "dados": {
    "irece": {
      "total_obras": 352,
      "obras_energizadas": 352,
      "clientes": 781,
      "valor_total": 30264697.63,
      "obras_por_ar": {
        "MANOEL MESSIAS - U359765": 45,
        "ALINE LIMA - U468383": 44
      }
    },
    "jacobina": {
      "total_obras": 227,
      "obras_energizadas": 227,
      "clientes": 357,
      "valor_total": 16710453.59,
      "obras_por_ar": {...}
    },
    "geral": {
      "total_obras": 579,
      "obras_energizadas": 579,
      "clientes": 1138,
      "valor_total": 46975151.22,
      "obras_por_ar": {...}
    }
  }
}
```

**Usado em:**
- Cards de Clientes e Valor Total
- Gráfico de Obras Energizadas
- Gráfico de Distribuição por AR_COELBA

---

### 5. **GET /api/producao-dia**
**Função:** Dados da produção diária com previsto vs realizado

**Query Parameter:**
- `data` (opcional): Formato DD-MM-YYYY

**Fontes:**
1. Programação: `uploads/ProgramacaoNovembro/DD-MM-YYYY.xlsx`
2. Realizado: `uploads/BD/BDProgramacao.xlsx`

**Lógica de Cálculo de Progresso:**

```python
def calcular_progresso(atividade, valores):
    if 'LOCAÇÃO' in atividade:
        # 100% se tem valor de locação
        return 100 if valores['locacao'] > 0 else 0

    elif 'LANÇAMENTO' in atividade:
        # 100% se justificativa contém "Lançamento"
        if 'LANÇAMENTO' in justificativa:
            return 100
        # Senão, baseado em postes (meta: 10)
        return min((valores['postes'] / 10) * 100, 100)

    elif 'ENERGIZAÇÃO' in atividade:
        # 100% se evento é ENERGIZADA
        return 100 if evento == 'ENERGIZADA' else 0

    elif 'IMPLANTAÇÃO' in atividade:
        # Baseado em cavas + postes (meta: 15)
        total = valores['cavas'] + valores['postes']
        return min((total / 15) * 100, 100)

    else:
        # Outras atividades: meta genérica de 10
        return min((total / 10) * 100, 100)
```

**Retorna:**
```json
{
  "success": true,
  "data": "13-11-2025",
  "producao": [
    {
      "projeto": "B-1234567",
      "titulo": "Obra Exemplo",
      "encarregado": "JOAO-JAC",
      "supervisor": "GILVANDO",
      "atividade_programada": "IMPLANTAÇÃO",
      "progresso": 75.5,
      "status": "EM ANDAMENTO",
      "observacoes": "Justificativa técnica..."
    }
  ]
}
```

---

## ⚛️ Frontend - React

### Arquivo Principal: `frontend/src/pages/Dashboards.js`

#### Estados do Componente

```javascript
const [dados, setDados] = useState([]);              // BD Programação
const [obrasData, setObrasData] = useState([]);      // Obras com postes
const [cavasPorRetroData, setCavasPorRetroData] = useState([]);  // Cavas retro
const [utdData, setUtdData] = useState({});          // Dados UTD
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

// Filtros globais
const [filtroMes, setFiltroMes] = useState('todos');
const [filtroSupervisor, setFiltroSupervisor] = useState('todos');
const [filtroRegiao, setFiltroRegiao] = useState('todos');

// Filtros específicos de gráficos
const [filtroMesGrafico, setFiltroMesGrafico] = useState('todos');
const [filtroSemanaGrafico, setFiltroSemanaGrafico] = useState('todos');

// Filtros do gráfico de cavas
const [filtroEquipeRetro, setFiltroEquipeRetro] = useState('todos');
const [filtroMesRetro, setFiltroMesRetro] = useState('todos');
const [filtroSemanaRetro, setFiltroSemanaRetro] = useState('todos');
```

#### Ciclo de Vida e Carregamento de Dados

```javascript
// Carregamento inicial
useEffect(() => {
  carregarDados();
}, []);

// Recarrega cavas quando filtros mudam
useEffect(() => {
  carregarDadosCavas();
}, [filtroMesRetro, filtroSemanaRetro]);

const carregarDados = async () => {
  // 1. Carregar BD Programação
  const response1 = await fetch(`${API_URL}/dashboard/bd-programacao`);

  // 2. Carregar Obras
  const response2 = await fetch(`${API_URL}/dashboard/obras-programacao`);

  // 3. Carregar Cavas (com filtros)
  await carregarDadosCavas();

  // 4. Carregar UTD
  const response4 = await fetch(`${API_URL}/dashboard/utd-dados`);
};

const carregarDadosCavas = async () => {
  // Construir URL com query parameters
  let url = `${API_URL}/dashboard/cavas-por-retro`;
  const params = new URLSearchParams();

  if (filtroMesRetro !== 'todos') {
    params.append('mes', filtroMesRetro);
  }

  if (filtroSemanaRetro !== 'todos') {
    params.append('semana', filtroSemanaRetro);
  }

  const response = await fetch(`${url}?${params}`);
};
```

#### Funções de Processamento de Dados

### 1. **Postes por Encarregado**

```javascript
const postesPorEncarregado = () => {
  const agrupado = {};

  // Filtra dados aplicando filtros globais
  dadosFiltrados.forEach(d => {
    // Exclui encarregados específicos
    if (d.encarregado !== 'JOSÉ ROBERTO' &&
        d.encarregado !== 'WASHINGTON') {

      if (!agrupado[d.encarregado]) {
        agrupado[d.encarregado] = { previsto: 0, real: 0 };
      }

      agrupado[d.encarregado].previsto += d.postePrevisto;
      agrupado[d.encarregado].real += d.posteReal;
    }
  });

  // Ordena por total realizado (decrescente)
  const sorted = Object.entries(agrupado).sort((a, b) =>
    b[1].real - a[1].real
  );

  return {
    labels: sorted.map(([nome]) => nome),
    datasets: [
      {
        label: 'Previsto',
        data: sorted.map(([, d]) => d.previsto),
        backgroundColor: '#667eea'
      },
      {
        label: 'Realizado',
        data: sorted.map(([, d]) => d.real),
        backgroundColor: '#0B9E9F'
      }
    ]
  };
};
```

### 2. **Evolução Mensal (Linha)**

```javascript
const postesPorMes = () => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const agrupadoPostes = Array(12).fill(0);
  const agrupadoCavas = Array(12).fill(0);

  dadosFiltrados.forEach(d => {
    const mes = getMesDaData(d.data);  // Extrai mês (0-11)

    if (mes !== null) {
      agrupadoPostes[mes] += d.posteReal;
      agrupadoCavas[mes] += d.cavaReal;
    }
  });

  return {
    labels: meses,
    datasets: [
      {
        label: 'Postes Implantados',
        data: agrupadoPostes,
        borderColor: '#0B9E9F',
        tension: 0.4  // Curvatura da linha
      },
      {
        label: 'Cavas Realizadas',
        data: agrupadoCavas,
        borderColor: '#F5793D',
        tension: 0.4
      }
    ]
  };
};
```

### 3. **Postes por Equipe com Metas**

```javascript
const postesPorEquipe = () => {
  // Calcula média semanal ou mensal baseado no filtro
  const mediaSemanal = 50;   // Meta: 50 postes/semana
  const mediaMensal = 200;   // Meta: 200 postes/mês

  const metaAtual = filtroSemanaGrafico !== 'todos'
    ? mediaSemanal
    : mediaMensal;

  // Agrupa por encarregado
  const agrupado = {};
  dadosFiltrados.forEach(d => {
    if (!agrupado[d.encarregado]) {
      agrupado[d.encarregado] = 0;
    }
    agrupado[d.encarregado] += d.posteReal;
  });

  const sorted = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);

  return {
    labels: sorted.map(([nome]) => nome),
    datasets: [
      {
        type: 'bar',
        label: 'Postes Realizados',
        data: sorted.map(([, total]) => total),
        backgroundColor: '#0B9E9F'
      },
      {
        type: 'line',
        label: filtroSemanaGrafico !== 'todos'
          ? 'Meta Semanal (50)'
          : 'Meta Mensal (200)',
        data: sorted.map(() => metaAtual),
        borderColor: '#FFD700',
        borderDash: [10, 5],  // Linha tracejada
        pointRadius: 6
      }
    ]
  };
};
```

### 4. **Cavas por Retro (Empilhado)**

```javascript
const cavasPorRetro = () => {
  // Filtra por equipe se selecionado
  let dadosFiltradosRetro = cavasPorRetroData;

  if (filtroEquipeRetro !== 'todos') {
    dadosFiltradosRetro = cavasPorRetroData.filter(
      d => d.equipe === filtroEquipeRetro
    );
  }

  const equipes = dadosFiltradosRetro.map(d => d.equipe);
  const cavasNormal = dadosFiltradosRetro.map(d => d.cavas_normal);
  const cavasRompedor = dadosFiltradosRetro.map(d => d.cavas_rompedor);
  const cavasRocha = dadosFiltradosRetro.map(d => d.cavas_rocha);

  // Meta dinâmica baseada no filtro de semana
  const metaSemanal = 15;
  const metaMensal = 50;

  const metaAtual = filtroSemanaRetro !== 'todos'
    ? metaSemanal
    : metaMensal;

  return {
    labels: equipes,
    datasets: [
      {
        type: 'bar',
        label: 'Cava Normal',
        data: cavasNormal,
        backgroundColor: '#0B9E9F',
        stack: 'Stack 0'  // Empilhamento
      },
      {
        type: 'bar',
        label: 'Cava com Rompedor',
        data: cavasRompedor,
        backgroundColor: '#F5793D',
        stack: 'Stack 0'
      },
      {
        type: 'bar',
        label: 'Cava em Rocha',
        data: cavasRocha,
        backgroundColor: '#FF0202',
        stack: 'Stack 0'
      },
      {
        type: 'line',
        label: filtroSemanaRetro !== 'todos'
          ? 'Meta Semanal (15 cavas)'
          : 'Meta Mensal (50 cavas)',
        data: equipes.map(() => metaAtual),
        borderColor: '#FFD700',
        borderDash: [10, 5]
      }
    ]
  };
};
```

### 5. **Obras Energizadas**

```javascript
const obrasEnergizadas = () => {
  const dadosRegiao = filtroRegiao === 'IRECÊ'
    ? utdData.irece
    : filtroRegiao === 'JACOBINA'
    ? utdData.jacobina
    : utdData.geral;

  const labels = [];
  const valores = [];

  if (filtroRegiao === 'todos') {
    labels.push('Irecê', 'Jacobina');
    valores.push(
      utdData.irece?.obras_energizadas || 0,
      utdData.jacobina?.obras_energizadas || 0
    );
  } else {
    labels.push(filtroRegiao);
    valores.push(dadosRegiao?.obras_energizadas || 0);
  }

  return {
    labels,
    datasets: [{
      label: 'Obras Energizadas',
      data: valores,
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)']
    }]
  };
};
```

### 6. **Obras por AR_COELBA (Pizza)**

```javascript
const obrasPorArCoelba = () => {
  const dadosRegiao = filtroRegiao === 'IRECÊ'
    ? utdData.irece
    : filtroRegiao === 'JACOBINA'
    ? utdData.jacobina
    : utdData.geral;

  const arDict = dadosRegiao?.obras_por_ar || {};
  const labels = Object.keys(arDict);
  const valores = Object.values(arDict);

  // 10 cores diferentes para ARs
  const cores = [
    'rgba(102, 126, 234, 0.8)',
    'rgba(118, 75, 162, 0.8)',
    'rgba(245, 121, 61, 0.8)',
    // ... mais 7 cores
  ];

  return {
    labels,
    datasets: [{
      label: 'Obras por AR',
      data: valores,
      backgroundColor: cores.slice(0, labels.length)
    }]
  };
};
```

#### Funções Auxiliares

```javascript
// Extrai mês de uma data (retorna 0-11)
const getMesDaData = (dataStr) => {
  if (!dataStr || dataStr === 'nan') return null;
  const data = new Date(dataStr);
  return !isNaN(data.getTime()) ? data.getMonth() : null;
};

// Determina região baseado no supervisor
const getRegiao = (supervisor) => {
  if (!supervisor) return '';
  const sup = supervisor.toUpperCase().trim();

  // Jacobina: GILVANDO e ETEMILSON
  if (sup.includes('GILVANDO') || sup.includes('ETEMILSON')) {
    return 'JACOBINA';
  }

  // Demais: Irecê
  return 'IRECÊ';
};

// Calcula semanas de um mês
const getSemanasDoMes = (mes) => {
  const ano = new Date().getFullYear();
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);

  const diasNoMes = ultimoDia.getDate();
  const numSemanas = Math.ceil(diasNoMes / 7);

  const semanas = [];
  for (let i = 1; i <= numSemanas; i++) {
    const inicio = (i - 1) * 7 + 1;
    const fim = Math.min(i * 7, diasNoMes);

    semanas.push({
      numero: i,
      label: `Semana ${i} (${inicio}-${fim})`
    });
  }

  return semanas;
};
```

---

## 📊 Estrutura de Dados

### MainBD.xlsx

#### Página: BD (37 colunas)
Histórico de serviços realizados

| Coluna | Nome | Descrição |
|--------|------|-----------|
| 0 | cod_serv | Código do serviço |
| 1 | data_servico | Data de execução (**filtro temporal**) |
| 4 | des_equipe | Nome da equipe (**JOAO-JAC, etc**) |
| 6 | Supervisor | Nome do supervisor |
| 29 | cod_atividade | Código da atividade |
| 31 | des_atividade | Descrição (**RETRO, CAVA, etc**) |
| 34 | qtd_atividade | Quantidade executada |

#### Página: UTDIRECE e UTDJACOBINA (21 colunas cada)
Cadastro de obras por região

| Coluna | Nome | Tipo | Uso |
|--------|------|------|-----|
| 1 | titulo | String | **Contagem de obras** |
| 4 | status | String | **Filtro ENERGIZADA** |
| 7 | ar_coelba | String | **Agrupamento AR** |
| 13 | clientes_prev | Float | **Soma clientes** |
| 18 | valor_projeto | Mixed | **Soma valores** (limpa formato BR) |

### PROGRAMACAO - NOVEMBRO.xlsx (26 colunas)

| Coluna | Nome | Descrição |
|--------|------|-----------|
| 0 | ENCARREGADO | Responsável pela equipe |
| 1 | SUPERVISOR | Supervisor da obra |
| 2 | PROJETO | Código do projeto (ex: B-1234567) |
| 3 | TÍTULO | Nome da obra |
| 4 | MUNICÍPIO | Cidade |
| 7 | POSTE PREV | Postes previstos |
| 8 | INICIO | Data de início |
| 9 | TERMINO | Data de término |

### BDProgramacao.xlsx (16 colunas)

| Coluna | Nome | Uso |
|--------|------|-----|
| 0 | Data | Data do serviço |
| 1 | Encarregado | Nome da equipe |
| 2 | Supervisor | Supervisor |
| 3 | Projeto | Código (chave) |
| 4 | Título | Nome da obra |
| 5-12 | Previsto/Realizado | Postes, Cavas, etc |

---

## 🔄 Fluxo de Dados

### 1. Dashboard - Carregamento Inicial

```
Usuário acessa /dashboards
         ↓
React.useEffect() dispara
         ↓
carregarDados() executa 4 requisições paralelas:
├── GET /api/dashboard/bd-programacao
├── GET /api/dashboard/obras-programacao
├── GET /api/dashboard/cavas-por-retro
└── GET /api/dashboard/utd-dados
         ↓
Backend lê arquivos Excel:
├── BDProgramacao.xlsx (pandas)
├── PROGRAMACAO - NOVEMBRO.xlsx (pandas)
└── MainBD.xlsx (pandas, 3 páginas)
         ↓
Backend processa e agrega dados
         ↓
Retorna JSON para frontend
         ↓
React atualiza estados:
├── setDados(bd)
├── setObrasData(obras)
├── setCavasPorRetroData(cavas)
└── setUtdData(utd)
         ↓
Componentes re-renderizam
         ↓
Chart.js desenha gráficos
```

### 2. Filtro de Cavas - Interação

```
Usuário seleciona Mês/Semana
         ↓
onChange dispara setFiltroMesRetro/setFiltroSemanaRetro
         ↓
useEffect detecta mudança nos filtros
         ↓
carregarDadosCavas() executa
         ↓
Constrói URL com query params:
  /api/dashboard/cavas-por-retro?mes=11&semana=1
         ↓
Backend aplica filtros:
├── Converte data_servico para datetime
├── Filtra por mês (se selecionado)
├── Calcula intervalo de semana
└── Filtra por semana (se selecionado)
         ↓
Retorna dados filtrados
         ↓
setCavasPorRetroData atualiza
         ↓
Gráfico re-renderiza com novos dados
```

### 3. Cálculo de Progresso - Produção Diária

```
GET /api/producao-dia?data=13-11-2025
         ↓
Backend lê 2 fontes:
├── ProgramacaoNovembro/13-11-2025.xlsx (programado)
└── BDProgramacao.xlsx (realizado)
         ↓
Cruza dados por código de projeto
         ↓
Para cada obra, calcula progresso:
├── Identifica tipo de atividade
├── Aplica lógica específica:
│   ├── LOCAÇÃO: 100% se locacao > 0
│   ├── LANÇAMENTO: 100% se justificativa OK
│   ├── ENERGIZAÇÃO: 100% se evento ENERGIZADA
│   └── IMPLANTAÇÃO: (cavas + postes) / 15 * 100
└── Determina status (Concluído/Em Andamento)
         ↓
Retorna lista de obras com progressos
         ↓
Frontend renderiza tabela com:
├── Barra de progresso colorida
├── Badge de status
└── Observações detalhadas
```

---

## 🎨 Paleta de Cores

### Cores Principais
- **Verde Água**: `#0B9E9F` - Cor primária (barras, linhas)
- **Laranja**: `#F5793D` - Cor secundária
- **Roxo**: `#667eea` - Acento
- **Dourado**: `#FFD700` - Metas/linhas de referência

### Gradientes
```css
/* Cards de estatísticas */
background: linear-gradient(135deg, #F5793D 0%, #f7661e 100%);

/* Cabeçalhos de gráficos */
background: linear-gradient(90deg, #0B9E9F 0%, #F5793D 100%);

/* Cards de gráficos */
background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
```

---

## 📱 Responsividade

### Breakpoints
- **Desktop**: > 1400px - 2 colunas de gráficos
- **Tablet**: 768px - 1400px - 1 coluna de gráficos
- **Mobile**: < 768px - Layout vertical completo

### Ajustes Responsivos
```css
@media (max-width: 768px) {
  .charts-grid { grid-template-columns: 1fr; }
  .stats-cards { grid-template-columns: 1fr; }
  .dashboard-filters { flex-direction: column; }
}
```

---

## 🔐 Segurança

### Autenticação
- **Método**: JWT (JSON Web Tokens)
- **Validade**: 24 horas
- **Storage**: localStorage (chave: 'token')
- **Verificação**: Middleware em rotas protegidas

### Validação de Arquivos
- **Tamanho máximo**: 16 MB
- **Extensões permitidas**: .xlsx, .xls
- **Validação**: Função `allowed_file()`

---

## 🚀 Deploy e Execução

### Desenvolvimento

#### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Servidor em http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
npm start
# Aplicação em http://localhost:3000
```

### Produção

1. **Atualizar API_URL** em 4 arquivos:
   - `frontend/src/pages/Dashboards.js`
   - `frontend/src/pages/Obras.js`
   - `frontend/src/pages/ProducaoDia.js`
   - `frontend/src/components/Login.js`

2. **Build do Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Configurar CORS** no backend para domínio de produção

4. **Variáveis de Ambiente**:
   - `SECRET_KEY`: Chave JWT (não usar valor padrão)
   - `UPLOAD_FOLDER`: Caminho dos arquivos Excel

---

## 📋 Manutenção

### Backup de Dados
```bash
# Backup diário dos arquivos Excel
cp -r backend/uploads backend/uploads_backup_$(date +%Y%m%d)
```

### Logs
- Backend: Print statements no console
- Erros: Try-catch com traceback

### Monitoramento
- Verificar tamanho dos arquivos Excel (limite 16MB)
- Monitorar tempo de resposta das APIs
- Validar integridade dos dados Excel

---

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro: "unsupported operand type(s) for +: 'float' and 'str'"**
- **Causa**: Coluna `valor_projeto` com valores mistos
- **Solução**: Função `limpar_valor_moeda()` já implementada

**2. Gráficos não carregam**
- **Causa**: API offline ou CORS bloqueado
- **Solução**: Verificar backend rodando e CORS configurado

**3. Filtros não funcionam**
- **Causa**: useEffect não detectando mudanças
- **Solução**: Verificar dependências do useEffect

**4. Token expirado**
- **Causa**: JWT com + de 24h
- **Solução**: Fazer novo login

---

## 📚 Referências

- **Flask**: https://flask.palletsprojects.com/
- **React**: https://react.dev/
- **Chart.js**: https://www.chartjs.org/
- **pandas**: https://pandas.pydata.org/
- **JWT**: https://jwt.io/

---

**Documentação gerada em:** 2025-11-13
**Versão do Sistema:** 1.0
**Última atualização:** Novembro 2025
