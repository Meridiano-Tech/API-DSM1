# Fontes e Links — CREDIT42

**Referência:** modelo municipal v3.1  
**Verificação documental:** 10/11/2026

Este catálogo distingue as fontes consultadas pelo notebook das referências de pesquisa. A existência de uma página ou API não significa que seus indicadores estejam integrados ao score. Nenhum endereço deste arquivo autoriza atribuir dados pessoais a partir de observações territoriais.

## 1. Fontes implementadas

| Fonte | Uso atual | Link |
|---|---|---|
| BCB — Estatísticas do Pix | Catálogo oficial das estatísticas Pix. | [Conjunto de dados Pix](https://dadosabertos.bcb.gov.br/dataset/pix) |
| BCB — Olinda | Serviço OData usado para consulta Pix municipal e metadados. | [Raiz do serviço](https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/) |
| BCB — SGS | Consulta de carteira, inadimplência e IPCA por código de série. | [Sistema de séries temporais](https://www3.bcb.gov.br/sgspub/) |
| IBGE — SIDRA 9514 | População total e distribuição etária do Censo 2022 usadas nos denominadores. | [Tabela 9514](https://sidra.ibge.gov.br/tabela/9514) |
| IBGE — API SIDRA | Extração programática das contagens populacionais. | [API SIDRA](https://apisidra.ibge.gov.br/) |

### Endereços operacionais registrados no código

Os trechos abaixo são modelos de requisição; chaves entre `{}` indicam parâmetros a preencher pelo programa.

```text
Pix municipal:
https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/TransacoesPixPorMunicipio(DataBase=@DataBase)

Metadados Pix:
https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/$metadata

Série SGS:
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={dd/MM/yyyy}&dataFinal={dd/MM/yyyy}

População — SIDRA 9514:
https://apisidra.ibge.gov.br/values/t/9514/n6/{municipios}/v/93/p/2022/c2/{sexo}/c287/{idades}/c286/{declaracao}
```

O Pix exige filtro explícito `AnoMes` e validação de completude. Na população, o ano-base 2022 é intencional; ele não deve ser substituído pelo ano de cada competência Pix.

### Séries SGS utilizadas

| Indicador | Códigos no notebook |
|---|---|
| Carteira regional | Norte: 14093; Nordeste: 14094; Centro-Oeste: 14095; Sudeste: 14096; Sul: 14097. |
| Inadimplência regional | Norte: 15952; Nordeste: 15953; Centro-Oeste: 15954; Sudeste: 15955; Sul: 15956. |
| Carteira nacional | 20539. |
| Inadimplência nacional — base da proxy municipal | 21082. |
| IPCA — deflator do IPT auxiliar | 433. |
| Inadimplência estadual das UFs selecionadas | AL: 15926; BA: 15929; CE: 15930; MA: 15934; MG: 15937; PA: 15938; PB: 15939; PE: 15941; PI: 15942; RN: 15944; RO: 15946; TO: 15951. |

O notebook confere nome e unidade das séries estaduais antes de usar seus históricos. A taxa municipal publicada é estimada pela fórmula documentada, e não obtida de uma dessas séries como observação municipal.

## 2. Referências complementares e legadas

| Tema | Referência | Situação no projeto |
|---|---|---|
| Crédito agregado | [SCR.data — BCB](https://www.bcb.gov.br/estabilidadefinanceira/scrdata) | Consulta complementar; não é um endpoint de M4 pessoal implementado. |
| Outras séries oficiais | [Portal de Dados Abertos do BCB](https://dadosabertos.bcb.gov.br/) | Catálogo para pesquisa; cada integração exige código, unidade e definição próprios. |
| Cadastro Único | [Solicitar a base de dados — MDS](https://www.gov.br/pt-br/servicos/solicitar-cessao-de-dados-identificados-do-cadastro-unico) | Referência de acesso; nenhuma bonificação CadÚnico é calculada no notebook. |
| Dados familiares | [CadÚnico — Conecta gov.br](https://www.gov.br/conecta/catalogo/apis/cadunico-servicos-dados-familiares) | Catálogo de integração institucional; não é uma API anônima de uso livre já conectada ao projeto. |
| Educação | [Resultados do IDEB — INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados/2005-2025) | Página de referência; não há coleta IDEB nesta versão. O intervalo do título não comprova cobertura de cada município/ano. |
| Desenvolvimento humano | [Atlas dos Municípios — PNUD](https://www.undp.org/pt/brazil/atlas-dos-municipios) | Referência territorial histórica; o IDHM não gera bônus no score atual. |
| Contexto socioeconômico | [IPEADATA](https://www.ipeadata.gov.br/) | Portal de consulta; não há série de Bets selecionada ou classificação de risco de apostas implementada. |
| Tabelas citadas no texto v2.1 | [SIDRA 4709](https://sidra.ibge.gov.br/tabela/4709) e [SIDRA 7138](https://sidra.ibge.gov.br/tabela/7138) | Não utilizadas pelo notebook atual. A correspondência sugerida anteriormente com população e escolaridade não foi validada nesta revisão; não usar como substitutas automáticas. |

## 3. Governança de dados

| Referência | Link |
|---|---|
| Orientações da ANPD sobre direitos dos titulares | [Direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares) |

A referência da ANPD é informativa. A documentação do projeto não pressupõe acesso concedido a dados identificados do CadÚnico ou do SCR.

## 4. Resultado da conferência dos links

- As páginas de Pix, IDEB, solicitação de dados CadÚnico, catálogo Conecta, PNUD e ANPD foram acessíveis na conferência documental.
- O endereço da ANPD foi atualizado para o destino do redirecionamento oficial.
- A página SCR.data depende de JavaScript; SGS e IPEADATA não forneceram conteúdo textual suficiente para validar indicadores pelo navegador de pesquisa.
- A página SIDRA 9514 retornou bloqueio de acesso na conferência web, e suas páginas de metadados não puderam ser lidas por esse meio. A definição dos endpoints ativos foi conferida no código do notebook; isso não substitui a validação das respostas durante cada execução.
- A conferência de páginas não equivale a testar todas as APIs, credenciais, séries e competências. O pipeline deve verificar esses requisitos ao coletar os dados.

**Documentação relacionada:** [Tratamento dos dados](tratamento_dados.md) · [Manual do usuário](manual_usuario.md) · [Especificação técnica](ESPECIFICACAO_TECNICA_CREDIT42.md) · [README](README.md).
