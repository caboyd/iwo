import { mat4, vec3 } from "gl-matrix";

let frag: string = require("shaders/basic.frag");
let vert: string = require("shaders/basic.vert");

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;
let shader_prog: WebGLShader;
let triangleVertexPositionBuffer: WebGLBuffer;
let mMatrix: mat4 = mat4.create();
let vMatrix: mat4 = mat4.create();
let pMatrix: mat4 = mat4.create();
let vao: WebGLVertexArrayObject;

let pos: GLint;
let model: WebGLUniformLocation;
let view: WebGLUniformLocation;
let projection: WebGLUniformLocation;

let cPos: vec3 = vec3.fromValues(0, 0, 3.0);
let cUp: vec3 = vec3.fromValues(0, 1, 0);
let cFront: vec3 = vec3.fromValues(0, 0, -1);

(function loadWebGL():void {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");

    gl = initGL();
    initShaders();
    initBuffers();

    gl.clearColor(0.2, 0.3, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);

    drawScene();
})();

function initGL():WebGL2RenderingContext {
    try {
        gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
    } catch (e) {
        throw "GL init error:\n" + e;
    }
    if (!gl) {
        alert("WebGL is not available on your browser.");
    }
    return gl;
}

function initShaders():void {
    let fragmentShader: WebGLShader = getShader(gl, frag, gl.FRAGMENT_SHADER)!;
    let vertexShader: WebGLShader = getShader(gl, vert, gl.VERTEX_SHADER)!;

    shader_prog = gl.createProgram()!;
    gl.attachShader(shader_prog, vertexShader);
    gl.attachShader(shader_prog, fragmentShader);
    gl.linkProgram(shader_prog);

    if (!gl.getProgramParameter(shader_prog, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }

    gl.useProgram(shader_prog);

    pos = gl.getAttribLocation(shader_prog, "a_position");
    model = gl.getUniformLocation(shader_prog, "u_model")!;
    view = gl.getUniformLocation(shader_prog, "u_view")!;
    projection = gl.getUniformLocation(shader_prog, "u_projection")!;
}

function initBuffers():void {
    triangleVertexPositionBuffer = gl.createBuffer()!;
    vao = gl.createVertexArray()!;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

    //prettier-ignore
    let vertices = [
        -1.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.0, 0.5, 0.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(pos);
}

function drawScene():void {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 70, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);
    let cForward: vec3 = vec3.create();
    cForward = vec3.add(cForward, cPos, cFront);
    mat4.lookAt(vMatrix, cPos, cForward, cUp);
    //move view and projection matrix to vertex shader

    gl.uniformMatrix4fv(view, false, vMatrix);
    gl.uniformMatrix4fv(projection, false, pMatrix);

    mat4.identity(mMatrix);
    //Move our Triangle
    let translation = vec3.create();
    vec3.set(translation, 0, 0, -1.0);
    mat4.translate(mMatrix, mMatrix, translation);
    gl.uniformMatrix4fv(model, false, mMatrix);

    //Pass triangle position to vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);

    //Draw triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function getShader(gl: WebGL2RenderingContext, src:string, type:number):WebGLShader  {
    let shader: WebGLShader;
    shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
    }

    return shader;
}
