/* eslint-env browser */
import { render, h } from './horseless.0.5.1.min.esm.js'

const init = canvas => {
  if (!canvas) return
  const gl = canvas.getContext('webgl')
  if (!gl) {
    console.error('no webgl?!')
  }
  const program = createProgram(
    createShader(gl.VERTEX_SHADER, `
      precision lowp float;
      attribute vec2 point;
      varying vec4 color;
      uniform vec2 r;
      void main() {
        vec2 a = vec2(0.0, 0.0);
        vec2 b = vec2(1.0 * (point.x - 0.5), 0.0);
        vec2 c = vec2(1.0 * (point.x - 0.5), 1.0);
        vec2 d = vec2(0.0, 1.0);
        float y = point.y;
        float iy = 1.0 - y;
        vec2 mapped = iy * iy * iy * a + 3.0 * iy * iy * y * b + 3.0 * iy * y * y * c + y * y * y * d;
        float dx = abs(mod(10.0 * point.x, 1.0) - 0.5) * 2.0;
        color = vec4(point.x, point.y, dx, 1.0 - dx / 2.0);
        mapped = vec2(mapped.x * r.x - mapped.y * r.y, mapped.x * r.y + mapped.y * r.x);
        gl_Position = vec4(mapped, 0.0, 1.0);
      }
    `),
    createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `)
  )
  gl.useProgram(program)
  const vertexPositionAttribute = gl.getAttribLocation(program, 'point')
  const rLocation = gl.getUniformLocation(program, 'r')
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  const DIMENSTIONS = 2
  const vertices = []
  const xStep = 1 / 1000
  const yStep = 1 / 100
  for (let x = 0; x < 1; x += xStep) {
    for (let y = 0; y < 1; y += yStep) {
      vertices.push(
        x, y,
        x + xStep, y,
        x, y + yStep,
        x, y + yStep,
        x + xStep, y + yStep,
        x + xStep, y
      )
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.vertexAttribPointer(vertexPositionAttribute, DIMENSTIONS, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vertexPositionAttribute)
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.depthMask(false)

  return draw

  function draw (r, scale) {
    gl.uniform2f(rLocation, Math.cos(r) * scale, Math.sin(r) * scale)
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
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
requestAnimationFrame(() => {
  const stamp = document.querySelector('canvas')
  const redraw = init(stamp)
  function redrawAll () {
    for (let i = 0; i <= 8; ++i) {
      const base = 10 / (i + 10)
      const scale = Math.pow(base, 2)
      const r = 12 * i / base / (72 * 4) * 2 * Math.PI
      for (let angle = 0; angle < 3; angle++) {
        redraw(angle / 3 * 2 * Math.PI + r, scale)
        redraw(angle / 3 * 2 * Math.PI - r, scale)
      }
    }
  }
  requestAnimationFrame(redrawAll)
})

render(document.body, h`
  <canvas height="512px" width="512px" style="background: OliveDrab;"/>
  <div>
    <label>
      <input type="range" oninput=${oninput} min="0" max="1023" value="512" step="1">
      Leafiness
    </label>
  </div>
`)
