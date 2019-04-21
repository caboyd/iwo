import { IndexBuffer } from "src/graphics/IndexBuffer";
import { VertexBuffer } from "src/graphics/VertexBuffer";

export class SubMesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    //Offset in the index/vertex buffer
    public readonly offset: number;
    //Number of indices/vertices to draw
    public readonly count: number;
    //Material index reference the material of the mesh instance
    public readonly material_index: number;

    constructor(
        material_index: number,
        offset: number,
        count: number,
        vertex_buffer: VertexBuffer,
        index_buffer: IndexBuffer | undefined
    ) {
        this.index_buffer = index_buffer;
        this.vertex_buffer = vertex_buffer;
        this.offset = offset;
        this.count = count;
        this.material_index = material_index;

        this.vertex_buffer.references.increment();
        if (this.index_buffer) this.index_buffer.references.increment();
    }

    destroy(): void {
        this.vertex_buffer.references.decrement();
        if (this.index_buffer) this.index_buffer.references.decrement();
    }
}
