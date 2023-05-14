import { Uniform } from "../Uniform";

export class Shader {
    public uniforms: Map<string, Uniform>;
    public readonly ID: WebGLProgram;
    public readonly gl: WebGL2RenderingContext;

    public constructor(gl: WebGL2RenderingContext, vertexSourceCode: string, fragmentSourceCode: string) {
        this.gl = gl;

        const vertexShader: WebGLShader = Shader.getCompiledShader(gl, vertexSourceCode, gl.VERTEX_SHADER);
        const fragmentShader: WebGLShader = Shader.getCompiledShader(gl, fragmentSourceCode, gl.FRAGMENT_SHADER);

        this.ID = gl.createProgram()!;
        gl.attachShader(this.ID, vertexShader);
        gl.attachShader(this.ID, fragmentShader);
        gl.linkProgram(this.ID);

        //flag for deletion on cleanup
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader)

        if (!gl.getProgramParameter(this.ID, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }

        this.uniforms = new Map<string, Uniform>();
        this.initUniforms();
    }

    public initUniforms(): void {
        const gl = this.gl;
        const num_uniforms = gl.getProgramParameter(this.ID, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < num_uniforms; i++) {
            const info: WebGLActiveInfo = gl.getActiveUniform(this.ID, i)!;
            this.uniforms.set(info.name, new Uniform(gl, this.ID, info));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public setUniform(name: string, value: any | any[]): void {
        const uniform = this.uniforms.get(name);
        if (uniform) uniform.set(value);
    }

    public delete(): void {
        this.gl.deleteProgram(this.ID);
    }

    public use(): void {
        this.gl.useProgram(this.ID);
    }

    public setUniforms(uniforms: Map<string, any>): void {
        for (let [name, value] of uniforms) {
            if (value) this.setUniform(name, value);
        }
    }

    public setUniformsRecord(uniforms: Record<string, any>): void {
        for (let name in uniforms) {
            const value = uniforms[name];
            if (value) this.setUniform(name, value);
        }
    }

    private static getCompiledShader(gl: WebGL2RenderingContext, sourceCode: string, type: number): WebGLShader {
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
