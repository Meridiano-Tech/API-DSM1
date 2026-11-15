"use strict";

let leituraCredit42;

function carregarDadosCredit42() {
  leituraCredit42 ??= fetch("./dados/dados_site.json").then(resposta => {
    if (!resposta.ok) throw new Error(`Dados do Credit42 indisponíveis (HTTP ${resposta.status}).`);
    return resposta.json();
  });
  return leituraCredit42;
}

const REGIOES_CREDIT42 = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
