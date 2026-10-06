# Integração prioritária do cadastro mestre

## Objetivo
Transformar Produtos e Serviços na referência compartilhada de Compras, Estoque e Vendas, sem apagar ou alterar registros já existentes.

## Etapas
1. **Preparar os vínculos seguros**
   - Adicionar referência opcional ao cadastro mestre nos itens de compra, estoque, pedidos de venda e tabelas de preços.
   - Validar que o cadastro e o registro operacional pertencem à mesma empresa.
   - Manter descrição, unidade e preço gravados em cada documento como histórico do momento da operação.

2. **Integrar Compras**
   - Permitir selecionar um produto ou serviço cadastrado ao montar pedidos.
   - Preencher descrição e unidade automaticamente, mantendo compatibilidade com itens antigos.

3. **Integrar Estoque**
   - Permitir criar ou vincular o item de estoque a um produto do cadastro mestre.
   - Serviços não entram no estoque.
   - Manter saldos, depósitos, movimentações e inventários atuais sem alteração.

4. **Integrar Vendas**
   - Usar Produtos e Serviços nos pedidos e nas tabelas de preços.
   - Preencher descrição e unidade automaticamente, preservando os preços históricos.

5. **Validar e seguir a prioridade**
   - Conferir permissões por empresa e submódulo, compilação e enquadramento móvel.
   - Atualizar o roteiro e deixar Veículos e Combustível como a próxima liberação.

## Fora desta etapa
- Não haverá migração automática por nome, pois nomes iguais podem representar produtos diferentes.
- Não serão alterados saldos, pedidos, recebimentos, vendas ou tabelas já cadastrados.
- Área fiscal, notas e impostos continuam fora do escopo.

## Detalhes técnicos
- As referências serão opcionais para compatibilidade com o histórico.
- O servidor validará empresa, tipo do cadastro e situação ativa ao salvar novos vínculos.
- Os campos textuais dos documentos continuarão como cópias históricas, evitando que uma renomeação futura altere operações passadas.
