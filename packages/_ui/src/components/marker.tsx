import * as React from "react";

function Marker(
  props: React.ComponentProps<"div"> & { variant?: "default" | "separator" | "border" }
) {
  const { variant: _, ...rest } = props;
  return (
    <div
      data-slot="marker"
      className="flex items-center justify-center py-2 text-xs text-muted-foreground"
      {...rest}
    />
  );
}

function MarkerContent(props: React.ComponentProps<"span">) {
  return <span data-slot="marker-content" {...props} />;
}

export { Marker, MarkerContent };
