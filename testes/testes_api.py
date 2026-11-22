import os
import sys
import unittest
import json
import csv
import io

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
        self.assertEqual(len(dados), 70)
        self.assertIn('score_final', dados[0])

    def test_consulta_municipal_coincide_com_ranking(self):
        ranking = self.cliente.get('/api/ranking').get_json()

        esperado = next(
            item for item in ranking
            if item["municipio_ibge"] == "1504208"
        )

        resposta = self.cliente.post(
            '/api/calcular-score',
            json={"municipio_ibge": "1504208"}
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.get_json(), esperado)

    def test_consulta_direta_normaliza_localidade_como_o_filtro(self):
        resposta = self.cliente.post(
            '/api/calcular-score',
            json={'localidade': ' Araguaina   -   TO '}
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            resposta.get_json()['municipio_ibge'],
            '1702109'
        )

    def test_simulacao_exige_pix_pf_e_pagadores(self):
        payload = {
            "modo": "cenario_mensal",
            "localidade": "Cenário de teste",
            "regiao": "Norte",
            "populacao": 1000,
            "valor_pf": 10_000_000,
        }

        resposta_invalida = self.cliente.post(
            '/api/calcular-score',
            json=payload
        )

        self.assertEqual(resposta_invalida.status_code, 400)

        payload["pagadores_pf"] = 0

        resposta = self.cliente.post(
            '/api/calcular-score',
            json=payload
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            resposta.get_json()["score_final"],
            693.89
        )

    def test_corpo_invalido_e_municipio_fora_do_cadastro(self):
        payloads_invalidos = (
            [],
            ["Marabá"],
            {},
            {"municipio_ibge": True},
            {"modo": "outro"},
        )

        for payload in payloads_invalidos:
            with self.subTest(payload=payload):
                resposta = self.cliente.post(
                    '/api/calcular-score',
                    json=payload
                )

                self.assertEqual(resposta.status_code, 400)

        resposta = self.cliente.post(
            '/api/calcular-score',
            json={"municipio_ibge": "9999999"}
        )

        self.assertEqual(resposta.status_code, 404)

    def test_cabecalhos_cors_e_preflight(self):
        resposta_get = self.cliente.get('/api/status')

        self.assertEqual(
            resposta_get.headers.get('Access-Control-Allow-Origin'),
            '*'
        )

        self.assertIn(
            'OPTIONS',
            resposta_get.headers.get('Access-Control-Allow-Methods', '')
        )

        resposta_options = self.cliente.open(
            '/api/calcular-score',
            method='OPTIONS'
        )

        self.assertEqual(resposta_options.status_code, 204)
        self.assertEqual(
            resposta_options.headers.get('Access-Control-Allow-Origin'),
            '*'
        )

    def test_seguranca_arquivos_estaticos(self):
        self.assertEqual(
            self.cliente.get('/motor_score.py').status_code,
            403
        )

        self.assertEqual(
            self.cliente.get('/app.py').status_code,
            403
        )

        self.assertEqual(
            self.cliente.get('/.gitignore').status_code,
            403
        )

        with self.cliente.get('/index.html') as resposta:
            self.assertEqual(resposta.status_code, 200)

    def test_painel_e_ranking_usam_mesmos_parametros(self):
        with self.cliente.get('/dados/dados_site.json') as resposta:
            self.assertEqual(resposta.status_code, 200)
            painel = resposta.get_json()

        ranking = self.cliente.get('/api/ranking').get_json()

        self.assertTrue(
            all(
                item["parameter_set_id"] == painel["parameter_set_id"]
                for item in ranking
            )
        )

    def test_rota_dados_filtrados_get(self):
        resposta = self.cliente.get(
            '/api/dados-filtrados?regiao=Norte&porte=todos'
        )

        self.assertEqual(resposta.status_code, 200)

        dados = resposta.get_json()

        self.assertIn('municipios', dados)
        self.assertIn('resumo', dados)
        self.assertIn('filtros_aplicados', dados)

        for municipio in dados['municipios']:
            self.assertEqual(municipio['regiao'], 'Norte')

    def test_rota_dados_filtrados_post(self):
        payload = {
            'regiao': 'Nordeste',
            'porte': 'medio',
        }

        resposta = self.cliente.post(
            '/api/dados-filtrados',
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(resposta.status_code, 200)

        dados = resposta.get_json()

        self.assertIn('municipios', dados)

        for municipio in dados['municipios']:
            self.assertEqual(municipio['regiao'], 'Nordeste')
            self.assertGreaterEqual(municipio['populacao'], 150000)
            self.assertLessEqual(municipio['populacao'], 350000)

    def test_rota_exportar_dados_csv(self):
        resposta = self.cliente.get(
            '/api/exportar-dados?regiao=Nordeste'
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertIn(
            'attachment;',
            resposta.headers.get('Content-Disposition', '')
        )
        self.assertIn(
            '.csv',
            resposta.headers.get('Content-Disposition', '')
        )
        self.assertIn(
            'text/csv',
            resposta.headers.get('Content-Type', '')
        )

        texto_csv = resposta.data.decode('utf-8-sig')

        self.assertIn('Município;Código IBGE', texto_csv)
        self.assertIn('Nordeste', texto_csv)

        linha = next(
            csv.DictReader(
                io.StringIO(texto_csv),
                delimiter=';'
            )
        )

        self.assertEqual(
            linha['Início da janela do score'],
            '2024-01'
        )
        self.assertEqual(
            linha['Fim da janela do score'],
            '2026-10'
        )
        self.assertEqual(
            linha['Uso decisório de crédito'],
            'NAO_HOMOLOGADO'
        )
        self.assertTrue(linha['Parâmetros'])

    def test_exportacao_vazia_nao_cria_csv_sem_resultado(self):
        resposta = self.cliente.get(
            '/api/exportar-dados?busca=inexistente'
        )

        self.assertEqual(resposta.status_code, 422)
        self.assertIn(
            'Nenhum município',
            resposta.get_json()['erro']
        )

    def test_rota_exportar_dados_post(self):
        payload = {
            'regiao': 'Norte'
        }

        resposta = self.cliente.post(
            '/exportar-dados',
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(resposta.status_code, 200)
        self.assertIn(
            'attachment;',
            resposta.headers.get('Content-Disposition', '')
        )

        texto_csv = resposta.data.decode('utf-8-sig')
        self.assertIn('Norte', texto_csv)


if __name__ == '__main__':
    unittest.main()