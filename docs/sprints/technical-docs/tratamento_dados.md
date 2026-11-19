# Tratamento de Dados — CREDIT42

**Referência:** modelo municipal `credit42-municipal-20-3.1`  
**Período analisado:** janeiro de 2024 a outubro de 2026  
**Universo municipal:** 20 municípios originais  
**Atualização documental:** 10/11/2026

> Este documento descreve o código entregue. As regras do antigo texto v2.1 que não são executadas estão identificadas como legadas. A normalização desta documentação não altera o notebook.

## 📑 Índice

1. [Fontes dos dados](#fontes)
2. [Dicionário de dados](#schema)
3. [Motor de cálculo](#motor)
4. [Inconsistências e limites conhecidos](#limites)
5. [Tratamento e limpeza](#etl)
6. [Auditoria e arquivos de saída](#auditoria)

---

<a id="fontes"></a>

## 1. Fontes dos dados

| Fonte | Conteúdo efetivamente usado | Situação |
|---|---|---|
| BCB Pix / Olinda | Valores, quantidade de operações e pagadores PF/PJ por município e competência. | Coleta dinâmica implementada. |
| BCB SGS | Carteira regional e nacional, inadimplência regional, nacional e estadual, além do IPCA. | Coleta dinâmica implementada; não há extração de microdados pessoais do SCR. |
| IBGE SIDRA — tabela 9514, variável 93, Censo 2022 | População total e população de 18 anos ou mais. | Coleta dinâmica implementada; os denominadores são censitários, com ano-base fixo. |
| SCR.data | Referência complementar de consulta sobre crédito. | Não existe ingestão direta dessa base no pipeline atual; o código usa séries SGS identificadas. |
| INEP, CadÚnico/MDS, PNUD/IDHM e IPEADATA | Referências da proposta ampliada do projeto. | Não alimentam as fórmulas executadas nesta versão. |

Os endereços institucionais, os endpoints operacionais e as condições de verificação estão em [links.md](links.md). Uma página de catálogo não deve ser confundida com a URL de extração da API.

---

<a id="schema"></a>

## 2. Dicionário de dados

Os nomes abaixo correspondem às tabelas internas e às saídas do notebook. O antigo nome lógico `cod_municipio_ibge` corresponde ao campo implementado `municipio_ibge`.

| Campo | Origem / tipo lógico | Tratamento e interpretação |
|---|---|---|
| `municipio_ibge` | Código municipal / texto | Chave de integração municipal, conservada como identificador textual após padronização. Não cruzar tabelas apenas pelo nome da cidade. |
| `competencia` | Período mensal / texto `YYYY-MM` | Deve pertencer à janela fixa de 34 meses. |
| `collected_at_utc` | Metadado / data e hora UTC | Instante da consulta; não substitui a competência observada. |
| `valor_pf`, `valor_pj` | Pix / valor nominal em reais | Correspondem a `VL_PagadorPF` e `VL_PagadorPJ`. Valores devem ser finitos e não negativos. |
| `quantidade_pf`, `quantidade_pj` | Pix / contagens | Correspondem a `QT_PagadorPF` e `QT_PagadorPJ`. Não confundir operações com pessoas. |
| `pagadores_pf`, `pagadores_pj` | Pix / pagadores distintos no mês | Correspondem a `QT_PES_PagadorPF` e `QT_PES_PagadorPJ`. Não somar meses ou municípios para anunciar pessoas únicas. |
| `pop_total` | IBGE / habitantes, Censo 2022 | Denominador do Downtrend legado e do score municipal publicado. |
| `pop18` | IBGE / habitantes com 18 anos ou mais, Censo 2022 | Denominador exclusivo do IPT auxiliar e de suas intensidades. |
| `indice_precos` | IPCA/SGS 433 / índice derivado | Base de preços janeiro de 2024; usado para deflacionar o IPT auxiliar. |
| `VolPix_per_capita`, `Pagadores_per_capita` | Derivados / intensidade por habitante | Pix PF nominal e pagadores PF divididos por `pop_total`. |
| `VolPix_norm`, `Pagadores_norm` | Derivados / escala 0–100 | Min–max descritivo no universo fixo de municípios e meses válidos. |
| `DowntrendProxy` | Derivado / escala 0–100 | Composição mensal 60% volume PF e 40% pagadores PF; no resumo municipal representa a média dos meses válidos. |
| `Score_Inclusivo`, `Score_Final` | Derivados / escala 300–1.000 | Score municipal exploratório e seu alias. O JSON mantém também `score_final`. |
| `taxa_inadimplencia` | Estimativa / percentual | Proxy municipal calculada sobre a taxa nacional; não é taxa municipal diretamente observada. |
| `competencia_inadimplencia` | Período / `YYYY-MM` | Mês da taxa nacional usada como base da estimativa municipal. |
| `meses_validos`, `meses_esperados`, `cobertura_pct` | Qualidade / contagens e percentual | Cobertura do cálculo municipal; o total esperado é 34 meses. |
| `observado`, `data_status`, `reason_code` | Qualidade / indicador e textos | Informam validade, disponibilidade e motivo da ausência ou rejeição. |
| `source_hash`, `parameter_set_id` | Auditoria / identificadores | Vinculam observações à origem e indicadores ao conjunto de parâmetros. |
| `IPT_exploratorio`, `T` | Derivados auxiliares | IPT deflacionado de três meses e tendência interanual, separados do score legado. |
| `SII_individual` | Saída indisponível | Permanece nulo, com status de indisponibilidade; não é preenchido com o score do município. |

Os símbolos `M1`, `M2`, `M4`, `fragilidade_renda`, `elegibilidade_cad`, `elegibilidade_idhm`, `P_micro`, `P_macro` e `C` pertencem a propostas anteriores. Não são colunas obrigatórias para o score territorial atualmente executado e não recebem valores de substituição.

---

<a id="motor"></a>

## 3. Motor de cálculo

### 3.1 Downtrend e score municipal

Para cada município-mês válido:

```text
VolPix_per_capita = valor_pf / pop_total
Pagadores_per_capita = pagadores_pf / pop_total

X_norm = 100 × (X − mínimo_observado) / (máximo_observado − mínimo_observado)

DowntrendProxy = 0,60 × VolPix_norm + 0,40 × Pagadores_norm
Score_Inclusivo = 300 + 7 × média dos DowntrendProxy mensais válidos
```

Os extremos são calculados sobre os 20 municípios e os meses válidos de janeiro/2024 a outubro/2026. Se não houver intervalo min–max válido, o componente permanece ausente. Ambos os componentes devem existir para formar um Downtrend mensal; não se redistribuem os pesos por falta de um deles.

O resumo municipal usa apenas os meses com Downtrend calculado. Pode haver score com cobertura parcial: `meses_validos` e `cobertura_pct` devem acompanhar o resultado. Sem nenhum mês válido, o score fica indisponível. As constantes 300 e 7 definem a escala 300–1.000; não representam probabilidades de pagamento.

### 3.2 Inadimplência municipal estimada

```text
amplitude_downtrend = 0,15
fator = 1 + amplitude_downtrend − 2 × amplitude_downtrend × (D_médio / 100)
taxa_estimada = Clip(taxa_nacional_BCB_21082 × fator; 0; 100)
```

No ranking final, a média `D_médio` considera meses válidos até a última competência em que coexistem a taxa nacional e o Downtrend mensal do município. O fator varia de 0,85 a 1,15. A taxa é identificada como `ESTIMADO`, com competência, base e método explícitos. Trata-se da estimativa já prevista para este projeto, sem necessidade de nova autorização a cada execução; o fator é uma hipótese metodológica sem validação preditiva demonstrada.

### 3.3 IPT auxiliar e componentes legados

O IPT auxiliar usa Pix PF deflacionado, população **18+**, médias móveis completas de três meses e normalização `log1p` com referência de março a dezembro de 2024. Ele mantém a ponderação 60%/40% e a escala 300–1.000, mas seus insumos e limites diferem do Downtrend nominal.

Os bônus CadÚnico de 15 pontos e IDHM de 25 pontos, a composição Micro/Macro e o alfa por região do texto v2.1 **não são aplicados**. Também não são executadas as faixas de Bets de 5% e 10%. Esses critérios não devem aparecer como regras vigentes do motor nem como indicadores já coletados. O SII individual continua dependente de dados pessoais e de definição metodológica própria.

---

<a id="limites"></a>

## 4. Inconsistências e limites conhecidos

1. **Porte e população-base:** o uso per capita reduz o efeito de tamanho, mas mantém um denominador do Censo 2022 durante 2024–2026. O score legado usa população total; o IPT auxiliar usa população adulta. Trocar esses denominadores altera a metodologia.
2. **Universo descritivo:** o min–max do score considera toda a janela, inclusive meses posteriores aos primeiros pontos da série. Serve à comparação retrospectiva; não equivale a uma simulação histórica disponível em tempo real em cada mês.
3. **Seleção municipal:** a lista preservada tem 20 municípios; a validação anterior identificou 14 fora da faixa exploratória de 200–300 mil habitantes. O catálogo registra essa condição.
4. **Granularidade:** taxas estaduais ou nacionais não são atrasos pessoais nem inadimplência municipal observada. A estimativa municipal deve manter seu rótulo.
5. **Circularidade:** score e inadimplência estimada derivam do mesmo Downtrend. A estimativa não valida o score de forma independente.
6. **Pagadores distintos:** a API não fornece chaves pessoais para desduplicação entre meses e territórios; as agregações publicadas de Pix usam valores e operações, sem anunciar a soma de pagadores como pessoas únicas.
7. **Nome Downtrend:** o índice legado mede intensidade relativa, não uma queda temporal diretamente. A tendência interanual `T` é calculada à parte.
8. **M4 e educação:** atrasos pessoais não podem ser substituídos por uma taxa agregada com outra faixa de atraso; indicadores territoriais de educação também não equivalem à escolaridade de uma pessoa.

---

<a id="etl"></a>

## 5. Regras de tratamento e limpeza — ETL

### T01 — Origem e ausência de dados

Não usar valores aleatórios, planilhas pré-carregadas, populações fixas inventadas ou preenchimentos arbitrários como entradas financeiras. Não preencher competências ausentes com zero ou transportar uma taxa de setembro para outubro. No SIDRA, o símbolo `-` é convertido em zero conforme a convenção da tabela utilizada; essa regra específica não se estende a campos nulos ou outros símbolos.

Uma ausência bloqueia o indicador que depende daquele insumo. A falta de IPCA bloqueia o IPT afetado, mas não apaga o Downtrend nominal quando Pix e população total são válidos. A cobertura parcial do resumo segue a regra descrita na seção 3.1.

### T02 — Natureza da informação e status técnico

| Classificação documental | Significado | Representação relevante no código |
|---|---|---|
| Observado | Valor extraído e validado em fonte oficial. | `observado=True`, proveniência e status técnico válido. |
| Derivado | Transformação determinística de observações. | Indicador calculado, parâmetros e `CALCULADO`. |
| Estimado | Inferência municipal pela hipótese Downtrend. | `status_inadimplencia=ESTIMADO` ou `status_inad_estimada=ESTIMADO`. |
| Ausente/inválido | Insumo não obtido ou rejeitado. | `SEM_DADO` ou `SCHEMA_INVALIDO`, valor nulo e motivo. |

Essas quatro classes descrevem a natureza dos dados; não constituem um único campo universal com esses quatro valores literais no notebook. `CALCULADO` indica sucesso técnico e não transforma uma métrica derivada em observação direta. `NAO_HOMOLOGADO` descreve a aprovação metodológica, separadamente da disponibilidade do número.

### T03 — Chaves, duplicidades e competência

Cruzar tabelas por `municipio_ibge` e, quando aplicável, `competencia`. Rejeitar duplicidades incompatíveis com a unidade município-mês. Preservar a grade completa de 680 posições esperadas para que as ausências permaneçam visíveis. Nomes de municípios são rótulos; os códigos identificam os registros.

### T04 — Extração Pix e completude

Filtrar explicitamente `AnoMes` em cada consulta, além de `DataBase`, e validar o mês retornado. A página padrão contém até 10.000 registros. Ao detectar possível truncamento, a coleta é dividida por UF, incluindo a categoria sem UF; se ainda houver corte, o mês é rejeitado como incompleto. Não considerar automaticamente uma resposta HTTP 200 como prova de completude.

### T05 — Agregações e unidades

Somar valores e quantidades apenas com a cobertura exigida pela agregação. Não somar pagadores distintos entre regiões ou meses como pessoas únicas. Preservar Pix sem localização no total nacional, identificando a diferença nas reconciliações. Os gráficos regionais usam a coleta nacional, e não somente a amostra dos 20 municípios. Conversões para milhões ou bilhões afetam a apresentação e devem conservar a unidade de origem nos metadados.

### T06 — Metadados e contingência

Validar o esquema das APIs e guardar o motivo de falhas. Se o catálogo HTML da tabela SIDRA não responder, utilizar somente os IDs oficiais de classificação documentados na configuração; as populações continuam sendo consultadas e validadas. Avisos de metadados não devem interromper a exportação por falta de `url` no log; o exportador atual aceita registros antigos sem essa chave.

### T07 — Gráficos e consumo pelo site

Os gráficos devem distinguir estimativas de taxas observadas e informar competências e unidades. O JSON final é a fonte comum da exibição do Colab e da integração com o site. Dados não finitos não podem sair como `NaN` ou `Infinity`: são representados por `null` com estado de disponibilidade. Marcações de calendário não equivalem a sazonalidade comprovada estatisticamente.

---

<a id="auditoria"></a>

## 6. Auditoria e arquivos de saída

| Artefato | Finalidade |
|---|---|
| Respostas em `raw/` e log da execução | Evidência da coleta, URL, instante, status HTTP quando houve resposta e hash do conteúdo disponível. |
| `parameters.json` | Limites, pesos, universo, janela e identificador dos parâmetros. |
| `quality_report.json` | Resultado das verificações e detalhamento de falhas. |
| `run_manifest.json` | Versões, parâmetros, trilha de consulta e hashes dos produtos. |
| `municipal_metrics.csv` | Indicadores mensais, incluindo IPT auxiliar e Downtrend. |
| `scores_territoriais.csv` e `inadimplencia_municipal.csv` | Resumos municipais e estimativas identificadas. |
| `dados_site.json` e `dados_site.js` | Contrato de publicação para gráficos e front-end. |

Um manifesto não pode conter hash de resposta que não foi recebida; nesse caso, registra-se a falha. Toda alteração de período, população-base, municípios, pesos ou normalização deve ser documentada e versionada. Os resultados são exploratórios e não homologados para decisão individual de crédito.

**Documentação relacionada:** [Manual do usuário](manual_usuario.md) · [Fontes e links](links.md) · [Especificação técnica](ESPECIFICACAO_TECNICA_CREDIT42.md) · [README](README.md).

