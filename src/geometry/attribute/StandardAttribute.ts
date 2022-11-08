import { Attribute, AttributeFormat, createAttribute } from "./Attribute";

//TODO: Change to match glTF https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshes

export namespace StandardAttribute {
    // const _type =  ["Vertex", "Tex_Coord" ,"Normal" ,"Tangent" , "Bitangent"] as const;
    // export type Type = typeof _type[number];
    export enum Type {
        Vertex = "StandardAttribute.Vertex",
        Tex_Coord = "StandardAttribute.Tex_coord",
        Normal = "StandardAttribute.Normal",
        Tangent = "StandardAttribute.Tangent",
        Bitangent = "StandardAttribute.Bitangent",
    }

    export const Vertex: AttributeFormat = {
        type: Type.Vertex,
        index: 0,
        createAttribute: (attr?: Partial<Attribute>) => _Vertex(attr),
    } as const;
    export const Tex_Coord: AttributeFormat = {
        type: Type.Tex_Coord,
        index: 1,
        createAttribute: (attr?: Partial<Attribute>) => _Tex_Coord(attr),
    } as const;
    export const Normal: AttributeFormat = {
        type: Type.Normal,
        index: 2,
        createAttribute: (attr?: Partial<Attribute>) => _Normal(attr),
    } as const;
    export const Tangent: AttributeFormat = {
        type: Type.Tangent,
        index: 3,
        createAttribute: (attr?: Partial<Attribute>) => _Tangent(attr),
    } as const;
    export const Bitangent: AttributeFormat = {
        type: Type.Bitangent,
        index: 4,
        createAttribute: (attr?: Partial<Attribute>) => _Bitangent(attr),
    } as const;

    const _Vertex = (attr?: Partial<Attribute>) => createAttribute(Type.Vertex, attr);
    const _Tex_Coord = (attr?: Partial<Attribute>) =>
        createAttribute(Type.Tex_Coord, { ...{ component_count: 2 }, ...attr });
    const _Normal = (attr?: Partial<Attribute>) => createAttribute(Type.Normal, attr);
    const _Tangent = (attr?: Partial<Attribute>) => createAttribute(Type.Tangent, attr);
    const _Bitangent = (attr?: Partial<Attribute>) => createAttribute(Type.Bitangent, attr);
    export const SingleBufferApproach = () => [
        _Vertex(),
        _Tex_Coord(),
        _Normal(),
        _Tangent({ enabled: false }),
        _Bitangent({ enabled: false }),
    ];
    export const MultiBufferApproach = () => [
        _Vertex({ buffer_index: 0 }),
        _Tex_Coord({ buffer_index: 1 }),
        _Normal({ buffer_index: 2 }),
        _Tangent({ buffer_index: 3, enabled: false }),
        _Bitangent({ buffer_index: 4, enabled: false }),
    ];
}
