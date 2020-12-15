/* eslint-env browser */
import { render, h, proxy, watchFunction } from './horseless.0.5.1.min.esm.js'
const model = window.model = proxy({
  turns: 0,
  smallScale: 0,
  generators: 1,
  symmetry: false,
  stepsPerTurn: 0
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
      uniform vec2 shape[16];
      void main() {
        float xMiddleness = 1.0 - abs(point.x - 0.5) * 2.0;
        float yMiddleness = 1.0 - abs(point.y - 0.5) * 2.0;
        float middleness = sqrt(pow(2.0 * point.x - 1.0, 2.0) + pow(2.0 * point.y - 1.0, 2.0));
        float dx = abs(mod(10.0 * point.x, 1.0) - 0.5) * 2.0;
        float dy = abs(mod(10.0 * point.y, 1.0) - 0.5) * 2.0;

        float y = point.y;
        float iy = 1.0 - y;
        float x = point.x;
        float ix = 1.0 - x;

        vec2 curve[4];
        for (int i = 0; i < 16; i += 4) {
          curve[i / 4] = iy * iy * iy * shape[i] + 3.0 * iy * iy * y * shape[i + 1] + 3.0 * iy * y * y * shape[i + 2] + y * y * y * shape[i + 3];
        }
        vec2 mapped = ix * ix * ix * curve[0] + 3.0 * ix * ix * x * curve[1] + 3.0 * ix * x * x * curve[2] + x * x * x * curve[3];

        float outline = 0.0;//max(1.0 - yMiddleness, 1.0 - xMiddleness);
        outline *= outline;
        color = vec4(
          dy * (1.0 - outline),
          0.7 * dx * (1.0 - outline), 
          outline * 0.8,
          max(1.0 - 0.1 * yMiddleness, outline)
        );
        vec2 rotated = vec2(mapped.x * r.x - mapped.y * r.y, mapped.x * r.y + mapped.y * r.x);
        gl_Position = vec4(rotated, 0.0, 1.0);
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
  const shapeLocation = gl.getUniformLocation(program, 'shape')
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
    const control = (x, y, angle, spread) => ({
      middle: [x, y],
      right: [x + Math.cos(angle) * spread, y + Math.sin(angle) * spread],
      left: [x - Math.cos(angle) * spread, y - Math.sin(angle) * spread]
    })
    const tl = control(-0.5, 1, Math.PI / 4, 0.3)
    const tm = control(0, 1, 0, 0.3)
    const tr = control(0.5, 1, -Math.PI / 4, 0.3)
    const bl = control(-0.5, 0, -Math.PI / 4, 0.3)
    const bm = control(0, 0, 0, 0.3)
    const br = control(0.5, 0, Math.PI / 4, 0.3)
    const a = [tl.middle, tl.right, tr.left, tr.middle]
    const b = [tl.left, tl.middle, tr.middle, tr.right]
    const c = [bl.left, bl.middle, br.middle, br.right]
    const d = [bl.middle, bl.right, br.left, br.middle]
    console.log([a, b, c, d].flat(2))

    gl.uniform2fv(shapeLocation, [a, b, c, d].flat(2))
    /*
    gl.uniform2fv(shapeLocation, [
      [-topWidth, height], [-topWidth / 3, height], [topWidth / 3, height], [topWidth, height],
      [-7 * topWidth / 3, height], [-topWidth, height], [topWidth, height], [7 * topWidth / 3, height],
      [-bottomWidth, height / 6], [-bottomWidth, 0], [bottomWidth, 0], [bottomWidth, height / 6],
      [-bottomWidth, 0], [-bottomWidth, -height / 6], [bottomWidth, -height / 6], [bottomWidth, 0]

    ].flat())
    */
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
    const smallScale = model.smallScale
    const symmetry = model.symmetry
    const generators = model.generators
    function redrawAll () {
      redraw(true)
      for (let i = 0; i <= steps; ++i) {
        const fraction = steps ? i / steps : 1
        const curvyFraction = Math.cos((1 - fraction) * Math.PI) * 0.5 + 0.5
        const scale = steps ? 1 - curvyFraction + curvyFraction * smallScale : 1
        // const scale = steps ? (Math.pow(smallScale, i / steps)) : 1
        // const scale = steps ? 1 - fraction + fraction * smallScale : 1
        const r = steps ? (turns * i / steps * 2 * Math.PI) : 0
        for (let angle = 0; angle < generators; angle++) {
          redraw(angle / generators * 2 * Math.PI + r, scale)
          if (symmetry) {
            redraw(angle / generators * 2 * Math.PI - r, scale)
          }
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
  model.smallScale = +el.value
}
const onGeneratorsInput = el => e => {
  model.generators = +el.value
}
const onSymmetryInput = el => e => {
  model.symmetry = !!+el.value
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
      <input type="range" oninput=${onScaleInput} min="0.0" max="1.0" value="${() => model.smallScale}" step="0.001">
      Final Scale: ${() => model.smallScale}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onGeneratorsInput} min="1" max="7" value="${() => model.generators}" step="1">
      Generators: ${() => model.generators}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onSymmetryInput} min="0" max="1" value="${() => model.symmetry ? 1 : 0}" step="1">
      Symmetry: ${() => model.symmetry}
    </label>
    <br>
    <label>
      <input type="range" oninput=${onStepsInput} min="0" max="5" value="${() => model.stepsPerTurn}" step="0.01">
      Steps per Turn: ${() => Math.pow(Math.E, model.stepsPerTurn)}
    </label>
  </div>
`)
