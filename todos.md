# Tarefas e inventário

## Inventário
- [x] `README.md` — estrutura, segurança de segredos e instruções de deploy/DNS.
- [x] `index.html` — página inicial e conteúdo da landing page.
- [x] `styles.css` — identidade visual responsiva.
- [x] `vercel.json` — cabeçalhos e comportamento de URLs.
- [x] `.gitignore` — proteção de credenciais e arquivos gerados.
- [x] `.env.example` — nomes das variáveis necessárias, sem segredos.
- [x] `context.md` — objetivo e critérios persistentes.
- [x] `todos.md` — inventário e progresso.
- [x] `insights.md` — decisões e resultados acumulados.
- [x] `.env` — credenciais herdadas localmente, ajustadas para este projeto; ignorado pelo Git.

## Publicação
- [x] Repositório GitHub `TrilhadoGPT/thalita-braga-concursos`, branch `master`.
- [x] Primeiro push concluído.
- [x] Projeto Vercel `thalita-braga-concursos-web` ligado ao repositório.
- [x] Deploy de produção `READY`.
- [x] Domínio `web.thalitabragaconcursos.com` atribuído ao projeto Vercel.
- [ ] Responsável DNS publicar `CNAME web -> 1c25f8caca652bd2.vercel-dns-017.com.`
- [ ] Confirmar propagação DNS e verificação do domínio na Vercel.
- [ ] Validar endereço de contato provisório antes de divulgar a página.

## Material da aula — 09/11/26
- [x] Ler u-memory e auditar `password-redirect-module/`, aplicação Vercel e GTM existente.
- [x] Instalar a skill Impeccable globalmente no ambiente Codex.
- [x] Criar a página em `site-produtos/material/aula-09-nov-26/`, com acesso direto ao Material e formulário do Bônus.
- [x] Implementar endpoint server-side usando as variáveis exclusivas `MATERIAL_AULA_09_NOV_26_PASSWORD` e `MATERIAL_AULA_09_NOV_26_REDIRECT_URL`.
- [x] Preservar os cinco UTMs da URL de entrada nos dois destinos Google Drive; não encaminhar a senha aos links nem ao tracking.
- [x] Incluir GTM `GTM-WM3X2795` seguindo as páginas de referência; não foi configurado nem confirmado evento específico de acesso no GTM.
- [x] Adicionar testes locais com configuração simulada; quatro casos da função passaram.
- [x] Conferir visualmente desktop/mobile e o estado de senha incorreta usando mock local.
- [x] Configurar as duas variáveis sensíveis na Vercel para Production e Preview.
- [x] Commit `6f03808` enviado isoladamente à `master`; deploy de produção Vercel `READY`.
- [x] Conferir rota pública e assets via HTTPS (HTTP 200), método GET no endpoint (405), `noindex` e ausência da senha/destino bônus no HTML publicado.
- [x] Testar endpoint de produção com senha incorreta/correta e UTMs sintéticos: 401/200, UTMs preservados; resposta foi inspecionada sem seguir o redirecionamento nem abrir o Drive.
- [ ] Confirmar que as permissões da pasta bônus no Google Drive correspondem ao nível de privacidade desejado.
