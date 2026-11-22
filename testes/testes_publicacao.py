import json
import shutil
import tempfile
import unittest
from hashlib import sha256
from pathlib import Path

from scripts.build_pages import ROOT, validar_exportacao_colab


class TestesPublicacao(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dados = Path(self.temp.name) / 'dados'
        shutil.copytree(ROOT / 'dados', self.dados)

    def alterar_painel(self, alterar):
        caminho = self.dados / 'dados_site.json'
        painel = json.loads(caminho.read_text(encoding='utf-8'))
        alterar(painel)
        caminho.write_text(json.dumps(painel, ensure_ascii=False), encoding='utf-8')
        manifesto = self.dados / 'run_manifest.json'
        conteudo = json.loads(manifesto.read_text(encoding='utf-8'))
        conteudo['output_sha256']['dados_site.json'] = sha256(caminho.read_bytes()).hexdigest()
        manifesto.write_text(json.dumps(conteudo), encoding='utf-8')

    def test_exportacao_real_e_ausencias_justificadas_sao_aceitas(self):
        validar_exportacao_colab(self.dados)

    def test_taxa_acima_de_100_reprovada_mesmo_com_hash_atualizado(self):
        self.alterar_painel(lambda p: p['serie_inadimplencia_regional'][0].update(valor=101))
        with self.assertRaisesRegex(ValueError, 'taxa regional'):
            validar_exportacao_colab(self.dados)

    def test_nan_reprovado(self):
        self.alterar_painel(lambda p: p['pix_brasil'][0].update(valor_pf=float('nan')))
        with self.assertRaisesRegex(ValueError, 'valor_pf'):
            validar_exportacao_colab(self.dados)

    def test_pix_regional_nao_pode_divergir_do_nacional(self):
        def alterar(p):
            p['pix_brasil'][0]['valor_pf'] += 1000
            p['pix_brasil'][0]['vol_pix_total'] += 1000
        self.alterar_painel(alterar)
        with self.assertRaisesRegex(ValueError, 'nacional não concilia'):
            validar_exportacao_colab(self.dados)

    def test_grade_com_duplicata_reprovada(self):
        self.alterar_painel(lambda p: p['pix_regioes'].__setitem__(1, p['pix_regioes'][0]))
        with self.assertRaisesRegex(ValueError, 'Grade'):
            validar_exportacao_colab(self.dados)

    def test_score_nao_pode_divergir_das_observacoes(self):
        self.alterar_painel(lambda p: p['principais']['grafico_p2_ranking_score_municipal'][0].update(score_final=999))
        with self.assertRaises(ValueError):
            validar_exportacao_colab(self.dados)

    def test_competencia_nacional_duplicada_e_rejeitada(self):
        def duplicar(painel):
            nacional = painel['apoio']['grafico_a1_evolucao_inadimplencia']
            nacional.append(nacional[0])
        self.alterar_painel(duplicar)
        with self.assertRaisesRegex(ValueError, 'Grade nacional'):
            validar_exportacao_colab(self.dados)

    def test_valor_regional_marcado_como_ausente_e_rejeitado(self):
        self.alterar_painel(lambda p: p['serie_inadimplencia_regional'][0].update(data_status='SEM_DADO'))
        with self.assertRaisesRegex(ValueError, 'status'):
            validar_exportacao_colab(self.dados)

    def test_fonte_de_outra_uf_e_rejeitada(self):
        def trocar(painel):
            estados = painel['inadimplencia_estadual']
            estados[0]['source_url'] = estados[-1]['source_url']
        self.alterar_painel(trocar)
        with self.assertRaisesRegex(ValueError, 'fonte estadual'):
            validar_exportacao_colab(self.dados)

    def test_proxy_municipal_divergente_e_rejeitada(self):
        self.alterar_painel(lambda p: p['principais']['grafico_p2_ranking_score_municipal'][0].update(DowntrendProxy=0))
        with self.assertRaises(ValueError):
            validar_exportacao_colab(self.dados)

    def test_pos_deploy_identifica_javascript_antigo_mesmo_com_json_correto(self):
        from io import BytesIO
        from urllib.parse import urlsplit
        from unittest.mock import patch
        from scripts.verificar_publicacao import verificar

        def resposta(req, timeout):
            caminho = urlsplit(req.full_url).path.lstrip('/')
            if caminho == 'js/dados.js':
                return BytesIO(b'// versao anterior')
            return BytesIO((ROOT / caminho).read_bytes())

        with patch('scripts.verificar_publicacao.urlopen', side_effect=resposta):
            with self.assertRaisesRegex(SystemExit, 'js/dados.js'):
                verificar('https://pages.example', tentativas=1)
