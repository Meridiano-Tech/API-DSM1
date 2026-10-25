"use strict";

let dadosGlobais = null;
let instanciaGraficoLinha = null;
let instanciaGraficoRanking = null;

const METRICAS_POR_ANO = {
  "2026": {
    yoy: "6,24%",
    yoySub: "↑ Maior crescimento: Região Norte",
    pix: "R$ 26,1 Bi",
    pixSub: "↑ Liquidez acumulada (2026)",
    inadimplencia: "5,50%",
    inadimplenciaSub: "Referência estável (BCB)",
    polos: "20 Polos",
    polosSub: "★ Score inclusivo ativo",
    tagGrafico: "Evolução 2026"
  },
  "2025": {
    yoy: "7,82%",
    yoySub: "↑ Crescimento consolidado 2025",
    pix: "R$ 21,4 Bi",
    pixSub: "↑ Liquidez anual 2025",
    inadimplencia: "5,80%",
    inadimplenciaSub: "Média anual ponderada",
    polos: "20 Polos",
    polosSub: "★ Monitoramento consolidado",
    tagGrafico: "Evolução 2025"
  },
  "2024": {
    yoy: "8,45%",
    yoySub: "↑ Aceleração inicial pós-pandemia",
    pix: "R$ 16,8 Bi",
    pixSub: "↑ Liquidez anual 2024",
    inadimplencia: "6,10%",
    inadimplenciaSub: "Fase de expansão de crédito",
    polos: "20 Polos",
    polosSub: "★ Implantação do score",
    tagGrafico: "Evolução 2024"
  },
  "todos": {
    yoy: "6,24%",
    yoySub: "↑ Maior crescimento: Região Norte",
    pix: "R$ 64,3 Bi",
    pixSub: "↑ Liquidez total acumulada",
    inadimplencia: "5,50%",
    inadimplenciaSub: "Referência estável (BCB)",
    polos: "20 Polos",
    polosSub: "★ 20 Polos monitorados",
    tagGrafico: "Histórico Completo (2024 - 2026)"
  }
};

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

function formatarRotuloMes(mesStr) {
  if (typeof mesStr === "string" && mesStr.includes("-")) {
    const [ano, mes] = mesStr.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const idx = parseInt(mes, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${meses[idx]}/${ano.slice(2)}`;
    }
  }
  return mesStr;
}

function preencherCard(id, valor, detalhe) {
  const card = document.getElementById(id);
  if (!card || valor === undefined || valor === null) return;

  const valorElemento = card.querySelector(".cardvalor, .card-valor");
  const detalheElemento = card.querySelector(".carddetalhe, .card-subtexto");

  if (valorElemento) {
    valorElemento.textContent = valor;
    valorElemento.classList.remove("valor-atualizado");
    void valorElemento.offsetWidth;
    valorElemento.classList.add("valor-atualizado");
  }

  if (detalheElemento && detalhe) {
    detalheElemento.textContent = detalhe;
  }
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

  if (instanciaGraficoLinha) {
    instanciaGraficoLinha.destroy();
    instanciaGraficoLinha = null;
  }

  const canvas = criarCanvas(area);

  instanciaGraficoLinha = new Chart(canvas, {
    type: "line",
    data: {
      labels: linhas.map(item => formatarRotuloMes(item.mes)),
      datasets: [
        {
          label: "Região Norte",
          data: linhas.map(item => Number(item.Norte)),
          borderColor: "#0a2540",
          backgroundColor: "rgba(10, 37, 64, 0.04)",
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          fill: true
        },
        {
          label: "Região Nordeste",
          data: linhas.map(item => Number(item.Nordeste)),
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.04)",
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 2.5,
          pointHoverRadius: 5,
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
        },
        tooltip: {
          callbacks: {
            label: contexto => {
              const valor = Number(contexto.raw);
              return `${contexto.dataset.label}: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 12
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: "#f1f5f9"
          },
          ticks: {
            callback: valor => `R$ ${(valor / 1000).toFixed(0)}k Mi`
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

  if (instanciaGraficoRanking) {
    instanciaGraficoRanking.destroy();
    instanciaGraficoRanking = null;
  }

  const ranking = [...linhas]
    .slice(0, 5)
    .sort((a, b) => Number(b.score_final) - Number(a.score_final));

  const canvas = criarCanvas(area);

  instanciaGraficoRanking = new Chart(canvas, {
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

function filtrarLinhasPorAno(linhas, ano) {
  if (!Array.isArray(linhas)) return [];
  if (!ano || ano === "todos") return linhas;
  return linhas.filter(item => typeof item.mes === "string" && item.mes.startsWith(ano));
}

function aplicarFiltroAno(ano) {
  const metricas = METRICAS_POR_ANO[ano] || METRICAS_POR_ANO["2026"];

  preencherCard("card-1", metricas.yoy, metricas.yoySub);
  preencherCard("card-2", metricas.pix, metricas.pixSub);
  preencherCard("card-3", metricas.inadimplencia, metricas.inadimplenciaSub);
  preencherCard("card-4", metricas.polos, metricas.polosSub);

  const tagLinha = document.getElementById("tag-grafico-linha");
  if (tagLinha && metricas.tagGrafico) {
    tagLinha.textContent = metricas.tagGrafico;
  }

  const areaLinha = document.querySelector("#grafico-1 .graficoarea");
  if (areaLinha && dadosGlobais?.principais?.grafico_p1_serie_temporal_credito) {
    const dadosFiltrados = filtrarLinhasPorAno(
      dadosGlobais.principais.grafico_p1_serie_temporal_credito,
      ano
    );
    desenharLinha(areaLinha, dadosFiltrados);
  }
}

async function iniciar() {
  dadosGlobais = await carregarDados();

  if (!dadosGlobais) {
    document.querySelectorAll(".graficoarea").forEach(area => {
      mostrarMensagem(area, "Não foi possível carregar os dados.");
    });
    return;
  }

  // Sincroniza dados dinâmicos do ano atual se existirem no JSON
  if (dadosGlobais.cards) {
    const c = dadosGlobais.cards;
    if (c.yoy_norte !== undefined) {
      METRICAS_POR_ANO["2026"].yoy = formatarPercentual(Math.max(c.yoy_norte || 0, c.yoy_nordeste || 0), true);
      METRICAS_POR_ANO["2026"].yoySub =
        c.yoy_norte === c.yoy_nordeste
          ? "↑ Crescimento anual consolidado"
          : c.yoy_norte > c.yoy_nordeste
          ? "↑ Maior crescimento: Região Norte"
          : "↑ Maior crescimento: Região Nordeste";
    }
    if (c.vol_pix_geral !== undefined) {
      METRICAS_POR_ANO["2026"].pix = formatarMoedaBilhoes(c.vol_pix_geral);
    }
    if (c.inadimplencia_media !== undefined) {
      METRICAS_POR_ANO["2026"].inadimplencia = formatarPercentual(c.inadimplencia_media);
    }
    const totalMunicipios = dadosGlobais.principais?.grafico_p2_ranking_score_municipal?.length || 20;
    METRICAS_POR_ANO["2026"].polos = `${totalMunicipios} Polos`;
  }

  const filtroAno = document.getElementById("filtro-ano") || document.querySelector(".filtro-select");
  const anoInicial = filtroAno ? filtroAno.value : "2026";

  // Aplica ano inicial nos 4 cards e no gráfico de evolução
  aplicarFiltroAno(anoInicial);

  // Gráfico de ranking municipal
  const areaRanking = document.querySelector("#grafico-2 .graficoarea");
  if (areaRanking && dadosGlobais.principais?.grafico_p2_ranking_score_municipal) {
    desenharRanking(
      areaRanking,
      dadosGlobais.principais.grafico_p2_ranking_score_municipal
    );
  }

  // Event listener para mudança no select de ano
  if (filtroAno) {
    filtroAno.addEventListener("change", (e) => {
      aplicarFiltroAno(e.target.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
