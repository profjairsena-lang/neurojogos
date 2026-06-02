/* =====================================================================
            CONSTANTS
            ===================================================================== */
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
let G = {
  allCats: [], // loaded from JSON or defaults
  boardCats: [], // 5 categories used in this board
  grid: [], // 25 cells: {word, catId, catName, pending, claimed, claimedBy, color}
  pending: [], // indices currently pending
  cur: 1, // current player (1 or 2)
  scores: [5, 5],
  history: [],
  foundCats: [],
  avatars: ["avatar/1.png", "avatar/3.png"],
  names: ["Jogador 1", "Jogador 2"],
  colors: ["#617887", "#8d8790"],
  avTarget: 1,
  hovered: null, // last hovered word
  locked: false, // input locked during transition
};

/* =====================================================================
            BOOT — try fetch frases.json
            ===================================================================== */
window.addEventListener("DOMContentLoaded", async () => {
  buildColorPickers();

  // Inicializa visualmente os avatares padrão
  updateAvatarUI("av1", G.avatars[0]);
  updateAvatarUI("av2", G.avatars[1]);
  updateAvatarUI("step1-av1", G.avatars[0]);
  updateAvatarUI("step1-av2", G.avatars[1]);

  let ok = false;
  try {
    const r = await fetch("frases.json");
    if (r.ok) {
      const d = await r.json();
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
  if (!ok) {
    G.allCats = DEFAULT_CATS;
    notice(false, "frases.json não encontrado — usando categorias padrão.");
  }
  buildBoard();
});

// 3

function buildColorPickers() {
  [1, 2].forEach((p) => {
    const row = document.getElementById("cr" + p);
    const defaultIdx = p === 1 ? 4 : 1; // blue for P1, purple for P2
    PALETTE[p - 1].forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "cdot" + (i === defaultIdx ? " on" : "");
      d.style.background = c;
      d.dataset.c = c;
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

function openAvPicker(p) {
  G.avTarget = p;
  const grid = document.getElementById("av-grid");
  grid.innerHTML = "";
  AVATARS.forEach((em) => {
    const d = document.createElement("div");
    d.className = "av-opt" + (G.avatars[p - 1] === em ? " sel" : "");
    updateAvatarUI(d, em);

    d.onclick = () => {
      grid
        .querySelectorAll(".av-opt")
        .forEach((x) => x.classList.remove("sel"));
      d.classList.add("sel");
      G.avatars[p - 1] = em;

      // Atualiza as faces dos avatares em todas as telas
      updateAvatarUI("av" + p, em);
      updateAvatarUI("step1-av" + p, em);
    };
    grid.appendChild(d);
  });
  openM("av-modal");
}

function updateAvatarUI(target, path) {
  const el =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  el.textContent = "";
  el.style.backgroundImage = `url('${path}')`;
  // Usamos contain para garantir que o avatar apareça inteiro sem cortes
  el.style.backgroundSize = "contain";
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundPosition = "center";
}

function openM(id) {
  document.getElementById(id).classList.add("open");
}
function closeM(id) {
  document.getElementById(id).classList.remove("open");
}

// Funções de navegação entre as etapas do setup
function goToStep2() {
  document.getElementById("step-1").style.display = "none";
  document.getElementById("step-2").style.display = "block";
}

function goToStep1() {
  document.getElementById("step-2").style.display = "none";
  document.getElementById("step-1").style.display = "block";
}

document.querySelectorAll(".overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);
function startGame() {
  // captura os nomes e cores escolhidos
  G.names[0] = document.getElementById("nm1").value.trim() || "Jogador 1";
  G.names[1] = document.getElementById("nm2").value.trim() || "Jogador 2";

  [1, 2].forEach((p) => {
    const a = document.querySelector("#cr" + p + " .cdot.on");
    if (a) G.colors[p - 1] = a.dataset.c;
  });

  // salva no localStorage para recuperar em mapa.html
  localStorage.setItem("gameData", JSON.stringify(G));

  // redireciona para mapa.html
  window.location.href = "mapa.html";
}
