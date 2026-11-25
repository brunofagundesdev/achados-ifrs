# Achados IFRS — Frontend

Interface web do sistema de achados e perdidos do IFRS — Campus Rio Grande. Desenvolvida com React, TypeScript e Vite e integrada à API NestJS existente.

## Requisitos

- Node.js 20 ou superior
- API do Achados IFRS executando em `http://localhost:3000`

## Instalação

Dentro desta pasta:

```bash
npm install
```

Crie um arquivo `.env` (opcional) com a URL da API:

```env
VITE_API_URL=http://localhost:3000
```

Inicie o frontend:

```bash
npm run dev
```

Abra `http://localhost:5173`.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Fluxo inicial

1. Inicie o PostgreSQL/Neon e o backend NestJS (`npm run start:dev` na pasta do backend).
2. Acesse `http://localhost:5173`.
3. Cadastre a primeira conta. Conforme a regra do backend, o primeiro usuário cadastrado recebe o papel `ADMINISTRADOR`.
4. O administrador pode promover usuários para `RESPONSAVEL` na tela Usuários e permissões.
5. O responsável pode cadastrar objetos encontrados, gerenciar cadastros e registrar retiradas.

## Funcionalidades

- Login, cadastro e sessão JWT persistida no navegador.
- Dashboard para equipe e painel de atalhos para usuários comuns.
- Consulta com filtros por texto, status, categoria e localização.
- Registro de objetos perdidos e encontrados conforme as permissões da API.
- Upload de fotos (arquivos de imagem enviados ao servidor) no cadastro e nos detalhes do objeto, além de fotos por URL.
- Detalhes do objeto e exclusão permitida pelo backend.
- Meus registros.
- Retiradas/devoluções e histórico.
- Cadastros de categorias, tags e localizações hierárquicas.
- Gestão de papéis de usuários para administradores.
- Layout adaptável a desktop e celular.

## Observações de integração

- As fotos são enviadas em `multipart/form-data` para `POST /objetos/:id/fotos/upload` (até 5 imagens de 5 MB). O backend grava os arquivos na pasta `uploads/` e devolve a URL `/uploads/...`, que o frontend exibe prefixando `VITE_API_URL`.
- A API controla as permissões reais. O frontend apenas oculta opções que o papel atual não pode usar.
- O campo `contato` dos objetos perdidos é exibido nos detalhes conforme a resposta autorizada da API.
- Para outro endereço de API, configure `VITE_API_URL` antes de executar o Vite.
