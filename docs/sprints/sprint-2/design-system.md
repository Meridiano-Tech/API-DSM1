# Design System — Painel Score Inclusivo

Guia visual para o site de visualização do score inclusivo. Serve de referência para o wireframe e, depois, para o desenvolvimento do site.

**Versão:** 1.0 · **Idioma:** português (Brasil)

---

## 1. Princípios

1. **Clareza antes de tudo.** Em 5 segundos, o cliente deve entender qual é o score e se ele está melhorando ou piorando.
2. **Poucas cores, bem usadas.** Uma cor de marca, uma cor de destaque e neutros levemente azulados.
3. **Consistência.** Cabeçalho, margens, cards e botões iguais em todas as telas.
4. **Acessível por padrão.** O projeto trata de inclusão, então o próprio site precisa ser inclusivo: bom contraste, texto legível e informação que não dependa só da cor.
5. **Cada gráfico responde a uma pergunta.** Títulos em forma de pergunta, seguidos de uma linha de explicação.

---

## 2. Cores

### 2.1 Marca (azul-petróleo)

| Token | Hex | Uso |
|---|---|---|
| `--cor-primaria-escura` | `#0A5C7A` | Botões, links, logo, títulos de destaque |
| `--cor-primaria-media` | `#1F7FA3` | Sublinhado do menu ativo, ícones, elementos de gráfico |
| `--cor-primaria-clara` | `#D8EEF5` | Hover, chips, faixas de destaque |

### 2.2 Neutros

| Token | Hex | Uso |
|---|---|---|
| `--cor-fundo` | `#F2F8FA` | Fundo da página |
| `--cor-card` | `#FFFFFF` | Fundo dos cards |
| `--cor-borda` | `#D3E5EC` | Bordas de cards e campos |
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
| Branco sobre `#1F7FA3` | 4,5:1 | Passa (no limite) |
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
- Texto de link e botão usa `#0A5C7A`. O `#1F7FA3` fica para elementos gráficos e texto grande.

---

## 3. Tipografia

| Função | Fonte | Observação |
|---|---|---|
| Títulos | Serifada do wireframe: Arapey | Dá identidade ao site |
| Corpo, números, tabelas e rótulos de gráfico | Sem serifa (Open Sans ou Inter) | Mais legível em tamanho pequeno |

### Escala

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Número de KPI | 40–48 px | Negrito | Valores em destaque nos cards |
| Título da página | 32 px | Regular | Título de cada tela |
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

### 4.2 Layout

| Tamanho de tela | Colunas | Margem lateral |
|---|---|---|
| Computador (1024 px ou mais) | 12 | 80 px |
| Tablet (640–1023 px) | 8 | 40 px |
| Celular (até 639 px) | 4 | 24 px |

- Largura máxima do conteúdo: **1200 px**, centralizado.
- A margem lateral é **igual em todas as telas**.
- Cabeçalho com **88 px de altura**, igual em todas as páginas.

---

## 5. Forma e profundidade

| Elemento | Valor |
|---|---|
| Cantos do card | 16 px |
| Cantos de botões e campos | 12 px |
| Borda de card | 1 px `#D3E5EC` |
| Sombra de card | `0 4px 24px rgba(18, 48, 61, 0.08)` |

**Regra única:** todo card tem **a mesma borda e a mesma sombra**. Não há cards sem estilo ou com sombra mais forte.

---

## 6. Componentes

### 6.1 Cabeçalho
- Altura 88 px, fundo `#FFFFFF` (ou o fundo da página), com linha inferior `#D3E5EC`.
- Logo à esquerda, **centralizado verticalmente** com o menu. O logo tem no máximo 48 px de altura.
- Fundo do logo `#0A5C7A` com texto branco.
- Menu à direita, com 4 itens: **Visão geral · Composição · Metodologia · Sobre**.
- Item ativo: texto `#12303D` com sublinhado de 3 px em `#1F7FA3`.
- Item inativo: texto `#12303D`, hover com fundo `#D8EEF5`.
- O cabeçalho é criado **uma vez** e copiado igual para todas as telas.

### 6.2 Card de KPI
- Rótulo em cinza `#4F6B78` (13 px), acima.
- Número principal em 40–48 px, `#12303D`.
- Linha de variação com **seta e sinal**: `▲ +2,1 pts` em azul-petróleo, `▼ −3,4 pts` em laranja escuro `#B4540F`.
- Uma frase curta de contexto ("em relação a 6 meses atrás").

### 6.3 Card de gráfico
- Título à esquerda, no topo do card, em forma de pergunta (ex.: "Quais regiões estão abaixo da média?").
- Linha de descrição em cinza abaixo do título (13 px).
- O gráfico ocupa o resto do card.
- Filtros, quando existirem, ficam alinhados à direita do título.

### 6.4 Botões

| Tipo | Fundo | Texto | Borda |
|---|---|---|---|
| Principal | `#0A5C7A` | Branco | — |
| Secundário | Branco | `#0A5C7A` | 1 px `#0A5C7A` |
| Desabilitado | `#D3E5EC` | `#4F6B78` | — |

- Altura mínima de **44 px** (área de toque confortável), cantos de 12 px.
- Ícone de seta no botão "Ver análises": **branco**, no mesmo tom do texto.
- Estado de foco: contorno de 3 px em `#1F7FA3` com 2 px de distância.

### 6.5 Formulário de contato
- Cada campo com **rótulo visível** acima (não apenas placeholder).
- Borda `#D3E5EC`; no foco, borda `#1F7FA3`.
- Campos: nome, e-mail e mensagem. Botão principal "Enviar mensagem".
- Mensagem de confirmação e de erro em texto, com ícone, e não apenas por cor.

### 6.6 Seletor (filtro)
- Mesmo estilo dos campos de formulário.
- O filtro ativo sempre aparece escrito (ex.: "Região: Nordeste"), para o cliente saber o que está vendo.

### 6.7 Tabela
- Cabeçalho em `#4F6B78`, peso semibold; linhas separadas por `#D3E5EC`.
- Números alinhados à direita; texto à esquerda.
- Em celular, a tabela rola na horizontal dentro do card.

### 6.8 Rodapé
- Fonte dos dados e data da última atualização, em texto secundário (13 px).
- Presente em todas as telas.

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

### 8.1 Visão geral
1. Cards rápidos (3 KPIs), com o **score nacional** primeiro e em maior destaque.
2. Dois gráficos principais (por exemplo, ranking das regiões e evolução do score).
3. Resumo em texto: "Principais conclusões".

### 8.2 Composição
1. Seletor de região no topo.
2. Dois cards lado a lado: **perfil por região** e **métricas e peso do score**.
3. Botão **"Ver análises"** (leva à seção abaixo).
4. Seção **"Análises"**: grade de gráficos do Colab (regiões, grupos, evolução), com títulos em forma de pergunta.

### 8.3 Metodologia
Dividida em blocos, e não em um texto único:
1. Fórmula do score.
2. Componentes e pesos.
3. Fontes dos dados.
4. Tratamento dos dados.
5. Limitações.

### 8.4 Sobre
1. Texto sobre o projeto e a equipe (com nomes e papéis).
2. Formulário de contato.

---

## 9. Responsividade

| Elemento | Computador | Tablet | Celular |
|---|---|---|---|
| Menu | Horizontal | Horizontal | Ícone de menu (hambúrguer) |
| Cards de KPI | 3 por linha | 2 por linha | 1 por linha |
| Gráficos | 2 por linha | 1 ou 2 por linha | 1 por linha |
| Margem lateral | 80 px | 40 px | 24 px |
| Tabelas | Completas | Completas | Rolagem horizontal |

---

## 10. Acessibilidade

- Contraste mínimo de 4,5:1 em texto (ver tabela da seção 2.4).
- Nenhuma informação apenas por cor: usar seta, sinal, marcador ou texto.
- Alvos de toque de **44 px** ou mais.
- Foco de teclado sempre visível e ordem de tabulação lógica.
- Imagens e gráficos com descrição em texto.
- Idioma da página declarado como português do Brasil (`lang="pt-BR"`).
- Respeitar a preferência do sistema por menos movimento (sem animações essenciais).

---

## 11. Tom e conteúdo

- Frases curtas, em português simples, sem jargão sem explicação.
- Números com **formatação brasileira**: `1.234,5` e `R$ 400 bi`.
- Datas no formato `mmm/aa` nos gráficos (ex.: `jul/26`).
- Cada tela começa com uma frase resumindo o que o cliente está vendo.
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
  --sombra-card: 0 4px 24px rgba(18, 48, 61, 0.08);

  /* Espaçamento */
  --esp-1: 8px;
  --esp-2: 16px;
  --esp-3: 24px;
  --esp-4: 32px;
  --esp-5: 48px;
  --esp-6: 64px;

  /* Tipografia */
  --fonte-titulo: "Arapey", Georgia, serif;
  --fonte-corpo: "Open Sans", system-ui, sans-serif;
}
```

---

