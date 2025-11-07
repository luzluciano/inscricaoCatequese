import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface para trabalhar com cookies
interface CookieService {
  set(name: string, value: string, days?: number): void;
  get(name: string): string | null;
  delete(name: string): void;
}

export interface User {
  id: number;
  nome: string;
  usuario: string;
  email?: string;
  permissions: string[];
  grupos?: string[];
  grupo?: string;
  ativo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    usuario: User;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CookieService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  // ====== MÉTODOS DE COOKIE ======

  /**
   * Definir cookie
   */
  set(name: string, value: string, days: number = 7): void {
    if (!this.isBrowser()) return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const expiresString = expires.toUTCString();
    
    document.cookie = `${name}=${value};expires=${expiresString};path=/;secure;samesite=strict`;
  }

  /**
   * Obter cookie
   */
  get(name: string): string | null {
    if (!this.isBrowser()) return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Deletar cookie
   */
  delete(name: string): void {
    if (!this.isBrowser()) return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Verificar se está executando no browser (não no servidor)
   */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Realizar login do usuário (chamada para servidor)
   */
  login(usuario: string, senha: string): Observable<LoginResponse> {
    console.log('AuthService.login chamado com:', { usuario, senha });
    
    const loginData = {
      usuario: usuario,
      senha: senha
    };

    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Resposta do servidor:', response);
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.usuario);
          }
        }),
        catchError(error => {
          console.error('Erro no login:', error);
          return of({ 
            success: false, 
            message: error.error?.message || 'Erro de conexão com o servidor' 
          });
        })
      );
  }

  /**
   * Realizar logout do usuário (incluindo chamada para servidor)
   */
  logout(): void {
    const token = this.getToken();
    
    // Chamar endpoint de logout no servidor se houver token
    if (token && this.isBrowser()) {
      this.http.post(`${environment.apiUrl}/api/logout`, {})
        .subscribe({
          next: () => console.log('Logout realizado no servidor'),
          error: (error) => console.warn('Erro ao fazer logout no servidor:', error)
        });
    }

    // Limpar dados locais e cookies
    if (this.isBrowser()) {
      localStorage.removeItem(this.userKey);
      this.delete(this.tokenKey); // Remover cookie do token
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Obter o usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obter o token atual (do cookie)
   */
  getToken(): string | null {
    console.log('🍪 AuthService.getToken() chamado');
    console.log('🍪 isBrowser():', this.isBrowser());
    console.log('🍪 document.cookie completo:', this.isBrowser() ? document.cookie : 'N/A (SSR)');
    
    const token = this.get(this.tokenKey);
    console.log('🍪 Token obtido do cookie:', token);
    return token;
  }

  /**
   * Verificar se o usuário tem uma permissão específica
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    console.log('Checking permission:', permission, 'for user:', user);
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Verificar se o usuário tem qualquer uma das permissões fornecidas
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verificar se o usuário tem todas as permissões fornecidas
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Verificar se o usuário pertence a um grupo específico
   */
  belongsToGroup(group: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.grupos) return false;
    return user.grupos.includes(group);
  }

  /**
   * Definir sessão do usuário (salvar token em cookie)
   */
  private setSession(token: string, user: User): void {
    console.log('Salvando token em cookie:', token);
    
    // Salvar token em cookie (7 dias)
    this.set(this.tokenKey, token, 7);
    
    // Salvar dados do usuário no localStorage
    if (this.isBrowser()) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Obter usuário do storage
   */
  private getUserFromStorage(): User | null {
    if (!this.isBrowser()) return null;
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Verificar se tem token válido (do cookie)
   */
  private hasValidToken(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.get(this.tokenKey);
    const user = localStorage.getItem(this.userKey);
    return !!(token && user);
  }

  /**
   * Atualizar perfil do usuário (chamada para servidor)
   */
  updateProfile(userData: Partial<User>): Observable<any> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, message: 'Usuário não autenticado' });
    }

    return this.http.put(`${environment.apiUrl}/api/profile`, userData)
      .pipe(
        tap((response: any) => {
          if (response.success && response.data) {
            const updatedUser = { ...currentUser, ...response.data };
            if (this.isBrowser()) {
              localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
            }
            this.currentUserSubject.next(updatedUser);
          }
        }),
        catchError(error => {
          console.error('Erro ao atualizar perfil:', error);
          return of({ 
            success: false, 
            message: error.error?.message || 'Erro ao atualizar perfil' 
          });
        })
      );
  }

  /**
   * Alterar senha do usuário (chamada para servidor)
   */
  changePassword(senhaAtual: string, novaSenha: string): Observable<any> {
    const passwordData = {
      senhaAtual: senhaAtual,
      novaSenha: novaSenha
    };

    return this.http.post(`${environment.apiUrl}/api/change-password`, passwordData)
      .pipe(
        catchError(error => {
          console.error('Erro ao alterar senha:', error);
          return of({
            success: false,
            message: error.error?.message || 'Erro ao alterar senha'
          });
        })
      );
  }

  /**
   * Obter lista de usuários (chamada para servidor)
   */
  getUsers(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/users`)
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar usuários:', error);
          return of({
            success: false,
            message: error.error?.message || 'Erro ao buscar usuários'
          });
        })
      );
  }

  /**
   * Verificar validade do token no servidor
   */
  verifyToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return of({ valid: false, message: 'Token não encontrado' });
    }

    return this.http.get(`${environment.apiUrl}/api/verify`)
      .pipe(
        tap((response: any) => {
          if (!response.valid) {
            this.logout();
          }
        }),
        catchError(error => {
          console.error('Erro na verificação do token:', error);
          this.logout();
          return of({ valid: false });
        })
      );
  }

  /**
   * Fazer chamada HTTP autenticada
   */
  fetchWithAuth<T>(url: string, options: any = {}): Observable<T> {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const method = options.method || 'GET';
    const fullUrl = url.startsWith('http') ? url : `${environment.apiUrl}${url}`;

    switch (method.toUpperCase()) {
      case 'POST':
        return this.http.post<T>(fullUrl, options.body, { headers });
      case 'PUT':
        return this.http.put<T>(fullUrl, options.body, { headers });
      case 'DELETE':
        return this.http.delete<T>(fullUrl, { headers });
      default:
        return this.http.get<T>(fullUrl, { headers });
    }
  }

  /**
   * Atualizar dados do usuário atual
   */
  updateCurrentUser(user: User): void {
    if (!this.isBrowser()) return;
    
    // Atualizar no localStorage
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    // Atualizar o subject
    this.currentUserSubject.next(user);
  }
}