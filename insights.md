# Insights acumulados

## 2026-11-10 — fluxo de material da aula de 09/11/26
- A rota foi criada em `site-produtos/material/aula-09-nov-26/`, porque a raiz Vercel do projeto é `site-produtos/`.
- A audiência de alunos/participantes que receberam o link foi inferida a partir do pedido; a página foi marcada `noindex,nofollow,noarchive`.
- Mantida a identidade já usada em `assets/base.css`, com o nome solicitado `Thalita Braga Concursos` e o GTM `GTM-WM3X2795` no `<head>` e logo após abrir `<body>`.
- Material abre o Google Drive diretamente. Bônus mostra a senha em formulário; o endpoint `api/material-aula-09-nov-26` valida no servidor e só responde com o destino após acerto.
- Variáveis Vercel exclusivas do fluxo: `MATERIAL_AULA_09_NOV_26_PASSWORD` e `MATERIAL_AULA_09_NOV_26_REDIRECT_URL`. A senha não aparece no HTML, JS, endpoint ou memória; a URL de bônus é injetada pela configuração do servidor.
- O endpoint restringe destino a HTTPS em `drive.google.com/drive/folders/`, não guarda cache e compara senha em tempo constante. Uma senha errada retorna apenas erro; interface pisca em vermelho e exibe “Senha incorreta”.
- Os cinco UTMs são mantidos ao abrir as duas pastas. Nenhum dado de senha ou identificador pessoal é enviado ao GTM.
- Testes unitários com mocks: 4/4 passaram para senha correta/incorreta, método inválido e configuração/destino inválido. A apresentação foi conferida visualmente em desktop e mobile; o erro foi simulado.
- GTM está instalado no código, mas não confirma que tags tenham disparado no Google/Meta; nenhum gatilho específico da campanha foi fornecido. As permissões reais do conteúdo são controladas pelo Google Drive; a página apenas controla a apresentação do link de bônus.
- As variáveis foram cadastradas como sensíveis em Production e Preview. Commit `6f03808` enviado à `master`; deploy `dpl_8XsSZWs6Lua4NnYHiHXb2tj4gGf3` ficou `READY`.
- Smoke check público: a rota e os dois assets retornaram HTTP 200; GET no endpoint retorna 405. O HTML publicado não expõe a senha nem a URL da pasta bônus.
- O fluxo foi validado com mocks e no endpoint de produção: senha incorreta retornou 401, correta retornou 200 com a pasta Drive configurada e os cinco UTMs sintéticos. Não seguimos o redirect nem abrimos a pasta.

## 2026-10-28 — estrutura inicial e publicação
- Criado um site estático independente, sem dependências de build; adequado ao deploy direto na Vercel.
- Direção visual editorial em verde profundo, creme e terracota, com layout responsivo e CTA de contato.
- Conteúdo de contato usa `contato@thalitabragaconcursos.com` como endereço provisório; confirmar antes de divulgar.
- Repositório criado na conta GitHub pessoal `TrilhadoGPT/thalita-braga-concursos`, branch `master`; o `.env` de referência pertencia ao repo `maestro-web` e não definia o destino deste novo projeto.
- `.env` específico foi criado localmente com variáveis de GitHub/Vercel necessárias, mas sem senhas de outros projetos; está ignorado e não foi incluído no push.
- Projeto Vercel `thalita-braga-concursos-web` associado ao repositório. Deploy de produção está `READY` em `thalita-braga-concursos-da3pagikx-trilhadogpts-projects.vercel.app`.
- Domínio `web.thalitabragaconcursos.com` foi adicionado ao projeto Vercel. A API recomenda `CNAME web -> 1c25f8caca652bd2.vercel-dns-017.com.`; enquanto o DNS não for publicado, Vercel reporta configuração DNS pendente.
