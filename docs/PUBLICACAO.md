# Organização e publicação

## Estrutura do projeto

Os arquivos principais da aplicação permanecem na raiz porque o Flask utiliza esses caminhos atualmente.

- `app.py`: aplicação Flask e rotas da API.
- `motor_score.py`: regras do motor de score.
- `index.html`, `composicao.html` e `sobre.html`: páginas do frontend.
- `css/`: estilos e imagens.
- `js/`: scripts do navegador.
- `dados/`: arquivos JSON utilizados pelo frontend.
- `testes/`: testes automatizados.
- `scripts/`: scripts auxiliares de automação.
- `.github/workflows/`: configurações do GitHub Actions.
- `docs/`: documentação do projeto e das sprints.

## Validação local

Na raiz do repositório, execute:

```bash
python -m unittest discover -s testes -p "testes_*.py" -v
python scripts/build_pages.py