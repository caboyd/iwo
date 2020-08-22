import { AttributeType, Geometry, Group } from "geometry/Geometry";
import { glComponentType } from "graphics/WebglConstants";
import TypedArray = NodeJS.TypedArray;

//Default assumes index buffer is buffer_view_index 0
export namespace DefaultAttribute {
    export const Vertex = (): Attribute => {
        return {
            data_type: "VEC3",
            type: AttributeType.Vertex,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, // FLOAT
            component_count: 3,
        };
    };
    export const Tex_Coord = (): Attribute => {
        return {
            type: AttributeType.Tex_Coord,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, // FLOAT
            component_count: 2,
            data_type: "VEC2",
        };
    };
    export const Normal = (): Attribute => {
        return {
            type: AttributeType.Normal,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, // FLOAT
            component_count: 3,
            data_type: "VEC3",
        };
    };
    export const Tangent = (): Attribute => {
        return {
            type: AttributeType.Tangent,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, // FLOAT
            component_count: 3,
            data_type: "VEC3",
        };
    };
    export const Bitangent = (): Attribute => {
        return {
            type: AttributeType.Bitangent,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, // FLOAT
            component_count: 3,
            data_type: "VEC3",
        };
    };

    export const SingleBufferApproach = (): Attribute[] => {
        return [
            DefaultAttribute.Vertex(),
            DefaultAttribute.Tex_Coord(),
            DefaultAttribute.Normal(),
            DefaultAttribute.Tangent(),
            DefaultAttribute.Bitangent(),
        ];
    };
    export const MultiBufferApproach = (): Attribute[] => {
        return [
            { ...DefaultAttribute.Vertex(), ...{ buffer_index: 0 } },
            { ...DefaultAttribute.Tex_Coord(), ...{ buffer_index: 1 } },
            { ...DefaultAttribute.Normal(), ...{ buffer_index: 2 } },
            { ...DefaultAttribute.Tangent(), ...{ buffer_index: 3 } },
            { ...DefaultAttribute.Bitangent(), ...{ buffer_index: 4 } },
        ];
    };
}

/*

 */
export interface Attribute {
    type: AttributeType;
    enabled?: boolean;
    buffer_index: number;
    byte_offset?: number;
    byte_stride?: number;
    // eslint-disable-next-line prettier/prettier
    component_type: glComponentType;
    component_count: 1 | 2 | 3 | 4 | 9 | 16;
    //SCALAR | VEC2 | VEC3 | VEC4 | MAT2 | MAT3 | MAT4
    data_type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
    normalized?: boolean;
}

export interface GeometryBuffer {
    buffer: TypedArray;
    //ARRAY_BUFFER | ELEMENT_ARRAY_BUFFER
    target: 34962 | 34963;
}

export interface BufferedGeometry {
    attributes: Attribute[];
    index_buffer?: GeometryBuffer;
    buffers: GeometryBuffer[];
    groups: Group[];

    //Bounding Sphere

    //Bounding Box (AABB)
}

export function isBufferedGeometry(object: any): object is BufferedGeometry {
    return "buffers" in object && "attributes" in object && "groups" in object;
}

export interface BufferedGeometryOptions {
    interleave_buffer?: boolean;
}

export class BufferedGeometry {
    public attributes: Attribute[];
    public index_buffer?: GeometryBuffer;
    public buffers: GeometryBuffer[];
    public groups: Group[];

    public constructor(geom: Geometry, options?: BufferedGeometryOptions) {
        this.attributes = DefaultAttribute.SingleBufferApproach();
        this.buffers = [];
        this.groups = geom.groups;
        this.index_buffer = geom.indices ? { buffer: geom.indices, target: 34963 } : undefined;

        this.setupAttributes(geom);

        if (options?.interleave_buffer === true) {
            if (geom.interleaved_attributes) this.buffers.push({ buffer: geom.interleaved_attributes, target: 34962 });
            else {
                throw new Error("Code does not yet exist to interleave a buffer for you");
                //this.setupInterleavedBuffer(geom);
            }
            this.setupStrideOffset(geom);
        } else {
            this.setupConcatenatedBuffer(geom);
        }
    }

    //TODO: finish this if i want
    private setupInterleavedBuffer(geom: Geometry): void {
        //loopity loop through everything and put in a float32array
        const len = this.getTotalBufferLength(geom);
        const interleaved_buffer = new Float32Array(len);
    }

    private setupAttributes(geom: Geometry): void {
        this.attributes[0].enabled = geom.attributes.has(AttributeType.Vertex);
        this.attributes[1].enabled = geom.attributes.has(AttributeType.Tex_Coord);
        this.attributes[2].enabled = geom.attributes.has(AttributeType.Normal);
        this.attributes[3].enabled = geom.attributes.has(AttributeType.Tangent);
        this.attributes[4].enabled = geom.attributes.has(AttributeType.Bitangent);
    }

    private setupConcatenatedBuffer(geom: Geometry): void {
        //TODO: check if any buffers are duplicates that can be reused with offset

        const len = this.getTotalBufferLength(geom);
        const concat_buffer = new Float32Array(len);

        let offset = 0;
        let previous_buffers_length = 0;
        if (geom.attributes.has(AttributeType.Vertex)) {
            const arr = geom.attributes.get(AttributeType.Vertex)!;
            this.attributes[1].byte_offset = offset += arr.byteLength;
            concat_buffer.set(arr, previous_buffers_length);
            previous_buffers_length += arr.length;
        }
        if (geom.attributes.has(AttributeType.Tex_Coord)) {
            const arr = geom.attributes.get(AttributeType.Tex_Coord)!;
            this.attributes[2].byte_offset = offset += geom.attributes.get(AttributeType.Tex_Coord)!.byteLength;
            concat_buffer.set(arr, previous_buffers_length);
            previous_buffers_length += arr.length;
        }

        if (geom.attributes.has(AttributeType.Normal)) {
            const arr = geom.attributes.get(AttributeType.Normal)!;
            this.attributes[3].byte_offset = offset += geom.attributes.get(AttributeType.Normal)!.byteLength;
            concat_buffer.set(arr, previous_buffers_length);
            previous_buffers_length += arr.length;
        }

        if (geom.attributes.has(AttributeType.Tangent)) {
            const arr = geom.attributes.get(AttributeType.Tangent)!;
            this.attributes[4].byte_offset = offset += geom.attributes.get(AttributeType.Tangent)!.byteLength;
            concat_buffer.set(arr, previous_buffers_length);
            previous_buffers_length += arr.length;
        }
        if (geom.attributes.has(AttributeType.Bitangent)) {
            const arr = geom.attributes.get(AttributeType.Bitangent)!;
            concat_buffer.set(arr, previous_buffers_length);
        }

        this.buffers.push({ buffer: concat_buffer, target: 34962 });
    }

    private getTotalBufferLength(geom: Geometry): number {
        let len = 0;
        for (const value of geom.attributes.values()) len += value.length;
        return len;
    }

    private setupStrideOffset(geom: Geometry): void {
        let stride = 0;
        if (geom.attributes.has(AttributeType.Vertex)) stride += 12;
        if (geom.attributes.has(AttributeType.Tex_Coord)) {
            this.attributes[1].byte_offset = stride;
            stride += 8;
        }
        if (geom.attributes.has(AttributeType.Normal)) {
            this.attributes[2].byte_offset = stride;
            stride += 12;
        }
        if (geom.attributes.has(AttributeType.Tangent)) {
            this.attributes[3].byte_offset = stride;
            stride += 12;
        }
        if (geom.attributes.has(AttributeType.Bitangent)) {
            this.attributes[4].byte_offset = stride;
            stride += 12;
        }
        this.attributes[0].byte_stride = this.attributes[1].byte_stride = this.attributes[2].byte_stride = this.attributes[3].byte_stride = this.attributes[4].byte_stride = stride;
    }
}
