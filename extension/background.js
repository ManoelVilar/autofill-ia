// AutoFill IA — service worker: chamadas à IA e atalho de teclado.

const PROVIDERS = {
  gemini: { model: "gemini-2.5-flash" },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant" },
  openrouter: { url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.3-70b-instruct:free" },
  ollama: { url: "http://localhost:11434/v1/chat/completions", model: "llama3.2" },
  ollamacloud: { url: "https://ollama.com/api/chat", model: "gpt-oss:20b" }
};

function buildPrompt(fields, keys) {
  return [
    "Você classifica campos de formulários web. Para cada campo, escolha a chave do perfil que corresponde ao dado que o campo pede, ou null se nenhuma servir (ex: mensagem, assunto, senha, cupom, busca, nome da mãe).",
    "Chaves possíveis:",
    keys.map((k) => `- ${k.key}: ${k.label}`).join("\n"),
    "",
    "Campos (só metadados, sem dados do usuário):",
    JSON.stringify(fields),
    "",
    'Responda APENAS com JSON no formato {"0":"email","1":null,...} usando o índice "i" de cada campo.'
  ].join("\n");
}

function parseJson(text) {
  const m = (text || "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Resposta da IA sem JSON");
  return JSON.parse(m[0]);
}

async function callAI(ai, prompt) {
  const provider = ai.provider || "gemini";
  const def = PROVIDERS[provider];
  if (!def) throw new Error("Provedor desconhecido");
  const model = (ai.model || "").trim() || def.model;

  if (provider === "gemini") {
    if (!ai.apiKey) throw new Error("Falta a chave da API do Gemini");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(ai.apiKey)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" }
      })
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  }

  if (provider === "ollamacloud") {
    if (!ai.apiKey) throw new Error("Falta a chave da API da Ollama Cloud");
    const r = await fetch(def.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: { temperature: 0 },
        messages: [
          { role: "system", content: "Responda somente com JSON válido." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!r.ok) throw new Error(`Ollama Cloud ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j.message?.content || "";
  }

  // Provedores compatíveis com a API da OpenAI (Groq, OpenRouter, Ollama)
  const url = provider === "ollama" && ai.baseUrl ? ai.baseUrl : def.url;
  if (provider !== "ollama" && !ai.apiKey) throw new Error(`Falta a chave da API (${provider})`);
  const headers = { "Content-Type": "application/json" };
  if (ai.apiKey) headers.Authorization = `Bearer ${ai.apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: "Responda somente com JSON válido." },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error(`${provider} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

async function classify(fields, keys) {
  const { settings } = await chrome.storage.local.get("settings");
  const ai = settings?.ai || {};
  if (!ai.enabled) return { mapping: {} };
  const text = await callAI(ai, buildPrompt(fields, keys));
  const raw = parseJson(text);
  const valid = new Set(keys.map((k) => k.key));
  const mapping = {};
  for (const [i, k] of Object.entries(raw)) if (k && valid.has(k)) mapping[i] = k;
  return { mapping };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "classify") {
    classify(msg.fields, msg.keys).then(reply).catch((e) => reply({ error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "testAI") {
    callAI(msg.ai, 'Responda com o JSON {"ok":true}')
      .then((t) => reply({ ok: true, text: t.slice(0, 200) }))
      .catch((e) => reply({ ok: false, error: String(e.message || e) }));
    return true;
  }
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "fill-now") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "fill" }).catch(() => {});
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await chrome.storage.local.set({
      settings: { mode: "click", ai: { enabled: false, provider: "gemini", apiKey: "", model: "" }, blacklist: [] }
    });
    chrome.runtime.openOptionsPage();
  }
});
