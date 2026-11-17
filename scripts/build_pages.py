from html.parser import HTMLParser
from hashlib import sha256
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import shutil


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"

PAGINAS = (
    "index.html",
    "composicao.html",
    "sobre.html",
)

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
