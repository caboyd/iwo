import {glMatrix, mat4, vec3} from "gl-matrix";
import * as IWO from 'iwo';

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

let view_matrix: mat4 = mat4.create();
let proj_matrix: mat4 = mat4.create();

let cPos: vec3 = vec3.fromValues(0.5, 8, 9.0);
let camera: IWO.Camera;

let mouse_x_total = 0;
let mouse_y_total = 0;
let keys: Array<boolean> = [];

let spheres: IWO.MeshInstance[];
let sphere_mat: IWO.Material;
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

document.getElementById("loading-text-wrapper")!.remove();

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

    (function () {
        let script = document.createElement('script');
        script.onload = function () {
            // @ts-ignore
            let stats = new Stats();
            document.body.appendChild(stats.dom);
            requestAnimationFrame(function loop() {
                stats.update();
                requestAnimationFrame(loop)
            });
        };
        script.src = '//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';
        document.head.appendChild(script);
    })();

    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);

    gl = initGL();

    renderer = new IWO.Renderer(gl);

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1,
            1000.0);
    }

    resizeCanvas();

    camera = new IWO.Camera(cPos);

    gl.clearColor(173/255, 196/255, 221/255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);


    let sun_dir = [-0.3, 0, 1];
    let sun_intensity = 9;
    let sun_color = [sun_intensity * 254 / 255, sun_intensity * 238 / 255, sun_intensity * 224 / 255];

    let pbrShader = IWO.PBRMaterial.Shader;
    pbrShader.use();
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("u_light_count", 1);

    initScene();

    requestAnimationFrame(update);
})();

function initGL(): WebGL2RenderingContext {
    try {
        gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
    } catch (e) {
        throw new Error("GL init error:\n" + e);
    }

    if (!gl) {
        alert("WebGL is not available on your browser.");
    }
    return gl;
}


function initScene(): void {
    let plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    let plane_mesh = new IWO.Mesh(gl, plane_geom);

    sphere_mat = new IWO.PBRMaterial(vec3.fromValues(1, 1, 1), 0,0, 2);

    //GRID
    let grid_mat = new IWO.GridMaterial(50);
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SPHERES
    spheres = [];
    let num_cols = 8;
    let num_rows = 8;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            let sphere_geom = new IWO.SphereGeometry(0.75, 3+i*2, 2+k*2);
            let sphere_mesh = new IWO.Mesh(gl, sphere_geom);
            let s = new IWO.MeshInstance(sphere_mesh, sphere_mat);
            spheres.push(s);
            let model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, 2 * num_rows - k * 2, 0));
        }
    }

}

function update(): void {
    if (keys[87]) camera.processKeyboard(IWO.Camera_Movement.FORWARD, 0.001);
    else if (keys[83]) camera.processKeyboard(IWO.Camera_Movement.BACKWARD, 0.001);
    if (keys[65]) camera.processKeyboard(IWO.Camera_Movement.LEFT, 0.001);
    else if (keys[68]) camera.processKeyboard(IWO.Camera_Movement.RIGHT, 0.001);
    if (keys[82]) camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32]) camera.processKeyboard(IWO.Camera_Movement.UP, 0.001);

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

    for (let sphere of spheres) {
        sphere.render(renderer, view_matrix, proj_matrix);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    grid.render(renderer, view_matrix, proj_matrix);
    gl.disable(gl.BLEND);
}

window.onkeydown = function (e:KeyboardEvent) {
    keys[e.keyCode] = true;
};

window.onkeyup = function (e:KeyboardEvent) {
    keys[e.keyCode] = false;
};

