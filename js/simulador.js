"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-score");
  const selecao = document.getElementById("select-municipio");
  const campos = document.getElementById("campos-cenario");
  const botao = document.getElementById("btn-calcular");
  const erro = document.getElementById("simulador-erro");
  const status = document.getElementById("simulador-status");
  const vazio = document.getElementById("resultado-vazio");
  const ativo = document.getElementById("resultado-ativo");
  let apiDisponivel = false;
  let dados;
  let ranking = [];
  const fmt = valor => valor.toLocaleString("pt-BR", { maximumFractionDigits: 4 });

  function exibir(resultado) {
    const cenario = resultado.modo === "cenario_mensal";
    const score = resultado.score_final;
    const taxa = resultado.indicadores_base;
    document.getElementById("res-cidade").textContent = resultado.localidade;
    document.getElementById("res-regiao").textContent = resultado.regiao;
    document.getElementById("res-score").textContent = score == null ? "—" : numeroCredit42.format(score);
    document.getElementById("res-faixa").textContent = cenario ? "Cenário de um mês" : "Score municipal";
    document.getElementById("res-downtrend").textContent = resultado.DowntrendProxy == null
      ? "Downtrend Proxy indisponível."
      : `Downtrend Proxy ${fmt(resultado.DowntrendProxy)} / 100`;
    document.getElementById("res-cobertura").textContent = cenario
      ? "Referência de normalização de jan/2024 a out/2026."
      : `Cobertura de ${resultado.meses_validos} de ${resultado.meses_esperados} meses. Última competência ${resultado.competencia_calculada ?? "indisponível"}.`;
    document.getElementById("res-inadimplencia").textContent = cenario ? "" :
      taxa?.inadimplencia_estimada == null ? "Estimativa de inadimplência indisponível." :
        `Inadimplência estimada de ${fmt(taxa.inadimplencia_estimada)}% em ${taxa.competencia_inadimplencia}.`;
    vazio.hidden = true;
    ativo.hidden = false;
  }

  function resultadoPublicado(codigo) {
    const resultado = ranking.find(item => item.municipio_ibge === codigo);
    const taxa = dados.ranking_inadimplencia_municipal.find(item => item.municipio_ibge === codigo);
    return {
      ...resultado,
      meses_esperados: 34,
      indicadores_base: {
        inadimplencia_estimada: taxa?.taxa_inadimplencia,
        competencia_inadimplencia: taxa?.competencia_inadimplencia,
      },
    };
  }

  function limparResultado() {
    ativo.hidden = true;
    vazio.hidden = false;
    vazio.textContent = selecao.value === "cenario"
      ? "Informe os dados do cenário e consulte o resultado."
      : "Escolha um município para consultar seu score.";
    erro.hidden = true;
  }
  campos.addEventListener("input", limparResultado);
  selecao.addEventListener("change", () => {
    campos.disabled = selecao.value !== "cenario";
    campos.hidden = campos.disabled;
    document.getElementById("simulador-desc-cenario").hidden = campos.disabled;
    botao.disabled = !selecao.value;
    limparResultado();
  });

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    const codigo = selecao.value;
    if (!codigo) return;

    limparResultado();
    botao.disabled = true;
    selecao.disabled = true;
    try {
      // Municípios sempre usam a mesma exportação exibida nos gráficos.
      if (codigo !== "cenario") {
        exibir(resultadoPublicado(codigo));
        return;
      }
      const payload = { modo: "cenario_mensal", ...Object.fromEntries(new FormData(form)) };
      campos.disabled = true;
      const resultado = await requisicaoCredit42("./api/calcular-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resultado?.modo !== "cenario_mensal" || resultado.model_version !== dados.model_version
          || resultado.parameter_set_id !== dados.parameter_set_id
          || !Number.isFinite(resultado.score_final) || resultado.score_final < 300 || resultado.score_final > 1000
          || !Number.isFinite(resultado.DowntrendProxy) || resultado.DowntrendProxy < 0 || resultado.DowntrendProxy > 100) {
        throw new Error("Resposta de cenário incompatível com a base publicada.");
      }
      exibir(resultado);
    } catch (falha) {
      erro.textContent = falha.name === "AbortError"
        ? "O cálculo excedeu o tempo de espera. Tente novamente."
        : "Não foi possível calcular o cenário. Verifique os campos e tente novamente. A consulta dos municípios publicados continua disponível.";
      erro.hidden = false;
    } finally {
      botao.disabled = false;
      selecao.disabled = false;
      campos.disabled = codigo !== "cenario";
    }
  });

  try {
    dados = await carregarDadosCredit42();
    ranking = dados.principais.grafico_p2_ranking_score_municipal;
    for (const item of ranking) {
      selecao.add(new Option(`${item.localidade} (${item.regiao})`, item.municipio_ibge));
    }
    selecao.disabled = false;
    status.textContent = `Consulte os scores publicados para os ${ranking.length} municípios.`;
  } catch {
    erro.textContent = "Não foi possível carregar o cadastro de municípios.";
    erro.hidden = false;
    return;
  }

  try {
    const apiRanking = await requisicaoCredit42("./api/ranking");
    const codigos = new Set(ranking.map(item => item.municipio_ibge));
    apiDisponivel = Array.isArray(apiRanking) && apiRanking.length === codigos.size &&
      new Set(apiRanking.map(item => item.municipio_ibge)).size === codigos.size &&
      apiRanking.every(item => codigos.has(item.municipio_ibge) &&
        item.parameter_set_id === dados.parameter_set_id && item.model_version === dados.model_version);
  } catch {
    apiDisponivel = false;
  }
  if (apiDisponivel) {
    selecao.add(new Option("Simular um cenário mensal", "cenario"));
    status.textContent = "Selecione um município ou escolha a opção de simulação.";
  } else {
    status.textContent = "Consulte os 70 municípios publicados. Simulação mensal indisponível nesta versão.";
  }
});
