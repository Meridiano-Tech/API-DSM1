<div align="center">
  <h1>📊 Manual do Usuário — Plataforma CREDIT42</h1>
  <p><i>Inteligência de dados para análise territorial e inclusão financeira</i></p>
  <p><strong>Modelo municipal v3.1 · 20 municípios · Janeiro/2024 a Outubro/2026</strong></p>
</div>

---

**Documento:** manual de uso do ambiente e leitura dos indicadores.

## 📑 Índice

1. [Visão Geral — Painel Estratégico](#1-visao-geral)
2. [Extrato e Comportamento Financeiro](#2-extrato)
3. [Composição e Análise de Indicadores](#3-composicao)
4. [Simulador Territorial com IA](#4-simulador)
5. [Matriz Estratégica de Tomada de Decisão](#5-matriz)

---

> **Escopo deste manual:** as métricas e os gráficos descritos estão baseados no notebook `Credit42_20_Municipios_Downtrend_Score.ipynb`. A organização em abas segue a proposta de interface do projeto. Filtros interativos, linha do tempo de eventos e simulador com IA dependem da implementação do site e não são comprovados pela execução do Colab.

<a id="1-visao-geral"></a>

## 1. Visão Geral — Painel Estratégico

A CREDIT42 reúne dados públicos do Banco Central e do IBGE para apoiar a análise de atividade financeira e contexto de crédito. A visão geral permite acompanhar a evolução da carteira, o uso do Pix e os indicadores dos 20 municípios selecionados.

O recorte compreende **janeiro de 2024 a outubro de 2026**. Cada indicador informa a competência efetivamente disponível: o encerramento de uma série pode ser anterior ao fim do recorte solicitado.

### 📌 Indicadores-chave de desempenho — KPIs

| Indicador | O que representa | Como interpretar |
|---|---|---|
| Crescimento anual da carteira | Variação percentual do saldo regional, com cartões para Norte e Nordeste. | Compare a mesma região com a competência equivalente do ano anterior; saldo não equivale a novas concessões. |
| Volume total de Pix | Valor nominal acumulado de Pix PF e PJ no Brasil, dentro do recorte. | O total nacional inclui registros sem localização informada; não se restringe aos 20 municípios. |
| Inadimplência nacional de referência | Última taxa nacional disponível da série BCB/SGS 21082 dentro da janela. | É uma taxa agregada nacional; não corresponde à média simples das estimativas dos 20 municípios. |

> O campo técnico `inadimplencia_media` é mantido no JSON por compatibilidade. Seu significado é **taxa nacional de referência**, conforme os metadados da exportação.

### 📈 Painéis de acompanhamento

O bloco final do Colab gera sete infográficos a partir do JSON da própria execução:

1. **Carteira de crédito por região:** evolução do saldo das cinco regiões, com marcações de calendário.
2. **Pix por perfil:** evolução do volume monetário de Pessoa Física (PF) e Pessoa Jurídica (PJ).
3. **Quantidade de Pix por região:** comparação do número de operações.
4. **Volume financeiro de Pix por região:** comparação dos valores transacionados.
5. **Inadimplência municipal estimada:** ranking das estimativas dos 20 municípios.
6. **Inadimplência estadual observada:** comparação das UFs representadas na amostra.
7. **Score inclusivo municipal:** ranking da pontuação territorial exploratória.

As séries regionais utilizam a coleta nacional, enquanto os rankings municipais usam o grupo fixo de 20 cidades. As faixas de meio e fim de ano auxiliam a leitura do calendário; não demonstram, por si, a existência de picos sazonais.

### ▶️ Como gerar e consultar os dados

1. Abra `Credit42_20_Municipios_Downtrend_Score.ipynb` no Google Colab.
2. Selecione **Ambiente de execução → Executar tudo** e aguarde a coleta das APIs.
3. Confira os diagnósticos de cobertura, os avisos e as verificações reprovadas, se houver.
4. Consulte os sete infográficos no **BLOCO DE GRÁFICOS**, ao final do notebook.
5. Use os arquivos `dados_site.json` e `dados_site.js` da execução para alimentar a integração do site.

O primeiro bloco grava `config.py`. O último exporta e reabre o JSON antes de exibir os gráficos. As populações e os valores financeiros são extraídos das APIs; os arquivos CSV disponibilizados são produtos de saída.

---

<a id="2-extrato"></a>

## 2. Extrato e Comportamento Financeiro

A leitura cronológica permite comparar carteira de crédito, valores Pix, quantidade de operações e inadimplência ao longo dos meses. São dados agregados por território e perfil; não constituem um extrato bancário pessoal.

### 🗓️ Como acompanhar o histórico

- **Competência:** identifica o mês ao qual a observação pertence. Deve ser distinguida da data em que a API foi consultada.
- **Geografia:** confira se o indicador representa Brasil, região, estado ou município antes de comparar valores.
- **Unidade:** diferencie reais transacionados, número de operações, pagadores distintos e taxa percentual.
- **Cobertura:** um mês sem publicação ou com falha de validação permanece indisponível. Não deve ser interpretado como zero.
- **Origem:** carteira e taxas agregadas vêm de séries do BCB; Pix vem do serviço Olinda; população vem do Censo 2022 via SIDRA/IBGE.

Uma eventual linha do tempo do site deve usar as competências e os estados de disponibilidade exportados. Filtros como **Todo o Histórico** e **Região** dependem do front-end. Narrativas de eventos econômicos, como abertura de contas ou mudanças de comportamento, exigem evidências adicionais: elas não são produzidas automaticamente pelas séries consultadas.

---

<a id="3-composicao"></a>

## 3. Composição e Análise de Indicadores

O indicador exibido como **Score Inclusivo Municipal** descreve a intensidade relativa do uso do Pix PF nos municípios estudados. A versão atual utiliza dois componentes:

| Componente | Cálculo inicial | Peso |
|---|---|---:|
| Volume Pix PF por habitante | Valor nominal Pix PF dividido pela população total do Censo 2022. | 60% |
| Pagadores PF por habitante | Pagadores PF distintos no mês divididos pela população total do Censo 2022. | 40% |

Cada componente é normalizado de 0 a 100, considerando os valores válidos dos 20 municípios na janela fixa. O índice mensal e o score municipal são calculados por:

```text
DowntrendProxy = 0,60 × VolumePF_normalizado + 0,40 × PagadoresPF_normalizado
Score_Inclusivo = 300 + 7 × média dos DowntrendProxy mensais válidos
```

A pontuação calculada varia de **300 a 1.000**. Os campos `Score_Final` e `score_final` são nomes de compatibilidade dessa mesma pontuação. Consulte sempre os meses válidos e o percentual de cobertura ao comparar municípios.

### 🔎 Inadimplência e interpretação do score

A **inadimplência municipal é estimada** pela metodologia Downtrend Proxy. O código ajusta a taxa nacional de referência por um fator entre 0,85 e 1,15, conforme o índice municipal médio até a competência da taxa base. Esse ajuste é uma hipótese exploratória, sem calibração preditiva comprovada.

O score e a estimativa de inadimplência derivam do mesmo índice. Por isso, uma taxa estimada menor não constitui confirmação independente de que um município tem menor risco. As taxas estaduais são observações agregadas oficiais e devem ser identificadas separadamente.

### 🧩 Componentes disponíveis e previstos

| Recurso | Situação no Colab atual |
|---|---|
| Score municipal 60%/40% | Calculado quando os insumos necessários estão disponíveis. |
| IPT deflacionado e tendência Pix | Indicadores auxiliares, com metodologia própria; não substituem automaticamente o score municipal. |
| Ponderação independente entre risco e inclusão demográfica | Não implementada no score atual. |
| Bônus por CadÚnico ou IDHM | Não aplicado. |
| Radar de cinco pilares sociais e financeiros | Sem indicadores suficientes para preenchimento no pipeline atual. |
| Score de crédito individual | Indisponível; não é calculado a partir dos agregados municipais. |

Um gráfico de composição da nota, caso implementado no site, deve representar os pesos **60%/40%**. Pilares sem dados não devem receber valores fictícios para completar um radar.

> 💡 **Dica de análise:** uma pontuação maior indica maior intensidade Pix relativa à amostra. Ela não demonstra, isoladamente, menor probabilidade de inadimplência, maior vulnerabilidade social ou maior necessidade de crédito.

---

<a id="4-simulador"></a>

## 4. Simulador Territorial com IA

**Situação: recurso de interface previsto no manual inicial; integração não verificada no Colab documentado.** O notebook não implementa um serviço de IA que receba novas cidades, calcule scores e gere recomendações automáticas de negócio.

Para uma futura implementação, o fluxo proposto é:

1. **Selecionar um município:** utilizar o cadastro e o código IBGE associados à execução.
2. **Consultar os dados e a cobertura:** apresentar fontes, competências e indicadores disponíveis.
3. **Distinguir cenários de observações:** qualquer entrada manual deve ser identificada como hipótese de simulação.
4. **Exibir resultado e explicação:** informar qual fórmula foi usada, seus parâmetros e limitações.

A inclusão de novos municípios altera o universo de normalização e exige revisão metodológica. Renda per capita e inadimplência local digitadas pelo usuário não integram a equação atual do score municipal. Um texto gerado por IA não substitui a validação das fontes ou dos cálculos.

---

<a id="5-matriz"></a>

## 5. Matriz Estratégica de Tomada de Decisão

A matriz orienta a investigação territorial e a priorização de análises. O modelo atual não define faixas homologadas de risco nem critérios automáticos de aprovação ou recusa de crédito.

| Situação observada | Leitura adequada | Próximo passo de análise |
|---|---|---|
| Score relativamente maior e boa cobertura | Maior intensidade Pix em relação à amostra e à janela usadas. | Examinar a composição PF/PJ e o contexto econômico com evidências independentes. |
| Score relativamente menor e boa cobertura | Menor intensidade Pix relativa; o resultado não comprova incapacidade de pagamento. | Investigar uso de outros meios de pagamento e características locais. |
| Score disponível com cobertura parcial | A média utiliza apenas os meses válidos e pode não ser comparável a uma série completa. | Verificar os meses ausentes antes de interpretar o ranking. |
| Taxa municipal marcada como `ESTIMADO` | Resultado da proxy sobre a taxa nacional, e não uma medição municipal direta. | Conferir competência da base e hipótese do fator de ajuste. |
| Indicador com `SEM_DADO` ou `SCHEMA_INVALIDO` | Evidência insuficiente ou incompatível para o cálculo. | Consultar o diagnóstico da fonte e corrigir a causa antes de utilizar o indicador. |

### 📚 Documentação técnica

Consulte a [Especificação Técnica do Projeto](ESPECIFICACAO_TECNICA_CREDIT42.md) para detalhes sobre arquitetura, fontes, equações, parâmetros e limites metodológicos. Mantenha os arquivos de documentação na mesma pasta para preservar os links relativos no GitHub.

**Uso atual:** análise territorial exploratória, com score não homologado para concessão individual de crédito. As fontes de carteira e inadimplência são séries públicas agregadas do BCB/SGS; o ambiente não consulta microdados individuais do SCR.


---

## 🛠️ Dúvidas frequentes

| Situação | Orientação |
|---|---|
| Um mês não aparece na série | Confira a competência publicada e o diagnóstico de coleta; ausência não significa zero. |
| Score disponível e IPT ausente | São indicadores diferentes. O IPT exige população adulta, deflator e janela completa de três meses; o score legado usa população total e Pix nominal. |
| Cobertura menor que 100% | O score usa os meses válidos. Verifique quais competências faltam antes de comparar rankings. |
| Inadimplência e score têm fechamentos diferentes | Consulte a competência de cada indicador. A taxa base pode ser publicada depois das observações Pix. |
| Radar, bônus ou SII individual sem valores | Esses componentes não são calculados com os insumos atuais. Não os preencha manualmente para completar a interface. |
| Falha na exportação antes dos gráficos | Confira o erro da célula e utilize a versão corrigida do notebook. O tratamento de logs sem URL já foi incluído na versão entregue. |

**Navegação:** [README](README.md) · [Tratamento dos dados](tratamento_dados.md) · [Fontes e links](links.md) · [Especificação técnica](ESPECIFICACAO_TECNICA_CREDIT42.md).
