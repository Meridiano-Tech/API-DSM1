import os
import io
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, Response
import pandas as pd
from motor_score import MotorScore
from servicos_dados import filtrar_municipios_socioeconomicos

app = Flask(__name__, static_folder=None)
app.json.ensure_ascii = False
motor = MotorScore()


EXTENSOES_PERMITIDAS = {
    '.html', '.css', '.js', '.json', '.png',
    '.jpg', '.jpeg', '.svg', '.ico', '.webp',
    '.woff2', '.ttf'
}


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:filename>')
def arquivos_estaticos(filename):
    caminho = filename.replace('\\', '/')
    partes = caminho.split('/')
    if any(p.startswith('.') for p in partes) or '..' in partes:
        return jsonify({"erro": "Acesso não permitido"}), 403

    _, extensao = os.path.splitext(caminho)
    if extensao.lower() not in EXTENSOES_PERMITIDAS:
        return jsonify({"erro": "Acesso não permitido para este tipo de arquivo"}), 403

    if os.path.isfile(caminho):
        return send_from_directory('.', caminho)

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

    if populacao < 1000:
        return jsonify({"erro": "População deve ser um valor positivo com no mínimo 1.000 habitantes."}), 400

    if renda_per_capita <= 0:
        return jsonify({"erro": "Renda per capita deve ser um valor numérico positivo."}), 400

    if inadimplencia_local is not None and not (0.0 <= inadimplencia_local <= 100.0):
        return jsonify({"erro": "Taxa de inadimplência local deve estar entre 0% e 100%."}), 400

    if vol_pix_total is not None and vol_pix_total < 0:
        return jsonify({"erro": "Volume Pix total não pode ser negativo."}), 400

    if valor_pf is not None and valor_pf < 0:
        return jsonify({"erro": "Volume Pix PF não pode ser negativo."}), 400

    if valor_pj is not None and valor_pj < 0:
        return jsonify({"erro": "Volume Pix PJ não pode ser negativo."}), 400

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


@app.route('/api/dados-filtrados', methods=['GET', 'POST'])
def obter_dados_filtrados():
    if request.method == 'POST':
        filtros = request.get_json(silent=True) or {}
    else:
        filtros = {
            'regiao': request.args.get('regiao', 'todas'),
            'porte': request.args.get('porte', 'todos'),
            'faixa_renda': request.args.get('faixa_renda', 'todas'),
            'classe_risco': request.args.get('classe_risco', 'todas'),
            'busca': request.args.get('busca', '')
        }

    try:
        resultado = filtrar_municipios_socioeconomicos(filtros, motor=motor)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": f"Falha ao filtrar dados: {str(e)}"}), 500


@app.route('/api/exportar-dados', methods=['GET', 'POST'])
@app.route('/exportar-dados', methods=['GET', 'POST'])
def exportar_dados():
    if request.method == 'POST':
        filtros = request.get_json(silent=True) or {}
        if not filtros and request.form:
            filtros = request.form.to_dict()
    else:
        filtros = {
            'regiao': request.args.get('regiao', 'todas'),
            'porte': request.args.get('porte', 'todos'),
            'faixa_renda': request.args.get('faixa_renda', 'todas'),
            'classe_risco': request.args.get('classe_risco', 'todas'),
            'busca': request.args.get('busca', '')
        }

    try:
        resultado = filtrar_municipios_socioeconomicos(filtros, motor=motor)
        municipios = resultado.get('municipios', [])

        colunas_ordem = [
            ('localidade', 'Município'),
            ('codigo_ibge', 'Código IBGE'),
            ('uf', 'UF'),
            ('regiao', 'Região'),
            ('porte', 'Porte Populacional'),
            ('populacao', 'População (Hab.)'),
            ('renda_per_capita', 'Renda per Capita (R$)'),
            ('faixa_renda', 'Faixa de Renda'),
            ('score_final', 'Score Inclusivo'),
            ('faixa_score', 'Faixa de Score'),
            ('classe_risco', 'Classe de Risco'),
            ('inadimplencia_estimada', 'Inadimplência Estimada (%)'),
            ('volume_pix_total', 'Volume Pix Total (R$)'),
            ('pix_per_capita', 'Giro Pix per Capita (R$)'),
            ('comp_bets_percent', 'Comprometimento Apostas/Bets (%)'),
            ('cluster_categoria', 'Categoria do Cluster IA'),
            ('perfil_risco', 'Perfil de Risco')
        ]

        if municipios:
            df = pd.DataFrame(municipios)
            cols_existentes = [orig for orig, _ in colunas_ordem if orig in df.columns]
            df = df[cols_existentes]
            renomear = {orig: dest for orig, dest in colunas_ordem if orig in df.columns}
            df = df.rename(columns=renomear)
        else:
            colunas_vazias = [dest for _, dest in colunas_ordem]
            df = pd.DataFrame(columns=colunas_vazias)

        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, sep=';', decimal=',', encoding='utf-8')
        conteudo_bytes = csv_buffer.getvalue().encode('utf-8-sig')

        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f"relatorio_credit42_municipios_{timestamp_str}.csv"

        resposta = Response(
            conteudo_bytes,
            mimetype='text/csv; charset=utf-8-sig',
            headers={
                'Content-Disposition': f'attachment; filename="{nome_arquivo}"',
                'Content-Type': 'text/csv; charset=utf-8-sig',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        )
        return resposta

    except Exception as e:
        return jsonify({"erro": f"Falha na exportação de dados: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
