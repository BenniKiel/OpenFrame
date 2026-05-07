"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";

// Cache to prevent remounting components on every render
const componentCache: Record<string, ComponentType<any>> = {};

function getDynamicComponent(name: string): ComponentType<any> {
  if (!componentCache[name]) {
    // Webpack Context Module magic: This instructs Webpack to bundle all `.tsx` files
    // inside the openframe/components directory as separate async chunks.
    componentCache[name] = dynamic(
      () => import(`../../../../../openframe/components/${name}/${name}.tsx`),
      {
        ssr: true,
        loading: () => (
          <div className="flex w-full items-center justify-center p-4 text-xs font-mono text-zinc-400 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-md">
            Loading code component: {name}...
          </div>
        ),
      }
    );
  }
  return componentCache[name];
}

export function DynamicCustomComponent({
  componentName,
  resolvedProps,
  children,
}: {
  componentName: string;
  resolvedProps: Record<string, unknown>;
  children?: ReactNode;
}) {
  const Component = useMemo(() => getDynamicComponent(componentName), [componentName]);

  return <Component {...resolvedProps}>{children}</Component>;
}
