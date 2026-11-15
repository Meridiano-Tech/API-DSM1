document.addEventListener('DOMContentLoaded', async () => {
  const btnTimeline = document.getElementById('btn-ver-timeline');
  const btnTabela = document.getElementById('btn-ver-tabela');
  const painelTimeline = document.getElementById('painel-timeline');
  const painelTabela = document.getElementById('painel-tabela');
  const filtroRegiao = document.getElementById('filtro-regiao-extrato');
  const filtroPeriodo = document.getElementById('filtro-periodo-extrato');
  const caixaIntervalo = document.getElementById('caixa-intervalo-personalizado');
  const filtroDataInicio = document.getElementById('filtro-data-inicio');
  const filtroDataFim = document.getElementById('filtro-data-fim');
  const listaTimeline = document.getElementById('timeline-lista');
  const corpoTabela = document.getElementById('tabela-extrato-corpo');

  let dadosExtrato;
  try {
    const dados = await carregarDadosCredit42();
    const carteira = new Map(dados.principais.grafico_p1_serie_temporal_credito.map(item => [item.mes, item]));
    const taxas = new Map(dados.ranking_inadimplencia_regional
      .map(item => [`${item.regiao}/${item.competencia}`, item.valor]));
    dadosExtrato = dados.pix_regioes.filter(item => REGIOES_CREDIT42.includes(item.regiao))
      .map(item => {
        const mes = item.competencia;
        const regiao = item.regiao;
        const saldo = carteira.get(mes)?.[regiao];
        const inadimplencia = taxas.get(`${regiao}/${mes}`);
        const completos = Number.isFinite(saldo) && Number.isFinite(item.vol_pix_total) &&
          Number.isFinite(inadimplencia);
        return {
          mes,
          mesFormatado: mes,
          regiao,
          carteiraBi: Number.isFinite(saldo) ? saldo / 1000 : null,
          pixBi: Number.isFinite(item.vol_pix_total) ? item.vol_pix_total / 1e9 : null,
          inadimplencia,
          status: completos ? 'Observado' : 'Cobertura parcial',
          classeStatus: 'status-azul',
        };
      }).sort((a, b) => b.mes.localeCompare(a.mes) || a.regiao.localeCompare(b.regiao));
  } catch {
    listaTimeline.textContent = 'Não foi possível carregar o extrato regional.';
    return;
  }

  function formatar(valor, prefixo, sufixo) {
    return Number.isFinite(valor)
      ? `${prefixo}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${sufixo}` : '—';
  }

  function alternarAba(abaEscolhida) {
    if (abaEscolhida === 'timeline') {
      btnTimeline.classList.add('btn-aba-ativo');
      btnTimeline.setAttribute('aria-selected', 'true');
      btnTabela.classList.remove('btn-aba-ativo');
      btnTabela.setAttribute('aria-selected', 'false');

      painelTimeline.style.display = 'block';
      painelTabela.style.display = 'none';
    } else {
      btnTabela.classList.add('btn-aba-ativo');
      btnTabela.setAttribute('aria-selected', 'true');
      btnTimeline.classList.remove('btn-aba-ativo');
      btnTimeline.setAttribute('aria-selected', 'false');

      painelTabela.style.display = 'block';
      painelTimeline.style.display = 'none';
    }
  }

  function renderizarTimeline(itens) {
    if (!listaTimeline) return;
    listaTimeline.innerHTML = '';

    if (itens.length === 0) {
      listaTimeline.innerHTML = '<p class="extrato-vazio">Nenhum registro encontrado para o filtro selecionado.</p>';
      return;
    }

    itens.forEach(item => {
      const card = document.createElement('article');
      card.className = 'timeline-item';
      card.innerHTML = `
        <div class="timeline-marcador">
          <span class="timeline-ponto"></span>
          <span class="timeline-data">${item.mesFormatado}</span>
        </div>
        <div class="timeline-conteudo">
          <div class="timeline-topo">
            <span class="timeline-regiao-tag">${item.regiao}</span>
            <span class="badge-status ${item.classeStatus}">${item.status}</span>
          </div>
          <div class="timeline-metricas">
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Carteira de Crédito</span>
              <strong class="metrica-valor">${formatar(item.carteiraBi, 'R$ ', ' Bi')}</strong>
            </div>
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Volume Pix</span>
              <strong class="metrica-valor">${formatar(item.pixBi, 'R$ ', ' Bi')}</strong>
            </div>
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Inadimplência</span>
              <strong class="metrica-valor">${formatar(item.inadimplencia, '', '%')}</strong>
            </div>
          </div>
        </div>
      `;
      listaTimeline.appendChild(card);
    });
  }

  function renderizarTabela(itens) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    if (itens.length === 0) {
      corpoTabela.innerHTML = '<tr><td colspan="6" class="extrato-vazio">Nenhum registro encontrado para o filtro selecionado.</td></tr>';
      return;
    }

    itens.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.mesFormatado}</strong></td>
        <td><span class="tabela-regiao-tag">${item.regiao}</span></td>
        <td>${formatar(item.carteiraBi, 'R$ ', ' Bi')}</td>
        <td>${formatar(item.pixBi, 'R$ ', ' Bi')}</td>
        <td>${formatar(item.inadimplencia, '', '%')}</td>
        <td><span class="badge-status ${item.classeStatus}">${item.status}</span></td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  function popularSeletoresIntervalo() {
    if (!filtroDataInicio || !filtroDataFim) return;

    const mapaMeses = new Map();
    dadosExtrato.forEach(d => {
      if (!mapaMeses.has(d.mes)) {
        mapaMeses.set(d.mes, d.mesFormatado);
      }
    });

    const mesesOrdenados = Array.from(mapaMeses.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    filtroDataInicio.innerHTML = '';
    filtroDataFim.innerHTML = '';

    mesesOrdenados.forEach(([valor, rotulo]) => {
      filtroDataInicio.add(new Option(rotulo, valor));
      filtroDataFim.add(new Option(rotulo, valor));
    });

    if (mesesOrdenados.length > 0) {
      filtroDataInicio.value = mesesOrdenados[0][0];
      filtroDataFim.value = mesesOrdenados[mesesOrdenados.length - 1][0];
    }
  }

  function atualizarVisualizacoes() {
    const regiaoSel = filtroRegiao ? filtroRegiao.value : 'todas';
    const periodoSel = filtroPeriodo ? filtroPeriodo.value : 'todos';

    let filtrados = dadosExtrato;

    if (regiaoSel !== 'todas') {
      filtrados = filtrados.filter(d => d.regiao.toLowerCase() === regiaoSel.toLowerCase());
    }

    if (periodoSel === '2024' || periodoSel === '2025' || periodoSel === '2026') {
      filtrados = filtrados.filter(d => d.mes.startsWith(periodoSel));
    } else if (periodoSel === 'recente') {
      filtrados = filtrados.filter(d => d.mes >= '2025-10');
    } else if (periodoSel === 'personalizado') {
      const inicio = filtroDataInicio ? filtroDataInicio.value : '';
      const fim = filtroDataFim ? filtroDataFim.value : '';
      if (inicio && fim) {
        const minData = inicio <= fim ? inicio : fim;
        const maxData = inicio <= fim ? fim : inicio;
        filtrados = filtrados.filter(d => d.mes >= minData && d.mes <= maxData);
      }
    }

    renderizarTimeline(filtrados);
    renderizarTabela(filtrados);
  }

  if (btnTimeline) {
    btnTimeline.addEventListener('click', () => alternarAba('timeline'));
  }

  if (btnTabela) {
    btnTabela.addEventListener('click', () => alternarAba('tabela'));
  }

  if (filtroRegiao) {
    filtroRegiao.addEventListener('change', atualizarVisualizacoes);
  }

  if (filtroPeriodo) {
    filtroPeriodo.addEventListener('change', () => {
      if (caixaIntervalo) {
        caixaIntervalo.style.display = filtroPeriodo.value === 'personalizado' ? 'flex' : 'none';
      }
      atualizarVisualizacoes();
    });
  }

  if (filtroDataInicio) {
    filtroDataInicio.addEventListener('change', atualizarVisualizacoes);
  }

  if (filtroDataFim) {
    filtroDataFim.addEventListener('change', atualizarVisualizacoes);
  }

  popularSeletoresIntervalo();
  atualizarVisualizacoes();
});
