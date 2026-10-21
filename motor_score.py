import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BENCHMARK_MUNICIPIOS = {
    'Marabá - PA': {'code': 1504208, 'uf': 15, 'reg': 'Norte', 'pop': 283542, 'renda_per_capita_est': 1100},
    'Imperatriz - MA': {'code': 2105302, 'uf': 21, 'reg': 'Nordeste', 'pop': 273110, 'renda_per_capita_est': 1050},
    'Parnaíba - PI': {'code': 2207702, 'uf': 22, 'reg': 'Nordeste', 'pop': 162159, 'renda_per_capita_est': 980},
    'Castanhal - PA': {'code': 1502400, 'uf': 15, 'reg': 'Norte', 'pop': 203251, 'renda_per_capita_est': 1000},
    'Sobral - CE': {'code': 2312908, 'uf': 23, 'reg': 'Nordeste', 'pop': 210711, 'renda_per_capita_est': 990},
    'Arapiraca - AL': {'code': 2700300, 'uf': 27, 'reg': 'Nordeste', 'pop': 234696, 'renda_per_capita_est': 950},
    'Juazeiro - BA': {'code': 2918407, 'uf': 29, 'reg': 'Nordeste', 'pop': 235816, 'renda_per_capita_est': 960},
    'Mossoró - RN': {'code': 2408003, 'uf': 24, 'reg': 'Nordeste', 'pop': 264577, 'renda_per_capita_est': 1020},
    'Petrolina - PE': {'code': 2611101, 'uf': 26, 'reg': 'Nordeste', 'pop': 386786, 'renda_per_capita_est': 1080},
    'Ji-Paraná - RO': {'code': 1100122, 'uf': 11, 'reg': 'Norte', 'pop': 124333, 'renda_per_capita_est': 1150},
    'Santarém - PA': {'code': 1506807, 'uf': 15, 'reg': 'Norte', 'pop': 331937, 'renda_per_capita_est': 950},
    'Caxias - MA': {'code': 2103000, 'uf': 21, 'reg': 'Nordeste', 'pop': 156973, 'renda_per_capita_est': 880},
    'Picos - PI': {'code': 2208007, 'uf': 22, 'reg': 'Nordeste', 'pop': 83090, 'renda_per_capita_est': 910},
    'Araguaína - TO': {'code': 1702109, 'uf': 17, 'reg': 'Norte', 'pop': 171301, 'renda_per_capita_est': 1050},
    'Caucaia - CE': {'code': 2303709, 'uf': 23, 'reg': 'Nordeste', 'pop': 355542, 'renda_per_capita_est': 940},
    'Ilhéus - BA': {'code': 2913606, 'uf': 29, 'reg': 'Nordeste', 'pop': 178703, 'renda_per_capita_est': 970},
    'Campina Grande - PB': {'code': 2504009, 'uf': 25, 'reg': 'Nordeste', 'pop': 419360, 'renda_per_capita_est': 1120},
    'Caruaru - PE': {'code': 2604106, 'uf': 26, 'reg': 'Nordeste', 'pop': 378052, 'renda_per_capita_est': 1100},
    'Vitória da Conquista - BA': {'code': 2933307, 'uf': 29, 'reg': 'Nordeste', 'pop': 370868, 'renda_per_capita_est': 1060},
    'Uberlândia - MG': {'code': 3170206, 'uf': 31, 'reg': 'Sudeste', 'pop': 713232, 'renda_per_capita_est': 2100}
}


def obter_inadimplencia_nacional_bcb(fallback=5.6):
    url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.21082/dados/ultimos/1?formato=json"
    try:
        res = requests.get(url, timeout=5, verify=False)
        if res.status_code == 200 and len(res.json()) > 0:
            return float(res.json()[0]['valor'])
    except Exception:
        pass
    return float(fallback)


class MotorScore:
    def __init__(self, taxa_inadimplencia_base=None):
        self.taxa_base = taxa_inadimplencia_base or obter_inadimplencia_nacional_bcb()
        self.scaler = StandardScaler()
        self.model_kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        self._treinar_modelo_ia()

    def _treinar_modelo_ia(self):
        dados_treino = []
        for nome, cfg in BENCHMARK_MUNICIPIOS.items():
            pop = cfg['pop']
            renda = cfg['renda_per_capita_est']
            pop_ativa = pop * 0.65
            vol_pf = pop_ativa * renda * 0.40
            vol_pj = pop_ativa * renda * 0.60
            vol_total = vol_pf + vol_pj
            pix_pc = vol_total / pop
            fragilidade = vol_pf / (vol_total + 1)
            
            fator_reg = 1.35 if cfg['reg'] == 'Nordeste' else (1.20 if cfg['reg'] == 'Norte' else 1.0)
            inad_est = self.taxa_base * fator_reg * (1 + (pop / 1_000_000) * 0.4)
            dados_treino.append([pop, renda, pix_pc, fragilidade, inad_est])
            
        X = np.array(dados_treino)
        X_scaled = self.scaler.fit_transform(X)
        self.model_kmeans.fit(X_scaled)
        
        centros = self.model_kmeans.cluster_centers_
        scores_centros = centros[:, 1] + centros[:, 2] - centros[:, 4]
        self.ordem_clusters = np.argsort(scores_centros)

    def _interpretar_cluster(self, cluster_raw):
        posicao = list(self.ordem_clusters).index(cluster_raw)
        if posicao == 2:
            return {
                "id": int(cluster_raw),
                "categoria": "Polo Consolidado de Alto Giro",
                "perfil_risco": "Baixo Risco",
                "recomendacao": "Concessão favorável com taxas competitivas e alta capacidade de pagamento."
            }
        elif posicao == 1:
            return {
                "id": int(cluster_raw),
                "categoria": "Território de Oportunidade Inclusiva",
                "perfil_risco": "Moderado / Alto Potencial Reprimido",
                "recomendacao": "Público-alvo ideal para crédito inclusivo e produtivo orientado."
            }
        else:
            return {
                "id": int(cluster_raw),
                "categoria": "Zona de Vulnerabilidade e Risco",
                "perfil_risco": "Atenção / Risco Elevado",
                "recomendacao": "Exige garantias estruturadas e monitoramento de comprometimento de renda."
            }

    def _minmax(self, valor, minimo, maximo):
        if maximo == minimo:
            return 50.0
        norm = 100.0 * (valor - minimo) / (maximo - minimo)
        return float(np.clip(norm, 0.0, 100.0))

    def calcular_score(self, localidade="Município Simulado", regiao="Nordeste", 
                       populacao=200000, renda_per_capita=1000.0, 
                       vol_pix_total=None, valor_pf=None, valor_pj=None, 
                       inadimplencia_local=None):
        pop = max(1000, int(populacao))
        renda = max(200.0, float(renda_per_capita))
        reg = regiao.strip().capitalize() if isinstance(regiao, str) else "Nordeste"
        
        pop_ativa = pop * 0.65
        
        if vol_pix_total is None or vol_pix_total <= 0:
            v_pf = pop_ativa * renda * 0.40
            v_pj = pop_ativa * renda * 0.60
            v_total = v_pf + v_pj
        else:
            v_total = float(vol_pix_total)
            v_pf = float(valor_pf) if valor_pf is not None else v_total * 0.40
            v_pj = float(valor_pj) if valor_pj is not None else v_total * 0.60

        pagadores_unicos = int(pop_ativa * 0.45)
        pix_per_capita = v_total / pop
        fragilidade_renda = v_pf / (v_total + 1.0)
        
        if inadimplencia_local is not None and inadimplencia_local > 0:
            inad_muni = float(inadimplencia_local)
        else:
            fator_reg = 1.35 if reg == 'Nordeste' else (1.20 if reg == 'Norte' else 1.0)
            fator_pop = 1.0 + (pop / 1_000_000.0) * 0.4
            inad_muni = self.taxa_base * fator_reg * fator_pop

        m1 = self._minmax(pix_per_capita, 350.0, 1400.0)
        m2 = self._minmax(v_total, 3.5e7, 7.5e8)
        m4 = float(np.clip(inad_muni * 2.2, 0.0, 30.0))
        
        bonus_cadunico = 15.0 if pop >= 150000 else (8.0 if pop >= 90000 else 0.0)
        bonus_idhm = 12.0 if reg in ['Norte', 'Nordeste'] else 4.0

        norm_pagadores = self._minmax(pagadores_unicos, 20000, 320000)
        norm_pop = self._minmax(pop, 80000, 720000)
        downtrend_proxy = (0.50 * m2) + (0.30 * norm_pagadores) + (0.20 * norm_pop)
        norm_fragilidade = self._minmax(fragilidade_renda, 0.35, 0.70)

        p_micro = float(np.clip(
            (0.35 * m1) + (0.45 * m2) - (0.20 * m4) + bonus_cadunico + 25.0,
            10.0, 100.0
        ))
        p_macro = float(np.clip(
            (0.50 * downtrend_proxy) - (0.25 * norm_fragilidade) + bonus_idhm + 30.0,
            10.0, 100.0
        ))

        alpha = 0.50 if reg in ['Norte', 'Nordeste'] else 0.70
        score_base = 10.0 * (alpha * p_micro + (1.0 - alpha) * p_macro)

        vetor_features = np.array([[pop, renda, pix_per_capita, fragilidade_renda, inad_muni]])
        vetor_scaled = self.scaler.transform(vetor_features)
        cluster_pred = int(self.model_kmeans.predict(vetor_scaled)[0])
        info_cluster = self._interpretar_cluster(cluster_pred)

        pos_cluster = list(self.ordem_clusters).index(cluster_pred)
        fator_ia = 1.04 if pos_cluster == 2 else (1.00 if pos_cluster == 1 else 0.95)
        score_final = int(np.clip(round(score_base * fator_ia), 100, 1000))

        comp_bets = float(np.clip(round((100.0 - m1) * 0.15, 2), 2.1, 15.0))

        if score_final >= 750:
            faixa = "Excelente Oportunidade"
            classe_risco = "A"
        elif score_final >= 600:
            faixa = "Boa Oportunidade (Crédito Inclusivo)"
            classe_risco = "B"
        elif score_final >= 450:
            faixa = "Oportunidade Moderada"
            classe_risco = "C"
        else:
            faixa = "Risco Elevado"
            classe_risco = "D"

        return {
            "localidade": localidade,
            "regiao": reg,
            "populacao": pop,
            "renda_per_capita": renda,
            "score_final": score_final,
            "faixa_score": faixa,
            "classe_risco": classe_risco,
            "pilar_micro": round(p_micro, 1),
            "pilar_macro": round(p_macro, 1),
            "alpha_ponderador": alpha,
            "comp_bets_percent": comp_bets,
            "cluster_ia": info_cluster,
            "indicadores_base": {
                "volume_pix_total": round(v_total, 2),
                "pix_per_capita": round(pix_per_capita, 2),
                "inadimplencia_estimada": round(inad_muni, 2),
                "taxa_base_bcb": round(self.taxa_base, 2),
                "fragilidade_renda_percent": round(fragilidade_renda * 100, 1),
                "bonus_cadunico": bonus_cadunico,
                "bonus_idhm": bonus_idhm
            }
        }

    def gerar_ranking_benchmark(self):
        resultados = []
        for nome, cfg in BENCHMARK_MUNICIPIOS.items():
            res = self.calcular_score(
                localidade=nome,
                regiao=cfg['reg'],
                populacao=cfg['pop'],
                renda_per_capita=cfg['renda_per_capita_est']
            )
            resultados.append(res)
        resultados.sort(key=lambda x: x['score_final'], reverse=True)
        return resultados


if __name__ == '__main__':
    motor = MotorScore()
    resultado = motor.calcular_score(localidade="Marabá - PA", regiao="Norte", populacao=283542, renda_per_capita=1100.0)
    print(f"Score: {resultado['score_final']} | Faixa: {resultado['faixa_score']} | Cluster: {resultado['cluster_ia']['categoria']}")
