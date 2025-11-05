import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { InscricaoService } from '../services/inscricao.service';
import { Crismando } from '../model/crismando.model';
import { StatusControle } from '../model/status-controle.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-status',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-status.component.html',
  styleUrls: ['./admin-status.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminStatusComponent implements OnInit {
  inscricao: Crismando | null = null;
  loading = true;
  error: string | null = null;
  statusControle: StatusControle = {
    inscricaoId: 0,
    status: '',
    observacao: '',
    dataAtualizacao: new Date()
  };
  statusHistorico: StatusControle[] = [];

  constructor(
    private route: ActivatedRoute,
    private inscricaoService: InscricaoService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.carregarInscricao(id);
      }
    });
  }

  carregarInscricao(id: number) {
    this.loading = true;
    this.error = null;
    
    this.inscricaoService.buscarInscricaoPorId(id).subscribe({
      next: (data: Crismando) => {
        this.inscricao = data;
        this.statusControle.inscricaoId = data.id || 0;
        this.carregarStatus(data.id || 0);
      },
      error: (err: any) => {
        console.error('Erro ao carregar inscrição:', err);
        this.error = 'Erro ao carregar os dados da inscrição. Tente novamente.';
        this.loading = false;
      }
    });
  }

  carregarStatus(id: number) {
    // Carregar status atual
    this.inscricaoService.buscarStatusInscricao(id).subscribe({
      next: (data: StatusControle) => {
        this.statusControle = data;
        this.carregarHistorico(id);
      },
      error: (err: any) => {
        // Se não houver status cadastrado, mantém o padrão
        this.carregarHistorico(id);
      }
    });
  }

  carregarHistorico(id: number) {
    this.inscricaoService.buscarHistoricoStatus(id).subscribe({
      next: (data: StatusControle[]) => {
        this.statusHistorico = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar histórico:', err);
        this.loading = false;
      }
    });
  }

  salvarStatus() {
    if (!this.inscricao?.id) return;
    if (!this.statusControle.status) {
      this.error = 'Por favor, selecione um status.';
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.statusControle.dataAtualizacao = new Date();
    
    this.inscricaoService.atualizarStatusInscricao(this.inscricao.id, this.statusControle).subscribe({
      next: () => {
        // Recarregar o histórico após salvar
        this.carregarHistorico(this.inscricao!.id!);
        this.loading = false;
        // Limpar campos após salvar
        this.statusControle.status = '';
        this.statusControle.observacao = '';
      },
      error: (err: any) => {
        console.error('Erro ao salvar status:', err);
        this.error = 'Erro ao salvar o status. Tente novamente.';
        this.loading = false;
      }
    });
  }

  formatarData(data: Date | string | null): string {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  voltar() {
    window.history.back();
  }
}
