import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SpotService } from '../services/spot.service';
import { Spot } from '../model/spot.model';

@Component({
  selector: 'app-home2',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home2.component.html',
  styleUrl: './home2.component.scss'
})
export class Home2Component implements OnInit {
  spots: Spot[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private spotService: SpotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🏠 Home2Component inicializado');
    this.carregarSpots();
  }

  carregarSpots(): void {
    console.log('🔄 Iniciando carregamento de spots...');
    this.loading = true;
    this.error = null;

    // Usar API real - trocar para this.spotService.buscarSpotsAtivos() quando o backend estiver integrado
    console.log('📡 Chamando spotService.buscarSpotsAtivos()...');
    this.spotService.buscarSpotsAtivos().subscribe({
      next: (response) => {
        console.log('✅ Resposta recebida:', response);
        if (response.success) {
          // Normalizar os dados para garantir compatibilidade com ambos os formatos (camelCase e snake_case)
          const spotsNormalizados = response.data.map((spot: any) => ({
            ...spot,
            linkTexto: spot.linkTexto || spot.link_texto,
            linkUrl: spot.linkUrl || spot.link_url,
            tipoSpot: spot.tipoSpot || spot.tipo_spot,
            ativo: spot.ativo !== undefined ? spot.ativo : (spot.active !== undefined ? spot.active : true) // Preservar o valor original do backend
          }));
          
          this.spots = spotsNormalizados.filter((spot: any) => spot.ativo).sort((a: any, b: any) => a.ordem - b.ordem);
          console.log('🎯 Spots normalizados:', spotsNormalizados);
          console.log('🎯 Spots filtrados (ativos):', this.spots);
        } else {
          this.error = response.message || 'Erro ao carregar spots';
          console.error('❌ Erro na resposta:', this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        // Fallback para dados mock em caso de erro da API
        console.warn('⚠️ Erro na API, usando dados mock:', err);
        this.spotService.getMockSpots().subscribe({
          next: (mockResponse) => {
            console.log('🔄 Usando dados mock:', mockResponse);
            if (mockResponse.success) {
              this.spots = mockResponse.data.filter(spot => spot.ativo).sort((a, b) => a.ordem - b.ordem);
              console.log('🎯 Mock spots carregados:', this.spots);
            }
            this.loading = false;
          },
          error: () => {
            this.error = 'Erro ao carregar conteúdo da página';
            this.loading = false;
            console.error('❌ Erro total no carregamento');
          }
        });
      }
    });
  }

  onSpotClick(spot: Spot): void {
    if (spot.linkUrl) {
      if (spot.linkUrl.startsWith('http')) {
        // Link externo
        window.open(spot.linkUrl, '_blank');
      } else {
        // Rota interna
        this.router.navigate([spot.linkUrl]);
      }
    }
  }

  getSpotIcon(spot: Spot): string {
    return spot.icone || '📍';
  }

  getSpotBackgroundColor(spot: Spot): string {
    return spot.configuracoes?.corFundo || '#f0f0f0';
  }

  getSpotTextColor(spot: Spot): string {
    return spot.configuracoes?.corTexto || '#333333';
  }

  shouldShowIcon(spot: Spot): boolean {
    return spot.configuracoes?.mostrarIcone !== false;
  }

  shouldShowLink(spot: Spot): boolean {
    return spot.configuracoes?.mostrarLink !== false && !!spot.linkUrl;
  }

  getSpotTypeClass(spot: Spot): string {
    return `spot-${spot.tipoSpot}`;
  }

  getSpotLayoutClass(spot: Spot): string {
    return spot.ordem === 1 ? 'spot-full-width' : 'spot-normal';
  }

  trackBySpotId(index: number, spot: Spot): number {
    return spot.id;
  }
}