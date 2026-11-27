from html.parser import HTMLParser
from hashlib import sha256
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import math
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.motor_score import MESES, REGIOES, MotorScore


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"

PAGINAS = (
    "index.html",
    "composicao.html",
    "sobre.html",
)

# Séries estaduais usadas pelo Colab para as UFs do cadastro municipal.
SGS_ESTADUAL = {
    "AC": 15925, "AL": 15926, "AP": 15927, "AM": 15928,
    "BA": 15929, "CE": 15930, "ES": 15932, "GO": 15933,
    "MA": 15934, "MT": 15935, "MS": 15936, "MG": 15937,
    "PA": 15938, "PB": 15939, "PR": 15940, "PE": 15941,
    "PI": 15942, "RJ": 15943, "RN": 15944, "RS": 15945,
    "RO": 15946, "RR": 15947, "SC": 15948, "SP": 15949,
    "TO": 15951,
}


DADOS_PUBLICOS = ("dados_site.json", "perfil_radar.json")
DADOS_COLAB = (*DADOS_PUBLICOS, "parameters.json", "municipal_metrics.csv")


def validar_exportacao_colab(origem):
    def ler_json(nome):
        return json.loads((origem / nome).read_text(encoding="utf-8"))

    manifesto = ler_json("run_manifest.json")
    hashes = manifesto["output_sha256"]
    for nome in DADOS_COLAB:
        arquivo = origem / nome
        if sha256(arquivo.read_bytes()).hexdigest() != hashes.get(nome):
            raise ValueError(f"{nome} não corresponde ao run_manifest.json do Colab.")

    painel = ler_json("dados_site.json")
    parametros = ler_json("parameters.json")
    radar = ler_json("perfil_radar.json")
    if manifesto["status_tecnico"] != "APROVADO" or painel["quality_status"] != "APROVADO":
        raise ValueError("A exportação do Colab precisa ter status técnico APROVADO.")
    if any(dado["model_version"] != manifesto["model_version"] for dado in (painel, parametros, radar)):
        raise ValueError("Os arquivos não têm a mesma versão de modelo do manifesto.")
    if any(dado["parameter_set_id"] != manifesto["parameter_set_id"] for dado in (painel, parametros)):
        raise ValueError("Os arquivos não têm o mesmo conjunto de parâmetros do manifesto.")

    serie = painel.get("serie_inadimplencia_regional", [])
    fontes = painel["fontes"]["inadimplencia_regional"]
    meses = [linha["mes"] for linha in painel["principais"]["grafico_p1_serie_temporal_credito"]]
    esperadas = {(regiao, mes) for regiao in fontes for mes in meses}
    chaves = {(linha["regiao"], linha["competencia"]) for linha in serie}
    if len(serie) != len(esperadas) or chaves != esperadas:
        raise ValueError("Série mensal de inadimplência regional ausente ou com grade incompleta.")
    validar_semantica(painel)
    MotorScore(origem)  # Recalcula os 20 scores e estimativas a partir das observações.


def validar_semantica(painel):
    """Verifica o contrato publicado, além dos hashes e da aprovação do Colab."""
    def valor(v, campo, *, taxa=False, inteiro=False):
        if (isinstance(v, bool) or not isinstance(v, (int, float))
                or not math.isfinite(v) or v < 0 or (taxa and v > 100)
                or (inteiro and int(v) != v)):
            raise ValueError(f"Valor inválido em {campo}: {v!r}.")

    def grade(linhas, campos, esperadas):
        chaves = [tuple(linha[c] for c in campos) for linha in linhas]
        if len(chaves) != len(esperadas) or set(chaves) != esperadas:
            raise ValueError(f"Grade incompleta ou duplicada: {campos}.")

    fontes = painel['fontes']
    esperado_credito = dict(zip(REGIOES, (14093, 14094, 14095, 14096, 14097)))
    esperado_inad = dict(zip(REGIOES, (15952, 15953, 15954, 15955, 15956)))
    if fontes['credito_regional'] != esperado_credito or fontes['inadimplencia_regional'] != esperado_inad:
        raise ValueError("Séries SGS regionais incompatíveis com o contrato do projeto.")
    if fontes['pix'] != 'https://dadosabertos.bcb.gov.br/dataset/pix':
        raise ValueError("Fonte Pix não identificada.")
    credito = painel['principais']['grafico_p1_serie_temporal_credito']
    grade(credito, ('mes',), {(mes,) for mes in MESES})
    if [i['mes'] for i in credito] != list(MESES):
        raise ValueError("Competências da carteira fora da ordem temporal.")
    for item in credito:
        for regiao in REGIOES:
            if item[regiao] is not None:
                valor(item[regiao], 'carteira em R$ milhões')

    taxas = painel['serie_inadimplencia_regional']
    grade(taxas, ('regiao', 'competencia'), {(r, m) for r in REGIOES for m in MESES})
    for item in taxas:
        if item['serie_sgs'] != esperado_inad[item['regiao']]:
            raise ValueError("Taxa regional associada à série SGS incorreta.")
        if item['valor'] is None:
            if (item['data_status'] != 'SEM_DADO'
                    or item['reason_code'] != 'COMPETENCIA_SEM_PUBLICACAO_NESTA_CONSULTA'):
                raise ValueError("Taxa ausente sem justificativa de publicação.")
        else:
            valor(item['valor'], 'taxa regional (%)', taxa=True)
            if item['data_status'] != 'CALCULADO' or item['reason_code'] != 'OK':
                raise ValueError("Taxa regional presente com status ou motivo incompatível.")
    nacional = painel['apoio']['grafico_a1_evolucao_inadimplencia']
    if [item['mes'] for item in nacional] != list(MESES):
        raise ValueError("Grade nacional de inadimplência incompleta, repetida ou fora de ordem.")
    for item in nacional:
        if item['valor_inad'] is not None:
            valor(item['valor_inad'], 'taxa nacional (%)', taxa=True)
    estados = painel['inadimplencia_estadual']
    ufs = {m['uf'] for m in painel['catalogo_municipios']}
    grade(estados, ('uf', 'competencia'), {(uf, mes) for uf in ufs for mes in MESES})
    for item in estados:
        codigo = SGS_ESTADUAL.get(item['uf'])
        url = urlsplit(item['source_url'])
        if (codigo is None or item['serie_sgs'] != codigo or item['unidade'] != 'percentual_taxa'
                or url.scheme != 'https' or url.netloc != 'api.bcb.gov.br'
                or url.path != f'/dados/serie/bcdata.sgs.{codigo}/dados'):
            raise ValueError("Unidade ou fonte estadual incompatível com a UF.")
        if item['valor'] is not None:
            valor(item['valor'], 'taxa estadual (%)', taxa=True)
            if item['data_status'] != 'CALCULADO' or item['reason_code'] != 'OK':
                raise ValueError("Taxa estadual presente com status ou motivo incompatível.")
        elif item['data_status'] != 'SEM_DADO' or item['reason_code'] in ('OK', '', None):
            raise ValueError("Taxa estadual ausente sem justificativa.")

    regioes = painel['pix_regioes']
    brasil = painel['pix_brasil']
    grade(regioes, ('regiao', 'competencia'), {(r, m) for r in (*REGIOES, 'Não informado') for m in MESES})
    grade(brasil, ('competencia',), {(m,) for m in MESES})
    campos = ('valor_pf', 'valor_pj', 'vol_pix_total', 'quantidade_pf', 'quantidade_pj', 'quantidade_total')
    for item in [*brasil, *regioes]:
        for campo in campos:
            valor(item[campo], campo, inteiro=campo.startswith('quantidade'))
        for prefixo, total in (('valor', 'vol_pix_total'), ('quantidade', 'quantidade_total')):
            if not math.isclose(item[f'{prefixo}_pf'] + item[f'{prefixo}_pj'], item[total], rel_tol=1e-12, abs_tol=.02):
                raise ValueError("Pix PF/PJ não concilia com o total.")
    for item in brasil:
        linhas = [r for r in regioes if r['competencia'] == item['competencia']]
        for campo in campos:
            if not math.isclose(sum(r[campo] for r in linhas), item[campo], rel_tol=1e-12, abs_tol=.02):
                raise ValueError("Pix nacional não concilia com regiões e Não informado.")

    meta = painel['cards_metadata']
    if (meta['vol_pix_geral']['unidade'] != 'BRL_nominal'
            or meta['inadimplencia_media']['unidade'] != 'percentual'
            or painel['score_metadata']['periodo_agregacao'] != [MESES[0], MESES[-1]]):
        raise ValueError("Unidades ou janela do score incompatíveis.")


class ValidadorHTML(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for atributo, valor in attrs:
            if atributo not in {"href", "src"} or not valor:
                continue

            url = urlsplit(valor)

            # Ignora URLs externas, âncoras e recursos sem caminho local.
            if url.scheme or url.netloc or not url.path:
                continue

            caminho = (SITE / unquote(url.path)).resolve()

            if not caminho.is_relative_to(SITE):
                raise ValueError(
                    f"Referência fora do pacote publicado: {valor}"
                )

            if not caminho.is_file():
                raise FileNotFoundError(
                    f"Arquivo referenciado não encontrado: {valor}"
                )


def copiar_pagina(nome):
    origem = ROOT / nome

    if not origem.is_file():
        raise FileNotFoundError(f"Página não encontrada: {origem}")

    destino = SITE / nome
    shutil.copy2(origem, destino)


def copiar_diretorio(nome):
    origem = ROOT / nome
    destino = SITE / nome

    if not origem.is_dir():
        raise FileNotFoundError(f"Diretório não encontrado: {origem}")

    shutil.copytree(origem, destino)


def copiar_dados():
    destino = SITE / "dados"
    destino.mkdir(parents=True, exist_ok=True)

    for nome in DADOS_PUBLICOS:
        origem = ROOT / "dados" / nome

        if not origem.is_file():
            raise FileNotFoundError(f"Arquivo de dados não encontrado: {origem}")

        shutil.copy2(origem, destino / nome)


def validar_paginas():
    for nome in PAGINAS:
        parser = ValidadorHTML()
        parser.feed((SITE / nome).read_text(encoding="utf-8"))


def main():
    validar_exportacao_colab(ROOT / "dados")

    if SITE.exists():
        shutil.rmtree(SITE)

    SITE.mkdir(parents=True)

    for pagina in PAGINAS:
        copiar_pagina(pagina)

    copiar_diretorio("css")
    copiar_diretorio("js")
    copiar_dados()

    # Impede que o GitHub Pages tente processar o site com Jekyll.
    (SITE / ".nojekyll").touch()

    validar_paginas()

    print("Pacote do GitHub Pages criado com sucesso em _site/")


if __name__ == "__main__":
    main()
