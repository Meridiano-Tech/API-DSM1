import unittest
from unittest.mock import patch

import mysql.connector
from app import app


class TestContato(unittest.TestCase):
    def setUp(self):
        self.cliente = app.test_client()
        self.dados = {"nome": "Teste", "email": "teste@example.org", "mensagem": "Mensagem de teste"}

    @patch("app.get_db_connection")
    def test_confirma_apos_commit(self, conectar):
        resposta = self.cliente.post("/api/contato", json=self.dados)
        self.assertEqual(resposta.status_code, 201)
        conexao = conectar.return_value
        self.assertEqual(conexao.cursor.return_value.execute.call_args.args[1], tuple(self.dados.values()))
        conexao.commit.assert_called_once()
        conexao.close.assert_called_once()

    @patch("app.get_db_connection")
    def test_entrada_invalida_nao_abre_conexao(self, conectar):
        for dados in ([], self.dados | {"mensagem": "x" * 1201}, self.dados | {"nome": None}):
            self.assertEqual(self.cliente.post("/api/contato", json=dados).status_code, 400)
        conectar.assert_not_called()

    @patch("app.get_db_connection", side_effect=mysql.connector.Error("indisponível"))
    def test_falha_sem_confirmacao(self, _):
        self.assertEqual(self.cliente.post("/api/contato", json=self.dados).status_code, 500)
