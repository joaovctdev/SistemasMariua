// src/utils/chartUtils.js
// Utilitários para manipulação de dados de gráficos

/**
 * Formata valor conforme o tipo especificado
 * @param {number} value - Valor a ser formatado
 * @param {string} format - Tipo: 'number' | 'currency' | 'percentage' | 'compact'
 * @returns {string} Valor formatado
 */
export const formatValue = (value, format = "number") => {
  if (value === null || value === undefined) return "-";

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case "percentage":
      return `${value.toFixed(1)}%`;

    case "compact":
      return new Intl.NumberFormat("pt-BR", {
        notation: "compact",
        compactDisplay: "short",
      }).format(value);

    case "number":
    default:
      return new Intl.NumberFormat("pt-BR").format(value);
  }
};

/**
 * Calcula variação percentual entre dois valores
 * @param {number} current - Valor atual
 * @param {number} previous - Valor anterior
 * @returns {number} Variação percentual
 */
export const calculateVariation = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Agrupa dados por campo específico
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo para agrupar
 * @param {string} valueField - Campo do valor a somar
 * @returns {Array} Dados agrupados
 */
export const groupBy = (data, field, valueField) => {
  const grouped = data.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) {
      acc[key] = { label: key, value: 0, items: [] };
    }
    acc[key].value += item[valueField] || 0;
    acc[key].items.push(item);
    return acc;
  }, {});

  return Object.values(grouped);
};

/**
 * Filtra dados por período de datas
 * @param {Array} data - Array de objetos com campo de data
 * @param {string} dateField - Nome do campo de data
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {Array} Dados filtrados
 */
export const filterByDateRange = (data, dateField, startDate, endDate) => {
  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

/**
 * Calcula média de um array de valores
 * @param {Array} values - Array de números
 * @returns {number} Média
 */
export const calculateAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Ordena dados por valor (crescente ou decrescente)
 * @param {Array} data - Array de objetos com campo value
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Array} Dados ordenados
 */
export const sortByValue = (data, order = "desc") => {
  return [...data].sort((a, b) => {
    return order === "asc" ? a.value - b.value : b.value - a.value;
  });
};

/**
 * Gera paleta de cores gradiente entre duas cores
 * @param {string} startColor - Cor inicial (hex)
 * @param {string} endColor - Cor final (hex)
 * @param {number} steps - Número de cores na paleta
 * @returns {Array} Array de cores hex
 */
export const generateColorGradient = (startColor, endColor, steps) => {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  const gradient = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + ratio * (end.r - start.r));
    const g = Math.round(start.g + ratio * (end.g - start.g));
    const b = Math.round(start.b + ratio * (end.b - start.b));
    gradient.push(rgbToHex(r, g, b));
  }

  return gradient;
};

/**
 * Converte hex para RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Converte RGB para hex
 */
const rgbToHex = (r, g, b) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

/**
 * Processa dados do MainBD.xlsx para KPIs
 * @param {Array} data - Dados brutos do Excel
 * @returns {Object} KPIs calculados
 */
export const processMainBDData = (data) => {
  // Total de Postes (POSTE AT + POSTE BT) - coluna qtd_atividade
  const postes = data
    .filter((row) => {
      const atividade = row.des_atividade || "";
      return atividade === "POSTE AT" || atividade === "POSTE BT";
    })
    .reduce((sum, row) => {
      const qtd = parseFloat(row.qtd_atividade) || 0;
      return sum + qtd;
    }, 0);

  // Total de Cavas (CAVA ou ESCAVAÇÃO, exceto ESCAVAÇÃO PARA ESTAI)
  const cavas = data
    .filter((row) => {
      const desc = (row.des_atividade || "").toUpperCase();
      return (
        (desc.includes("CAVA") || desc.includes("ESCAVAÇÃO")) &&
        !desc.includes("ESCAVAÇÃO PARA ESTAI")
      );
    })
    .reduce((sum, row) => {
      const qtd = parseFloat(row.qtd_atividade) || 0;
      return sum + qtd;
    }, 0);

  // Clientes Ligados (coluna clientes, equipes JENILSON-JAC e WASHINGTON-IRC)
  const clientes = data
    .filter((row) => {
      const equipe = row.des_equipe || "";
      return equipe === "JENILSON-JAC" || equipe === "WASHINGTON-IRC";
    })
    .reduce((sum, row) => {
      // Usar coluna clientes_lig se disponível, senão clientes
      const qtd = parseFloat(row.clientes_lig || row.clientes) || 0;
      return sum + qtd;
    }, 0);

  // Obras Energizadas (SS/OT únicos com data_energ preenchida)
  const obrasEnergizadas = new Set(
    data
      .filter(
        (row) =>
          row.data_energ && row.data_energ !== null && row.data_energ !== ""
      )
      .map((row) => row["SS/OT"])
  ).size;

  // Total de Obras únicas (SS/OT)
  const totalObras = new Set(
    data.filter((row) => row["SS/OT"]).map((row) => row["SS/OT"])
  ).size;

  // Faturamento Total (valor_projeto + valor_mao)
  const faturamento = data.reduce((sum, row) => {
    const valorProjeto = parseFloat(row.valor_projeto) || 0;
    const valorMao = parseFloat(row.valor_mao) || 0;
    return sum + valorProjeto + valorMao;
  }, 0);

  // Cavas por Retro (equipes: WESLEI-IRC, MENEZES-IRC, VAGNO-IRC, OSIMAR-JAC, TIAGO-JAC, JOAO-JAC)
  const equipesRetro = [
    "WESLEI-IRC",
    "MENEZES-IRC",
    "VAGNO-IRC",
    "OSIMAR-JAC",
    "TIAGO-JAC",
    "JOAO-JAC",
  ];
  const cavasPorRetro = data
    .filter((row) => {
      const equipe = row.des_equipe || "";
      const atividade = (row.des_atividade || "").toUpperCase();
      return (
        equipesRetro.includes(equipe) &&
        (atividade.includes("CAVA") || atividade.includes("ESCAVAÇÃO")) &&
        !atividade.includes("ESCAVAÇÃO PARA ESTAI")
      );
    })
    .reduce((sum, row) => {
      const qtd = parseFloat(row.qtd_atividade) || 0;
      return sum + qtd;
    }, 0);

  // Equipes únicas
  const equipesUnicas = new Set(
    data.filter((row) => row.des_equipe).map((row) => row.des_equipe)
  );

  // Médias
  const mediaPostesPorEquipe =
    equipesUnicas.size > 0 ? postes / equipesUnicas.size : 0;
  const mediaCavasPorEquipe =
    equipesUnicas.size > 0 ? cavas / equipesUnicas.size : 0;

  return {
    postes,
    cavas,
    clientes,
    obrasEnergizadas,
    totalObras,
    faturamento,
    cavasPorRetro,
    mediaPostesPorEquipe,
    mediaCavasPorEquipe,
    totalEquipes: equipesUnicas.size,
  };
};

/**
 * Agrupa postes por equipe
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por equipe
 */
export const groupPostesByEquipe = (data) => {
  const postesData = data.filter((row) => {
    const atividade = row.des_atividade || "";
    return atividade === "POSTE AT" || atividade === "POSTE BT";
  });

  // Agrupar manualmente com parseFloat
  const grouped = postesData.reduce((acc, row) => {
    const equipe = row.des_equipe;
    if (!equipe) return acc;

    if (!acc[equipe]) {
      acc[equipe] = { label: equipe, value: 0, items: [] };
    }
    acc[equipe].value += parseFloat(row.qtd_atividade) || 0;
    acc[equipe].items.push(row);
    return acc;
  }, {});

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa postes por supervisor
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por supervisor
 */
export const groupPostesBySupervisor = (data) => {
  const postesData = data.filter((row) => {
    const atividade = row.des_atividade || "";
    return atividade === "POSTE AT" || atividade === "POSTE BT";
  });

  // Agrupar manualmente com parseFloat
  const grouped = postesData.reduce((acc, row) => {
    const supervisor = row.Supervisor;
    if (!supervisor) return acc;

    if (!acc[supervisor]) {
      acc[supervisor] = { label: supervisor, value: 0, items: [] };
    }
    acc[supervisor].value += parseFloat(row.qtd_atividade) || 0;
    acc[supervisor].items.push(row);
    return acc;
  }, {});

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa cavas por equipe
 * @param {Array} data - Dados do MainBD
 * @param {Object} filters - Filtros: { normal, rocha, rompedor }
 * @returns {Array} Dados agrupados por equipe
 */
export const groupCavasByEquipe = (data, filters = {}) => {
  let cavasData = data.filter((row) => {
    const desc = (row.des_atividade || "").toUpperCase();
    return (
      (desc.includes("CAVA") || desc.includes("ESCAVAÇÃO")) &&
      !desc.includes("ESCAVAÇÃO PARA ESTAI")
    );
  });

  // Aplicar filtros de tipo de cava
  if (filters.normal || filters.rocha || filters.rompedor) {
    cavasData = cavasData.filter((row) => {
      const desc = (row.des_atividade || "").toUpperCase();
      if (filters.normal && desc.includes("CAVA NORMAL")) return true;
      if (filters.rocha && desc.includes("ROCHA")) return true;
      if (filters.rompedor && desc.includes("ROMPEDOR")) return true;
      return false;
    });
  }

  // Agrupar manualmente com parseFloat
  const grouped = cavasData.reduce((acc, row) => {
    const equipe = row.des_equipe;
    if (!equipe) return acc;

    if (!acc[equipe]) {
      acc[equipe] = { label: equipe, value: 0, items: [] };
    }
    acc[equipe].value += parseFloat(row.qtd_atividade) || 0;
    acc[equipe].items.push(row);
    return acc;
  }, {});

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa postes por base (IRC vs JAC)
 * ETEMILSON e GILVANDO são Jacobina, resto é Irecê
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por base
 */
export const groupPostesByBase = (data) => {
  const postesData = data.filter((row) => {
    const atividade = row.des_atividade || "";
    return atividade === "POSTE AT" || atividade === "POSTE BT";
  });

  const supervisoresJacobina = ["ETEMILSON OLIVEIRA", "GILVANDO RIOS"];

  const grouped = postesData.reduce((acc, row) => {
    const supervisor = row.Supervisor || "";
    const base = supervisoresJacobina.includes(supervisor)
      ? "JACOBINA"
      : "IRECÊ";

    if (!acc[base]) {
      acc[base] = { label: base, value: 0, items: [] };
    }
    acc[base].value += parseFloat(row.qtd_atividade) || 0;
    acc[base].items.push(row);
    return acc;
  }, {});

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa clientes ligados por equipe
 * Considera apenas des_atividade = "LIGAÇÃO CLIENTE"
 * Filtra apenas equipes WASHINGTON-IRC e JENILSON-JAC
 * Soma qtd_atividade
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por equipe
 */
export const groupClientesByEquipe = (data) => {
  const equipesLigacao = ["WASHINGTON-IRC", "JENILSON-JAC"];

  const clientesData = data.filter((row) => {
    const atividade = (row.des_atividade || "").toUpperCase();
    const equipe = row.des_equipe || "";
    return (
      atividade === "LIGAÇÃO DE CLIENTE" && equipesLigacao.includes(equipe)
    );
  });

  const grouped = clientesData.reduce((acc, row) => {
    const equipe = row.des_equipe;
    if (!equipe) return acc;

    if (!acc[equipe]) {
      acc[equipe] = { label: equipe, value: 0, items: [] };
    }
    acc[equipe].value += parseFloat(row.qtd_atividade) || 0;
    acc[equipe].items.push(row);
    return acc;
  }, {});

  // Garantir que ambas equipes apareçam, mesmo com valor 0
  equipesLigacao.forEach((equipe) => {
    if (!grouped[equipe]) {
      grouped[equipe] = { label: equipe, value: 0, items: [] };
    }
  });

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa cavas por operador/equipe de retro
 * Equipes: JOAO-JAC, OSIMAR-JAC, VAGNO-IRC, TIAGO-JAC, WESLEY-IRC, MENEZES-IRC
 * Filtra des_atividade com CAVA ou ESCAVAÇÃO, exclui ESTAI/ESTAÍ
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por operador
 */
export const groupCavasByOperador = (data) => {
  const equipesRetro = [
    "JOAO-JAC",
    "OSIMAR-JAC",
    "VAGNO-IRC",
    "TIAGO-JAC",
    "WESLEY-IRC",
    "MENEZES-IRC",
  ];

  const cavasData = data.filter((row) => {
    const equipe = row.des_equipe || "";
    const atividade = (row.des_atividade || "").toUpperCase();

    return (
      equipesRetro.includes(equipe) &&
      (atividade.includes("CAVA") || atividade.includes("ESCAVAÇÃO")) &&
      !atividade.includes("ESTAI") &&
      !atividade.includes("ESTAÍ")
    );
  });

  const grouped = cavasData.reduce((acc, row) => {
    const equipe = row.des_equipe;
    if (!equipe) return acc;

    if (!acc[equipe]) {
      acc[equipe] = { label: equipe, value: 0, items: [] };
    }
    acc[equipe].value += parseFloat(row.qtd_atividade) || 0;
    acc[equipe].items.push(row);
    return acc;
  }, {});

  return sortByValue(Object.values(grouped), "desc");
};

/**
 * Agrupa obras por AR_COELBA
 * Conta SS/OT únicos por AR_COELBA
 * @param {Array} data - Dados do MainBD
 * @returns {Array} Dados agrupados por AR_COELBA
 */
export const groupObrasByAR = (data) => {
  // Criar um Set de obras únicas por AR
  const obrasPorAR = {};

  data.forEach((row) => {
    const ar = row.ar_coelba || "Sem AR";
    const ssot = row["SS/OT"];

    if (!ssot) return;

    if (!obrasPorAR[ar]) {
      obrasPorAR[ar] = new Set();
    }
    obrasPorAR[ar].add(ssot);
  });

  // Converter Set para contagem e criar array de resultados
  const result = Object.entries(obrasPorAR).map(([ar, obras]) => ({
    label: ar,
    value: obras.size,
    items: Array.from(obras),
  }));

  return sortByValue(result, "desc");
};

/**
 * Paleta de cores do projeto
 */
export const COLORS = {
  primary: "#00989E",
  primaryLight: "#4FB8BC",
  secondary: "#F78E3D",
  danger: "#F15137",
  success: "#00989E",
  warning: "#F78E3D",
  info: "#4FB8BC",
  white: "#FFFFFF",
  black: "#000000",
};

/**
 * Paleta de cores para gráficos múltiplos
 */
export const CHART_COLORS = [
  "#00989E", // Primary
  "#4FB8BC", // Primary Light
  "#F78E3D", // Secondary
  "#F15137", // Danger
  "#4CAF50", // Green
  "#764ba2", // Purple
  "#667eea", // Blue
  "#f093fb", // Pink
];
