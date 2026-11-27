"use strict";

const CORES_GRAFICOS = ["#00885a", "#0052cc", "#da8200", "#635bff", "#dc4089"];
const areaGrafico = id => document.querySelector(`#${id} .graficoarea`);

function montarGrafico(id, tipo, labels, datasets, escalas = {}, eixo = "x", formatarTooltip) {
  const area = areaGrafico(id);
  if (!labels.length || !datasets.some(serie => serie.data.some(Number.isFinite))) {
    area.textContent = "Dados indisponíveis no período.";
    return;
  }
  if (eixo === "y") {
    area.style.height = `${Math.max(285, labels.length * 24 + 55)}px`;
    area.style.maxHeight = "none";
  }
  renderizarGraficoCredit42(area, {
    type: tipo,
    plugins: [rotulosBarrasCredit42],
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: eixo,
      layout: { padding: { right: eixo === "y" ? 50 : 0 } },
      scales: escalas,
      plugins: {
        legend: { display: datasets.length > 1 || tipo === "doughnut", position: "bottom", labels: { font: { size: 13 } } },
        ...(formatarTooltip && { tooltip: { callbacks: {
          label: item => `${item.dataset.label}: ${formatarTooltip(item.raw)}`,
        } } }),
      },
    },
  }, formatarTooltip);
}

function linha(label, data, cor) {
  return { label, data, borderColor: cor, backgroundColor: cor, pointRadius: 2, spanGaps: false };
}

function eixoTemporal(unidade) {
  return {
    x: { ticks: { maxTicksLimit: 10 } },
    y: {
      title: { display: true, text: unidade },
      ticks: { callback: valor => numeroCredit42.format(valor) },
    },
  };
}

function formatarMilhoesDeOperacoes(operacoesEmMilhoes) {
  return `${numeroCredit42.format(operacoesEmMilhoes)} Mi de operações`;
}

function serieRegional(dados, meses, campo, divisor) {
  const porChave = new Map(dados.pix_regioes.map(linha => [`${linha.regiao}/${linha.competencia}`, linha[campo]]));
  return REGIOES_CREDIT42.map((regiao, i) =>
    linha(regiao, meses.map(mes => {
      const valor = porChave.get(`${regiao}/${mes}`);
      return Number.isFinite(valor) ? valor / divisor : null;
    }), CORES_GRAFICOS[i])
  );
}

function ranking(id, itens, campoValor, campoNome, unidade, cor, maximo) {
  const validos = itens.filter(item => Number.isFinite(item[campoValor]))
    .sort((a, b) => b[campoValor] - a[campoValor]);
  montarGrafico(id, "bar", validos.map(item => item[campoNome]), [{
    label: unidade,
    data: validos.map(item => item[campoValor]),
    backgroundColor: cor,
    borderRadius: 4,
  }], {
    x: {
      beginAtZero: true, max: maximo,
      title: { display: true, text: unidade },
      ticks: { callback: valor => numeroCredit42.format(valor) },
    },
    y: { ticks: { autoSkip: false } },
  }, "y", valor => `${numeroCredit42.format(valor)} ${unidade === "Pontos" ? "pontos" : "%"}`);
}

document.addEventListener("DOMContentLoaded", async () => {
  let dados;
  try {
    dados = await carregarDadosCredit42();
  } catch {
    estadoDadosCredit42("falha");
    document.querySelectorAll(".graficoarea").forEach(area => {
      area.textContent = "Não foi possível carregar os dados.";
    });
    return;
  }
  mostrarCoberturaCredit42(dados);
  document.getElementById("versao-base").textContent = `Modelo ${dados.model_version} · parâmetros ${dados.parameter_set_id}. Exportação ${dados.generated_at_utc}. Esta data de processamento não representa uma nova coleta das fontes.`;
  document.getElementById("fontes-series").textContent = `Séries SGS de carteira (R$ milhões na origem): ${Object.entries(dados.fontes.credito_regional).map(([r, s]) => `${r}: ${s}`).join("; ")}. Inadimplência regional (%): ${Object.entries(dados.fontes.inadimplencia_regional).map(([r, s]) => `${r}: ${s}`).join("; ")}. Referência nacional da estimativa municipal: SGS 21082.`;

  const credito = dados.principais.grafico_p1_serie_temporal_credito;
  const meses = credito.map(item => item.mes);
  const pixBrasil = new Map(dados.pix_brasil.map(item => [item.competencia, item]));

  ranking("grafico-perfil", dados.principais.grafico_p2_ranking_score_municipal,
    "score_final", "localidade", "Pontos", "#0052cc", 1000);
  montarGrafico("grafico-metricas", "doughnut", ["Volume Pix PF por habitante", "Pagadores PF por habitante"], [{
    label: "Peso no Downtrend (%)",
    data: [60, 40],
    backgroundColor: ["#0a5c7a", "#cc5200"],
  }], {}, "x", valor => `${numeroCredit42.format(valor)}%`);

  montarGrafico("grafico-colab-1", "line", meses, REGIOES_CREDIT42.map((regiao, i) =>
    linha(regiao, credito.map(item => Number.isFinite(item[regiao]) ? item[regiao] / (BILHAO / MILHAO) : null),
      CORES_GRAFICOS[i])
  ), eixoTemporal("R$ bilhões"), "x", formatarBilhoes);
  montarGrafico("grafico-colab-2", "line", meses, ["valor_pf", "valor_pj"].map((campo, i) =>
    linha(i === 0 ? "Pessoa física" : "Pessoa jurídica", meses.map(mes => {
      const valor = pixBrasil.get(mes)?.[campo];
      return Number.isFinite(valor) ? valor / BILHAO : null;
    }), CORES_GRAFICOS[i])
  ), eixoTemporal("R$ bilhões"), "x", formatarBilhoes);
  montarGrafico("grafico-colab-3", "line", meses,
    serieRegional(dados, meses, "quantidade_total", MILHAO), eixoTemporal("Milhões de operações"),
    "x", formatarMilhoesDeOperacoes);
  montarGrafico("grafico-colab-4", "line", meses,
    serieRegional(dados, meses, "vol_pix_total", BILHAO), eixoTemporal("R$ bilhões"), "x", formatarBilhoes);

  const estimativas = dados.ranking_inadimplencia_municipal;
  const competencias = [...new Set(estimativas.filter(item => Number.isFinite(item.taxa_inadimplencia))
    .map(item => item.competencia_inadimplencia))].sort();
  document.getElementById("competencia-inad-5").textContent = competencias.join(" a ");
  const estados = dados.inadimplencia_estadual;
  const ufs = [...new Set(estados.map(item => item.uf))];
  const competencia = [...meses].reverse().find(mes =>
    ufs.length && ufs.every(uf => estados.some(item =>
      item.uf === uf && item.competencia === mes && Number.isFinite(item.valor))));
  document.getElementById("competencia-inad-6").textContent = competencia ?? "";
  const estadosNoMes = estados.filter(item => item.competencia === competencia);
  const maximo = Math.ceil(Math.max(0, ...estimativas.map(i => i.taxa_inadimplencia ?? 0), ...estadosNoMes.map(i => i.valor ?? 0))) + 1;
  ranking("grafico-colab-5", estimativas.map(item => ({
    ...item, localidade: competencias.length === 1 ? item.localidade : `${item.localidade} · ${item.competencia_inadimplencia ?? "—"}`,
  })), "taxa_inadimplencia", "localidade", "Taxa estimada (%)", "#ba4949", maximo);
  ranking("grafico-colab-6", estadosNoMes,
    "valor", "uf", "Taxa observada (%)", "#286b78", maximo);
});
