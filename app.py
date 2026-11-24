import csv
import io
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, Response, render_template_string
from motor_score import DadosInconsistentes, MotorScore, MunicipioNaoEncontrado, MESES
from servicos_dados import filtrar_municipios_socioeconomicos
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv() 

app = Flask(__name__, static_folder=None)
app.json.ensure_ascii = False
RAIZ = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def obter_motor():
    return MotorScore()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )

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
        "contato_disponivel": True,
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
        ('janela_inicio', 'Início da janela do score'),
        ('janela_fim', 'Fim da janela do score'),
        ('competencia_calculada', 'Competência calculada do score'),
        ('model_version', 'Modelo'),
        ('parameter_set_id', 'Parâmetros'),
        ('tipo_score', 'Tipo do score'),
        ('Aprovacao', 'Uso decisório de crédito'),
    )
    if not resultado['municipios']:
        return jsonify({'erro': 'Nenhum município encontrado para exportar.'}), 422
    arquivo = io.StringIO(newline='')
    escritor = csv.writer(arquivo, delimiter=';')
    escritor.writerow([titulo for _, titulo in colunas])
    for municipio in resultado['municipios']:
        municipio = {**municipio, 'janela_inicio': MESES[0], 'janela_fim': MESES[-1],
                     'tipo_score': 'Índice territorial de atividade Pix · exploratório'}
        valores = [municipio[chave] for chave, _ in colunas]
        escritor.writerow([str(v).replace('.', ',') if isinstance(v, float) else v for v in valores])
    nome = datetime.now().strftime('relatorio_credit42_municipios_%Y%m%d_%H%M%S.csv')
    return Response(
        arquivo.getvalue().encode('utf-8-sig'),
        content_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename="{nome}"', 'Cache-Control': 'no-store'},
    )

@app.route('/api/contato', methods=['POST'])
def salvar_contato():
    dados = request.get_json(silent=True) if request.is_json else request.form
    if not isinstance(dados, dict) or not all(isinstance(dados.get(k), str) for k in ('nome', 'email', 'mensagem')):
        return jsonify({"erro": "Preencha nome, e-mail e mensagem."}), 400
    nome, email, mensagem = (dados[k].strip() for k in ('nome', 'email', 'mensagem'))
    if not (0 < len(nome) <= 100 and 0 < len(email) <= 150 and 0 < len(mensagem) <= 1200):
        return jsonify({"erro": "Verifique o preenchimento e o tamanho dos campos."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO contatos (cont_nome, cont_email, cont_mensagem) VALUES (%s, %s, %s)"
        cursor.execute(sql, (nome, email, mensagem))
        conn.commit()
        return jsonify({"status": "sucesso", "mensagem": "Contato salvo com sucesso!"}), 201
    except mysql.connector.Error as erro:
        app.logger.error("Erro ao gravar contato no MySQL: %s", erro)
        return jsonify({"erro": "Erro ao salvar no banco de dados."}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/listar', methods=['GET'])
def listar_contatos():
    conn = None
    cursor = None
    registros = []
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM contatos ORDER BY cont_id DESC")
        registros = cursor.fetchall()
    except mysql.connector.Error as erro:
        app.logger.error("Erro ao consultar contatos no MySQL: %s", erro)
        return "Erro ao consultar o banco de dados.", 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

    html = """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contatos Cadastrados - Credit42</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem auto; max-width: 960px; padding: 0 1rem; color: #1f2937; }
            nav { margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; }
            nav a { margin-right: 1rem; text-decoration: none; color: #2563eb; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #d1d5db; padding: 0.75rem; text-align: left; }
            th { background-color: #f3f4f6; }
            footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.9rem; color: #6b7280; }
        </style>
    </head>
    <body>
        <nav>
            <a href="/">Início / Cadastro de Contato</a>
            <a href="/listar">Listar Registros</a>
        </nav>

        <h1>Registros Cadastrados (Contatos)</h1>

        {% if registros %}
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Mensagem</th>
                </tr>
            </thead>
            <tbody>
                {% for item in registros %}
                <tr>
                    <td>{{ item.cont_id }}</td>
                    <td>{{ item.cont_nome }}</td>
                    <td>{{ item.cont_email }}</td>
                    <td>{{ item.cont_mensagem }}</td>
                    <td>{{ item.cont_data_envio }} </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        {% else %}
        <p>Nenhum registro encontrado no banco de dados.</p>
        {% endif %}

        <footer>
            <p>Alicia Cavalcante de Oliveira - Atividade 4</p>
        </footer>
    </body>
    </html>
    """
    return render_template_string(html, registros=registros)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
