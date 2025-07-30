
"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import {
  PanelGroup, // Direct import
  Panel,      // Direct import
  PanelResizeHandle,
  type ImperativePanelHandle, // For Panel ref
  type PanelProps,            // For ResizablePanel props
  type PanelGroupProps,       // For ResizablePanelGroup props
  type ImperativePanelGroupHandle // For ResizablePanelGroup ref
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = React.forwardRef<
  ImperativePanelGroupHandle,
  PanelGroupProps & {
    className?: string
  }
>(({ className, direction, children, ...props }, ref) => (
    <PanelGroup
      ref={ref}
      direction={direction}
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    >
      {children}
    </PanelGroup>
))
ResizablePanelGroup.displayName = "ResizablePanelGroup"


const ResizablePanel = React.forwardRef<
  ImperativePanelHandle,
  PanelProps & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => {
  return (
      <Panel ref={ref} className={cn(className)} {...props}>
        {children}
      </Panel>
  )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof PanelResizeHandle> & {
    className?: string
    withHandle?: boolean
  }
>(({ className, withHandle, children, ...props }, ref) => (
  <PanelResizeHandle
    ref={ref}
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-dragging=true]]:bg-muted-foreground [&[data-dragging=true]]:opacity-30",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
      </div>
    )}
    {children}
  </PanelResizeHandle>
))
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
