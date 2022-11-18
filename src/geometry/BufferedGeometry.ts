import { DrawMode, GL } from "@graphics/WebglConstants";
import { Attributes } from "./attribute/Attribute";
import { StandardAttribute } from "./attribute/StandardAttribute";
import { Geometry, Group } from "./Geometry";
import TypedArray = NodeJS.TypedArray;

export interface GeometryBuffer {
    buffer: TypedArray;
    target: typeof GL.ARRAY_BUFFER | typeof GL.ELEMENT_ARRAY_BUFFER | number;
}

export type BufferFormat = "per_attribute" | "concatenated" | "interleaved";

export interface BufferedGeometryOptions {
    buffer_format: BufferFormat;
}

export function getIndexBufferType(buffer: TypedArray) {
    return buffer.BYTES_PER_ELEMENT === 2 ? GL.UNSIGNED_SHORT : GL.UNSIGNED_INT;
}

export class BufferedGeometry {
    public attributes: Attributes;
    public index_buffer?: GeometryBuffer;
    public buffers: GeometryBuffer[];
    public buffer_format?: BufferFormat;
    public groups?: Group[];
    public instances?: number;
    public draw_mode: DrawMode = DrawMode.TRIANGLES;

    public constructor() {
        this.attributes = StandardAttribute.SingleBufferApproach();
        this.buffers = [];
        this.buffer_format = "concatenated";
    }
    public static fromGeometry(geom: Geometry, options?: Partial<BufferedGeometryOptions>): BufferedGeometry {
        const b = new BufferedGeometry();
        b.attributes = StandardAttribute.SingleBufferApproach();
        b.buffer_format = options?.buffer_format ?? b.buffer_format;
        b.buffers = [];
        b.groups = geom.groups;
        b.index_buffer = geom.indices ? { buffer: geom.indices, target: GL.ELEMENT_ARRAY_BUFFER } : undefined;

        for (const [name, array] of geom.attributes) {
            const attr = b.attributes[name];
            if (attr) {
                attr.enabled = true;
            }
        }

        if (b.buffer_format === "interleaved") {
            if (geom.interleaved_attributes)
                b.buffers.push({ buffer: geom.interleaved_attributes, target: GL.ARRAY_BUFFER });
            else {
                throw new Error("Code does not yet exist to interleave a buffer for you");
                //this.setupInterleavedBuffer(geom);
            }
            b.setupStrideOffset(geom);
        } else if (b.buffer_format === "concatenated") {
            b.setupConcatenatedBuffer(geom);
        } else {
        }
        return b;
    }
    //TODO: finish this if i want
    private setupInterleavedBuffer(geom: Geometry): void {
        //loopity loop through everything and put in a float32array
        const len = this.getTotalBufferLength(geom);
        const interleaved_buffer = new Float32Array(len);
    }

    private setupConcatenatedBuffer(geom: Geometry): void {
        //TODO: check if any buffers are duplicates that can be reused with offset

        const len = this.getTotalBufferLength(geom);
        const concat_buffer = new Float32Array(len);

        let byte_offset = 0;
        let offset = 0;

        for (const [name, array] of geom.attributes) {
            const attr = this.attributes[name];
            if (attr) attr.byte_offset = byte_offset;
            concat_buffer.set(array, offset);
            byte_offset += array.byteLength;
            offset += array.length;
        }

        this.buffers.push({ buffer: concat_buffer, target: GL.ARRAY_BUFFER });
    }

    private getTotalBufferLength(geom: Geometry): number {
        let len = 0;
        for (const array of geom.attributes.values()) len += array.length ?? 0;
        return len;
    }

    private setupStrideOffset(geom: Geometry): void {
        let stride = 0;
        //loop and check for enabled
        for (const attr in this.attributes) {
            this.attributes[attr].byte_offset = stride;
            //Note: this should check number of bytes in component
            stride += this.attributes[attr].component_count * 4;
        }

        for (const attr in this.attributes) {
            this.attributes[attr].byte_stride = stride;
        }
    }
}
