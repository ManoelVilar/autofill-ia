# Textos para a Chrome Web Store / Edge Add-ons

Copie e cole cada bloco no campo correspondente do painel da loja.

## Nome
AutoFill IA

## Descrição curta (até 132 caracteres)
Preenche formulários em 1 clique ou no automático. Reconhece campos em português e usa IA gratuita para os campos difíceis.

## Categoria
Produtividade (Productivity)

## Idioma
Português (Brasil)

## Descrição longa
Cansado de digitar nome, e-mail, CPF, telefone e endereço em todo cadastro? O AutoFill IA reconhece os campos do formulário e preenche com os seus dados em um clique.

COMO FUNCIONA
• Cadastre seus dados uma vez na página de configurações.
• Ao clicar num campo aparece o botão "Preencher". Um clique e o formulário inteiro é preenchido.
• Também dá para usar o ícone da extensão ou o atalho Alt+Shift+F.

TRÊS MODOS
• 1 clique: mostra o botão ao focar um campo reconhecido.
• Automático: preenche sozinho quando o formulário aparece, inclusive em sites que carregam campos depois.
• Manual: só pelo ícone ou pelo atalho.

FEITO PARA FORMULÁRIOS BRASILEIROS
Reconhece CPF, CNPJ, RG, CEP, UF, bairro, complemento, WhatsApp e data de nascimento, com rótulos em português ou inglês. Converte a data para o formato do navegador e escolhe a opção certa em listas de estado, país e gênero.

IA GRATUITA PARA OS CAMPOS DIFÍCEIS (OPCIONAL)
Quando o campo tem um rótulo incomum, como "Como devemos te chamar?", a extensão pode perguntar a uma IA o que ele pede. Você escolhe o provedor e usa a sua própria chave: Google Gemini, Groq, OpenRouter, Ollama Cloud ou Ollama no seu computador, totalmente offline. A resposta fica guardada por site, então cada formulário consulta a IA uma vez só.

PRIVACIDADE
• Seus dados ficam apenas no seu navegador. Não existe servidor do AutoFill IA.
• Para a IA vão só os rótulos dos campos (por exemplo "E-mail" ou "Como devemos te chamar?"), nunca os seus dados.
• A extensão nunca preenche senha, cartão, CVV, código de verificação ou busca.
• Dá para desligar a extensão em sites específicos, como o do seu banco.

Código aberto: https://github.com/ManoelVilar/autofill-ia

---

## Aba "Privacidade" do painel

### Propósito único
Preencher automaticamente formulários da web com os dados de perfil que o próprio usuário cadastrou na extensão.

### Justificativa das permissões
**storage**
Guarda localmente o perfil do usuário, as configurações e o cache de campos já identificados em cada site.

**activeTab**
Permite preencher a aba atual quando o usuário clica no ícone da extensão ou usa o atalho de teclado.

**scripting**
Injeta o script de preenchimento em abas que já estavam abertas antes da instalação, quando o usuário pede o preenchimento pelo ícone.

**Permissão de host (<all_urls>)**
O usuário pode precisar preencher formulários em qualquer site (lojas, cadastros, candidaturas de emprego). O script só lê os campos de formulário da página e só escreve neles no modo escolhido pelo usuário. Também é usada para chamar a API de IA que o usuário configurou, quando ele ativa essa opção.

### Código remoto
Não. Todo o código está no pacote. As chamadas à IA enviam e recebem apenas dados (JSON), nunca código.

### Uso de dados
Marque:
- **Informações de identificação pessoal** (nome, e-mail, CPF, endereço)
- **Informações de contato**

Declarações (marque as três):
- Não vendo nem transfiro dados de usuários para terceiros, fora dos casos de uso aprovados.
- Não uso nem transfiro dados de usuários para fins não relacionados ao propósito único.
- Não uso nem transfiro dados de usuários para determinar crédito ou conceder empréstimos.

### URL da política de privacidade
https://manoelvilar.github.io/autofill-ia/privacidade.html

---

## Imagens (pasta store/)
| Arquivo | Onde usar |
|---|---|
| captura-1.png, captura-2.png, captura-3.png | Capturas de tela (1280×800) |
| promo-440x280.png | Bloco promocional pequeno |
| destaque-1400x560.png | Bloco de destaque (opcional) |
| ../extension/icons/icon128.png | Ícone da loja |
