import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoggedIn = false;
  showInscricoesDropdown = false;
  showAdminDropdown = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });

    // Fechar dropdowns quando clicar fora (apenas no browser)
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.nav-dropdown')) {
          this.showInscricoesDropdown = false;
          this.showAdminDropdown = false;
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleInscricoesDropdown() {
    this.showInscricoesDropdown = !this.showInscricoesDropdown;
    this.showAdminDropdown = false; // Fechar outros dropdowns
  }

  toggleAdminDropdown() {
    this.showAdminDropdown = !this.showAdminDropdown;
    this.showInscricoesDropdown = false; // Fechar outros dropdowns
  }

  closeDropdowns() {
    this.showInscricoesDropdown = false;
    this.showAdminDropdown = false;
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}