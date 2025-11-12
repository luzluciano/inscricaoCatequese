import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginResponse } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Redirecionar se já estiver autenticado
    if (this.authService.isAuthenticated()) {
      this.redirectUser();
      return;
    }

    this.loginForm = this.formBuilder.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      senha: ['', [Validators.required, Validators.minLength(4)]]
    });

    // Obter URL de retorno dos query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    console.log('LoginComponent.onSubmit chamado');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form value:', this.loginForm.value);
    
    if (this.loginForm.invalid) {
      console.log('Form inválido - não executando login');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { usuario, senha } = this.loginForm.value;
    console.log('Executando login com:', { usuario, senha });

    this.authService.login(usuario, senha).subscribe({
      next: (response: LoginResponse) => {
        console.log('Resposta do login:', response);
        this.loading = false;
        if (response.success) {
          console.log('Login bem-sucedido - redirecionando...');
          this.redirectUser();
        } else {
          console.log('Login falhou:', response.message);
          this.errorMessage = response.message || 'Erro no login';
        }
      },
      error: (error: any) => {
        console.error('Erro no login:', error);
        this.loading = false;
        this.errorMessage = 'Erro de conexão. Tente novamente.';
      }
    });
  }

  private redirectUser(): void {
    // Redirecionar baseado nas permissões do usuário
    if (this.authService.hasPermission('sistema.configurar')) {
      this.router.navigate(['/admin']);
    } else if (this.authService.hasPermission('inscricoes.criar')) {
      this.router.navigate(['/inscricao']);
    } else if (this.authService.hasPermission('inscricoes.consultar')) {
      this.router.navigate(['/consulta']);
    } else {
      this.router.navigate(['/homeFixa']);
    }
  }

  // Métodos auxiliares para validação do formulário
  get usuario() { return this.loginForm.get('usuario'); }
  get senha() { return this.loginForm.get('senha'); }
}