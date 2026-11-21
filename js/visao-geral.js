"use strict";

let dadosGlobais = null;
let instanciaGraficoLinha = null;
let instanciaGraficoRanking = null;
let timerDebounceBusca;

function formatarPercentual(valor, comSinal = false) {
  const num = valor;
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
          data: linhas.map(item => item.Norte ?? null),
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
          data: linhas.map(item => item.Nordeste ?? null),
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
            label: contexto => `${contexto.dataset.label}: ${formatarCarteira(contexto.raw)}`
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
            callback: formatarCarteira
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

  const ranking = linhas.filter(item => Number.isFinite(item.score_final))
    .sort((a, b) => b.score_final - a.score_final)
    .slice(0, 5);
  if (!ranking.length) {
    mostrarMensagem(area, "Scores indisponíveis para este recorte.");
    return;
  }

  const canvas = criarCanvas(area);

  instanciaGraficoRanking = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ranking.map(item => item.localidade.split(" - ")[0]),
      datasets: [
        {
          label: "Score inclusivo",
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
              `Score inclusivo: ${numeroCredit42.format(contexto.raw)} pontos`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 1000,
          ticks: { callback: valor => numeroCredit42.format(valor) },
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
  const credito = dadosGlobais.principais.grafico_p1_serie_temporal_credito;
  const linhas = filtrarLinhasPorAno(credito, ano);
  const meses = new Set(linhas.map(item => item.mes));
  const pix = dadosGlobais.pix_brasil.filter(item => meses.has(item.competencia));
  const pixTotal = pix.length === meses.size && pix.length && pix.every(item => Number.isFinite(item.vol_pix_total))
    ? pix.reduce((total, item) => total + item.vol_pix_total, 0) : null;
  const inad = dadosGlobais.apoio.grafico_a1_evolucao_inadimplencia
    .filter(item => meses.has(item.mes) && Number.isFinite(item.valor_inad)).at(-1);
  const porMes = new Map(credito.map(item => [item.mes, item]));
  const crescimento = [...linhas].reverse().flatMap(item => {
    const anterior = porMes.get(`${Number(item.mes.slice(0, 4)) - 1}${item.mes.slice(4)}`);
    return ["Norte", "Nordeste"].filter(regiao =>
      Number.isFinite(item[regiao]) && anterior?.[regiao] > 0
    ).map(regiao => ({
      regiao, mes: item.mes, valor: 100 * (item[regiao] / anterior[regiao] - 1),
    }));
  });
  const ultimo = crescimento[0]?.mes;
  const maior = crescimento.filter(item => item.mes === ultimo)
    .sort((a, b) => b.valor - a.valor)[0];

  preencherCard("card-1", formatarPercentual(maior?.valor, true),
    maior ? `${maior.regiao} · ${maior.mes}` : "Sem comparação anual no recorte");
  preencherCard("card-2", formatarMoedaCredit42(pixTotal), "Total nacional no período selecionado");
  preencherCard("card-3", formatarPercentual(inad?.valor_inad),
    inad ? `Brasil · ${inad.mes}` : "Taxa nacional indisponível no recorte");


  document.getElementById("tag-grafico-linha").textContent = ano === "todos" ? "Histórico completo" : ano;
  desenharLinha(document.querySelector("#grafico-1 .graficoarea"), linhas);
}

function municipiosFiltrados() {
  const regiao = document.getElementById("filtro-regiao-macro").value;
  const porte = document.getElementById("filtro-porte").value;
  const busca = document.getElementById("filtro-busca-muni").value.trim().toLocaleLowerCase("pt-BR");
  const catalogo = new Map(dadosGlobais.catalogo_municipios.map(m => [m.municipio_ibge, m]));
  const taxas = new Map(dadosGlobais.ranking_inadimplencia_municipal.map(m => [m.municipio_ibge, m]));
  return dadosGlobais.principais.grafico_p2_ranking_score_municipal
    .map(item => {
      const populacao = catalogo.get(item.municipio_ibge)?.pop_total;
      const porteMunicipal = populacao == null ? null :
        populacao < 150000 ? "pequeno" : populacao <= 350000 ? "medio" : "grande";
      const taxa = taxas.get(item.municipio_ibge);
      return {
        ...item, populacao, porte: porteMunicipal,
        inadimplencia_estimada: taxa?.taxa_inadimplencia,
        competencia_inadimplencia: taxa?.competencia_inadimplencia,
      };
    })
    .filter(item =>
      (regiao === "todas" || item.regiao === regiao) &&
      (porte === "todos" || item.porte === porte) &&
      item.localidade.toLocaleLowerCase("pt-BR").includes(busca)
    );
}

function aplicarFiltrosMunicipais() {
  const municipios = municipiosFiltrados();
  document.getElementById("badge-total-filtrado").textContent = `${municipios.length} ${municipios.length === 1 ? "município" : "municípios"}`;
  preencherCard("card-4", String(municipios.length), "Municípios no filtro atual");
  desenharRanking(document.querySelector("#grafico-2 .graficoarea"), municipios);
}

function exportarRelatorioPdf() {
  if (!window.jspdf?.jsPDF) {
    alert("Não foi possível carregar a biblioteca de PDF. Verifique sua conexão e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margem = 14;
  const largura = pdf.internal.pageSize.getWidth();
  const altura = pdf.internal.pageSize.getHeight();
  const azul = [10, 37, 64];
  const azulClaro = [2, 132, 199];
  const formatarData = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short"
  }).format(new Date());

  function textoSeguro(valor) {
    return String(valor ?? "—").replace(/[\u0000-\u001F]/g, " ");
  }

  function tituloSecao(titulo, y) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...azul);
    pdf.text(titulo, margem, y);
    return y + 6;
  }

  // Cabeçalho do relatório
  pdf.setFillColor(...azul);
  pdf.rect(0, 0, largura, 31, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(21);
  pdf.text("Credit42 | Relatório de Inteligência de Dados", margem, 14);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Gerado em ${formatarData}`, margem, 23);

  let y = 42;
  y = tituloSecao("Filtros aplicados", y);
  const filtros = [
    ["Ano", document.getElementById("filtro-ano")?.selectedOptions[0]?.textContent],
    ["Região", document.getElementById("filtro-regiao-macro")?.selectedOptions[0]?.textContent],
    ["Porte", document.getElementById("filtro-porte")?.selectedOptions[0]?.textContent],
    ["Município", document.getElementById("filtro-busca-muni")?.value || "Todos"],
  ];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  filtros.forEach(([rotulo, valor], indice) => {
    const x = margem + (indice % 2) * 130;
    const linhaY = y + Math.floor(indice / 2) * 7;
    pdf.setTextColor(...azul);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${rotulo}:`, x, linhaY);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(55, 65, 81);
    pdf.text(textoSeguro(valor), x + 24, linhaY);
  });
  y += 19;

  // Indicadores resumidos exibidos no dashboard
  y = tituloSecao("Indicadores do período", y);
  const indicadores = [...document.querySelectorAll(".cards-grid .card-resumo")].map(card => ({
    titulo: card.querySelector(".card-rotulo")?.textContent.trim() || "Indicador",
    valor: card.querySelector(".cardvalor, .card-valor")?.textContent.trim() || "—",
    detalhe: card.querySelector(".carddetalhe, .card-subtexto")?.textContent.trim() || "",
  }));
  const espacoCard = (largura - margem * 2 - 12) / 4;
  indicadores.forEach((item, indice) => {
    const x = margem + indice * (espacoCard + 4);
    pdf.setDrawColor(220, 228, 236);
    pdf.setFillColor(247, 250, 252);
    pdf.roundedRect(x, y, espacoCard, 25, 2, 2, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(75, 85, 99);
    pdf.text(pdf.splitTextToSize(textoSeguro(item.titulo), espacoCard - 5), x + 3, y + 6);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...azulClaro);
    pdf.text(textoSeguro(item.valor), x + 3, y + 16);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text(pdf.splitTextToSize(textoSeguro(item.detalhe), espacoCard - 5), x + 3, y + 21);
  });
  y += 34;

  // Captura dos gráficos exatamente como estão sendo exibidos na página
  y = tituloSecao("Visualizações do dashboard", y);
  const graficos = [
    { seletor: "#grafico-1 canvas", titulo: "Fluxo da Carteira de Crédito" },
    { seletor: "#grafico-2 canvas", titulo: "Ranking de Score Inclusivo" },
  ];
  let xGrafico = margem;
  for (const grafico of graficos) {
    const canvas = document.querySelector(grafico.seletor);
    if (!canvas) continue;
    try {
      const imagem = canvas.toDataURL("image/png", 1);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...azul);
      pdf.text(grafico.titulo, xGrafico, y);
      pdf.addImage(imagem, "PNG", xGrafico, y + 3, 128, 57);
      xGrafico += 132;
    } catch (erro) {
      console.warn(`Não foi possível incluir o gráfico ${grafico.titulo}:`, erro);
    }
  }

  // Tabela com o mesmo conjunto de municípios usado na exportação CSV
  pdf.addPage();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...azul);
  pdf.text("Detalhamento dos municípios", margem, 17);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${municipiosFiltrados().length} município(s) no recorte selecionado`, margem, 23);

  const municipios = municipiosFiltrados();
  const porteLabels = {
    pequeno: "Pequeno Porte",
    medio: "Médio Porte",
    grande: "Grande Porte / Metrópole",
  };
  const colunas = [
    "Município", "Código IBGE", "UF", "Região", "Porte", "População",
    "Score Inclusivo", "Meses válidos", "Cobertura (%)", "Inadimplência (%)", "Competência",
  ];
  const linhas = municipios.map(item => [
    item.localidade, item.municipio_ibge, item.uf, item.regiao,
    porteLabels[item.porte] || "Não informado", item.populacao,
    item.score_final, item.meses_validos, item.cobertura_pct,
    item.inadimplencia_estimada, item.competencia_inadimplencia,
  ].map(valor => valor == null ? "—" : typeof valor === "number"
    ? numeroCredit42.format(valor) : textoSeguro(valor)));

  if (typeof pdf.autoTable === "function") {
    pdf.autoTable({
      head: [colunas],
      body: linhas,
      startY: 29,
      margin: { left: margem, right: margem, bottom: 15 },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      didDrawPage: () => {
        pdf.setFontSize(7);
        pdf.setTextColor(120, 130, 140);
        pdf.text("Credit42 · Meridiano Tech", margem, altura - 7);
        pdf.text(`Página ${pdf.internal.getNumberOfPages()}`, largura - margem, altura - 7, { align: "right" });
      },
    });
  } else {
    pdf.setFontSize(8);
    pdf.text("A tabela não pôde ser montada porque o complemento de PDF não foi carregado.", margem, 32);
  }

  // Extrato regional: aproveita as linhas já filtradas e exibidas na tabela do site.
  const linhasExtrato = [...document.querySelectorAll("#tabela-extrato-corpo tr")]
    .filter(linha => linha.cells.length === 6)
    .map(linha => [...linha.cells].map(celula => textoSeguro(celula.innerText.trim())));
  if (linhasExtrato.length && typeof pdf.autoTable === "function") {
    const inicioExtrato = (pdf.lastAutoTable?.finalY || 29) + 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...azul);
    pdf.text("Extrato econômico regional", margem, inicioExtrato);
    pdf.autoTable({
      head: [["Competência", "Região", "Carteira de Crédito", "Volume Pix", "Inadimplência", "Comportamento / Status"]],
      body: linhasExtrato,
      startY: inicioExtrato + 5,
      margin: { left: margem, right: margem, bottom: 15 },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: azul, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      didDrawPage: () => {
        pdf.setFontSize(7);
        pdf.setTextColor(120, 130, 140);
        pdf.text("Credit42 · Meridiano Tech", margem, altura - 7);
        pdf.text(`Página ${pdf.internal.getNumberOfPages()}`, largura - margem, altura - 7, { align: "right" });
      },
    });
  }

  pdf.save("relatorio_credit42.pdf");
}

function exportarRelatorioCsv() {
  const linhas = [
    ["Município", "Código IBGE", "UF", "Região", "Porte Populacional", "População (Hab.)",
      "Score Inclusivo", "Meses válidos", "Cobertura (%)", "Inadimplência Estimada (%)",
      "Competência da estimativa"],
    ...municipiosFiltrados().map(item => [
      item.localidade, item.municipio_ibge, item.uf, item.regiao,
      { pequeno: "Pequeno Porte", medio: "Médio Porte", grande: "Grande Porte / Metrópole" }[item.porte],
      item.populacao, item.score_final, item.meses_validos,
      item.cobertura_pct, item.inadimplencia_estimada, item.competencia_inadimplencia,
    ]),
  ];
  const csv = linhas.map(linha => linha.map(valor => {
    const texto = typeof valor === "number" ? String(valor).replace(".", ",") : String(valor ?? "");
    return '"' + texto.replaceAll('"', '""') + '"';
  }).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio_credit42_municipios.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function iniciar() {
  try {
    dadosGlobais = await carregarDadosCredit42();
  } catch {
    document.querySelectorAll(".graficoarea").forEach(area => {
      mostrarMensagem(area, "Não foi possível carregar os dados.");
    });
    return;
  }

  const filtroAno = document.getElementById("filtro-ano") || document.querySelector(".filtro-select");
  const anoInicial = filtroAno ? filtroAno.value : "2026";

  // Aplica ano inicial nos 4 cards e no gráfico de evolução
  aplicarFiltroAno(anoInicial);

  aplicarFiltrosMunicipais();
  filtroAno?.addEventListener("change", evento => aplicarFiltroAno(evento.target.value));
  for (const id of ["filtro-regiao-macro", "filtro-porte"]) {
    document.getElementById(id).addEventListener("change", aplicarFiltrosMunicipais);
  }
  document.getElementById("filtro-busca-muni").addEventListener("input", () => {
    clearTimeout(timerDebounceBusca);
    timerDebounceBusca = setTimeout(aplicarFiltrosMunicipais, 300);
  });
  document.getElementById("btn-exportar-csv").addEventListener("click", exportarRelatorioCsv);
  document.getElementById("btn-exportar-pdf").addEventListener("click", exportarRelatorioPdf);
}

document.addEventListener("DOMContentLoaded", iniciar);
