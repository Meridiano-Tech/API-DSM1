
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

function desenharEvolucaoInadimplencia(area, linhas) {
  // Este conjunto está vazio no JSON atual.
  // Quando receber dados, configure aqui os campos reais.
  if (!Array.isArray(linhas) || linhas.length === 0) {
    mostrarMensagem(
      area,
      "Dados de inadimplência ainda não disponíveis."
    );
    return;
  }

  // Identifica automaticamente a coluna de categoria
  // e as colunas numéricas quando os dados estiverem disponíveis.
  const campoCategoria = [
    "mes",
    "localidade",
    "municipio",
    "regiao"
  ].find(campo => campo in linhas[0]);

  const camposNumericos = Object.keys(linhas[0]).filter(campo =>
    campo !== campoCategoria &&
    linhas.some(item =>
      item[campo] !== null &&
      item[campo] !== "" &&
      Number.isFinite(Number(item[campo]))
    )
  );

  if (!campoCategoria || camposNumericos.length === 0) {
    mostrarMensagem(area, "Verifique a estrutura dos dados de inadimplência.");
    return;
  }

  desenharGraficoBarras(area, linhas, {
    campoCategoria,
    series: camposNumericos.map(campo => ({
      campo,
      label: campo
    })),
    cores: ["#0a5c7a", "#cc5200", "#64748b"]
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
    console.error("Não foi possível iniciar os gráficos de apoio.");
    return;
  }

  const apoio = dados.apoio || {};

  const analise1 = document.querySelector(
    "#grafico-colab-1 .graficoarea"
  );

  const analise2 = document.querySelector(
    "#grafico-colab-2 .graficoarea"
  );

  const analise3 = document.querySelector(
    "#grafico-colab-3 .graficoarea"
  );

  const analise4 = document.querySelector(
    "#grafico-colab-4 .graficoarea"
  );

  // Preenche somente os quatro gráficos de apoio.
  // Os dois gráficos principais não são alterados por este script.
  desenharEvolucaoInadimplencia(
    analise1,
    apoio.grafico_a1_evolucao_inadimplencia
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
