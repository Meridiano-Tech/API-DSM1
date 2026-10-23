import unittest
import json
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


if __name__ == '__main__':
    unittest.main()
