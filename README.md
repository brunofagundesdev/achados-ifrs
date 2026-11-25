# Achados IFRS

> Sistema de achados e perdidos do IFRS - Campus Rio Grande.
> A API permite cadastrar objetos perdidos e encontrados, consultar e buscar registros, organizar as localizações do campus de forma hierárquica e registrar a retirada (devolução) dos objetos, com controle de acesso por perfil.

## Tecnologias utilizadas

- Node.js, NestJS, Prisma ORM 7.10.0, PostgreSQL (Neon)
- JWT (`@nestjs/jwt`), Bcrypt, class-validator / class-transformer
- Testes: Vitest (unitários) e script de testes de ponta a ponta (`scripts/smoke-test.mjs`)

## Pré-requisitos

Node.js 20+, npm, Git e uma conta no [Neon](https://neon.tech) (banco PostgreSQL gratuito).

## Instalação

```bash
git clone https://github.com/brunofagundesdev/achados-ifrs.git
cd achados-ifrs
npm install
```

> Em versões recentes do npm os scripts de instalação ficam bloqueados por padrão. Se o `npm install` avisar sobre `bcrypt`, `prisma` ou `@prisma/engines`, libere e reconstrua:
>
> ```bash
> npm install-scripts approve bcrypt prisma @prisma/engines
> npm rebuild bcrypt prisma @prisma/engines
> ```

## Variáveis de ambiente

Copie o modelo e preencha (`.env` **não** vai para o Git):

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://usuario:senha@host/database?sslmode=require"
JWT_SECRET="troque_por_uma_chave_super_secreta"
PORT=3000
```

## Migrações e client do Prisma

```bash
npx prisma migrate dev --name init   # cria as tabelas no Neon
npx prisma generate                  # gera o client em src/generated/prisma
```

> No Prisma 7 o `migrate dev` não gera o client automaticamente, por isso o `generate` em seguida. O client gerado **não** é versionado (está no `.gitignore`): rode `npx prisma generate` sempre que clonar o projeto ou alterar o schema.

## Executando

```bash
npm run start:dev
```

A API fica em `http://localhost:3000`.

## Primeiro acesso (administrador)

O **primeiro usuário cadastrado** (`POST /auth/register` com o banco vazio) vira `ADMINISTRADOR`. Todos os seguintes entram como `USUARIO`, e o administrador promove quem for do setor com `PATCH /usuarios/:id/papel` (`{ "papel": "RESPONSAVEL" }`).

Se precisar promover alguém direto no banco: `UPDATE usuarios SET papel = 'ADMINISTRADOR' WHERE email = '...';`

## Estrutura do projeto

```
src/
├── auth/          (module, controller, service, guard global, decorators @Public/@Roles/@UsuarioAtual, dto)
├── prisma/        (module global, service com adapter do Neon)
├── usuarios/      (CRUD de usuários + troca de papel)
├── perfis/        (1:1 com usuários)
├── categorias/    (CRUD)
├── tags/          (CRUD - características dos objetos, N:N)
├── localizacoes/  (CRUD + árvore campus > prédio > andar > sala)
├── objetos/       (perdidos, encontrados, busca, fotos, status)
├── retiradas/     (registro de retirada -> status DEVOLVIDO)
├── relatorios/    (consultas avançadas com 3+ tabelas)
├── common/        (utilitários: erros do Prisma, caminho da localização)
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma
└── migrations/    (gerado por: npx prisma migrate dev)
scripts/smoke-test.mjs
docs/              (diagrama ER, diagrama de componentes, resultado dos testes)
prisma.config.ts
```

Diagramas: [`docs/er.png`](docs/er.png) (modelo de dados) e [`docs/componentes.png`](docs/componentes.png) (componentes UML).

Evidências da entrega de Engenharia de Software I: [`docs/resultado-testes.md`](docs/resultado-testes.md) (51/51 cenários) e prints em [`docs/evidencias/`](docs/evidencias/). Quadro Kanban: https://github.com/users/brunofagundesdev/projects/4/views/2

## Modelo de dados (8 tabelas)

| Relacionamento | Tabelas |
|---|---|
| 1:1 | `usuarios` ↔ `perfis`; `objetos` ↔ `retiradas` |
| 1:N | `categorias` → `objetos`; `localizacoes` → `objetos`; `usuarios` → `objetos` (quem registrou); `usuarios` → `retiradas` (quem entregou); `objetos` → `fotos`; `localizacoes` → `localizacoes` (hierarquia) |
| N:N | `objetos` ↔ `tags` (características como cor e marca; tabela intermediária implícita do Prisma) |

## Autenticação e perfis de acesso

Fluxo: registrar → logar → receber o token → enviar `Authorization: Bearer SEU_TOKEN`.

O `AuthGuard` é **global** (registrado com `APP_GUARD`): toda rota exige token, exceto as marcadas com `@Public()` (`/auth/register` e `/auth/login`). Rotas com `@Roles(...)` também conferem o papel, que é lido do banco a cada requisição (mudança de papel vale na hora). Sem token → **401**; papel sem permissão → **403**.

| Ação | USUARIO | RESPONSAVEL | ADMINISTRADOR |
|---|:-:|:-:|:-:|
| Cadastrar objeto perdido, consultar/buscar, editar o **próprio** registro | ✔ | ✔ | ✔ |
| Cadastrar objeto encontrado | ✘ | ✔ | ✔ |
| Alterar status, editar/excluir qualquer objeto, anexar fotos em qualquer objeto | ✘ | ✔ | ✔ |
| Registrar/consultar retiradas | ✘ | ✔ | ✔ |
| Gerir categorias, tags e localizações | ✘ | ✔ | ✔ |
| Relatórios e dashboard | ✘ | ✔ | ✔ |
| Listar usuários, trocar papéis | ✘ | ✘ | ✔ |

## Regras de negócio

- **Perfil 1:1:** um usuário não pode ter dois perfis (409).
- **Localizações:** respeitam `campus > prédio > andar > sala`; sala dentro de prédio, campus com pai etc. retornam 400. Não exclui localização com filhos ou objetos (409).
- **Objetos:** a data não pode estar no futuro; categoria, localização e tags informadas precisam existir; objeto perdido exige contato; `DEVOLVIDO` só é definido pela retirada (400); objeto devolvido não pode ser editado nem excluído (409).
- **Retirada (HU04):** só objetos `ENCONTRADO` podem ser retirados; a retirada não pode ser futura nem anterior à entrada; criar a retirada e mudar o status para `DEVOLVIDO` acontece em **uma transação**; segunda retirada do mesmo objeto → 409.
- **Fotos sensíveis (RF10):** em objeto marcado como `sensivel`, as fotos ficam ocultas para o usuário comum (`fotosOcultas: true`); equipe e o próprio dono do registro continuam vendo. Dados pessoais da retirada também ficam ocultos para o usuário comum.
- **Administração:** o sistema nunca fica sem administrador; não exclui usuário com histórico.

## Rotas da API

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | /auth/register | Cadastro de usuário | Pública |
| POST | /auth/login | Login (retorna JWT e dados do usuário) | Pública |
| GET | /auth/me | Dados do usuário logado | Autenticado |
| GET | /usuarios | Lista usuários | Admin |
| GET | /usuarios/:id | Busca usuário (próprio ou admin) | Autenticado |
| PATCH | /usuarios/:id | Atualiza nome/e-mail/senha | Próprio ou admin |
| PATCH | /usuarios/:id/papel | Troca o papel | Admin |
| DELETE | /usuarios/:id | Remove usuário | Próprio ou admin |
| POST | /perfis | Cria o próprio perfil (admin pode informar `usuarioId`) | Autenticado |
| GET | /perfis | Lista perfis | Admin |
| GET | /perfis/me | Meu perfil | Autenticado |
| GET / PATCH / DELETE | /perfis/:id | Busca / atualiza / remove | Próprio ou admin |
| GET | /categorias, /categorias/:id | Consulta | Autenticado |
| POST / PATCH / DELETE | /categorias, /categorias/:id | Gestão | Equipe |
| GET | /tags, /tags/:id | Consulta | Autenticado |
| POST / PATCH / DELETE | /tags, /tags/:id | Gestão | Equipe |
| GET | /localizacoes?tipo=&paiId= | Lista (com caminho completo) | Autenticado |
| GET | /localizacoes/arvore | Árvore campus → sala | Autenticado |
| GET | /localizacoes/:id | Busca (com filhos) | Autenticado |
| POST / PATCH / DELETE | /localizacoes, /localizacoes/:id | Gestão | Equipe |
| POST | /objetos/perdidos | Cadastra objeto perdido (RF03) | Autenticado |
| POST | /objetos/encontrados | Cadastra objeto encontrado (RF04) | Equipe |
| GET | /objetos | Busca com filtros (RF06): `status, categoriaId, localizacaoId, tagId, tipo, busca, dataInicio, dataFim` | Autenticado |
| GET | /objetos/meus | Objetos que eu registrei | Autenticado |
| GET | /objetos/:id | Busca objeto | Autenticado |
| PATCH | /objetos/:id | Atualiza dados/status (RF08) | Equipe ou dono |
| DELETE | /objetos/:id | Exclui objeto | Equipe ou dono |
| POST | /objetos/:id/fotos | Anexa foto por URL (RF05) | Equipe ou dono |
| POST | /objetos/:id/fotos/upload | Upload do arquivo da foto (multipart, campo `fotos`, até 5 imagens JPG/PNG/WEBP/GIF de 5 MB) — gravado em `uploads/` no servidor (RF05) | Equipe ou dono |
| GET | /uploads/:arquivo | Serve a imagem enviada (URL devolvida no upload) | Público (nome aleatório) |
| DELETE | /objetos/:id/fotos/:fotoId | Remove foto | Equipe ou dono |
| POST | /retiradas | Registra retirada (RF09) | Equipe |
| GET | /retiradas, /retiradas/:id | Consulta retiradas | Equipe |
| PATCH | /retiradas/:id | Corrige dados da retirada | Equipe |
| DELETE | /retiradas/:id | Desfaz retirada (objeto volta a ENCONTRADO) | Equipe |
| GET | /relatorios/objetos-detalhados?status= | Objetos + categoria + localização + usuário/perfil + tags + retirada (7 tabelas) | Equipe |
| GET | /relatorios/retiradas-detalhadas | Retiradas + objeto + categoria + localização + responsável | Equipe |
| GET | /relatorios/dashboard | Totais por status, categoria e localização, taxa de devolução | Equipe |

## Códigos de erro

`400` dado inválido (DTO ou regra de negócio) · `401` não autenticado / token inválido · `403` sem permissão · `404` não encontrado · `409` conflito (duplicidade, estado inválido) · `500` erro interno.

## Testando a API

**Manual:** Insomnia, Postman ou Thunder Client. Fluxo: `POST /auth/register` → `POST /auth/login` → copiar o `access_token` → enviar `Authorization: Bearer <token>`.

**Testes unitários** (regras de negócio com banco simulado):

```bash
npm test
```

**Testes de ponta a ponta** (51 cenários contra a API em execução; gera a tabela `docs/resultado-testes.md` com cenário, resultado esperado, resultado obtido e situação):

```bash
npm run start:dev      # terminal 1
npm run smoke          # terminal 2
```

Se o banco já tiver usuários, informe um administrador existente: `ADMIN_EMAIL=... ADMIN_SENHA=... npm run smoke`.

## Decisões e limitações

- **Fotos (RF05):** a foto pode ser enviada como **arquivo** (`POST /objetos/:id/fotos/upload`, `multipart/form-data`, campo `fotos`) ou informada por **URL** (`POST /objetos/:id/fotos`). No upload, o arquivo fica em memória até as permissões serem conferidas; o tipo é validado pelo conteúdo (bytes iniciais), não pela extensão; a imagem é gravada em `uploads/` (ou `UPLOADS_DIR`) com nome aleatório (UUID) e o banco guarda a URL relativa `/uploads/<arquivo>`. Ao excluir a foto ou o objeto, o arquivo também é apagado do disco.
  Exemplo: `curl -H "Authorization: Bearer TOKEN" -F "fotos=@foto.jpg" http://localhost:3000/objetos/1/fotos/upload`
- **"Tipo" do objeto:** é o nome do que foi perdido/achado (ex.: "Garrafa térmica"); a **categoria** é o agrupamento (ex.: "Utensílios"); o **status** (`PERDIDO`/`ENCONTRADO`/`DEVOLVIDO`) diz em que fase o registro está.
- **Correspondência entre perdido e encontrado** é manual (conforme o escopo da disciplina): a equipe consulta e atualiza o status.

## Integrantes

- Bruno Fagundes Garcia
- Cristian Ferreira Vaz
- Yago Sotter Caçoilo

## Licença

Projeto desenvolvido exclusivamente para fins acadêmicos nas disciplinas de Backend e Engenharia de Software I do IFRS - Campus Rio Grande.
