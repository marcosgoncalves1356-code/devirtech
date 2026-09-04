# Navegação interna por abas nos módulos

## Objetivo
Reorganizar os submódulos em abas horizontais abaixo do cabeçalho de cada módulo, exibindo apenas o conteúdo da aba selecionada. O Dashboard, o menu lateral, os dados, permissões e regras atuais permanecerão intactos.

## Implementação
- Criar um componente compartilhado de abas de módulo com o visual DeviTech atual, estados ativo/foco acessíveis e rolagem horizontal no mobile.
- Aplicar as abas aos módulos funcionais já liberados:
  - **Financeiro:** Contas a pagar, Contas a receber, Fluxo de caixa, Conciliação bancária e Centros de custo.
  - **Compras:** Fornecedores, Pedidos de compra, Recebimentos e Cotação/Requisição ainda prevista.
  - **Estoque e insumos:** Saldos por depósito, Entradas e saídas, Lotes e validade e Inventário e perdas.
  - **Funcionários:** Ficha do colaborador, Cargos e departamentos, Documentos e admissão e Escalas e alocação.
  - **Usuários e permissões:** Perfis e papéis e Permissões por módulo.
- Separar visualmente as áreas já combinadas dentro do Estoque para que cada aba mostre somente o submódulo correspondente, reutilizando exatamente as consultas, formulários e ações atuais.
- Aplicar o mesmo padrão às páginas genéricas dos demais módulos com múltiplos submódulos, mantendo seus conteúdos previstos e bloqueados, mas mostrando apenas uma opção por vez.
- Preservar o estado e as funções de cada painel; trocar de aba apenas controla qual painel fica visível.

## Validação
- Confirmar que somente uma aba e seu conteúdo aparecem por vez em cada módulo.
- Verificar rolagem horizontal das abas em largura mobile.
- Testar navegação e ações existentes nas telas liberadas, sem alterações no Dashboard.
- Confirmar compilação sem erros e revisar visualmente as telas principais.

## Detalhes técnicos
- Estado de aba ficará no frontend de cada página, sem migração ou mudança no banco.
- Conteúdos ainda não liberados continuarão com indicação de indisponibilidade/previsão, sem serem removidos.
- O componente compartilhado será o padrão reutilizável para os próximos módulos.
