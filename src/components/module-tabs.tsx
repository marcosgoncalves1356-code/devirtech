import { useEffect, type ReactNode } from "react";
import { Lock } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/lib/company-context";

export type ModuleTab = {
  value: string;
  label: string;
  content: ReactNode;
};

export function ModuleTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  moduleSlug,
}: {
  tabs: ModuleTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  moduleSlug?: string;
}) {
  const { canViewSubmodule } = useCompany();
  const visibleTabs = moduleSlug ? tabs.filter((tab) => canViewSubmodule(moduleSlug, tab.value)) : tabs;
  const visibleKey = visibleTabs.map((tab) => tab.value).join("|");
  const initialValue = defaultValue && visibleTabs.some((tab) => tab.value === defaultValue) ? defaultValue : visibleTabs[0]?.value;
  useEffect(() => {
    if (value !== undefined && initialValue && !visibleTabs.some((tab) => tab.value === value)) onValueChange?.(initialValue);
  }, [initialValue, onValueChange, value, visibleKey]);
  if (!initialValue) return null;

  return (
    <Tabs
      defaultValue={initialValue}
      {...(value === undefined ? {} : { value })}
      {...(onValueChange ? { onValueChange } : {})}
      className="min-w-0 max-w-full"
    >
      <div className="w-full overflow-x-auto border-b border-border/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="h-auto min-w-max justify-start rounded-none bg-transparent p-0">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative h-11 rounded-none border-b-2 border-transparent px-4 text-xs shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-5 sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {visibleTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6 min-w-0 max-w-full">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function UpcomingSubmodule({ name }: { name: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Lock className="h-4 w-4" /> {name}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">Liberação prevista para uma próxima etapa.</p>
    </section>
  );
}