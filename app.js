// xTra Player - Autoria: xTra Soluções
// Site de gerenciamento de playlists por endereço MAC, para hospedar no GitHub Pages.
//
// ====================== CONFIGURE AQUI ======================
// Troque pela "URL do banco de dados" do SEU projeto Firebase Realtime Database
// (sem barra no final). Veja o passo a passo em README.md.
// A MESMA URL também deve ser colada em CLOUD_DB_URL no arquivo Data.kt do app Android.
const DB_URL = "https://SEU-PROJETO-default-rtdb.firebaseio.com";
// ==============================================================

const $ = (id) => document.getElementById(id);

let currentMac = null;
let currentType = "m3u";

function normalizeMac(raw) {
  const hex = raw.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12);
  return hex.match(/.{1,2}/g)?.join(":") ?? "";
}

function isValidMac(mac) {
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac);
}

function setMsg(el, text, kind) {
  el.textContent = text;
  el.className = "msg" + (kind ? " " + kind : "");
}

async function dbGet(path) {
  const r = await fetch(`${DB_URL}/${path}.json`);
  if (!r.ok) throw new Error("Falha ao conectar ao banco (HTTP " + r.status + ").");
  return r.json();
}

async function dbPost(path, data) {
  const r = await fetch(`${DB_URL}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Falha ao salvar (HTTP " + r.status + ").");
  return r.json();
}

async function dbDelete(path) {
  const r = await fetch(`${DB_URL}/${path}.json`, { method: "DELETE" });
  if (!r.ok) throw new Error("Falha ao remover (HTTP " + r.status + ").");
}

function typeLabel(t) {
  return t === "xtream" ? "Xtream Codes" : "Lista M3U";
}

function renderLista(items) {
  const lista = $("lista");
  const vazio = $("listaVazia");
  lista.innerHTML = "";
  const keys = Object.keys(items || {});
  vazio.classList.toggle("hidden", keys.length > 0);
  keys
    .map((k) => ({ key: k, ...items[k] }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .forEach((p) => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="info">
          <div class="name"></div>
          <div class="type"></div>
          <div class="server"></div>
        </div>
        <button class="btn ghost">Remover</button>
      `;
      row.querySelector(".name").textContent = p.name || "(sem nome)";
      row.querySelector(".type").textContent = typeLabel(p.type);
      row.querySelector(".server").textContent = p.server || "";
      row.querySelector("button").addEventListener("click", () => removerPlaylist(p.key, row));
      lista.appendChild(row);
    });
}

async function carregarPlaylists() {
  const items = await dbGet(`playlists/${encodeURIComponent(currentMac)}/items`);
  renderLista(items);
}

async function buscarMac() {
  const mac = normalizeMac($("mac").value);
  $("mac").value = mac;
  const msg = $("macMsg");
  if (!isValidMac(mac)) {
    setMsg(msg, "Digite um endereço MAC completo, no formato AA:BB:CC:DD:EE:FF.", "err");
    $("painel").classList.add("hidden");
    return;
  }
  if (DB_URL.includes("SEU-PROJETO")) {
    setMsg(msg, "Este site ainda não foi configurado: troque DB_URL em app.js pela URL do seu Firebase (veja README.md).", "err");
    return;
  }
  setMsg(msg, "Buscando…");
  $("btnBuscar").disabled = true;
  try {
    currentMac = mac;
    localStorage.setItem("xtra_last_mac", mac);
    $("macBadge").textContent = mac;
    await carregarPlaylists();
    $("painel").classList.remove("hidden");
    setMsg(msg, "", "");
  } catch (e) {
    setMsg(msg, e.message || "Não foi possível buscar.", "err");
  } finally {
    $("btnBuscar").disabled = false;
  }
}

async function removerPlaylist(key, row) {
  if (!confirm("Remover esta playlist? Ela também vai sumir do aparelho na próxima sincronização.")) return;
  row.style.opacity = "0.5";
  try {
    await dbDelete(`playlists/${encodeURIComponent(currentMac)}/items/${key}`);
    await carregarPlaylists();
  } catch (e) {
    alert(e.message || "Não foi possível remover.");
    row.style.opacity = "1";
  }
}

async function adicionarPlaylist() {
  const name = $("pName").value.trim();
  const server = $("pServer").value.trim();
  const user = $("pUser").value.trim();
  const pass = $("pPass").value.trim();
  const msg = $("formMsg");

  if (!name || !server) {
    setMsg(msg, "Preencha ao menos o nome e a URL/servidor.", "err");
    return;
  }
  if (currentType === "xtream" && (!user || !pass)) {
    setMsg(msg, "Xtream Codes precisa de usuário e senha.", "err");
    return;
  }
  const serverUrl = /^https?:\/\//i.test(server) ? server : "http://" + server;

  $("btnAdd").disabled = true;
  setMsg(msg, "Salvando…");
  try {
    await dbPost(`playlists/${encodeURIComponent(currentMac)}/items`, {
      name,
      type: currentType,
      server: serverUrl,
      user: currentType === "xtream" ? user : "",
      pass: currentType === "xtream" ? pass : "",
    });
    $("pName").value = "";
    $("pServer").value = "";
    $("pUser").value = "";
    $("pPass").value = "";
    await carregarPlaylists();
    setMsg(msg, "Playlist adicionada!", "ok");
  } catch (e) {
    setMsg(msg, e.message || "Não foi possível adicionar.", "err");
  } finally {
    $("btnAdd").disabled = false;
  }
}

function initTypeToggle() {
  document.querySelectorAll(".seg").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentType = btn.dataset.type;
      const xtream = currentType === "xtream";
      $("xtreamFields").classList.toggle("hidden", !xtream);
      $("lblServer").firstChild.textContent = xtream ? "Servidor (http://host:porta)" : "URL da lista M3U";
    });
  });
}

function initMacInput() {
  const mac = $("mac");
  mac.addEventListener("input", () => {
    const pos = mac.selectionStart;
    const before = mac.value.length;
    mac.value = normalizeMac(mac.value);
    const after = mac.value.length;
    mac.selectionStart = mac.selectionEnd = Math.max(0, pos + (after - before));
  });
  mac.addEventListener("keydown", (e) => { if (e.key === "Enter") buscarMac(); });

  const last = localStorage.getItem("xtra_last_mac");
  if (last) mac.value = last;
}

$("btnBuscar").addEventListener("click", buscarMac);
$("btnAdd").addEventListener("click", adicionarPlaylist);
initTypeToggle();
initMacInput();
