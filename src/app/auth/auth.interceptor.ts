import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 Interceptando requisição:', req.url);
  
  // Lista de rotas públicas que não precisam de autorização
  const publicRoutes = [
    '/api/login'
  ];
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
  // Para /api/usuarios, só adicionar auth se for uma operação que não seja POST (cadastro público)
  const isUserCreation = req.url.includes('/api/usuarios') && req.method === 'POST' && !authService.getToken();
  
  if (isPublicRoute || isUserCreation) {
    console.log('🌐 Rota pública detectada, não adicionando Authorization header');
    return next(req);
  }
  
  // Obter token do cookie via AuthService
  const token = authService.getToken();
  console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
  console.log('🔑 Token valor:', token);
  
  let authReq = req;
  
  // Adicionar token de autenticação se disponível
  if (token) {
    authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token adicionado ao header Authorization');
  } else {
    console.log('❌ Nenhum token encontrado - header Authorization não adicionado');
  }
  
  return next(authReq).pipe(
    catchError(error => {
      console.error('❌ Erro na requisição:', error);
      
      // Se token expirado ou não autorizado, fazer logout automático
      if (error.status === 401 || error.status === 403) {
        console.log('🔓 Token inválido/expirado - fazendo logout automático');
        authService.logout();
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};