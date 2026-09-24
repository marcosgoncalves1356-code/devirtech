# Liberar Tabelas de preços em Vendas

## Objetivo
Liberar somente a aba **Tabelas de preços** do módulo Vendas, seguindo o padrão atual do sistema para celular e Web.

## Entrega
- Cadastrar, editar, consultar, ativar, desativar e excluir tabelas de preços.
- Informar nome, período de vigência, situação e observações da tabela.
- Adicionar itens com descrição do produto/serviço, unidade e preço de venda.
- Exibir busca, filtro por situação, quantidade de itens e resumo dos valores.
- Impedir nomes repetidos dentro da mesma empresa e impedir vigência final anterior à inicial.
- Permitir exclusão somente de tabelas inativas ou em rascunho, evitando remoção acidental de uma tabela ativa.
- Manter a página enquadrada no celular, com rolagem horizontal somente nas abas.

## Regras preservadas
- Dados isolados por empresa, com validação no servidor e controle de acesso existente.
- Nenhum dado fictício será criado.
- Clientes, Contratos, Pedidos de venda e Faturamento não serão alterados.
- A escolha automática da tabela dentro do Pedido de Venda não será adicionada nesta etapa.
- Dashboard, Financeiro, Estoque, Compras, permissões e menu lateral permanecem intactos.

## Detalhes técnicos
- Criar estruturas próprias para tabelas e itens de preço, com histórico de criação e atualização, índices, permissões e políticas de isolamento.
- Criar operações protegidas de consulta e manutenção, incluindo validações de empresa, vigência, situação e itens.
- Criar o painel responsivo e conectá-lo à aba já existente em Vendas.
- Validar compilação e comportamento visual em largura de celular quando houver sessão disponível.
