import { Chart } from "@/components/ui/chart"
// Charts for Dashboard
import { formatNumber } from "./utils.js"

// Chart colors for consistent styling
const chartColors = {
  primary: "#38b000",
  secondary: "#007bff",
  warning: "#fd7e14",
  success: "#28a745",
  danger: "#dc3545",
  info: "#17a2b8",
  purple: "#6f42c1",
  teal: "#20c997",
  pink: "#e83e8c",
  indigo: "#6610f2",
  // Transparent versions for backgrounds
  primaryTransparent: "rgba(56, 176, 0, 0.2)",
  secondaryTransparent: "rgba(0, 123, 255, 0.2)",
  warningTransparent: "rgba(253, 126, 20, 0.2)",
  successTransparent: "rgba(40, 167, 69, 0.2)",
  dangerTransparent: "rgba(220, 53, 69, 0.2)",
  infoTransparent: "rgba(23, 162, 184, 0.2)",
}

// Default chart options for consistent styling
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: 12,
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 13,
      },
      cornerRadius: 6,
      boxPadding: 6,
    },
  },
}

/**
 * Create an activity overview chart
 * @param {HTMLElement} element - Canvas element
 * @param {Array} reportsData - Waste reports data
 * @param {Array} salesData - Waste sales data
 * @param {Array} donationsData - Food donations data
 * @param {string} timeframe - 'week', 'month', or 'year'
 */
export function createActivityChart(element, reportsData, salesData, donationsData, timeframe) {
  if (!element) return

  // Destroy previous chart if exists
  if (element.chart) {
    element.chart.destroy()
  }

  // Prepare data based on timeframe
  const { labels, datasets } = prepareActivityData(reportsData, salesData, donationsData, timeframe)

  // Create chart
  const ctx = element.getContext("2d")
  element.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      ...defaultOptions,
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: (value) => value,
          },
        },
      },
      plugins: {
        ...defaultOptions.plugins,
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
          },
        },
      },
    },
  })
}

/**
 * Prepare data for activity chart
 * @param {Array} reportsData - Waste reports data
 * @param {Array} salesData - Waste sales data
 * @param {Array} donationsData - Food donations data
 * @param {string} timeframe - 'week', 'month', or 'year'
 * @returns {Object} Prepared data for chart
 */
function prepareActivityData(reportsData, salesData, donationsData, timeframe) {
  let labels = []
  let reportCounts = []
  let saleCounts = []
  let donationCounts = []

  // Set date format and interval based on timeframe
  let dateFormat
  let interval

  switch (timeframe) {
    case "week":
      // Last 7 days
      interval = { days: 1 }
      dateFormat = { weekday: "short" }
      break
    case "month":
      // Last 30 days - group by week
      interval = { days: 7 }
      dateFormat = { month: "short", day: "numeric" }
      break
    case "year":
      // Last 365 days - group by month
      interval = { month: 1 }
      dateFormat = { month: "short" }
      break
    default:
      // Default to month
      interval = { days: 7 }
      dateFormat = { month: "short", day: "numeric" }
  }

  // Create date intervals
  const now = new Date()
  const intervals = createDateIntervals(now, interval, timeframe)

  // Generate labels
  labels = intervals.map((date) => {
    return date.toLocaleDateString(undefined, dateFormat)
  })

  // Group data by intervals
  reportCounts = countItemsInIntervals(reportsData, intervals)
  saleCounts = countItemsInIntervals(salesData, intervals)
  donationCounts = countItemsInIntervals(donationsData, intervals)

  // Prepare datasets
  const datasets = [
    {
      label: "Waste Reports",
      data: reportCounts,
      borderColor: chartColors.primary,
      backgroundColor: chartColors.primaryTransparent,
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: chartColors.primary,
      pointRadius: 3,
      fill: true,
    },
    {
      label: "Recycling Transactions",
      data: saleCounts,
      borderColor: chartColors.success,
      backgroundColor: chartColors.successTransparent,
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: chartColors.success,
      pointRadius: 3,
      fill: true,
    },
    {
      label: "Food Donations",
      data: donationCounts,
      borderColor: chartColors.warning,
      backgroundColor: chartColors.warningTransparent,
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: chartColors.warning,
      pointRadius: 3,
      fill: true,
    },
  ]

  return { labels, datasets }
}

/**
 * Create date intervals based on timeframe
 * @param {Date} endDate - End date of interval
 * @param {Object} interval - Interval to group by
 * @param {string} timeframe - 'week', 'month', or 'year'
 * @returns {Array} Array of Date objects representing intervals
 */
function createDateIntervals(endDate, interval, timeframe) {
  const intervals = []
  let intervalCount

  switch (timeframe) {
    case "week":
      intervalCount = 7 // 7 days
      break
    case "month":
      intervalCount = 5 // 5 weeks
      break
    case "year":
      intervalCount = 12 // 12 months
      break
    default:
      intervalCount = 5 // Default to 5 weeks
  }

  // Create intervals
  for (let i = intervalCount - 1; i >= 0; i--) {
    const date = new Date(endDate)

    if (interval.days) {
      date.setDate(date.getDate() - i * interval.days)
    } else if (interval.month) {
      date.setMonth(date.getMonth() - i)
    }

    intervals.push(date)
  }

  return intervals
}

/**
 * Count items in each interval
 * @param {Array} data - Data array with created_at field
 * @param {Array} intervals - Array of Date objects representing intervals
 * @returns {Array} Array of counts for each interval
 */
function countItemsInIntervals(data, intervals) {
  const counts = Array(intervals.length).fill(0)

  if (!data || !data.length) return counts

  // Convert date strings to Date objects
  const dates = data.map((item) => new Date(item.created_at))

  // Count items in each interval
  dates.forEach((date) => {
    for (let i = 0; i < intervals.length; i++) {
      // If it's the last interval or the date is between this interval and the next
      if (i === intervals.length - 1 || (date >= intervals[i] && date < intervals[i + 1])) {
        counts[i]++
        break
      }
    }
  })

  return counts
}

/**
 * Create a waste distribution chart
 * @param {HTMLElement} element - Canvas element
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data
 * @param {string} type - 'type' or 'location'
 */
export function createWasteDistributionChart(element, labels, data, type) {
  if (!element) return

  // Destroy previous chart if exists
  if (element.chart) {
    element.chart.destroy()
  }

  // Default colors for waste types
  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.warning,
    chartColors.success,
    chartColors.info,
    chartColors.purple,
    chartColors.teal,
    chartColors.pink,
    chartColors.indigo,
    chartColors.danger,
  ]

  // Create chart
  const ctx = element.getContext("2d")

  // Choose chart type based on data type
  const chartType = type === "type" ? "pie" : "bar"

  // Prepare datasets
  const datasets = [
    {
      data,
      backgroundColor: colors.slice(0, data.length),
      borderWidth: 1,
    },
  ]

  // Chart title
  const title = type === "type" ? "Waste Distribution by Type" : "Top 5 Waste Locations"

  element.chart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets,
    },
    options: {
      ...defaultOptions,
      plugins: {
        ...defaultOptions.plugins,
        title: {
          display: false,
          text: title,
          font: {
            size: 16,
            weight: "normal",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = Math.round((value / total) * 100)
              return `${context.label}: ${formatNumber(value)} kg (${percentage}%)`
            },
          },
        },
      },
      // For bar charts only
      ...(chartType === "bar"
        ? {
            scales: {
              x: {
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                },
                ticks: {
                  callback: (value) => formatNumber(value) + " kg",
                },
              },
            },
          }
        : {}),
    },
  })
}

/**
 * Create a dashboard summary chart
 * @param {HTMLElement} element - Canvas element
 * @param {Object} data - Chart data
 */
export function createSummaryChart(element, data) {
  if (!element) return

  // Destroy previous chart if exists
  if (element.chart) {
    element.chart.destroy()
  }

  // Extract data
  const labels = Object.keys(data)
  const values = Object.values(data)

  // Create chart
  const ctx = element.getContext("2d")
  element.chart = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            chartColors.primaryTransparent,
            chartColors.successTransparent,
            chartColors.warningTransparent,
            chartColors.infoTransparent,
          ],
          borderColor: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.info],
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...defaultOptions,
      scales: {
        r: {
          ticks: {
            display: false,
          },
        },
      },
      plugins: {
        ...defaultOptions.plugins,
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `${context.label}: ${formatNumber(context.raw)}`,
          },
        },
      },
    },
  })
}

/**
 * Create a trend chart
 * @param {HTMLElement} element - Canvas element
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data
 * @param {string} label - Data label
 * @param {string} color - Chart color
 */
export function createTrendChart(element, labels, data, label, color = chartColors.primary) {
  if (!element) return

  // Destroy previous chart if exists
  if (element.chart) {
    element.chart.destroy()
  }

  // Create chart
  const ctx = element.getContext("2d")
  element.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.2)"),
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      ...defaultOptions,
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
          beginAtZero: true,
        },
      },
      plugins: {
        ...defaultOptions.plugins,
        legend: {
          display: false,
        },
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y)}`,
          },
        },
      },
    },
  })
}

