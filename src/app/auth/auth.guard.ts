import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (this.authService.isAuthenticated()) {
      // Verificar se há permissões específicas exigidas
      const requiredPermissions = route.data?.['permissions'] as string[];
      const requiredGroups = route.data?.['groups'] as string[];
      
      if (requiredPermissions) {
        const hasPermission = this.authService.hasAllPermissions(requiredPermissions);
        if (!hasPermission) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }

      if (requiredGroups) {
        const belongsToGroup = requiredGroups.some(group => 
          this.authService.belongsToGroup(group)
        );
        if (!belongsToGroup) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }

      return true;
    }

    // Não autenticado - redirecionar para login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    const requiredPermissions = route.data?.['permissions'] as string[];
    
    if (!requiredPermissions) {
      return true; // Sem permissões específicas exigidas
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const hasPermission = this.authService.hasAllPermissions(requiredPermissions);
    
    if (!hasPermission) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}