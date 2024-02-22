<script setup>
import { ref, onMounted } from 'vue'
import control from './control.vue'
import WebGLUtil from '@/scripts/WebGLUtil.js'
import defaultVS from './shaders/default.vs'
import defaultFS from './shaders/default.fs'
import velocityVS from './shaders/velocity.vs'
import velocityFS from './shaders/velocity.fs'
import pointVS from './shaders/point.vs'
import pointFS from './shaders/point.fs'

const canvasElem = ref(null)
const devicePixelRatio = window.devicePixelRatio
const params = new URLSearchParams(location.search)
const isFloat = params.has('float')

// 頂点情報を定義
const pointNumber = 32 * 32
const POSITION_TEXTURE_WIDTH = Math.floor(Math.sqrt(pointNumber))
const POSITION_TEXTURE_HEIGHT = POSITION_TEXTURE_WIDTH
const positionResolution = [POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT]
const vertices = new Array(POSITION_TEXTURE_WIDTH * POSITION_TEXTURE_HEIGHT)
for (let i = 0; i < vertices.length; i++) {
  vertices[i] = i
}

const planePosition = [
  [-1.0, 1.0, 0.0],
  [-1.0, -1.0, 0.0],
  [1.0, 1.0, 0.0],
  [1.0, -1.0, 0.0],
].flat()

let gl = null
let defaultProgram, velocityProgram, pointProgram
let backPositionBuffer, frontPositionBuffer
let vertexVBO, planeVBO

const initCanvas = () => {
  canvasElem.value.width = Math.min(window.innerWidth, window.innerHeight)
  canvasElem.value.height = canvasElem.value.width

  gl = canvasElem.value.getContext('webgl')

  if (isFloat) {
    // 浮動小数点数テクスチャが利用可能かどうかチェック
    const ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float')
    if (ext == null) {
      alert('float texture not supported')
    }
  }
}

const initProgram = () => {
  defaultProgram = WebGLUtil.createProgram(gl, { vertex: defaultVS, fragment: defaultFS })
  velocityProgram = WebGLUtil.createProgram(gl, { vertex: velocityVS, fragment: velocityFS })
  pointProgram = WebGLUtil.createProgram(gl, { vertex: pointVS, fragment: pointFS })

  vertexVBO = WebGLUtil.createVBO(gl, vertices, 1)
  planeVBO = WebGLUtil.createVBO(gl, planePosition, 3)

  const textureFormat = isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE
  backPositionBuffer = WebGLUtil.createFrameBuffer(gl, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT, textureFormat)
  frontPositionBuffer = WebGLUtil.createFrameBuffer(gl, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT, textureFormat)

  setDefaultParticlePosition(backPositionBuffer.frameBuffer)
}
/**
 * デフォルトの頂点情報を設定する関数
 * @param {WebGLFramebuffer} framebuffer
 */
const setDefaultParticlePosition = (framebuffer) => {
  gl.disable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.viewport(0, 0, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  defaultProgram.use()
  WebGLUtil.setAttribute(gl, planeVBO.buffer, defaultProgram.attributes.position, planeVBO.stride)
  gl.uniform1i(defaultProgram.uniforms.isFloat, isFloat)
  gl.uniform2fv(defaultProgram.uniforms.resolution, positionResolution)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, planePosition.length / 3)
}

const updateParticlePosition = () => {
  gl.disable(gl.BLEND)

  gl.bindFramebuffer(gl.FRAMEBUFFER, frontPositionBuffer.frameBuffer)
  gl.viewport(0, 0, POSITION_TEXTURE_WIDTH, POSITION_TEXTURE_HEIGHT)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  velocityProgram.use()
  // テクスチャとしてバックバッファをバインド
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, backPositionBuffer.texture)

  WebGLUtil.setAttribute(gl, planeVBO.buffer, velocityProgram.attributes.position, planeVBO.stride)
  gl.uniform2fv(velocityProgram.uniforms.resolution, positionResolution)
  gl.uniform1i(velocityProgram.uniforms.isFloat, isFloat)
  gl.uniform1i(velocityProgram.uniforms.texture, 0)
  gl.uniform1f(velocityProgram.uniforms.velocity, 1.0)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, planePosition.length / 3)

  const tmpBuffer = backPositionBuffer
  backPositionBuffer = frontPositionBuffer
  frontPositionBuffer = tmpBuffer
}

const drawParticle = () => {
  gl.enable(gl.BLEND)
  gl.viewport(0, 0, canvasElem.value.width, canvasElem.value.height)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  pointProgram.use()
  gl.bindTexture(gl.TEXTURE_2D, frontPositionBuffer.texture)

  WebGLUtil.setAttribute(gl, vertexVBO.buffer, pointProgram.attributes.index, vertexVBO.stride)
  gl.uniform2fv(pointProgram.uniforms.resolution, positionResolution)
  gl.uniform1i(pointProgram.uniforms.isFloat, isFloat)
  gl.uniform1i(pointProgram.uniforms.texture, 0)
  gl.uniform1f(pointProgram.uniforms.pointScale, 2.0)
  gl.uniform1f(pointProgram.uniforms.devicePixelRatio, devicePixelRatio)
  gl.drawArrays(gl.POINTS, 0, vertices.length)
}

const render = () => {
  updateParticlePosition()
  drawParticle()

  gl.flush()

  requestAnimationFrame(render)
}

onMounted(() => {
  initCanvas()
  initProgram()
  render()
})
</script>

<template>
  <canvas ref="canvasElem"></canvas>
  <control :is-float="isFloat"></control>
</template>

<style scoped>
canvas {
  margin: 0 auto;
  display: block;
}
</style>

<style>
body {
  margin: 0;
  background-color: #112;
}
</style>
