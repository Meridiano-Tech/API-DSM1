document.addEventListener('DOMContentLoaded', () => {
  const btnTimeline = document.getElementById('btn-ver-timeline');
  const btnTabela = document.getElementById('btn-ver-tabela');
  const painelTimeline = document.getElementById('painel-timeline');
  const painelTabela = document.getElementById('painel-tabela');
  const filtroRegiao = document.getElementById('filtro-regiao-extrato');
  const listaTimeline = document.getElementById('timeline-lista');
  const corpoTabela = document.getElementById('tabela-extrato-corpo');

  const dadosExtrato = [
    {
      mes: '2024-01',
      mesFormatado: 'Jan/2024',
      regiao: 'Norte',
      carteiraBi: 335.5,
      pixMi: 150.0,
      inadimplencia: 5.4,
      status: 'Início de Ciclo',
      classeStatus: 'status-azul',
      evento: 'Aceleração de abertura de contas digitais e inclusão de pessoas físicas via Pix em municípios do interior.'
    },
    {
      mes: '2024-01',
      mesFormatado: 'Jan/2024',
      regiao: 'Nordeste',
      carteiraBi: 940.1,
      pixMi: 450.0,
      inadimplencia: 5.8,
      status: 'Início de Ciclo',
      classeStatus: 'status-azul',
      evento: 'Demanda reprimida por microcrédito orientado em centros comerciais e cidades polo regionais.'
    },
    {
      mes: '2024-01',
      mesFormatado: 'Jan/2024',
      regiao: 'Sudeste',
      carteiraBi: 3500.2,
      pixMi: 1800.0,
      inadimplencia: 5.2,
      status: 'Polo Consolidado',
      classeStatus: 'status-verde',
      evento: 'Forte presença de crédito empresarial PJ e alta rotação comercial estruturada.'
    },
    {
      mes: '2024-06',
      mesFormatado: 'Jun/2024',
      regiao: 'Norte',
      carteiraBi: 353.0,
      pixMi: 205.0,
      inadimplencia: 5.5,
      status: 'Pico Meio de Ano',
      classeStatus: 'status-verde',
      evento: 'Aquecimento do comércio varejista local e aumento de transações Pix pessoa física/jurídica.'
    },
    {
      mes: '2024-06',
      mesFormatado: 'Jun/2024',
      regiao: 'Nordeste',
      carteiraBi: 990.4,
      pixMi: 610.0,
      inadimplencia: 5.9,
      status: 'Pico Meio de Ano',
      classeStatus: 'status-verde',
      evento: 'Festividades regionais impulsionam liquidez de pequenos negócios e giro de recebíveis.'
    },
    {
      mes: '2024-12',
      mesFormatado: 'Dez/2024',
      regiao: 'Norte',
      carteiraBi: 369.3,
      pixMi: 260.0,
      inadimplencia: 5.6,
      status: 'Pico Fim de Ano',
      classeStatus: 'status-amarelo',
      evento: 'Injeção do 13º salário na economia local com alerta preventivo para comprometimento de renda com apostas (bets).'
    },
    {
      mes: '2024-12',
      mesFormatado: 'Dez/2024',
      regiao: 'Nordeste',
      carteiraBi: 1036.2,
      pixMi: 770.0,
      inadimplencia: 6.1,
      status: 'Pico Fim de Ano',
      classeStatus: 'status-amarelo',
      evento: 'Volume transacional recorde; analistas recomendam calibragem de limites e crédito sustentável.'
    },
    {
      mes: '2024-12',
      mesFormatado: 'Dez/2024',
      regiao: 'Sudeste',
      carteiraBi: 3850.4,
      pixMi: 3100.0,
      inadimplencia: 5.3,
      status: 'Alta Liquidez',
      classeStatus: 'status-verde',
      evento: 'Absorção massiva de crédito para compras sazonais e antecipação de faturamento comercial.'
    },
    {
      mes: '2025-06',
      mesFormatado: 'Jun/2025',
      regiao: 'Norte',
      carteiraBi: 388.5,
      pixMi: 290.0,
      inadimplencia: 5.4,
      status: 'Expansão Saudável',
      classeStatus: 'status-verde',
      evento: 'Consolidação das diretrizes de crédito inclusivo com baixa inadimplência relativa.'
    },
    {
      mes: '2025-06',
      mesFormatado: 'Jun/2025',
      regiao: 'Nordeste',
      carteiraBi: 1089.9,
      pixMi: 860.0,
      inadimplencia: 5.7,
      status: 'Expansão Saudável',
      classeStatus: 'status-verde',
      evento: 'Estabilização de pagadores únicos e redução de fragilidade de renda domiciliar.'
    },
    {
      mes: '2025-12',
      mesFormatado: 'Dez/2025',
      regiao: 'Sul',
      carteiraBi: 1462.3,
      pixMi: 820.0,
      inadimplencia: 4.9,
      status: 'Polo Consolidado',
      classeStatus: 'status-verde',
      evento: 'Índices de pontualidade acima da média nacional e forte penetração de crédito cooperativo.'
    },
    {
      mes: '2026-10',
      mesFormatado: 'Out/2026',
      regiao: 'Norte',
      carteiraBi: 429.8,
      pixMi: 320.0,
      inadimplencia: 5.2,
      status: 'Cenário Vigente',
      classeStatus: 'status-azul',
      evento: 'Consolidação da inteligência de dados BCB com carteira em ritmo sustentável.'
    },
    {
      mes: '2026-10',
      mesFormatado: 'Out/2026',
      regiao: 'Nordeste',
      carteiraBi: 1205.7,
      pixMi: 950.0,
      inadimplencia: 5.6,
      status: 'Cenário Vigente',
      classeStatus: 'status-azul',
      evento: 'Equilíbrio entre oportunidade de expansão e mitigação de risco de endividamento.'
    },
    {
      mes: '2026-10',
      mesFormatado: 'Out/2026',
      regiao: 'Sudeste',
      carteiraBi: 4480.5,
      pixMi: 3900.0,
      inadimplencia: 5.1,
      status: 'Cenário Vigente',
      classeStatus: 'status-azul',
      evento: 'Maior concentração de capital financeiro e estabilidade nos pagamentos recorrentes.'
    }
  ];

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
          <p class="timeline-desc">${item.evento}</p>
          <div class="timeline-metricas">
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Carteira de Crédito</span>
              <strong class="metrica-valor">R$ ${item.carteiraBi.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Bi</strong>
            </div>
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Volume Pix</span>
              <strong class="metrica-valor">${item.pixMi.toLocaleString('pt-BR')} Mi</strong>
            </div>
            <div class="metrica-bloco">
              <span class="metrica-rotulo">Inadimplência</span>
              <strong class="metrica-valor">${item.inadimplencia.toFixed(1)}%</strong>
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
        <td>R$ ${item.carteiraBi.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Bi</td>
        <td>${item.pixMi.toLocaleString('pt-BR')} Mi</td>
        <td>${item.inadimplencia.toFixed(1)}%</td>
        <td><span class="badge-status ${item.classeStatus}">${item.status}</span></td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  function atualizarVisualizacoes() {
    const regiaoSel = filtroRegiao ? filtroRegiao.value : 'todas';
    const filtrados = regiaoSel === 'todas'
      ? dadosExtrato
      : dadosExtrato.filter(d => d.regiao.toLowerCase() === regiaoSel.toLowerCase());

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

  atualizarVisualizacoes();
});
