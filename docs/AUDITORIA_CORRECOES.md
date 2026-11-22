# Correções da auditoria CREDIT42

Base: `develop` em `d54815649f2eb46028a9189b36464cb8071c1bab`. Auditoria de referência: 14/11/2026. Correções iniciais em 17/11/2026. Revisão e testes em 19/11/2026.

## Requisitos preservados

- 20 municípios originais e janela de janeiro/2024 a outubro/2026.
- JSON e demais artefatos do Colab sem alteração. SHA-256 de `dados_site.json`: `0cb82deb28c19da5e6b8ab2440e671025ec45ee8ad4fb59335c6c18783429089`.
- Fórmula municipal 60% volume PF / 40% pagadores PF, pontuação de 300 a 1.000 e estimativa Downtrend preservadas.
- Carteira, Pix PF/PJ, Pix regional e rankings continuam disponíveis. A identidade mantém azul-marinho, azul e Archivo.
- Valores ausentes permanecem ausentes. Na exportação atual, carteira e inadimplência regionais terminam em setembro/2026; Pix termina em outubro/2026.
- Nenhum commit, push ou merge realizado nesta entrega. A autoria e a aprovação do PR continuam com a equipe.

## Rastreabilidade das prioridades

| Item | Correção implementada | Evidência |
|---|---|---|
| T1 · Contato | Remove confirmação sem envio; direciona ao canal existente de Issues do projeto. | Teste de navegação verifica ausência do formulário e destino do contato. |
| T2 · Filtros | Separa carteira regional do ranking; explicita recortes, referência nacional e comparação anual indisponível em 2024. | Teste altera região e ano e verifica o alcance de cada controle. |
| T3 · CSV | Exportação junto ao ranking, janela, competência, modelo, parâmetros e limitação decisória; impede exportação vazia na interface e na API. | Download verificado no navegador e testes da rota CSV. |
| T4 · Interpretação | Aviso junto ao ranking, consulta e exportação; método, amostra e dependência entre score e estimativa explicados. | Seção “Fontes e metodologia” e conteúdo do CSV. |
| T5 · Consulta e cenário | Consulta usa o JSON publicado. Cenário exige API com mesmo modelo, parâmetros e cadastro; timeout e falha mantêm a consulta disponível. | Testes da API, compatibilidade e indisponibilidade no navegador. |
| T6 · Busca | Remove diacríticos, normaliza caixa e espaços no navegador e na API. | Araguaina, MARABÁ, Ji-Parana, Campina Grande e ausência de resultado. |
| T7 · Recuperação | Limite de espera de 12 s; ações desabilitadas durante falha; nova tentativa; gráficos independentes da inicialização dos filtros. | Falha do JSON, timeout, recuperação e ausência do Chart.js. |
| T8 · Publicação | Valida domínios, unidades, fontes, grades, conciliação Pix e reprodução do score. Workflows executam navegador; pós-deploy verifica os dados e os arquivos da interface. | Testes negativos com hash recalculado e comando de conferência local. Execução remota ocorrerá após PR/merge. |
| T9 · Rotina legada | Restaura TLS padrão; remove taxas fixas e descarta valores não finitos. | Teste confirma retorno `None` em falha e ausência de `verify=False`. |
| U1 · Navegação | Menu visível até 360 px, marca volta ao início e página atual identificada. | Percurso pelas três páginas em 360, 390, 768 e 900 px. |
| U2 · Acessibilidade | Canvas nomeado e tabela equivalente para cada gráfico; abas com teclado, foco e relação com painéis. | Contingência sem gráficos e navegação por setas/Home no Extrato. |
| U3 · Hierarquia | Banner reduzido, acesso direto à consulta, navegação “Análises” e compensação do cabeçalho nos atalhos. | Revisão da interface e estrutura responsiva. |
| U4 · Cobertura | Faixa com competências efetivas; causas em detalhes; coluna Cobertura; tabela rolável com cabeçalho fixo; últimos 12 meses como padrão. | 60 linhas no recorte recente e ausências de outubro preservadas. |
| U5 · Comparação | Mesma escala percentual nos dois rankings, valores nas barras e competência comum fora dos rótulos municipais. | Teste compara escalas e rótulos; método continua distinto nos títulos. |
| U6 · Contraste | Verde `#047857`, azul textual `#0369a1`, estado ativo sublinhado e legendas ampliadas. | CSS e revisão visual; não constitui certificação completa WCAG. |
| U7 · Transparência | Fontes e método acessíveis no resumo e rodapé; versão, exportação e séries SGS visíveis; remove filtro de renda indisponível. | Interface e manuais atualizados. |

## Revisão das regressões em 19/11/2026

| Prioridade | Defasagem encontrada | Correção verificada |
|---|---|---|
| T3 · CSV | O navegador repetia a competência global do score nas linhas municipais e fixava o texto de aprovação. | As duas colunas vêm do registro do município. Um teste exporta uma linha com competência anterior ao fim da janela. |
| T4, T5 · Score e cenário | Uma resposta de cenário podia usar um modelo diferente daquele anunciado pela API. Editar o formulário mantinha a nota anterior visível. | A interface valida modo, modelo, parâmetros e domínio da resposta. Editar ou reenviar limpa o resultado anterior. |
| T6 · Consulta | A consulta direta pelo nome ainda devolvia 404 para `Araguaina - TO`. | A rota de score e o filtro usam a mesma normalização de caixa, espaços e acentos. |
| T7 · Recuperação | Um JSON de erro servido com HTTP 200 escapava ao tratamento da falha de carregamento. | A leitura compartilhada verifica as coleções e os metadados usados pelas páginas e habilita a nova tentativa em caso de falha. |
| T8 · Qualidade dos dados | A validação aceitava mês nacional duplicado, valor regional marcado como ausente e URL da série de outra UF. Uma divergência no índice Downtrend podia passar quando o score final estava correto. | O build verifica as 34 competências nacionais em ordem, a coerência entre status e valor, a origem da série estadual e a concordância dos resultados municipais com o motor. |
| T8 · Publicação | Uma versão antiga da interface podia passar pela conferência se o JSON fosse idêntico. | A conferência pós-deploy compara os dois JSON públicos com o manifesto e as páginas, JavaScript e CSS com a revisão publicada. |
| U4 · Extrato | A faixa de inadimplência avançava se uma única região tivesse taxa no mês. O Extrato sempre exibia carteira e Pix em bilhões. | A faixa usa a última competência com valor nas cinco regiões. Cada linha mantém o valor disponível. Tabela e linha do tempo usam as mesmas unidades monetárias, escolhidas pela magnitude. |

## Validação local

- 38 testes Python aprovados, incluindo reprodução dos 20 resultados do Colab.
- 16 testes Playwright aprovados no Chromium Headless Shell, com a biblioteca real Chart.js 4.4.7 e dados reais da exportação. Falhas de rede e respostas da API são simuladas somente nos testes.
- Build `_site` e sintaxe dos cinco scripts JavaScript aprovados.
- Testes de navegador executados sobre o pacote estático produzido pelo build, equivalente ao artefato do Pages. Não substituem revisão humana nem execução dos Actions no repositório.

Comandos na raiz, após ativar o ambiente Python:

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s testes -p "testes_*.py" -v
python scripts/build_pages.py
npm ci
npx playwright install chromium
npm test
```

O teste usa a porta local 8765. O Node.js é necessário apenas para QA; a publicação continua estática. MySQL e dotenv da integração existente foram mantidos. `requests`, necessário aos serviços e testes, foi adicionado e `requirements.txt` normalizado em UTF-8.

Após o deploy, a conferência também pode ser executada manualmente:

```bash
python scripts/verificar_publicacao.py https://meridiano-tech.github.io/API-DSM1/
```

## Integração pela equipe

Aplicar as mudanças em uma branch de correção criada de `develop`, vincular o card correspondente ao PR, revisar com pelo menos um colega e integrar por PR em `develop`. A release para `main` segue o encerramento da Sprint. Se a correção de `requests` já estiver integrada por outra PR, conservar a dependência e resolver apenas a diferença de formatação.

O site público só receberá estas correções depois de commit, push, aprovação e publicação. O workflow já usa Actions para o artefato `_site`; se o repositório ainda mantiver uma publicação paralela “Deploy from a branch”, a equipe deve selecionar **GitHub Actions** em Settings → Pages para evitar duas origens de publicação.

Contato por formulário e API pública de cenários não foram provisionados: o site usa o canal do repositório e a consulta estática, sem prometer serviços inexistentes. Uma futura API pública exige hospedagem e configuração próprias. A falta de publicação de uma competência na fonte não é corrigida por preenchimento ou extrapolação.
