<script setup>
import { ref, onMounted } from 'vue'
import WebGLUtil from '@/scripts/WebGLUtil.js'
import defaultVS from './shaders/default.vs'
import defaultFS from './shaders/default.fs'
import velocityVS from './shaders/velocity.vs'
import velocityFS from './shaders/velocity.fs'
import pointVS from './shaders/point.vs'
import pointFS from './shaders/point.fs'
import { hsva } from '@/scripts/util.js'

const canvasElem = ref()
let gl = null
let defaultProgram = null
let velocityProgram = null
let pointProgram = null

let velocity = 0.0
let ambient = [1.0, 1.0, 1.0, 1.0]
let mouseFlag = false
let mousePosition = [0.0, 0.0]
let count = 0
const devicePixelRatio = window.devicePixelRatio
let instancedExt

// 頂点情報を定義
const pointNumber = 5000
const POSITION_TEXTURE_WIDTH = Math.floor(Math.sqrt(pointNumber))
const POSITION_TEXTURE_HEIGHT = POSITION_TEXTURE_WIDTH
const positionResolution = [POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT]
const vertices = new Array(POSITION_TEXTURE_WIDTH * POSITION_TEXTURE_HEIGHT)
for (let i = 0; i < vertices.length; i++) {
  vertices[i] = i
}
console.log(vertices.length)
// 板ポリ (1次元配列だと見にくいので、2次元配列で定義したものをflat()して1次元配列にしている)
const planePosition = [
  [-1.0, 1.0, 0.0],
  [-1.0, -1.0, 0.0],
  [1.0, 1.0, 0.0],
  [1.0, -1.0, 0.0],
].flat()

const arrowPosition = [
  [0.0, -0.03, 0.0],
  [-0.1, 0.04, 0.0],
  [0.0, 0.0, 0.0],
  [0.1, 0.04, 0.0],
]
  .flat()
  .map((p) => p / 5)

const arrowIndex = [0, 1, 2, 0, 2, 3]

let backPositionBuffer, frontPositionBuffer
let vertexVBO, planeVBO, arrowVBO, arrowIBO

const initCanvas = () => {
  canvasElem.value.width = Math.min(window.innerWidth, window.innerHeight)
  canvasElem.value.height = canvasElem.value.width

  gl = canvasElem.value.getContext('webgl')
  // 浮動小数点数テクスチャが利用可能かどうかチェック
  const ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float')
  if (ext == null) {
    alert('float texture not supported')
    return
  }

  // ジオメトリインスタンスの拡張機能チェック
  instancedExt = gl.getExtension('ANGLE_instanced_arrays')
  if (!instancedExt) {
    alert('instanced arrays not supported')
    return
  }

  canvasElem.value.addEventListener('mousedown', mouseDown, true)
  canvasElem.value.addEventListener('mouseup', mouseUp, true)
  canvasElem.value.addEventListener('mousemove', mouseMove, true)
  canvasElem.value.addEventListener('touchstart', mouseDown, true)
  canvasElem.value.addEventListener('touchend', mouseUp, true)
  canvasElem.value.addEventListener('touchmove', mouseMove, true)
}

const initProgram = () => {
  defaultProgram = WebGLUtil.createProgram(gl, { vertex: defaultVS, fragment: defaultFS })
  velocityProgram = WebGLUtil.createProgram(gl, { vertex: velocityVS, fragment: velocityFS })
  pointProgram = WebGLUtil.createProgram(gl, { vertex: pointVS, fragment: pointFS })

  vertexVBO = WebGLUtil.createVBO(gl, vertices, 1)
  planeVBO = WebGLUtil.createVBO(gl, planePosition, 3)
  arrowVBO = WebGLUtil.createVBO(gl, arrowPosition, 3)
  arrowIBO = WebGLUtil.createIBO(gl, arrowIndex)

  backPositionBuffer = WebGLUtil.createFrameBuffer(gl, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT, gl.FLOAT)
  frontPositionBuffer = WebGLUtil.createFrameBuffer(gl, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT, gl.FLOAT)

  setDefaultParticlePosition()
}

/**
 * デフォルトの頂点情報を設定する関数
 */
const setDefaultParticlePosition = () => {
  gl.disable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)

  // デフォルトの頂点情報を書き込む
  gl.bindFramebuffer(gl.FRAMEBUFFER, backPositionBuffer.frameBuffer)
  gl.viewport(0, 0, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  defaultProgram.use()
  WebGLUtil.setAttribute(gl, planeVBO.buffer, defaultProgram.attributes.position, planeVBO.stride)
  gl.uniform2fv(defaultProgram.uniforms.resolution, positionResolution)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, planePosition.length / 3)
}

const updateParticlePosition = () => {
  // ブレンドを無効化
  gl.disable(gl.BLEND)

  gl.bindFramebuffer(gl.FRAMEBUFFER, frontPositionBuffer.frameBuffer)
  gl.viewport(0, 0, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  velocityProgram.use()
  // テスクチャとしてバックバッファをバインド
  gl.bindTexture(gl.TEXTURE_2D, backPositionBuffer.texture)

  // テクスチャへ頂点情報をレンダリング
  WebGLUtil.setAttribute(gl, planeVBO.buffer, velocityProgram.attributes.position, planeVBO.stride)
  gl.uniform2fv(velocityProgram.uniforms.resolution, positionResolution)
  gl.uniform1i(velocityProgram.uniforms.texture, 0)
  gl.uniform2fv(velocityProgram.uniforms.mouse, mousePosition)
  gl.uniform1i(velocityProgram.uniforms.mouseFlag, mouseFlag)
  gl.uniform1f(velocityProgram.uniforms.velocity, velocity)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, planePosition.length / 3)
}

const drawParticle = () => {
  // パーティクルの色
  count++
  ambient = hsva(count % 360, 1.0, 0.8, 1.0)

  // ブレンドを有効化
  gl.enable(gl.BLEND)

  // ビューポートを設定
  gl.viewport(0, 0, canvasElem.value.width, canvasElem.value.height)

  // フレームバッファのバインドを解除
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // フレームバッファをテクスチャとしてバインド
  pointProgram.use()
  gl.bindTexture(gl.TEXTURE_2D, frontPositionBuffer.texture)

  WebGLUtil.setAttributeInstancedArray(gl, instancedExt, vertexVBO.buffer, pointProgram.attributes.index, vertexVBO.stride)
  WebGLUtil.setAttribute(gl, arrowVBO.buffer, pointProgram.attributes.arrow, arrowVBO.stride, arrowIBO)

  gl.uniform2fv(pointProgram.uniforms.resolution, positionResolution)
  gl.uniform1i(pointProgram.uniforms.texture, 0)
  gl.uniform1f(pointProgram.uniforms.pointScale, velocity)
  gl.uniform1f(pointProgram.uniforms.devicePixelRatio, devicePixelRatio)
  gl.uniform4fv(pointProgram.uniforms.ambient, ambient)
  instancedExt.drawElementsInstancedANGLE(gl.TRIANGLES, arrowIndex.length, gl.UNSIGNED_SHORT, 0, vertices.length)

  // instancing無効化
  instancedExt.vertexAttribDivisorANGLE(pointProgram.attributes.index, 0)

  const tmpBuffer = backPositionBuffer
  backPositionBuffer = frontPositionBuffer
  frontPositionBuffer = tmpBuffer
}

const render = () => {
  updateParticlePosition()
  drawParticle()

  gl.flush()

  if (mouseFlag) {
    velocity = 0.7
  } else {
    velocity *= 0.95
  }

  requestAnimationFrame(render)
}

const mouseDown = () => {
  mouseFlag = true
}
const mouseUp = () => {
  mouseFlag = false
}

const mouseMove = (event) => {
  if (mouseFlag) {
    const cw = canvasElem.value.width
    const ch = canvasElem.value.height
    const mouseX = event.touches ? event.touches[0].clientX : event.clientX
    const mouseY = event.touches ? event.touches[0].clientY : event.clientY
    const px = ((mouseX - canvasElem.value.offsetLeft - cw / 2.0) / cw) * 2.0
    const py = -((mouseY - canvasElem.value.offsetTop - ch / 2.0) / ch) * 2.0
    mousePosition = [px, py]
  }
}

onMounted(() => {
  initCanvas()
  initProgram()
  render()
})
</script>

<template>
  <canvas ref="canvasElem"></canvas>
  <ul id="memo">
    <li><a href="https://wgld.org/d/webgl/w083.html" target="_blank" rel="noopener">参考サイト1</a></li>
    <li><a href="https://wgld.org/d/webgl/w075.html" target="_blank" rel="noopener">参考サイト2</a></li>
    <li><a href="https://qiita.com/emadurandal/items/1812198d562bd1216c70" target="_blank" rel="noopener">参考サイト3</a></li>
  </ul>
</template>

<style scoped>
canvas {
  margin: 0 auto;
  display: block;
}
#memo {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #000c;
  padding: 3px 10px 5px;
  margin: 0;
  list-style-type: none;
}
#memo li {
  user-select: none;
}
#memo a {
  font-size: 12px;
  color: #fff;
}
</style>

<style>
body {
  margin: 0;
}
</style>
