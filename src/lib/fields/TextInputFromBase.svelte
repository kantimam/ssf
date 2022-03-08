<script lang="ts">
  import type { ElementDefinition } from "../../api/types";
  import BaseInput from "../BaseInput.svelte";
  export let elementDefinition: ElementDefinition;
</script>

<BaseInput
  name={elementDefinition.name}
  identfier={elementDefinition.identifier}
  let:inputValue
  let:onChange
  let:inputError
>
  <div class="text-input">
    {#if elementDefinition.label}
      <label for={elementDefinition.identifier}>
        {elementDefinition.label}
      </label>
    {/if}
    <div class="info-top">info top</div>
    <input
      type="text"
      name={elementDefinition.name}
      id={elementDefinition.identifier}
      value={inputValue}
      on:change={onChange}
    />
    {#if inputError?.message}
      <div class="info-bottom">{inputError.message}</div>
    {/if}
  </div>
</BaseInput>
