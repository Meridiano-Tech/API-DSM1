import os
from flask import Flask, request, jsonify, send_from_directory
from motor_score import MotorScore

app = Flask(__name__, static_folder='.', static_url_path='')
motor = MotorScore()


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:filename>')
def arquivos_estaticos(filename):
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return jsonify({"erro": "Arquivo não encontrado"}), 404


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "servico": "API Meridiano Tech - Score de Crédito Inclusivo"
    })


@app.route('/api/ranking', methods=['GET'])
def obter_ranking():
    try:
        ranking = motor.gerar_ranking_benchmark()
        return jsonify(ranking), 200
    except Exception as e:
        return jsonify({"erro": f"Falha ao gerar ranking: {str(e)}"}), 500


@app.route('/api/calcular-score', methods=['POST'])
def calcular_score():
    dados = request.get_json(silent=True)
    if not dados:
        return jsonify({"erro": "Corpo da requisição deve ser um JSON válido."}), 400

    localidade = dados.get('localidade', 'Território Simulado')
    regiao = dados.get('regiao', 'Nordeste')
    
    try:
        populacao = int(dados.get('populacao', 150000))
        renda_per_capita = float(dados.get('renda_per_capita', 1000.0))
        
        vol_pix_total = dados.get('vol_pix_total')
        if vol_pix_total is not None:
            vol_pix_total = float(vol_pix_total)

        valor_pf = dados.get('valor_pf')
        if valor_pf is not None:
            valor_pf = float(valor_pf)

        valor_pj = dados.get('valor_pj')
        if valor_pj is not None:
            valor_pj = float(valor_pj)

        inadimplencia_local = dados.get('inadimplencia_local')
        if inadimplencia_local is not None:
            inadimplencia_local = float(inadimplencia_local)

    except (ValueError, TypeError):
        return jsonify({"erro": "Valores numéricos inválidos enviados no formulário."}), 400

    try:
        resultado = motor.calcular_score(
            localidade=localidade,
            regiao=regiao,
            populacao=populacao,
            renda_per_capita=renda_per_capita,
            vol_pix_total=vol_pix_total,
            valor_pf=valor_pf,
            valor_pj=valor_pj,
            inadimplencia_local=inadimplencia_local
        )
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": f"Erro interno no processamento: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
