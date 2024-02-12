export default class WebGLUtil {
  /**
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {String} shaderText
   * @param {Number=gl.VERTEX_SHADER,gl.FRAGMENT_SHADER} shaderType
   * @returns {WebGLShader}
   */
  static createShader(gl, shaderText, shaderType) {
    const shader = gl.createShader(shaderType)
    gl.shaderSource(shader, shaderText)
    gl.compileShader(shader)

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader
    } else {
      console.log(shaderType)
      console.log(shaderText)
      throw new Error(gl.getShaderInfoLog(shader))
    }
  }

  /**
   * WebGLProgram を作成し、program/attributes/uniforms を返却する関数
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {Object} shaders
   * @param {Object<text>} shaders.vertex vertex shader
   * @param {Object<text>} shaders.fragment fragment shader
   * @returns {Object}
   * @returns {Object<WebGLProgram>} program
   * @returns {Object<Object>} attributes
   * @returns {Object<Object>} uniforms
   */
  static createProgram(gl, shaders) {
    const program = gl.createProgram()
    gl.attachShader(program, this.createShader(gl, shaders.vertex, gl.VERTEX_SHADER))
    gl.attachShader(program, this.createShader(gl, shaders.fragment, gl.FRAGMENT_SHADER))

    gl.linkProgram(program)

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const attributes = this.getProgramAttributes(gl, program)
      const uniforms = this.getProgramUniforms(gl, program)
      return {
        program,
        attributes,
        uniforms,
        use() {
          gl.useProgram(program)
        },
      }
    } else {
      throw new Error(gl.getProgramInfoLog(program))
    }
  }

  /**
   * シェーダーのAttributesを取得する関数
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {WebGLProgram} program
   * @returns {Object} attributes
   */
  static getProgramAttributes(gl, program) {
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    const attributes = {}
    for (let i = 0; i < numAttributes; i++) {
      const attribute = gl.getActiveAttrib(program, i)
      attributes[attribute.name] = gl.getAttribLocation(program, attribute.name)
    }

    return attributes
  }

  /**
   * シェーダーのUniformesを取得する関数
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {WebGLProgram} program
   * @returns {Object} uniforms
   */
  static getProgramUniforms(gl, program) {
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    const uniforms = {}
    for (let i = 0; i < numUniforms; i++) {
      const uniform = gl.getActiveUniform(program, i)
      uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name)
    }

    return uniforms
  }

  /**
   * VBOを生成する関数
   * @param {WebGLRenderContext|WebGL2RenderingContext} gl
   * @param {Array} data
   * @returns {Object}
   * @returns {Object<WebGLBuffer>} buffer
   * @returns {Object<Number>} stride
   */
  static createVBO(gl, data, stride) {
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return { buffer: vbo, stride }
  }

  /**
   * IBOを生成する関数
   * @param {WebGLRenderContext|WebGL2RenderingContext} gl
   * @param {Array} data
   * @returns {WebGLBuffer}
   */
  static createIBO(gl, data) {
    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return ibo
  }

  /**
   * 頂点情報を設定する関数
   * @param {WebGLRenderContext|WebGL2RenderingContext} gl
   * @param {WebGLBuffer} vbo
   * @param {Number} location
   * @param {Number} stride
   * @param {WebGLBuffer} ibo
   */
  static setAttribute(gl, vbo, location, stride, ibo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    if (ibo) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    }
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
  }


  /**
   * テクスチャ用の画像を読み込む関数
   * @param {String} src
   * @returns {Promise<Object>}
   * @returns {Promise<Object><HTMLImageElement>} image 2の累乗にリサイズした画像
   * @returns {Promise<Object><Number>} width 元画像の幅
   * @returns {Promise<Object><Number>} height 元画像の高さ
   */
  static loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.addEventListener('load', () => {
        // 2の累乗にリサイズする
        const canvas = document.createElement('canvas')
        const size = 2 ** Math.round(Math.log2(Math.max(img.width, img.height)))
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        resolve({ image: canvas, width: img.width, height: img.height })
        // resolve(img);
      })
      img.src = src
    })
  }

  /**
   * テクスチャを生成する関数
   * @param {WebGLRenderContext|WebGL2RenderingContext} gl
   * @param {HTMLImageElement|HTMLCanvasElement} resource
   * @param {Number} texUnit
   * @returns {WebGLTexture}
   */
  static createTexture(gl, resource, texUnit = gl.TEXTURE0) {
    const texture = gl.createTexture()
    gl.activeTexture(texUnit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource)

    // mipmap
    if (resource.nodeName !== 'VIDEO') {
      gl.generateMipmap(gl.TEXTURE_2D)
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // bind解除
    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
  }

  /**
   * テクスチャを更新する関数
   * @param {WebGLRenderContext|WebGL2RenderingContext} gl
   * @param {HTMLCanvasElement|HTMLVideoElement} resource
   * @param {Number} texUnit
   */
  static updateTexture(gl, texture, resource, texUnit = gl.TEXTURE0) {
    gl.activeTexture(texUnit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource)
  }

  /**
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {Number} width
   * @param {Number} height
   * @param {*} format
   */
  static createFrameBuffer(gl, width, height, format) {
    const textureFormat = format ?? gl.UNSIGNED_BYTE

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    // 深度バッファ（使わないこともある）
    const depthRednerBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRednerBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRednerBuffer)

    // フレームバッファ用テクスチャ（生成時にはカラのテクスチャをバインドする）
    const fTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, fTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, textureFormat, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0)

    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return { frameBuffer, depthBuffer: depthRednerBuffer, texture: fTexture }
  }
}
