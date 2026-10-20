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

function preencher(seletor, texto) {
  const el = document.querySelector(seletor);
  if (el) el.textContent = texto;
}

async function carregarCards() {
  try {
    const resposta = await fetch('dados_site.json');
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    const dados = await resposta.json();
    const cards = dados.cards;

           // Card 1: região com maior crescimento da carteira de crédito
    const norte = cards.yoy_norte;
    const nordeste = cards.yoy_nordeste;

    if (norte === nordeste) {
      preencher('#card-1 .cardvalor', formatarPercentual(norte, true));
      preencher('#card-1 .carddetalhe', 'Maior crescimento: Norte e Nordeste');
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
    preencher('#card-3 .carddetalhe', 'Inadimplência média das regiões Norte e Nordeste');
  } catch (erro) {
    console.error('Erro ao carregar os cards:', erro);
  }
}

carregarCards();