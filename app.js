// xTra Player — Firebase Authentication + Realtime Database
// A chave apiKey identifica o projeto web; a segurança real é aplicada pelas Realtime Database Rules.
const firebaseConfig = {
  apiKey: "AIzaSyC4FiwRFfFRtjxxSdgdy3xGNobjs__nsig",
  authDomain: "xtrasoluctions.firebaseapp.com",
  databaseURL: "https://xtrasoluctions-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "xtrasoluctions",
  storageBucket: "xtrasoluctions.firebasestorage.app",
  messagingSenderId: "296794667697",
  appId: "1:296794667697:web:b539b2ca47621121bc0090",
  measurementId: "G-GP0B47TQDT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const $ = id => document.getElementById(id);
let creating = false;
let currentType = "m3u";
let currentUser = null;
let isAdmin = false;

function msg(id, text, kind = "") {
  const el = $(id); el.textContent = text; el.className = "msg" + (kind ? " " + kind : "");
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function typeLabel(t) { return t === "xtream" ? "Xtream Codes" : "Lista M3U"; }
function setAuthMode(create) {
  creating = create;
  $("authTitle").textContent = create ? "Criar sua conta" : "Entrar na sua conta";
  $("displayName").classList.toggle("hidden", !create);
  $("authSubmit").textContent = create ? "Criar conta" : "Entrar";
  $("authToggle").textContent = create ? "Já tenho uma conta" : "Criar uma conta";
  $("password").autocomplete = create ? "new-password" : "current-password";
  msg("authMsg", "");
}
$("authToggle").addEventListener("click", () => setAuthMode(!creating));
$("authSubmit").addEventListener("click", async () => {
  const email = $("email").value.trim();
  const password = $("password").value;
  const name = $("displayName").value.trim();
  if (!email || !password || (creating && !name)) return msg("authMsg", "Preencha os campos obrigatórios.", "err");
  $("authSubmit").disabled = true;
  try {
    if (creating) {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      await credential.user.updateProfile({ displayName: name });
      await db.ref("users/" + credential.user.uid + "/profile").set({
        name, email, createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (e) {
    const messages = {
      "auth/email-already-in-use":"Este e-mail já possui uma conta.",
      "auth/invalid-email":"E-mail inválido.",
      "auth/weak-password":"A senha precisa ter pelo menos 6 caracteres.",
      "auth/user-not-found":"Conta não encontrada.",
      "auth/wrong-password":"Senha incorreta.",
      "auth/invalid-credential":"E-mail ou senha incorretos.",
      "auth/too-many-requests":"Muitas tentativas. Aguarde e tente novamente."
    };
    msg("authMsg", messages[e.code] || e.message || "Não foi possível autenticar.", "err");
  } finally { $("authSubmit").disabled = false; }
});
$("logout").addEventListener("click", () => auth.signOut());
$("adminSearch")?.addEventListener("input", () => { if (isAdmin) loadAdmin().catch(e => msg("formMsg", e.message, "err")); });

function renderPlaylists(items, ownerUid, adminView = false) {
  const list = adminView ? document.querySelector('[data-list="' + ownerUid + '"]') : $("lista");
  const empty = adminView ? document.querySelector('[data-empty="' + ownerUid + '"]') : $("listaVazia");
  list.replaceChildren();
  const entries = Object.entries(items || {}).sort((a,b) => (a[1].name || "").localeCompare(b[1].name || ""));
  empty.classList.toggle("hidden", entries.length > 0);
  for (const [key, p] of entries) {
    const row = document.createElement("div"); row.className = "item";
    const info = document.createElement("div"); info.className = "info";
    const name = document.createElement("div"); name.className = "name"; name.textContent = p.name || "(sem nome)";
    const type = document.createElement("div"); type.className = "type"; type.textContent = typeLabel(p.type);
    const server = document.createElement("div"); server.className = "server"; server.textContent = p.server || "";
    const actions = document.createElement("div"); actions.className = "actions";
    if (adminView) {
      const edit = document.createElement("button"); edit.className = "btn ghost"; edit.textContent = "Editar";
      edit.addEventListener("click", async () => {
        const nextName = prompt("Nome da playlist:", p.name || ""); if (nextName === null) return;
        const nextServer = prompt("Servidor ou URL:", p.server || ""); if (nextServer === null) return;
        const nextUser = p.type === "xtream" ? prompt("Usuário Xtream:", p.user || "") : (p.user || ""); if (nextUser === null) return;
        const nextPass = p.type === "xtream" ? prompt("Senha Xtream (fica visível somente nesta confirmação):", p.pass || "") : (p.pass || ""); if (nextPass === null) return;
        try { await db.ref("users/" + ownerUid + "/playlists/items/" + key).update({ name: nextName.trim(), server: nextServer.trim(), user: nextUser, pass: nextPass }); await loadAdmin(); }
        catch (e) { alert("Falha ao editar: " + e.message); }
      }); actions.append(edit);
    }
    const remove = document.createElement("button"); remove.className = "btn ghost"; remove.textContent = "Remover";
    remove.addEventListener("click", async () => {
      if (!confirm("Remover esta playlist?")) return;
      try { await db.ref("users/" + ownerUid + "/playlists/items/" + key).remove(); await loadMember(); if (adminView) await loadAdmin(); }
      catch (e) { alert("Falha ao remover: " + e.message); }
    });
    actions.append(remove); info.append(name,type,server); row.append(info,actions); list.appendChild(row);
  }
}
async function loadMember() {
  const snap = await db.ref("users/" + currentUser.uid + "/playlists/items").once("value");
  renderPlaylists(snap.val(), currentUser.uid);
}
async function addPlaylist() {
  const name = $("pName").value.trim(), rawServer = $("pServer").value.trim();
  const user = $("pUser").value.trim(), pass = $("pPass").value;
  if (!name || !rawServer) return msg("formMsg", "Preencha o nome e o servidor/URL.", "err");
  if (currentType === "xtream" && (!user || !pass)) return msg("formMsg", "Xtream Codes precisa de usuário e senha.", "err");
  const server = /^https?:\/\//i.test(rawServer) ? rawServer : "http://" + rawServer;
  $("btnAdd").disabled = true; msg("formMsg", "Salvando…");
  try {
    await db.ref("users/" + currentUser.uid + "/playlists/items").push({
      name, type: currentType, server,
      user: currentType === "xtream" ? user : "",
      pass: currentType === "xtream" ? pass : "",
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    ["pName","pServer","pUser","pPass"].forEach(id => $(id).value = "");
    await loadMember(); msg("formMsg", "Playlist adicionada.", "ok");
  } catch (e) { msg("formMsg", "Falha ao salvar: " + e.message, "err"); }
  finally { $("btnAdd").disabled = false; }
}
$("btnAdd").addEventListener("click", addPlaylist);
document.querySelectorAll(".seg").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b === btn));
  currentType = btn.dataset.type;
  const xtream = currentType === "xtream";
  $("xtreamFields").classList.toggle("hidden", !xtream);
  $("lblServer").firstChild.textContent = xtream ? "Servidor (http://host:porta)" : "URL da lista M3U";
}));

async function loadAdmin() {
  const usersSnap = await db.ref("users").once("value");
  const root = $("adminUsers"); root.replaceChildren();
  const users = usersSnap.val() || {};
  const query = ($("adminSearch")?.value || "").trim().toLowerCase();
  const entries = Object.entries(users).filter(([uid,data]) => !query || uid.toLowerCase().includes(query) || (data.profile?.name || "").toLowerCase().includes(query) || (data.profile?.email || "").toLowerCase().includes(query));
  if (!entries.length) { root.textContent = query ? "Nenhuma conta corresponde à busca." : "Nenhuma conta encontrada."; return; }
  for (const [uid, data] of entries) {
    const section = document.createElement("section"); section.className = "admin-user";
    const heading = document.createElement("h3"); heading.textContent = (data.profile && data.profile.name) || data.profile?.email || uid;
    const email = document.createElement("p"); email.className = "hint"; email.textContent = data.profile?.email || "";
    const tools = document.createElement("div"); tools.className = "admin-tools";
    const rename = document.createElement("button"); rename.className = "btn ghost"; rename.textContent = "Editar nome";
    rename.addEventListener("click", async () => { const next = prompt("Nome do membro:", data.profile?.name || ""); if (next === null || !next.trim()) return; try { await db.ref("users/" + uid + "/profile/name").set(next.trim()); await loadAdmin(); } catch(e) { alert("Falha: " + e.message); } });
    const wipe = document.createElement("button"); wipe.className = "btn ghost danger"; wipe.textContent = "Apagar dados";
    wipe.addEventListener("click", async () => { if (!confirm("Apagar o perfil e TODAS as playlists deste membro? A conta de login Firebase continuará existindo.")) return; if (!confirm("Confirmação final: apagar os dados de " + (data.profile?.email || uid) + "?")) return; try { await db.ref("users/" + uid).remove(); await loadAdmin(); } catch(e) { alert("Falha ao apagar dados: " + e.message); } });
    tools.append(rename,wipe);
    const list = document.createElement("div"); list.className = "lista"; list.dataset.list = uid;
    const empty = document.createElement("p"); empty.className = "hint"; empty.dataset.empty = uid; empty.textContent = "Sem playlists.";
    section.append(heading,email,tools,list,empty); root.append(section);
    renderPlaylists(data.playlists?.items, uid, true);
  }
}
auth.onAuthStateChanged(async user => {
  currentUser = user;
  $("authCard").classList.toggle("hidden", !!user);
  $("appPanel").classList.toggle("hidden", !user);
  if (!user) { isAdmin = false; return; }
  $("userName").textContent = user.displayName || "Membro";
  $("userEmail").textContent = user.email || "";
  try {
    const adminSnap = await db.ref("admins/" + user.uid).once("value");
    isAdmin = adminSnap.val() === true;
    $("roleBadge").textContent = isAdmin ? "ADMINISTRADOR" : "MEMBRO";
    $("adminPanel").classList.toggle("hidden", !isAdmin);
    await loadMember();
    if (isAdmin) await loadAdmin();
  } catch (e) {
    msg("formMsg", "Falha ao carregar dados. Confira as regras do Realtime Database: " + e.message, "err");
  }
});
setAuthMode(false);
