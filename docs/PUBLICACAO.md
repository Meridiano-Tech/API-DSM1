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

Execute todas as células do Colab, incluindo o bloco final de gráficos, e baixe o ZIP `credit42_outputs`. Copie `dados_site.json`, `parameters.json`, `municipal_metrics.csv`, `perfil_radar.json` e `run_manifest.json` da **mesma execução** para `dados/`. Preserve os arquivos originais para que os hashes SHA-256 continuem válidos.

Execute os testes e o build antes de enviar os cinco arquivos em um único commit. O build valida os hashes, a versão, o conjunto de parâmetros e o status técnico. O motor valida o recorte e a concordância entre os scores recalculados e o ranking exportado. Reinicie o Flask depois de trocar os arquivos. A base incluída é a execução `20261108T162802329411Z`.

A série usa janeiro/2024 a outubro/2026 e os 20 municípios definidos no Colab. O Downtrend combina volume Pix PF nominal por habitante (60%) e pagadores PF distintos por habitante (40%), após normalização min–max. O score é `300 + 7 × média do Downtrend dos meses válidos`. A inadimplência estimada é exibida com a competência da série nacional usada como base.

| Método e rota | Entrada | Resultado |
|---|---|---|
| `GET /api/ranking` | Sem corpo. | Ranking territorial, cobertura, competências e estimativa municipal. |
| `POST /api/calcular-score` | `{"municipio_ibge":"1504208"}` | Resultado do município de código 1504208. O campo `localidade` também é aceito para consulta pelo nome do cadastro. |
| `POST /api/calcular-score` | `modo: "cenario_mensal"`, `localidade`, `regiao`, `populacao`, `valor_pf` e `pagadores_pf`. | Score hipotético de um mês com os limites da base publicada. |

O navegador lê os gráficos e o ranking publicado de `dados/dados_site.json`. O Extrato usa `serie_inadimplencia_regional` por competência e região. O ranking regional mantém a última competência comum às cinco regiões. Quando o SGS não retorna uma competência, a série conserva `null`. O pacote estático do GitHub Pages permite consultar os municípios publicados. A opção de simular um mês fica disponível quando o Flask responde com o mesmo conjunto de parâmetros.

## Publicação no GitHub Pages

Abra **Settings → Pages → Build and deployment** e selecione **GitHub Actions**. Cada push na `develop` inicia o workflow **Publicar GitHub Pages**, que executa os testes e a validação do Colab antes de publicar `_site/`. Se o push aconteceu antes de configurar o Pages, reexecute o workflow daquele commit em **Actions**. Confira se o deploy corresponde ao commit enviado e se o SHA-256 do JSON público é o mesmo de `dados_site.json` no manifesto.

O ranking, os gráficos, os filtros por região, porte e busca, e o CSV filtrado usam a exportação do Colab. O filtro de renda permanece indisponível enquanto a exportação não trouxer esse indicador. A simulação mensal requer Flask. A consulta municipal publicada funciona no Pages.
