# Reorganização de Estoque e Insumos

## Objetivo
Reestruturar exclusivamente o módulo Estoque e Insumos em cinco abas — Visão geral, Itens, Depósitos, Movimentações e Inventário — preservando dados, integrações com Compras, regras de saldo, permissões e identidade DeviTech.

## O que será feito

### 1. Estrutura visual
- Substituir as abas atuais pelas cinco abas solicitadas, com rolagem horizontal no mobile.
- Exibir apenas o conteúdo da aba selecionada.
- Manter o cabeçalho, menu lateral e demais módulos inalterados.

### 2. Visão geral
- Criar indicadores calculados exclusivamente com dados reais: itens com saldo, valor total, estoque baixo e sem estoque.
- Exibir tabela consolidada de saldo por item e depósito, com status de disponibilidade.
- Adicionar atalhos para Entrada, Saída, Transferência e Inventário, direcionando para a aba e formulário correspondentes.
- Tratar recebimentos sem depósito ou sem item vinculado como “Recebido — aguardando armazenamento”, separados da tabela principal de saldo disponível.

### 3. Itens e Depósitos
- Separar o cadastro de itens em uma aba própria, mantendo edição e exclusão existentes.
- Acrescentar categoria e status aos itens sem modificar os registros atuais; registros existentes receberão valores padrão seguros.
- Separar o cadastro de depósitos em aba própria e mostrar seus saldos relacionados.

### 4. Movimentações
- Unificar em uma linha do tempo/tabela organizada as entradas manuais, saídas, transferências e entradas originadas por recebimentos de Compras.
- Preservar a validação que impede saída superior ao saldo disponível.
- Implementar transferência entre depósitos como operação única e atômica, debitando a origem e creditando o destino.
- Registrar automaticamente o usuário responsável e manter documento, data, observação e origem do lançamento.
- Não permitir editar ou excluir, pelo Estoque, entradas originadas em Compras.

### 5. Inventário
- Criar conferências físicas por item e depósito com quantidade do sistema, quantidade contada, diferença, responsável, data e status.
- Permitir aplicar o ajuste somente quando confirmado, gerando a movimentação correspondente e mantendo o histórico.
- Preservar registros concluídos para auditoria.

## Segurança e integridade
- Manter isolamento por empresa e as permissões atuais do módulo.
- Validar no servidor empresa, item, depósito, saldo e vínculos antes de gravar.
- Gravar autor e origem das movimentações, transferências e inventários.
- Aplicar as alterações de dados por migração aditiva, sem apagar ou reescrever cadastros existentes.
- Manter recebimentos de compras como fonte automática de entrada no cálculo do estoque.

## Verificação
- Validar compilação e tipos.
- Conferir no Web e no Mobile as cinco abas, a rolagem horizontal e a exibição de uma área por vez.
- Testar entrada, saída com bloqueio por saldo, transferência e ajuste de inventário usando os dados existentes, sem criar dados fictícios permanentes.
