export interface ICliente {
  id: string
  nome: string
  telefone?: string
  tipo: 'PF' | 'PJ'
  email?: string
  cpf_cnpj?: string
  inscricao_estadual?: string
  cep?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  complemento?: string
  created_at?: string
}

export interface IInsumo {
  id: string
  nome: string
  quantidade_atual: number
  unidade: string
  preco_unitario?: number
  created_at?: string
}

export interface IVenda {
  id: number
  cliente_id: string
  data_venda: string
  valor_total: number
  pago: boolean
  observacao?: string
  Cliente?: ICliente
  itens_venda?: IItemVenda[]
}

export interface IItemVenda {
  id: number
  venda_id: number
  produto: string
  tamanho: number
  quantidade: number
  valor_unitario: number
  lote_id?: string
}

export interface ILote {
  id: string
  produto: 'limoncello' | 'arancello'
  volume_atual: number
  status: 'producao' | 'pronto' | 'finalizado'
  data_criacao: string
  data_finalizacao?: string
}
