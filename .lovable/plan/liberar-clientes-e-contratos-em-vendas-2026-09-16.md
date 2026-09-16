# Liberar Clientes e Contratos em Vendas

## O que será feito
- Manter o módulo Vendas e sua navegação atual, liberando apenas as áreas **Clientes** e **Contratos**.
- Criar cadastros de clientes vinculados à empresa, com dados cadastrais, contato, endereço, documento e situação.
- Criar contratos comerciais vinculados a um cliente, com identificação, período, produto/cultura, quantidade, unidade, valor, situação e observações.
- Permitir cadastrar, consultar, editar, ativar/desativar e excluir clientes e contratos.
- Exibir Clientes e Contratos em abas separadas e responsivas; Pedidos de venda, Tabelas de preço e Faturamento continuarão indisponíveis.

## Regras preservadas
- Isolamento total por empresa e validação no servidor.
- Dados e funcionalidades atuais de Dashboard, Compras, Estoque, Financeiro e demais módulos não serão alterados.
- Não serão criados dados fictícios.
- A identidade visual DeviTech, o menu lateral e as permissões atuais serão mantidos.

## Detalhes técnicos
- Novas tabelas com vínculo por empresa, regras de acesso, permissões de banco e índices.
- Contratos sempre vinculados a clientes da mesma empresa.
- Exclusão de cliente bloqueada quando houver contrato vinculado, preservando o histórico comercial.
- Formulários e consultas usarão as funções protegidas já adotadas pelo sistema.
