# Resultado dos testes automatizados (smoke test)

Executado em 24/11/2026, 22:00:12 contra `http://localhost:3000`.

| ID | Cenário testado | Resultado esperado (HTTP) | Resultado obtido (HTTP) | Situação |
|---|---|---|---|---|
| T01 | Cadastro de usuário comum | 201 | 201 | Sucesso |
| T02 | Cadastro com e-mail já existente | 409 | 409 | Sucesso |
| T03 | Cadastro com dados inválidos (e-mail e senha curta) | 400 | 400 | Sucesso |
| T04 | Login com senha incorreta | 401 | 401 | Sucesso |
| T05 | Login válido retorna token JWT | 200 | 200 | Sucesso |
| T06 | Rota protegida sem token | 401 | 401 | Sucesso |
| T07 | Rota protegida com token inválido | 401 | 401 | Sucesso |
| T08 | Usuário comum não lista usuários (perfil sem permissão) | 403 | 403 | Sucesso |
| T09 | Administrador cadastra categoria | 201 | 201 | Sucesso |
| T10 | Categoria com nome repetido | 409 | 409 | Sucesso |
| T11 | Usuário comum não cadastra categoria | 403 | 403 | Sucesso |
| T12 | Cadastro de tag (característica) | 201 | 201 | Sucesso |
| T13 | Localizações hierárquicas: campus > prédio > andar > sala | 201 | 201 | Sucesso |
| T14 | Sala sem informar o pai | 400 | 400 | Sucesso |
| T15 | Sala dentro de prédio (nível errado) | 400 | 400 | Sucesso |
| T16 | Usuário comum cadastra objeto perdido | 201 | 201 | Sucesso |
| T17 | Objeto perdido sem campos obrigatórios (contato/tipo) | 400 | 400 | Sucesso |
| T18 | Objeto com data no futuro | 400 | 400 | Sucesso |
| T19 | Objeto com categoria inexistente | 400 | 400 | Sucesso |
| T20 | Usuário comum não cadastra objeto encontrado | 403 | 403 | Sucesso |
| T21 | Administrador cadastra objeto encontrado | 201 | 201 | Sucesso |
| T22 | Busca por tipo (garrafa) | 200 | 200 | Sucesso |
| T23 | Busca por localização do PRÉDIO inclui objetos da sala | 200 | 200 | Sucesso |
| T24 | Busca em outro prédio não traz o objeto | 200 | 200 | Sucesso |
| T25 | Filtro inválido na busca (status desconhecido) | 400 | 400 | Sucesso |
| T26 | Foto de objeto sensível OCULTA para outro usuário comum | 200 | 200 | Sucesso |
| T27 | Foto de objeto sensível VISÍVEL para quem registrou | 200 | 200 | Sucesso |
| T28 | Foto de objeto sensível visível para a equipe | 200 | 200 | Sucesso |
| T29 | Objeto inexistente | 404 | 404 | Sucesso |
| T30 | Id inválido na URL | 400 | 400 | Sucesso |
| T31 | Usuário comum não edita objeto de outra pessoa | 403 | 403 | Sucesso |
| T32 | Dono corrige a descrição do próprio objeto | 200 | 200 | Sucesso |
| T33 | Dono (usuário comum) não altera o status | 403 | 403 | Sucesso |
| T34 | Status DEVOLVIDO não pode ser definido manualmente | 400 | 400 | Sucesso |
| T35 | Responsável anexa foto ao objeto | 201 | 201 | Sucesso |
| T36 | Retirada de objeto ainda PERDIDO é recusada | 400 | 400 | Sucesso |
| T37 | Usuário comum não registra retirada | 403 | 403 | Sucesso |
| T38 | Retirada com dados incompletos | 400 | 400 | Sucesso |
| T39 | Responsável registra a retirada do objeto encontrado | 201 | 201 | Sucesso |
| T40 | Após a retirada o status do objeto passa a DEVOLVIDO | 200 | 200 | Sucesso |
| T41 | Segunda retirada do mesmo objeto | 409 | 409 | Sucesso |
| T42 | Objeto devolvido não pode ser editado | 409 | 409 | Sucesso |
| T43 | Usuário comum não vê dados pessoais da retirada | 200 | 200 | Sucesso |
| T44 | Usuário cria o próprio perfil (1:1) | 201 | 201 | Sucesso |
| T45 | Segundo perfil para o mesmo usuário (regra 1:1) | 409 | 409 | Sucesso |
| T46 | Categoria em uso não pode ser excluída | 409 | 409 | Sucesso |
| T47 | Localização com sublocalizações não pode ser excluída | 409 | 409 | Sucesso |
| T48 | Dono exclui o próprio objeto perdido | 200 | 200 | Sucesso |
| T49 | Relatório com 3+ tabelas (objetos detalhados) | 200 | 200 | Sucesso |
| T50 | Dashboard com totais | 200 | 200 | Sucesso |
| T51 | Usuário comum não acessa relatórios | 403 | 403 | Sucesso |

**Total: 51/51 cenários com sucesso.**
