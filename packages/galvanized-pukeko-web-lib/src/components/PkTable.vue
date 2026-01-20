<template>
  <table class="pk-table">
    <caption v-if="caption || $slots.default">
      <slot>{{ caption }}</slot>
    </caption>
    <thead v-if="header && header.length">
      <tr>
        <th
          v-for="(headerCell, index) in header"
          :key="index"
          scope="col"
          :class="getHeaderClass(index)"
        >
          {{ headerCell }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, rowIndex) in data" :key="rowIndex">
        <td v-for="(cell, cellIndex) in row" :key="cellIndex" :class="getCellClass(cellIndex)">
          {{ cell }}
        </td>
      </tr>
    </tbody>
    <tfoot v-if="footer && footer.length">
      <tr>
        <td v-for="(footerCell, index) in footer" :key="index" :class="getFooterClass(index)">
          {{ footerCell }}
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script setup lang="ts">
interface Props {
  caption?: string
  header?: string[]
  data: string[][]
  footer?: string[]
}

const props = withDefaults(defineProps<Props>(), {})

// Helper functions to determine cell classes
const getHeaderClass = (index: number) => {
  if (!props.header) return ''
  const isNarrow = index > 0 && index < props.header.length - 1
  return isNarrow ? 'table-cell-narrow' : 'table-cell-wide'
}

const getCellClass = (index: number) => {
  if (!props.header) return ''
  const isNarrow = index > 0 && index < props.header.length - 1
  return isNarrow ? 'table-cell-narrow' : 'table-cell-wide'
}

const getFooterClass = (index: number) => {
  if (!props.footer) return ''
  const isNarrow = index > 0 && index < props.footer.length - 1
  return isNarrow ? 'table-cell-narrow' : 'table-cell-wide'
}
</script>

<style scoped>
table {
  table-layout: fixed;
  margin: auto;
  border-collapse: collapse;
  border-top: var(--line-separator-subtle);
  border-bottom: var(--line-separator-subtle);
}

th,
td {
  vertical-align: top;
  padding: 0.5em;
}

tr .table-cell-narrow {
  text-align: right;
  width: 15%;
}

tr .table-cell-wide {
  text-align: left;
  width: 35%;
}

tfoot {
  border-top: var(--line-separator-subtle);
}

tfoot tr :nth-child(1) {
  text-align: right;
}

tfoot tr :nth-child(2) {
  text-align: left;
}

tbody tr:nth-child(odd) {
  background-color: var(--table-stripe-bg-idle);
}

caption {
  padding: 1em;
  font-style: italic;
  caption-side: bottom;
  letter-spacing: 1px;
}
</style>
