# Permissões por submódulo e fundação compartilhada

## Objetivo
Transformar o controle atual em uma hierarquia segura e econômica, mantendo todos os acessos existentes e preparando o ERP para novos segmentos sem criar versões separadas por cliente.

## Etapa 1 — Catálogo único de módulos e submódulos
- Centralizar os submódulos existentes em um catálogo estável, usando identificadores como `financeiro.contas-pagar`, `vendas.pedidos` e `estoque.inventario`.
- Reutilizar esse catálogo na área administrativa, nas abas dos módulos e nas permissões, evitando cadastros duplicados.
- Manter todos os submódulos atualmente disponíveis habilitados na migração, sem retirar acesso dos clientes atuais.

## Etapa 2 — Liberação comercial por empresa
- Permitir ao administrador DeviTech ativar ou desativar cada submódulo dentro dos módulos contratados.
- Um módulo desativado bloqueará automaticamente todos os seus submódulos.
- Novos submódulos futuros entrarão bloqueados até a liberação explícita, enquanto os atuais serão preservados.
- Registrar alterações no histórico administrativo.

## Etapa 3 — Permissões por perfil e vínculo com usuários
- Vincular cada usuário comum a um Perfil e Papel da sua empresa.
- Expandir a tela atual de permissões para módulo e submódulo, com ações de visualizar, criar, editar e excluir.
- Exibir somente submódulos contratados pela empresa.
- Manter compatibilidade temporária com as permissões individuais existentes para não bloquear usuários durante a transição.

## Etapa 4 — Aplicação real dos acessos
- Ocultar abas de submódulos não liberados e escolher automaticamente a primeira aba permitida.
- Bloquear acesso por endereço direto ou chamada indevida.
- Validar no servidor a empresa, o módulo, o submódulo e a ação antes de criar, editar ou excluir dados.
- Administrador DeviTech continuará com acesso integral e poderá visualizar exatamente o acesso de cada empresa e usuário.

## Etapa 5 — Próximo passo econômico: cadastros mestres
Após concluir e validar as permissões:
- Criar um cadastro central de produtos e serviços, reutilizável por Compras, Estoque, Vendas e futuros segmentos.
- Preparar categorias, unidades e conversões sem duplicar itens entre módulos.
- Estruturar um cadastro central de parceiros para evolução futura de clientes, fornecedores e transportadoras.
- Preservar os cadastros atuais e migrar gradualmente, sem apagar ou alterar registros existentes.

## Fora deste ciclo
- NF-e, NFC-e, NFS-e, impostos, SPED e qualquer funcionalidade fiscal.
- Farmácia, SNGPC e integrações regulatórias.
- Aprovações avançadas e limites financeiros.

## Validação
- Conferir isolamento entre empresas e impedir liberação cruzada.
- Testar perfis com acesso total, somente consulta e sem acesso.
- Validar abas e ações na Web e no celular.
- Confirmar que clientes e usuários atuais não perdem acesso após a migração.
- Validar compilação e principais fluxos já implementados.
