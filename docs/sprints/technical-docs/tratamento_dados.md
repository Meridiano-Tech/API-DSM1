
# Documento de Tratamento de Dados - Score de Crédito Inclusivo

## 1. Fonte dos Dados
Os indicadores e variáveis são originários de múltiplas fontes oficiais governamentais, sendo estritamente proibido o uso de dados não rastreáveis.
* **BCB (Pix / Olinda):** Volume e pagadores mensais por município. (Endpoint: `https://dadosabertos.bcb.gov.br/dataset/pix`)
* **BCB (SCR.data):** Carteira e faixas de inadimplência (Granularidade: UF). (Endpoint: `https://www.bcb.gov.br/estabilidadefinanceira/scrdata`)
* **BCB (SGS):** Séries nacionais de crédito e juros de contexto macro.
* **IBGE (SIDRA 4709 e 9514):** População residente e distribuição etária/composição por sexo. (API: `https://apisidra.ibge.gov.br/`)
* **INEP (IDEB):** Evolução educacional municipal histórica (2005-2025).
* **MDS (CadÚnico):** Elegibilidade individual (sob autorização legal) e agregados públicos.
* **PNUD (Atlas Brasil / IDHM):** IDHM municipal e referencial territorial.
* **IPEADATA:** Contexto socioeconômico e eixo consultivo de Bets.

---

## 2. Dicionário de Dados (Schema)
As variáveis mínimas exigidas para o pipeline de dados:

| Campo Lógico | Origem e Nível | Regra Mínima |
| :--- | :--- | :--- |
| **cod_municipio_ibge** | IBGE / município | Código oficial IBGE. Obrigatório ser `string`, sem perda de zeros à esquerda. |
| **competencia / data_ref** | Todas | Data em formato ISO. Necessário distinguir data de coleta de período observado. |
| **vol_pix_mensal** | BCB Pix / município | Valor monetário e unidade. Deve ser série mensurada, sem multiplicador sintético. |
| **pagadores_pix_mensal** | BCB Pix / município | Contagem distinta. Não somar meses como pessoas únicas. |
| **M1 / M2 / M4** | INEP/IBGE, Pix, Crédito | Escala 0–100. Registrar fórmula, granularidade e semântica. |
| **fragilidade_renda** | SCR / nível efetivo | Participação de crédito a tomadores de baixa renda. Exige documentação do denominador. |
| **elegibilidade_cad** | MDS (autorizado) / pessoa | Status: SIM / NÃO / DESCONHECIDO. Nunca deduzir a partir de renda média territorial. |
| **elegibilidade_idhm** | Atlas / município | Região + IDHM + regra de referência nacional + ano-base. |
| **D / P_micro / P_macro / C** | Derivados / ETL | Código e parâmetros versionados; insumos 100% rastreáveis. |
| **IPT / SII** | Saída calculada | Status numérico ou status "não calculável" (com motivo). |

---

## 3. Variáveis para considerar (Motor de Cálculo)
A arquitetura matemática consolida um **Índice de Potencial Territorial (IPT)** e um **Score Inclusivo Integrado (SII)** em uma base estrutural de 300 pontos, podendo atingir até 1.000 pontos dependendo das variáveis.

### Estrutura dos Eixos:
* **Eixo 1 (Score Padrão):** Comportamento transacional e de crédito (Inadimplência M4 e Giro Pix M2).
* **Eixo 2 (Inclusão Social):** Bônus CadÚnico (+15 pontos) condicionado à elegibilidade comprovada.
* **Eixo 3 (Potencial Territorial):** Downtrend Proxy (D) = Volume móvel Pix (60%) e pagadores distintos (40%), balanceado pela Fragilidade de Renda.
* **Eixo 4 (Educação e Bônus):** Escolaridade (M1) e Bônus IDHM (+25 pontos para Norte/Nordeste abaixo da referência).
* **Eixo 5 (Governança/Bets):** Camada segregada consultiva (não altera o score). Divide-se em: Baixo (<5%), Moderado (5% a 10%) e Crítico (>10%).

### Fórmulas de Normalização:
1. **Downtrend Proxy (D):** `0,60 × VolPix_norm + 0,40 × Pagadores_norm`
2. **Pilar Micro (P_micro):** `Clip(0,35×M1 + 0,45×M2 − 0,20×M4 + B_CAD; 0; 100)` *(Máximo: 95 pontos)*
3. **Pilar Macro (P_macro):** `Clip(0,50×D − 0,30×FragilidadeRenda + B_IDHM; 0; 100)` *(Máximo: 75 pontos)*
4. **Composição (C):** `Clip( α×(P_micro / 95) + (1 − α)×(P_macro / 75); 0; 1 )`
   * *Alfa regional:* 0,50 (Norte/Nordeste) ou 0,75 (Sul/Sudeste/Centro-Oeste).
5. **Índice de Potencial Territorial (IPT):** `300 + 700 × (D / 100)` *(Se D tiver dados Pix válidos)*
6. **Score Inclusivo Integrado (SII):** `300 + 700 × C` *(Calculável apenas se todos os insumos forem válidos)*

---

## 4. Mapeamento de Inconsistências Conhecidas
1. **Viés de Tamanho Municipal:** Variáveis absolutas do Pix e da população geram distorções. A população deve atuar como denominador (intensidade por população adulta), não como terceiro peso.
2. **Granularidade do SCR:** Os dados públicos de carteira e inadimplência do SCR estão agregados por UF. Não se deve rotular a série estadual como "M4 municipal observado". Downscaling territorial é considerado estimativa.
3. **Distorção de Atrasos (M4):** A métrica M4 mensura atrasos de 15 a 90 dias. Não utilizar séries do SGS de atrasos superiores a 90 dias como substituto direto.
4. **Agregação de Pagadores (Pix):** A API do Pix conta pagadores distintos mensais. Esses números não podem ser somados de forma acumulativa (cross-mês) pois a mesma pessoa será contada duas vezes (falta de desduplicação por CPF).

---

## 5. Regras de Tratamento e Limpeza (ETL)
* **Diretriz Inegociável (Anti-Mock):** É estritamente proibido o uso de mocks, `np.random`, preenchimentos arbitrários (placeholders numéricos) ou médias regionais para criar um score. 
* **Regra T01 - Dados Ausentes (Falha de Coleta e Forward Fill):** A ausência de dados não deve ser convertida em zero. Não encadear forward fill indefinidamente. Se a variável obrigatória estiver ausente ou bloqueada, a saída do score deve ser `status = não calculável`.
* **Regra T02 - Categorização do Dado:** Todo dado no pipeline deve ser categorizado como:
  * **OBSERVADO:** Valor efetivamente capturado de fonte legítima.
  * **DERIVADO:** Cálculo e transformação reproduzível de um dado observado.
  * **ESTIMADO:** Resultado de inferência territorial (downscaling). Requer aprovação específica.
  * **AUSENTE:** Sem verificação, bloqueia indicadores dependentes.
* **Regra T03 - Georreferenciamento:** O join (cruzamento de tabelas) deve ser feito pelo `cod_municipio_ibge` e não por strings de nome de cidade, explicitando os municípios sem correspondência.
* **Regra T04 - Auditoria de Pipeline:** Cada extração (CSV/JSON/ZIP) exige a gravação de um manifesto contendo: URL, parâmetros, HTTP status, hash do arquivo/resposta, versão do código e checksum das fontes.
* **Regra T05 - Gráficos e Saídas:** Todo dado plotado deve informar explicitamente em legenda a sua tipologia (Observado, Derivado ou Estimado) e sua competência. Não sobrepor dados estimados com dados observados sem distinção.

