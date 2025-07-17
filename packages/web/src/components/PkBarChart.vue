<template>
  <div class="bar-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend)

interface BarChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

interface Props {
  data: BarChartData
  title?: string
  responsive?: boolean
  maintainAspectRatio?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  responsive: true,
  maintainAspectRatio: false
})

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const config: ChartConfiguration = {
    type: 'bar',
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
        }
      },
      scales: {
        y: {
          beginAtZero: true
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
</script>

<style scoped>
.bar-chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}
</style>