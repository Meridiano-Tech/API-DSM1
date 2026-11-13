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
    document.getElementById("res-score").textContent = score == null ? "—" : fmt(score);
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

  selecao.addEventListener("change", () => {
    campos.disabled = selecao.value !== "cenario";
    campos.hidden = campos.disabled;
    botao.disabled = !selecao.value;
    erro.hidden = true;
    ativo.hidden = true;
    vazio.hidden = false;
  });

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    const codigo = selecao.value;
    if (!codigo) return;

    erro.hidden = true;
    botao.disabled = true;
    selecao.disabled = true;
    try {
      if (!apiDisponivel) {
        exibir(resultadoPublicado(codigo));
        return;
      }
      const payload = codigo === "cenario"
        ? { modo: "cenario_mensal", ...Object.fromEntries(new FormData(form)) }
        : { municipio_ibge: codigo };
      const resposta = await fetch("./api/calcular-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível calcular o score.");
      exibir(resultado);
    } catch (falha) {
      erro.textContent = falha.message;
      erro.hidden = false;
    } finally {
      botao.disabled = false;
      selecao.disabled = false;
    }
  });

  try {
    dados = await carregarDadosCredit42();
    ranking = dados.principais.grafico_p2_ranking_score_municipal;
    for (const item of ranking) {
      selecao.add(new Option(`${item.localidade} (${item.regiao})`, item.municipio_ibge));
    }
    selecao.disabled = false;
    status.textContent = "Consulte os scores publicados para os 20 municípios.";
  } catch {
    erro.textContent = "Não foi possível carregar o cadastro de municípios.";
    erro.hidden = false;
    return;
  }

  try {
    const resposta = await fetch("./api/ranking");
    if (resposta.ok) {
      const apiRanking = await resposta.json();
      apiDisponivel = Array.isArray(apiRanking) && apiRanking.length === ranking.length &&
        apiRanking.every(item => item.parameter_set_id === dados.parameter_set_id);
    }
  } catch {
    apiDisponivel = false;
  }
  if (apiDisponivel) {
    selecao.add(new Option("Simular um cenário mensal", "cenario"));
    status.textContent = "Selecione um município ou escolha a opção de simulação.";
  } else {
    status.textContent = "Consulte a base publicada. A simulação requer a aplicação Flask.";
  }
});
