import csv
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from motor_score import (
    DIRETORIO_DADOS, MOTIVO_FALLBACK, SCORE_NEUTRO_FALLBACK,
    MotorScore, MunicipioNaoEncontrado,
)


class TestesMotorScore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.motor = MotorScore()
        cls.painel = json.loads((DIRETORIO_DADOS / "dados_site.json").read_text(encoding="utf-8"))

    def test_ranking_e_estimativas_reproduzem_exportacao(self):
        ranking = self.motor.gerar_ranking_benchmark()
        esperado = self.painel["principais"]["grafico_p2_ranking_score_municipal"]
        self.assertEqual(len(ranking), 70)
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
                                 populacao=1000, valor_pf=100_000_000, pagadores_pf=0)
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

    def test_municipio_sem_observacoes_permanece_publicado_com_fallback(self):
        """Uma lacuna de fonte não pode remover município do ranking do site."""
        with tempfile.TemporaryDirectory() as temporario:
            dados = Path(temporario) / "dados"
            shutil.copytree(DIRETORIO_DADOS, dados)
            painel_path = dados / "dados_site.json"
            painel = json.loads(painel_path.read_text(encoding="utf-8"))
            codigo = painel["catalogo_municipios"][0]["municipio_ibge"]
            taxas = {
                item["mes"]: item["valor_inad"]
                for item in painel["apoio"]["grafico_a1_evolucao_inadimplencia"]
                if item["valor_inad"] is not None
            }
            competencia = max(taxas)

            for item in painel["principais"]["grafico_p2_ranking_score_municipal"]:
                if item["municipio_ibge"] == codigo:
                    item.update(
                        score_final=SCORE_NEUTRO_FALLBACK,
                        Score_Inclusivo=SCORE_NEUTRO_FALLBACK,
                        DowntrendProxy=50.0,
                        status_score="ESTIMADO",
                        reason_score=MOTIVO_FALLBACK,
                        competencia_calculada=None,
                        meses_validos=0,
                        cobertura_pct=0.0,
                    )
            for item in painel["ranking_inadimplencia_municipal"]:
                if item["municipio_ibge"] == codigo:
                    item.update(
                        taxa_inadimplencia=taxas[competencia],
                        competencia_inadimplencia=competencia,
                        status_inadimplencia="ESTIMADO",
                    )
            painel_path.write_text(json.dumps(painel, ensure_ascii=False), encoding="utf-8")

            metricas_path = dados / "municipal_metrics.csv"
            with metricas_path.open(encoding="utf-8", newline="") as arquivo:
                linhas = list(csv.DictReader(arquivo))
            for linha in linhas:
                if linha["municipio_ibge"] == codigo:
                    linha["observado"] = "False"
                    for campo in ("valor_pf", "valor_pj", "pagadores_pf", "pagadores_pj"):
                        linha[campo] = ""
            with metricas_path.open("w", encoding="utf-8", newline="") as arquivo:
                escritor = csv.DictWriter(arquivo, fieldnames=linhas[0].keys())
                escritor.writeheader()
                escritor.writerows(linhas)

            motor = MotorScore(dados)
            resultado = motor.calcular_score(municipio_ibge=codigo)
            self.assertEqual(resultado["score_final"], SCORE_NEUTRO_FALLBACK)
            self.assertEqual(resultado["status_score"], "ESTIMADO")
            self.assertEqual(resultado["reason_score"], MOTIVO_FALLBACK)
            self.assertEqual(resultado["meses_validos"], 0)
            self.assertEqual(len(motor.gerar_ranking_benchmark()), 70)
