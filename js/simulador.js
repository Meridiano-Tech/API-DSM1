document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-score');
  const selectMunicipio = document.getElementById('select-municipio');
  const btnCalcular = document.getElementById('btn-calcular');
  const btnTexto = btnCalcular ? btnCalcular.querySelector('.btn-texto') : null;
  const btnLoading = btnCalcular ? btnCalcular.querySelector('.btn-loading') : null;

  const painelVazio = document.getElementById('resultado-vazio');
  const painelAtivo = document.getElementById('resultado-ativo');

  let benchmarkDados = [];

  async function carregarMunicipiosBenchmark() {
    try {
      const resposta = await fetch('/api/ranking');
      if (!resposta.ok) return;
      benchmarkDados = await resposta.json();

      if (selectMunicipio && benchmarkDados.length > 0) {
        benchmarkDados.forEach(muni => {
          const opt = document.createElement('option');
          opt.value = muni.localidade;
          opt.textContent = `${muni.localidade} (${muni.regiao}) — Score: ${muni.score_final}`;
          selectMunicipio.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Não foi possível carregar o ranking inicial:', e);
    }
  }

  if (selectMunicipio) {
    selectMunicipio.addEventListener('change', () => {
      const selecionado = benchmarkDados.find(m => m.localidade === selectMunicipio.value);
      if (selecionado) {
        document.getElementById('campo-localidade').value = selecionado.localidade;
        document.getElementById('campo-regiao').value = selecionado.regiao;
        document.getElementById('campo-populacao').value = selecionado.populacao;
        document.getElementById('campo-renda').value = selecionado.renda_per_capita;
        const inad = selecionado.indicadores_base?.inadimplencia_estimada || 5.6;
        document.getElementById('campo-inadimplencia').value = inad;
        calcularScoreAssincrono();
      }
    });
  }

  function exibirResultado(res) {
    if (!painelAtivo) return;

    if (painelVazio) painelVazio.style.display = 'none';
    painelAtivo.style.display = 'block';

    document.getElementById('res-cidade').textContent = res.localidade;
    document.getElementById('res-regiao').textContent = res.regiao;
    document.getElementById('res-score').textContent = res.score_final;
    document.getElementById('res-faixa').textContent = res.faixa_score;

    const elClasse = document.getElementById('res-classe');
    if (elClasse) {
      elClasse.textContent = `Classe ${res.classe_risco}`;
      elClasse.className = `score-badge-classe classe-${res.classe_risco.toLowerCase()}`;
    }

    document.getElementById('res-pilar-micro').textContent = `${res.pilar_micro.toFixed(1)} / 100`;
    document.getElementById('barra-micro').style.width = `${Math.min(100, Math.max(0, res.pilar_micro))}%`;

    document.getElementById('res-pilar-macro').textContent = `${res.pilar_macro.toFixed(1)} / 100`;
    document.getElementById('barra-macro').style.width = `${Math.min(100, Math.max(0, res.pilar_macro))}%`;

    const cluster = res.cluster_ia || {};
    document.getElementById('res-cluster-nome').textContent = cluster.categoria || 'Perfil Territorial';
    document.getElementById('res-ia-recomendacao').textContent = cluster.recomendacao || '';

    const elBets = document.getElementById('res-bets');
    if (elBets) {
      elBets.textContent = `${res.comp_bets_percent}% da renda local`;
    }

    painelAtivo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function calcularScoreAssincrono() {
    const localidade = document.getElementById('campo-localidade').value.trim();
    const regiao = document.getElementById('campo-regiao').value;
    const populacao = Number(document.getElementById('campo-populacao').value);
    const renda_per_capita = Number(document.getElementById('campo-renda').value);
    const inadimplencia_local = Number(document.getElementById('campo-inadimplencia').value);

    if (!localidade) return;

    if (btnTexto && btnLoading) {
      btnTexto.style.display = 'none';
      btnLoading.style.display = 'inline';
      btnCalcular.disabled = true;
    }

    try {
      const resposta = await fetch('/api/calcular-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localidade,
          regiao,
          populacao,
          renda_per_capita,
          inadimplencia_local
        })
      });

      if (!resposta.ok) {
        throw new Error('Falha ao processar cálculo');
      }

      const dados = await resposta.json();
      exibirResultado(dados);
    } catch (erro) {
      alert('Erro ao calcular score territorial. Verifique os valores informados.');
    } finally {
      if (btnTexto && btnLoading) {
        btnTexto.style.display = 'inline';
        btnLoading.style.display = 'none';
        btnCalcular.disabled = false;
      }
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calcularScoreAssincrono();
    });
  }

  carregarMunicipiosBenchmark();
});
