const { FIELDS } = window.AFIA;
const $ = (id) => document.getElementById(id);

const HELP = {
  gemini: 'Crie a chave grátis em <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>.',
  groq: 'Crie a chave grátis em <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a>.',
  openrouter: 'Crie a chave em <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a> e use um modelo terminado em <code>:free</code>.',
  ollamacloud: 'Crie a chave em <a href="https://ollama.com/settings/keys" target="_blank">ollama.com/settings/keys</a>. Modelo padrão: <code>gpt-oss:20b</code> (veja outros em <a href="https://ollama.com/search?c=cloud" target="_blank">ollama.com/search?c=cloud</a>).',
  ollama: 'Instale o <a href="https://ollama.com" target="_blank">Ollama</a>, rode <code>ollama pull llama3.2</code> e inicie com <code>OLLAMA_ORIGINS="chrome-extension://*" ollama serve</code>. Não precisa de chave.'
};

function renderProfile(profile) {
  $("profile").innerHTML = "";
  for (const f of FIELDS) {
    const l = document.createElement("label");
    l.textContent = f.label;
    const i = document.createElement("input");
    i.dataset.key = f.key;
    i.value = profile[f.key] || "";
    i.autocomplete = "off";
    l.appendChild(i);
    $("profile").appendChild(l);
  }
}

function updateProviderUI() {
  const p = $("aiProvider").value;
  $("providerHelp").innerHTML = HELP[p];
  $("baseUrlWrap").style.display = p === "ollama" ? "" : "none";
}

function readAI() {
  return {
    enabled: $("aiEnabled").checked,
    provider: $("aiProvider").value,
    apiKey: $("aiKey").value.trim(),
    model: $("aiModel").value.trim(),
    baseUrl: $("aiBaseUrl").value.trim()
  };
}

async function load() {
  const { profile = {}, settings = {} } = await chrome.storage.local.get(["profile", "settings"]);
  renderProfile(profile);
  const mode = settings.mode || "click";
  document.querySelector(`input[name=mode][value=${mode}]`).checked = true;
  const ai = settings.ai || {};
  $("aiEnabled").checked = !!ai.enabled;
  $("aiProvider").value = ai.provider || "gemini";
  $("aiKey").value = ai.apiKey || "";
  $("aiModel").value = ai.model || "";
  $("aiBaseUrl").value = ai.baseUrl || "";
  $("blacklist").value = (settings.blacklist || []).join("\n");
  updateProviderUI();
}

async function save() {
  const profile = {};
  document.querySelectorAll("#profile input").forEach((i) => { if (i.value.trim()) profile[i.dataset.key] = i.value.trim(); });
  const settings = {
    mode: document.querySelector("input[name=mode]:checked").value,
    ai: readAI(),
    blacklist: $("blacklist").value.split(/\s+/).map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean)
  };
  await chrome.storage.local.set({ profile, settings });
  $("saved").textContent = "✔ Salvo";
  setTimeout(() => ($("saved").textContent = ""), 2000);
}

$("aiProvider").addEventListener("change", updateProviderUI);
$("save").addEventListener("click", save);
$("testAI").addEventListener("click", async () => {
  $("testResult").textContent = "Testando…";
  const res = await chrome.runtime.sendMessage({ type: "testAI", ai: readAI() });
  $("testResult").textContent = res.ok ? "✔ Funcionando" : "✖ " + res.error;
  $("testResult").className = "small " + (res.ok ? "ok" : "err");
});
$("clearCache").addEventListener("click", async () => {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((k) => k.startsWith("map:"));
  await chrome.storage.local.remove(keys);
  alert(`Cache limpo (${keys.length} site(s)).`);
});

load();
