
"use strict";

async function carregarDados() {
  try {
    const resposta = await fetch("./dados_site.json");

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Não foi possível carregar dados_site.json:", erro);
    return null;
  }
}

function formatarMoeda(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "--";
  if (num >= 1_000_000_000) {
    return 'R$ ' + (num / 1_000_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + ' bi';
  }
  if (num >= 1_000_000) {
    return 'R$ ' + (num / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + ' mi';
  }
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  });
}

function formatarPercentual(valor, comSinal = false) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "--";
  const sinal = comSinal && num > 0 ? "+" : "";
  return `${sinal}${num.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  })}%`;
}

function preencherCard(id, valor, detalhe) {
  const card = document.getElementById(id);

  if (!card || valor === undefined || valor === null) return;

  const valorElemento = card.querySelector(".cardvalor");
  const detalheElemento = card.querySelector(".carddetalhe");

  if (valorElemento) valorElemento.textContent = valor;
  if (detalheElemento && detalhe) detalheElemento.textContent = detalhe;
}

function criarCanvas(area) {
  if (!area) return null;

  area.replaceChildren();

  const canvas = document.createElement("canvas");
  area.appendChild(canvas);

  return canvas;
}

function mostrarMensagem(area, mensagem) {
  if (!area) return;

  area.replaceChildren();

  const texto = document.createElement("p");
  texto.textContent = mensagem;
  area.appendChild(texto);
}

function desenharLinha(area, linhas) {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    mostrarMensagem(area, "Não há dados disponíveis para este gráfico.");
    return;
  }

  const canvas = criarCanvas(area);

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
          pointRadius: 2,
          tension: 0.3
        },
        {
          label: "Nordeste",
          data: linhas.map(item => Number(item.Nordeste)),
          borderColor: "#cc5200",
          backgroundColor: "#cc5200",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function desenharRanking(area, linhas) {
  if (!Array.isArray(linhas) || linhas.length === 0) {
    mostrarMensagem(area, "Não há dados disponíveis para este gráfico.");
    return;
  }

  const ranking = [...linhas].sort(
    (a, b) => Number(b.score_final) - Number(a.score_final)
  );

  const canvas = criarCanvas(area);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ranking.map(item => item.localidade),
      datasets: [
        {
          label: "Score final",
          data: ranking.map(item => Number(item.score_final)),
          backgroundColor: ranking.map(item =>
            item.regiao === "Norte" ? "#0a5c7a" :
            item.regiao === "Nordeste" ? "#cc5200" : "#64748b"
          ),
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: contexto =>
              `Score: ${Number(contexto.raw).toLocaleString("pt-BR", {
                maximumFractionDigits: 2
              })}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true
        },
        y: {
          ticks: {
            autoSkip: false
          }
        }
      }
    }
  });
}

async function iniciar() {
  const dados = await carregarDados();

  if (!dados) {
    document.querySelectorAll(".graficoarea").forEach(area => {
      mostrarMensagem(area, "Não foi possível carregar os dados.");
    });
    return;
  }

  // Indicadores em destaque
  const cards = dados.cards || {};

  const textoCrescimento =
    cards.yoy_norte === cards.yoy_nordeste
      ? "Crescimento anual da carteira (Norte e Nordeste empatadas)."
      : cards.yoy_norte > cards.yoy_nordeste
      ? "Maior crescimento anual: Região Norte."
      : "Maior crescimento anual: Região Nordeste.";

  preencherCard(
    "card-1",
    cards.yoy_norte !== undefined
      ? formatarPercentual(Math.max(cards.yoy_norte || 0, cards.yoy_nordeste || 0), true)
      : "--",
    textoCrescimento
  );

  preencherCard(
    "card-2",
    cards.vol_pix_geral !== undefined
      ? formatarMoeda(cards.vol_pix_geral)
      : "--",
    "Volume acumulado nas regiões monitoradas."
  );

  preencherCard(
    "card-3",
    cards.inadimplencia_media !== undefined
      ? formatarPercentual(cards.inadimplencia_media)
      : "--",
    "Taxa média da carteira de referência (BCB)."
  );

  // Gráficos principais
  const principais = dados.principais || {};

  const areaLinha = document.querySelector("#grafico-1 .graficoarea");
  const areaRanking = document.querySelector("#grafico-2 .graficoarea");

  desenharLinha(
    areaLinha,
    principais.grafico_p1_serie_temporal_credito
  );

  desenharRanking(
    areaRanking,
    principais.grafico_p2_ranking_score_municipal
  );
}

document.addEventListener("DOMContentLoaded", iniciar);
