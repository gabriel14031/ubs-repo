/**
 * Nó da lista encadeada que sustenta a Fila.
 * Guarda o valor e a referência para o próximo nó (ou null, se for o último).
 */
class No<T> {
  constructor(
    public valor: T,
    public proximo: No<T> | null = null
  ) {}
}

/**
 * Fila (FIFO – First In, First Out): o primeiro elemento a entrar é o primeiro a sair.
 *
 * Implementada com lista encadeada (ponteiros `inicio` e `fim`) para que
 * enfileirar e desenfileirar sejam O(1). Com um Array, `shift()` precisaria
 * reindexar todos os elementos restantes (O(n)).
 *
 * Uso no projeto: fila de textos aguardando leitura em voz alta
 * (ver LeituraVozService).
 */
export class Fila<T> {
  private inicio: No<T> | null = null;
  private fim: No<T> | null = null;
  private quantidade = 0;

  /** Quantidade de elementos na fila. */
  get tamanho(): number {
    return this.quantidade;
  }

  estaVazia(): boolean {
    return this.quantidade === 0;
  }

  /** Insere no FIM da fila. O(1). */
  enfileirar(valor: T): void {
    const novo = new No(valor);
    if (this.fim) {
      this.fim.proximo = novo;
    } else {
      this.inicio = novo;
    }
    this.fim = novo;
    this.quantidade++;
  }

  /** Remove e devolve o elemento do INÍCIO. Devolve undefined se a fila estiver vazia. O(1). */
  desenfileirar(): T | undefined {
    if (!this.inicio) {
      return undefined;
    }
    const removido = this.inicio;
    this.inicio = removido.proximo;
    if (!this.inicio) {
      this.fim = null;
    }
    this.quantidade--;
    return removido.valor;
  }

  /** Consulta o elemento do início sem removê-lo. */
  primeiro(): T | undefined {
    return this.inicio?.valor;
  }

  /** Esvazia a fila. */
  limpar(): void {
    this.inicio = null;
    this.fim = null;
    this.quantidade = 0;
  }

  /** Cópia dos elementos, do início ao fim (útil para exibir/testar). */
  paraArray(): T[] {
    const itens: T[] = [];
    for (let atual = this.inicio; atual; atual = atual.proximo) {
      itens.push(atual.valor);
    }
    return itens;
  }
}
