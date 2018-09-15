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
import {BasicMaterial} from "./materials/BasicMaterial";
import {Texture} from "./materials/Texture";
import {ImageLoader} from "./loader/ImageLoader";
import {Texture2D} from "./graphics/Texture2D";
import {HDRImageLoader} from "./loader/HDRImageLoader";

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;

let view_matrix: mat4 = mat4.create();
let proj_matrix: mat4 = mat4.create();

let cPos: vec3 = vec3.fromValues(0.5, 8, 7.0);
let cUp: vec3 = vec3.fromValues(0, 1, 0);
let cFront: vec3 = vec3.fromValues(0, 0, -1);

let light_color: vec3 = vec3.fromValues(12.47, 12.31, 12.79);
let light_positions: [number,number,number,number][] = [
    [ 10 ,15, 10, 1],[ -10 ,5, 10, 1],[0 ,5, -10, 1]];

let camera: Camera;

let mouse_x_total = 0;
let mouse_y_total = 0;
let keys: Array<boolean> = [];

let box: MeshInstance;
let light_boxes:MeshInstance[];
let skybox:MeshInstance;
let spheres: MeshInstance[];
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

    
    FileLoader.setOnProgress(onProgress);
    FileLoader.setOnFileComplete(onFileComplete);

    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);

    gl = initGL();
    renderer = new Renderer(gl);
    camera = new Camera(cPos, cFront, cUp);

    gl.clearColor(0.2, 0.3, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);

    loading_text.innerText = files_completed + "/" + total_files + " files completed.";

    //0.5-u because we scaled x by -1 to invert sphere
    //1-v because we flipped the image
    let sun_dir = sphereUVtoVec3(vec3.create(),0.5+0.872,1.-0.456);
    let sun_intensity = 24;
    let sun_color = [sun_intensity*254/255,sun_intensity*238/255,sun_intensity*224/255];
    Renderer.PBRShader.setUniform("u_lights[0].position", [ sun_dir[0],sun_dir[1],sun_dir[2], 0]);
    Renderer.PBRShader.setUniform("u_lights[0].color", sun_color);

    Renderer.PBRShader.setUniform("u_lights[1].position", light_positions[0]);
    Renderer.PBRShader.setUniform("u_lights[1].color", light_color);

    Renderer.PBRShader.setUniform("u_lights[2].position", light_positions[1]);
    Renderer.PBRShader.setUniform("u_lights[2].color", light_color);

    Renderer.PBRShader.setUniform("u_lights[3].position", light_positions[2]);
    Renderer.PBRShader.setUniform("u_lights[3].color", light_color);
    
    Renderer.PBRShader.setUniform("u_light_count", 4);
    
    onFileComplete("");

    initScene();
    
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

function initScene():void{
    let global_root = window.location.href.substr(0, window.location.href.lastIndexOf("/"));
    let sky_tex =  new Texture2D(gl);
    let env_tex = new Texture2D(gl);
    ImageLoader.promise(require("assets/cubemap/monvalley/MonValley_A_LookoutPoint_preview.jpg").src, global_root).then((image) =>{
        sky_tex.setImage(gl,image,gl.CLAMP_TO_EDGE,gl.CLAMP_TO_EDGE,gl.LINEAR,gl.LINEAR);
        ImageLoader.promise(require("assets/cubemap/monvalley/MonValley_A_LookoutPoint_8k.jpg").src, global_root).then((image) =>{
            sky_tex.setImage(gl,image,gl.CLAMP_TO_EDGE,gl.CLAMP_TO_EDGE,gl.LINEAR,gl.LINEAR);
          //  env_tex = TextureCubeMap.fromEquirectangularImage(renderer, image, 1024);
        });
    });
    
    HDRImageLoader.promise("assets/cubemap/monvalley/MonValley_A_LookoutPoint_Env.hdr").then( data =>{
        env_tex.setImageByBuffer  (gl,data.data,data.width,data.height,gl.CLAMP_TO_EDGE,gl.CLAMP_TO_EDGE,gl.NEAREST,gl.NEAREST,gl.RGB32F,gl.RGB,gl.FLOAT,true);
    });

    let earth_tex = TextureLoader.load(gl, require("assets/earth.jpg").src, global_root);
    total_files = 0;

    let box_geom = new BoxGeometry(3.0, 3.0, 3.0, 1, 1, 1, false);
    let sphere_geom = new SphereGeometry(0.7, 24, 24);
    let plane_geom = new PlaneGeometry(100, 100, 1, 1,true);
    
    let sphere_mesh = new Mesh(gl, sphere_geom);
    let plane_mesh = new Mesh(gl, plane_geom);
    let box_mesh = new Mesh(gl, box_geom);

    sphere_mat = new PBRMaterial(vec3.fromValues(1,0,0),0.0,0.0);
    sphere_mat.albedo_texture = earth_tex;
 
    //GRID
    let grid_mat = new GridMaterial(50 );
    grid = new MeshInstance(plane_mesh, grid_mat);
    mat4.translate(grid.model_matrix,grid.model_matrix,vec3.fromValues(0,0 ,0));

    //SKYBOX
    let sky_geom = new SphereGeometry(1, 48, 48);
    let sky_mesh = new Mesh(gl,sky_geom);
    let sky_mat = new BasicMaterial([1,1,1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new MeshInstance(sky_mesh,sky_mat);
    
    //LIGHTS
    let light_geom = new BoxGeometry(1.0, 1.0, 1.0);
    let light_mesh = new Mesh(gl,light_geom);
    let light_mat = new PBRMaterial(vec3.fromValues(1000,1000,1000),0.0,1.0);
    light_boxes = [];
    for(let pos of light_positions){
        let lb = new MeshInstance(light_mesh,light_mat);
        let a = [...pos];
        a.pop();
        mat4.translate(lb.model_matrix,lb.model_matrix, a);
        light_boxes.push(lb);
    }

    //BOX
    let box_mat = new BasicMaterial(vec3.fromValues(1,1,1));
    box_mat.setAlbedoTexture(env_tex);
    box_mat.albedo_texture!.equirectangular = true;
    box = new MeshInstance(box_mesh,box_mat);
    mat4.translate(box.model_matrix, box.model_matrix, vec3.fromValues(0, 3, 6));
    
    //SPHERES

    spheres = [];
    let num_cols = 6;
    let num_rows = 6;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            let mat = new PBRMaterial(vec3.fromValues(1,0,0),k / num_rows, Math.min(1, Math.max(0.025, i/ num_cols)), 0);
            //mat.albedo_texture = sphere_mat.albedo_texture;
            mat.env_texture = env_tex;
            let s = new MeshInstance(sphere_mesh, mat);
            spheres.push(s);
            
            let model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - 3) * 2, k * 2, 0));
          //  mat4.rotateY(model, model, glMatrix.toRadian(Date.now() * -0.08));
         //   mat4.rotateZ(model, model, glMatrix.toRadian(Date.now() * 0.06));
        }
    }
    
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
    
    //skybox
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    mat4.identity(skybox.model_matrix);
    mat4.translate(skybox.model_matrix,skybox.model_matrix,camera.position);
    mat4.scale(skybox.model_matrix,skybox.model_matrix,[-1,1,-1]);

    skybox.render(renderer,view_matrix,proj_matrix);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    
    //mat4.rotateY(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.7));
    //mat4.rotateZ(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.5));
    box.render(renderer, view_matrix, proj_matrix);
    
    for(let lb of light_boxes)
        lb.render(renderer,view_matrix,proj_matrix);

    for(let sphere of spheres){
        sphere.render(renderer,view_matrix,proj_matrix);
    }

  
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    grid.render(renderer, view_matrix, proj_matrix);

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
        if(a)
        a.remove();
    }
}

window.onkeydown = function(e) {
    keys[e.keyCode] = true;
};

window.onkeyup = function(e) {
    keys[e.keyCode] = false;
};

/*
    Converts UV coords of equirectangular image to the vector direction,
    as if it was projected onto the sphere 
 */
function sphereUVtoVec3(out:vec3, u:number,v:number):vec3{
    let theta = (v - 0.5) * Math.PI;
    let phi = u * 2 * Math.PI;
    
    let x = Math.cos(phi) * Math.cos(theta);
    let y = Math.sin(theta);
    let z = Math.sin(phi) * Math.cos(theta);
    
    vec3.set(out,x,y,z);
    return out;
}