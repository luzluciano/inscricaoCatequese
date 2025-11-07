import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sucesso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sucesso.component.html',
  styleUrl: './sucesso.component.scss'
})
export class SucessoComponent implements OnInit {
  dadosInscricao: any = null;

  constructor(private route: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Só acessar sessionStorage no browser
    if (isPlatformBrowser(this.platformId)) {
      // Recuperar dados da inscrição dos parâmetros da rota ou sessionStorage
      const dadosSession = sessionStorage.getItem('dadosInscricaoSucesso');
      if (dadosSession) {
        this.dadosInscricao = JSON.parse(dadosSession);
        // Limpar dados após uso
        sessionStorage.removeItem('dadosInscricaoSucesso');
      }
    }
  }

  formatarDataHora(data: string): string {
    if (!data) return '';
    return new Date(data).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarTamanho(tamanhoBytes: number): string {
    if (!tamanhoBytes || tamanhoBytes <= 0) return 'Tamanho desconhecido';
    
    const kb = tamanhoBytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else if (kb >= 1) {
      return `${kb.toFixed(0)} KB`;
    } else {
      return `${tamanhoBytes} bytes`;
    }
  }

  imprimirComprovante() {
    // Criar conteúdo para impressão
    const conteudoImpressao = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; margin: 0;">Comprovante de Inscrição - Crisma</h1>
          <h2 style="color: #666; margin: 10px 0;">Comunidade Nossa Senhora Aparecida - Potuvera</h2>
        </div>
        
        <div style="border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Dados da Inscrição</h3>
          <p><strong>Número:</strong> ${this.dadosInscricao?.id || 'N/A'}</p>
          <p><strong>Nome:</strong> ${this.dadosInscricao?.nomeCompleto || 'N/A'}</p>
          <p><strong>E-mail:</strong> ${this.dadosInscricao?.email || 'N/A'}</p>
          <p><strong>Data de Envio:</strong> ${this.formatarDataHora(this.dadosInscricao?.dataEnvio) || 'N/A'}</p>
        </div>
        
        ${this.dadosInscricao?.arquivos ? `
        <div style="border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
          <h3 style="color: #333; margin-top: 0;">Documentos Anexados</h3>
          ${this.dadosInscricao.arquivos.documentoIdentidade ? `<p>🆔 ${this.dadosInscricao.arquivos.documentoIdentidade.nome}</p>` : ''}
          ${this.dadosInscricao.arquivos.certidaoBatismo ? `<p>✝️ ${this.dadosInscricao.arquivos.certidaoBatismo.nome}</p>` : ''}
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #666;">
          <p>Este comprovante confirma que sua inscrição foi recebida com sucesso.</p>
          <p>Guarde este documento para seus registros.</p>
          <p>Data de emissão: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `;

    // Abrir nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprovante de Inscrição - Crisma</title>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${conteudoImpressao}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            };
          </script>
        </body>
        </html>
      `);
      janelaImpressao.document.close();
    }
  }
}