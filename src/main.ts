import type { FormDefinitionTypo3 } from './api/types'
import App from './SchemaForm.svelte'
import TextInput from './lib/fields/TextInput.svelte';

const formDefinition: FormDefinitionTypo3=await import('./assets/formDefinition.json');

const app = new App({
  target: document.getElementById('app'),
  props: {
    formSchema: formDefinition,
    elementsMap: {
      Text: TextInput
    }
  }
})

export default app
