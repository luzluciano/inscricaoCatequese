export interface StatusControle {
  inscricaoId: number;
  status: 'Em Andamento' | 'Desistência' | 'Concluído' | '';
  observacao: string;
  dataAtualizacao: Date;
}