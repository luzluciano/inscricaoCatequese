export interface Crismando {
  id?: number;
  email: string;
  nomeCompleto: string;
  dataNascimento: Date;
  naturalidade: string;
  sexo: 'Masculino' | 'Feminino';
  endereco: string;

  batizado: boolean;
  paroquiaBatismo: string;
  dioceseBatismo: string;
  comunhao: boolean;
  paroquiaComunhao?: string;
  dioceseComunhao?: string;

  documentoIdentidade?: File;
  certidaoBatismo?: File;
  
  // Metadados dos arquivos salvos no banco (BLOB)
  documentoIdentidadeNome?: string;
  documentoIdentidadeTipo?: string;
  documentoIdentidadeTamanho?: number;
  certidaoBatismoNome?: string;
  certidaoBatismoTipo?: string;
  certidaoBatismoTamanho?: number;

  telefoneWhatsApp: string;
  emailContato: string;

  nomePai?: string;
  estadoCivilPai?: string;
  naturalidadePai?: string;
  nomeMae?: string;
  estadoCivilMae?: string;
  naturalidadeMae?: string;
  paisCasadosIgreja: boolean;
  paroquiaCasamentoPais?: string;
  dioceseCasamentoPais?: string;

  nomePadrinhoMadrinha?: string;
  padrinhoCrismado?: boolean;
  documentoPadrinho?: File;

  dataInicioCurso: Date;
  comunidadeCurso: string;
  nomeCatequista: string;
  horarioCurso: string;
}
