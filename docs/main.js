/* eslint-env browser */
import { render, h, proxy, watchFunction } from './horseless.0.5.1.min.esm.js'
const model = window.model = proxy({
  turns: 1.7,
  scale: 0.2,
  stepsPerTurn: 3,
  symmetry: 0
})

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
    if (r === true) return gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniform2f(rLocation, Math.cos(r) * scale, Math.sin(r) * scale)
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
  watchFunction(() => {
    const stamp = document.querySelector('canvas')
    const redraw = init(stamp)
    const turns = model.turns
    const steps = Math.pow(Math.E, model.stepsPerTurn) * turns
    const scaleBase = model.scale
    const symmetry = model.symmetry
    function redrawAll () {
      redraw(true)
      for (let i = 0; i <= steps; ++i) {
      // const base = 0.5 + Math.cos(Math.PI * i / steps) * 0.5
        const scale = Math.pow(scaleBase, i / steps)
        const r = turns * i / steps * 2 * Math.PI
        if (symmetry) {
          for (let angle = 0; angle < symmetry; angle++) {
            redraw(angle / symmetry * 2 * Math.PI + r, scale)
            redraw(angle / symmetry * 2 * Math.PI - r, scale)
          }
        } else {
          redraw(r, scale)
        }
      }
    }
    requestAnimationFrame(redrawAll)
  })
})

const onTurnsInput = el => e => {
  model.turns = +el.value
}
const onScaleInput = el => e => {
  model.scale = +el.value
}
const onSymmetryInput = el => e => {
  model.symmetry = +el.value
}
const onStepsInput = el => e => {
  model.stepsPerTurn = +el.value
}

render(document.body, h`
  <canvas height="512px" width="512px" style="background: SkyBlue;"/>
  <div>
    <label>
      <input type="range" oninput=${onTurnsInput} min="0" max="5" value="${() => model.turns}" step="0.01">
      Turns: ${() => model.turns}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onScaleInput} min="0.1" max="1.1" value="${() => model.scale}" step="0.001">
      Final Scale: ${() => model.scale}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onSymmetryInput} min="0" max="5" value="${() => model.symmetry}" step="1">
      Symmetry: ${() => model.symmetry}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onStepsInput} min="0" max="5" value="${() => model.stepsPerTurn}" step="0.1">
      Steps per Turn: e^${() => model.stepsPerTurn}
    </label>
  </div>
`)
