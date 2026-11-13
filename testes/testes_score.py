import json
import unittest

from motor_score import DIRETORIO_DADOS, MotorScore, MunicipioNaoEncontrado


class TestesMotorScore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.motor = MotorScore()
        cls.painel = json.loads((DIRETORIO_DADOS / "dados_site.json").read_text(encoding="utf-8"))

    def test_ranking_e_estimativas_reproduzem_exportacao(self):
        ranking = self.motor.gerar_ranking_benchmark()
        esperado = self.painel["principais"]["grafico_p2_ranking_score_municipal"]
        self.assertEqual(len(ranking), 20)
        self.assertEqual(
            [(r["municipio_ibge"], r["score_final"], r["meses_validos"]) for r in ranking],
            [(r["municipio_ibge"], r["score_final"], r["meses_validos"]) for r in esperado],
        )
        taxas = {r["municipio_ibge"]: r for r in self.painel["ranking_inadimplencia_municipal"]}
        for resultado in ranking:
            taxa = taxas[resultado["municipio_ibge"]]
            base = resultado["indicadores_base"]
            self.assertEqual(base["inadimplencia_estimada"], taxa["taxa_inadimplencia"])
            self.assertEqual(base["competencia_inadimplencia"], taxa["competencia_inadimplencia"])
            self.assertEqual(base["status_inadimplencia"], "ESTIMADO")

    def test_consulta_por_codigo_e_por_localidade(self):
        resultado = self.motor.calcular_score(municipio_ibge="1504208")
        self.assertEqual(resultado, self.motor.calcular_score(localidade="  marabá - pa "))
        self.assertEqual(resultado["Aprovacao"], "NAO_HOMOLOGADO")
        with self.assertRaises(MunicipioNaoEncontrado):
            self.motor.calcular_score(municipio_ibge="9999999")

    def test_cenario_mensal_preserva_zeros_e_referencia(self):
        # Cenário hipotético: volume acima do máximo e pagadores abaixo do mínimo.
        res = self.motor.simular(localidade="Cenário de teste", regiao="Norte",
                                 populacao=1000, valor_pf=10_000_000, pagadores_pf=0)
        self.assertEqual(res["componentes"], {
            "volume_pf_normalizado": 100, "pagadores_pf_normalizados": 0,
        })
        self.assertEqual(res["DowntrendProxy"], 60)
        self.assertEqual(res["score_final"], 720)
        self.assertEqual(res["modo"], "cenario_mensal")

    def test_pagadores_ausentes_e_nao_finitos_nao_geram_score(self):
        for valor in (None, -1, float("nan"), True, 3.5):
            with self.subTest(valor=valor), self.assertRaises(ValueError):
                self.motor.simular(localidade="Cenário", regiao="Sul", populacao=1000,
                                   valor_pf=1_000_000, pagadores_pf=valor)
