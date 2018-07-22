import {mat3, mat4, vec3, vec4} from "gl-matrix";
import {Renderer} from "./Renderer";

let view_matrix3x3:mat3 = mat3.create();
let modelview_matrix:mat4 = mat4.create();
let normalview_matrix:mat3 = mat3.create();
let mvp_matrix:mat4 = mat4.create();


export class Shader {
    public uniforms: Map<String, WebGLUniformLocation>;
    public attributes: Map<String, GLint>;
    protected readonly ID: WebGLProgram;
    protected gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext, vertexSourceCode: string, fragmentSourceCode: string) {
        this.gl = gl;

        let vertexShader: WebGLShader = this.getShader(gl, vertexSourceCode, gl.VERTEX_SHADER);
        let fragmentShader: WebGLShader = this.getShader(gl, fragmentSourceCode, gl.FRAGMENT_SHADER);

        this.ID = gl.createProgram()!;
        gl.attachShader(this.ID, vertexShader);
        gl.attachShader(this.ID, fragmentShader);
        gl.linkProgram(this.ID);

        if (!gl.getProgramParameter(this.ID, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }

        this.uniforms = new Map<String, WebGLUniformLocation>();
        this.attributes = new Map<String, GLint>();
    }
    
    public setModelViewBlock(model_matrix:mat4, normal_matrix:mat3, view_matrix:mat4, proj_matrix:mat4):void{
        //Model view matrix
        mat4.mul(modelview_matrix, view_matrix, model_matrix);

        //Normal matrix in view space
        mat3.mul(normalview_matrix, view_matrix3x3, normal_matrix);

        //MVP Matrix
        mat4.mul(mvp_matrix, proj_matrix, modelview_matrix);

        this.setMat4ByName("u_model_matrix", model_matrix);
        this.setMat4ByName("u_modelview_matrix", modelview_matrix);
        this.setMat3ByName("u_normalview_matrix", normalview_matrix);
        this.setMat4ByName("u_mvp_matrix", mvp_matrix);
    }
    
    public setViewProjBlock(view_matrix:mat4, proj_matrix:mat4):void{
        mat4.mul(mvp_matrix, proj_matrix, view_matrix);
        this.setMat4ByName("u_view_matrix", view_matrix);
        this.setMat4ByName("u_proj_matrix", proj_matrix);
        this.setMat3ByName("u_vp_matrix", mvp_matrix);
    }

    public delete(): void {
        this.gl.deleteShader(this.ID);
        delete this.uniforms;
        delete this.attributes;
    }

    public use(): void {
        this.gl.useProgram(this.ID);
    }

    public setAttributes(attr: string[]): void {
        this.use();

        for (let a of attr) {
            this.attributes.set(a, this.gl.getAttribLocation(this.ID, a));
        }
    }

    public setUniforms(uniforms: Map<string, any>): void {
        this.use();

        for (let [name, value] of uniforms) {
            if (value) this.setAny(name, value);
        }
    }

    public getUniformLocation(name: string): WebGLUniformLocation {
        let a = this.uniforms.get(name);
        if (a === undefined) {
            a = this.gl.getUniformLocation(this.ID, name)!;
            this.uniforms.set(name, a);
        }
        return a;
    }

    public getAttribLocation(name: string): GLint {
        let a = this.attributes.get(name);
        if (a === undefined) a = this.gl.getAttribLocation(this.ID, name);
        return a;
    }

    public setBool(id: number | WebGLUniformLocation, value: boolean): void {
        this.gl.uniform1i(id, value ? 1 : 0);
    }

    public setBoolByName(name: string, value: boolean): void {
        this.gl.uniform1i(this.getUniformLocation(name), value ? 1 : 0);
    }

    public setInt(id: number | WebGLUniformLocation, value: number): void {
        this.gl.uniform1i(id, value);
    }

    public setIntByName(name: string, value: number): void {
        this.gl.uniform1i(this.getUniformLocation(name), value);
    }

    public setIntV(id: number | WebGLUniformLocation, value: number[]): void {
        this.gl.uniform1iv(id, value);
    }

    public setIntVByName(name: string, value: number[] | Float32Array): void {
        this.gl.uniform1iv(this.getUniformLocation(name), value);
    }

    public setFloat(id: number | WebGLUniformLocation, value: number): void {
        this.gl.uniform1f(id, value);
    }

    public setFloatByName(name: string, value: number): void {
        this.gl.uniform1f(this.getUniformLocation(name), value);
    }

    public setMat4(id: number | WebGLUniformLocation, matrix: mat4 | number[] | Float32Array): void {
        this.gl.uniformMatrix4fv(id, false, matrix);
    }

    public setMat4ByName(name: string, matrix: mat4 | number[] | Float32Array): void {
        this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, matrix);
    }

    public setMat3(id: number | WebGLUniformLocation, matrix: mat4 | number[] | Float32Array): void {
        this.gl.uniformMatrix3fv(id, false, matrix);
    }

    public setMat3ByName(name: string, matrix: mat4 | number[] | Float32Array): void {
        this.gl.uniformMatrix3fv(this.getUniformLocation(name), false, matrix);
    }

    public setVec3(id: number | WebGLUniformLocation, vec: vec3 | number[] | Float32Array): void {
        this.gl.uniform3fv(id, vec);
    }

    public setVec3ByName(name: string, vec: vec3 | number[] | Float32Array): void {
        this.gl.uniform3fv(this.getUniformLocation(name), vec);
    }

    public setVec4(id: number | WebGLUniformLocation, vec: vec4 | number[] | Float32Array): void {
        this.gl.uniform4fv(id, vec);
    }

    public setVec4ByName(name: string, vec: vec4 | number[] | Float32Array): void {
        this.gl.uniform4fv(this.getUniformLocation(name), vec);
    }

    public setAny(name: string, value: any): void {
        let uniform = this.getUniformLocation(name);
        if (typeof value === "number") {
            this.setFloat(uniform, value);
        } else if (value === "boolean") {
            this.setBool(uniform, value);
        } else if (value instanceof Float32Array) {
            if (value.length == 3) this.setVec3(uniform, value);
            if (value.length == 4) this.setVec4(uniform, value);
            if (value.length == 16) this.setMat4(uniform, value);
        }
    }

    private getShader(gl: WebGL2RenderingContext, sourceCode: string, type: number): WebGLShader {
        let shader: WebGLShader;
        shader = gl.createShader(type)!;

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
        }
        return shader;
    }
}
