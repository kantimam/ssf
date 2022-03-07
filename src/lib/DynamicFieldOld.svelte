<script lang="ts">
  import FallbackField from "./FallbackField.svelte";

  export let componentsMap;
  export let elementDefinition;
  export let propsOverride = {};

  const selectedComponent =
    componentsMap[elementDefinition.identifier] || FallbackField;
  const extendedDefinition = { ...elementDefinition, ...propsOverride };
</script>

<svelte:component this={selectedComponent} {...extendedDefinition} />
