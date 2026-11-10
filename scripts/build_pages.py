from html.parser import HTMLParser
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

    arquivos = (
        "dados_site.json",
        "perfil_radar.json",
    )

    for nome in arquivos:
        origem = ROOT / "dados" / nome

        if not origem.is_file():
            raise FileNotFoundError(f"Arquivo de dados não encontrado: {origem}")

        json.loads(origem.read_text(encoding="utf-8"))
        shutil.copy2(origem, destino / nome)


def validar_paginas():
    for nome in PAGINAS:
        parser = ValidadorHTML()
        parser.feed((SITE / nome).read_text(encoding="utf-8"))


def main():
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