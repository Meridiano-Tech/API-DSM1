import unittest
from motor_score import MotorScore, BENCHMARK_MUNICIPIOS


class TestesMotorScore(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.motor = MotorScore(taxa_inadimplencia_base=5.6)

    def test_inicializacao_e_clusters(self):
        self.assertIsNotNone(self.motor.model_kmeans)
        self.assertEqual(len(self.motor.model_kmeans.cluster_centers_), 3)
        self.assertEqual(len(self.motor.ordem_clusters), 3)

    def test_calculo_municipio_individual(self):
        res = self.motor.calcular_score(
            localidade="Marabá - PA",
            regiao="Norte",
            populacao=283542,
            renda_per_capita=1100.0
        )
        
        chaves_esperadas = [
            "localidade", "regiao", "populacao", "renda_per_capita",
            "score_final", "faixa_score", "classe_risco",
            "pilar_micro", "pilar_macro", "alpha_ponderador",
            "comp_bets_percent", "cluster_ia", "indicadores_base"
        ]
        for chave in chaves_esperadas:
            self.assertIn(chave, res)

        self.assertGreaterEqual(res["score_final"], 0)
        self.assertLessEqual(res["score_final"], 1000)
        self.assertGreaterEqual(res["pilar_micro"], 0.0)
        self.assertLessEqual(res["pilar_micro"], 100.0)
        self.assertGreaterEqual(res["pilar_macro"], 0.0)
        self.assertLessEqual(res["pilar_macro"], 100.0)
        self.assertGreaterEqual(res["comp_bets_percent"], 2.0)
        self.assertLessEqual(res["comp_bets_percent"], 15.0)

    def test_recomendacao_cluster_ia(self):
        res = self.motor.calcular_score(
            localidade="Uberlândia - MG",
            regiao="Sudeste",
            populacao=713232,
            renda_per_capita=2100.0
        )
        cluster = res["cluster_ia"]
        self.assertIn("id", cluster)
        self.assertIn("categoria", cluster)
        self.assertIn("perfil_risco", cluster)
        self.assertIn("recomendacao", cluster)

    def test_ranking_benchmark(self):
        ranking = self.motor.gerar_ranking_benchmark()
        self.assertEqual(len(ranking), 20)
        scores = [item["score_final"] for item in ranking]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_simulacao_personalizada(self):
        res = self.motor.calcular_score(
            localidade="Cidade Simulação - CE",
            regiao="Nordeste",
            populacao=120000,
            renda_per_capita=950.0,
            vol_pix_total=85000000.0,
            valor_pf=40000000.0,
            valor_pj=45000000.0,
            inadimplencia_local=6.2
        )
        self.assertEqual(res["localidade"], "Cidade Simulação - CE")
        self.assertGreater(res["score_final"], 0)


if __name__ == '__main__':
    unittest.main()
