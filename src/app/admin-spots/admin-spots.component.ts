import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SpotService } from '../services/spot.service';
import { Spot } from '../model/spot.model';

@Component({
  selector: 'app-admin-spots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './admin-spots.component.html',
  styleUrl: './admin-spots.component.scss'
})
export class AdminSpotsComponent implements OnInit {
  spots: Spot[] = [];
  loading = true;
  error: string | null = null;
  editingSpot: Spot | null = null;
  showAddForm = false;
  
  newSpot: Partial<Spot> = {
    titulo: '',
    subtitulo: '',
    descricao: '',
    icone: '',
    linkTexto: '',
    linkUrl: '',
    ativo: true,
    ordem: 1,
    tipoSpot: 'informacao',
    configuracoes: {
      corFundo: '#f0f0f0',
      corTexto: '#333333',
      mostrarIcone: true,
      mostrarLink: true
    }
  };

  tiposSpot = [
    { value: 'informacao', label: 'Informação', color: '#2196F3' },
    { value: 'acao', label: 'Ação', color: '#4CAF50' },
    { value: 'destaque', label: 'Destaque', color: '#FF9800' },
    { value: 'promocional', label: 'Promocional', color: '#9C27B0' }
  ];

  constructor(private spotService: SpotService) {}

  ngOnInit(): void {
    this.carregarSpots();
  }

  // Getters para os campos do formulário
  get formTitulo(): string {
    return this.editingSpot ? this.editingSpot.titulo : this.newSpot.titulo || '';
  }
  set formTitulo(value: string) {
    if (this.editingSpot) {
      this.editingSpot.titulo = value;
    } else {
      this.newSpot.titulo = value;
    }
  }

  get formSubtitulo(): string {
    return this.editingSpot ? (this.editingSpot.subtitulo || '') : (this.newSpot.subtitulo || '');
  }
  set formSubtitulo(value: string) {
    if (this.editingSpot) {
      this.editingSpot.subtitulo = value;
    } else {
      this.newSpot.subtitulo = value;
    }
  }

  get formDescricao(): string {
    return this.editingSpot ? this.editingSpot.descricao : this.newSpot.descricao || '';
  }
  set formDescricao(value: string) {
    if (this.editingSpot) {
      this.editingSpot.descricao = value;
    } else {
      this.newSpot.descricao = value;
    }
  }

  get formIcone(): string {
    return this.editingSpot ? (this.editingSpot.icone || '') : (this.newSpot.icone || '');
  }
  set formIcone(value: string) {
    if (this.editingSpot) {
      this.editingSpot.icone = value;
    } else {
      this.newSpot.icone = value;
    }
  }

  get formTipoSpot(): string {
    return this.editingSpot ? this.editingSpot.tipoSpot : this.newSpot.tipoSpot || 'informacao';
  }
  set formTipoSpot(value: string) {
    if (this.editingSpot) {
      this.editingSpot.tipoSpot = value as any;
    } else {
      this.newSpot.tipoSpot = value as any;
    }
  }

  get formLinkTexto(): string {
    return this.editingSpot ? (this.editingSpot.linkTexto || '') : (this.newSpot.linkTexto || '');
  }
  set formLinkTexto(value: string) {
    if (this.editingSpot) {
      this.editingSpot.linkTexto = value;
    } else {
      this.newSpot.linkTexto = value;
    }
  }

  get formLinkUrl(): string {
    return this.editingSpot ? (this.editingSpot.linkUrl || '') : (this.newSpot.linkUrl || '');
  }
  set formLinkUrl(value: string) {
    if (this.editingSpot) {
      this.editingSpot.linkUrl = value;
    } else {
      this.newSpot.linkUrl = value;
    }
  }

  get formOrdem(): number {
    return this.editingSpot ? this.editingSpot.ordem : this.newSpot.ordem || 1;
  }
  set formOrdem(value: number) {
    if (this.editingSpot) {
      this.editingSpot.ordem = value;
    } else {
      this.newSpot.ordem = value;
    }
  }

  get formAtivo(): boolean {
    return this.editingSpot ? this.editingSpot.ativo : this.newSpot.ativo !== undefined ? this.newSpot.ativo : true;
  }
  set formAtivo(value: boolean) {
    if (this.editingSpot) {
      this.editingSpot.ativo = value;
    } else {
      this.newSpot.ativo = value;
    }
  }

  get formCorFundo(): string {
    return this.editingSpot ? (this.editingSpot.configuracoes?.corFundo || '#f0f0f0') : (this.newSpot.configuracoes?.corFundo || '#f0f0f0');
  }
  set formCorFundo(value: string) {
    if (this.editingSpot) {
      if (!this.editingSpot.configuracoes) this.editingSpot.configuracoes = {};
      this.editingSpot.configuracoes.corFundo = value;
    } else {
      if (!this.newSpot.configuracoes) this.newSpot.configuracoes = {};
      this.newSpot.configuracoes.corFundo = value;
    }
  }

  get formCorTexto(): string {
    return this.editingSpot ? (this.editingSpot.configuracoes?.corTexto || '#333333') : (this.newSpot.configuracoes?.corTexto || '#333333');
  }
  set formCorTexto(value: string) {
    if (this.editingSpot) {
      if (!this.editingSpot.configuracoes) this.editingSpot.configuracoes = {};
      this.editingSpot.configuracoes.corTexto = value;
    } else {
      if (!this.newSpot.configuracoes) this.newSpot.configuracoes = {};
      this.newSpot.configuracoes.corTexto = value;
    }
  }

  get formMostrarIcone(): boolean {
    return this.editingSpot ? (this.editingSpot.configuracoes?.mostrarIcone !== false) : (this.newSpot.configuracoes?.mostrarIcone !== false);
  }
  set formMostrarIcone(value: boolean) {
    if (this.editingSpot) {
      if (!this.editingSpot.configuracoes) this.editingSpot.configuracoes = {};
      this.editingSpot.configuracoes.mostrarIcone = value;
    } else {
      if (!this.newSpot.configuracoes) this.newSpot.configuracoes = {};
      this.newSpot.configuracoes.mostrarIcone = value;
    }
  }

  get formMostrarLink(): boolean {
    return this.editingSpot ? (this.editingSpot.configuracoes?.mostrarLink !== false) : (this.newSpot.configuracoes?.mostrarLink !== false);
  }
  set formMostrarLink(value: boolean) {
    if (this.editingSpot) {
      if (!this.editingSpot.configuracoes) this.editingSpot.configuracoes = {};
      this.editingSpot.configuracoes.mostrarLink = value;
    } else {
      if (!this.newSpot.configuracoes) this.newSpot.configuracoes = {};
      this.newSpot.configuracoes.mostrarLink = value;
    }
  }

  carregarSpots(): void {
    this.loading = true;
    this.error = null;

    this.spotService.buscarTodosSpots().subscribe({
      next: (response) => {
        if (response.success) {
          // Normalizar os dados para garantir compatibilidade com ambos os formatos (camelCase e snake_case)
          const spotsNormalizados = response.data.map((spot: any) => ({
            ...spot,
            linkTexto: spot.linkTexto || spot.link_texto || '',
            linkUrl: spot.linkUrl || spot.link_url || '',
            tipoSpot: spot.tipoSpot || spot.tipo_spot,
            ativo: spot.ativo !== undefined ? spot.ativo : true
          }));
          
          this.spots = spotsNormalizados.sort((a, b) => a.ordem - b.ordem);
          console.log('🎯 Spots admin normalizados:', spotsNormalizados);
        } else {
          this.error = response.message || 'Erro ao carregar spots';
        }
        this.loading = false;
      },
      error: (err) => {
        // Fallback para dados mock
        this.spotService.getMockSpots().subscribe({
          next: (mockResponse) => {
            if (mockResponse.success) {
              this.spots = mockResponse.data.sort((a, b) => a.ordem - b.ordem);
            }
            this.loading = false;
          },
          error: () => {
            this.error = 'Erro ao carregar spots';
            this.loading = false;
          }
        });
      }
    });
  }

  criarSpot(): void {
    if (!this.newSpot.titulo || !this.newSpot.descricao) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    this.spotService.criarSpot(this.newSpot as Omit<Spot, 'id' | 'dataCriacao' | 'dataAtualizacao'>).subscribe({
      next: (response) => {
        if (response.success) {
          this.carregarSpots();
          this.resetarFormulario();
          alert('Spot criado com sucesso!');
        } else {
          alert(response.message || 'Erro ao criar spot');
        }
      },
      error: (err) => {
        console.error('Erro ao criar spot:', err);
        alert('Erro ao criar spot');
      }
    });
  }

  editarSpot(spot: Spot): void {
    this.editingSpot = {
      ...spot,
      configuracoes: spot.configuracoes ? { ...spot.configuracoes } : {}
    };
    this.showAddForm = false;
    console.log('Editando spot:', this.editingSpot);
  }

  salvarEdicao(): void {
    if (!this.editingSpot) return;

    console.log('Salvando edição do spot:', this.editingSpot);
    console.log('🔗 linkUrl a ser enviado:', this.editingSpot.linkUrl);
    console.log('📝 linkTexto a ser enviado:', this.editingSpot.linkTexto);
    console.log('🏷️ tipoSpot a ser enviado:', this.editingSpot.tipoSpot);

    this.spotService.atualizarSpot(this.editingSpot.id, this.editingSpot).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        if (response.success) {
          this.carregarSpots();
          this.editingSpot = null;
          alert('Spot atualizado com sucesso!');
        } else {
          alert(response.message || 'Erro ao atualizar spot');
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar spot:', err);
        alert('Erro ao atualizar spot');
      }
    });
  }

  cancelarEdicao(): void {
    this.editingSpot = null;
  }

  deletarSpot(spot: Spot): void {
    if (!confirm(`Tem certeza que deseja deletar o spot "${spot.titulo}"?`)) {
      return;
    }

    this.spotService.deletarSpot(spot.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.carregarSpots();
          alert('Spot deletado com sucesso!');
        } else {
          alert(response.message || 'Erro ao deletar spot');
        }
      },
      error: (err) => {
        console.error('Erro ao deletar spot:', err);
        alert('Erro ao deletar spot');
      }
    });
  }

  toggleStatus(spot: Spot): void {
    this.spotService.toggleStatusSpot(spot.id, !spot.ativo).subscribe({
      next: (response) => {
        if (response.success) {
          this.carregarSpots();
          alert(`Spot ${!spot.ativo ? 'ativado' : 'desativado'} com sucesso!`);
        } else {
          alert(response.message || 'Erro ao alterar status');
        }
      },
      error: (err) => {
        console.error('Erro ao alterar status:', err);
        alert('Erro ao alterar status');
      }
    });
  }

  moverSpot(spot: Spot, direcao: 'up' | 'down'): void {
    const index = this.spots.findIndex(s => s.id === spot.id);
    if (index === -1) return;

    const novaOrdem = direcao === 'up' ? spot.ordem - 1 : spot.ordem + 1;
    const spotParaTroca = this.spots.find(s => s.ordem === novaOrdem);

    if (!spotParaTroca) return;

    const spotsParaReordenar = [
      { id: spot.id, ordem: novaOrdem },
      { id: spotParaTroca.id, ordem: spot.ordem }
    ];

    this.spotService.reordenarSpots(spotsParaReordenar).subscribe({
      next: (response) => {
        if (response.success) {
          this.carregarSpots();
        } else {
          alert(response.message || 'Erro ao reordenar spots');
        }
      },
      error: (err) => {
        console.error('Erro ao reordenar spots:', err);
        alert('Erro ao reordenar spots');
      }
    });
  }

  mostrarFormularioAdicionar(): void {
    console.log('🆕 Mostrar formulário de adição');
    this.showAddForm = true;
    this.editingSpot = null;
    this.resetarFormulario();
    console.log('📝 showAddForm:', this.showAddForm);
  }

  resetarFormulario(): void {
    console.log('🔄 Resetando formulário');
    this.newSpot = {
      titulo: '',
      subtitulo: '',
      descricao: '',
      icone: '',
      linkTexto: '',
      linkUrl: '',
      ativo: true,
      ordem: Math.max(...this.spots.map(s => s.ordem), 0) + 1,
      tipoSpot: 'informacao',
      configuracoes: {
        corFundo: '#f0f0f0',
        corTexto: '#333333',
        mostrarIcone: true,
        mostrarLink: true
      }
    };
    // NÃO resetar showAddForm aqui quando chamado de mostrarFormularioAdicionar()
  }

  cancelarAdicao(): void {
    console.log('❌ Cancelar adição');
    this.showAddForm = false;
    this.resetarFormulario();
  }

  getStatusLabel(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  getStatusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }

  getTipoLabel(tipo: string): string {
    const tipoObj = this.tiposSpot.find(t => t.value === tipo);
    return tipoObj?.label || tipo;
  }

  onTipoChange(tipo: string, isNewSpot: boolean = false): void {
    const tipoObj = this.tiposSpot.find(t => t.value === tipo);
    if (tipoObj) {
      this.formCorFundo = tipoObj.color;
    }
  }

  trackBySpotId(index: number, spot: Spot): number {
    return spot.id;
  }
}