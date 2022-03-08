<script lang="ts">
  import type { ElementDefinition, ElementsMap } from "../api/types";

  import FallbackField from "./FallbackField.svelte";

  export let elementsMap: ElementsMap;
  export let elementDefinition: ElementDefinition;

  const selectedComponent =
    elementsMap[elementDefinition.type] || FallbackField;
</script>

<svelte:component this={selectedComponent} {elementDefinition} />
