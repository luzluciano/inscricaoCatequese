import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Spot, SpotResponse } from '../model/spot.model';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SpotService {
  private apiUrl = environment.apiUrl + '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Helper method to get headers with authentication
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    try {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.warn('Erro ao obter token para autenticação:', error);
    }
    
    return headers;
  }

  // Buscar spots ativos para exibição (público - sem autenticação)
  buscarSpotsAtivos(): Observable<SpotResponse> {
    return this.http.get<SpotResponse>(`${this.apiUrl}/spots/ativos`);
  }

  // Buscar todos os spots (admin)
  buscarTodosSpots(): Observable<SpotResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<SpotResponse>(`${this.apiUrl}/spots/admin`, { headers });
  }

  // Buscar spot por ID (admin)
  buscarSpotPorId(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/spots/admin/${id}`, { headers });
  }

  // Criar novo spot
  criarSpot(spot: Omit<Spot, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/spots/admin`, spot, { headers });
  }

  // Atualizar spot existente
  atualizarSpot(id: number, spot: Partial<Spot>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/spots/admin/${id}`, spot, { headers });
  }

  // Deletar spot
  deletarSpot(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/spots/admin/${id}`, { headers });
  }

  // Ativar/Desativar spot
  toggleStatusSpot(id: number, ativo: boolean): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/spots/admin/${id}/status`, { ativo }, { headers });
  }

  // Reordenar spots
  reordenarSpots(spots: { id: number; ordem: number }[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/spots/admin/reordenar`, { spots }, { headers });
  }

  // Dados mock para desenvolvimento/teste (remover quando a API estiver pronta)
  getMockSpots(): Observable<SpotResponse> {
    const mockSpots: Spot[] = [
      {
        id: 1,
        titulo: "Nova Inscrição",
        subtitulo: "Crisma 2024",
        descricao: "Cadastre-se agora para o Sacramento da Crisma. Vagas limitadas!",
        icone: "📝",
        linkTexto: "Inscrever-se",
        linkUrl: "/inscricao",
        ativo: true,
        ordem: 1,
        tipoSpot: "acao",
        configuracoes: {
          corFundo: "#4CAF50",
          corTexto: "#ffffff",
          mostrarIcone: true,
          mostrarLink: true
        },
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      {
        id: 2,
        titulo: "Consultar Inscrições",
        subtitulo: "Área do Candidato",
        descricao: "Acompanhe o status da sua inscrição e documentos pendentes.",
        icone: "🔍",
        linkTexto: "Consultar",
        linkUrl: "/consulta",
        ativo: true,
        ordem: 2,
        tipoSpot: "informacao",
        configuracoes: {
          corFundo: "#2196F3",
          corTexto: "#ffffff",
          mostrarIcone: true,
          mostrarLink: true
        },
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      {
        id: 3,
        titulo: "Cronograma de Preparação",
        subtitulo: "Próximas Atividades",
        descricao: "Confira as datas dos retiros, encontros e celebrações preparatórias.",
        icone: "📅",
        linkTexto: "Ver Cronograma",
        linkUrl: "/cronograma",
        ativo: true,
        ordem: 3,
        tipoSpot: "destaque",
        configuracoes: {
          corFundo: "#FF9800",
          corTexto: "#ffffff",
          mostrarIcone: true,
          mostrarLink: true
        },
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      {
        id: 4,
        titulo: "Comunidade Nossa Senhora Aparecida",
        subtitulo: "Potuvera",
        descricao: "Conheça nossa comunidade e participe de nossas atividades pastorais.",
        icone: "⛪",
        linkTexto: "Saiba Mais",
        linkUrl: "/comunidade",
        ativo: true,
        ordem: 4,
        tipoSpot: "promocional",
        configuracoes: {
          corFundo: "#9C27B0",
          corTexto: "#ffffff",
          mostrarIcone: true,
          mostrarLink: true
        },
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      }
    ];

    return of({
      success: true,
      data: mockSpots
    });
  }
}