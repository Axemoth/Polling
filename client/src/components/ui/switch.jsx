import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 data-[size=default]:h-[20px] data-[size=default]:w-[36px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] data-checked:bg-indigo-600 data-unchecked:bg-zinc-800 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={(state) =>
          cn(
            "pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
            size === "sm" ? "size-3" : "size-4",
            size === "sm"
              ? state.checked
                ? "translate-x-[10px]"
                : "translate-x-px"
              : state.checked
                ? "translate-x-[18px]"
                : "translate-x-0.5"
          )}
        />
    </SwitchPrimitive.Root>
  );
}

export { Switch }
