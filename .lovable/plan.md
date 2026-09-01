# Login por nome de usuário ou e-mail

## O que muda para você

- Na tela de entrada, o campo passa a aceitar **nome de usuário** (ex.: `devitech_admin`) **ou e-mail**. Fim do erro "Inclua um @ no endereço de e-mail".
- Cada usuário criado pelo administrador DeviTech ganha um nome de acesso único, além do e-mail.
- O administrador geral recebe o nome de usuário `devitech_admin`, mantendo a mesma senha atual.
- A recuperação/redefinição de senha continua pelo administrador (plataforma privada, sem cadastro público).

## Banco de dados

- Adicionar `username` na tabela de perfis: texto único, obrigatório, sempre salvo em minúsculas e sem espaços.
- Preencher os perfis existentes com um nome derivado do e-mail e definir `devitech_admin` para o administrador geral.
- Índice único que ignora maiúsculas/minúsculas, para evitar dois usuários com o mesmo nome.
- Nenhuma política nova de leitura: o nome de usuário só é consultado no servidor, nunca exposto a visitantes anônimos.

## Entrada no sistema

- Nova função de servidor `signInWithIdentifier` que:
  1. Recebe identificador + senha.
  2. Se não houver "@", converte o nome de usuário no e-mail correspondente (consulta privilegiada no servidor).
  3. Executa a autenticação no servidor e devolve a sessão.
  4. Em qualquer falha, retorna uma mensagem genérica ("usuário ou senha inválidos") — sem revelar se o nome existe.
- A tela de login passa a usar essa função e aplica a sessão no navegador; o campo vira texto comum (sem validação de e-mail), rótulo "E-mail ou usuário", com `autocomplete: username`.

## Administração

- Formulário de criação/edição de usuários em `/admin/usuarios` ganha o campo "Nome de usuário", com validação de formato (letras, números, ponto, hífen, sublinhado) e aviso quando já existir.
- Lista de usuários passa a exibir o nome de acesso ao lado do e-mail.

## Detalhes técnicos

- Migração: `ALTER TABLE public.profiles ADD COLUMN username text`, backfill, `NOT NULL`, índice `UNIQUE (lower(username))`; nenhuma mudança em GRANTs (a tabela já está liberada para `authenticated`).
- `src/lib/auth.functions.ts`: server function pública que resolve o nome via `supabaseAdmin` (carregado dentro do handler) e chama `signInWithPassword` com o cliente publicável do servidor, retornando `access_token`/`refresh_token`.
- `src/routes/index.tsx`: chama a função e aplica `supabase.auth.setSession(...)` antes de redirecionar para `/app`.
- `src/lib/admin.functions.ts`: `createUser`/`updateUser` passam a gravar e validar `username`; erro amigável em conflito de unicidade.
