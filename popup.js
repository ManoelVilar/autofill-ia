const $ = (id) => document.getElementById(id);
let tab, host, settings;

async function send(msg) {
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch (_) {
    // página aberta antes da instalação: injeta o script agora
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["fields.js", "content.js"] });
    return await chrome.tabs.sendMessage(tab.id, msg);
  }
}

function renderModes() {
  document.querySelectorAll("#modes button").forEach((b) => b.classList.toggle("active", b.dataset.mode === settings.mode));
  const ignored = (settings.blacklist || []).includes(host);
  $("toggleSite").textContent = ignored ? "Voltar a usar neste site" : "Ignorar este site";
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { host = new URL(tab.url).hostname; } catch (_) { host = ""; }
  settings = (await chrome.storage.local.get("settings")).settings || { mode: "click", blacklist: [] };
  const { profile = {} } = await chrome.storage.local.get("profile");
  if (!Object.values(profile).some(Boolean)) $("status").innerHTML = '⚠ Cadastre seus dados em <a href="#" id="go">Meus dados</a>.';
  renderModes();
}

$("fill").addEventListener("click", async () => {
  $("status").textContent = "Analisando campos…";
  try {
    const r = await send({ type: "fill", overwrite: $("overwrite").checked });
    if (!r || !r.total) $("status").textContent = "Nenhum campo preenchível encontrado.";
    else $("status").textContent = `✔ ${r.filled} de ${r.total} campos preenchidos` + (r.aiUsed ? ` (${r.aiUsed} via IA)` : "");
  } catch (e) {
    $("status").textContent = "Não é possível atuar nesta página.";
  }
});

document.querySelectorAll("#modes button").forEach((b) =>
  b.addEventListener("click", async () => {
    settings.mode = b.dataset.mode;
    await chrome.storage.local.set({ settings });
    renderModes();
  })
);

$("toggleSite").addEventListener("click", async (e) => {
  e.preventDefault();
  if (!host) return;
  const list = new Set(settings.blacklist || []);
  list.has(host) ? list.delete(host) : list.add(host);
  settings.blacklist = [...list];
  await chrome.storage.local.set({ settings });
  renderModes();
});

$("relearn").addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.storage.local.remove("map:" + host);
  $("status").textContent = "Cache deste site apagado.";
});

document.addEventListener("click", (e) => {
  if (e.target.id === "opts" || e.target.id === "go") { e.preventDefault(); chrome.runtime.openOptionsPage(); }
});

init();
