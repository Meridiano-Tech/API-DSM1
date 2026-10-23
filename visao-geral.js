
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

function formatarMoedaBilhoes(valor) {
  const num = Number(valor);
  const emBilhoes = num / 1e9;
  return `R$ ${emBilhoes.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} Bi`;
}


function formatarPercentual(valor) {
  return `${Number(valor).toLocaleString("pt-BR", {
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
          borderRadius: 4,
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

  preencherCard(
    "card-1",
    cards.yoy_norte !== undefined
      ? formatarPercentual(cards.yoy_norte)
      : "--",
    "Crescimento anual da carteira de crédito na região Norte."
  );

  preencherCard(
    "card-2",
    cards.vol_pix_geral !== undefined
      ? formatarMoedaBilhoes(cards.vol_pix_geral)
      : "--",
    "Volume total de transações Pix considerado nos dados."
  );

  preencherCard(
    "card-3",
    cards.inadimplencia_media !== undefined
      ? formatarPercentual(cards.inadimplencia_media)
      : "--",
    "Taxa média de inadimplência informada no conjunto de dados."
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
