import { useEffect, useRef } from 'react'
import './loading-radar.css'

const vertexShader = 'precision highp float; attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}'
const fragmentShader = `
precision mediump float;
uniform float iTime;
uniform vec3 iResolution;
#define TAU 6.28318530718
#define LAYERS 72
#define POINTS 112
float sq(float value){return value*value;}
vec2 repeatAngle(vec2 uv,float angle){
  vec2 polar=vec2(atan(uv.y,uv.x),length(uv));
  polar.x=mod(polar.x+angle/2.0,angle)-angle/2.0;
  return polar.y*vec2(cos(polar.x),sin(polar.x));
}
vec2 tunnelPath(float x){
  return vec2(0.2*sin(TAU*x*0.5)+0.4*sin(TAU*x*0.2+0.3),0.3*cos(TAU*x*0.3)+0.2*cos(TAU*x*0.1))*smoothstep(1.0,4.0,x);
}
void main(){
  vec2 res=iResolution.xy/iResolution.y;
  vec2 uv=gl_FragCoord.xy/iResolution.y-res/2.0;
  vec3 color=vec3(0.0);
  float angle=TAU/float(POINTS);
  float pointSize=1.8/(2.0*iResolution.y);
  float camera=iTime*0.7;
  vec2 cameraOffset=tunnelPath(camera);
  for(int index=1;index<=LAYERS;index++){
    float depth=1.0-(float(index)/float(LAYERS));
    depth-=mod(camera,4.0/float(LAYERS));
    vec2 offset=tunnelPath(camera+depth)-cameraOffset;
    float radius=0.15/(sq(depth*0.8+0.4));
    if(abs(length(uv+offset)-radius)<pointSize*1.5){
      vec2 repeated=repeatAngle(uv+offset,angle);
      float distanceToPoint=length(repeated-vec2(radius,0.0))-pointSize;
      float blend=smoothstep(0.0,1.0/iResolution.y,distanceToPoint);
      vec3 pointColor=(mod(float(index/2),2.0)==0.0?vec3(0.85,1.0,0.92):vec3(0.0,0.72,0.52))*(1.0-depth);
      color=mix(pointColor,color,blend);
    }
  }
  gl_FragColor=vec4(color,1.0);
}`

function TunnelBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) return undefined

    const compileShader = (type, source) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const program = gl.createProgram()
    const vertex = compileShader(gl.VERTEX_SHADER, vertexShader)
    const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentShader)
    if (!program || !vertex || !fragment) return undefined
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    const timeUniform = gl.getUniformLocation(program, 'iTime')
    const resolutionUniform = gl.getUniformLocation(program, 'iResolution')
    let frameId
    let previousTime = 0
    let tunnelTime = 0
    let paused = document.hidden

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth
      const height = canvas.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const onVisibilityChange = () => { paused = document.hidden }
    const animate = (time) => {
      frameId = requestAnimationFrame(animate)
      if (paused) { previousTime = time; return }
      const seconds = time * 0.001
      const elapsed = Math.min(seconds - (previousTime || seconds), 0.1)
      previousTime = seconds
      tunnelTime += elapsed * 0.5
      gl.useProgram(program)
      gl.uniform1f(timeUniform, tunnelTime)
      gl.uniform3f(resolutionUniform, canvas.width, canvas.height, 1)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    gl.clearColor(0, 0, 0, 0)
    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    frameId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return <canvas ref={canvasRef} className="loading-tunnel" aria-hidden="true" />
}

function LoadingRadar() {
  return (
    <>
      <TunnelBackground />
      <div className="loading-radar" aria-label="Loading TurfOn24" role="status">
        <div className="loading-radar__ring loading-radar__ring--inner" />
        <div className="loading-radar__center" />
        <span className="loading-radar__sweep" aria-hidden="true">
          <span className="loading-radar__glow" />
        </span>
      </div>
    </>
  )
}

export default LoadingRadar