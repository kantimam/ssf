<script lang="ts">
  import type { ElementDefinition } from "src/api/types";

  import BaseInput from "../BaseInput.svelte";

  export let elementDefinition: ElementDefinition;
</script>

<BaseInput
  name={elementDefinition.name}
  identfier={elementDefinition.identifier}
  let:inputValue
  let:onChange
>
  <input type="text" name="" id="" value={inputValue} on:change={onChange} />
</BaseInput>
