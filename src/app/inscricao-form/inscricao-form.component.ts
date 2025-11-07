import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InscricaoService } from '../services/inscricao.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-inscricao-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './inscricao-form.component.html',
  styleUrl: './inscricao-form.component.scss'
})
export class InscricaoFormComponent implements OnInit {
  formulario!: FormGroup;
  arquivos: {
    documentoIdentidade: File | null;
    certidaoBatismo: File | null;
    [key: string]: File | null;
  } = {
    documentoIdentidade: null,
    certidaoBatismo: null
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private inscricaoService: InscricaoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.formulario = this.fb.group({
      // Tipo de inscrição (obrigatório)
      tipoInscricao: ['', Validators.required],
      // Informações básicas (obrigatórias)
      email: ['', [Validators.required, Validators.email]],
      nomeCompleto: ['', Validators.required],
      dataNascimento: ['', Validators.required],
      naturalidade: ['', Validators.required],
      sexo: ['', Validators.required],
      endereco: ['', Validators.required],
      
      // Informações sacramentais
      batizado: [false],
      paroquiaBatismo: [''],
      dioceseBatismo: [''],
      comunhao: [''],
      paroquiaComunhao: [''],
      dioceseComunhao: [''],
      
      // Contato (obrigatórios)
      telefoneWhatsApp: ['', Validators.required],
      emailContato: ['', [Validators.required, Validators.email]],
      
      // Dados dos pais
      nomePai: [''],
      estadoCivilPai: [''],
      naturalidadePai: [''],
      nomeMae: [''],
      estadoCivilMae: [''],
      naturalidadeMae: [''],
      paisCasadosIgreja: [''],
      paroquiaCasamentoPais: [''],
      dioceseCasamentoPais: [''],
      
      // Padrinho/Madrinha
      nomePadrinhoMadrinha: [''],
      padrinhoCrismado: [false],
      
      // Curso preparatório (obrigatórios)
      dataInicioCurso: ['', Validators.required],
      comunidadeCurso: ['', Validators.required],
      nomeCatequista: ['', Validators.required],
      horarioCurso: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.formulario.valid && this.validarArquivosObrigatorios()) {
      console.log('📋 Dados do formulário:', this.formulario.value);
      console.log('📄 Arquivos selecionados:', this.arquivos);
      
      // Converter dados para formato do banco antes de enviar
      const dadosFormatados = this.formatarDadosParaBackend(this.formulario.value);
      console.log('📋 Dados formatados para backend:', dadosFormatados);
      
      // Enviar dados com arquivos para o backend
      this.inscricaoService.enviarInscricaoComArquivos(dadosFormatados, this.arquivos).subscribe({
        next: (response: any) => {
          console.log('✅ Inscrição criada com sucesso:', response);
          
          // Preparar dados para a página de sucesso
          const dadosParaSucesso = {
            ...response.data,
            nomeCompleto: this.formulario.value.nomeCompleto,
            email: this.formulario.value.email,
            dataEnvio: new Date().toISOString(),
            arquivos: response.data.arquivos || {}
          };
          
          // Salvar dados no sessionStorage para a página de sucesso
          sessionStorage.setItem('dadosInscricaoSucesso', JSON.stringify(dadosParaSucesso));
          
          // Mostrar informações dos arquivos salvos no console
          if (response.data.arquivos) {
            console.log('📎 Arquivos salvos:', response.data.arquivos);
          }
          
          // Limpar formulário
          this.formulario.reset();
          this.arquivos = {
            documentoIdentidade: null,
            certidaoBatismo: null
          };
          
          // Limpar campos de arquivo no HTML
          const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
          fileInputs.forEach(input => {
            input.value = '';
          });

          // Navegar para página de sucesso
          this.router.navigate(['/sucesso']);
        },
        error: (error: any) => {
          console.error('❌ Erro ao criar inscrição:', error);
          alert('❌ Erro ao enviar inscrição. Verifique se todos os documentos foram anexados e tente novamente.');
        }
      });
    } else if (!this.formulario.valid) {
      console.log('❌ Formulário inválido');
      alert('⚠️ Por favor, preencha todos os campos obrigatórios.');
    }
  }

  testarConexao() {
    this.http.get(`${environment.apiUrl}/test`).subscribe({
      next: (response) => {
        console.log('✅ Conexão OK:', response);
        alert('✅ Conexão com o backend funcionando!');
      },
      error: (error) => {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro de conexão com o backend!');
      }
    });
  }

  checkFormStatus() {
    console.log('📊 Status do formulário:');
    console.log('- Válido:', this.formulario.valid);
    console.log('- Inválido:', this.formulario.invalid);
    console.log('- Valores:', this.formulario.value);
    console.log('- Erros:', this.getFormErrors());
    
    alert(`📊 Formulário ${this.formulario.valid ? 'VÁLIDO' : 'INVÁLIDO'}\nVeja o console para detalhes.`);
  }

  corrigirComunhao() {
    this.http.post(`${environment.apiUrl}/fix-comunhao`, {}).subscribe({
      next: (response) => {
        console.log('✅ Correção aplicada:', response);
        alert('✅ Correção da base de dados aplicada!');
      },
      error: (error) => {
        console.error('❌ Erro na correção:', error);
        alert('❌ Erro ao aplicar correção!');
      }
    });
  }

  private formatarDadosParaBackend(dados: any): any {
    // Converter campos que precisam de tratamento especial
    const dadosFormatados = { ...dados };
    
    // Converter comunhao: "Sim"/"Não" -> true/false/null
    if (dadosFormatados.comunhao === 'Sim') {
      dadosFormatados.comunhao = true;
    } else if (dadosFormatados.comunhao === 'Não') {
      dadosFormatados.comunhao = false;
    } else {
      dadosFormatados.comunhao = null;
    }
    
    // Converter paisCasadosIgreja: string -> boolean
    if (dadosFormatados.paisCasadosIgreja === 'true') {
      dadosFormatados.paisCasadosIgreja = true;
    } else if (dadosFormatados.paisCasadosIgreja === 'false') {
      dadosFormatados.paisCasadosIgreja = false;
    } else {
      dadosFormatados.paisCasadosIgreja = null;
    }
    
    // Garantir que campos booleanos estejam corretos
    dadosFormatados.batizado = Boolean(dadosFormatados.batizado);
    dadosFormatados.padrinhoCrismado = Boolean(dadosFormatados.padrinhoCrismado);
    
    // Limpar campos vazios (converter para null se necessário)
    Object.keys(dadosFormatados).forEach(key => {
      if (dadosFormatados[key] === '') {
        dadosFormatados[key] = null;
      }
    });
    
    console.log('🔄 Conversão de dados:');
    console.log('- comunhao:', dados.comunhao, '->', dadosFormatados.comunhao);
    console.log('- paisCasadosIgreja:', dados.paisCasadosIgreja, '->', dadosFormatados.paisCasadosIgreja);
    console.log('- batizado:', dados.batizado, '->', dadosFormatados.batizado);
    console.log('- padrinhoCrismado:', dados.padrinhoCrismado, '->', dadosFormatados.padrinhoCrismado);
    
    return dadosFormatados;
  }

  private getFormErrors(): any {
    let errors: any = {};
    Object.keys(this.formulario.controls).forEach(key => {
      const controlErrors = this.formulario.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  onFileSelect(event: any, tipoArquivo: string) {
    const file = event.target.files[0];
    
    if (file) {
      // Validar tamanho do arquivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB em bytes
      if (file.size > maxSize) {
        alert('❌ Arquivo muito grande! O tamanho máximo é de 10MB.');
        event.target.value = '';
        return;
      }

      // Validar tipo do arquivo
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('❌ Tipo de arquivo não permitido! Use apenas PDF, JPG ou PNG.');
        event.target.value = '';
        return;
      }

      // Armazenar o arquivo
      this.arquivos[tipoArquivo] = file;
      console.log(`📄 Arquivo ${tipoArquivo} selecionado:`, file.name);
    }
  }

  removerArquivo(tipoArquivo: string) {
    this.arquivos[tipoArquivo] = null;
    // Limpar o input file correspondente
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      if (input.getAttribute('data-type') === tipoArquivo) {
        input.value = '';
      }
    });
    console.log(`🗑️ Arquivo ${tipoArquivo} removido`);
  }

  private validarArquivosObrigatorios(): boolean {
    const arquivosObrigatorios = ['documentoIdentidade', 'certidaoBatismo'];
    
    for (const tipo of arquivosObrigatorios) {
      if (!this.arquivos[tipo]) {
        alert(`❌ Por favor, envie o arquivo: ${tipo === 'documentoIdentidade' ? 'Cópia do RG/CPF' : 'Certidão de Batismo'}`);
        return false;
      }
    }
    
    return true;
  }
}