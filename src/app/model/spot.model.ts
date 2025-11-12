export interface Spot {
  id: number;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  icone?: string;
  imagem?: string;
  linkTexto?: string;
  linkUrl?: string;
  ativo: boolean;
  ordem: number;
  tipoSpot: 'informacao' | 'acao' | 'destaque' | 'promocional';
  configuracoes?: {
    corFundo?: string;
    corTexto?: string;
    mostrarIcone?: boolean;
    mostrarImagem?: boolean;
    mostrarLink?: boolean;
  };
  dataInicio?: Date;
  dataFim?: Date;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface SpotResponse {
  success: boolean;
  data: Spot[];
  message?: string;
}