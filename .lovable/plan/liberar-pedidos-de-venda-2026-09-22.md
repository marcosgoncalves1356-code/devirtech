# Liberar Pedidos de Venda

## Objetivo
Ativar somente a aba **Pedidos de venda** no módulo Vendas, mantendo Clientes, Contratos, Faturamento e os demais módulos sem alterações.

## O que será implementado
- Cadastro e edição de pedidos vinculados a um cliente.
- Número do pedido, data, situação e observações.
- Itens com descrição/produto, quantidade, unidade e valor unitário.
- Cálculo automático do total por item e do total do pedido.
- Consulta com busca e filtro por situação.
- Alteração de situação entre rascunho, confirmado e cancelado.
- Exclusão controlada de pedidos em rascunho.
- Tela adaptada para celular e Web, sem rolagem lateral da página.

## Regras preservadas
- Dados separados por empresa e validação no servidor.
- Clientes devem pertencer à mesma empresa do pedido.
- Nenhum dado fictício será inserido.
- As abas Clientes, Contratos, Tabelas de preço e Faturamento não serão alteradas.
- Dashboard, Financeiro, Estoque, Compras, permissões e menu lateral permanecem intactos.

## Detalhes técnicos
- Criar estruturas de pedidos e itens no banco, com segurança por empresa, índices, auditoria de datas e validações de consistência.
- Criar funções protegidas para listar, salvar, alterar situação e excluir pedidos.
- Substituir o aviso da aba Pedidos de venda pela tela funcional, seguindo os padrões visuais e móveis já usados no projeto.
- Validar compilação e o enquadramento em tela de celular.
