import os
import sys
import unittest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app


class TestesAPI(unittest.TestCase):

    def setUp(self):
        self.cliente = app.test_client()
        self.cliente.testing = True

    def test_rota_status(self):
        resposta = self.cliente.get('/api/status')
        self.assertEqual(resposta.status_code, 200)
        dados = json.loads(resposta.data)
        self.assertEqual(dados['status'], 'online')

    def test_rota_ranking(self):
        resposta = self.cliente.get('/api/ranking')
        self.assertEqual(resposta.status_code, 200)
        dados = json.loads(resposta.data)
        self.assertIsInstance(dados, list)
        self.assertEqual(len(dados), 20)
        self.assertIn('score_final', dados[0])

    def test_consulta_municipal_coincide_com_ranking(self):
        ranking = self.cliente.get('/api/ranking').get_json()
        esperado = next(item for item in ranking if item["municipio_ibge"] == "1504208")
        resposta = self.cliente.post('/api/calcular-score', json={"municipio_ibge": "1504208"})
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.get_json(), esperado)

    def test_simulacao_exige_pix_pf_e_pagadores(self):
        payload = {
            "modo": "cenario_mensal",
            "localidade": "Cenário de teste",
            "regiao": "Norte",
            "populacao": 1000,
            "valor_pf": 10_000_000,
        }
        self.assertEqual(self.cliente.post('/api/calcular-score', json=payload).status_code, 400)
        payload["pagadores_pf"] = 0
        resposta = self.cliente.post('/api/calcular-score', json=payload)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.get_json()["score_final"], 720)

    def test_corpo_invalido_e_municipio_fora_do_cadastro(self):
        for payload in ([], ["Marabá"], {}, {"municipio_ibge": True}, {"modo": "outro"}):
            with self.subTest(payload=payload):
                self.assertEqual(self.cliente.post('/api/calcular-score', json=payload).status_code, 400)
        resposta = self.cliente.post('/api/calcular-score', json={"municipio_ibge": "9999999"})
        self.assertEqual(resposta.status_code, 404)

    def test_cabecalhos_cors_e_preflight(self):
        resposta_get = self.cliente.get('/api/status')
        self.assertEqual(resposta_get.headers.get('Access-Control-Allow-Origin'), '*')
        self.assertIn('OPTIONS', resposta_get.headers.get('Access-Control-Allow-Methods', ''))

        resposta_opt = self.cliente.open('/api/calcular-score', method='OPTIONS')
        self.assertEqual(resposta_opt.status_code, 204)
        self.assertEqual(resposta_opt.headers.get('Access-Control-Allow-Origin'), '*')

    def test_seguranca_arquivos_estaticos(self):
        self.assertEqual(self.cliente.get('/motor_score.py').status_code, 403)
        self.assertEqual(self.cliente.get('/app.py').status_code, 403)
        self.assertEqual(self.cliente.get('/.gitignore').status_code, 403)
        with self.cliente.get('/index.html') as resp:
            self.assertEqual(resp.status_code, 200)

    def test_painel_e_ranking_usam_mesmos_parametros(self):
        with self.cliente.get('/dados/dados_site.json') as resposta:
            self.assertEqual(resposta.status_code, 200)
            painel = resposta.get_json()
        ranking = self.cliente.get('/api/ranking').get_json()
        self.assertTrue(all(item["parameter_set_id"] == painel["parameter_set_id"] for item in ranking))

    def test_rota_dados_filtrados_get(self):
        resp = self.cliente.get('/api/dados-filtrados?regiao=Norte&porte=todos')
        self.assertEqual(resp.status_code, 200)
        dados = json.loads(resp.data)
        self.assertIn('municipios', dados)
        self.assertIn('resumo', dados)
        self.assertIn('filtros_aplicados', dados)
        for m in dados['municipios']:
            self.assertEqual(m['regiao'], 'Norte')

    def test_rota_dados_filtrados_post(self):
        payload = {'regiao': 'Nordeste', 'porte': 'medio'}
        resp = self.cliente.post(
            '/api/dados-filtrados',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        dados = json.loads(resp.data)
        self.assertIn('municipios', dados)
        for m in dados['municipios']:
            self.assertEqual(m['regiao'], 'Nordeste')
            self.assertGreaterEqual(m['populacao'], 150000)
            self.assertLessEqual(m['populacao'], 350000)

    def test_rota_exportar_dados_csv(self):
        resp = self.cliente.get('/api/exportar-dados?regiao=Nordeste')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('attachment;', resp.headers.get('Content-Disposition', ''))
        self.assertIn('.csv', resp.headers.get('Content-Disposition', ''))
        self.assertIn('text/csv', resp.headers.get('Content-Type', ''))
        texto_csv = resp.data.decode('utf-8-sig')
        self.assertIn('Município;Código IBGE', texto_csv)
        self.assertIn('Nordeste', texto_csv)

    def test_rota_exportar_dados_post(self):
        payload = {'regiao': 'Norte'}
        resp = self.cliente.post(
            '/exportar-dados',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn('attachment;', resp.headers.get('Content-Disposition', ''))
        texto_csv = resp.data.decode('utf-8-sig')
        self.assertIn('Norte', texto_csv)


if __name__ == '__main__':
    unittest.main()
