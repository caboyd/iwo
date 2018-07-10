import { AttributeType } from "src/geometry/Geometry";
import { ReferenceCounter } from "../helpers/ReferenceCounter";

export interface VertexBuffer {
    //
    attribute_flags: number;

    //Raw vertex data ie. Float32Array
    attributes: Map<AttributeType, ArrayBufferView>;

    //Separate buffers per vertex data type
    attribute_buffers: Map<AttributeType, WebGLBuffer>;

    //Interleaved VBO
    VBO: WebGLBuffer | undefined;

    readonly interleaved: boolean;
    readonly references: ReferenceCounter;

    destroy(gl: WebGL2RenderingContext): void;
}
