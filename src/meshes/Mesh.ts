import { TypedArray } from "@customtypes/types";
import { Geometry } from "@geometry/Geometry";
import { IndexBuffer } from "@graphics/IndexBuffer";
import { Shader } from "@graphics/shader/Shader";
import { VertexBuffer } from "@graphics/VertexBuffer";
import { DrawMode } from "@graphics/WebglConstants";
import { SubMesh } from "./SubMesh";

export type MeshOptions = {
    reuse_index_buffer: IndexBuffer;
};

export class Mesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    public draw_mode: DrawMode;
    public sub_meshes: SubMesh[];
    public count: number;
    public instances?: number;

    #inititalized = false;
    public get initialized(): boolean {
        return this.#inititalized;
    }

    public constructor(gl: WebGL2RenderingContext, geometry: Geometry, options?: Partial<MeshOptions>) {
        this.vertex_buffer = new VertexBuffer(gl, geometry.attributes, geometry.buffers);

        if (options?.reuse_index_buffer) {
            this.index_buffer = options.reuse_index_buffer;
        } else if (geometry.index_buffer !== undefined)
            this.index_buffer = new IndexBuffer(gl, geometry.index_buffer);

        this.sub_meshes = [];
        this.draw_mode = geometry.draw_mode;
        this.count = geometry.count;
        this.instances = geometry.instances;

        if (geometry.groups === undefined || geometry.groups.length == 0) {
            this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        } else {
            for (const group of geometry.groups) {
                this.count += group.count;
                this.sub_meshes.push(
                    new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
                );
            }
        }
    }

    public setupVAO(gl: WebGL2RenderingContext, program: Shader) {
        this.#inititalized = true;
        this.vertex_buffer.bind(gl);
        this.vertex_buffer.setupVAO(gl, program);
        //attach index_buffer
        if (this.index_buffer) {
            this.index_buffer.bind(gl);
        }
        gl.bindVertexArray(null);
    }

    public vertexBufferSubData(gl: WebGL2RenderingContext, index: number, data: TypedArray) {
        this.vertex_buffer.bufferSubData(gl, index, data);
        gl.bindVertexArray(null);
    }

    //TODO: Complete this
    public vertexBufferSubDataFromGeometry(gl: WebGL2RenderingContext, geometry: Geometry): void {
        this.vertex_buffer.bind(gl);
        for (const [index, buffer] of geometry.buffers.entries()) {
            this.vertex_buffer.bufferSubData(gl, index, buffer);
        }
        gl.bindVertexArray(null);
    }

    public setDrawMode(mode: DrawMode): void {
        this.draw_mode = mode;
    }

    public destroy(gl: WebGL2RenderingContext): void {
        for (const sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }
        if (this.index_buffer) {
            this.index_buffer.destroy(gl);
        }
        this.vertex_buffer.destroy(gl);
    }
}
