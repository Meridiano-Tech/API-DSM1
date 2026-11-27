"use strict";

let leituraCredit42;

function carregarDadosCredit42() {
  leituraCredit42 ??= requisicaoCredit42("./dados/dados_site.json").then(dados => {
    // Uma resposta JSON de erro também pode chegar com HTTP 200.
    const series = [dados?.principais?.grafico_p1_serie_temporal_credito,
      dados?.principais?.grafico_p2_ranking_score_municipal,
      dados?.apoio?.grafico_a1_evolucao_inadimplencia, dados?.serie_inadimplencia_regional,
      dados?.pix_brasil, dados?.pix_regioes, dados?.catalogo_municipios,
      dados?.inadimplencia_estadual, dados?.ranking_inadimplencia_municipal];
    const ranking = dados?.principais?.grafico_p2_ranking_score_municipal;
    const catalogo = dados?.catalogo_municipios;
    const codigosRanking = new Set(Array.isArray(ranking) ? ranking.map(item => item?.municipio_ibge) : []);
    const codigosCatalogo = new Set(Array.isArray(catalogo) ? catalogo.map(item => item?.municipio_ibge) : []);
    if (!series.every(Array.isArray) || !Array.isArray(dados.score_metadata?.periodo_agregacao)
        || !dados.fontes?.credito_regional || !dados.fontes?.inadimplencia_regional
        || !dados.model_version || !dados.parameter_set_id
        || catalogo.length !== 70 || ranking.length !== 70
        || codigosCatalogo.size !== 70 || codigosRanking.size !== 70
        || [...codigosCatalogo].some(codigo => !codigosRanking.has(codigo))) {
      throw new Error("Exportação do Colab incompleta.");
    }
    return dados;
  }).catch(erro => {
    leituraCredit42 = null; // Permite nova tentativa depois de uma falha transitória.
    throw erro;
  });
  return leituraCredit42;
}

async function requisicaoCredit42(url, opcoes = {}) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 12000);
  try {
    const resposta = await fetch(url, { ...opcoes, signal: controle.signal });
    if (!resposta.ok) throw new Error(`Requisição indisponível (HTTP ${resposta.status}).`);
    return await resposta.json();
  } finally {
    clearTimeout(limite);
  }
}

function normalizarTextoCredit42(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function estadoDadosCredit42(estado) {
  const texto = document.getElementById("status-dados");
  if (texto) texto.textContent = {
    pronto: "Base do Colab carregada.",
    falha: "Não foi possível carregar a base. Verifique a conexão e tente novamente.",
  }[estado] || "Carregando a base do Colab…";
  const tentar = document.getElementById("recarregar-dados");
  if (tentar) {
    tentar.hidden = estado !== "falha";
    tentar.onclick = () => window.location.reload();
  }
}

function mostrarCoberturaCredit42(dados) {
  const ultimo = (itens, mes, valido) => itens.filter(valido).map(item => item[mes]).sort().at(-1) || "indisponível";
  const credito = ultimo(dados.principais.grafico_p1_serie_temporal_credito, "mes",
    item => REGIOES_CREDIT42.every(r => Number.isFinite(item[r])));
  const taxasPorMes = new Map();
  for (const { competencia, regiao, valor } of dados.serie_inadimplencia_regional) {
    if (!Number.isFinite(valor)) continue;
    if (!taxasPorMes.has(competencia)) taxasPorMes.set(competencia, new Set());
    taxasPorMes.get(competencia).add(regiao);
  }
  const inad = ultimo(dados.principais.grafico_p1_serie_temporal_credito, "mes",
    item => REGIOES_CREDIT42.every(r => taxasPorMes.get(item.mes)?.has(r)));
  const pix = ultimo(dados.pix_brasil, "competencia", item => Number.isFinite(item.vol_pix_total));
  const el = document.getElementById("cobertura-base");
  if (el) {
    el.replaceChildren(document.createTextNode(`Pix até ${pix} · carteira até ${credito} · inadimplência regional até ${inad} (cobertura das cinco regiões). `));
    const link = document.createElement("a");
    link.href = "composicao.html#metodologia";
    link.textContent = `Fontes e metodologia · modelo ${dados.model_version}`;
    el.append(link);
  }
  estadoDadosCredit42("pronto");
}

// Cada gráfico possui uma tabela com os mesmos valores, inclusive valores ausentes.
// O restante da interface funciona mesmo se o CDN de gráficos estiver indisponível.
const graficosCredit42 = new Map();
function renderizarGraficoCredit42(area, config, formatar = valor => numeroCredit42.format(valor)) {
  graficosCredit42.get(area)?.destroy();
  graficosCredit42.delete(area);
  area.replaceChildren();
  const card = area.closest(".card-grafico");
  card.querySelector(":scope > .dados-grafico")?.remove();
  const titulo = card.querySelector("h2, h3")?.textContent || "Gráfico";
  const detalhes = document.createElement("details");
  detalhes.className = "dados-grafico";
  const resumo = document.createElement("summary");
  resumo.textContent = "Ver dados em tabela";
  const rolavel = document.createElement("div");
  rolavel.className = "tabela-container";
  rolavel.tabIndex = 0;
  rolavel.setAttribute("role", "region");
  rolavel.setAttribute("aria-label", `Dados de ${titulo}`);
  const tabela = document.createElement("table");
  const caption = tabela.createCaption();
  caption.textContent = titulo;
  const cabecalho = tabela.createTHead().insertRow();
  const series = config.data.datasets;
  for (const texto of ["Competência / categoria", ...series.map(s => s.label || "Valor")]) {
    const th = document.createElement("th"); th.scope = "col"; th.textContent = texto; cabecalho.append(th);
  }
  const corpo = tabela.createTBody();
  config.data.labels.forEach((label, i) => {
    const tr = corpo.insertRow();
    const th = document.createElement("th"); th.scope = "row"; th.textContent = label; tr.append(th);
    series.forEach(serie => {
      const v = serie.data[i];
      tr.insertCell().textContent = Number.isFinite(v) ? formatar(v) : "Indisponível na fonte";
    });
  });
  rolavel.append(tabela); detalhes.append(resumo, rolavel); card.append(detalhes);
  if (!config.data.labels.length) { area.textContent = "Nenhum resultado para os filtros selecionados."; return null; }
  try {
    if (typeof Chart === "undefined") throw new Error("Gráficos indisponíveis");
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", `${titulo}. Dados na tabela a seguir.`);
    area.append(canvas);
    const grafico = new Chart(canvas, config);
    graficosCredit42.set(area, grafico);
    return grafico;
  } catch {
    area.textContent = "Visualização gráfica indisponível. Consulte os mesmos dados na tabela abaixo.";
    detalhes.open = true;
    return null;
  }
}

const rotulosBarrasCredit42 = {
  id: "rotulosBarrasCredit42",
  afterDatasetsDraw(grafico) {
    if (grafico.options.indexAxis !== "y") return;
    const ctx = grafico.ctx;
    ctx.save(); ctx.fillStyle = "#0a2540"; ctx.font = "600 12px sans-serif";
    ctx.textBaseline = "middle";
    grafico.getDatasetMeta(0).data.forEach((barra, i) => {
      const v = grafico.data.datasets[0].data[i];
      if (Number.isFinite(v)) ctx.fillText(numeroCredit42.format(v), barra.x + 6, barra.y);
    });
    ctx.restore();
  },
};

const REGIOES_CREDIT42 = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
const MILHAO = 1e6;
const BILHAO = 1e9;
const TRILHAO = 1e12;
const numeroCredit42 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatarBilhoes(reaisEmBilhoes) {
  return Number.isFinite(reaisEmBilhoes) ? `R$ ${numeroCredit42.format(reaisEmBilhoes)} Bi` : "—";
}

function formatarCarteira(milhoesDeReais) {
  return Number.isFinite(milhoesDeReais)
    ? formatarBilhoes(milhoesDeReais / (BILHAO / MILHAO)) : "—";
}

function formatarMoedaCredit42(reais) {
  if (!Number.isFinite(reais)) return "—";
  const magnitude = Math.abs(reais);
  if (magnitude >= TRILHAO) return `R$ ${numeroCredit42.format(reais / TRILHAO)} Tri`;
  if (magnitude >= BILHAO) return formatarBilhoes(reais / BILHAO);
  if (magnitude >= MILHAO) return `R$ ${numeroCredit42.format(reais / MILHAO)} Mi`;
  return `R$ ${numeroCredit42.format(reais)}`;
}
