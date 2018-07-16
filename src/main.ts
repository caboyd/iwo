import { glMatrix, mat4, vec3 } from "gl-matrix";
import { BoxGeometry } from "src/geometry/BoxGeometry";
import { Mesh } from "src/meshes/Mesh";
import { MeshInstance } from "src/meshes/MeshInstance";
import { Material } from "src/materials/Material";
import { Renderer } from "src/graphics/Renderer";
import { Shader } from "src/renderers/Shader";
import {FileLoader} from "./loader/FileLoader";
import {ImageLoader} from "./loader/ImageLoader";

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;

let model_matrix: mat4 = mat4.create();
let view_matrix: mat4 = mat4.create();
let proj_matrix: mat4 = mat4.create();

let modelview_matrix: mat4 = mat4.create();
let normalview_matrix: mat4 = mat4.create();
let mvp_matrix: mat4 = mat4.create();

let cPos: vec3 = vec3.fromValues(0, 0, 3.0);
let cUp: vec3 = vec3.fromValues(0, 1, 0);
let cFront: vec3 = vec3.fromValues(0, 0, -1);

let box: BoxGeometry;
let mesh: Mesh;
let instance: MeshInstance;
let renderer: Renderer;
let shader: Shader;

(function loadWebGL(): void {
    let global_root = window.location.href.substr(0, window.location.href.lastIndexOf("/"));
    let b = require("assets/container.jpg");

    FileLoader.setOnProgress((progress: number) => {
        console.log(progress.toFixed(2) + "% complete");
    });

    FileLoader.setOnFileComplete((num_complete, total_to_complete, file_name) => {
        console.log(file_name + " download complete. " + (num_complete / total_to_complete) * 100 + "% complete");
    });

    FileLoader.setOnAllComplete(total_complete => {
        console.log(total_complete + " files completed.");
    });

    let img = <HTMLImageElement>document.getElementById("img");
    //let a = FileLoader.load(b.src, global_root);
    console.log("before");
   //
   // let c = FileLoader.loadAll( [b.src, d.src], global_root).then( data =>{
   //    img.src = URL.createObjectURL(data[0]);
   //    img.width = 300;
   //    img.height = 240;
   // });

    ImageLoader.load(b.src, global_root).then( (image) => {
        img.src = image.src;
    });

    console.log("after");

    canvas = <HTMLCanvasElement>document.getElementById("canvas");

    gl = initGL();
    box = new BoxGeometry(2, 1, 1, 1, 1, 1);
    mesh = new Mesh(gl, box);
    instance = new MeshInstance(mesh, [new Material()]);
    renderer = new Renderer(gl);

    initShaders();

    gl.clearColor(0.2, 0.3, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);

    requestAnimationFrame(drawScene);
})();

function initGL(): WebGL2RenderingContext {
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

function initShaders(): void {
    shader = new Shader(gl, require("shaders/standard.vert"), require("shaders/standard.frag"));
    shader.use();
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.lookAt(view_matrix, cPos, cFront, cUp);

    //mat4.identity(model_matrix);
    mat4.rotateY(instance.model_matrix, instance.model_matrix, glMatrix.toRadian(1));
    mat4.rotateZ(instance.model_matrix, instance.model_matrix, glMatrix.toRadian(1.4));

    mat4.invert(instance.normal_matrix, instance.model_matrix);
    mat4.transpose(instance.normal_matrix, instance.normal_matrix);

    //Model view matrix
    mat4.mul(modelview_matrix, view_matrix, instance.model_matrix);

    //Normal matrix in view space
    mat4.mul(normalview_matrix, view_matrix, instance.normal_matrix);

    //MVP Matrix
    mat4.mul(mvp_matrix, proj_matrix, modelview_matrix);

    shader.setMat4ByName("u_modelview_matrix", modelview_matrix);
    shader.setMat4ByName("u_normalview_matrix", normalview_matrix);
    shader.setMat4ByName("u_mvp_matrix", mvp_matrix);

    renderer.draw(mesh.draw_mode, mesh.count, 0, mesh.index_buffer, mesh.vertex_buffer, shader);

    requestAnimationFrame(drawScene);
}
