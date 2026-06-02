// Estado global do jogo - armazena configurações, progresso e histórico
let G = {
  avatars: ["👦", "👽"], // Emojis dos jogadores
  names: ["Jogador 1", "Jogador 2"], // Nomes dos jogadores
  colors: ["#3498db", "#9b59b6"], // Cores dos jogadores
  scores: [5, 5], // Agora representa as VIDAS iniciais
  cur: 1, // Jogador atual (1 ou 2)
  grid: [], // Palavras do tabuleiro 5x5
  pending: [], // Índices das palavras selecionadas (máx 5)
  history: [], // Histórico de todas as jogadas
  foundCats: [], // Categorias encontradas
  allCats: [], // Todas as categorias disponíveis
  boardCats: [], // 5 categorias selecionadas para este jogo
  sigMode: false, // Modo de consulta de significado ativo
  currentLocalId: null, // ID do local atual (ex: 'aeroporto')
  turnModalShown: false, // Controla se o modal de turno já foi exibido nesta rodada
};

// Salva o estado atual do jogo no localStorage para manter a sincronia entre telas
function saveProgress() {
  localStorage.setItem(
    "gameData",
    JSON.stringify({
      names: G.names,
      avatars: G.avatars,
      colors: G.colors,
      scores: G.scores,
      cur: G.cur,
      history: G.history,
    }),
  );
}

// Função auxiliar para renderizar corações no lugar de números
function updateLivesUI(pNum) {
  const el = document.getElementById("gs" + pNum);
  if (el) {
    // O ícone de coração é inserido aqui: a string "❤️" é repetida n vezes conforme o número de vidas
    el.textContent = "❤️".repeat(Math.max(0, G.scores[pNum - 1]));
  }
}

// Lista de emojis disponíveis para os jogadores escolherem como avatares
const AVATARS = [
  "avatar/1.png",
  "avatar/2.png",
  "avatar/3.png",
  "avatar/4.png",
  "avatar/5.png",
  "avatar/6.png",
  "avatar/7.png",
  "avatar/8.png",
  "avatar/9.png",
  "avatar/10.png",
  "avatar/11.png",
  "avatar/12.png",
  "avatar/13.png",
  "avatar/14.png",
  "avatar/15.png",
  "avatar/16.png",
  "avatar/17.png",
  "avatar/18.png",
  "avatar/19.png",
  "avatar/20.png",
];

// Ao carregar a página, recupera configurações salvas (nomes, avatares, cores) do localStorage
window.addEventListener("DOMContentLoaded", () => {
  // Se existem dados salvos, carrega nomes, avatares e cores dos jogadores
  const saved = localStorage.getItem("gameData");

  if (saved) {
    const data = JSON.parse(saved);

    G.names = data.names || G.names;
    G.avatars = data.avatars || G.avatars;
    G.colors = data.colors || G.colors;
    G.scores = data.scores || G.scores;
    G.cur = data.cur || G.cur;
  }

  // Atualiza interface com nomes e vidas iniciais
  document.getElementById("gn1").textContent = G.names[0];
  document.getElementById("gn2").textContent = G.names[1];

  updateAvatarUI("gav1", G.avatars[0]);
  updateAvatarUI("gav2", G.avatars[1]);

  document.getElementById("sc1").style.setProperty("--cor-base", G.colors[0]);

  document.getElementById("sc2").style.setProperty("--cor-base", G.colors[1]);

  // Inicializa a exibição de vidas com corações baseada no estado atual
  updateLivesUI(1);
  updateLivesUI(2);

  // Inicializa o banner com estado de seleção após carregar os nomes dos jogadores
  updateBanner("sel");

  // Renderiza troféus conquistados nas sidebars
  renderTrophies();
});

function updateAvatarUI(target, path) {
  const el =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  el.textContent = "";
  el.style.backgroundImage = `url('${path}')`;
  el.style.backgroundSize = "contain";
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundPosition = "center";
}

const PALETTE = [
  // Paleta de cores para os temas do jogo (não está sendo utilizada atualmente)
  ["#ea7467", "#de914d", "#e3c54d", "#abe6c4", "#8ec6ec", "#cc98e1"],
  ["#ea7467", "#de914d", "#e3c54d", "#abe6c4", "#8ec6ec", "#cc98e1"],
];

// Ao carregar, tenta buscar o arquivo frases.json com as categorias e palavras
window.addEventListener("DOMContentLoaded", async () => {
  let ok = false;
  try {
    // Tenta buscar o arquivo JSON com as categorias e palavras
    const r = await fetch("frases.json");
    if (r.ok) {
      const d = await r.json();
      console.log(d);
      // Inicializa as definições para serem usadas na função showSig
      window.DEFS = d.definitions || {};
      // Valida se tem pelo menos 5 categorias com palavras
      if (Array.isArray(d.categorias) && d.categorias.length >= 5) {
        G.allCats = d.categorias;
        ok = true;
        notice(
          true,
          `frases.json carregado — ${d.categorias.length} categorias disponíveis.`,
        );
      }
    }
  } catch (e) {}
  // Se falhar, usa categorias padrão (DEFAULT_CATS deve estar definida em outro arquivo)
  if (!ok) {
    G.allCats = DEFAULT_CATS;
    console.log(G.allCats[0]);
    notice(false, "frases.json não encontrado — usando categorias padrão.");
  }

  buildBoard();
  console.log("GRID:", G.grid);
});

// Atualiza o banner (faixa superior) com a mensagem do estado atual do jogo
function updateBanner(state) {
  const p = G.cur;

  if (state === "err") {
    // Novo modal de erro específico
    const nameEl = document.getElementById("err-player-name");
    if (nameEl) nameEl.textContent = `Ops, ${G.names[p - 1]}!`;

    openM("error-modal");
    setTimeout(() => closeM("error-modal"), 2000); // Reduzido de 4s para 2s

    // Mantém a lógica de destacar o turno do jogador
    document.getElementById("sc1").classList.toggle("active-turn", p === 1);
    document.getElementById("sc2").classList.toggle("active-turn", p === 2);
    return;
  }

  if (state === "ok") {
    // Novo modal de sucesso específico
    const cat = G.foundCats[G.foundCats.length - 1];
    document.getElementById("suc-player-name").textContent =
      `Parabéns, ${G.names[p - 1]}!`;
    document.getElementById("suc-cat-name").textContent = cat?.catName || "---";

    openM("success-modal");
    setTimeout(() => closeM("success-modal"), 3000); // Reduzido de 5s para 3s para maior fluidez

    document.getElementById("sc1").classList.toggle("active-turn", p === 1);
    document.getElementById("sc2").classList.toggle("active-turn", p === 2);
    return;
  }

  if (state === "sel") {
    const n = G.pending.length;
    if (n > 0) return; // Não mostra modal enquanto seleciona palavras (1/5, 2/5...)

    // Aciona o novo modal 3D de Turno apenas se for a primeira vez
    if (!G.turnModalShown) {
      updateAvatarUI("turn-icon", G.avatars[p - 1]);
      document.getElementById("turn-player-name").textContent =
        `Vez de ${G.names[p - 1]}!`;

      openM("turn-modal");
      setTimeout(() => closeM("turn-modal"), 2000); // Reduzido de 4s para 2s
      G.turnModalShown = true;
    }

    document.getElementById("sc1").classList.toggle("active-turn", p === 1);
    document.getElementById("sc2").classList.toggle("active-turn", p === 2);
    return;
  }

  const msgModal = document.getElementById("message-display-modal");
  const msgBox = msgModal.querySelector(".mbox"); // Assuming .mbox is the inner div
  const msgIcon = document.getElementById("msg-icon");
  const msgText = document.getElementById("msg-text");

  // Reset icon animation and background
  msgIcon.classList.remove("shk-anim"); // Use shk-anim class for animation
  msgBox.style.background = ""; // Reset background

  let icon = "";
  let text = "";
  let bgColor = "";

  if (state === "sig") {
    // Estado: consulta de significado ativa
    msgIcon.textContent = "🔍";
    msgIcon.style.backgroundImage = "none";
    text = "Escolha a palavra no tabuleiro que deseja ver o significado.";
    bgColor = "linear-gradient(135deg, #3498db, #5dade2)"; // Reusing tb-sel background
  }

  msgText.textContent = text;
  msgBox.style.background = bgColor; // Apply background to the message box

  openM("message-display-modal");

  // Close modal after 4 seconds
  setTimeout(() => {
    closeM("message-display-modal");
  }, 2000); // Reduzido de 4s para 2s
  // Marca qual jogador tem a vez usando a classe 'active-turn'
  document.getElementById("sc1").classList.toggle("active-turn", p === 1);
  document.getElementById("sc2").classList.toggle("active-turn", p === 2);
}

// Constrói o tabuleiro 5x5 com as palavras das categorias
function buildBoard() {
  const urlParams = new URLSearchParams(window.location.search);
  const target = urlParams.get("cat"); // Captura o ID ou Nome vindo do mapa

  let selecionadas = [];

  if (target) {
    // 1. Tenta buscar por ID (Ex: 'aeroporto' retorna as 5 subcategorias do aeroporto)
    const porId = G.allCats.filter((c) => c.id === target);

    // 2. Tenta buscar por Nome (Ex: 'Cinema' retorna apenas o bloco do cinema)
    const porNome = G.allCats.filter((c) => c.nome === target);

    if (porId.length >= 5) {
      // Se o ID trouxe um grupo completo (como Aeroporto), usamos eles
      G.currentLocalId = target;
      selecionadas = shuffle(porId).slice(0, 5);
    } else if (porNome.length > 0) {
      // Se buscou um nome específico (Shopping -> Cinema), fixamos ele e completamos com o resto
      G.currentLocalId = porNome[0].id;
      selecionadas = [porNome[0]];
      const pool = G.allCats.filter(
        (c) => c.nome !== target && c.id !== porNome[0].id,
      );
      selecionadas.push(...shuffle(pool).slice(0, 4));
    } else if (porId.length > 0) {
      // Se o ID trouxe menos de 5, pegamos o que tem e completamos
      G.currentLocalId = target;
      selecionadas = porId;
      const pool = G.allCats.filter((c) => c.id !== target);
      selecionadas.push(...shuffle(pool).slice(0, 5 - selecionadas.length));
    }
  }

  // Fallback: Se não encontrou nada ou não tem parâmetro, escolhe 5 aleatórias
  if (selecionadas.length < 5) {
    const eligible = G.allCats.filter((c) => c.palavras.length >= 5);
    selecionadas = shuffle(eligible).slice(0, 5);
  }

  // Ordena as categorias pela primeira palavra do nome (ex: "Aeroporto", "Bombeiros")
  selecionadas.sort((a, b) => {
    const firstA = (a.nome || "").split(":")[0].trim().toLowerCase();
    const firstB = (b.nome || "").split(":")[0].trim().toLowerCase();
    // Desempate pelo nome completo caso a primeira palavra seja idêntica
    return (
      firstA.localeCompare(firstB) || (a.nome || "").localeCompare(b.nome || "")
    );
  });

  G.boardCats = selecionadas;
  G.grid = [];

  // Lógica de Quadrado Latino Embaralhado:
  // 1. Criamos uma matriz base onde cada linha é um deslocamento da anterior
  let matrix = [
    [0, 1, 2, 3, 4],
    [1, 2, 3, 4, 0],
    [2, 3, 4, 0, 1],
    [3, 4, 0, 1, 2],
    [4, 0, 1, 2, 3],
  ];

  // 2. Embaralhamos as linhas e as colunas para quebrar o padrão diagonal
  matrix = shuffle(matrix); // Embaralha as linhas
  const colOrder = shuffle([0, 1, 2, 3, 4]); // Define uma nova ordem para as colunas

  // 3. Preparamos as palavras de cada categoria
  const wordsPerCat = G.boardCats.map((cat) =>
    shuffle(cat.palavras).slice(0, 5),
  );

  // 4. Preenchemos o grid seguindo a matriz embaralhada
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const catIdx = matrix[r][colOrder[c]];
      G.grid[r * 5 + c] = {
        word: wordsPerCat[catIdx].pop(),
        catId: G.boardCats[catIdx].id,
        catName: G.boardCats[catIdx].nome,
        pending: false,
        claimed: false,
        claimedBy: null,
        color: null,
      };
    }
  }

  // Atualiza o dropdown de dicas com as categorias disponíveis
  const sel = document.getElementById("cat-hint");
  sel.innerHTML = '<option value="">— Ver dica —</option>';
  G.boardCats.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.nome;
    o.textContent = c.nome;
    sel.appendChild(o);
  });

  renderGrid();
  renderFound();
}

// Mostra dicas destacando as palavras da categoria selecionada
function applyHint() {
  const catNome = document.getElementById("cat-hint").value;
  if (!catNome) return;

  // Validação de vidas: impede o uso se o jogador tiver apenas 1 vida (não pode se suicidar com dica)
  if (G.scores[G.cur - 1] <= 1) {
    const nameEl = document.getElementById("alert-player-name");
    if (nameEl) {
      nameEl.textContent = `Ops, ${G.names[G.cur - 1]}!`;
    }
    openM("alert-modal");
    document.getElementById("cat-hint").value = ""; // Reseta o select
    return;
  }

  // Penalidade por usar a dica: -1 vida
  G.scores[G.cur - 1] -= 1;
  updateLivesUI(G.cur);
  saveProgress();

  // Destaca com borda dourada as palavras da categoria selecionada (que ainda não foram encontradas)
  document.querySelectorAll(".wc").forEach((cell) => {
    const it = G.grid[+cell.dataset.idx];
    if (catNome && !it.claimed && it.catName === catNome) {
      cell.style.outline = "2.5px dashed #FFD700";
      cell.classList.add("hint-flash");
    }
  });

  // Remove a dica após 2.5 segundos
  if (catNome)
    setTimeout(() => {
      document.querySelectorAll(".wc").forEach((c) => {
        c.style.outline = "";
        c.classList.remove("hint-flash");
      });
      document.getElementById("cat-hint").value = "";
    }, 2500);
}

// Renderiza a grid (tabuleiro) com as palavras
function renderGrid() {
  const ac = G.colors[G.cur - 1];
  document.documentElement.style.setProperty("--ac", ac);
  const body = document.getElementById("word-grid");
  body.innerHTML = "";

  // Constrói a grid 5x5 com labels de linha
  for (let r = 0; r < 5; r++) {
    const row = document.createElement("div");
    row.className = "grow";
    const rl = document.createElement("div");
    rl.className = "rlbl";
    rl.textContent = r + 1;
    row.appendChild(rl);

    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c;
      const it = G.grid[idx];
      const cell = document.createElement("div");
      cell.className = "wc";
      cell.dataset.idx = idx;
      cell.textContent = it.word;

      if (it.claimed) {
        // Palavra já encontrada - mostra com cor e avatar do jogador
        cell.classList.add("claimed");
        cell.style.background = it.color;
        const pip = document.createElement("span");
        pip.className = "cpip";
        updateAvatarUI(pip, G.avatars[it.claimedBy - 1]);
        cell.appendChild(pip);
      } else if (it.pending) {
        // Palavra selecionada mas não confirmada - permite deselecionar
        cell.classList.add("pending");
        cell.onclick = () => handleClick(idx);
      } else {
        // Palavra disponível - permite selecionar
        cell.onclick = () => handleClick(idx);
        cell.onmouseenter = () => {
          G.hovered = it.word;
        };
      }
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  renderPips();
}

// Atualiza os indicadores de seleção (5 pontos que mostram quantas palavras foram selecionadas)
function renderPips() {
  const n = G.pending.length;
  document.documentElement.style.setProperty("--ac", G.colors[G.cur - 1]);
  // Ativa n pontos de acordo com a quantidade de palavras selecionadas
  for (let i = 0; i < 5; i++)
    document.getElementById("p" + i).classList.toggle("on", i < n);
  document.getElementById("plbl").textContent = n + " / 5";
}

// Renderiza a lista de categorias encontradas
function renderFound() {
  const el = document.getElementById("found-list");
  el.innerHTML = G.foundCats
    .map(
      (f) =>
        `<div class="fi" style="background:${f.color}22">
               <div class="fdot" style="background:${f.color}"></div>
               <span style="color:${f.color};font-weight:800">${f.catName}</span>
               <span style="color:#888;font-size:11px;font-weight:500"> — encontrada por ${f.pname}</span>
             </div>`,
    )
    .join("");
}

// ========== LÓGICA CENTRAL DO JOGO ==========

// Processa o clique em uma célula (palavra)
function handleClick(idx) {
  if (G.locked) return; // Bloqueia interação durante transições

  // Se estiver no modo de consulta de significado, exibe o significado da palavra clicada e sai do modo
  if (G.sigMode) {
    const it = G.grid[idx];
    const w = it.word;
    document.getElementById("sig-wd").textContent = w || "—";

    const cb = document.getElementById("sig-cb");
    cb.textContent = it ? "📂 " + it.catName : "";
    cb.style.background = it?.color ? it.color + "33" : "#EEE";
    cb.style.color = it?.color || "#888";

    const onlineBtn = document.getElementById("sig-online-btn"); // Assumindo que este botão existe em jgplay.html
    const definitionText = window.DEFS && window.DEFS[w];

    if (definitionText) {
      document.getElementById("sig-df").textContent = definitionText;
      if (onlineBtn) onlineBtn.style.display = "none"; // Esconde o botão se a definição for encontrada localmente
    } else {
      document.getElementById("sig-df").textContent =
        "Definição não encontrada localmente. Deseja buscar online?";
      if (onlineBtn) {
        onlineBtn.style.display = "block"; // Mostra o botão
        onlineBtn.onclick = () => {
          window.open(
            `https://www.dicio.com.br/${encodeURIComponent(w.toLowerCase())}/`,
            "_blank",
          );
        };
      }
    }
    openM("sig-modal");
    G.sigMode = false;
    updateBanner("sel");
    return;
  }

  const it = G.grid[idx];
  if (it.claimed) return; // Não permite clicar em palavras já encontradas

  // Se a palavra já estava selecionada, desseleciona (remove)
  if (it.pending) {
    it.pending = false;
    G.pending = G.pending.filter((i) => i !== idx);
    renderGrid();
    updateBanner("sel");
    return;
  }

  // Valida se todas as palavras selecionadas pertencem à mesma categoria
  const testSet = [...G.pending, idx];
  const refCat = G.grid[testSet[0]].catName;
  const valid = testSet.every((i) => G.grid[i].catName === refCat);

  if (!valid) {
    // Palavra está em categoria diferente - erro!
    onError(idx);
    return;
  }

  // Palavra é válida - adiciona à seleção
  it.pending = true;
  G.pending.push(idx);
  renderGrid();

  // Se selecionou 5 palavras, valida sucesso
  if (G.pending.length === 5) {
    onSuccess();
  } else {
    updateBanner("sel");
  }
}

// Trata o erro quando o jogador clica em uma palavra de categoria diferente
function onError(badIdx) {
  G.locked = true;

  // Consome uma vida
  G.scores[G.cur - 1]--;
  // Garante que a vida não fique negativa e zere corretamente
  if (G.scores[G.cur - 1] < 0) G.scores[G.cur - 1] = 0;
  saveProgress();

  // Aguarda a animação do coração explodindo terminar antes de mostrar o erro
  updateLivesUI(G.cur).then(() => {
    updateBanner("err");

    // Anima com flash as palavras erradas (selecionadas + a palavra errada)
    [...G.pending, badIdx].forEach((i) => {
      const c = document.querySelector(`.wc[data-idx="${i}"]`);
      if (c) {
        c.classList.add("errfl");
        setTimeout(() => c.classList.remove("errfl"), 500);
      }
    });

    // Registra a tentativa falha no histórico unificado
    recordMove(
      false,
      [...G.pending.map((i) => G.grid[i].word), G.grid[badIdx].word],
      G.grid[badIdx].catName,
    );

    // Se as vidas acabaram, inicia o procedimento de conclusão imediatamente (redireciona em 2s)
    if (G.scores[G.cur - 1] <= 0) {
      concludeLocal();
      return;
    }

    // Senão, aguarda os 2s do modal para passar o turno para o próximo jogador
    setTimeout(() => {
      G.pending.forEach((i) => (G.grid[i].pending = false));
      G.pending = [];
      G.cur = G.cur === 1 ? 2 : 1;
      G.locked = false;
      renderGrid();
      updateBanner("sel");
    }, 2000); // Reduzido de 4s para 2s para troca de turno mais rápida no erro
  });
}

function updateLivesUI(playerNum) {
  return new Promise((resolve) => {
    const container = document.getElementById("gs" + playerNum);
    const currentLives = G.scores[playerNum - 1];
    const visualHearts = container.querySelectorAll(
      ".heart-icon:not(.heart-pop)",
    ).length;

    if (visualHearts > currentLives) {
      const hearts = container.querySelectorAll(".heart-icon:not(.heart-pop)");
      const lastHeart = hearts[hearts.length - 1];

      if (lastHeart) {
        lastHeart.classList.add("heart-pop");
        setTimeout(() => {
          renderHearts(container, currentLives);
          resolve();
        }, 1200);
        return;
      }
    }
    renderHearts(container, currentLives);
    resolve();
  });
}

// Função auxiliar para desenhar os corações
function renderHearts(container, count) {
  container.innerHTML = "";
  const lives = Math.max(0, count); // Garante que o loop não execute se for 0 ou menos
  for (let i = 0; i < lives; i++) {
    const span = document.createElement("span");
    span.className = "heart-icon";
    span.textContent = "❤️"; // Ou seu elemento/SVG de coração
    span.style.display = "inline-block";
    span.style.margin = "0 2px";
    container.appendChild(span);
  }
}

// Trata o sucesso quando o jogador encontra 5 palavras da mesma categoria
function onSuccess() {
  G.locked = true;
  const cat = G.grid[G.pending[0]];
  const color = G.colors[G.cur - 1];

  // Marca as 5 palavras como encontradas
  G.pending.forEach((i) => {
    G.grid[i].pending = false;
    G.grid[i].claimed = true;
    G.grid[i].claimedBy = G.cur;
    G.grid[i].color = color;
  });

  // No modelo de vidas, o sucesso não adiciona vidas (sobrevivência pura)
  // Mas mantemos a atualização visual
  updateLivesUI(G.cur);

  // Registra a categoria encontrada
  G.foundCats.push({
    catId: cat.catId,
    catName: cat.catName,
    player: G.cur,
    pname: G.names[G.cur - 1],
    color,
  });

  // Registra a tentativa bem-sucedida no histórico unificado
  recordMove(
    true,
    G.pending.map((i) => G.grid[i].word),
    cat.catName,
  );

  updateBanner("ok");

  // Anima com flash as palavras encontradas
  G.pending.forEach((i) => {
    const c = document.querySelector(`.wc[data-idx="${i}"]`);
    if (c) c.classList.add("winfl");
  });

  G.pending = [];

  setTimeout(() => {
    renderGrid();
    renderFound();

    // Verifica se o jogo acabou
    if (
      G.grid.every((w) => w.claimed) ||
      G.foundCats.length >= G.boardCats.length
    ) {
      concludeLocal();
      return;
    }

    // Passa a vez para o outro jogador
    G.cur = G.cur === 1 ? 2 : 1;
    G.locked = false;
    saveProgress();
    updateBanner("sel");
  }, 800); // Reduzido de 1.5s para 0.8s para acelerar após acerto
}

// Procedimentos de "Vitória": Salva o estado do local no mapa e redireciona
function concludeLocal() {
  const completed = JSON.parse(localStorage.getItem("completedLocs") || "{}");
  if (G.currentLocalId) {
    // Determina quem ganhou o local baseado nas vidas restantes (procedimento de vitória)
    const winnerIdx = G.scores[0] >= G.scores[1] ? 0 : 1;
    completed[G.currentLocalId] = {
      avatar: G.avatars[winnerIdx],
      color: G.colors[winnerIdx],
      player: winnerIdx + 1,
    };
    localStorage.setItem("completedLocs", JSON.stringify(completed));
  }

  // Redireciona para o mapa após o tempo de leitura da última mensagem
  setTimeout(() => {
    // Reseta as vidas ao sair para que o placar do mapa já apareça renovado
    G.scores = [5, 5];
    saveProgress();
    window.location.href = "mapa.html";
  }, 2000); // Reduzido para 2s para agilizar o retorno à cidade
}

// Ativa o modo de consulta de significado, solicitando que o usuário escolha uma palavra no tabuleiro
function showSig() {
  G.sigMode = true;
  updateBanner("sig");
}

/* =====================================================================
            SISTEMA DE TROFÉUS NAS SIDEBARS
            ===================================================================== */
function renderTrophies() {
  const completed = JSON.parse(localStorage.getItem("completedLocs") || "{}");
  const grids = [
    document.getElementById("t-grid-1"),
    document.getElementById("t-grid-2"),
  ];

  // Limpa as grades antes de renderizar
  grids.forEach((g) => {
    if (g) g.innerHTML = "";
  });

  const trophyMap = {
    shopping: "avatar/Shopping.png",
    doceria: "avatar/Doceria.png",
    sorveteria: "avatar/Sorveteria.png",
    aeroporto: "avatar/Aeroporto.png",
    bombeiros: "avatar/Bombeiro.png",
    casa_familia: "avatar/Familia.png",
    casa_vovo: "avatar/vovo.png",
    escola: "avatar/Escola.png",
    praca_parque: "avatar/Praca.png",
    cinema: "avatar/Cinema.png",
  };

  Object.keys(completed).forEach((locId) => {
    const info = completed[locId];
    const fileName = trophyMap[locId];
    if (fileName && info.player && grids[info.player - 1]) {
      const img = document.createElement("img");
      img.src = fileName;
      img.className = "trophy-item";
      img.title = locId.charAt(0).toUpperCase() + locId.slice(1);
      grids[info.player - 1].appendChild(img);
    }
  });
}

/* =====================================================================
            SIGNIFICADO
            ===================================================================== */

function resetBoard() {
  if (
    !confirm(
      "Reiniciar o tabuleiro? Pontuações mantidas, palavras reembaralhadas.",
    )
  )
    return;
  G.pending.forEach((i) => (G.grid[i].pending = false));
  G.pending = [];
  G.foundCats = [];
  G.locked = false;
  buildBoard();
  updateBanner("sel");
}

// Função showGameOver removida conforme solicitado (modal retirado)
function showGameOver() {}

// Reinicia o jogo completamente (zera pontuações, histórico, etc)
function playAgain() {
  G.scores = [5, 5]; // Reseta para 5 vidas
  G.history = [];
  G.foundCats = [];
  G.pending = [];
  G.cur = 1;
  G.locked = false;
  G.turnModalShown = false; // Reseta a flag para permitir exibir uma vez no novo jogo
  updateLivesUI(1);
  updateLivesUI(2);
  saveProgress(); // Garante que o novo estado de 5 vidas seja persistido
  buildBoard();
  updateBanner("sel");
}

// ========== FUNÇÕES UTILITÁRIAS ==========

// Embaralha um array usando o algoritmo Fisher-Yates
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Abre um modal (elemento) adicionando a classe 'open'
function openM(id) {
  document.getElementById(id).classList.add("open");
}

// Fecha um modal (elemento) removendo a classe 'open'
function closeM(id) {
  document.getElementById(id).classList.remove("open");
}

// Fecha modal ao clicar fora dele (no overlay)
document.querySelectorAll(".overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);

// Encerra o jogo, limpa o progresso dos locais e volta ao início
function exitGame() {
  if (
    confirm(
      "Deseja realmente sair? Isso liberará todos os locais do mapa e resetará seu progresso.",
    )
  ) {
    // Remove o progresso e os dados dos jogadores para que o próximo jogo inicie com 5 vidas (corações)
    localStorage.removeItem("completedLocs");
    localStorage.removeItem("gameData");
    // Redireciona para a tela inicial
    window.location.href = "index.html";
  }
}
