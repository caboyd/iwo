import { Shader } from "./shader/Shader";
import { UniformBlock } from "./Uniform";
import TypedArray = NodeJS.TypedArray;

const BAD_VALUE = 4294967295;

export class UniformBuffer {
    public id: WebGLBuffer;
    public data: ArrayBuffer;
    public view: Float32Array;
    public map: Map<string, UniformBlock>;
    public name: string;

    public constructor(shader: Shader, uniform_block_name: string) {
        const gl = shader.gl;
        const program = shader.ID;

        this.name = uniform_block_name;
        this.id = gl.createBuffer()!;
        this.map = new Map<string, UniformBlock>();

        const block_index = gl.getUniformBlockIndex(program, this.name);

        //UniformBuffer doesn't exist or was optimized out
        if (block_index === BAD_VALUE) {
            this.data = new ArrayBuffer(0);
            this.view = new Float32Array(this.data);
            return;
        }

        const block_size = gl.getActiveUniformBlockParameter(program, block_index, gl.UNIFORM_BLOCK_DATA_SIZE);
        const indices = gl.getActiveUniformBlockParameter(
            program,
            block_index,
            gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES
        );
        const uniform_offsets = gl.getActiveUniforms(program, indices, gl.UNIFORM_OFFSET);

        this.data = new ArrayBuffer(block_size);
        this.view = new Float32Array(this.data);

        for (const [index, uniform_index] of indices.entries()) {
            const info: WebGLActiveInfo = gl.getActiveUniform(program, uniform_index)!;
            let name = info.name;
            const is_array = info.size > 1 && info.name.substr(-3) === "[0]";
            if (is_array) name = name.substr(0, name.length - 3);
            const byte_size =
                (uniform_offsets[index + 1] ? uniform_offsets[index + 1] : block_size) - uniform_offsets[index];

            this.map.set(
                name,
                new UniformBlock(this.data, info.type, uniform_offsets[index], info.size, byte_size / 4)
            );
        }

        gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
        gl.bufferData(gl.UNIFORM_BUFFER, block_size, gl.DYNAMIC_DRAW);
    }

    public bindShader(shader: Shader, binding: number): void {
        const gl = shader.gl;
        const block_index = gl.getUniformBlockIndex(shader.ID, this.name);
        gl.uniformBlockBinding(shader.ID, block_index, binding);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, this.id);
    }

    public update(gl: WebGL2RenderingContext): void {
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.view);
    }

    public set(uniform_name: string, data: TypedArray | number[] | number): void {
        const uniform_block = this.map.get(uniform_name);
        if (uniform_block) uniform_block.set(data);
    }
}
