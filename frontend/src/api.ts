import type {
  Categoria,
  Dashboard,
  Localizacao,
  Objeto,
  Papel,
  Tag,
  Usuario,
} from './types';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
let token = localStorage.getItem('achados_token') || '';

export function setToken(value: string) {
  token = value;
  if (value) localStorage.setItem('achados_token', value);
  else localStorage.removeItem('achados_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    const message =
      typeof data === 'object' && data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : data;
    throw new Error(message || `Erro ${response.status}`);
  }
  return data as T;
}
const body = (data: unknown) => JSON.stringify(data);

export const fotoUrl = (url: string) =>
  url.startsWith('/') ? `${BASE}${url}` : url;

export const api = {
  login: (email: string, senha: string) =>
    request<{ access_token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: body({ email, senha }),
    }),
  register: (nome: string, email: string, senha: string) =>
    request<Usuario>('/auth/register', {
      method: 'POST',
      body: body({ nome, email, senha }),
    }),
  me: () => request<Usuario>('/auth/me'),
  dashboard: () => request<Dashboard>('/relatorios/dashboard'),
  objetos: (filters = '') => request<Objeto[]>(`/objetos${filters}`),
  meusObjetos: () => request<Objeto[]>('/objetos/meus'),
  objeto: (id: number) => request<Objeto>(`/objetos/${id}`),
  criarPerdido: (data: unknown) =>
    request<Objeto>('/objetos/perdidos', { method: 'POST', body: body(data) }),
  criarEncontrado: (data: unknown) =>
    request<Objeto>('/objetos/encontrados', {
      method: 'POST',
      body: body(data),
    }),
  atualizarObjeto: (id: number, data: unknown) =>
    request<Objeto>(`/objetos/${id}`, { method: 'PATCH', body: body(data) }),
  excluirObjeto: (id: number) =>
    request(`/objetos/${id}`, { method: 'DELETE' }),
  adicionarFoto: (id: number, url: string) =>
    request(`/objetos/${id}/fotos`, { method: 'POST', body: body({ url }) }),
  enviarFotos: (id: number, arquivos: File[]) => {
    const form = new FormData();
    arquivos.forEach((a) => form.append('fotos', a));
    return request(`/objetos/${id}/fotos/upload`, {
      method: 'POST',
      body: form,
    });
  },
  categorias: () => request<Categoria[]>('/categorias'),
  tags: () => request<Tag[]>('/tags'),
  localizacoes: () => request<Localizacao[]>('/localizacoes'),
  arvore: () => request<Localizacao[]>('/localizacoes/arvore'),
  retiradas: () => request<any[]>('/retiradas'),
  criarRetirada: (data: unknown) =>
    request('/retiradas', { method: 'POST', body: body(data) }),
  usuarios: () => request<Usuario[]>('/usuarios'),
  alterarPapel: (id: number, papel: Papel) =>
    request(`/usuarios/${id}/papel`, {
      method: 'PATCH',
      body: body({ papel }),
    }),
  criarCategoria: (nome: string) =>
    request('/categorias', { method: 'POST', body: body({ nome }) }),
  criarTag: (nome: string) =>
    request('/tags', { method: 'POST', body: body({ nome }) }),
  criarLocalizacao: (data: unknown) =>
    request('/localizacoes', { method: 'POST', body: body(data) }),
};
