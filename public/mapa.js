// =====================================================================
// MAPA.JS - Gerencia a exibição do mapa interativo com zonas clicáveis
// Carrega dados salvos do localStorage (nomes, avatares, cores)
// =====================================================================

let G = {
  avatars: ["👦", "👽"],
  names: ["Jogador 1", "Jogador 2"],
  colors: ["#3498db", "#9b59b6"],
  scores: [5, 5],
  cur: 1,
  grid: [],
  pending: [],
  history: [],
  foundCats: [],
  allCats: [],
  boardCats: [],
};

// Função auxiliar para renderizar corações no mapa
function updateLivesUI(pNum) {
  const el = document.getElementById("gs" + pNum);
  if (el) {
    // Converte o valor numérico de vidas em uma representação visual usando o ícone de coração
    el.textContent = "❤️".repeat(Math.max(0, G.scores[pNum - 1]));
  }
}

// Evento: ao carregar a página, recupera dados do jogo salvos
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("gameData");
  if (saved) {
    const data = JSON.parse(saved);
    G.names = data.names || G.names;
    G.avatars = data.avatars || G.avatars;
    G.colors = data.colors || G.colors;
    G.cur = data.cur || 1;
    G.scores = data.scores || [5, 5];
    G.history = data.history || [];

    updateLivesUI(1);
    updateLivesUI(2);

    if (document.getElementById("gn1"))
      document.getElementById("gn1").textContent = G.names[0];
    if (document.getElementById("gn2"))
      document.getElementById("gn2").textContent = G.names[1];

    updateAvatarUI("gav1", G.avatars[0]);
    updateAvatarUI("gav2", G.avatars[1]);

    if (document.getElementById("sc1"))
      document
        .getElementById("sc1")
        .classList.toggle("active-turn", G.cur === 1);
    if (document.getElementById("sc2"))
      document
        .getElementById("sc2")
        .classList.toggle("active-turn", G.cur === 2);

    if (document.getElementById("sc1"))
      document
        .getElementById("sc1")
        .style.setProperty("--cor-base", G.colors[0]);
    if (document.getElementById("sc2"))
      document
        .getElementById("sc2")
        .style.setProperty("--cor-base", G.colors[1]);
  }

  // Marcar locais concluídos com o avatar do vencedor
  const completed = JSON.parse(localStorage.getItem("completedLocs") || "{}");
  document.querySelectorAll(".alvo").forEach((alvo) => {
    Object.keys(completed).forEach((id) => {
      if (alvo.getAttribute("onclick").includes(`'${id}'`)) {
        alvo.classList.add("completed");
        // Aplica o avatar do vencedor como uma URL para background-image
        alvo.style.setProperty(
          "--winner-img",
          `url('${completed[id].avatar}')`,
        );
        // Aplica a cor do vencedor para automatizar o fundo do avatar no mapa
        if (completed[id].color) {
          alvo.style.setProperty("--cor-base", completed[id].color);
        }
      }
    });
  });
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

/* =====================================================================
SELETOR DE CORES - Cria bolinhas coloridas para cada jogador escolher
===================================================================== */
// Constrói o seletor visual de cores para P1 e P2
function buildColorPickers() {
  [1, 2].forEach((p) => {
    const row = document.getElementById("cr" + p);
    const defaultIdx = p === 1 ? 4 : 1; // Padrão: azul para P1, roxo para P2
    PALETTE[p - 1].forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "cdot" + (i === defaultIdx ? " on" : "");
      d.style.background = c;
      d.dataset.c = c;
      // Ao clicar, marca como selecionada e atualiza cor do jogador
      d.onclick = () => {
        row.querySelectorAll(".cdot").forEach((x) => x.classList.remove("on"));
        d.classList.add("on");
        G.colors[p - 1] = c;
      };
      row.appendChild(d);
    });
    G.colors[p - 1] = PALETTE[p - 1][defaultIdx];
  });
}

// Abre modal para escolher avatar de um jogador específico
function openAvPicker(p) {
  G.avTarget = p;
  const grid = document.getElementById("av-grid");
  grid.innerHTML = "";
  // Cria um botão para cada avatar disponível
  AVATARS.forEach((em) => {
    const d = document.createElement("div");
    d.className = "av-opt" + (G.avatars[p - 1] === em ? " sel" : "");
    // Ao clicar, seleciona avatar e atualiza interface
    d.onclick = () => {
      grid
        .querySelectorAll(".av-opt")
        .forEach((x) => x.classList.remove("sel"));
      d.classList.add("sel");
      G.avatars[p - 1] = em;
      updateAvatarUI("gav" + p, em);
      // Salva a alteração para persistir em outras páginas
      localStorage.setItem("gameData", JSON.stringify(G));
    };
    grid.appendChild(d);
  });
  openM("av-modal");
}

/* =====================================================================
            FUNÇÕES DE MODAL E UTILITÁRIOS
            ===================================================================== */
function openM(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
}

function closeM(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
}

// Fecha modal ao clicar fora dele (no overlay)
document.querySelectorAll(".overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);

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

const PALETTE = [
  ["#580e61", "#f1dc21", "#e34d4d", "#57f135", "#8ec6ec", "#af5968"],
  ["#580e61", "#f1dc21", "#e34d4d", "#57f135", "#8ec6ec", "#af5968"],
];

/* =====================================================================
            BOOT — try fetch frases.json
            ===================================================================== */
window.addEventListener("DOMContentLoaded", async () => {
  let ok = false;
  try {
    const r = await fetch("frases.json");
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d.categorias) && d.categorias.length >= 5) {
        G.allCats = d.categorias;
        ok = true;
      }
    }
  } catch (e) {
    console.error("Erro no JSON:", e);
  }
  if (!ok) {
    if (typeof DEFAULT_CATS !== "undefined") G.allCats = DEFAULT_CATS;
  }
});
