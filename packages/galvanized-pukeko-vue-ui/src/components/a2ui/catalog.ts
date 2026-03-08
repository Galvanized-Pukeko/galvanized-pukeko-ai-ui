import type { Component } from 'vue'
import A2UIText from './A2UIText.vue'
import A2UIButton from './A2UIButton.vue'
import A2UIRow from './A2UIRow.vue'
import A2UIColumn from './A2UIColumn.vue'
import A2UITextField from './A2UITextField.vue'

export const catalog: Record<string, Component> = {
  Text: A2UIText,
  Button: A2UIButton,
  Row: A2UIRow,
  Column: A2UIColumn,
  TextField: A2UITextField,
}
