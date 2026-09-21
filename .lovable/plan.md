# Enquadramento responsivo dos módulos

## Objetivo
Eliminar a rolagem lateral involuntária no Financeiro e nos demais módulos liberados, mantendo rolagem horizontal somente onde ela é necessária, como nas abas e tabelas extensas.

## Implementação
- Ajustar cabeçalhos, filtros, formulários, cartões, listas, valores e grupos de ações do Financeiro para ocuparem corretamente a largura do celular.
- Revisar os módulos liberados de Compras, Estoque, Funcionários, Usuários e permissões, Produção e Vendas, corrigindo elementos com largura mínima, textos ou ações que ultrapassem a tela.
- Consolidar um padrão responsivo compartilhado: conteúdo com largura flexível, campos limitados ao contêiner, textos longos quebrados ou truncados e ações reorganizadas no celular.
- Preservar rolagem horizontal apenas nas abas e em tabelas que realmente precisem dela, sem bloquear ou mascarar problemas no restante da página.
- Não alterar dados, regras, permissões, integrações, Dashboard ou navegação lateral.

## Validação
- Conferir o Financeiro e os demais módulos em largura de celular.
- Confirmar ausência de rolagem lateral na página e funcionamento das rolagens específicas de abas/tabelas.
- Confirmar compilação sem erros.

## Detalhes técnicos
- As correções serão apenas de apresentação e estrutura responsiva.
- O padrão será aplicado aos componentes compartilhados para também orientar os próximos módulos.
