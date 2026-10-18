<p align="center"><img src="assets/capa.png" alt="AutoFill IA: preenche qualquer formulário em 1 clique ou no automático" width="100%"></p>

# AutoFill IA

Extensão para Chrome, Edge e Brave que identifica os campos de qualquer formulário e preenche com seus dados, em 1 clique ou 100% automático. Quando o campo é “estranho” (nome aleatório, rótulo diferente), uma IA gratuita descobre o que ele pede.

**Site:** [manoelvilar.github.io/autofill-ia](https://manoelvilar.github.io/autofill-ia/) · **Teste:** [formulário com placar](https://manoelvilar.github.io/autofill-ia/teste.html) · **Privacidade:** [política](https://manoelvilar.github.io/autofill-ia/privacidade.html)

## Estrutura do repositório
```
extension/   código da extensão (é esta pasta que o navegador carrega)
store/       imagens e textos prontos para a Chrome Web Store
docs/        site no GitHub Pages: página inicial, formulário de teste e política de privacidade
assets/      imagens do README e ícone em alta resolução
scripts/     build.sh e build.ps1 geram o .zip para publicar
```

## Instalar (modo desenvolvedor)
1. Baixe o repositório (**Code → Download ZIP**) e descompacte.
2. Abra `chrome://extensions` (no Edge: `edge://extensions`).
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e escolha a pasta **`extension`**.
5. A página de configurações abre sozinha: cadastre seus dados e clique em **Salvar**.

## Modos
| Modo | Como funciona |
|---|---|
| **1 clique** (padrão) | Ao focar um campo reconhecido aparece o botão “Preencher” |
| **Automático** | Preenche sozinho quando o formulário aparece, inclusive em sites React/SPA |
| **Manual** | Só pelo ícone da extensão ou pelo atalho **Alt+Shift+F** |

## Como identifica os campos
1. **Atributo `autocomplete`** do HTML, quando o site usa o padrão.
2. **Heurística PT/EN**: lê o rótulo (`<label>`), `aria-label`, placeholder, `name`, `id` e o texto próximo, sem acentos. Reconhece “Nome completo”, “Seu melhor e-mail”, “WhatsApp”, “cpf_titular”, “logradouro”, “UF” e afins, e ignora armadilhas como “Estado civil” e “Nome da mãe”.
3. **IA (opcional)** para o que sobrar. Só os *metadados* do campo (rótulo, name, placeholder) são enviados, **nunca seus dados**. A resposta fica em cache por site, então cada formulário consulta a IA uma vez só.

A extensão nunca toca em senha, cartão, CVV, captcha, código de verificação ou busca.

## IAs gratuitas suportadas
| Provedor | Chave | Observação |
|---|---|---|
| Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | camada gratuita generosa |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | muito rápido |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | use modelos terminados em `:free` |
| Ollama Cloud | [ollama.com/settings/keys](https://ollama.com/settings/keys) | modelo padrão `gpt-oss:20b` |
| Ollama (local) | não precisa | offline: `ollama pull llama3.2` e `OLLAMA_ORIGINS="chrome-extension://*" ollama serve` |

Se o nome de um modelo sair de linha, digite outro no campo **Modelo** das configurações.

## Testar
Abra o [formulário de teste](https://manoelvilar.github.io/autofill-ia/teste.html) com a extensão instalada. O placar confere sozinho a heurística, a IA, as armadilhas e os campos que aparecem com atraso. Também dá para abrir `docs/teste.html` direto do computador, ativando **Permitir acesso a URLs de arquivo** nos detalhes da extensão.

## Publicar na Chrome Web Store
1. Gere o pacote: `./scripts/build.sh` (Linux/Mac) ou `.\scripts\build.ps1` (Windows). O zip sai em `dist/`.
2. No [painel de desenvolvedor](https://chrome.google.com/webstore/devconsole), crie um item e envie o zip.
3. Copie os textos e as justificativas de `store/listagem.md` e envie as imagens da pasta `store/`.
4. Política de privacidade: `https://manoelvilar.github.io/autofill-ia/privacidade.html`.

Antes de cada atualização, aumente o `"version"` em `extension/manifest.json`.

## Detalhes técnicos
- Manifest V3, sem dependências e sem etapa de build.
- Funciona com React, Vue e Angular: usa o setter nativo do campo e dispara os eventos `input` e `change`.
- Data `dd/mm/aaaa` vira o formato certo em campos `type="date"`.
- Selects de UF, país e gênero aceitam sigla ou nome (PB ou Paraíba).
- Nome completo é dividido em nome e sobrenome quando o site pede separado.
