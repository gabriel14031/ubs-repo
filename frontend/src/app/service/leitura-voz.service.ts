import { Injectable, signal } from '@angular/core';
import { Agendamento } from '../model/agendamento.model';
import { Fila } from '../util/fila';

/**
 * Text-to-speech (leitura em voz alta) usando a Web Speech API do navegador
 * (window.speechSynthesis). Não depende de backend nem de biblioteca externa.
 *
 * Estrutura de dados: FILA (FIFO). Cada texto pedido para leitura entra no fim
 * da fila; quando uma fala termina (evento `onend`), o próximo texto sai do
 * início da fila. Assim, vários pedidos seguidos são lidos na ordem em que
 * foram feitos, sem que um corte o outro.
 */
@Injectable({ providedIn: 'root' })
export class LeituraVozService {
  private readonly fila = new Fila<string>();
  private readonly _falando = signal(false);
  private readonly _pendentes = signal(0);

  // Mantém referência à fala atual: em alguns navegadores (Chrome) o objeto pode
  // ser coletado pelo garbage collector antes do `onend` disparar.
  private falaAtual: SpeechSynthesisUtterance | null = null;

  /** true enquanto alguma fala está em andamento. */
  readonly falando = this._falando.asReadonly();

  /** Quantos textos ainda aguardam na fila (sem contar o que está sendo lido). */
  readonly pendentes = this._pendentes.asReadonly();

  /** false em navegadores sem suporte à síntese de voz. */
  readonly suportado: boolean =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  /** Adiciona um texto ao fim da fila e inicia a leitura se estiver parado. */
  enfileirar(texto: string): void {
    if (!this.suportado || !texto.trim()) {
      return;
    }
    this.fila.enfileirar(texto);
    this._pendentes.set(this.fila.tamanho);

    if (!this._falando()) {
      this.lerProximo();
    }
  }

  /** Adiciona vários textos, preservando a ordem recebida. */
  enfileirarVarios(textos: string[]): void {
    textos.forEach(texto => this.enfileirar(texto));
  }

  /** Interrompe a fala atual e descarta tudo o que estava na fila. */
  parar(): void {
    if (!this.suportado) {
      return;
    }
    this.fila.limpar();
    if (this.falaAtual) {
      // Desliga os callbacks antes de cancelar, para o cancel() não disparar
      // a leitura do próximo item.
      this.falaAtual.onend = null;
      this.falaAtual.onerror = null;
      this.falaAtual = null;
    }
    window.speechSynthesis.cancel();
    this._falando.set(false);
    this._pendentes.set(0);
  }

  /** Monta a frase que será falada para um agendamento. Não inclui CPF nem outros dados sensíveis. */
  descreverAgendamento(ag: Agendamento): string {
    const paciente = ag.paciente?.nomeCompleto ?? 'paciente não informado';
    const medico = ag.medico?.nomeCompleto ?? 'médico não informado';
    const quando = new Date(ag.dataHoraConsulta);

    const data = quando.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const semHora =
      ag.horarioDefinido === false ||
      (ag.horarioDefinido === undefined &&
        quando.getHours() === 0 &&
        quando.getMinutes() === 0);

    let hora = 'horário a definir';
    if (!semHora) {
      const h = quando.getHours();
      const m = quando.getMinutes();
      hora = `às ${h} ${h === 1 ? 'hora' : 'horas'}` + (m > 0 ? ` e ${m} minutos` : '');
    }

    return (
      `Agendamento de ${paciente}, com ${medico}. ` +
      `${ag.tipoConsulta}, em ${data}, ${hora}. ` +
      `Status: ${ag.status.toLowerCase()}.`
    );
  }

  private lerProximo(): void {
    const texto = this.fila.desenfileirar();
    this._pendentes.set(this.fila.tamanho);

    if (texto === undefined) {
      this.falaAtual = null;
      this._falando.set(false);
      return;
    }

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = 1;

    const voz = window.speechSynthesis.getVoices().find(v => v.lang === 'pt-BR');
    if (voz) {
      fala.voice = voz;
    }

    // Terminou (ou falhou): segue para o próximo da fila.
    fala.onend = () => this.lerProximo();
    fala.onerror = () => this.lerProximo();

    this.falaAtual = fala;
    this._falando.set(true);
    window.speechSynthesis.speak(fala);
  }
}
