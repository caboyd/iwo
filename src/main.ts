import { glMatrix, mat3, mat4, vec3, vec4 } from "gl-matrix";
import { BoxGeometry } from "src/geometry/BoxGeometry";
import { Mesh } from "src/meshes/Mesh";
import { MeshInstance } from "src/meshes/MeshInstance";
import { Material } from "src/materials/Material";
import { Renderer } from "src/graphics/Renderer";
import { FileLoader } from "./loader/FileLoader";
import { TextureLoader } from "./loader/TextureLoader";
import { SphereGeometry } from "./geometry/SphereGeometry";
import { Camera, Camera_Movement } from "./cameras/Camera";
import { PlaneGeometry } from "./geometry/PlaneGeometry";
import { GridMaterial } from "./materials/GridMaterial";
import {PBRMaterial} from "./materials/PBRMaterial";
import {NormalOnlyMaterial} from "./materials/NormalOnlyMaterial";

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;

let view_matrix: mat4 = mat4.create();
let proj_matrix: mat4 = mat4.create();

let cPos: vec3 = vec3.fromValues(0.5, 8, 7.0);
let cUp: vec3 = vec3.fromValues(0, 1, 0);
let cFront: vec3 = vec3.fromValues(0, 0, -1);

let light_color: vec3 = vec3.fromValues(300.47, 300.31, 300.79);

let camera: Camera;

let mouse_x_total = 0;
let mouse_y_total = 0;
let keys: Array<boolean> = [];

let mesh: Mesh;
let box: MeshInstance;
let sphere: MeshInstance;
let sphere_mat:PBRMaterial;
let grid: MeshInstance;
let renderer: Renderer;

let loading_text = document.getElementById("loading-text")!;
let loading_subtext = document.getElementById("loading-subtext")!;

let files_completed: number = 0;
let total_files: number = 0;

const moveCallback = (e: MouseEvent): void => {
    //@ts-ignore
    let movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    //@ts-ignore
    let movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    if (e.which == 1) {
        mouse_x_total += movementX;
        mouse_y_total += movementY;
    }
};

(function loadWebGL(): void {
    let global_root = window.location.href.substr(0, window.location.href.lastIndexOf("/"));
    let a = require("assets/container.jpg");
    let b = require("assets/earth.jpg");

    FileLoader.setOnProgress(onProgress);
    FileLoader.setOnFileComplete(onFileComplete);

    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);

    gl = initGL();
    renderer = new Renderer(gl);
    camera = new Camera(cPos, cFront, cUp);

    let sphere_geom = new SphereGeometry(0.7, 64, 64);
    let box_geom = new BoxGeometry(2.0, 1.0, 1, 2, 1, 1, false);
    let plane_geom = new PlaneGeometry(100, 100, 1, 1);

    let sphere_mesh = new Mesh(gl, sphere_geom);
    let box_mesh = new Mesh(gl, box_geom);
    let plane_mesh = new Mesh(gl, plane_geom);

    let mat = new PBRMaterial(vec3.fromValues(1,0,1),0.0,1.0);
   // mat.albedo_texture = TextureLoader.load(gl, a.src, global_root);
    sphere_mat = new PBRMaterial(vec3.fromValues(1,0,0),0.0,0.0, 0);
  //  sphere_mat.albedo_texture = TextureLoader.load(gl, b.src, global_root);
    let normal_mat = new NormalOnlyMaterial();
    total_files = 0;

    box = new MeshInstance(box_mesh, mat);
    mat4.translate(box.model_matrix, box.model_matrix, vec3.fromValues(0, 3, 0));
    sphere = new MeshInstance(sphere_mesh, sphere_mat);

    let grid_mat = new GridMaterial(50 );
    grid = new MeshInstance(plane_mesh, grid_mat);



    gl.clearColor(0.2, 0.3, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);

    loading_text.innerText = files_completed + "/" + total_files + " files completed.";
    
    Renderer.PBRShader.setUniform("u_lights[0].position", [ -10 ,15, 10, 0]);
    Renderer.PBRShader.setUniform("u_lights[0].color", [50,50,50]);

    Renderer.PBRShader.setUniform("u_lights[1].position", [ 10 ,15, 10, 1]);
    Renderer.PBRShader.setUniform("u_lights[1].color", light_color);

    Renderer.PBRShader.setUniform("u_lights[2].position", [ -10 ,5, 10, 1]);
    Renderer.PBRShader.setUniform("u_lights[2].color", light_color);

    Renderer.PBRShader.setUniform("u_lights[3].position", [10 ,5, 10, 1]);
    Renderer.PBRShader.setUniform("u_lights[3].color", light_color);
    
    Renderer.PBRShader.setUniform("u_light_count", 4);
    
    onFileComplete("");

    requestAnimationFrame(update);
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

function update(): void {
    if (keys[87]) camera.processKeyboard(Camera_Movement.FORWARD, 0.001);
    else if (keys[83]) camera.processKeyboard(Camera_Movement.BACKWARD, 0.001);
    if (keys[65]) camera.processKeyboard(Camera_Movement.LEFT, 0.001);
    else if (keys[68]) camera.processKeyboard(Camera_Movement.RIGHT, 0.001);
    if (keys[82]) camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32]) camera.processKeyboard(Camera_Movement.UP, 0.001);

    camera.processMouseMovement(-mouse_x_total, -mouse_y_total, true);
    mouse_x_total = 0;
    mouse_y_total = 0;

    drawScene();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);
    
    //mat4.identity(model_matrix);

    // mat4.rotateY(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.7));
    // mat4.rotateZ(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.5));
    // mat3.normalFromMat4(box.normal_matrix, box.model_matrix);
    //
    // box.render(gl, renderer, view_matrix, proj_matrix);

    let model = sphere.model_matrix;
    
    let num_cols = 6;
    let num_rows = 6;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - 3) * 2, k * 2, 0));

            mat4.rotateY(model, model, glMatrix.toRadian(Date.now() * -0.08));
            mat4.rotateZ(model, model, glMatrix.toRadian(Date.now() * 0.06));

            sphere_mat.roughness = Math.min(1, Math.max(0.025, i/ num_cols));
            sphere_mat.metallic = k / num_rows;
            
            sphere.render(gl, renderer, view_matrix, proj_matrix);
        }
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    grid.render(gl, renderer, view_matrix, proj_matrix);

    gl.disable(gl.BLEND);
}

function onProgress(loaded_bytes: number, total_bytes: number, file_name: string) {
    let name = file_name;
    let reg = /[^/]*$/.exec(file_name);
    if (reg) name = reg[0];

    let text = name + " - " + ((loaded_bytes / total_bytes) * 100).toFixed(2) + "% complete";
    //console.log(text);
    loading_subtext.innerText = text;
}

function onFileComplete(file_name: string) {
    // console.log(file_name + " download complete. ");
    // console.log(num_complete + "/" + total + " files completed.");
    files_completed++;
    loading_text.innerText = files_completed + "/" + total_files + " files completed.";

    if (files_completed >= total_files) {
        let a = document.getElementById("loading-text-wrapper")!;
        a.remove();
    }
}

window.onkeydown = function(e) {
    keys[e.keyCode] = true;
};

window.onkeyup = function(e) {
    keys[e.keyCode] = false;
};
