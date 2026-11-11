import time
import requests
import urllib3
from typing import Dict, List, Optional, Any
from motor_score import MotorScore, BENCHMARK_MUNICIPIOS

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SERIES_BCB = {
    'carteira_regional': {
        'Norte': 14093,
        'Nordeste': 14094,
        'Centro-Oeste': 14095,
        'Sudeste': 14096,
        'Sul': 14097
    },
    'inadimplencia_regional': {
        'Norte': 15952,
        'Nordeste': 15953,
        'Centro-Oeste': 15954,
        'Sudeste': 15955,
        'Sul': 15956
    },
    'inadimplencia_nacional': 21082,
    'carteira_nacional': 20539,
    'ipca': 433
}

FALLBACK_INADIMPLENCIA = {
    'Norte': 6.2,
    'Nordeste': 6.8,
    'Centro-Oeste': 5.2,
    'Sudeste': 5.1,
    'Sul': 4.8,
    'Nacional': 5.6
}

_CACHE_REQUISICOES: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SEGUNDOS = 600


def _obter_do_cache(chave: str) -> Optional[Any]:
    if chave in _CACHE_REQUISICOES:
        item = _CACHE_REQUISICOES[chave]
        if time.time() - item['timestamp'] < CACHE_TTL_SEGUNDOS:
            return item['dado']
    return None


def _gravar_no_cache(chave: str, dado: Any) -> None:
    _CACHE_REQUISICOES[chave] = {
        'timestamp': time.time(),
        'dado': dado
    }


def consultar_serie_bcb(
    codigo_serie: int,
    data_inicial: Optional[str] = None,
    data_final: Optional[str] = None,
    ultimos: Optional[int] = None,
    timeout: int = 3
) -> List[Dict[str, Any]]:

    chave_cache = f"bcb_{codigo_serie}_{data_inicial}_{data_final}_{ultimos}"
    cached = _obter_do_cache(chave_cache)
    if cached is not None:
        return cached

    if ultimos is not None and ultimos > 0:
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo_serie}/dados/ultimos/{ultimos}?formato=json"
    elif data_inicial and data_final:
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo_serie}/dados?formato=json&dataInicial={data_inicial}&dataFinal={data_final}"
    else:
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo_serie}/dados?formato=json"

    try:
        res = requests.get(url, timeout=timeout, verify=False)
        if res.status_code == 200:
            dados_brutos = res.json()
            dados_limpos = []
            for item in dados_brutos:
                if 'data' in item and 'valor' in item:
                    try:
                        val = float(str(item['valor']).replace(',', '.'))
                        dados_limpos.append({'data': item['data'], 'valor': val})
                    except (ValueError, TypeError):
                        continue
            _gravar_no_cache(chave_cache, dados_limpos)
            return dados_limpos
    except Exception:
        pass

    return []


def obter_inadimplencia_regional_bcb(regiao: str) -> float:

    reg = regiao.strip().title()
    codigo_serie = SERIES_BCB['inadimplencia_regional'].get(reg)
    if codigo_serie:
        dados = consultar_serie_bcb(codigo_serie, ultimos=1)
        if dados:
            return float(dados[-1]['valor'])

    return FALLBACK_INADIMPLENCIA.get(reg, FALLBACK_INADIMPLENCIA['Nacional'])


def consultar_populacao_ibge_sidra(codigo_municipio: int | str, ano: int = 2022, timeout: int = 3) -> Optional[int]:

    cod = str(codigo_municipio).strip()
    chave_cache = f"sidra_pop_{cod}_{ano}"
    cached = _obter_do_cache(chave_cache)
    if cached is not None:
        return cached

    url = f"https://apisidra.ibge.gov.br/values/t/9514/n6/{cod}/v/93/p/{ano}/c2/0/c287/0/c286/0"
    try:
        res = requests.get(url, timeout=timeout)
        if res.status_code == 200:
            dados = res.json()
            if len(dados) > 1 and 'V' in dados[1]:
                valor_str = dados[1]['V']
                if valor_str and valor_str != '...':
                    pop = int(float(valor_str))
                    _gravar_no_cache(chave_cache, pop)
                    return pop
    except Exception:
        pass

    return None


def consultar_municipio_ibge(codigo_ibge: int | str, timeout: int = 3) -> Optional[Dict[str, Any]]:

    cod = str(codigo_ibge).strip()
    chave_cache = f"ibge_loc_{cod}"
    cached = _obter_do_cache(chave_cache)
    if cached is not None:
        return cached

    url = f"https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{cod}"
    try:
        res = requests.get(url, timeout=timeout)
        if res.status_code == 200:
            d = res.json()
            if isinstance(d, dict) and 'nome' in d:
                resultado = {
                    'codigo_ibge': d.get('id'),
                    'nome': d.get('nome'),
                    'microrregiao': d.get('microrregiao', {}).get('nome'),
                    'mesorregiao': d.get('microrregiao', {}).get('mesorregiao', {}).get('nome'),
                    'uf_sigla': d.get('microrregiao', {}).get('mesorregiao', {}).get('UF', {}).get('sigla'),
                    'regiao': d.get('microrregiao', {}).get('mesorregiao', {}).get('UF', {}).get('regiao', {}).get('nome')
                }
                _gravar_no_cache(chave_cache, resultado)
                return resultado
    except Exception:
        pass

    return None


def classificar_porte_populacao(populacao: int) -> str:
    if populacao < 150000:
        return 'Pequeno Porte'
    elif populacao <= 350000:
        return 'Médio Porte'
    else:
        return 'Grande Porte / Metrópole'


def classificar_faixa_renda(renda: float) -> str:
    if renda < 1000.0:
        return 'Baixa Renda (< R$ 1.000)'
    elif renda <= 1500.0:
        return 'Renda Média (R$ 1.000 a R$ 1.500)'
    else:
        return 'Renda Alta (> R$ 1.500)'


def obter_municipios_completos(motor: Optional[MotorScore] = None) -> List[Dict[str, Any]]:

    if motor is None:
        motor = MotorScore()

    municipios_processados = []

    for nome, cfg in BENCHMARK_MUNICIPIOS.items():
        score_res = motor.calcular_score(
            localidade=nome,
            regiao=cfg['reg'],
            populacao=cfg['pop'],
            renda_per_capita=cfg['renda_per_capita_est']
        )

        registro = {
            'localidade': nome,
            'codigo_ibge': cfg['code'],
            'uf': cfg['uf'],
            'regiao': cfg['reg'],
            'populacao': cfg['pop'],
            'porte': classificar_porte_populacao(cfg['pop']),
            'renda_per_capita': cfg['renda_per_capita_est'],
            'faixa_renda': classificar_faixa_renda(cfg['renda_per_capita_est']),
            'score_final': score_res['score_final'],
            'faixa_score': score_res['faixa_score'],
            'classe_risco': score_res['classe_risco'],
            'volume_pix_total': score_res['indicadores_base']['volume_pix_total'],
            'pix_per_capita': score_res['indicadores_base']['pix_per_capita'],
            'inadimplencia_estimada': score_res['indicadores_base']['inadimplencia_estimada'],
            'comp_bets_percent': score_res['comp_bets_percent'],
            'cluster_categoria': score_res['cluster_ia']['categoria'],
            'perfil_risco': score_res['cluster_ia']['perfil_risco']
        }
        municipios_processados.append(registro)

    return municipios_processados


def filtrar_municipios_socioeconomicos(
    filtros: Dict[str, Any],
    motor: Optional[MotorScore] = None
) -> Dict[str, Any]:

    municipios = obter_municipios_completos(motor)

    regiao = filtros.get('regiao', 'todas')
    porte = filtros.get('porte', 'todos')
    faixa_renda = filtros.get('faixa_renda', 'todas')
    classe_risco = filtros.get('classe_risco', 'todas')
    busca = filtros.get('busca', '').strip().lower()

    filtrados = []
    for m in municipios:
        if regiao and regiao.lower() != 'todas':
            if m['regiao'].lower() != regiao.lower():
                continue

        if porte and porte.lower() != 'todos':
            p_lower = porte.lower()
            if p_lower == 'pequeno' and m['populacao'] >= 150000:
                continue
            elif p_lower == 'medio' and not (150000 <= m['populacao'] <= 350000):
                continue
            elif p_lower == 'grande' and m['populacao'] <= 350000:
                continue

        if faixa_renda and faixa_renda.lower() != 'todas':
            r_lower = faixa_renda.lower()
            if r_lower == 'baixa' and m['renda_per_capita'] >= 1000.0:
                continue
            elif r_lower == 'media' and not (1000.0 <= m['renda_per_capita'] <= 1500.0):
                continue
            elif r_lower == 'alta' and m['renda_per_capita'] <= 1500.0:
                continue

        if classe_risco and classe_risco.lower() != 'todas':
            if m['classe_risco'].upper() != classe_risco.upper():
                continue

        if busca:
            if busca not in m['localidade'].lower():
                continue

        filtrados.append(m)

    filtrados.sort(key=lambda x: x['score_final'], reverse=True)

    total = len(filtrados)
    if total > 0:
        media_score = round(sum(m['score_final'] for m in filtrados) / total, 1)
        media_renda = round(sum(m['renda_per_capita'] for m in filtrados) / total, 2)
        media_inadimplencia = round(sum(m['inadimplencia_estimada'] for m in filtrados) / total, 2)
        vol_pix_total = round(sum(m['volume_pix_total'] for m in filtrados), 2)
        populacao_total = sum(m['populacao'] for m in filtrados)
    else:
        media_score = 0.0
        media_renda = 0.0
        media_inadimplencia = 0.0
        vol_pix_total = 0.0
        populacao_total = 0

    return {
        'total': total,
        'resumo': {
            'media_score': media_score,
            'media_renda_per_capita': media_renda,
            'media_inadimplencia': media_inadimplencia,
            'volume_pix_total': vol_pix_total,
            'populacao_total': populacao_total
        },
        'filtros_aplicados': {
            'regiao': regiao,
            'porte': porte,
            'faixa_renda': faixa_renda,
            'classe_risco': classe_risco,
            'busca': busca
        },
        'municipios': filtrados
    }
