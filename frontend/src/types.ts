export type Papel = 'USUARIO' | 'RESPONSAVEL' | 'ADMINISTRADOR';
export type StatusObjeto = 'PERDIDO' | 'ENCONTRADO' | 'DEVOLVIDO';
export type Usuario = { id: number; nome: string; email: string; papel: Papel };
export type Categoria = { id: number; nome: string };
export type Tag = { id: number; nome: string };
export type Localizacao = {
  id: number;
  nome: string;
  tipo: 'CAMPUS' | 'PREDIO' | 'ANDAR' | 'SALA';
  paiId?: number | null;
  caminho?: string;
  filhos?: Localizacao[];
};
export type Foto = { id: number; url: string };
export type Objeto = {
  id: number;
  tipo: string;
  descricao: string;
  dataOcorrencia: string;
  contato?: string | null;
  status: StatusObjeto;
  sensivel: boolean;
  categoriaId: number;
  localizacaoId: number;
  categoria: Categoria;
  localizacao: Localizacao;
  localizacaoCaminho?: string;
  registradoPor: { id: number; nome: string };
  registradoPorId: number;
  tags: Tag[];
  fotos: Foto[];
  fotosOcultas?: boolean;
  retirada?: { dataRetirada: string } | null;
};
export type Dashboard = {
  totalObjetos: number;
  porStatus: { perdidos: number; encontrados: number; devolvidos: number };
  totalUsuarios: number;
  totalRetiradas: number;
  taxaDevolucao: number;
  porCategoria: { id: number; nome: string; total: number }[];
  localizacoesComMaisObjetos: {
    id: number;
    nome: string;
    tipo: string;
    total: number;
  }[];
};
