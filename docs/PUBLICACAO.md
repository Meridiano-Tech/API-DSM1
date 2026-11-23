# Build e publicação

Este documento descreve o caminho entre a execução do Colab e o site. A fonte
dos dados publicados é a exportação validada em `dados/`; o build cria o site
estático em `_site/`. A hospedagem do Pages não executa Flask.

## Estrutura relevante

| Caminho | Responsabilidade |
|---|---|
| `index.html`, `composicao.html`, `sobre.html` | Páginas do frontend. |
| `css/`, `js/` | Estilos e comportamento do navegador. |
| `dados/dados_site.json` | Dados e contrato consumidos pelo frontend. |
| `dados/parameters.json`, `dados/perfil_radar.json`, `dados/run_manifest.json` | Parâmetros, produtos auxiliares e proveniência da execução. |
| `motor_score.py` | Validação e reprodução dos resultados municipais. |
| `scripts/build_pages.py` | Validação dos artefatos e criação de `_site/`. |
| `scripts/verificar_publicacao.py` | Conferência pós-deploy dos dados e arquivos públicos. |
| `.github/workflows/` | Automação de QA e publicação. |

## Atualizar dados a partir do Colab

1. Execute o notebook integrado até o bloco final de exportação e gráficos.
   Antes de importar os arquivos, confirme no manifesto que o modelo é
   `credit42-municipal-70-3.2`, que o cadastro contém 70 municípios nas cotas
   documentadas e que o período solicitado é `2024-01`–`2026-10`. Notebook ou
   exportação sem esses metadados compatíveis não deve substituir a base do
   site.
2. Baixe o pacote de integração definido pela versão vigente do notebook e use
   arquivos da **mesma execução**. O repositório identifica os artefatos
   requeridos pelo mapa `output_sha256` de `run_manifest.json`; esse manifesto,
   e não um nome fixo de ZIP, é a referência para determinar o conjunto da
   execução.
3. Atualize os artefatos requeridos pelo manifesto dentro de `dados/`. O
   conjunto inclui `dados_site.json`, `dados_site.js`, `parameters.json`,
   `perfil_radar.json`, `municipal_metrics.csv`, `run_manifest.json` e os demais
   produtos listados em `output_sha256` no manifesto.
4. Preserve os bytes exportados. Alterar, reformatar ou reserializar um arquivo
   coberto por hash invalida a proveniência e fará o build falhar.
5. Revise o relatório de qualidade e o manifesto. `APROVADO` indica integridade
   técnica das verificações; não significa homologação do score ou cobertura
   observada de todas as fontes.

O `schema_version` do JSON atualmente publicado é `3.0`; o modelo é
`credit42-municipal-70-3.2`. A atualização de dados não autoriza mudar chaves,
hierarquia ou tipos do JSON. Qualquer mudança de contrato deve ser versionada e
atualizada de forma coordenada no produtor, consumidor e testes.

## Validação local

Na raiz do repositório:

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s testes -p "testes_*.py" -v
python scripts/build_pages.py
```

Os comandos acima validam a suíte Python e constroem `_site/`. O QA de navegador
usa Node.js e Playwright conforme os scripts de `package.json` e o workflow.
Consulte os resultados da execução; não considere a publicação aprovada apenas
porque o build terminou.

## Metodologia e leitura dos dados

O recorte do score contém 34 competências de `2024-01` a `2026-10` e 70
municípios, nas cotas Norte 20, Nordeste 20, Centro-Oeste 10, Sudeste 10 e Sul
10. A fórmula combina Pix PF nominal por habitante (60%) e pagadores PF
distintos no mês por habitante (40%), normalizados por min–max na amostra e
janela. A pontuação é `300 + 7 × média dos DowntrendProxy mensais válidos`.

Municípios sem nenhum mês válido permanecem no ranking com score neutro 650,
identificado como estimado e acompanhado do motivo de fallback. Ausências nas
séries não são convertidas em observações zero. A inadimplência municipal é uma
estimativa baseada na taxa nacional BCB/SGS 21082 e compartilha o Downtrend com o
score; portanto, não constitui validação independente. Ver [tratamento dos
dados](sprints/technical-docs/tratamento_dados.md) e [especificação técnica](sprints/technical-docs/ESPECIFICACAO_TECNICA_CREDIT42.md).

## Contrato do site e rotas opcionais

O navegador lê `dados/dados_site.json`. Gráficos, rankings e extrato devem
respeitar a competência e o status de cada registro. Valores ausentes continuam
`null` e devem ser exibidos como indisponíveis, nunca como zero.

| Rota Flask | Uso |
|---|---|
| `GET /api/ranking` | Consulta do ranking territorial publicado. |
| `POST /api/calcular-score` | Consulta municipal por `municipio_ibge` ou `localidade`; pode atender cenários quando configurados. |

As rotas só funcionam em uma implantação Flask configurada. O GitHub Pages é
estático: permite navegar pelos dados publicados, mas não executa backend nem
simulador. O cadastro e a saída do cenário devem corresponder ao mesmo
`model_version` e `parameter_set_id` do conjunto publicado.

## Publicar no GitHub Pages

1. Abra **Settings → Pages → Build and deployment** e selecione **GitHub
   Actions**.
2. Integre as alterações via pull request para a branch configurada pelo
   workflow. No repositório atual, o workflow de publicação é acionado por
   atualizações em `develop`; confirme a configuração efetiva em
   `.github/workflows/` antes de abrir o PR.
3. Aguarde os jobs de qualidade e deploy. Confirme que o artefato `_site/` foi
   publicado a partir do commit esperado.
4. Após o deploy, confira a URL pública e execute, quando necessário:

   ```bash
   python scripts/verificar_publicacao.py https://meridiano-tech.github.io/API-DSM1/
   ```

O verificador compara os arquivos servidos com os artefatos e a revisão
publicados. Se houver divergência de hash, versão ou interface, interrompa a
entrega e investigue o workflow e o commit implantado.

## Fora do escopo da publicação estática

- O filtro de renda permanece indisponível se o JSON não publicar esse
  indicador.
- A simulação exige API Flask; não está disponível em uma página estática por
  si só.
- O projeto não coleta dados pessoais do SCR nem produz decisão individual de
  crédito.
