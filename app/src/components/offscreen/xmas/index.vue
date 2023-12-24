<script setup>
import { ref, onMounted } from 'vue'
import { Pane } from 'tweakpane'
import WebGLUtil from '@/scripts/WebGLUtil'
import brightnessVS from './shaders/brightness.vs'
import brightnessFS from './shaders/brightness.fs'
import displayVS from './shaders/display.vs'
import displayFS from './shaders/display.fs'

const baseUrl = import.meta.env.BASE_URL
const canvasElem = ref()
let gl = null
let originalTexture
let brightnessProgram = null
let displayProgram = null
let framebuffer = null
let textureImage = null
const startTime = Date.now()
let isOffscreen = true

const PARAMS = {
  offscreen: isOffscreen,
}

const pane = new Pane()
pane.addBinding(PARAMS, 'offscreen').on('change', (event) => {
  isOffscreen = event.value
})

// 貼り付けるジオメトリを作る
// 板ポリの座標
const position = [
  [-1, 1, 0],
  [1, 1, 0],
  [-1, -1, 0],
  [1, -1, 0],
].flat()

// ポイントの並び順
const index = [
  [0, 1, 2],
  [1, 3, 2],
].flat()

// テクスチャの配置
const texCoord = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
].flat()

const initCanvas = async (textureImage) => {
  const imageRatio = textureImage.height / textureImage.width
  const windowRatio = window.innerHeight / window.innerWidth
  if (windowRatio > imageRatio) {
    canvasElem.value.width = window.innerWidth
    canvasElem.value.height = window.innerWidth * imageRatio
  } else {
    canvasElem.value.height = window.innerHeight
    canvasElem.value.width = window.innerHeight / imageRatio
  }
  gl = canvasElem.value.getContext('webgl')
  framebuffer = WebGLUtil.createFrameBuffer(gl, canvasElem.value.width, canvasElem.value.height)
}

const initProgram = (textureImage) => {
  const positionVBO = WebGLUtil.createVBO(gl, position, 3)
  const texCoordVBO = WebGLUtil.createVBO(gl, texCoord, 2)
  const ibo = WebGLUtil.createIBO(gl, index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  brightnessProgram = WebGLUtil.createProgram(gl, { vertex: brightnessVS, fragment: brightnessFS })
  brightnessProgram.use()
  WebGLUtil.setAttribute(gl, positionVBO.buffer, brightnessProgram.attributes.position, positionVBO.stride)
  WebGLUtil.setAttribute(gl, texCoordVBO.buffer, brightnessProgram.attributes.texCoord, texCoordVBO.stride)

  originalTexture = WebGLUtil.createTexture(gl, textureImage.image)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, originalTexture)
  gl.uniform1i(brightnessProgram.uniforms.uTexture, 0)

  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

  displayProgram = WebGLUtil.createProgram(gl, { vertex: displayVS, fragment: displayFS })
  displayProgram.use()
  WebGLUtil.setAttribute(gl, positionVBO.buffer, brightnessProgram.attributes.position, positionVBO.stride)
  WebGLUtil.setAttribute(gl, texCoordVBO.buffer, brightnessProgram.attributes.texCoord, texCoordVBO.stride)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, originalTexture)
  gl.uniform1i(displayProgram.uniforms.uTexture, 0)

  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
}

const render = () => {
  const time = Date.now() - startTime

  brightnessProgram.use()
  if (isOffscreen) gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.frameBuffer)
  gl.uniform1f(brightnessProgram.uniforms.time, time)
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
  if (isOffscreen) gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  if (isOffscreen) {
    displayProgram.use()
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture)
    gl.uniform1i(displayProgram.uniforms.uBrightnessTexture, 1)

    gl.uniform1i(displayProgram.uniforms.uTexture, 0)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
  }

  requestAnimationFrame(render)
}

onMounted(async () => {
  textureImage = await WebGLUtil.loadImage(`${baseUrl}/offscreen/xmas/images/illumination.jpg`)
  await initCanvas(textureImage)
  initProgram(textureImage)

  render()
})
</script>

<template>
  <canvas ref="canvasElem"></canvas>
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
  background-color: #001;
}
</style>
