import os
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from servicos_dados import (
    consultar_serie_bcb,
    obter_inadimplencia_regional_bcb,
    classificar_porte_populacao,
    classificar_faixa_renda,
    obter_municipios_completos,
    filtrar_municipios_socioeconomicos,
    FALLBACK_INADIMPLENCIA
)


class TestesServicosDados(unittest.TestCase):

    def test_classificacao_porte_populacao(self):
        self.assertEqual(classificar_porte_populacao(80000), 'Pequeno Porte')
        self.assertEqual(classificar_porte_populacao(200000), 'Médio Porte')
        self.assertEqual(classificar_porte_populacao(500000), 'Grande Porte / Metrópole')

    def test_classificacao_faixa_renda(self):
        self.assertEqual(classificar_faixa_renda(850.0), 'Baixa Renda (< R$ 1.000)')
        self.assertEqual(classificar_faixa_renda(1200.0), 'Renda Média (R$ 1.000 a R$ 1.500)')
        self.assertEqual(classificar_faixa_renda(2100.0), 'Renda Alta (> R$ 1.500)')

    def test_obter_municipios_completos(self):
        municipios = obter_municipios_completos()
        self.assertEqual(len(municipios), 20)
        primeiro = municipios[0]
        self.assertIn('localidade', primeiro)
        self.assertIn('codigo_ibge', primeiro)
        self.assertIn('porte', primeiro)
        self.assertIn('faixa_renda', primeiro)
        self.assertIn('score_final', primeiro)
        self.assertIn('classe_risco', primeiro)

    def test_filtrar_por_regiao(self):
        res_norte = filtrar_municipios_socioeconomicos({'regiao': 'Norte'})
        for m in res_norte['municipios']:
            self.assertEqual(m['regiao'], 'Norte')
        self.assertGreater(res_norte['total'], 0)
        self.assertIn('media_score', res_norte['resumo'])

    def test_filtrar_por_porte(self):
        res_pequeno = filtrar_municipios_socioeconomicos({'porte': 'pequeno'})
        for m in res_pequeno['municipios']:
            self.assertLess(m['populacao'], 150000)

        res_medio = filtrar_municipios_socioeconomicos({'porte': 'medio'})
        for m in res_medio['municipios']:
            self.assertGreaterEqual(m['populacao'], 150000)
            self.assertLessEqual(m['populacao'], 350000)

    def test_filtrar_por_busca_texto(self):
        res_busca = filtrar_municipios_socioeconomicos({'busca': 'Marabá'})
        self.assertEqual(res_busca['total'], 1)
        self.assertIn('Marabá', res_busca['municipios'][0]['localidade'])

    def test_fallback_inadimplencia_regional(self):
        with patch('servicos_dados.consultar_serie_bcb', return_value=[]):
            taxa_norte = obter_inadimplencia_regional_bcb('Norte')
            self.assertEqual(taxa_norte, FALLBACK_INADIMPLENCIA['Norte'])

    @patch('requests.get')
    def test_consultar_serie_bcb_com_dados(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {'data': '01/01/2026', 'valor': '5.85'}
        ]
        mock_get.return_value = mock_resp

        dados = consultar_serie_bcb(15952, ultimos=1)
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['valor'], 5.85)


if __name__ == '__main__':
    unittest.main()

