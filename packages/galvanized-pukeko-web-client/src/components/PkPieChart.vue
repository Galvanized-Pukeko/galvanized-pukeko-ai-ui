<template>
  <div class="pie-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  ArcElement,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'

Chart.register(ArcElement, PieController, DoughnutController, Title, Tooltip, Legend)

interface PieChartData {
  labels: string[]
  datasets: {
    label?: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
    borderWidth?: number
  }[]
}

interface Props {
  data: PieChartData
  title?: string
  responsive?: boolean
  maintainAspectRatio?: boolean
  type?: 'pie' | 'doughnut'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  responsive: true,
  maintainAspectRatio: false,
  type: 'pie'
})

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const config: ChartConfiguration = {
    type: props.type,
    data: props.data,
    options: {
      responsive: props.responsive,
      maintainAspectRatio: props.maintainAspectRatio,
      plugins: {
        title: {
          display: !!props.title,
          text: props.title
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  }

  chart = new Chart(chartCanvas.value, config)
}

const destroyChart = () => {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

const updateChart = () => {
  if (chart) {
    chart.data = props.data
    chart.update()
  }
}

onMounted(async () => {
  await nextTick()
  createChart()
})

onUnmounted(() => {
  destroyChart()
})

watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true }
)

watch(
  () => props.type,
  () => {
    destroyChart()
    nextTick(() => {
      createChart()
    })
  }
)
</script>

<style scoped>
.pie-chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}
</style>