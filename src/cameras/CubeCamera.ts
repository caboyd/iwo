import {glMatrix, mat4, vec3} from "gl-matrix";


export class CubeCamera{
    
    projection: mat4;
    views: mat4[];
    
    constructor(){

        this.projection = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1.0, 0.1, 10);
        this.views = new Array<mat4>(
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(-1, 0, 0), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, -1, 0), vec3.fromValues(0, 0, -1)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, 1), vec3.fromValues(0, -1, 0)),
            mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, -1), vec3.fromValues(0, -1, 0)),
        );
    }
}