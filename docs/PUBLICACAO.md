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
```

## Dados do Colab e motor territorial

Copie `dados_site.json`, `parameters.json`, `municipal_metrics.csv` e `perfil_radar.json` da **mesma execução** do Colab para `dados/`. Reinicie o Flask depois de trocar os arquivos. O motor valida o recorte, o conjunto de parâmetros e a concordância entre os scores recalculados e o ranking exportado. A base incluída neste conjunto de alterações é a execução `20261108T162802329411Z`.

A série usa janeiro/2024 a outubro/2026 e os 20 municípios definidos no Colab. O Downtrend combina volume Pix PF nominal por habitante (60%) e pagadores PF distintos por habitante (40%), após normalização min–max. O score é `300 + 7 × média do Downtrend dos meses válidos`. A inadimplência estimada é exibida com a competência da série nacional usada como base.

| Método e rota | Entrada | Resultado |
|---|---|---|
| `GET /api/ranking` | Sem corpo. | Ranking territorial, cobertura, competências e estimativa municipal. |
| `POST /api/calcular-score` | `{"municipio_ibge":"1504208"}` | Resultado do município de código 1504208. O campo `localidade` também é aceito para consulta pelo nome do cadastro. |
| `POST /api/calcular-score` | `modo: "cenario_mensal"`, `localidade`, `regiao`, `populacao`, `valor_pf` e `pagadores_pf`. | Score hipotético de um mês com os limites da base publicada. |

O navegador lê os gráficos e o ranking publicado de `dados/dados_site.json`. O pacote estático do GitHub Pages permite consultar os municípios publicados. A opção de simular um mês fica disponível quando o Flask responde com o mesmo conjunto de parâmetros.

## Publicação no GitHub Pages

Para publicar a versão de `develop`, abra **Settings → Pages → Build and deployment**. Selecione **Deploy from a branch**, a branch `develop` e a pasta `/(root)`. Acompanhe **Actions → pages build and deployment** e confira se o commit publicado corresponde ao commit enviado para `develop`.

O ranking, os gráficos, os filtros por região, porte e busca, e o CSV filtrado usam a exportação do Colab. O filtro de renda permanece indisponível enquanto a exportação não trouxer esse indicador. A simulação mensal requer Flask. A consulta municipal publicada funciona no Pages.
