import { Fila } from './fila';

describe('Fila', () => {
  let fila: Fila<string>;

  beforeEach(() => {
    fila = new Fila<string>();
  });

  it('começa vazia', () => {
    expect(fila.estaVazia()).toBeTrue();
    expect(fila.tamanho).toBe(0);
    expect(fila.primeiro()).toBeUndefined();
    expect(fila.desenfileirar()).toBeUndefined();
  });

  it('respeita a ordem FIFO', () => {
    fila.enfileirar('a');
    fila.enfileirar('b');
    fila.enfileirar('c');

    expect(fila.tamanho).toBe(3);
    expect(fila.desenfileirar()).toBe('a');
    expect(fila.desenfileirar()).toBe('b');
    expect(fila.desenfileirar()).toBe('c');
    expect(fila.estaVazia()).toBeTrue();
  });

  it('primeiro() consulta sem remover', () => {
    fila.enfileirar('a');
    fila.enfileirar('b');

    expect(fila.primeiro()).toBe('a');
    expect(fila.tamanho).toBe(2);
  });

  it('permite reutilizar a fila depois de esvaziá-la', () => {
    fila.enfileirar('a');
    fila.desenfileirar();
    fila.enfileirar('b');

    expect(fila.paraArray()).toEqual(['b']);
    expect(fila.desenfileirar()).toBe('b');
  });

  it('limpar() esvazia a fila', () => {
    fila.enfileirar('a');
    fila.enfileirar('b');
    fila.limpar();

    expect(fila.estaVazia()).toBeTrue();
    expect(fila.paraArray()).toEqual([]);
  });
});
