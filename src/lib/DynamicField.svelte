<script lang="ts">
  import type { ElementDefinition, ElementsMap } from "src/api/types";
  import { element } from "svelte/internal";

  import FallbackField from "./FallbackField.svelte";

  export let elementsMap: ElementsMap;
  export let elementDefinition: ElementDefinition;
  //export let otherProps: object = {};

  const selectedComponent =
    elementsMap[elementDefinition.type] || FallbackField;
  //const combinedProps = { ...elementDefinition, ...otherProps };
</script>

<svelte:component this={selectedComponent} {elementDefinition} />
