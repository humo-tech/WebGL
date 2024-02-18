import Stats from 'stats.js'

export const hsva = (h, s, v, a) => {
  if (s > 1 || v > 1 || a > 1) {
    return
  }
  const th = h % 360
  const i = Math.floor(th / 60)
  const f = th / 60 - i
  const m = v * (1 - s)
  const n = v * (1 - s * f)
  const k = v * (1 - s * (1 - f))
  const color = []
  if (!s > 0 && !s < 0) {
    color.push(v, v, v, a)
  } else {
    const r = [v, n, m, m, k, v]
    const g = [k, v, v, n, m, m]
    const b = [m, m, k, v, v, n]
    color.push(r[i], g[i], b[i], a)
  }
  return color
}

export const initStats = () => {
  const stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
  stats.domElement.style.position = 'absolute'
  stats.domElement.style.top = '0px'
  stats.domElement.style.left = '0px'

  return stats
}
