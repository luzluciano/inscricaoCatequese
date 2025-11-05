import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Crismando } from '../model/crismando.model';
import { StatusControle } from '../model/status-controle.model';

@Injectable({
  providedIn: 'root'
})
export class InscricaoService {
  private apiUrl = 'http://localhost:3000/api'; // URL do backend

  constructor(private http: HttpClient) { }

  // Enviar inscrição para o backend
  enviarInscricao(dados: Crismando): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/inscricoes`, dados, { headers });
  }

  // Enviar inscrição com arquivos
  enviarInscricaoComArquivos(dados: Crismando, arquivos: { [key: string]: File | null }): Observable<any> {
    const formData = new FormData();
    
    // Adicionar dados da inscrição como JSON string
    formData.append('dadosInscricao', JSON.stringify(dados));
    
    // Adicionar arquivos se existirem
    if (arquivos['documentoIdentidade']) {
      formData.append('documentoIdentidade', arquivos['documentoIdentidade']);
    }
    
    if (arquivos['certidaoBatismo']) {
      formData.append('certidaoBatismo', arquivos['certidaoBatismo']);
    }

    return this.http.post(`${this.apiUrl}/inscricoes-com-arquivos`, formData);
  }

  // Buscar todas as inscrições
  buscarInscricoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inscricoes`);
  }

  // Upload de arquivo
  uploadArquivo(arquivo: File, campo: string): Observable<any> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('campo', campo);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  // Testar conexão com o backend
  testarConexao(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test`);
  }

  // Verificar se a tabela existe
  verificarTabela(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check-table`);
  }

  // Corrigir campo comunhao
  corrigirComunhao(): Observable<any> {
    return this.http.post(`${this.apiUrl}/fix-comunhao`, {});
  }

  // Consultar inscrições (com filtros opcionais)
  consultarInscricoes(filtros?: any): Observable<Crismando[]> {
    let url = `${this.apiUrl}/inscricoes`;
    
    if (filtros) {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] && filtros[key].trim() !== '') {
          params.append(key, filtros[key]);
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    return this.http.get<Crismando[]>(url);
  }

  // Buscar inscrição por ID
  buscarInscricaoPorId(id: number): Observable<Crismando> {
    return this.http.get<Crismando>(`${this.apiUrl}/inscricoes/${id}`);
  }

  // Atualizar inscrição
  atualizarInscricao(id: number, dados: Crismando): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/inscricoes/${id}`, dados, { headers });
  }

  // Excluir inscrição
  excluirInscricao(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/inscricoes/${id}`);
  }

  // Atualizar status da inscrição
  atualizarStatusInscricao(id: number, statusControle: StatusControle): Observable<any> {
    return this.http.post(`${this.apiUrl}/inscricoes/${id}/status`, statusControle);
  }

  // Buscar status da inscrição
  buscarStatusInscricao(id: number): Observable<StatusControle> {
    return this.http.get<StatusControle>(`${this.apiUrl}/inscricoes/${id}/status`);
  }

  // Buscar histórico de status
  buscarHistoricoStatus(id: number): Observable<StatusControle[]> {
    return this.http.get<StatusControle[]>(`${this.apiUrl}/inscricoes/${id}/status/historico`);
  }
}