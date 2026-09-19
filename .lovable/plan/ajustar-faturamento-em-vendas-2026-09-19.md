# Ajustar Faturamento em Vendas

## O que será corrigido
- Remover de **Faturamento** a tela reutilizada de Contas a Receber, pois baixa, vencimento e recebimento pertencem ao módulo Financeiro.
- Recuperar a finalidade prevista originalmente para Faturamento: registrar, consultar, editar, confirmar e cancelar faturamentos de venda.
- Usar os dados comerciais já existentes: cliente, data da venda/emissão, valor total e situação (rascunho, confirmado ou cancelado).
- Permitir busca por cliente e filtro por situação, com totais resumidos por situação e sem criar dados fictícios.

## Tela para Web e App
- Cabeçalho compacto com ação principal visível.
- Resumo financeiro em blocos que se adaptam à largura da tela.
- Formulário em uma coluna no celular e em colunas na Web.
- Faturamentos apresentados como itens compactos no celular, com valor, cliente, data, situação e ações acessíveis por toque.
- Filtros e ações organizados sem rolagem lateral; somente as abas do módulo mantêm rolagem horizontal.

## Regras preservadas
- Faturamento continuará dentro de Vendas; Contas a Receber e suas baixas continuarão no Financeiro.
- Isolamento por empresa e permissão atual do módulo Vendas serão mantidos.
- Não haverá alteração em Clientes, Contratos, Pedidos, Tabelas de preço, Dashboard, Financeiro ou banco de dados.
- Nenhuma integração fiscal ou emissão de nota será criada nesta etapa, pois isso não fazia parte da programação inicial disponível.

## Detalhes técnicos
- Criar operações protegidas para listar, salvar, alterar situação e excluir registros na estrutura de vendas já existente.
- Validar empresa, cliente, data, valor e situação no servidor.
- Substituir apenas o conteúdo da aba Faturamento pela nova tela responsiva.
