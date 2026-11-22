const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const dados = require('../../dados/dados_site.json');
const erros = new WeakMap();

test.beforeEach(async ({ page }) => {
  erros.set(page, []);
  page.on('pageerror', erro => erros.get(page).push(erro.message));

  // Usa a biblioteca real da versão publicada, sem depender do CDN no teste.
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    path: path.join(__dirname, '../../node_modules/chart.js/dist/chart.umd.js'),
    contentType: 'application/javascript',
  }));

  await page.route('https://fonts.googleapis.com/**', route => route.abort());
});

test.afterEach(async ({ page }) => {
  expect(erros.get(page)).toEqual([]);
});

test('indicadores por ano, escopo dos filtros e valores do Colab', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status-dados')).toContainText('carregada');
  await expect(page.locator('#cobertura-base')).toContainText('carteira até 2026-09');
  await expect(page.locator('#grafico-1 .dados-grafico')).toHaveCount(1);
  await expect(page.locator('canvas[role="img"]')).toHaveCount(2);

  const pix = await page.locator('#card-2 .cardvalor').innerText();

  await page.selectOption('#filtro-regiao-macro', 'Sudeste');
  await expect(page.locator('#badge-total-filtrado')).toHaveText('10 municípios');
  await expect(page.locator('#card-2 .cardvalor')).toHaveText(pix);
  await expect(page.locator('#grafico-1 h3')).toContainText('Norte e Nordeste');

  await page.selectOption('#filtro-ano', '2024');
  await expect(page.locator('#card-1 .carddetalhe'))
    .toContainText('Base de 2023 indisponível');

  const linhaUberlandia = page
    .locator('#grafico-2 .dados-grafico tbody th')
    .filter({ hasText: /^Uberlândia$/ });

  await expect(linhaUberlandia).toHaveCount(1);
  await expect(linhaUberlandia).toHaveText('Uberlândia');
});

test('busca sem acento, exportação com proveniência e resultado vazio', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#btn-exportar-csv')).toBeEnabled();

  await page.fill('#filtro-busca-muni', ' Araguaina ');
  await expect(page.locator('#badge-total-filtrado')).toHaveText('1 município');
  await expect(page.locator('#grafico-2 .dados-grafico'))
    .toContainText('770,25 pontos');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btn-exportar-csv'),
  ]);

  const csv = await fs.readFile(await download.path(), 'utf8');

  for (const texto of [
    'Araguaína',
    '2024-01',
    '2026-10',
    dados.model_version,
    dados.parameter_set_id,
    'NAO_HOMOLOGADO',
  ]) {
    expect(csv).toContain(texto);
  }

  await page.fill('#filtro-busca-muni', 'município inexistente');
  await expect(page.locator('#btn-exportar-csv')).toBeDisabled();
  await expect(page.locator('#grafico-2 .graficoarea'))
    .toContainText('Nenhum resultado');
  await expect(page.locator('#grafico-2 .dados-grafico tbody tr'))
    .toHaveCount(0);
});

test('extrato preserva ausências, recorte recente e navegação por teclado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#timeline-lista .timeline-item')).toHaveCount(60);

  await page.focus('#btn-ver-timeline');
  await page.keyboard.press('ArrowRight');

  await expect(page.locator('#btn-ver-tabela')).toBeFocused();
  await expect(page.locator('#painel-tabela')).toBeVisible();
  await expect(page.locator('#painel-timeline')).toBeHidden();

  await page.selectOption('#filtro-periodo-extrato', '2026');

  const linha = page.locator('#tabela-extrato-corpo tr').first();

  await expect(linha).toContainText('2026-10');
  await expect(linha.locator('td').nth(2)).toHaveText('—');
  await expect(linha.locator('td').nth(4)).toHaveText('—');
  await expect(linha).toContainText('Cobertura parcial');

  await page.keyboard.press('Home');
  await expect(page.locator('#btn-ver-timeline')).toBeFocused();
});

test('consulta publicada coincide com o Colab; rankings compartilham escala', async ({ page }) => {
  await page.goto('/composicao.html');
  await expect(page.locator('#select-municipio')).toBeEnabled();

  await page.selectOption('#select-municipio', '1702109');
  await page.click('#btn-calcular');

  await expect(page.locator('#res-score')).toHaveText('770,25');
  await expect(page.locator('#res-inadimplencia'))
    .toContainText('4,7309% em 2026-09');
  await expect(page.locator('#simulador-status'))
    .toContainText('indisponível nesta versão');
  await expect(page.locator('canvas[role="img"]')).toHaveCount(8);

  await page.locator('#analises > summary').click();
  await expect(page.locator('#grafico-colab-6 canvas')).toBeVisible();

  const escalas = await page.evaluate(() => [5, 6].map(indice =>
    Chart.getChart(
      document.querySelector(`#grafico-colab-${indice} canvas`)
    ).options.scales.x.max
  ));

  expect(escalas[0]).toBe(escalas[1]);

  await expect(
    page.locator('#grafico-colab-5 .dados-grafico tbody th').first()
  ).not.toContainText('2026-09');

  await expect(page.locator('#metodologia')).toContainText('não homologado');
});

test('contingência sem Chart mantém tabelas, filtros e CSV', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('/');

  await expect(page.locator('#btn-exportar-csv')).toBeEnabled();
  await expect(page.locator('#grafico-1 .graficoarea'))
    .toContainText('Consulte os mesmos dados');

  await page.fill('#filtro-busca-muni', 'Ji-Parana');
  await expect(page.locator('#badge-total-filtrado')).toHaveText('1 município');

  const linhaJiParana = page
    .locator('#grafico-2 .dados-grafico tbody th')
    .filter({ hasText: /^Ji-Paraná$/ });

  await expect(linhaJiParana).toHaveCount(1);
  await expect(linhaJiParana).toHaveText('Ji-Paraná');

  await page.goto('/composicao.html');
  await expect(page.locator('.dados-grafico[open]')).toHaveCount(8);
  await expect(page.locator('#select-municipio')).toBeEnabled();
});

test('falha de dados desabilita ações e permite recarregar', async ({ page }) => {
  let falhar = true;

  await page.route('**/dados/dados_site.json', route =>
    falhar ? route.abort() : route.continue()
  );

  await page.goto('/');

  await expect(page.locator('#recarregar-dados')).toBeVisible();
  await expect(page.locator('#filtro-ano')).toBeDisabled();
  await expect(page.locator('#btn-exportar-csv')).toBeDisabled();

  falhar = false;
  await page.click('#recarregar-dados');

  await expect(page.locator('#status-dados')).toContainText('carregada');
  await expect(page.locator('#btn-exportar-csv')).toBeEnabled();
});

test('API compatível habilita cenário e falha preserva consulta municipal', async ({ page }) => {
  await page.route('**/api/ranking', route => route.fulfill({
    json: dados.principais.grafico_p2_ranking_score_municipal.map(item => ({
      ...item,
      parameter_set_id: dados.parameter_set_id,
      model_version: dados.model_version,
    })),
  }));

  await page.route('**/api/calcular-score', route => route.fulfill({
    status: 503,
    json: { erro: 'Indisponível' },
  }));

  await page.goto('/composicao.html');

  await expect(
    page.locator('#select-municipio option[value="cenario"]')
  ).toHaveCount(1);

  await page.selectOption('#select-municipio', 'cenario');
  await page.fill('#campo-localidade', 'Cenário de teste');
  await page.fill('#campo-populacao', '1000');
  await page.fill('#campo-valor-pf', '10000000');
  await page.fill('#campo-pagadores-pf', '0');
  await page.click('#btn-calcular');

  await expect(page.locator('#simulador-erro')).toContainText('tente novamente');
  await expect(page.locator('#campo-populacao')).toHaveValue('1000');

  await page.selectOption('#select-municipio', '1702109');
  await page.click('#btn-calcular');
  await expect(page.locator('#res-score')).toHaveText('770,25');
});

test('timeout dos dados mostra uma ação de recuperação', async ({ page }) => {
  await page.clock.install();
  await page.route('**/dados/dados_site.json', () => {});

  const pedido = page.waitForRequest('**/dados/dados_site.json');

  await page.goto('/');
  await pedido;
  await page.clock.runFor(12001);

  await expect(page.locator('#recarregar-dados')).toBeVisible();
  await expect(page.locator('#btn-exportar-csv')).toBeDisabled();
});

for (const largura of [360, 390, 768, 900]) {
  test(`navegação e largura utilizável em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 844 });

    for (const url of ['/', '/composicao.html', '/sobre.html']) {
      await page.goto(url);

      for (const nome of ['Início', 'Análises', 'Sobre Nós']) {
        await expect(
          page.getByRole('navigation').getByRole('link', {
            name: nome,
            exact: true,
          })
        ).toBeVisible();
      }

      await expect(page.locator('nav [aria-current="page"]')).toHaveCount(1);

      const semOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );

      expect(semOverflow).toBe(true);
    }

    await expect(page.locator('#form-contato')).toHaveCount(0);

    await expect(
      page.getByRole('link', { name: 'Falar com a equipe no GitHub' })
    ).toHaveAttribute(
      'href',
      'https://github.com/Meridiano-Tech/API-DSM1/issues'
    );

    await page.getByRole('link', { name: 'Credit42 — início' }).click();
    await expect(page).toHaveURL(/index\.html$/);
  });
}

test('HTTP 200 com JSON incompleto oferece recuperação', async ({ page }) => {
  await page.route('**/dados/dados_site.json', route =>
    route.fulfill({ json: { erro: 'Base indisponível' } })
  );

  await page.goto('/composicao.html');

  await expect(page.locator('#recarregar-dados')).toBeVisible();
  await expect(page.locator('#select-municipio')).toBeDisabled();
  await expect(page.locator('#btn-calcular')).toBeDisabled();
});

test('CSV respeita a competência individual e o status da linha', async ({ page }) => {
  const painel = structuredClone(dados);
  const cidade = painel.principais.grafico_p2_ranking_score_municipal
    .find(item => item.municipio_ibge === '1702109');

  cidade.competencia_calculada = '2026-08';

  await page.route('**/dados/dados_site.json', route =>
    route.fulfill({ json: painel })
  );

  await page.goto('/');
  await page.fill('#filtro-busca-muni', 'Araguaina');
  await expect(page.locator('#badge-total-filtrado')).toHaveText('1 município');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btn-exportar-csv'),
  ]);

  const [, linha] = (await fs.readFile(await download.path(), 'utf8')).split('\r\n');
  const campos = linha.slice(1, -1).split('";"');

  expect(campos[12]).toBe('2026-10');
  expect(campos[13]).toBe('2026-08');
  expect(campos[17]).toBe(cidade.Aprovacao);
});

test('extrato usa a mesma unidade e distingue cobertura comum de parcial', async ({ page }) => {
  const painel = structuredClone(dados);
  const taxa = painel.serie_inadimplencia_regional.find(
    item => item.competencia === '2026-10' && item.regiao === 'Sudeste'
  );

  Object.assign(taxa, {
    valor: 4,
    data_status: 'CALCULADO',
    reason_code: 'OK',
  });

  await page.route('**/dados/dados_site.json', route =>
    route.fulfill({ json: painel })
  );

  await page.goto('/');
  await expect(page.locator('#cobertura-base'))
    .toContainText('inadimplência regional até 2026-09');

  await page.selectOption('#filtro-regiao-extrato', { label: 'Sudeste' });
  await page.click('#btn-ver-tabela');

  const linhas = page.locator('#tabela-extrato-corpo tr');

  await expect(linhas.nth(0).locator('td').nth(3)).toHaveText('R$ 1,85 Tri');
  await expect(linhas.nth(0).locator('td').nth(4)).toHaveText('4%');
  await expect(linhas.nth(1).locator('td').nth(2)).toHaveText('R$ 3,46 Tri');
});

test('cenário rejeita resposta de outro modelo e limpa resultado anterior', async ({ page }) => {
  const ranking = dados.principais.grafico_p2_ranking_score_municipal.map(item => ({
    ...item,
    model_version: dados.model_version,
    parameter_set_id: dados.parameter_set_id,
  }));

  await page.route('**/api/ranking', route => route.fulfill({ json: ranking }));

  let versao = dados.model_version;

  await page.route('**/api/calcular-score', route => route.fulfill({
    json: {
      modo: 'cenario_mensal',
      localidade: 'Teste',
      regiao: 'Norte',
      DowntrendProxy: 60,
      score_final: 720,
      model_version: versao,
      parameter_set_id: dados.parameter_set_id,
    },
  }));

  await page.goto('/composicao.html');
  await page.selectOption('#select-municipio', 'cenario');
  await page.fill('#campo-localidade', 'Teste');
  await page.fill('#campo-populacao', '1000');
  await page.fill('#campo-valor-pf', '10000000');
  await page.fill('#campo-pagadores-pf', '0');
  await page.click('#btn-calcular');

  await expect(page.locator('#res-score')).toHaveText('720');

  versao = 'outra-versao';

  await page.fill('#campo-populacao', '1001');
  await expect(page.locator('#resultado-ativo')).toBeHidden();

  await page.click('#btn-calcular');

  await expect(page.locator('#simulador-erro')).toBeVisible();
  await expect(page.locator('#resultado-ativo')).toBeHidden();
  await expect(page.locator('#campo-populacao')).toHaveValue('1001');
});

test('formulário com API preserva a mensagem em erro e confirma a gravação', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({
    json: { contato_disponivel: true },
  }));

  let gravado = false;

  await page.route('**/api/contato', route => route.fulfill({
    status: gravado ? 201 : 500,
    json: gravado
      ? { status: 'sucesso' }
      : { erro: 'Contato indisponível' },
  }));

  await page.goto('/sobre.html');
  await page.fill('#nome', 'Teste');
  await page.fill('#email', 'teste@example.org');
  await page.fill('#mensagem', 'Mensagem de teste');
  await page.click('#form-contato button');

  await expect(page.locator('#msg-sucesso')).toContainText('sem confirmação');
  await expect(page.locator('#mensagem')).toHaveValue('Mensagem de teste');

  gravado = true;
  await page.click('#form-contato button');

  await expect(page.locator('#msg-sucesso')).toContainText('Mensagem enviada');
  await expect(page.locator('#mensagem')).toHaveValue('');
});