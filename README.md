# Thalita Braga Concursos

Site estático para `web.thalitabragaconcursos.com`, publicado na Vercel a partir da branch `master` deste repositório.

## Estrutura

- `index.html` — página inicial.
- `styles.css` — identidade visual e layout responsivo.
- `vercel.json` — cabeçalhos de segurança e URLs limpas.
- `context.md`, `todos.md`, `insights.md` — memória persistente do projeto.
- `.env.example` — nomes das variáveis de ambiente esperadas.

## Segredos locais

Crie/preencha `.env` localmente com as credenciais necessárias. O arquivo está no `.gitignore` e não deve ser versionado. Nunca coloque tokens na URL, nos arquivos do site ou nos arquivos de memória.

## Deploy e domínio

O projeto Vercel `thalita-braga-concursos-web` acompanha `master`. O domínio `web.thalitabragaconcursos.com` está vinculado ao projeto. A Vercel recomenda o registro DNS:

- Tipo: `CNAME`
- Nome/host: `web`
- Destino: `1c25f8caca652bd2.vercel-dns-017.com.`

O DNS ainda precisa ser publicado pelo responsável pela zona do domínio. O segundo destino genérico apresentado pela Vercel é `cname.vercel-dns.com.`
