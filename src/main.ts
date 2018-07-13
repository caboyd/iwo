import {glMatrix, mat4, vec3} from "gl-matrix";
import {BoxGeometry} from "./geometry/BoxGeometry";
import {Mesh} from "./meshes/Mesh";
import {MeshInstance} from "./meshes/MeshInstance";
import {Material} from "./materials/Material";
import {AttributeType} from "./geometry/Geometry";

let frag: string = require("shaders/standard.frag");
let vert: string = require("shaders/standard.vert");

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;
let shader_prog: WebGLShader;
let triangleVertexPositionBuffer: WebGLBuffer;

let model_matrix:mat4 = mat4.create();
let view_matrix:mat4 = mat4.create();
let proj_matrix:mat4 = mat4.create();

let modelview_matrix: mat4 = mat4.create();
let normalview_matrix: mat4 = mat4.create();
let mvp_matrix: mat4 = mat4.create();
let vao: WebGLVertexArrayObject;

let position_location: GLint;
let modelview_location: WebGLUniformLocation;
let normalview_location: WebGLUniformLocation;
let mvp_location: WebGLUniformLocation;
let box:BoxGeometry;

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

    requestAnimationFrame(drawScene);
    
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

    position_location = gl.getAttribLocation(shader_prog, "a_vertex");
    modelview_location = gl.getUniformLocation(shader_prog, "u_modelview_matrix")!;
    normalview_location = gl.getUniformLocation(shader_prog, "u_normalview_matrix")!;
    mvp_location = gl.getUniformLocation(shader_prog, "u_mvp_matrix")!;
}

function initBuffers():void {
    triangleVertexPositionBuffer = gl.createBuffer()!;
    vao = gl.createVertexArray()!;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

    //prettier-ignore
    let vertices = [
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0,
        0.0, 0.5, 0.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(position_location);
}

function drawScene():void {
    box = new BoxGeometry(1,1,1);
    
    let mesh = new Mesh(gl,box);
    let instance = new MeshInstance(mesh, [new Material()]);
    
    
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);
    let cForward: vec3 = vec3.create();
    cForward = vec3.add(cForward, cPos, cFront);
    mat4.lookAt(view_matrix, cPos, cForward, cUp);
    //move view and projection matrix to vertex shader

    mat4.identity(model_matrix);
    //Move our Triangle
    let translation = vec3.create();
    vec3.set(translation, 0, 0, 0.0);
    
    mat4.rotateY(model_matrix,model_matrix,glMatrix.toRadian(Date.now()/100.0));
    mat4.rotateZ(model_matrix,model_matrix,glMatrix.toRadian(Date.now()/100.0));
    mat4.translate(model_matrix, model_matrix, translation);
    

    mat4.mul(modelview_matrix, view_matrix, model_matrix);
    
    mat4.invert(normalview_matrix,normalview_matrix);
    mat4.transpose(normalview_matrix, normalview_matrix);

    mat4.mul(mvp_matrix, proj_matrix, modelview_matrix);

    gl.uniformMatrix4fv(modelview_location, false, modelview_matrix);
    gl.uniformMatrix4fv(normalview_location, false, normalview_matrix);
    gl.uniformMatrix4fv(mvp_location, false, mvp_matrix);

    //Pass triangle position to vertex shader
    gl.enableVertexAttribArray(position_location);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertex_buffer.attribute_buffers.get(AttributeType.Vertex)!);
  //  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions),gl.STATIC_DRAW);
    gl.vertexAttribPointer(position_location, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(2);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertex_buffer.attribute_buffers.get(AttributeType.Normals)!);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    
    let count = 0;
    for(let sub of mesh.sub_meshes)
        count += sub.count;
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index_buffer!.EBO);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    //     new Uint16Array(indices), gl.STATIC_DRAW);

    //Draw triangle
    
    //gl.drawElements(gl.TRIANGLES, mesh.sub_meshes[0].count, gl.UNSIGNED_SHORT,0);

    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT,0);
    
    requestAnimationFrame(drawScene);
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

