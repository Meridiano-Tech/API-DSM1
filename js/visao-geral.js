
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
    console.error("Não foi possível carregar dados_site.json:", erro);
    return null;
  }
}

function formatarMoedaBilhoes(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return "--";
  const emBilhoes = num / 1e9;
  return `R$ ${emBilhoes.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  })} Bi`;
}

function formatarMoeda(valor) {
  return formatarMoedaBilhoes(valor);
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

  const valorElemento = card.querySelector(".cardvalor, .card-valor");
  const detalheElemento = card.querySelector(".carddetalhe, .card-subtexto");

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
          label: "Região Norte",
          data: linhas.map(item => Number(item.Norte)),
          borderColor: "#0a2540",
          backgroundColor: "rgba(10, 37, 64, 0.04)",
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 1.5,
          fill: true
        },
        {
          label: "Região Nordeste",
          data: linhas.map(item => Number(item.Nordeste)),
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.04)",
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 1.5,
          fill: true
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
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 12,
            font: { family: "'Archivo', 'Inter', system-ui, sans-serif", size: 12 }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 8
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: "#f1f5f9"
          }
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

  const ranking = [...linhas]
    .slice(0, 7)
    .sort((a, b) => Number(b.score_final) - Number(a.score_final));

  const canvas = criarCanvas(area);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ranking.map(item => item.localidade.split(" - ")[0]),
      datasets: [
        {
          label: "Score final",
          data: ranking.map(item => Number(item.score_final)),
          backgroundColor: ranking.map(item =>
            item.regiao === "Norte" ? "#0a2540" :
            item.regiao === "Nordeste" ? "#0284c7" : "#64748b"
          ),
          hoverBackgroundColor: "#0284c7",
          borderRadius: 8,
          barPercentage: 0.8,
          categoryPercentage: 0.9
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
          beginAtZero: true,
          grid: {
            color: "#f1f5f9"
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            font: { family: "'Archivo', 'Inter', system-ui, sans-serif", size: 12 }
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
  const principais = dados.principais || {};

  const textoCrescimento =
    cards.yoy_norte === cards.yoy_nordeste
      ? "↑ Crescimento anual consolidado"
      : cards.yoy_norte > cards.yoy_nordeste
      ? "↑ Maior crescimento: Região Norte"
      : "↑ Maior crescimento: Região Nordeste";

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
      ? formatarMoedaBilhoes(cards.vol_pix_geral)
      : "--",
    "↑ Liquidez monitorada"
  );

  preencherCard(
    "card-3",
    cards.inadimplencia_media !== undefined
      ? formatarPercentual(cards.inadimplencia_media)
      : "--",
    "Referência estável (BCB)"
  );

  const totalMunicipios = principais.grafico_p2_ranking_score_municipal?.length || 20;
  preencherCard(
    "card-4",
    `${totalMunicipios} Polos`,
    "★ Score inclusivo ativo"
  );

  // Gráficos principais
  const areaLinha = document.querySelector("#grafico-1 .graficoarea");
  const areaRanking = document.querySelector("#grafico-2 .graficoarea");

  if (areaLinha) {
    desenharLinha(
      areaLinha,
      principais.grafico_p1_serie_temporal_credito
    );
  }

  if (areaRanking) {
    desenharRanking(
      areaRanking,
      principais.grafico_p2_ranking_score_municipal
    );
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
