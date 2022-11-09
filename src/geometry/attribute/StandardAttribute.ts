import { Attribute, AttributeFormat, createAttribute } from "./Attribute";

//TODO: Change to match glTF https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshes

export namespace StandardAttribute {
    // const _type =  ["Vertex", "Tex_Coord" ,"Normal" ,"Tangent" , "Bitangent"] as const;
    // export type Type = typeof _type[number];
    export enum Name {
        Vertex = "a_vertex",
        Tex_Coord = "a_tex_coord",
        Normal = "a_normal",
        Tangent = "a_tangent",
        Bitangent = "a_bitangent",
    }

    export const Vertex: AttributeFormat = {
        name: Name.Vertex,
        createAttribute: (attr?: Partial<Attribute>) => _Vertex(attr),
    } as const;
    export const Tex_Coord: AttributeFormat = {
        name: Name.Tex_Coord,
        createAttribute: (attr?: Partial<Attribute>) => _Tex_Coord(attr),
    } as const;
    export const Normal: AttributeFormat = {
        name: Name.Normal,
        createAttribute: (attr?: Partial<Attribute>) => _Normal(attr),
    } as const;
    export const Tangent: AttributeFormat = {
        name: Name.Tangent,
        createAttribute: (attr?: Partial<Attribute>) => _Tangent(attr),
    } as const;
    export const Bitangent: AttributeFormat = {
        name: Name.Bitangent,
        createAttribute: (attr?: Partial<Attribute>) => _Bitangent(attr),
    } as const;

    const _Vertex = (attr?: Partial<Attribute>) => createAttribute(Name.Vertex, attr);
    const _Tex_Coord = (attr?: Partial<Attribute>) =>
        createAttribute(Name.Tex_Coord, { ...{ component_count: 2 }, ...attr });
    const _Normal = (attr?: Partial<Attribute>) => createAttribute(Name.Normal, attr);
    const _Tangent = (attr?: Partial<Attribute>) => createAttribute(Name.Tangent, attr);
    const _Bitangent = (attr?: Partial<Attribute>) => createAttribute(Name.Bitangent, attr);
    export const SingleBufferApproach = () => ({
        [Vertex.name]: _Vertex(),
        [Tex_Coord.name]: _Tex_Coord(),
        [Normal.name]: _Normal(),
        [Tangent.name]: _Tangent({ enabled: false }),
        [Bitangent.name]: _Bitangent({ enabled: false }),
    });
    export const MultiBufferApproach = () => ({
        [Vertex.name]: _Vertex({ buffer_index: 0 }),
        [Tex_Coord.name]: _Tex_Coord({ buffer_index: 1 }),
        [Normal.name]: _Normal({ buffer_index: 2 }),
        [Tangent.name]: _Tangent({ buffer_index: 3, enabled: false }),
        [Bitangent.name]: _Bitangent({ buffer_index: 4, enabled: false }),
    });
}
