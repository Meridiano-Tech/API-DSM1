"""Score territorial Credit42 v3.1, com dados de uma execução do Colab."""

import csv
import json
import math
import re
from collections import defaultdict
from pathlib import Path
from statistics import fmean

DIRETORIO_DADOS = Path(__file__).resolve().parent / "dados"
MODELO = "credit42-municipal-20-3.1"
MESES = tuple(f"{ano}-{mes:02d}" for ano in range(2024, 2027)
              for mes in range(1, (10 if ano == 2026 else 12) + 1))
REGIOES = ("Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul")
PESO_VOLUME = 0.60
PESO_PAGADORES = 0.40
AMP_INADIMPLENCIA = 0.15
APROVACAO = "NAO_HOMOLOGADO"


class DadosInconsistentes(ValueError):
    """Os artefatos do Colab não formam uma base compatível."""


class MunicipioNaoEncontrado(LookupError):
    """O município solicitado está fora do cadastro publicado."""


def numero(valor, campo, *, inteiro=False, positivo=False):
    if isinstance(valor, bool):
        raise ValueError(f"{campo} deve ser um número válido.")
    try:
        valor = float(valor)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f"{campo} deve ser um número válido.") from exc
    if not math.isfinite(valor) or valor < 0 or (positivo and valor == 0):
        limite = "positivo" if positivo else "maior ou igual a zero"
        raise ValueError(f"{campo} deve ser finito e {limite}.")
    if inteiro and not valor.is_integer():
        raise ValueError(f"{campo} deve ser um número inteiro.")
    return int(valor) if inteiro else valor


def intensidades(populacao, valor_pf, pagadores_pf):
    return valor_pf / populacao, pagadores_pf / populacao


def normalizar(valor, limites):
    minimo, maximo = limites
    return min(100.0, max(0.0, 100 * (valor - minimo) / (maximo - minimo)))


def downtrend(volume_norm, pagadores_norm):
    return PESO_VOLUME * volume_norm + PESO_PAGADORES * pagadores_norm


def pontuacao(indice):
    return round(300 + 7 * indice, 2)


class MotorScore:
    def __init__(self, diretorio_dados=DIRETORIO_DADOS):
        self.diretorio = Path(diretorio_dados)
        try:
            self._carregar()
        except (OSError, ValueError, KeyError, TypeError, csv.Error) as exc:
            raise DadosInconsistentes("Exportação do Colab indisponível ou incompatível.") from exc

    def _ler_json(self, nome):
        with (self.diretorio / nome).open(encoding="utf-8") as arquivo:
            return json.load(arquivo)

    def _carregar(self):
        painel = self._ler_json("dados_site.json")
        parametros = self._ler_json("parameters.json")
        proxy = parametros["downtrend_proxy"]
        periodo = [MESES[0], MESES[-1]]
        self.parameter_set_id = parametros["parameter_set_id"]
        if (
            painel["model_version"] != MODELO
            or parametros["model_version"] != MODELO
            or painel["schema_version"] != "3.0"
            or painel["parameter_set_id"] != self.parameter_set_id
            or painel["periodo"] != periodo
            or proxy["periodo"] != periodo
            or proxy["populacao"] != "Censo2022_total"
            or proxy["pesos"] != {"volume_pf": PESO_VOLUME, "pagadores_pf": PESO_PAGADORES}
            or proxy["amplitude_ajuste_inad"] != AMP_INADIMPLENCIA
            or painel["uso_decisorio_credito"] is not False
        ):
            raise DadosInconsistentes("Versão, recorte ou parâmetros incompatíveis.")

        catalogo = painel["catalogo_municipios"]
        self.municipios = {item["municipio_ibge"]: item for item in catalogo}
        if len(catalogo) != 20 or len(self.municipios) != 20 or set(self.municipios) != set(proxy["universo"]):
            raise DadosInconsistentes("O catálogo não corresponde ao universo de normalização.")

        grupos = self._ler_observacoes()
        referencia = [dados for observacoes in grupos.values() for dados in observacoes.values()]
        limites = []
        for coluna, nome in enumerate(("VolPix_per_capita", "Pagadores_per_capita")):
            valores = [dados[coluna] for dados in referencia]
            if not valores or min(valores) == max(valores):
                limites.append(None)
                continue
            minimo, maximo = min(valores), max(valores)
            publicado = proxy["limites"][nome]
            if not (math.isclose(minimo, publicado["min"]) and math.isclose(maximo, publicado["max"])):
                raise DadosInconsistentes("Os limites não correspondem às observações mensais.")
            limites.append((minimo, maximo))
        self.limites = tuple(limites)

        taxas = {
            item["mes"]: numero(item["valor_inad"], "taxa nacional")
            for item in painel["apoio"]["grafico_a1_evolucao_inadimplencia"]
            if item["mes"] in MESES and item["valor_inad"] is not None
        }
        if any(taxa > 100 for taxa in taxas.values()):
            raise DadosInconsistentes("Taxa nacional fora do intervalo percentual.")
        self.resultados = {
            codigo: self._resumir(municipio, grupos[codigo], taxas)
            for codigo, municipio in self.municipios.items()
        }
        self._validar_publicacao(painel)

    def _ler_observacoes(self):
        chaves = set()
        grupos = defaultdict(dict)
        with (self.diretorio / "municipal_metrics.csv").open(encoding="utf-8", newline="") as arquivo:
            for linha in csv.DictReader(arquivo):
                codigo, mes = linha["municipio_ibge"], linha["competencia"]
                chave = (codigo, mes)
                if (codigo not in self.municipios or mes not in MESES or chave in chaves
                        or linha["parameter_set_id"] != self.parameter_set_id
                        or linha["observado"] not in {"True", "False"}):
                    raise DadosInconsistentes("Linha municipal duplicada ou incompatível.")
                chaves.add(chave)
                pop_catalogo = self.municipios[codigo]["pop_total"]
                if not pop_catalogo:
                    if linha["pop_total"] and float(linha["pop_total"]) != pop_catalogo:
                        raise DadosInconsistentes("População da observação diverge do catálogo.")
                    continue
                populacao = numero(linha["pop_total"], "população", inteiro=True, positivo=True)
                if populacao != pop_catalogo:
                    raise DadosInconsistentes("População da observação diverge do catálogo.")
                if linha["observado"] == "True":
                    grupos[codigo][mes] = intensidades(
                        populacao,
                        numero(linha["valor_pf"], "valor Pix PF"),
                        numero(linha["pagadores_pf"], "pagadores PF", inteiro=True),
                    )
        if len(chaves) != len(self.municipios) * len(MESES):
            raise DadosInconsistentes("A grade municipal não cobre todo o recorte.")
        return grupos

    def _resumir(self, municipio, observacoes, taxas):
        series = {}
        if all(limite is not None for limite in self.limites):
            for mes, (volume, pagadores) in observacoes.items():
                volume_norm = normalizar(volume, self.limites[0])
                pagadores_norm = normalizar(pagadores, self.limites[1])
                series[mes] = (volume_norm, pagadores_norm, downtrend(volume_norm, pagadores_norm))

        componentes = {
            "volume_pf_normalizado": fmean(v[0] for v in series.values()) if series else None,
            "pagadores_pf_normalizados": fmean(v[1] for v in series.values()) if series else None,
        }
        indice = fmean(v[2] for v in series.values()) if series else None
        score = pontuacao(indice) if indice is not None else None
        competencia_inad = max(series.keys() & taxas.keys(), default=None)
        taxa_base = taxa_estimada = None
        if competencia_inad is not None:
            taxa_base = taxas[competencia_inad]
            indice_inad = fmean(v[2] for mes, v in series.items() if mes <= competencia_inad)
            fator = 1 + AMP_INADIMPLENCIA - 2 * AMP_INADIMPLENCIA * indice_inad / 100
            taxa_estimada = round(min(100.0, max(0.0, taxa_base * fator)), 4)

        return {
            "municipio_ibge": municipio["municipio_ibge"],
            "localidade": municipio["localidade"],
            "regiao": municipio["regiao"],
            "uf": municipio["uf"],
            "populacao": municipio["pop_total"],
            "modo": "territorial",
            "score_final": score,
            "Score_Inclusivo": score,
            "DowntrendProxy": indice,
            "status_score": "CALCULADO" if series else "SEM_DADO",
            "Aprovacao": APROVACAO,
            "competencia_calculada": max(series, default=None),
            "meses_validos": len(series),
            "meses_esperados": len(MESES),
            "cobertura_pct": 100 * len(series) / len(MESES),
            "componentes": componentes,
            "indicadores_base": {
                "inadimplencia_estimada": taxa_estimada,
                "taxa_base_bcb": taxa_base,
                "competencia_inadimplencia": competencia_inad,
                "status_inadimplencia": "ESTIMADO" if taxa_estimada is not None else "SEM_DADO",
            },
            "model_version": MODELO,
            "parameter_set_id": self.parameter_set_id,
        }

    def _validar_publicacao(self, painel):
        ranking = painel["principais"]["grafico_p2_ranking_score_municipal"]
        estimativas = painel["ranking_inadimplencia_municipal"]
        publicados = {item["municipio_ibge"]: item for item in ranking}
        taxas_publicadas = {item["municipio_ibge"]: item for item in estimativas}
        if (
            len(ranking) != len(self.resultados) or len(estimativas) != len(self.resultados)
            or publicados.keys() != self.resultados.keys()
            or taxas_publicadas.keys() != self.resultados.keys()
        ):
            raise DadosInconsistentes("Os rankings publicados divergem do cadastro.")
        for codigo, resultado in self.resultados.items():
            linha = publicados[codigo]
            taxa = taxas_publicadas[codigo]
            base = resultado["indicadores_base"]
            if (
                resultado["score_final"] != linha["score_final"]
                or resultado["meses_validos"] != linha["meses_validos"]
                or resultado["competencia_calculada"] != linha["competencia_calculada"]
                or base["inadimplencia_estimada"] != taxa["taxa_inadimplencia"]
                or base["competencia_inadimplencia"] != taxa["competencia_inadimplencia"]
            ):
                raise DadosInconsistentes("O cálculo do motor diverge do resultado publicado.")

    def gerar_ranking_benchmark(self):
        return sorted(
            self.resultados.values(),
            key=lambda item: (item["score_final"] is None, -(item["score_final"] or 0), item["localidade"]),
        )

    def calcular_score(self, *, municipio_ibge=None, localidade=None):
        if municipio_ibge is not None:
            codigo = str(municipio_ibge)
            if not re.fullmatch(r"[0-9]{7}", codigo):
                raise ValueError("Informe um código IBGE de sete dígitos.")
            if codigo in self.resultados:
                return self.resultados[codigo]
        elif isinstance(localidade, str) and localidade.strip():
            for item in self.resultados.values():
                if item["localidade"].casefold() == localidade.strip().casefold():
                    return item
        else:
            raise ValueError("Informe municipio_ibge ou localidade.")
        raise MunicipioNaoEncontrado("Município fora do cadastro. Use o modo cenário para uma simulação.")

    def simular(self, *, localidade, regiao, populacao, valor_pf, pagadores_pf):
        if not isinstance(localidade, str) or not localidade.strip():
            raise ValueError("Informe a localidade do cenário.")
        if regiao not in REGIOES:
            raise ValueError("Informe uma região brasileira válida.")
        populacao = numero(populacao, "população", inteiro=True, positivo=True)
        valor_pf = numero(valor_pf, "valor Pix PF")
        pagadores_pf = numero(pagadores_pf, "pagadores Pix PF", inteiro=True)
        if any(limite is None for limite in self.limites):
            raise DadosInconsistentes("Normalização indisponível para o cenário.")
        volume, pagadores = intensidades(populacao, valor_pf, pagadores_pf)
        volume_norm = normalizar(volume, self.limites[0])
        pagadores_norm = normalizar(pagadores, self.limites[1])
        indice = downtrend(volume_norm, pagadores_norm)
        return {
            "localidade": localidade.strip(),
            "regiao": regiao,
            "populacao": populacao,
            "modo": "cenario_mensal",
            "score_final": pontuacao(indice),
            "Score_Inclusivo": pontuacao(indice),
            "DowntrendProxy": indice,
            "Aprovacao": APROVACAO,
            "componentes": {
                "volume_pf_normalizado": volume_norm,
                "pagadores_pf_normalizados": pagadores_norm,
            },
            "model_version": MODELO,
            "parameter_set_id": self.parameter_set_id,
        }
