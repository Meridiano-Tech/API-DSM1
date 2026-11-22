"use strict";

async function ativarContato() {
  const modelo = document.getElementById("modelo-contato");
  try {
    const resposta = await fetch("./api/status", { signal: AbortSignal.timeout(12000) });
    if (!resposta.ok || (await resposta.json()).contato_disponivel !== true) return;
  } catch {
    return;
  }
  modelo.replaceWith(modelo.content.cloneNode(true));
  const form = document.getElementById("form-contato");
  const botao = form.querySelector("button");
  const retorno = document.getElementById("msg-sucesso");
  form.addEventListener("input", () => { retorno.style.display = "none"; });
  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    botao.disabled = true;
    retorno.style.display = "none";
    try {
      const resposta = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const resultado = await resposta.json();
      if (resposta.status !== 201 || resultado.status !== "sucesso") {
        throw new Error(resultado.erro || "Envio sem confirmação.");
      }
      retorno.textContent = "Mensagem enviada à equipe.";
      form.reset();
    } catch {
      retorno.textContent = "Envio sem confirmação. Você também pode usar o contato pelo GitHub.";
    } finally {
      retorno.style.display = "block";
      botao.disabled = false;
    }
  });
}

ativarContato();
