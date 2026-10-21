# Design System — Painel Score Inclusivo

Guia visual para o site de visualização do score inclusivo. Serve de referência para o wireframe e, depois, para o desenvolvimento do site.

**Versão:** 2.0 (atualizada para o wireframe novo) · **Idioma:** português (Brasil)

---

## 1. Princípios

1. **Clareza antes de tudo.** Em 5 segundos, o cliente deve entender qual é o score e se ele está melhorando ou piorando.
2. **Poucas cores, bem usadas.** Uma cor de marca, uma cor de destaque e neutros levemente azulados.
3. **Consistência.** Cabeçalho, faixa de destaque (hero), menu, margens, cards, botões e rodapé iguais em todas as telas.
4. **Acessível por padrão.** O projeto trata de inclusão, então o próprio site precisa ser inclusivo: bom contraste, texto legível e informação que não dependa só da cor.
5. **Cada gráfico responde a uma pergunta.** Títulos em forma de pergunta, seguidos de uma linha de explicação.

---

## 2. Cores

### 2.1 Marca (azul-petróleo)

| Token | Hex | Uso |
|---|---|---|
| `--cor-primaria-escura` | `#0A5C7A` | Botões, links, logo, rodapé, divisória do hero, títulos de destaque |
| `--cor-primaria-media` | `#1F7FA3` | Fundo do hero, sublinhado do menu ativo, ícones, elementos de gráfico |
| `--cor-primaria-clara` | `#D8EEF5` | Hover, chips, faixas de destaque |

### 2.2 Neutros

| Token | Hex | Uso |
|---|---|---|
| `--cor-fundo` | `#F2F8FA` | Fundo da página |
| `--cor-card` | `#FFFFFF` | Fundo dos cards e do cabeçalho |
| `--cor-borda` | `#D3E5EC` | Bordas de cards, campos e linha do cabeçalho |
| `--cor-texto` | `#12303D` | Texto principal |
| `--cor-texto-secundario` | `#4F6B78` | Legendas, descrições, rótulos |

### 2.3 Destaque (laranja)

| Token | Hex | Uso |
|---|---|---|
| `--cor-destaque` | `#E8833A` | Barras, linhas e selos de "atenção" (somente preenchimento) |
| `--cor-destaque-texto` | `#B4540F` | Laranja quando for **texto** sobre fundo claro |

Azul-petróleo e laranja são cores opostas no círculo cromático: se destacam sem brigar. O laranja deve ser raro. Se aparecer em todo lugar, perde a função de chamar atenção.

### 2.3.1 Significado das cores nos dados

- **Azul-petróleo:** situação neutra ou acima da média.
- **Laranja:** atenção, abaixo da média, queda.
- Não usamos verde e vermelho, para manter a paleta enxuta e evitar o par que daltônicos não distinguem.

### 2.4 Contraste (WCAG)

O mínimo é **4,5:1** para texto pequeno e **3:1** para texto grande (a partir de 24 px, ou 19 px em negrito) e elementos gráficos.

| Combinação | Razão | Resultado |
|---|---|---|
| Branco sobre `#0A5C7A` | 7,4:1 | Passa |
| Branco sobre `#1F7FA3` | 4,5:1 | Passa (no limite: usar só em texto grande no hero) |
| `#12303D` sobre `#FFFFFF` | 13,9:1 | Passa |
| `#12303D` sobre `#F2F8FA` | 12,9:1 | Passa |
| `#12303D` sobre `#D8EEF5` | 11,5:1 | Passa |
| `#4F6B78` sobre `#FFFFFF` | 5,7:1 | Passa |
| `#4F6B78` sobre `#F2F8FA` | 5,3:1 | Passa |
| `#0A5C7A` sobre `#F2F8FA` | 6,9:1 | Passa |
| `#0A5C7A` sobre `#D8EEF5` | 6,2:1 | Passa |
| `#B4540F` sobre `#FFFFFF` | 5,0:1 | Passa |
| `#12303D` sobre `#E8833A` | 5,1:1 | Passa |
| Branco sobre `#E8833A` | 2,7:1 | **Não passa: nunca usar** |

**Regras práticas**
- Texto sobre fundo azul-escuro é sempre branco.
- Texto sobre fundo laranja é sempre `#12303D`.
- Texto de link e botão usa `#0A5C7A`. O `#1F7FA3` fica para elementos gráficos e texto grande (como o título do hero).

---

## 3. Tipografia

| Função | Fonte | Observação |
|---|---|---|
| Títulos | Serifada do wireframe: Arapey | Dá identidade ao site |
| Corpo, números, tabelas e rótulos de gráfico | Sem serifa (Open Sans ou Inter) | Mais legível em tamanho pequeno |

### Escala

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Título do hero | 56 px (44 px em tablet e celular) | Regular | Texto sobre a faixa azul do topo |
| Número de KPI | 40–48 px | Negrito | Valores em destaque nos cards |
| Título da página | 32 px | Regular | Título de cada tela (ex.: "Metodologias usadas", "Equipe e projeto") |
| Item do menu | 24 px (20 px no celular) | Regular | Menu abaixo do hero |
| Título de seção | 24 px | Regular | Agrupa vários cards |
| Título de card | 20 px | Regular | Pergunta do gráfico |
| Corpo | 16 px | Regular | Texto corrido, tabelas |
| Legenda | 13 px | Regular | Descrições, fonte dos dados |

- Nenhum texto abaixo de **13 px**.
- Altura de linha: 1,5 no corpo e 1,2 nos títulos.
- Largura máxima de texto corrido: **70 caracteres por linha**.
- Títulos em **caixa normal** (só a primeira letra maiúscula), sem tudo em maiúsculas. Maiúsculas ficam apenas em rótulos muito curtos, como o nome da equipe no logo.

---

## 4. Espaçamento e grade

### 4.1 Escala (múltiplos de 8)

`8 · 16 · 24 · 32 · 48 · 64`

| Situação | Valor |
|---|---|
| Espaço interno de um card | 24 px |
| Espaço entre cards | 24 px |
| Espaço entre seções | 48 px |
| Título de card → conteúdo | 16 px |
| Menu → primeiro bloco de conteúdo | 48 px |

### 4.2 Layout

| Tamanho de tela | Colunas | Margem lateral |
|---|---|---|
| Computador (1024 px ou mais) | 12 | 80 px |
| Tablet (640–1023 px) | 8 | 40 px |
| Celular (até 639 px) | 4 | 24 px |

- Largura máxima do conteúdo: **1200 px**, centralizado.
- O **cabeçalho, o hero e o rodapé ocupam a largura toda** da tela; só o menu e o conteúdo ficam limitados a 1200 px.
- A margem lateral é **igual em todas as telas**.

### 4.3 Ordem vertical de todas as telas

1. Cabeçalho (logo)
2. Hero (faixa azul com texto e imagem)
3. Menu de navegação
4. Conteúdo da tela
5. Rodapé

---

## 5. Forma e profundidade

| Elemento | Valor |
|---|---|
| Cantos do card | 16 px |
| Cantos de botões e campos | 12 px |
| Cantos do botão "Ver análises" | Pílula (totalmente arredondado) |
| Borda de card | 1 px `#D3E5EC` |
| Sombra de card | `0 4px 24px rgba(18, 48, 61, 0.08)` |

**Regra única:** todo card tem **a mesma borda e a mesma sombra**. Não há cards sem estilo ou com sombra mais forte.

---

## 6. Componentes

### 6.1 Cabeçalho
- Altura 88 px, fundo `#FFFFFF`, com linha inferior `#D3E5EC`.
- Contém **apenas o logo**, alinhado à esquerda e centralizado verticalmente. O logo tem no máximo 48 px de altura.
- Fundo do logo `#0A5C7A` com texto branco.
- O cabeçalho é criado **uma vez** e copiado igual para todas as telas.

### 6.2 Hero (faixa de destaque)
- Faixa em largura total, logo abaixo do cabeçalho, com altura mínima de 320 px.
- Dividida em **duas metades iguais**: texto à esquerda, imagem à direita, com uma divisória vertical de 3 px em `#0A5C7A` no meio.
- Fundo `#1F7FA3`; texto branco, centralizado, em tamanho de título do hero. Como é texto grande, o contraste de 4,5:1 é suficiente.
- A imagem ocupa a metade direita inteira (`object-fit: cover`) e é decorativa: `alt` vazio.
- No celular, as duas metades empilham (texto em cima, imagem embaixo).
- O hero é igual em todas as telas; muda apenas o texto.

### 6.3 Menu de navegação
- Fica **abaixo do hero**, não dentro do cabeçalho.
- 4 itens distribuídos em **4 colunas iguais**, centralizados: **Visão geral · Composição · Metodologia · Sobre**.
- Item ativo: texto `#12303D` com sublinhado de 4 px em `#1F7FA3`.
- Item inativo: texto `#12303D`, hover com sublinhado em `#D3E5EC`.
- O item ativo também usa `aria-current="page"`.

### 6.4 Card de KPI
- Rótulo em cinza `#4F6B78` (13 px), acima.
- Número principal em 40–48 px, `#12303D`.
- Linha de variação com **seta e sinal**: `▲ +2,1 pts` em azul-petróleo, `▼ −3,4 pts` em laranja escuro `#B4540F`.
- Uma frase curta de contexto ("em relação a 6 meses atrás").

### 6.5 Card de gráfico
- Título à esquerda, no topo do card, em forma de pergunta (ex.: "Quais regiões estão abaixo da média?").
- Linha de descrição em cinza abaixo do título (13 px).
- O gráfico ocupa o resto do card.
- Filtros, quando existirem, ficam alinhados à direita do título.
- Na tela Composição, o título pode ficar **acima do card**, centralizado (ver seção 8.2).

### 6.6 Botões

| Tipo | Fundo | Texto | Borda |
|---|---|---|---|
| Principal | `#0A5C7A` | Branco | — |
| Secundário | Branco | `#0A5C7A` | 1 px `#0A5C7A` |
| Desabilitado | `#D3E5EC` | `#4F6B78` | — |

- Altura mínima de **44 px** (área de toque confortável), cantos de 12 px.
- O botão **"Ver análises"** é um botão principal em formato de pílula, com seta branca no mesmo tom do texto.
- Estado de foco: contorno de 3 px em `#1F7FA3` com 2 px de distância.

### 6.7 Formulário de contato
- Fica dentro de um **card de fundo `#0A5C7A`**, com título "Formulário de contato" no topo.
- Cada campo com **rótulo visível** acima (não apenas placeholder), em branco.
- Campos: nome, e-mail e mensagem, com fundo claro e borda `#D3E5EC`; no foco, borda `#1F7FA3` com contorno de 3 px.
- Botão "Enviar" em largura total, fundo âmbar claro `#F2C078` com texto `#12303D` (contraste alto; branco sobre âmbar não passa).
- Mensagem de confirmação e de erro em texto, com ícone, e não apenas por cor.

### 6.8 Seletor (filtro)
- Mesmo estilo dos campos de formulário.
- O filtro ativo sempre aparece escrito (ex.: "Região: Nordeste"), para o cliente saber o que está vendo.

### 6.9 Tabela
- Cabeçalho em `#4F6B78`, peso semibold; linhas separadas por `#D3E5EC`.
- Números alinhados à direita; texto à esquerda.
- Em celular, a tabela rola na horizontal dentro do card.

### 6.10 Rodapé
- Faixa em largura total, fundo `#0A5C7A`, altura mínima de 120 px.
- Presente em todas as telas, igual em todas.
- Quando houver texto (fonte dos dados e data da última atualização), ele fica em branco, 13 px.

---

## 7. Gráficos

### 7.1 Paleta (até 5 séries)

| Ordem | Hex | Descrição |
|---|---|---|
| 1 | `#0A5C7A` | Azul-petróleo escuro |
| 2 | `#2A9DC4` | Azul claro |
| 3 | `#E8833A` | Laranja |
| 4 | `#7A8FA0` | Cinza-azulado |
| 5 | `#F2C078` | Âmbar claro |

As cores variam também em luminosidade, o que ajuda quem tem daltonismo.

### 7.2 Regras
- **Não depender só da cor:** use marcadores diferentes em cada linha (círculo, quadrado, triângulo…) e rótulos diretos quando possível.
- **Escolha do tipo:** linha para evolução no tempo; barras para comparar categorias; radar apenas para o perfil de poucos componentes.
- **Gráfico de grupos:** barras acima da média em azul-petróleo, abaixo da média em laranja, com a média nacional indicada por uma linha de referência.
- **Eixos:** unidades sempre escritas ("R$ bi", "pontos de score"); evitar números grandes sem formatação (400000 → "R$ 400 bi").
- **Tooltip:** mostra o valor completo e a unidade.
- **Alt/resumo textual:** todo gráfico tem uma frase abaixo dizendo a principal conclusão.
- Máximo de **3 a 4 gráficos por tela**.

---

## 8. Estrutura das telas

Todas as telas começam com **cabeçalho, hero e menu** (seção 4.3) e terminam com o **rodapé**. Abaixo está só o conteúdo de cada uma.

### 8.1 Visão geral
1. **3 cards rápidos** (KPIs) em linha, com o **score nacional** primeiro e em maior destaque.
2. **2 cards de gráfico** lado a lado (por exemplo, ranking das regiões e evolução do score).
3. Os títulos "Resumo rápido" e "Principais gráficos" continuam no HTML, visíveis apenas para leitores de tela.

### 8.2 Composição
1. **2 cards lado a lado**, cada um com o título centralizado acima: **"Perfil por região"** e **"Métrica e peso do score"**. O seletor de região fica junto a esses cards.
2. Botão **"Ver análises"** (pílula), que leva à seção abaixo.
3. Seção **"Análises"**: uma caixa com borda clara `#D3E5EC`, com o botão "Ver análises" encaixado no canto superior esquerdo da borda. Dentro, **4 cards de gráfico do Colab em grade 2 × 2**, cada um com o título centralizado acima, em forma de pergunta.

### 8.3 Metodologia
1. Título da página centralizado em azul-petróleo: **"Metodologias usadas"**.
2. Parágrafo de introdução centralizado, com no máximo 70 caracteres por linha.
3. **Duas colunas**, cada uma com subtítulo em azul-petróleo e lista com marcadores.
4. Conteúdo das colunas: fórmula do score, componentes e pesos, fontes dos dados, tratamento dos dados e limitações.

### 8.4 Sobre
1. **Logo da equipe** em círculo, centralizado.
2. Título centralizado **"Equipe e projeto"**, seguido de texto sobre o projeto.
3. **4 colunas** com os papéis e os nomes: **PO · Scrum Master · Dev team back · Dev team front**.
4. **Formulário de contato** em card azul (ver 6.7).

---

## 9. Responsividade

| Elemento | Computador | Tablet | Celular |
|---|---|---|---|
| Hero | 2 metades lado a lado | 2 metades lado a lado | Texto em cima, imagem embaixo |
| Menu | 4 colunas | 4 colunas | 2 colunas (2 × 2) |
| Cards de KPI | 3 por linha | 1 por linha | 1 por linha |
| Gráficos | 2 por linha | 1 por linha | 1 por linha |
| Colunas da Metodologia e da equipe | 2 e 4 colunas | 2 colunas | 1 coluna |
| Margem lateral | 80 px | 40 px | 24 px |
| Tabelas | Completas | Completas | Rolagem horizontal |

---

## 10. Acessibilidade

- Contraste mínimo de 4,5:1 em texto (ver tabela da seção 2.4).
- Nenhuma informação apenas por cor: usar seta, sinal, marcador ou texto.
- Alvos de toque de **44 px** ou mais.
- Foco de teclado sempre visível e ordem de tabulação lógica.
- Imagens e gráficos com descrição em texto; a imagem do hero é decorativa (`alt` vazio).
- Idioma da página declarado como português do Brasil (`lang="pt-BR"`).
- Respeitar a preferência do sistema por menos movimento (sem animações essenciais).

---

## 11. Tom e conteúdo

- Frases curtas, em português simples, sem jargão sem explicação.
- Números com **formatação brasileira**: `1.234,5` e `R$ 400 bi`.
- Datas no formato `mmm/aa` nos gráficos (ex.: `jul/26`).
- Cada tela começa com uma frase resumindo o que o cliente está vendo (no hero ou logo abaixo do menu).
- Termos técnicos (ex.: "score", "carteira") ganham uma explicação curta ou um texto de ajuda.

---

## 12. Tokens em CSS (para o desenvolvimento)

```css
:root {
  /* Cores */
  --cor-primaria-escura: #0A5C7A;
  --cor-primaria-media: #1F7FA3;
  --cor-primaria-clara: #D8EEF5;
  --cor-fundo: #F2F8FA;
  --cor-card: #FFFFFF;
  --cor-borda: #D3E5EC;
  --cor-texto: #12303D;
  --cor-texto-secundario: #4F6B78;
  --cor-destaque: #E8833A;
  --cor-destaque-texto: #B4540F;

  /* Gráficos */
  --grafico-1: #0A5C7A;
  --grafico-2: #2A9DC4;
  --grafico-3: #E8833A;
  --grafico-4: #7A8FA0;
  --grafico-5: #F2C078;

  /* Forma */
  --raio-card: 16px;
  --raio-botao: 12px;
  --raio-pilula: 999px;
  --sombra-card: 0 4px 24px rgba(18, 48, 61, 0.08);

  /* Espaçamento */
  --esp-1: 8px;
  --esp-2: 16px;
  --esp-3: 24px;
  --esp-4: 32px;
  --esp-5: 48px;
  --esp-6: 64px;

  /* Estrutura */
  --altura-cabecalho: 88px;
  --altura-hero: 320px;
  --altura-rodape: 120px;

  /* Tipografia */
  --fonte-titulo: "Arapey", Georgia, serif;
  --fonte-corpo: "Open Sans", system-ui, sans-serif;
}
```

---