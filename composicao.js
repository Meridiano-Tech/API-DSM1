Chart.defaults.font.family = '"Archivo", system-ui, sans-serif';

/* ---------- formatação ---------- */
function formatarMes(anoMes) {
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const [ano, mes] = anoMes.split('-');
  return nomes[Number(mes) - 1] + '/' + ano.slice(2);
}

/* ---------- gráficos: base ---------- */
const COR_PRIMARIA = '#0A5C7A';
const COR_LARANJA = '#E8833A';
const COR_TEXTO = '#12303D';
const COR_TEXTO_SUAVE = '#4F6B78';
const COR_GRADE = '#D3E5EC';

// paleta do design system (até 5 séries) e marcadores diferentes por linha
const PALETA = ['#0A5C7A', '#2A9DC4', '#E8833A', '#7A8FA0', '#F2C078'];
const MARCADORES = ['circle', 'rect', 'triangle', 'rectRot', 'cross'];

function prepararArea(area, descricao, altura) {
  area.innerHTML = '';
  area.style.position = 'relative';
  area.style.height = altura + 'px';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', descricao);
  area.appendChild(canvas);
  return canvas;
}

/* ---------- gráfico de linhas (carteira e Pix) ---------- */
function desenharLinhas(area, serie, cfg) {
  const canvas = prepararArea(area, cfg.descricao, 460);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: serie.map(d => formatarMes(d.mes)),
      datasets: cfg.series.map((nome, i) => ({
        label: nome,
        data: serie.map(d => d[nome]),
        borderColor: PALETA[i % PALETA.length],
        backgroundColor: PALETA[i % PALETA.length],
        pointStyle: MARCADORES[i % MARCADORES.length],
        pointRadius: 4,
        borderWidth: 2.5,
        tension: 0.25
      }))
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
            label: ctx => ctx.dataset.label + ': ' +
              ctx.parsed.y.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
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
            callback: v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
          },
          grid: { color: COR_GRADE },
          title: { display: true, text: cfg.tituloY, color: COR_TEXTO_SUAVE }
        }
      }
    }
  });
}

/* ---------- gráfico de barras com linha da média (inadimplência e score) ---------- */
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

function desenharBarras(area, itens, cfg) {
  const ordenado = [...itens].sort((a, b) => b[cfg.valor] - a[cfg.valor]);
  const media = ordenado.reduce((soma, d) => soma + d[cfg.valor], 0) / ordenado.length;
  const fmt = v => v.toLocaleString('pt-BR', {
    minimumFractionDigits: cfg.casas,
    maximumFractionDigits: cfg.casas
  });

  // acimaEhBom = true: acima da média em azul; false: acima da média em laranja (atenção)
  const corAcima = cfg.acimaEhBom ? COR_PRIMARIA : COR_LARANJA;
  const corAbaixo = cfg.acimaEhBom ? COR_LARANJA : COR_PRIMARIA;
  const legenda = cfg.acimaEhBom
    ? 'Azul: acima da média · Laranja: abaixo'
    : 'Laranja: acima da média · Azul: abaixo';

  const canvas = prepararArea(area, cfg.descricao, 360);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ordenado.map(d => d[cfg.nome]),
      datasets: [{
        label: cfg.tituloX,
        data: ordenado.map(d => d[cfg.valor]),
        backgroundColor: ordenado.map(d => d[cfg.valor] >= media ? corAcima : corAbaixo)
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
          text: legenda + ' · Linha tracejada: média (' + fmt(media) + cfg.sufixo + ')',
          color: COR_TEXTO_SUAVE,
          padding: { bottom: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => cfg.tituloX + ': ' + fmt(ctx.parsed.x) + cfg.sufixo
          }
        },
        linhaMedia: { valor: media }
      },
      scales: {
        x: {
          ticks: { color: COR_TEXTO_SUAVE, callback: v => v.toLocaleString('pt-BR') + cfg.sufixo },
          grid: { color: COR_GRADE },
          title: { display: true, text: cfg.tituloX, color: COR_TEXTO_SUAVE }
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

/* ---------- os 4 gráficos da seção Análises ---------- */
function desenharComposicao(dados) {
  const regioes = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];

  const areaCarteira = document.querySelector('#grafico-colab-1 .graficoarea');
  if (areaCarteira && dados.grafico_1_carteira_credito) {
    desenharLinhas(areaCarteira, dados.grafico_1_carteira_credito, {
      series: regioes,
      tituloY: 'Carteira de crédito',
      descricao: 'Gráfico de linhas com a evolução da carteira de crédito em cada região do Brasil.'
    });
  }

  const areaPix = document.querySelector('#grafico-colab-2 .graficoarea');
  if (areaPix && dados.grafico_2_volume_pix) {
    desenharLinhas(areaPix, dados.grafico_2_volume_pix, {
      series: regioes,
      tituloY: 'Volume de Pix',
      descricao: 'Gráfico de linhas com a evolução do volume de Pix em cada região do Brasil.'
    });
  }

  const areaInad = document.querySelector('#grafico-colab-3 .graficoarea');
  if (areaInad && dados.grafico_3_inadimplencia_municipal) {
    desenharBarras(areaInad, dados.grafico_3_inadimplencia_municipal, {
      nome: 'municipio',
      valor: 'taxa_inadimplencia',
      casas: 1,
      sufixo: '%',
      tituloX: 'Inadimplência',
      acimaEhBom: false,
      descricao: 'Gráfico de barras com a taxa de inadimplência de cada município, em ordem decrescente, e a média indicada por uma linha tracejada.'
    });
  }

  const areaScore = document.querySelector('#grafico-colab-4 .graficoarea');
  if (areaScore && dados.grafico_4_score_inclusivo) {
    desenharBarras(areaScore, dados.grafico_4_score_inclusivo, {
      nome: 'localidade',
      valor: 'score_final',
      casas: 0,
      sufixo: '',
      tituloX: 'Pontos de score',
      acimaEhBom: true,
      descricao: 'Gráfico de barras com o score inclusivo de cada município, em ordem decrescente, e a média indicada por uma linha tracejada.'
    });
  }
}

/* ---------- início ---------- */
async function iniciar() {
  try {
    const resposta = await fetch('dados_site.json');
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    const dados = await resposta.json();

    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js não carregou. Confira a linha do CDN no HTML.');
    }

    desenharComposicao(dados);
  } catch (erro) {
    console.error('Erro ao carregar a página:', erro);
  }
}

iniciar();