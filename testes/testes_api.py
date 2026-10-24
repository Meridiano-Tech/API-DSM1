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

    def test_calcular_score_sucesso(self):
        payload = {
            "localidade": "Juazeiro do Norte - CE",
            "regiao": "Nordeste",
            "populacao": 270000,
            "renda_per_capita": 1050.0,
            "inadimplencia_local": 5.8
        }
        resposta = self.cliente.post(
            '/api/calcular-score',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resposta.status_code, 200)
        dados = json.loads(resposta.data)
        self.assertEqual(dados['localidade'], 'Juazeiro do Norte - CE')
        self.assertIn('score_final', dados)
        self.assertIn('cluster_ia', dados)
        self.assertIn('comp_bets_percent', dados)

    def test_calcular_score_dados_invalidos(self):
        payload = {
            "populacao": "invalido",
            "renda_per_capita": "texto"
        }
        resposta = self.cliente.post(
            '/api/calcular-score',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resposta.status_code, 400)
        dados = json.loads(resposta.data)
        self.assertIn('erro', dados)

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

    def test_validacao_limites_negativos(self):
        testes = [
            {"populacao": -500},
            {"renda_per_capita": 0},
            {"inadimplencia_local": 105.0},
            {"vol_pix_total": -10.0}
        ]
        for payload in testes:
            resp = self.cliente.post(
                '/api/calcular-score',
                data=json.dumps(payload),
                content_type='application/json'
            )
            self.assertEqual(resp.status_code, 400)
            self.assertIn('erro', json.loads(resp.data))


if __name__ == '__main__':
    unittest.main()
