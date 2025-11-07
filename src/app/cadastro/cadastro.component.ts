import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent implements OnInit {
  cadastroForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cadastroForm = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      senha: ['', [Validators.required, Validators.minLength(4)]],
      confirmarSenha: ['', [Validators.required]],
      email: ['', [Validators.email]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const senha = form.get('senha');
    const confirmarSenha = form.get('confirmarSenha');
    
    if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
      confirmarSenha.setErrors({ passwordMismatch: true });
    } else {
      const errors = confirmarSenha?.errors;
      if (errors && errors['passwordMismatch']) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmarSenha.setErrors(null);
        }
      }
    }
    return null;
  }

  get nome() { return this.cadastroForm.get('nome'); }
  get usuario() { return this.cadastroForm.get('usuario'); }
  get senha() { return this.cadastroForm.get('senha'); }
  get confirmarSenha() { return this.cadastroForm.get('confirmarSenha'); }
  get email() { return this.cadastroForm.get('email'); }

  onSubmit(): void {
    if (this.cadastroForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { confirmarSenha, ...userData } = this.cadastroForm.value;

    this.http.post(`${environment.apiUrl}/api/usuarios`, userData)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = 'Cadastro realizado com sucesso! Você pode fazer login agora.';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = response.message || 'Erro ao criar cadastro';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Erro no cadastro:', error);
          this.errorMessage = error.error?.message || 'Erro ao conectar com o servidor';
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.cadastroForm.controls).forEach(key => {
      const control = this.cadastroForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}