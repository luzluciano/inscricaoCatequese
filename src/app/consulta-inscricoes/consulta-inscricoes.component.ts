import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InscricaoService } from '../services/inscricao.service';
import { Crismando } from '../model/crismando.model';

@Component({
  selector: 'app-consulta-inscricoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './consulta-inscricoes.component.html',
  styleUrl: './consulta-inscricoes.component.scss'
})
export class ConsultaInscricoesComponent implements OnInit {
  consultaForm: FormGroup;
  inscricoes: Crismando[] = [];
  loading = false;
  erro: string | null = null;
  filtroAplicado = false;

  constructor(
    private fb: FormBuilder,
    private inscricaoService: InscricaoService
  ) {
    this.consultaForm = this.fb.group({
      email: [''],
      nomeCompleto: [''],
      dataInicio: [''],
      dataFim: [''],
      comunidadeCurso: [''],
      sexo: [''],
      batizado: ['']
    });
  }

  ngOnInit() {
    this.carregarTodasInscricoes();
  }

  carregarTodasInscricoes() {
    this.loading = true;
    this.erro = null;
    
    this.inscricaoService.consultarInscricoes().subscribe({
      next: (response) => {
        this.inscricoes = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar inscrições:', error);
        this.erro = 'Erro ao carregar inscrições. Verifique se o backend está funcionando.';
        this.loading = false;
      }
    });
  }

  consultarInscricoes() {
    this.loading = true;
    this.erro = null;
    this.filtroAplicado = true;
    
    const filtros = this.consultaForm.value;
    
    this.inscricaoService.consultarInscricoes(filtros).subscribe({
      next: (response) => {
        this.inscricoes = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao consultar inscrições:', error);
        this.erro = 'Erro ao consultar inscrições. Tente novamente.';
        this.loading = false;
      }
    });
  }

  limparFiltros() {
    this.consultaForm.reset();
    this.filtroAplicado = false;
    this.carregarTodasInscricoes();
  }

  exportarCSV() {
    if (this.inscricoes.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const headers = [
      // Informações Básicas
      'E-mail', 'Nome Completo', 'Data Nascimento', 'Naturalidade', 'Sexo', 'Endereço',
      
      // Informações Sacramentais
      'Batizado', 'Paróquia Batismo', 'Diocese Batismo', 'Comunhão', 'Paróquia Comunhão', 'Diocese Comunhão',
      
      // Contato
      'Telefone WhatsApp', 'E-mail Contato',
      
      // Dados dos Pais
      'Nome Pai', 'Estado Civil Pai', 'Naturalidade Pai', 'Nome Mãe', 'Estado Civil Mãe', 'Naturalidade Mãe',
      'Pais Casados Igreja', 'Paróquia Casamento Pais', 'Diocese Casamento Pais',
      
      // Padrinho/Madrinha
      'Nome Padrinho/Madrinha', 'Padrinho Crismado',
      
      // Curso Preparatório
      'Data Início Curso', 'Comunidade Curso', 'Nome Catequista', 'Horário Curso',
      
      // Documentos
      'Documento Identidade', 'Tamanho Doc. Identidade', 'Certidão Batismo', 'Tamanho Certidão'
    ].join(',');

    const csvData = this.inscricoes.map(inscricao => [
      // Informações Básicas
      inscricao.email || '',
      inscricao.nomeCompleto || '',
      this.formatarDataParaCSV(inscricao.dataNascimento),
      inscricao.naturalidade || '',
      inscricao.sexo || '',
      inscricao.endereco || '',
      
      // Informações Sacramentais
      inscricao.batizado ? 'Sim' : 'Não',
      inscricao.paroquiaBatismo || '',
      inscricao.dioceseBatismo || '',
      this.formatarBooleanParaCSV(inscricao.comunhao),
      inscricao.paroquiaComunhao || '',
      inscricao.dioceseComunhao || '',
      
      // Contato
      inscricao.telefoneWhatsApp || '',
      inscricao.emailContato || '',
      
      // Dados dos Pais
      inscricao.nomePai || '',
      inscricao.estadoCivilPai || '',
      inscricao.naturalidadePai || '',
      inscricao.nomeMae || '',
      inscricao.estadoCivilMae || '',
      inscricao.naturalidadeMae || '',
      this.formatarBooleanParaCSV(inscricao.paisCasadosIgreja),
      inscricao.paroquiaCasamentoPais || '',
      inscricao.dioceseCasamentoPais || '',
      
      // Padrinho/Madrinha
      inscricao.nomePadrinhoMadrinha || '',
      inscricao.padrinhoCrismado ? 'Sim' : 'Não',
      
      // Curso Preparatório
      this.formatarDataParaCSV(inscricao.dataInicioCurso),
      inscricao.comunidadeCurso || '',
      inscricao.nomeCatequista || '',
      inscricao.horarioCurso || '',
      
      // Documentos
      inscricao.documentoIdentidadeNome || 'Não anexado',
      inscricao.documentoIdentidadeNome ? this.formatarTamanho(inscricao.documentoIdentidadeTamanho || 0) : 'N/A',
      inscricao.certidaoBatismoNome || 'Não anexado',
      inscricao.certidaoBatismoNome ? this.formatarTamanho(inscricao.certidaoBatismoTamanho || 0) : 'N/A'
    ].map(field => `"${field}"`).join(',')).join('\n');

    const csvContent = headers + '\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inscricoes-crisma-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Funções auxiliares para formatação do CSV
  formatarDataParaCSV(data: string | Date): string {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  formatarBooleanParaCSV(valor: any): string {
    if (valor === true || valor === 'Sim') return 'Sim';
    if (valor === false || valor === 'Não') return 'Não';
    return 'N/A';
  }

  formatarData(data: string | Date | null | undefined): string {
    if (!data) return '';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch (error) {
      return '';
    }
  }

  // Método para verificar o status da comunhão
  getComunhaoStatus(comunhao: any): string {
    if (comunhao === true || comunhao === 'Sim') return 'Sim';
    if (comunhao === false || comunhao === 'Não') return 'Não';
    return 'N/I';
  }

  // Método para verificar se comunhão é Sim
  isComunhaoSim(comunhao: any): boolean {
    return comunhao === true || comunhao === 'Sim';
  }

  // Método para verificar se comunhão é Não
  isComunhaoNao(comunhao: any): boolean {
    return comunhao === false || comunhao === 'Não';
  }

  // ====== MÉTODOS DE AÇÕES ======

  verDetalhes(inscricao: any) {
    // Exibir detalhes completos da inscrição
    const detalhes = `
📋 DETALHES DA INSCRIÇÃO

👤 DADOS PESSOAIS:
• Nome: ${inscricao.nomeCompleto}
• Email: ${inscricao.email}
• Data de Nascimento: ${this.formatarData(inscricao.dataNascimento)}
• Naturalidade: ${inscricao.naturalidade}
• Sexo: ${inscricao.sexo}
• Endereço: ${inscricao.endereco}

📞 CONTATO:
• WhatsApp: ${inscricao.telefoneWhatsApp}
• Email: ${inscricao.emailContato}

✝️ SACRAMENTOS:
• Batizado: ${inscricao.batizado ? 'Sim' : 'Não'}
• Paróquia Batismo: ${inscricao.paroquiaBatismo || 'N/A'}
• Diocese Batismo: ${inscricao.dioceseBatismo || 'N/A'}
• Comunhão: ${this.getComunhaoStatus(inscricao.comunhao)}
• Paróquia Comunhão: ${inscricao.paroquiaComunhao || 'N/A'}

👪 FAMÍLIA:
• Pai: ${inscricao.nomePai || 'N/A'}
• Mãe: ${inscricao.nomeMae || 'N/A'}
• Padrinho/Madrinha: ${inscricao.nomePadrinhoMadrinha || 'N/A'}

📚 CURSO:
• Data Início: ${this.formatarData(inscricao.dataInicioCurso)}
• Comunidade: ${inscricao.comunidadeCurso}
• Catequista: ${inscricao.nomeCatequista}
• Horário: ${inscricao.horarioCurso}

📅 Cadastrado em: ${this.formatarData(inscricao.createdAt)}
`;

    alert(detalhes);
  }

  editarInscricao(inscricao: any) {
    // Por enquanto, apenas mostra um alerta
    // No futuro, pode redirecionar para uma página de edição
    const confirmar = confirm(`✏️ Deseja editar a inscrição de "${inscricao.nomeCompleto}"?\n\n(Funcionalidade em desenvolvimento)`);
    
    if (confirmar) {
      console.log('🔧 Editando inscrição:', inscricao);
      alert('🚧 Funcionalidade de edição em desenvolvimento!\n\nEm breve será possível editar os dados da inscrição.');
    }
  }

  excluirInscricao(inscricao: any) {
    const confirmar = confirm(`🗑️ TEM CERTEZA que deseja EXCLUIR a inscrição de "${inscricao.nomeCompleto}"?\n\n⚠️ Esta ação NÃO PODE ser desfeita!`);
    
    if (confirmar) {
      const confirmarNovamente = confirm(`⚠️ ÚLTIMA CONFIRMAÇÃO!\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE a inscrição de:\n"${inscricao.nomeCompleto}"\n\nDigite OK para confirmar:`);
      
      if (confirmarNovamente) {
        // Fazer a requisição para excluir no backend
        this.inscricaoService.excluirInscricao(inscricao.id).subscribe({
          next: (response: any) => {
            console.log('✅ Inscrição excluída:', response);
            alert(`✅ Inscrição de "${inscricao.nomeCompleto}" excluída com sucesso!`);
            
            // Recarregar a lista
            this.consultarInscricoes();
          },
          error: (error: any) => {
            console.error('❌ Erro ao excluir:', error);
            alert('❌ Erro ao excluir inscrição!\nTente novamente.');
          }
        });
      }
    }
  }

  // ====== MÉTODOS PARA DOCUMENTOS ======

  baixarDocumento(tipo: string, inscricaoId: number, nomeArquivo: string) {
    const url = `https://projeto-cadastro-g6xl.vercel.app/api/arquivo/${tipo}/${inscricaoId}`;
    
    // Criar um link temporário para forçar o download
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.target = '_blank';
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Iniciando download de ${tipo} para inscrição ${inscricaoId}: ${nomeArquivo}`);
  }

  formatarTamanho(tamanhoBytes: number): string {
    if (!tamanhoBytes || tamanhoBytes <= 0) return 'Tamanho desconhecido';
    
    const kb = tamanhoBytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else if (kb >= 1) {
      return `${kb.toFixed(0)} KB`;
    } else {
      return `${tamanhoBytes} bytes`;
    }
  }
}