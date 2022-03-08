import type { FormDefinitionTypo3 } from './api/types'
import FormSchema from './SchemaForm.svelte';
import TextInput from './lib/fields/TextInput.svelte';
import formDefinitionData from './assets/formDefinition.json';

const formDefinition: FormDefinitionTypo3=formDefinitionData;

const app = new FormSchema({
  target: document.body,
  props: {
    formSchema: formDefinition,
    elementsMap: {
      Text: TextInput,
      Email: TextInput,

    }
  }
})

export default app
 