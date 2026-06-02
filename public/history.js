// Grava uma nova entrada no histórico e sincroniza o armazenamento
function recordMove(ok, words, catName) {
  const pIdx = G.cur - 1;
  const entry = {
    p: G.cur,
    pname: G.names[pIdx],
    av: G.avatars[pIdx],
    color: G.colors[pIdx],
    words: words,
    catName: catName,
    ok: ok,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  G.history.push(entry);

  // Salva o progresso se a função estiver disponível no escopo atual
  if (typeof saveProgress === "function") saveProgress();
  else localStorage.setItem("gameData", JSON.stringify(G));
}

// Abre o modal de histórico mostrando todas as jogadas (acertos e erros)
function openHist() {
  const list = document.getElementById("hlist");
  list.innerHTML =
    G.history.length === 0
      ? '<div style="text-align:center;color:#aaa;padding:20px">Nenhuma jogada ainda.</div>'
      : [...G.history]
          .reverse()
          .map(
            (h) =>
              `<div class="hitem" style="background:${h.color}18">
                 <div class="hdot" style="background:${h.color}"></div>
                 <img src="${h.av}" style="width:24px;height:24px;object-fit:contain">
                 <div>
                   <span style="font-weight:700;color:${h.color}">${h.pname}</span>
                   <span style="font-size:10px; opacity:0.5; margin-left:5px">${
                     h.time || ""
                   }</span>
                   ${
                     h.ok
                       ? `<span> ✅ acertou <b>${h.catName}</b>: ${h.words.join(", ")}</span>`
                       : `<span> ❌ errou (${h.words.join(", ")})</span>`
                   }
                 </div>
               </div>`,
          )
          .join("");
  openM("hist-modal");
}
