import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  Wallet,
  ShoppingCart,
  Boxes,
  Receipt,
  BadgeDollarSign,
  Truck,
  MapPinned,
  Sprout,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type ModuleGroup = "Visão geral" | "Cadastros" | "Operação" | "Campo" | "Gestão";

export type ErpModule = {
  slug: string;
  path: string;
  label: string;
  short: string;
  description: string;
  group: ModuleGroup;
  icon: LucideIcon;
  /** Recursos previstos, usados nos placeholders de cada módulo. */
  features: string[];
};

export const modules: ErpModule[] = [
  {
    slug: "dashboard",
    path: "/app",
    label: "Dashboard",
    short: "Início",
    description: "Indicadores consolidados da empresa selecionada, com alertas operacionais e financeiros.",
    group: "Visão geral",
    icon: LayoutDashboard,
    features: ["Indicadores de safra", "Fluxo de caixa resumido", "Alertas e pendências", "Atalhos por módulo"],
  },
  {
    slug: "empresas",
    path: "/app/empresas",
    label: "Empresas",
    short: "Empresas",
    description: "Cadastro das empresas do grupo, filiais, dados fiscais e configurações por unidade.",
    group: "Cadastros",
    icon: Building2,
    features: ["Dados cadastrais e fiscais", "Filiais e centros de custo", "Logotipo e identidade", "Parâmetros por empresa"],
  },
  {
    slug: "usuarios",
    path: "/app/usuarios",
    label: "Usuários e permissões",
    short: "Usuários",
    description: "Controle de acessos por perfil, com permissões granulares por módulo e por empresa.",
    group: "Cadastros",
    icon: ShieldCheck,
    features: ["Perfis e papéis", "Permissões por módulo", "Vínculo usuário x empresa", "Auditoria de acesso"],
  },
  {
    slug: "funcionarios",
    path: "/app/funcionarios",
    label: "Funcionários",
    short: "Equipe",
    description: "Cadastro de colaboradores, cargos, documentos e alocação por propriedade.",
    group: "Cadastros",
    icon: Users,
    features: ["Ficha do colaborador", "Cargos e departamentos", "Documentos e admissão", "Escalas e alocação"],
  },
  {
    slug: "financeiro",
    path: "/app/financeiro",
    label: "Financeiro",
    short: "Financeiro",
    description: "Contas a pagar e receber, conciliação bancária e centros de custo agrícolas.",
    group: "Operação",
    icon: Wallet,
    features: ["Contas a pagar / receber", "Fluxo de caixa", "Conciliação bancária", "Centros de custo"],
  },
  {
    slug: "compras",
    path: "/app/compras",
    label: "Compras",
    short: "Compras",
    description: "Requisições, cotações, pedidos de compra e homologação de fornecedores.",
    group: "Operação",
    icon: ShoppingCart,
    features: ["Requisição e cotação", "Pedidos de compra", "Fornecedores", "Recebimento e notas"],
  },
  {
    slug: "estoque",
    path: "/app/estoque",
    label: "Estoque e insumos",
    short: "Estoque",
    description: "Controle de insumos, defensivos, sementes, peças e movimentações por depósito.",
    group: "Operação",
    icon: Boxes,
    features: ["Saldos por depósito", "Entradas e saídas", "Lotes e validade", "Inventário e perdas"],
  },
  {
    slug: "vendas",
    path: "/app/vendas",
    label: "Vendas",
    short: "Vendas",
    description: "Pedidos, contratos de comercialização, clientes e faturamento da produção.",
    group: "Operação",
    icon: Receipt,
    features: ["Clientes e contratos", "Pedidos de venda", "Tabelas de preço", "Faturamento"],
  },
  {
    slug: "folha-de-pagamento",
    path: "/app/folha-de-pagamento",
    label: "Folha de pagamento",
    short: "Folha",
    description: "Apuração de folha, adiantamentos, encargos e integração com o financeiro.",
    group: "Operação",
    icon: BadgeDollarSign,
    features: ["Apuração mensal", "Proventos e descontos", "Encargos e guias", "Holerites"],
  },
  {
    slug: "veiculos",
    path: "/app/veiculos",
    label: "Veículos e combustível",
    short: "Frota",
    description: "Frota, máquinas agrícolas, abastecimentos, manutenções e consumo por hora/hectare.",
    group: "Campo",
    icon: Truck,
    features: ["Frota e implementos", "Abastecimentos", "Manutenção preventiva", "Consumo e custo/hora"],
  },
  {
    slug: "propriedades",
    path: "/app/propriedades",
    label: "Propriedades rurais",
    short: "Fazendas",
    description: "Fazendas, talhões, áreas cultiváveis, matrículas e mapas de uso do solo.",
    group: "Campo",
    icon: MapPinned,
    features: ["Fazendas e talhões", "Áreas e matrículas", "Mapas e georreferência", "Arrendamentos"],
  },
  {
    slug: "producao",
    path: "/app/producao",
    label: "Produção",
    short: "Produção",
    description: "Safras, ordens de serviço no campo, aplicações, colheita e produtividade.",
    group: "Campo",
    icon: Sprout,
    features: ["Safras e ciclos", "Ordens de serviço", "Aplicações e plantio", "Colheita e produtividade"],
  },
  {
    slug: "relatorios",
    path: "/app/relatorios",
    label: "Relatórios",
    short: "Relatórios",
    description: "Produção, produtividade, custos e resultados financeiros consolidados por safra.",
    group: "Gestão",
    icon: BarChart3,
    features: ["Visão geral", "Produção e produtividade", "Custos da safra", "Financeiro da safra", "Comparativo de safras"],
  },
  {
    slug: "configuracoes",
    path: "/app/configuracoes",
    label: "Configurações",
    short: "Ajustes",
    description: "Preferências do sistema, integrações, notificações e parâmetros da empresa.",
    group: "Gestão",
    icon: Settings,
    features: ["Preferências gerais", "Integrações e APIs", "Notificações", "Backup e dados"],
  },
];

export const moduleGroups: ModuleGroup[] = ["Visão geral", "Cadastros", "Operação", "Campo", "Gestão"];

export function getModule(slug: string): ErpModule | undefined {
  return modules.find((m) => m.slug === slug);
}

/** Itens fixos da barra inferior no modo aplicativo. */
export const mobileNavSlugs = ["dashboard", "financeiro", "producao", "estoque"];
