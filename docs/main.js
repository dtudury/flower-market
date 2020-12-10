/* eslint-env browser */
import { render, h } from './horseless.0.5.1.min.esm.js'

const init = canvas => {
  if (!canvas) return
  const gl = canvas.getContext('webgl')
  if (!gl) {
    console.error('no webgl?!')
  }

  const shaderProgram = createProgram(
    createShader(gl.VERTEX_SHADER, `
      precision lowp float;
      attribute vec2 p;
      varying vec4 c;
      void main() {
        c = vec4(p.x * 0.01, p.y * 0.01, 0.0, 1.0);
        gl_Position = vec4(p.x * 0.01 - 0.5, p.y * 0.01 - 0.5, 0.0, 1.0);
      }
    `),
    createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 c;
      void main() {
        gl_FragColor = c;
      }
    `)
  )

  gl.useProgram(shaderProgram)

  const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'p')
  const buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  const DIMENSTIONS = 2
  const vertices = []
  for (let x = 0; x < 100; ++x) {
    for (let y = 0; y < 100; ++y) {
      vertices.push(
        x, y,
        x + 1, y,
        x, y + 1,
        x, y + 1,
        x + 1, y + 1,
        x + 1, y
      )
    }
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  requestAnimationFrame(draw)
  gl.vertexAttribPointer(vertexPositionAttribute, DIMENSTIONS, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vertexPositionAttribute)

  function draw () {
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / DIMENSTIONS)
  }

  function createProgram (vertexShader, fragmentShader) {
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (success) {
      return program
    }
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
  }

  function createShader (type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader
    }
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
  }
}

render(document.body, h`
  <canvas height="512px" width="512px" ${init}/>
`)
