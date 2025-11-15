
# 📋 LISTA DE TAREFAS - CRIAÇÃO DE PÁGINAS DASHBOARD

## 🔍 FASE 1: ANÁLISE E PREPARAÇÃO

- [ ] Ler e entender todo o código do repositório existente
- [ ] Mapear estrutura atual das pastas (frontend/backend)
- [ ] Identificar endpoints da API disponíveis
- [ ] Analisar estrutura do XLSX "MainBD" (colunas, tipos de dados)
- [ ] Documentar funcionalidades já implementadas no backend
- [ ] Verificar bibliotecas já instaladas no frontend
- [ ] Mapear componentes React existentes que podem ser reutilizados
- [ ] Identificar estado global (Context, Redux) se houver
- [ ] Verificar sistema de rotas atual
- [ ] NÃO ALTERAR A PAGINAS OBRAS.JS
- [ ] ORGANIZAR TODOS AS ROUTES PARA FUNCIONAR NORMALMENTE
- [ ] QUERO QUE ENTENDA O BANCO DE DADOS PRINCIPAL "MainBD.xlsx" a pagina BD, CADA LINHA DESSE BANCO DE DADOS É UM SERVIÇO REALIZADO POR DIA E POR EQUIPE, ENTÃO VAI TER REPETIDOS, A ESTRUTURA É ESSA.

---

## 🎨 FASE 2: DESIGN E PLANEJAMENTO

- [ ] Definir estrutura de seções do novo dashboard ()
- [ ] Listar todos os gráficos necessários (Postes por Equipe, Supervisor, Base, Dia, Mês)
- [ ] Definir KPIs principais a serem exibidos
- [ ] Planejar layout responsivo (grid system)
- [ ] Definir paleta de cores e tema visual =
#00989E, #FFFFFF, #F78E3D, #4FB8BC, #F15137, #000000, #00989E
- [ ] Criar wireframe básico do dashboard

---
## 2.1 Estrutura de Seções (Ordem Final)

- SEÇÃO 1: KPIs Principais - Cards de métricas gerais no topo
- SEÇÃO 2: POSTES - Conjunto completo de gráficos de postes
- SEÇÃO 3: CAVAS - Conjunto completo de gráficos de cavas
- SEÇÃO 4: FISCAIS E OBRAS - Fiscalização e quantidade de obras
- SEÇÃO 5: CLIENTES - Dados de clientes ligados
- SEÇÃO 6: PODA - Quantidade de podas realizadas
- SEÇÃO 7: EQUIPE LINHA VIVA - Dados da equipe linha viva- - SEÇÃO 8: CARRETAS - Informações sobre carretas

# 2.2 Gráficos Detalhados por Seção- SEÇÃO 2: POSTES (5 gráficos)

- QUERO OS KPIS DA QUANTIDADE DE POSTES TOTAL, QUANTIDADE DE CAVAS, QUANTIDADE DE CLIENTES, QUANTIDADE DE OBRAS ENERGIZADAS, FATURAMENTO TOTAL (valor_projeto + valor_mao), quantidade de cavas por retro (WESLEI-IRC, MENEZES-IRC, VAGNO-IRC, OSIMAR-JAC, TIAGO-JAC E JOAO-JAC), MEDIA DE POSTES POR EQUIPE, MEDIA DE CAVAS POR EQUIPE, TODAS AS KPIS CALCULANDO A PORCENTAGEM DE DIFERENÇA CONFORME MES PASSADO, USANDO A COLUNA data_serv
- KPIs

- Extraia da planilha MainBD.xlsx da pagina BD, some a coluna qtd_atividades levando em consideração se a coluna des_atividade for POSTE AT OU POSTE BT, as para as datas leve em consideração a coluna data_serv, e as metas é 15 postes por semana e 50 postes por Mês
- Gráfico: Postes por Equipe (Barra Horizontal)
- Gráfico: Postes por Supervisor (Barra Vertical)
- Gráfico: Postes por Mês (Linha Temporal)
- Gráfico: Postes por Localidade (Barra/Mapa)
- Gráfico: Postes vs Meta (Gauge/Progress)
- SEÇÃO 3: CAVAS (4 gráficos)

- Extraia da planilha MainBD.xlsx da pagina BD, some a coluna qtd_atividades levando em consideração se a coluna des_atividade houver CAVA, ESCAVAÇÃO, e desconsidere se ouver ESCAVAÇÃO PARA ESTAI, as metas são 15 cavas por semana e 50 cavas por mes, sendo qualquer tipo de cava
- Gráfico: Cavas por Equipe (Barra Horizontal) {NESSE GRAFICO HAVERA FILTROS DE CAIXA DE SELÇÃO PARA MODELO DE CAVA NORMAL, CAVA EM ROCHA E CAVA COM ROMPEDOR}
- Gráfico: Cavas por Retro (Barra Vertical)
- Gráfico: Cavas por Mês (Linha Temporal)
- Gráfico: Cavas vs Meta (Gauge/Progress)
- SEÇÃO 4: FISCAIS E OBRAS (4 gráficos)

- Extraia da planilha MainBD.xlsx da pagina BD, conte a quantidade de obras da coluna SS/OT, e leve em consideração em quantas obras os fiscais ar estão da coluna ar_coelba. conte a quantidade de obras mas perceba que há duplicadas na SS/OT, CONTE, quantidade de obras energizadas leve em consideração a coluna data_energ se a obra estiver energizada.
- Gráfico: Quantidade de Obras por Fiscais COELBA (Barra)
- Gráfico: Quantidade Total de Obras (KPI Card grande)
- Gráfico: Quantidade de Obras Energizadas (Pizza/Donut)
- Gráfico: Obras Energizadas vs Não Energizadas (Comparativo)

- Extraia da planilha MainBD.xlsx da pagina BD, a coluna clientes_prev e clientes, E LEVE EM CONSIDERAÇÃO QUANTOS CLIENTES AS EQUIPES LIGARAM AS EQUIPES JENILSON-JAC E WASHINGTON-IRC
- SEÇÃO 5: CLIENTES (1-2 gráficos)

- Gráfico: Quantidade de Clientes Ligados (KPI + Linha Temporal)
- Gráfico: Clientes Ligados por Período (opcional)
- Extraia da planilha MainBD.xlsx da pagina BD, a coluna qtd_atividades levando em consideração quantas podas as equipes JOSE-IRC E VALMIR-JAC fizeram
- SEÇÃO 6: PODA (1-2 gráficos)

- Gráfico: Quantidade de Podas (KPI + Barra por Período)
- Gráfico: Podas por Equipe (opcional)

- AINDA NÃO FAZER A LINHA VIVA E AS CARRETAS
- SEÇÃO 7: EQUIPE LINHA VIVA (definir métricas)

 Definir KPIs específicos da Equipe Linha Viva
 Definir gráficos necessários (aguardar dados do XLSX)
- SEÇÃO 8: CARRETAS (definir métricas)

 Definir KPIs específicos de Carretas
 Definir gráficos necessários (aguardar dados do XLSX)
## 📊 FASE 3: COMPONENTES DE VISUALIZAÇÃO

- [ ] Instalar/verificar biblioteca de gráficos (Recharts, Chart.js)
- [ ] Criar componente `KPICard.jsx`
- [ ] Criar componente `LineChart.jsx` (wrapper customizado)
- [ ] Criar componente `BarChart.jsx` (wrapper customizado)
- [ ] Criar componente `PieChart.jsx` (wrapper customizado)
- [ ] Criar componente `DonutChart.jsx` (wrapper customizado)
- [ ] Adicionar tooltips customizados em cada gráfico
- [ ] Implementar animações de entrada nos gráficos
- [ ] Tornar todos os gráficos responsivos

---

## 🔧 FASE 4: ESTRUTURA DO DASHBOARD.JS

- [ ] Criar estrutura base do Dashboard.js (imports, estado)
- [ ] Implementar chamada à API para buscar dados do XLSX
- [ ] Criar estado para armazenar dados carregados
- [ ] Implementar loading state (skeleton/spinner)
- [ ] Criar tratamento de erros (try/catch)
- [ ] Adicionar seção de KPIs principais no topo
- [ ] Criar seção "Postes por Equipe"
- [ ] Criar seção "Postes por Supervisor"
- [ ] Criar seção "Postes por Base"
- [ ] Criar seção "Postes por Dia" (gráfico temporal)
- [ ] Criar seção "Postes por Mês" (gráfico temporal)
- [ ] Implementar grid responsivo para organizar seções

---

## 🔍 FASE 5: SISTEMA DE FILTROS

- [ ] Criar componente `FilterPanel.jsx`
- [ ] Implementar filtro de período (DateRangePicker)
- [ ] Implementar filtro por Equipe (MultiSelect)
- [ ] Implementar filtro por Supervisor (MultiSelect)
- [ ] Implementar filtro por Base (MultiSelect)
- [ ] Criar Context para filtros globais
- [ ] Conectar filtros com todas as seções do dashboard
- [ ] Adicionar botão "Limpar Filtros"
- [ ] Implementar debouncing nos filtros (300ms)
- [ ] Mostrar indicador visual de filtros ativos
- [ ] Adicionar loading durante aplicação de filtros

---

## 🔄 FASE 6: ATUALIZAÇÃO DE DADOS

- [ ] Criar botão "Atualizar Dados" no header
- [ ] Implementar chamada ao endpoint de reload do XLSX
- [ ] Adicionar modal de confirmação de atualização
- [ ] Mostrar progress bar durante atualização
- [ ] Implementar notificação de sucesso/erro
- [ ] Atualizar automaticamente todos os gráficos após reload
- [ ] Adicionar badge de "última atualização" visível
- [ ] (Opcional) Implementar auto-refresh configurável

---

## 📥 FASE 7: EXPORTAÇÃO VISUAL (PNG)

- [ ] Criar botão "Exportar" em cada seção do dashboard
- [ ] Implementar modal de configuração de export
- [ ] Adicionar opção de selecionar seções para exportar
- [ ] Criar preview dos gráficos que serão exportados
- [ ] Adicionar configuração de layout (Grade/Sequencial)
- [ ] Implementar opção de adicionar cabeçalho personalizado
- [ ] Implementar opção de adicionar rodapé (data, logo)
- [ ] Conectar com endpoint backend de export visual
- [ ] Mostrar progress bar durante geração do PNG
- [ ] Implementar download automático do PNG consolidado
- [ ] Adicionar notificação de sucesso no download

---

## 📤 FASE 8: EXPORTAÇÃO DE DADOS

- [ ] Criar opção "Exportar Dados" no menu
- [ ] Implementar modal de seleção de formato (CSV, XLSX, PDF)
- [ ] Permitir exportar dados filtrados ou completos
- [ ] Conectar com endpoint backend de export de dados
- [ ] Implementar download do arquivo gerado
- [ ] Adicionar notificação de sucesso

---

## 🎭 FASE 9: INTERATIVIDADE DOS GRÁFICOS

- [ ] Implementar hover tooltips em todos os gráficos
- [ ] Adicionar click para drill-down (modal com detalhes)
- [ ] Implementar zoom em gráficos temporais
- [ ] Adicionar controles de zoom (reset, +, -)
- [ ] Criar modal de detalhes ao clicar em um ponto
- [ ] Mostrar dados brutos em tabela no modal

---

## 🎨 FASE 10: ESTILO E ANIMAÇÕES

- [ ] Aplicar Tailwind CSS em todo o Dashboard.js
- [ ] Adicionar Framer Motion para animações de página
- [ ] Implementar animação de fade-in nas seções
- [ ] Adicionar hover effects em cards e botões
- [ ] Criar transições suaves entre estados
- [ ] Implementar loading skeletons para gráficos
- [ ] Adicionar contadores animados nos KPIs
- [ ] Garantir responsividade (mobile, tablet, desktop)

---

## 🧪 FASE 11: TESTES E VALIDAÇÕES

- [ ] Testar carregamento de dados da API
- [ ] Testar todos os filtros individualmente
- [ ] Testar combinação de múltiplos filtros
- [ ] Testar atualização de dados do XLSX
- [ ] Testar exportação visual (PNG)
- [ ] Testar exportação de dados (CSV, XLSX, PDF)
- [ ] Testar drill-down e modais
- [ ] Testar zoom em gráficos
- [ ] Testar responsividade em diferentes dispositivos
- [ ] Testar performance com dados reais (volume completo)
- [ ] Testar tratamento de erros (API offline, XLSX inválido)
- [ ] Validar acessibilidade básica (contraste, navegação)

---

## 📝 FASE 12: DOCUMENTAÇÃO

- [ ] Adicionar comentários JSDoc no Dashboard.js
- [ ] Documentar props de cada componente criado
- [ ] Criar README específico para a página de dashboards
- [ ] Documentar estrutura de dados esperada da API
- [ ] Adicionar exemplos de uso dos componentes

---

## 🚀 FASE 13: OTIMIZAÇÃO E DEPLOY

- [ ] Otimizar re-renderizações (React.memo, useMemo)
- [ ] Implementar lazy loading de seções pesadas
- [ ] Verificar bundle size do Dashboard.js
- [ ] Testar performance com Lighthouse
- [ ] Fazer code review do código refatorado
- [ ] Fazer merge na branch develop
- [ ] Testar em ambiente de staging
- [ ] Deploy em produção

---

