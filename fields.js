// Definições dos campos do perfil + regras de detecção heurística.
// Compartilhado entre content script e páginas da extensão.
(function (g) {
  const FIELDS = [
    { key: "email", label: "E-mail", ac: ["email"], type: ["email"], re: [/e[\s-]?mail/, /correio\s*eletronico/] },
    { key: "cpf", label: "CPF", ac: [], re: [/\bcpf\b/, /cpf_?cnpj/, /documento/] },
    { key: "cnpj", label: "CNPJ", ac: [], re: [/\bcnpj\b/] },
    { key: "rg", label: "RG", ac: [], re: [/\brg\b/, /identidade/, /registro\s*geral/] },
    { key: "cep", label: "CEP", ac: ["postal-code"], re: [/\bcep\b/, /postal/, /\bzip\b/, /zipcode/, /codigo\s*postal/] },
    { key: "linkedin", label: "LinkedIn", ac: [], re: [/linkedin/] },
    { key: "github", label: "GitHub", ac: [], re: [/github/] },
    { key: "nome_completo", label: "Nome completo", ac: ["name"], re: [/nome\s*completo/, /full\s*name/, /^nome$/, /^name$/, /seu\s*nome/, /your\s*name/, /razao\s*social/, /titular/], not: [/\bmae\b/, /\bpai\b/, /mother/, /father/, /usuario/, /user/, /empresa/, /company/, /cartao/, /card/] },
    { key: "nome", label: "Primeiro nome", ac: ["given-name"], re: [/primeiro\s*nome/, /first\s*name/, /given\s*name/, /\bfname\b/, /firstname/, /^prenome/] },
    { key: "sobrenome", label: "Sobrenome", ac: ["family-name"], re: [/sobre\s*nome/, /ultimo\s*nome/, /last\s*name/, /surname/, /family\s*name/, /\blname\b/, /lastname/] },
    { key: "celular", label: "Celular / WhatsApp", ac: ["tel", "tel-national", "mobile"], type: ["tel"], re: [/celular/, /whats/, /mobile/, /cell/, /telemovel/] },
    { key: "telefone", label: "Telefone fixo", ac: [], re: [/telefone/, /\bfone\b/, /phone/, /\btel\b/, /contato\s*telef/], not: [/celular/, /whats/, /mobile/] },
    { key: "data_nascimento", label: "Data de nascimento", ac: ["bday"], re: [/nascimento/, /birth/, /\bdob\b/, /data\s*nasc/, /bday/, /aniversario/] },
    { key: "genero", label: "Gênero / Sexo", ac: ["sex"], re: [/genero/, /\bsexo\b/, /gender/] },
    { key: "endereco", label: "Endereço (rua)", ac: ["address-line1", "street-address"], re: [/endereco/, /logradouro/, /\brua\b/, /address/, /street/, /avenida/] },
    { key: "numero", label: "Número", ac: [], re: [/^n(u|ú)mero$/, /\bnumero\b/, /\bnum\b/, /^n[°º.]?$/, /house\s*number/, /street\s*number/] },
    { key: "complemento", label: "Complemento", ac: ["address-line2"], re: [/complemento/, /apto/, /apartamento/, /address\s*2/, /address2/, /line\s*2/] },
    { key: "bairro", label: "Bairro", ac: ["address-level3"], re: [/bairro/, /neighbo/, /district/] },
    { key: "cidade", label: "Cidade", ac: ["address-level2"], re: [/cidade/, /municipio/, /\bcity\b/, /town/, /localidade/] },
    { key: "estado", label: "Estado (UF)", ac: ["address-level1"], re: [/estado/, /\buf\b/, /\bstate\b/, /province/, /region/], not: [/civil/, /marital/] },
    { key: "pais", label: "País", ac: ["country", "country-name"], re: [/\bpais\b/, /country/, /nacionalidade/] },
    { key: "empresa", label: "Empresa", ac: ["organization"], re: [/empresa/, /company/, /organiza/, /instituicao/, /employer/] },
    { key: "cargo", label: "Cargo / Profissão", ac: ["organization-title"], re: [/cargo/, /job\s*title/, /profiss/, /ocupacao/, /occupation/, /position/, /funcao/] },
    { key: "site", label: "Site", ac: ["url"], type: ["url"], re: [/\bsite\b/, /website/, /homepage/, /\burl\b/, /portfolio/] },
    { key: "usuario", label: "Nome de usuário", ac: ["username"], re: [/usuario/, /username/, /user\s*name/, /\blogin\b/, /apelido/, /nickname/] }
  ];

  // Campos que nunca devemos tocar
  const SKIP_TYPES = new Set(["hidden", "submit", "button", "reset", "image", "file", "password", "checkbox", "radio", "range", "color", "search"]);
  const SKIP_HINTS = [/captcha/, /cartao/, /card\s*number/, /\bcvv\b/, /\bcvc\b/, /senha/, /password/, /token/, /\botp\b/, /codigo\s*de\s*verifica/, /search/, /pesquis/, /buscar/];

  function norm(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[_\-\[\].:*]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  g.AFIA = { FIELDS, SKIP_TYPES, SKIP_HINTS, norm };
})(typeof window !== "undefined" ? window : self);
