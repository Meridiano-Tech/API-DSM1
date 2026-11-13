import csv
import io
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, Response
from motor_score import DadosInconsistentes, MotorScore, MunicipioNaoEncontrado
from servicos_dados import filtrar_municipios_socioeconomicos

app = Flask(__name__, static_folder=None)
app.json.ensure_ascii = False
RAIZ = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def obter_motor():
    return MotorScore()


EXTENSOES_PERMITIDAS = {
    '.html', '.css', '.js', '.json', '.png',
    '.jpg', '.jpeg', '.svg', '.ico', '.webp',
    '.woff2', '.ttf'
}


@app.route('/')
def index():
    return send_from_directory(RAIZ, 'index.html')


@app.route('/<path:filename>')
def arquivos_estaticos(filename):
    caminho = filename.replace('\\', '/')
    partes = caminho.split('/')
    if any(p.startswith('.') for p in partes) or '..' in partes:
        return jsonify({"erro": "Acesso não permitido"}), 403

    extensao = Path(caminho).suffix
    if extensao.lower() not in EXTENSOES_PERMITIDAS:
        return jsonify({"erro": "Acesso não permitido para este tipo de arquivo"}), 403

    if (RAIZ / caminho).is_file():
        return send_from_directory(RAIZ, caminho)

    return jsonify({"erro": "Arquivo não encontrado"}), 404


@app.before_request
def tratar_preflight_cors():
    if request.method == 'OPTIONS':
        return ('', 204)


@app.after_request
def adicionar_cabecalhos_cors(resposta):
    resposta.headers['Access-Control-Allow-Origin'] = '*'
    resposta.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    resposta.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return resposta


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "servico": "API Meridiano Tech - Score de Crédito Inclusivo"
    })


@app.errorhandler(DadosInconsistentes)
def tratar_dados_indisponiveis(erro):
    app.logger.warning("Dados Credit42 indisponíveis", exc_info=True)
    return jsonify({"erro": str(erro), "codigo": "DADOS_INDISPONIVEIS"}), 503


@app.route('/api/ranking', methods=['GET'])
def obter_ranking():
    return jsonify(obter_motor().gerar_ranking_benchmark())


@app.route('/api/calcular-score', methods=['POST'])
def calcular_score():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict) or not dados:
        return jsonify({"erro": "Corpo da requisição deve ser um objeto JSON válido."}), 400

    modo = dados.get("modo", "territorial")
    if modo not in ("territorial", "cenario_mensal"):
        return jsonify({"erro": "Modo deve ser territorial ou cenario_mensal."}), 400

    motor = obter_motor()
    try:
        if modo == "territorial":
            resultado = motor.calcular_score(
                municipio_ibge=dados.get("municipio_ibge"),
                localidade=dados.get("localidade"),
            )
        else:
            resultado = motor.simular(
                localidade=dados.get("localidade"),
                regiao=dados.get("regiao"),
                populacao=dados.get("populacao"),
                valor_pf=dados.get("valor_pf"),
                pagadores_pf=dados.get("pagadores_pf"),
            )
    except DadosInconsistentes:
        raise
    except MunicipioNaoEncontrado as erro:
        return jsonify({"erro": str(erro)}), 404
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    return jsonify(resultado)


def ler_filtros():
    if request.method == 'GET':
        return request.args.to_dict()
    if request.form:
        return request.form.to_dict()
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        raise ValueError("Envie os filtros como objeto JSON.")
    return dados


@app.route('/api/dados-filtrados', methods=['GET', 'POST'])
def obter_dados_filtrados():
    try:
        return jsonify(filtrar_municipios_socioeconomicos(ler_filtros(), motor=obter_motor()))
    except DadosInconsistentes:
        raise
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400


@app.route('/api/exportar-dados', methods=['GET', 'POST'])
@app.route('/exportar-dados', methods=['GET', 'POST'])
def exportar_dados():
    try:
        resultado = filtrar_municipios_socioeconomicos(ler_filtros(), motor=obter_motor())
    except DadosInconsistentes:
        raise
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    colunas = (
        ('localidade', 'Município'),
        ('codigo_ibge', 'Código IBGE'),
        ('uf', 'UF'),
        ('regiao', 'Região'),
        ('porte', 'Porte Populacional'),
        ('populacao', 'População (Hab.)'),
        ('score_final', 'Score Inclusivo'),
        ('meses_validos', 'Meses válidos'),
        ('cobertura_pct', 'Cobertura (%)'),
        ('inadimplencia_estimada', 'Inadimplência Estimada (%)'),
        ('competencia_inadimplencia', 'Competência da estimativa'),
    )
    arquivo = io.StringIO(newline='')
    escritor = csv.writer(arquivo, delimiter=';')
    escritor.writerow([titulo for _, titulo in colunas])
    for municipio in resultado['municipios']:
        valores = [municipio[chave] for chave, _ in colunas]
        escritor.writerow([str(v).replace('.', ',') if isinstance(v, float) else v for v in valores])
    nome = datetime.now().strftime('relatorio_credit42_municipios_%Y%m%d_%H%M%S.csv')
    return Response(
        arquivo.getvalue().encode('utf-8-sig'),
        content_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename="{nome}"', 'Cache-Control': 'no-store'},
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
