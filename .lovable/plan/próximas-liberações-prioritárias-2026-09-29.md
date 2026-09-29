# Próximas liberações prioritárias

## Ordem escolhida
1. **Propriedades rurais** — prioridade imediata, pois completa os vínculos já preparados em Produção e elimina cadastros de propriedade/talhão em texto livre.
2. **Folha de pagamento** — aproveita Funcionários, Colheita e Financeiro já existentes e entrega valor com menor retrabalho.
3. **Veículos e combustível** — entra depois, integrado a propriedades, centros de custo e safras.
4. **Configurações** — será liberado por último, quando houver parâmetros reais para centralizar.

## Liberação deste ciclo
### Propriedades rurais
- Liberar **Fazendas e talhões** e **Áreas e matrículas**.
- Cadastrar propriedades por empresa, com nome, documento/inscrição, área, município, estado, situação e observações.
- Cadastrar talhões vinculados à propriedade, com nome, área, unidade, cultivo e situação.
- Vincular as safras existentes à propriedade e ao talhão da mesma empresa.
- Manter **Mapas e georreferência** e **Arrendamentos** aguardando, evitando custo e complexidade agora.

### Folha de pagamento essencial
- Liberar **Apuração mensal** e **Proventos e descontos**.
- Gerar competência mensal a partir dos funcionários ativos, permitindo informar proventos, descontos e valor líquido por colaborador.
- Consolidar quantidade de funcionários e totais da competência no Dashboard.
- Preparar o lançamento financeiro sem incluir obrigações fiscais, encargos legais, guias ou emissão de holerites neste ciclo.
- Manter **Encargos e guias** e **Holerites** aguardando.

## Segurança e permissões
- Isolar todos os registros por empresa.
- Aplicar permissões por submódulo e por ação no servidor e nas telas.
- Impedir vínculos entre propriedade, talhão, safra, funcionário e competência de empresas diferentes.
- Não criar dados fictícios nem alterar registros existentes.

## Economia de créditos
- Usar uma migração consolidada para as duas liberações.
- Reutilizar componentes, cadastros, filtros e padrões móveis existentes.
- Entregar primeiro os fluxos operacionais; mapas, arquivos, cálculos legais e integrações externas ficam para etapas posteriores.

## Validação
- Confirmar cadastro, edição, situação e exclusão controlada.
- Confirmar os vínculos Produção → Propriedade/Talhão e Folha → Funcionários.
- Validar permissões de consulta, criação, edição e exclusão.
- Conferir enquadramento no celular e compilação sem erros.
