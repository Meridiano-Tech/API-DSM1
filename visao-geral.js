Chart.defaults.font.family = '"Archivo", system-ui, sans-serif';

/* ---------- formatação ---------- */
function formatarPercentual(valor, comSinal = false) {
  const sinal = comSinal && valor > 0 ? '+' : '';
  return sinal + valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
}

function formatarVolume(valor) {
  return valor.toLocaleString('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  });
}

function formatarMes(anoMes) {
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const [ano, mes] = anoMes.split('-');
  return nomes[Number(mes) - 1] + '/' + ano.slice(2);
}

function preencher(seletor, texto) {
  const el = document.querySelector(seletor);
  if (el) el.textContent = texto;
}

/* ---------- cards ---------- */
function preencherCards(cards) {
  // Card 1: região com maior crescimento da carteira de crédito
  const norte = cards.yoy_norte;
  const nordeste = cards.yoy_nordeste;

  if (norte === nordeste) {
    preencher('#card-1 .cardvalor', formatarPercentual(norte, true));
    preencher('#card-1 .carddetalhe', 'Norte e Nordeste (mesmo crescimento)');
  } else if (norte > nordeste) {
    preencher('#card-1 .cardvalor', formatarPercentual(norte, true));
    preencher('#card-1 .carddetalhe', 'Maior crescimento: Região Norte');
  } else {
    preencher('#card-1 .cardvalor', formatarPercentual(nordeste, true));
    preencher('#card-1 .carddetalhe', 'Maior crescimento: Região Nordeste');
  }

  // Card 2: volume total de Pix
  preencher('#card-2 .cardvalor', formatarVolume(cards.vol_pix_geral));

  // Card 3: inadimplência média da carteira
  preencher('#card-3 .cardvalor', formatarPercentual(cards.inadimplencia_media));
}

/* ---------- gráficos ---------- */
const COR_PRIMARIA = '#0A5C7A';
const COR_AZUL_CLARO = '#2A9DC4';
const COR_LARANJA = '#E8833A';
const COR_TEXTO = '#12303D';
const COR_TEXTO_SUAVE = '#4F6B78';
const COR_GRADE = '#D3E5EC';

function prepararArea(area, descricao) {
  area.innerHTML = '';
  area.style.position = 'relative';
  area.style.height = '460px';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', descricao);
  area.appendChild(canvas);
  return canvas;
}

function desenharLinha(area, serie) {
  const canvas = prepararArea(
    area,
    'Gráfico de linhas com a evolução mensal da carteira de crédito das regiões Norte e Nordeste.'
  );

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: serie.map(d => formatarMes(d.mes)),
      datasets: [
        {
          label: 'Região Norte',
          data: serie.map(d => d.Norte),
          borderColor: COR_PRIMARIA,
          backgroundColor: COR_PRIMARIA,
          pointStyle: 'circle',
          pointRadius: 4,
          borderWidth: 2.5,
          tension: 0.25
        },
        {
          label: 'Região Nordeste',
          data: serie.map(d => d.Nordeste),
          borderColor: COR_AZUL_CLARO,
          backgroundColor: COR_AZUL_CLARO,
          pointStyle: 'rect',
          pointRadius: 4,
          borderWidth: 2.5,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, color: COR_TEXTO }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              ctx.dataset.label + ': R$ ' +
              ctx.parsed.y.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mi'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: COR_TEXTO_SUAVE, maxRotation: 45, autoSkip: true, maxTicksLimit: 12 },
          grid: { display: false },
          title: { display: true, text: 'Mês', color: COR_TEXTO_SUAVE }
        },
        y: {
          ticks: {
            color: COR_TEXTO_SUAVE,
            callback: v => 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' bi'
          },
          grid: { color: COR_GRADE },
          title: { display: true, text: 'Carteira de crédito (R$ bi)', color: COR_TEXTO_SUAVE }
        }
      }
    }
  });
}

// desenha a linha tracejada da média no gráfico de barras
const linhaMedia = {
  id: 'linhaMedia',
  afterDatasetsDraw(chart, args, opcoes) {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const px = x.getPixelForValue(opcoes.valor);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = COR_TEXTO;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px, bottom);
    ctx.stroke();
    ctx.restore();
  }
};

function desenharBarras(area, ranking) {
  const ordenado = [...ranking].sort((a, b) => b.Score_Final - a.Score_Final);
  const media = ordenado.reduce((soma, d) => soma + d.Score_Final, 0) / ordenado.length;
  const mediaTexto = media.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  const canvas = prepararArea(
    area,
    'Gráfico de barras com o score de cada município, em ordem decrescente, e a média indicada por uma linha tracejada.'
  );

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ordenado.map(d => d.localidade),
      datasets: [{
        label: 'Score final',
        data: ordenado.map(d => d.Score_Final),
        backgroundColor: ordenado.map(d => d.Score_Final >= media ? COR_PRIMARIA : COR_LARANJA)
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        subtitle: {
          display: true,
          text: 'Azul: acima da média · Laranja: abaixo · Linha tracejada: média (' + mediaTexto + ')',
          color: COR_TEXTO_SUAVE,
          padding: { bottom: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => 'Score: ' + ctx.parsed.x.toLocaleString('pt-BR', {
              minimumFractionDigits: 1, maximumFractionDigits: 1
            })
          }
        },
        linhaMedia: { valor: media }
      },
      scales: {
        x: {
          ticks: { color: COR_TEXTO_SUAVE },
          grid: { color: COR_GRADE },
          title: { display: true, text: 'Pontos de score', color: COR_TEXTO_SUAVE }
        },
        y: {
          ticks: { color: COR_TEXTO, font: { size: 11 } },
          grid: { display: false }
        }
      }
    },
    plugins: [linhaMedia]
  });
}

/* ---------- início ---------- */
async function iniciar() {
  try {
    const resposta = await fetch('dados_site.json');
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    const dados = await resposta.json();

    preencherCards(dados.cards);

    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js não carregou. Confira a linha do CDN no index.html.');
    }

    const areas = document.querySelectorAll('.graficos .graficoarea');
    if (areas[0]) desenharLinha(areas[0], dados.serie_temporal_credito);
    if (areas[1]) desenharBarras(areas[1], dados.ranking_municipal);
  } catch (erro) {
    console.error('Erro ao carregar a página:', erro);
  }
}

iniciar();