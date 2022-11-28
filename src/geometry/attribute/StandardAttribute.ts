import { AttributeGenerator, Attributes } from "./Attribute";

//TODO: Change to match glTF https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshes
export namespace StandardAttribute {
    //matches shader attributes
    export const Names = [
        //vertex must always be first
        "a_vertex",
        "a_tex_coord",
        "a_normal",
        "a_tangent",
        "a_bitangent",
    ] as const;

    export const Position = AttributeGenerator(Names[0]);
    /** @defaults { component_count: 2 }*/
    export const Tex_Coord = AttributeGenerator(Names[1], { component_count: 2 });
    export const Normal = AttributeGenerator(Names[2]);
    export const Tangent = AttributeGenerator(Names[3]);
    export const Bitangent = AttributeGenerator(Names[4]);

    export const SingleBufferApproach = (): Attributes => ({
        [Position.name]: Position.createAttribute(),
        [Tex_Coord.name]: Tex_Coord.createAttribute(),
        [Normal.name]: Normal.createAttribute(),
        [Tangent.name]: Tangent.createAttribute(),
        [Bitangent.name]: Bitangent.createAttribute(),
    });
    export const MultiBufferApproach = (): Attributes => ({
        [Position.name]: Position.createAttribute({ buffer_index: 0 }),
        [Tex_Coord.name]: Tex_Coord.createAttribute({ buffer_index: 1 }),
        [Normal.name]: Normal.createAttribute({ buffer_index: 2 }),
        [Tangent.name]: Tangent.createAttribute({ buffer_index: 3 }),
        [Bitangent.name]: Bitangent.createAttribute({ buffer_index: 4 }),
    });
    export const SeparatePostionPlusInterleavedRemainingApproach = (): Attributes => ({
        [StandardAttribute.Position.name]: StandardAttribute.Position.createAttribute(),
        [StandardAttribute.Tex_Coord.name]: StandardAttribute.Position.createAttribute({
            buffer_index: 1,
            byte_stride: 11 * 4,
            byte_offset: 0 * 4,
        }),
        [StandardAttribute.Normal.name]: StandardAttribute.Position.createAttribute({
            buffer_index: 1,
            byte_stride: 11 * 4,
            byte_offset: 2 * 4,
        }),
        [StandardAttribute.Tangent.name]: StandardAttribute.Position.createAttribute({
            buffer_index: 1,
            byte_stride: 11 * 4,
            byte_offset: 5 * 4,
        }),
        [StandardAttribute.Bitangent.name]: StandardAttribute.Position.createAttribute({
            buffer_index: 1,
            byte_stride: 11 * 4,
            byte_offset: 8 * 4,
        }),
    });
}
