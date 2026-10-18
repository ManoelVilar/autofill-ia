// AutoFill IA — content script
(() => {
  if (window.__AFIA_LOADED__) return;
  window.__AFIA_LOADED__ = true;

  const { FIELDS, SKIP_TYPES, SKIP_HINTS, norm } = window.AFIA;
  const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

  const UFS = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
    ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
    PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
  };

  let state = { profile: {}, settings: { mode: "click", ai: { enabled: false } , blacklist: [] } };
  const filledOnce = new WeakSet();
  const host = location.hostname;

  // ---------- Storage ----------
  async function loadState() {
    const data = await chrome.storage.local.get(["profile", "settings"]);
    state.profile = data.profile || {};
    state.settings = Object.assign({ mode: "click", ai: { enabled: false }, blacklist: [] }, data.settings || {});
  }
  chrome.storage.onChanged.addListener((ch) => {
    if (ch.profile) state.profile = ch.profile.newValue || {};
    if (ch.settings) state.settings = Object.assign(state.settings, ch.settings.newValue || {});
  });

  function isBlacklisted() {
    return (state.settings.blacklist || []).some((d) => d && (host === d || host.endsWith("." + d)));
  }

  // ---------- Coleta de pistas do campo ----------
  function textOf(el) {
    return el ? (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120) : "";
  }

  function labelFor(el) {
    const parts = [];
    if (el.id) {
      try {
        document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach((l) => parts.push(textOf(l)));
      } catch (_) {}
    }
    const wrap = el.closest("label");
    if (wrap) parts.push(textOf(wrap));
    const lb = el.getAttribute("aria-labelledby");
    if (lb) lb.split(/\s+/).forEach((id) => parts.push(textOf(document.getElementById(id))));
    if (!parts.join("").trim()) {
      // texto próximo: irmão anterior ou container pequeno
      const prev = el.previousElementSibling;
      if (prev && !prev.matches("input,select,textarea,button") && !prev.querySelector("input,select,textarea") && textOf(prev).length < 60) parts.push(textOf(prev));
      const parent = el.parentElement;
      if (parent && parent.querySelectorAll("input,select,textarea").length === 1) {
        const t = textOf(parent);
        if (t.length < 80) parts.push(t);
      }
    }
    return parts.filter(Boolean).join(" | ");
  }

  function describe(el) {
    return {
      tag: el.tagName.toLowerCase(),
      type: (el.getAttribute("type") || "").toLowerCase(),
      autocomplete: (el.getAttribute("autocomplete") || "").toLowerCase(),
      label: labelFor(el),
      aria: el.getAttribute("aria-label") || "",
      placeholder: el.getAttribute("placeholder") || "",
      name: el.getAttribute("name") || "",
      id: el.id || "",
      title: el.getAttribute("title") || "",
      options: el.tagName === "SELECT" ? [...el.options].slice(0, 8).map((o) => o.text.trim()).filter(Boolean) : undefined
    };
  }

  function signature(d) {
    return [d.tag, d.type, d.name, d.id, norm(d.label).slice(0, 40), norm(d.placeholder).slice(0, 30)].join("|");
  }

  // ---------- Elegibilidade ----------
  function isVisible(el) {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  }

  function eligible(el) {
    if (el.disabled || el.readOnly) return false;
    if (el.tagName === "INPUT" && SKIP_TYPES.has((el.type || "").toLowerCase())) return false;
    if (!isVisible(el)) return false;
    const ac = (el.getAttribute("autocomplete") || "").toLowerCase();
    if (/cc-|one-time-code|current-password|new-password/.test(ac)) return false;
    const hint = norm([el.name, el.id, el.placeholder, el.getAttribute("aria-label")].join(" "));
    if (SKIP_HINTS.some((r) => r.test(hint))) return false;
    return true;
  }

  function collectFields(root = document) {
    return [...root.querySelectorAll("input, select, textarea")].filter(eligible);
  }

  // ---------- Detecção heurística ----------
  function matchText(text) {
    if (!text) return null;
    const t = norm(text);
    for (const f of FIELDS) {
      if (f.not && f.not.some((r) => r.test(t))) continue;
      if (f.re.some((r) => r.test(t))) return f.key;
    }
    return null;
  }

  function detectHeuristic(el, d) {
    // 1) autocomplete padrão HTML
    const ac = d.autocomplete.split(/\s+/).pop();
    if (ac && ac !== "on" && ac !== "off") {
      const f = FIELDS.find((x) => x.ac.includes(ac));
      if (f) return f.key;
    }
    // 2) fontes em ordem de confiabilidade
    for (const src of [d.label, d.aria, d.placeholder, d.name, d.id, d.title]) {
      const k = matchText(src);
      if (k) return k;
    }
    // 3) tipo do input
    if (d.type) {
      const f = FIELDS.find((x) => x.type && x.type.includes(d.type));
      if (f) return f.key;
    }
    return null;
  }

  // ---------- Valores ----------
  function profileValue(key) {
    const p = state.profile;
    if (p[key]) return p[key];
    const full = (p.nome_completo || "").trim();
    if (key === "nome" && full) return full.split(/\s+/)[0];
    if (key === "sobrenome" && full) return full.split(/\s+/).slice(1).join(" ");
    if (key === "nome_completo" && p.nome) return [p.nome, p.sobrenome].filter(Boolean).join(" ");
    if (key === "telefone" && p.celular) return p.celular;
    if (key === "celular" && p.telefone) return p.telefone;
    return "";
  }

  function toIsoDate(v) {
    const m = v.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : v;
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
      : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    el.focus({ preventScroll: true });
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    el.blur();
  }

  function fillSelect(el, key, value) {
    const v = norm(value);
    const alts = new Set([v]);
    if (key === "estado") {
      const uf = value.toUpperCase();
      if (UFS[uf]) alts.add(norm(UFS[uf]));
      for (const [k, n] of Object.entries(UFS)) if (norm(n) === v) alts.add(norm(k));
    }
    if (key === "pais" && /^bra/i.test(value)) ["brasil", "brazil", "br", "bra"].forEach((x) => alts.add(x));
    if (key === "genero") {
      if (/^m/.test(v)) ["m", "masculino", "male", "homem"].forEach((x) => alts.add(x));
      if (/^f/.test(v)) ["f", "feminino", "female", "mulher"].forEach((x) => alts.add(x));
    }
    const opts = [...el.options];
    let opt = opts.find((o) => alts.has(norm(o.value)) || alts.has(norm(o.text)));
    if (!opt) opt = opts.find((o) => norm(o.text) && [...alts].some((a) => a.length > 2 && norm(o.text).includes(a)));
    if (!opt) return false;
    setNativeValue(el, opt.value);
    return true;
  }

  function fillElement(el, key) {
    let value = profileValue(key);
    if (!value) return false;
    if (el.tagName === "SELECT") return fillSelect(el, key, value);
    if ((el.type || "") === "date") value = toIsoDate(value);
    if (el.maxLength > 0 && value.length > el.maxLength) value = value.replace(/\D/g, "").slice(0, el.maxLength) || value.slice(0, el.maxLength);
    setNativeValue(el, value);
    highlight(el);
    return true;
  }

  function highlight(el) {
    const old = el.style.boxShadow;
    el.style.transition = "box-shadow .3s";
    el.style.boxShadow = "0 0 0 2px #22c55e, 0 0 10px rgba(34,197,94,.45)";
    setTimeout(() => (el.style.boxShadow = old), 1600);
  }

  // ---------- IA (via background) ----------
  async function cacheGet() {
    const k = "map:" + host;
    return (await chrome.storage.local.get(k))[k] || {};
  }
  async function cacheSet(map) {
    await chrome.storage.local.set({ ["map:" + host]: map });
  }

  async function classifyWithAI(items) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: "classify",
        fields: items.map((it, i) => ({ i, ...it.d })),
        keys: FIELDS.map((f) => ({ key: f.key, label: f.label }))
      });
      if (!res || res.error) {
        if (res && res.error) console.warn("[AutoFill IA] IA:", res.error);
        return {};
      }
      return res.mapping || {};
    } catch (e) {
      console.warn("[AutoFill IA]", e);
      return {};
    }
  }

  // ---------- Fluxo principal ----------
  let running = false;
  async function fillPage({ onlyEmpty = true, auto = false } = {}) {
    if (running) return { filled: 0 };
    running = true;
    try {
      await loadState();
      if (auto && isBlacklisted()) return { filled: 0 };
      const els = collectFields().filter((el) => !(onlyEmpty && el.value && el.tagName !== "SELECT"))
        .filter((el) => !(auto && filledOnce.has(el)));
      if (!els.length) return { filled: 0 };

      const cache = await cacheGet();
      const plan = [];
      const unknown = [];
      for (const el of els) {
        const d = describe(el);
        const sig = signature(d);
        let key = cache[sig];
        if (key === "_none") continue;
        if (!key) key = detectHeuristic(el, d);
        if (key) plan.push({ el, key });
        else unknown.push({ el, d, sig });
      }

      let aiUsed = 0;
      if (unknown.length && state.settings.ai && state.settings.ai.enabled) {
        const mapping = await classifyWithAI(unknown.slice(0, 40));
        let changed = false;
        unknown.slice(0, 40).forEach((u, i) => {
          const k = mapping[i];
          if (k && FIELD_BY_KEY[k]) { plan.push({ el: u.el, key: k }); cache[u.sig] = k; aiUsed++; }
          else cache[u.sig] = "_none";
          changed = true;
        });
        if (changed) await cacheSet(cache);
      }

      // evita preencher a mesma chave em vários campos do mesmo form (ex: dois "nome")
      let filled = 0;
      const usedPerForm = new Map();
      for (const { el, key } of plan) {
        const form = el.form || el.closest("form") || document.body;
        const used = usedPerForm.get(form) || new Set();
        if (used.has(key) && !["email"].includes(key)) continue;
        if (fillElement(el, key)) { filled++; used.add(key); usedPerForm.set(form, used); }
        filledOnce.add(el);
      }
      if (filled && !auto) toast(`✔ ${filled} campo(s) preenchido(s)` + (aiUsed ? ` · ${aiUsed} via IA` : ""));
      if (filled && auto) toast(`AutoFill IA: ${filled} campo(s) preenchido(s)`);
      return { filled, aiUsed, detected: plan.length, total: els.length };
    } finally {
      running = false;
    }
  }

  // ---------- UI: toast + botão flutuante ----------
  function toast(msg) {
    if (window.top !== window) return; // só no frame principal
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "20px", right: "20px", zIndex: 2147483647, background: "#111827", color: "#fff",
      padding: "10px 14px", borderRadius: "10px", font: "13px system-ui, sans-serif", boxShadow: "0 6px 24px rgba(0,0,0,.25)",
      opacity: "0", transition: "opacity .25s"
    });
    document.documentElement.appendChild(t);
    requestAnimationFrame(() => (t.style.opacity = "1"));
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2600);
  }

  let btn;
  function showButtonFor(el) {
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "⚡ Preencher";
      btn.title = "AutoFill IA — preencher este formulário (Alt+Shift+F)";
      Object.assign(btn.style, {
        position: "absolute", zIndex: 2147483647, background: "#4f46e5", color: "#fff", border: "none",
        borderRadius: "6px", padding: "3px 8px", font: "600 11px system-ui, sans-serif", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,.2)"
      });
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", async () => {
        btn.style.display = "none";
        await fillPage({ onlyEmpty: true });
      });
      document.documentElement.appendChild(btn);
    }
    const r = el.getBoundingClientRect();
    btn.style.display = "block";
    btn.style.top = window.scrollY + r.top - 24 + "px";
    btn.style.left = window.scrollX + r.right - 86 + "px";
  }
  function hideButton() { if (btn) setTimeout(() => (btn.style.display = "none"), 150); }

  document.addEventListener("focusin", async (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches("input, select, textarea")) return;
    if (state.settings.mode !== "click" || isBlacklisted() || !eligible(el)) return;
    if (!Object.keys(state.profile).some((k) => state.profile[k])) return;
    const d = describe(el);
    const cache = await cacheGet();
    if (detectHeuristic(el, d) || (cache[signature(d)] && cache[signature(d)] !== "_none") || state.settings.ai?.enabled) showButtonFor(el);
  });
  document.addEventListener("focusout", hideButton);

  // ---------- Modo automático ----------
  let debounce;
  function scheduleAuto() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (state.settings.mode === "auto") fillPage({ onlyEmpty: true, auto: true });
    }, 700);
  }
  const mo = new MutationObserver((muts) => {
    if (state.settings.mode !== "auto") return;
    if (muts.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && (n.matches?.("input,select,textarea,form") || n.querySelector?.("input,select,textarea"))))) scheduleAuto();
  });

  // ---------- Mensagens ----------
  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg.type === "fill") {
      fillPage({ onlyEmpty: !msg.overwrite }).then(reply);
      return true;
    }
    if (msg.type === "clearCache") {
      chrome.storage.local.remove("map:" + host).then(() => reply({ ok: true }));
      return true;
    }
  });

  loadState().then(() => {
    mo.observe(document.documentElement, { childList: true, subtree: true });
    if (state.settings.mode === "auto") scheduleAuto();
  });
})();
