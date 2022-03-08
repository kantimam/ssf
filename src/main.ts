import type { FormDefinitionTypo3 } from './api/types'
import FormSchema from './SchemaForm.svelte';
import formDefinitionData from './assets/formDefinition.json';
import TextField from "./lib/fields/textfield/TextFieldSsf.svelte";

const formDefinition: FormDefinitionTypo3=formDefinitionData;

const app = new FormSchema({
  target: document.body,
  props: {
    formSchema: formDefinition,
    elementsMap: {
      Text: TextField,
      Email: TextField,

    }
  }
})

export default app
 