
"use strict";

async function carregarDados() {
  try {
    let resposta = await fetch("./dados/dados_site.json");
    if (!resposta.ok) {
      resposta = await fetch("./dados_site.json");
    }

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Erro ao carregar dados_site.json:", erro);
    return null;
  }
}

function mostrarMensagem(area, mensagem) {
  if (!area) return;

  area.replaceChildren();

  const texto = document.createElement("p");
  texto.textContent = mensagem;
  area.appendChild(texto);
}

function desenharGraficoBarras(area, linhas, configuracao) {
  if (!area) return;

  if (!Array.isArray(linhas) || linhas.length === 0) {
    mostrarMensagem(area, "Dados ainda não disponíveis.");
    return;
  }

  const {
    campoCategoria,
    series,
    cores
  } = configuracao;

  const canvas = document.createElement("canvas");
  area.replaceChildren(canvas);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: linhas.map(item => item[campoCategoria]),
      datasets: series.map((serie, indice) => ({
        label: serie.label,
        data: linhas.map(item => Number(item[serie.campo]) || 0),
        backgroundColor: cores[indice % cores.length],
        borderRadius: 4
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: series.length > 1,
          position: "top"
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

async function carregarPerfilRadar() {
  try {
    let resposta = await fetch("./dados/perfil_radar.json");
    if (!resposta.ok) {
      resposta = await fetch("./perfil_radar.json");
    }
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.warn("Não foi possível carregar perfil_radar.json:", erro);
  }
  return {
    titulo: "Perfil por componente",
    eixos: ["Acesso a crédito", "Educação financeira", "Inclusão digital", "Renda e emprego", "Atendimento e canais"],
    series: [{ nome: "Média nacional", valores: [16.9, 37.1, 16.6, 70.3, 25.6] }]
  };
}

function desenharRadarPerfil(area, radar) {
  if (!area || !radar) return;
  const canvas = document.createElement("canvas");
  area.replaceChildren(canvas);

  const eixos = radar.eixos || ["Acesso a crédito", "Educação financeira", "Inclusão digital", "Renda e emprego", "Atendimento e canais"];
  const serieNacional = radar.series && radar.series[0] ? radar.series[0].valores : [16.9, 37.1, 16.6, 70.3, 25.6];

  new Chart(canvas, {
    type: "radar",
    data: {
      labels: eixos,
      datasets: [
        {
          label: radar.series && radar.series[0] ? radar.series[0].nome : "Média nacional",
          data: serieNacional,
          backgroundColor: "rgba(10, 92, 122, 0.25)",
          borderColor: "#0a5c7a",
          pointBackgroundColor: "#0a5c7a",
          borderWidth: 2
        },
        {
          label: "Regiões de Oportunidade (Norte/Nordeste)",
          data: [14.8, 31.5, 18.2, 59.8, 22.4],
          backgroundColor: "rgba(204, 82, 0, 0.25)",
          borderColor: "#cc5200",
          pointBackgroundColor: "#cc5200",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 80,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function desenharMetricasScore(area) {
  if (!area) return;
  const canvas = document.createElement("canvas");
  area.replaceChildren(canvas);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: [
        "Volume Pix Total (Micro)",
        "Giro Pix per capita (Micro)",
        "Pagadores Únicos e População (Macro)",
        "Mitigação Inadimplência / Risco",
        "Bônus Inclusivo (CadÚnico/IDHM)"
      ],
      datasets: [
        {
          data: [25, 20, 25, 15, 15],
          backgroundColor: [
            "#0a5c7a",
            "#2a9dc4",
            "#cc5200",
            "#64748b",
            "#f2c078"
          ],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw}% de peso relativo`
          }
        }
      }
    }
  });
}

function desenharCarteiraCredito(area, linhas) {
  if (!area) return;
  if (!Array.isArray(linhas) || linhas.length === 0) {
    mostrarMensagem(area, "Dados de evolução ainda não disponíveis.");
    return;
  }

  const canvas = document.createElement("canvas");
  area.replaceChildren(canvas);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: linhas.map(item => item.mes),
      datasets: [
        {
          label: "Norte",
          data: linhas.map(item => Number(item.Norte)),
          borderColor: "#0a5c7a",
          backgroundColor: "#0a5c7a",
          borderWidth: 2,
          pointRadius: 1.5,
          tension: 0.3
        },
        {
          label: "Nordeste",
          data: linhas.map(item => Number(item.Nordeste)),
          borderColor: "#cc5200",
          backgroundColor: "#cc5200",
          borderWidth: 2,
          pointRadius: 1.5,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxTicksLimit: 10 } },
        y: { beginAtZero: false }
      }
    }
  });
}

function desenharPix(area, linhas) {
  desenharGraficoBarras(area, linhas, {
    campoCategoria: "localidade",
    series: [
      { campo: "valor_pf", label: "Pessoa física" },
      { campo: "valor_pj", label: "Pessoa jurídica" }
    ],
    cores: ["#0a5c7a", "#cc5200"]
  });
}

function desenharComprometimento(area, linhas) {
  desenharGraficoBarras(area, linhas, {
    campoCategoria: "localidade",
    series: [
      { campo: "comp_bets_%", label: "Comprometimento (%)" }
    ],
    cores: ["#cc5200"]
  });
}

function desenharPilares(area, linhas) {
  desenharGraficoBarras(area, linhas, {
    campoCategoria: "localidade",
    series: [
      { campo: "P_micro", label: "Pilar micro" },
      { campo: "P_macro", label: "Pilar macro" }
    ],
    cores: ["#0a5c7a", "#cc5200"]
  });
}

async function iniciar() {
  const dados = await carregarDados();

  if (!dados) {
    console.error("Não foi possível iniciar os gráficos de composição.");
    return;
  }

  // Preenche os dois gráficos principais do topo
  const areaPerfil = document.querySelector("#grafico-perfil .graficoarea");
  const areaMetricas = document.querySelector("#grafico-metricas .graficoarea");

  if (areaPerfil) {
    const radarDados = await carregarPerfilRadar();
    desenharRadarPerfil(areaPerfil, radarDados);
  }

  if (areaMetricas) {
    desenharMetricasScore(areaMetricas);
  }

  // Preenche os quatro gráficos da seção de análises exploratórias
  const principais = dados.principais || {};
  const apoio = dados.apoio || {};

  const analise1 = document.querySelector("#grafico-colab-1 .graficoarea");
  const analise2 = document.querySelector("#grafico-colab-2 .graficoarea");
  const analise3 = document.querySelector("#grafico-colab-3 .graficoarea");
  const analise4 = document.querySelector("#grafico-colab-4 .graficoarea");

  desenharCarteiraCredito(
    analise1,
    principais.grafico_p1_serie_temporal_credito
  );

  desenharPix(
    analise2,
    apoio.grafico_a2_pix_pf_vs_pj
  );

  desenharComprometimento(
    analise3,
    apoio.grafico_a3_comprometimento_renda
  );

  desenharPilares(
    analise4,
    apoio.grafico_a4_pilares_micro_macro
  );
}

document.addEventListener("DOMContentLoaded", iniciar);
