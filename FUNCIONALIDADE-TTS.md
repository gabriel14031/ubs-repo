# Funcionalidade adicional: leitura em voz alta (text-to-speech) dos agendamentos

## O que foi alterado

| Arquivo | Tipo | O que mudou |
|---|---|---|
| `frontend/src/app/util/fila.ts` | novo | Estrutura de dados **Fila (FIFO)** implementada à mão com lista encadeada |
| `frontend/src/app/util/fila.spec.ts` | novo | Testes unitários da Fila |
| `frontend/src/app/service/leitura-voz.service.ts` | novo | Serviço que usa a Fila + `window.speechSynthesis` para falar os textos em ordem |
| `frontend/src/app/agendamento/agendamento.component.ts/.html/.scss` | alterado | Botão de "ouvir" em cada linha, botões "Ler lista" e "Parar" e indicador de itens na fila |

Nada mudou no backend, no banco ou nas rotas.

## Como funciona

1. O usuário clica no ícone de volume de um agendamento (ou em **Ler lista**, que lê tudo o que está filtrado na tabela).
2. O serviço monta uma frase (paciente, médico, tipo, data por extenso, horário e status) e a **enfileira**.
3. Se nada estiver sendo falado, o primeiro texto sai da fila e é lido (`SpeechSynthesisUtterance`, idioma `pt-BR`).
4. Quando a fala termina (`onend`), o próximo texto sai da fila. Repete até esvaziar.
5. **Parar** cancela a fala atual e esvazia a fila. Sair da tela também faz isso (`ngOnDestroy`).

Em navegadores sem suporte à Web Speech API, os botões simplesmente não aparecem.

## Por que uma Fila

A leitura é um processo **sequencial e assíncrono**: o navegador fala um texto por vez. Se o usuário clicar em vários agendamentos seguidos, os pedidos precisam ser atendidos **na ordem em que chegaram**, e cada um deve esperar o anterior terminar. Isso é exatamente o comportamento FIFO (primeiro a entrar, primeiro a sair).

A Fila foi implementada com **lista encadeada** (ponteiros `inicio` e `fim`), e não com Array, porque assim `enfileirar` e `desenfileirar` são O(1). Com Array, `shift()` precisa reindexar os elementos restantes (O(n)).

## Outras estruturas seriam possíveis?

- **Array**: funciona (`push` + `shift`) e é a alternativa mais simples. Para poucas dezenas de itens a diferença de desempenho é irrelevante. Perde por não expressar a intenção (FIFO) e por o `shift` ser O(n).
- **Pilha**: *não serve* para a regra de negócio. Sendo LIFO, o último agendamento clicado seria lido primeiro e a lista sairia de trás para frente. Só faria sentido para um recurso de "voltar para a leitura anterior".
- **Mapa**: não resolve a ordem. Seria útil como complemento, por exemplo um cache `id do agendamento → texto já montado`, para não remontar a frase a cada clique.
- **Árvore**: seria exagero. Só faria sentido se a leitura precisasse de prioridades (heap/fila de prioridade, por exemplo ler primeiro as consultas de hoje).

## Consequências para a aplicação

- **Positivas**: acessibilidade (usuários com baixa visão ou que não podem olhar a tela), sem nova dependência, sem custo de servidor e sem alteração de API.
- **Limitações**: a qualidade e a disponibilidade da voz em português dependem do navegador e do sistema operacional; o Chrome pode não ter voz `pt-BR` instalada em alguns ambientes.
- **Privacidade (LGPD)**: a voz sai pelo alto-falante, então o texto lido evita CPF e dados sensíveis (apenas nome, médico, tipo, data, horário e status). Ler em ambiente público ainda expõe o nome do paciente; vale deixar claro que a leitura é ação explícita do usuário (nunca automática).
- **Desempenho**: custo desprezível; a fila guarda apenas strings e a síntese roda no próprio navegador.
- Também foi importado `MatTooltipModule` no componente (os `matTooltip` já existentes no HTML não funcionavam sem ele).

## Como testar

```bash
cd frontend
npm ci
ng serve              # abrir /agendamento (com login) e usar os botões de volume
ng test               # inclui util/fila.spec.ts
```
