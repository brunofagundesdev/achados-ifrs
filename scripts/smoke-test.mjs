import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SUFIXO = Date.now();
const SENHA = 'senha123';
const resultados = [];

async function http(metodo, rota, { token, corpo } = {}) {
  const resposta = await fetch(BASE + rota, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let dados = null;
  try {
    dados = await resposta.json();
  } catch {}
  return { status: resposta.status, dados };
}

async function caso(id, descricao, esperado, fn, verificar) {
  let obtido = '-';
  let ok = false;
  let detalhe = '';
  try {
    const r = await fn();
    obtido = String(r.status);
    ok = r.status === esperado;
    if (ok && verificar) {
      const extra = verificar(r.dados);
      if (extra !== true) {
        ok = false;
        detalhe = ` (falhou a checagem extra: ${extra || 'condição não atendida'})`;
      }
    }
    if (!ok && !detalhe)
      detalhe = ` ${JSON.stringify(r.dados)?.slice(0, 120) ?? ''}`;
  } catch (erro) {
    obtido = 'erro';
    detalhe = ` ${erro.message}`;
  }
  resultados.push({
    id,
    descricao,
    esperado: String(esperado),
    obtido: obtido + detalhe,
    ok,
  });
  console.log(
    `${ok ? 'OK  ' : 'FALHA'} ${id} ${descricao} -> esperado ${esperado}, obtido ${obtido}${detalhe}`,
  );
}

const registrar = (nome, email) =>
  http('POST', '/auth/register', { corpo: { nome, email, senha: SENHA } });
const logar = async (email, senha = SENHA) => {
  const r = await http('POST', '/auth/login', { corpo: { email, senha } });
  return r.dados?.access_token;
};

async function main() {
  console.log(`\nSmoke test em ${BASE}\n`);

  const emailCandidato = `admin.${SUFIXO}@ifrs.edu.br`;
  const emailComum = `usuario.${SUFIXO}@ifrs.edu.br`;
  const emailComum2 = `usuario2.${SUFIXO}@ifrs.edu.br`;

  await registrar('Admin Teste', emailCandidato);
  let tokenAdmin = await logar(emailCandidato);
  let eu = (await http('GET', '/auth/me', { token: tokenAdmin })).dados;

  if (eu?.papel !== 'ADMINISTRADOR') {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_SENHA) {
      tokenAdmin = await logar(
        process.env.ADMIN_EMAIL,
        process.env.ADMIN_SENHA,
      );
      eu = (await http('GET', '/auth/me', { token: tokenAdmin })).dados;
    }
  }
  if (eu?.papel !== 'ADMINISTRADOR') {
    console.error(
      'Nao foi possivel obter um ADMINISTRADOR. O banco ja tem usuarios: informe ADMIN_EMAIL e ADMIN_SENHA de um administrador existente.',
    );
    process.exit(2);
  }

  await caso('T01', 'Cadastro de usuário comum', 201, () =>
    registrar('Usuário Comum', emailComum),
  );
  await caso('T02', 'Cadastro com e-mail já existente', 409, () =>
    registrar('Outro', emailComum),
  );
  await caso(
    'T03',
    'Cadastro com dados inválidos (e-mail e senha curta)',
    400,
    () =>
      http('POST', '/auth/register', {
        corpo: { nome: 'X', email: 'nao-e-email', senha: '1' },
      }),
  );
  await caso('T04', 'Login com senha incorreta', 401, () =>
    http('POST', '/auth/login', {
      corpo: { email: emailComum, senha: 'errada123' },
    }),
  );
  let tokenComum;
  await caso(
    'T05',
    'Login válido retorna token JWT',
    200,
    async () => {
      const r = await http('POST', '/auth/login', {
        corpo: { email: emailComum, senha: SENHA },
      });
      tokenComum = r.dados?.access_token;
      return r;
    },
    (d) => typeof d?.access_token === 'string' || 'sem access_token',
  );
  await registrar('Usuário Dois', emailComum2);
  const tokenComum2 = await logar(emailComum2);

  await caso('T06', 'Rota protegida sem token', 401, () =>
    http('GET', '/objetos'),
  );
  await caso('T07', 'Rota protegida com token inválido', 401, () =>
    http('GET', '/objetos', { token: 'token.invalido.aqui' }),
  );
  await caso(
    'T08',
    'Usuário comum não lista usuários (perfil sem permissão)',
    403,
    () => http('GET', '/usuarios', { token: tokenComum }),
  );

  let categoriaId, tagId, campusId, predioId, andarId, salaId, predio2Id;
  await caso('T09', 'Administrador cadastra categoria', 201, async () => {
    const r = await http('POST', '/categorias', {
      token: tokenAdmin,
      corpo: { nome: `Eletrônicos ${SUFIXO}` },
    });
    categoriaId = r.dados?.id;
    return r;
  });
  await caso('T10', 'Categoria com nome repetido', 409, () =>
    http('POST', '/categorias', {
      token: tokenAdmin,
      corpo: { nome: `Eletrônicos ${SUFIXO}` },
    }),
  );
  await caso('T11', 'Usuário comum não cadastra categoria', 403, () =>
    http('POST', '/categorias', {
      token: tokenComum,
      corpo: { nome: 'Proibida' },
    }),
  );
  await caso('T12', 'Cadastro de tag (característica)', 201, async () => {
    const r = await http('POST', '/tags', {
      token: tokenAdmin,
      corpo: { nome: `Preto ${SUFIXO}` },
    });
    tagId = r.dados?.id;
    return r;
  });

  const novaLocal = async (nome, tipo, paiId) => {
    const r = await http('POST', '/localizacoes', {
      token: tokenAdmin,
      corpo: { nome, tipo, paiId },
    });
    return r;
  };
  await caso(
    'T13',
    'Localizações hierárquicas: campus > prédio > andar > sala',
    201,
    async () => {
      const c = await novaLocal(`Campus Rio Grande ${SUFIXO}`, 'CAMPUS');
      campusId = c.dados?.id;
      const p = await novaLocal('Prédio A', 'PREDIO', campusId);
      predioId = p.dados?.id;
      const a = await novaLocal('1º andar', 'ANDAR', predioId);
      andarId = a.dados?.id;
      const s = await novaLocal('Sala 101', 'SALA', andarId);
      salaId = s.dados?.id;
      const p2 = await novaLocal('Prédio B', 'PREDIO', campusId);
      predio2Id = p2.dados?.id;
      return s;
    },
    (d) =>
      d?.caminho?.includes('Prédio A > 1º andar > Sala 101') ||
      `caminho = ${d?.caminho}`,
  );
  await caso('T14', 'Sala sem informar o pai', 400, () =>
    novaLocal('Sala X', 'SALA'),
  );
  await caso('T15', 'Sala dentro de prédio (nível errado)', 400, () =>
    novaLocal('Sala Y', 'SALA', predioId),
  );

  const ontem = new Date(Date.now() - 86400000).toISOString();
  const corpoPerdido = {
    tipo: 'Fone de ouvido',
    descricao: 'Fone preto com estojo',
    categoriaId,
    localizacaoId: salaId,
    data: ontem,
    contato: 'usuario@ifrs.edu.br',
    sensivel: true,
    tagIds: [tagId],
    fotoUrls: ['http://localhost/foto-sensivel.jpg'],
  };
  let perdidoId;
  await caso(
    'T16',
    'Usuário comum cadastra objeto perdido',
    201,
    async () => {
      const r = await http('POST', '/objetos/perdidos', {
        token: tokenComum,
        corpo: corpoPerdido,
      });
      perdidoId = r.dados?.id;
      return r;
    },
    (d) => d?.status === 'PERDIDO' || `status = ${d?.status}`,
  );
  await caso(
    'T17',
    'Objeto perdido sem campos obrigatórios (contato/tipo)',
    400,
    () =>
      http('POST', '/objetos/perdidos', {
        token: tokenComum,
        corpo: { descricao: 'sem tipo' },
      }),
  );
  await caso('T18', 'Objeto com data no futuro', 400, () =>
    http('POST', '/objetos/perdidos', {
      token: tokenComum,
      corpo: { ...corpoPerdido, data: '2999-01-01T00:00:00.000Z' },
    }),
  );
  await caso('T19', 'Objeto com categoria inexistente', 400, () =>
    http('POST', '/objetos/perdidos', {
      token: tokenComum,
      corpo: { ...corpoPerdido, categoriaId: 999999 },
    }),
  );
  await caso('T20', 'Usuário comum não cadastra objeto encontrado', 403, () =>
    http('POST', '/objetos/encontrados', {
      token: tokenComum,
      corpo: corpoPerdido,
    }),
  );

  let encontradoId;
  const { contato: _c, ...semContato } = corpoPerdido;
  await caso(
    'T21',
    'Administrador cadastra objeto encontrado',
    201,
    async () => {
      const r = await http('POST', '/objetos/encontrados', {
        token: tokenAdmin,
        corpo: {
          ...semContato,
          tipo: 'Garrafa térmica',
          descricao: 'Garrafa azul',
          localizacaoId: salaId,
          sensivel: false,
          fotoUrls: [],
        },
      });
      encontradoId = r.dados?.id;
      return r;
    },
    (d) => d?.status === 'ENCONTRADO' || `status = ${d?.status}`,
  );

  await caso(
    'T22',
    'Busca por tipo (garrafa)',
    200,
    () => http('GET', '/objetos?tipo=garrafa', { token: tokenComum }),
    (d) =>
      (Array.isArray(d) && d.some((o) => o.id === encontradoId)) ||
      'objeto não apareceu',
  );
  await caso(
    'T23',
    'Busca por localização do PRÉDIO inclui objetos da sala',
    200,
    () =>
      http('GET', `/objetos?localizacaoId=${predioId}`, { token: tokenComum }),
    (d) =>
      (Array.isArray(d) && d.some((o) => o.id === encontradoId)) ||
      'objeto da sala não apareceu',
  );
  await caso(
    'T24',
    'Busca em outro prédio não traz o objeto',
    200,
    () =>
      http('GET', `/objetos?localizacaoId=${predio2Id}`, { token: tokenComum }),
    (d) =>
      (Array.isArray(d) && !d.some((o) => o.id === encontradoId)) ||
      'objeto apareceu indevidamente',
  );
  await caso('T25', 'Filtro inválido na busca (status desconhecido)', 400, () =>
    http('GET', '/objetos?status=QUALQUER', { token: tokenComum }),
  );
  await caso(
    'T26',
    'Foto de objeto sensível OCULTA para outro usuário comum',
    200,
    () => http('GET', `/objetos/${perdidoId}`, { token: tokenComum2 }),
    (d) =>
      (d?.fotosOcultas === true && d?.fotos?.length === 0) ||
      'fotos apareceram',
  );
  await caso(
    'T27',
    'Foto de objeto sensível VISÍVEL para quem registrou',
    200,
    () => http('GET', `/objetos/${perdidoId}`, { token: tokenComum }),
    (d) => d?.fotos?.length === 1 || 'dono não viu a foto',
  );
  await caso(
    'T28',
    'Foto de objeto sensível visível para a equipe',
    200,
    () => http('GET', `/objetos/${perdidoId}`, { token: tokenAdmin }),
    (d) => d?.fotos?.length === 1 || 'equipe não viu a foto',
  );
  await caso('T29', 'Objeto inexistente', 404, () =>
    http('GET', '/objetos/999999', { token: tokenComum }),
  );
  await caso('T30', 'Id inválido na URL', 400, () =>
    http('GET', '/objetos/abc', { token: tokenComum }),
  );

  await caso('T31', 'Usuário comum não edita objeto de outra pessoa', 403, () =>
    http('PATCH', `/objetos/${perdidoId}`, {
      token: tokenComum2,
      corpo: { descricao: 'invasão' },
    }),
  );
  await caso('T32', 'Dono corrige a descrição do próprio objeto', 200, () =>
    http('PATCH', `/objetos/${perdidoId}`, {
      token: tokenComum,
      corpo: { descricao: 'Fone preto, estojo riscado' },
    }),
  );
  await caso('T33', 'Dono (usuário comum) não altera o status', 403, () =>
    http('PATCH', `/objetos/${perdidoId}`, {
      token: tokenComum,
      corpo: { status: 'ENCONTRADO' },
    }),
  );
  await caso(
    'T34',
    'Status DEVOLVIDO não pode ser definido manualmente',
    400,
    () =>
      http('PATCH', `/objetos/${encontradoId}`, {
        token: tokenAdmin,
        corpo: { status: 'DEVOLVIDO' },
      }),
  );
  await caso('T35', 'Responsável anexa foto ao objeto', 201, () =>
    http('POST', `/objetos/${encontradoId}/fotos`, {
      token: tokenAdmin,
      corpo: { url: 'http://localhost/garrafa.jpg' },
    }),
  );

  const PNG_1X1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const enviar = async (objetoId, token, conteudo, nome) => {
    const form = new FormData();
    form.append('fotos', new Blob([conteudo], { type: 'image/png' }), nome);
    const r = await fetch(`${BASE}/objetos/${objetoId}/fotos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    return { status: r.status, dados: await r.json().catch(() => null) };
  };
  let urlUpload;
  await caso(
    'T35A',
    'Upload de arquivo de foto grava a imagem no servidor',
    201,
    async () => {
      const r = await enviar(encontradoId, tokenAdmin, PNG_1X1, 'garrafa.png');
      urlUpload = r.dados?.[0]?.url;
      return r;
    },
    (d) =>
      /^\/uploads\/.+\.png$/.test(d?.[0]?.url ?? '') || `url = ${d?.[0]?.url}`,
  );
  await caso(
    'T35B',
    'Imagem enviada fica acessível pela URL devolvida',
    200,
    async () => {
      const r = await fetch(BASE + urlUpload);
      return { status: r.status, dados: r.headers.get('content-type') };
    },
    (tipo) => tipo?.startsWith('image/png') || `content-type = ${tipo}`,
  );
  await caso('T35C', 'Upload de arquivo que não é imagem é recusado', 400, () =>
    enviar(
      encontradoId,
      tokenAdmin,
      Buffer.from('nao sou uma imagem'),
      'falsa.png',
    ),
  );
  await caso(
    'T35D',
    'Usuário comum não envia foto para objeto de outra pessoa',
    403,
    () => enviar(perdidoId, tokenComum2, PNG_1X1, 'intruso.png'),
  );

  await caso('T36', 'Retirada de objeto ainda PERDIDO é recusada', 400, () =>
    http('POST', '/retiradas', {
      token: tokenAdmin,
      corpo: { objetoId: perdidoId, retiradoPorNome: 'Fulano' },
    }),
  );
  await caso('T37', 'Usuário comum não registra retirada', 403, () =>
    http('POST', '/retiradas', {
      token: tokenComum,
      corpo: { objetoId: encontradoId, retiradoPorNome: 'Fulano' },
    }),
  );
  await caso('T38', 'Retirada com dados incompletos', 400, () =>
    http('POST', '/retiradas', {
      token: tokenAdmin,
      corpo: { objetoId: encontradoId },
    }),
  );
  await caso(
    'T39',
    'Responsável registra a retirada do objeto encontrado',
    201,
    () =>
      http('POST', '/retiradas', {
        token: tokenAdmin,
        corpo: {
          objetoId: encontradoId,
          retiradoPorNome: 'Maria da Silva',
          retiradoPorDocumento: '2026123456',
        },
      }),
  );
  await caso(
    'T40',
    'Após a retirada o status do objeto passa a DEVOLVIDO',
    200,
    () => http('GET', `/objetos/${encontradoId}`, { token: tokenAdmin }),
    (d) =>
      (d?.status === 'DEVOLVIDO' &&
        d?.retirada?.retiradoPorNome === 'Maria da Silva') ||
      `status = ${d?.status}`,
  );
  await caso('T41', 'Segunda retirada do mesmo objeto', 409, () =>
    http('POST', '/retiradas', {
      token: tokenAdmin,
      corpo: { objetoId: encontradoId, retiradoPorNome: 'Outra' },
    }),
  );
  await caso('T42', 'Objeto devolvido não pode ser editado', 409, () =>
    http('PATCH', `/objetos/${encontradoId}`, {
      token: tokenAdmin,
      corpo: { descricao: 'tarde demais' },
    }),
  );
  await caso(
    'T43',
    'Usuário comum não vê dados pessoais da retirada',
    200,
    () => http('GET', `/objetos/${encontradoId}`, { token: tokenComum }),
    (d) =>
      (d?.retirada && d.retirada.retiradoPorNome === undefined) ||
      'dados pessoais vazaram',
  );

  await caso('T44', 'Usuário cria o próprio perfil (1:1)', 201, () =>
    http('POST', '/perfis', {
      token: tokenComum,
      corpo: { telefone: '53999990000', matricula: '2026001' },
    }),
  );
  await caso(
    'T45',
    'Segundo perfil para o mesmo usuário (regra 1:1)',
    409,
    () =>
      http('POST', '/perfis', {
        token: tokenComum,
        corpo: { telefone: '53888880000' },
      }),
  );

  await caso('T46', 'Categoria em uso não pode ser excluída', 409, () =>
    http('DELETE', `/categorias/${categoriaId}`, { token: tokenAdmin }),
  );
  await caso(
    'T47',
    'Localização com sublocalizações não pode ser excluída',
    409,
    () => http('DELETE', `/localizacoes/${campusId}`, { token: tokenAdmin }),
  );
  await caso('T48', 'Dono exclui o próprio objeto perdido', 200, () =>
    http('DELETE', `/objetos/${perdidoId}`, { token: tokenComum }),
  );

  await caso(
    'T49',
    'Relatório com 3+ tabelas (objetos detalhados)',
    200,
    () => http('GET', '/relatorios/objetos-detalhados', { token: tokenAdmin }),
    (d) =>
      !!(
        Array.isArray(d) &&
        d.length > 0 &&
        d[0].categoria &&
        d[0].localizacaoCaminho
      ) || 'estrutura inesperada',
  );
  await caso(
    'T50',
    'Dashboard com totais',
    200,
    () => http('GET', '/relatorios/dashboard', { token: tokenAdmin }),
    (d) => typeof d?.totalObjetos === 'number' || 'sem totais',
  );
  await caso('T51', 'Usuário comum não acessa relatórios', 403, () =>
    http('GET', '/relatorios/dashboard', { token: tokenComum }),
  );

  const passou = resultados.filter((r) => r.ok).length;
  const linhas = [
    '# Resultado dos testes automatizados (smoke test)',
    '',
    `Executado em ${new Date().toLocaleString('pt-BR')} contra \`${BASE}\`.`,
    '',
    '| ID | Cenário testado | Resultado esperado (HTTP) | Resultado obtido (HTTP) | Situação |',
    '|---|---|---|---|---|',
    ...resultados.map(
      (r) =>
        `| ${r.id} | ${r.descricao} | ${r.esperado} | ${r.obtido} | ${r.ok ? 'Sucesso' : 'PROBLEMA'} |`,
    ),
    '',
    `**Total: ${passou}/${resultados.length} cenários com sucesso.**`,
    '',
  ];
  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/resultado-testes.md', linhas.join('\n'));
  console.log(
    `\n${passou}/${resultados.length} cenários com sucesso. Tabela salva em docs/resultado-testes.md`,
  );
  process.exit(passou === resultados.length ? 0 : 1);
}

main().catch((erro) => {
  console.error(
    'Erro ao executar o smoke test (a API está no ar?):',
    erro.message,
  );
  process.exit(2);
});
