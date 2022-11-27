import { TypedArray } from "@customtypes/types";
import { BufferedGeometry } from "@geometry/BufferedGeometry";
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

    public constructor(
        gl: WebGL2RenderingContext,
        geometry: Geometry | BufferedGeometry,
        options?: Partial<MeshOptions>
    ) {
        let buf_geom: BufferedGeometry = geometry as BufferedGeometry;
        if (geometry instanceof Geometry) {
            buf_geom =
                geometry.getBufferedGeometry !== undefined
                    ? geometry.getBufferedGeometry()
                    : BufferedGeometry.fromGeometry(geometry);
        }

        if (options && options.reuse_index_buffer) {
            this.index_buffer = options.reuse_index_buffer;
        } else {
            if (buf_geom.index_buffer !== undefined) this.index_buffer = new IndexBuffer(gl, buf_geom);
        }

        this.vertex_buffer = new VertexBuffer(gl, buf_geom);
        this.vertex_buffer.references.increment();

        this.sub_meshes = [];
        this.draw_mode = buf_geom.draw_mode ?? DrawMode.TRIANGLES;

        this.count = 0;
        if (this.index_buffer) {
            this.count = buf_geom.index_buffer!.buffer.length;
            this.index_buffer.references.increment();
        } else {
            const vertex_attrib = buf_geom.attributes[Object.keys(buf_geom.attributes)[0]];
            const vertex_buffer = buf_geom.buffers[vertex_attrib.buffer_index].buffer;
            let is_interleaved = false;
            let is_concatenated = false;
            for (const a of Object.values(buf_geom.attributes)) {
                if (a.buffer_index !== vertex_attrib.buffer_index) continue;
                if (a.byte_offset !== 0 && a.byte_stride === 0) {
                    is_concatenated = true;
                    break;
                }
                if (a.byte_stride !== 0) is_interleaved = true;
            }
            if (is_concatenated) {
                //the next attribute that shares the buffer with vertex_attrib
                for (let i = 1; i < Object.keys(buf_geom.attributes).length; i++) {
                    const a = Object.values(buf_geom.attributes)[i];
                    if (a.buffer_index === vertex_attrib.buffer_index) {
                        //assumes buffer is full of 4 byte components
                        this.count = a.byte_offset / 4 / vertex_attrib.component_count;
                        break;
                    }
                }
            } else if (is_interleaved) {
                this.count = (vertex_buffer.length / vertex_attrib.byte_stride) * vertex_attrib.component_count;
            } else {
                this.count = vertex_buffer.length / vertex_attrib.component_count;
            }
        }

        this.instances = buf_geom.instances;

        if (buf_geom.groups === undefined || buf_geom.groups.length == 0) {
            this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        } else {
            for (const group of buf_geom.groups) {
                this.count += group.count;
                this.sub_meshes.push(
                    new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
                );
            }
        }
    }

    public setupVAO(gl: WebGL2RenderingContext, program: Shader) {
        this.#inititalized = true;
        this.vertex_buffer.setupVAO(gl, program);
    }

    public updateBuffer(gl: WebGL2RenderingContext, index: number, data: TypedArray) {
        this.vertex_buffer.updateBuffer(gl, index, data);
        gl.bindVertexArray(null);
    }

    //TODO: Complete this
    public updateGeometryBuffer(gl: WebGL2RenderingContext, buf_geom: BufferedGeometry): void {
        // if (buf_geom.index_buffer !== undefined) {
        //     this.index_buffer?.bufferData(gl,buf_geom.index_buffer);
        // }
        this.vertex_buffer.updateBufferData(gl, buf_geom);
        // this.sub_meshes = [];
        // this.draw_mode = buf_geom.draw_mode ?? DrawMode.TRIANGLES;
        // this.count = 0;

        // if (buf_geom.groups === undefined || buf_geom.groups.length == 0) {
        //     //If a geometry has no groups we can assume:
        //     //  count is indices count or vertices count /3
        //     //  material is 0
        //     //  offset is 0
        //     this.count =
        //         buf_geom.index_buffer !== undefined
        //             ? buf_geom.index_buffer.buffer.length
        //             : buf_geom.buffers[buf_geom.attributes[AttributeType.Vertex].buffer_index].buffer.length / 3;
        //     this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        // } else {
        //     for (const group of buf_geom.groups) {
        //         this.count += group.count;
        //         this.sub_meshes.push(
        //             new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
        //         );
        //     }
        // }
    }

    public setDrawMode(mode: DrawMode): void {
        this.draw_mode = mode;
    }

    public destroy(gl: WebGL2RenderingContext): void {
        for (const sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }

        if (this.index_buffer) {
            this.index_buffer.references.decrement();
            this.index_buffer.destroy(gl);
        }
        this.vertex_buffer.references.decrement();
        this.vertex_buffer.destroy(gl);
    }
}
