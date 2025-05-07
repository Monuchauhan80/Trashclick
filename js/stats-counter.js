// Animate statistics counters
document.addEventListener("DOMContentLoaded", () => {
  const statValues = document.querySelectorAll(".stat-value")

  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const value = Math.floor(progress * (end - start) + start)
      element.textContent = value.toLocaleString()
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }

  const handleIntersection = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target
        const endValue = Number.parseInt(element.getAttribute("data-count"), 10)
        animateValue(element, 0, endValue, 2000)
        observer.unobserve(element)
      }
    })
  }

  const observer = new IntersectionObserver(handleIntersection, {
    root: null,
    threshold: 0.1,
  })

  statValues.forEach((value) => {
    observer.observe(value)
  })
})

