"""Confere os dados do Colab e os arquivos da interface servidos pelo Pages."""
import argparse
import json
import time
from hashlib import sha256
from urllib.error import URLError
from urllib.request import Request, urlopen

# Permite executar pelo caminho do script ou importar o módulo nos testes.
if __package__:
    from .build_pages import DADOS_PUBLICOS, PAGINAS, ROOT
else:
    from build_pages import DADOS_PUBLICOS, PAGINAS, ROOT


def digest_interface(conteudo):
    # O Git pode usar CRLF no checkout Windows e LF no runner de publicação.
    return sha256(conteudo.replace(b'\r\n', b'\n')).hexdigest()


def verificar(url, tentativas=6):
    if tentativas < 1:
        raise ValueError('Informe pelo menos uma tentativa.')
    manifesto = json.loads((ROOT / 'dados/run_manifest.json').read_text(encoding='utf-8'))
    pendentes = {f'dados/{nome}': manifesto['output_sha256'][nome] for nome in DADOS_PUBLICOS}
    interface = [ROOT / pagina for pagina in PAGINAS]
    for pasta, extensao in [('js', '*.js'), ('css', '*.css')]:
        interface.extend((ROOT / pasta).rglob(extensao))
    for arquivo in interface:
        pendentes[arquivo.relative_to(ROOT).as_posix()] = digest_interface(arquivo.read_bytes())

    for tentativa in range(tentativas):
        for nome, esperado in list(pendentes.items()):
            endereco = f"{url.rstrip('/')}/{nome}?versao={esperado}"
            req = Request(endereco, headers={'Cache-Control': 'no-cache'})
            try:
                with urlopen(req, timeout=15) as resposta:
                    conteudo = resposta.read()
            except (URLError, OSError) as erro:
                print(f'{nome}: {erro}', flush=True)
                continue
            obtido = sha256(conteudo).hexdigest() if nome.startswith('dados/') else digest_interface(conteudo)
            if obtido == esperado:
                del pendentes[nome]
        if not pendentes:
            print('Publicação conferida. Dados e interface correspondem à revisão esperada.')
            return
        print(f"Tentativa {tentativa + 1}/{tentativas}. Pendentes: {', '.join(pendentes)}", flush=True)
        if tentativa + 1 < tentativas:
            time.sleep(5)
    raise SystemExit('Arquivos indisponíveis ou divergentes: ' + ', '.join(pendentes))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url', help='URL raiz do site, incluindo o caminho do repositório')
    verificar(parser.parse_args().url)
