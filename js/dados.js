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
