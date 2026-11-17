import time
import requests
import urllib3
from typing import Dict, List, Optional, Any
from motor_score import MotorScore

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
    motor = motor or MotorScore()
    municipios = []
    for resultado in motor.gerar_ranking_benchmark():
        base = resultado['indicadores_base']
        populacao = resultado['populacao']
        municipios.append({
            **resultado,
            'codigo_ibge': resultado['municipio_ibge'],
            'porte': classificar_porte_populacao(populacao) if populacao is not None else None,
            'renda_per_capita': None,
            'faixa_renda': None,
            'classe_risco': None,
            'inadimplencia_estimada': base['inadimplencia_estimada'],
            'competencia_inadimplencia': base['competencia_inadimplencia'],
        })
    return municipios


def filtrar_municipios_socioeconomicos(
    filtros: Dict[str, Any], motor: Optional[MotorScore] = None
) -> Dict[str, Any]:
    padroes = {'regiao': 'todas', 'porte': 'todos', 'faixa_renda': 'todas',
               'classe_risco': 'todas', 'busca': ''}
    aplicados = {campo: filtros.get(campo, padrao) for campo, padrao in padroes.items()}
    if any(not isinstance(valor, str) for valor in aplicados.values()):
        raise ValueError("Os filtros devem ser informados como texto.")
    if aplicados['faixa_renda'].casefold() != 'todas' or aplicados['classe_risco'].casefold() != 'todas':
        raise ValueError("A base territorial não contém renda per capita ou classe de risco.")
    regiao = aplicados['regiao'].strip().casefold()
    porte = aplicados['porte'].strip().casefold()
    busca = aplicados['busca'].strip().casefold()
    portes = {'pequeno': 'Pequeno Porte', 'medio': 'Médio Porte', 'grande': 'Grande Porte / Metrópole'}
    if porte not in {'todos', *portes}:
        raise ValueError("Porte demográfico inválido.")
    filtrados = [
        m for m in obter_municipios_completos(motor)
        if (regiao == 'todas' or m['regiao'].casefold() == regiao)
        and (porte == 'todos' or m['porte'] == portes[porte])
        and busca in m['localidade'].casefold()
    ]

    scores = [m['score_final'] for m in filtrados if m['score_final'] is not None]
    estimativas = [m['inadimplencia_estimada'] for m in filtrados if m['inadimplencia_estimada'] is not None]
    populacoes = [m['populacao'] for m in filtrados if m['populacao'] is not None]
    return {
        'total': len(filtrados),
        'resumo': {
            'media_score': round(sum(scores) / len(scores), 1) if scores else None,
            'media_renda_per_capita': None,
            'media_inadimplencia': round(sum(estimativas) / len(estimativas), 2) if estimativas else None,
            'volume_pix_total': None,
            'populacao_total': sum(populacoes) if populacoes else None,
        },
        'filtros_aplicados': aplicados,
        'municipios': filtrados,
    }
