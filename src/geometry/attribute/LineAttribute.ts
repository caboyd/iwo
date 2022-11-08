import { Attribute, AttributeFormat, createAttribute } from "./Attribute";

export namespace LineAttribute {
    export enum Type {
        position = "LineAttribute.position",
        point_a = "LineAttribute.point_a",
        point_b = "LineAttribute.point_b",
        color_a = "LineAttribute.color_a",
        color_b = "LineAttribute.color_b",
    }

    export const position: AttributeFormat = {
        type: Type.position,
        index: 0,
        createAttribute: (attr?: Partial<Attribute>) => _Position(attr),
    } as const;
    export const point_a: AttributeFormat = {
        type: Type.point_a,
        index: 1,
        createAttribute: (attr?: Partial<Attribute>) => _Point_A(attr),
    } as const;
    export const point_b: AttributeFormat = {
        type: Type.point_b,
        index: 2,
        createAttribute: (attr?: Partial<Attribute>) => _Point_B(attr),
    } as const;
    export const color_a: AttributeFormat = {
        type: Type.color_a,
        index: 3,
        createAttribute: (attr?: Partial<Attribute>) => _Color_A(attr),
    } as const;
    export const color_b: AttributeFormat = {
        type: Type.color_b,
        index: 4,
        createAttribute: (attr?: Partial<Attribute>) => _Color_B(attr),
    } as const;
    export const _Position = (attr?: Partial<Attribute>) => createAttribute(Type.position, attr);
    export const _Point_A = (attr?: Partial<Attribute>) => createAttribute(Type.point_a, attr);
    export const _Point_B = (attr?: Partial<Attribute>) => createAttribute(Type.point_b, attr);
    export const _Color_A = (attr?: Partial<Attribute>) => createAttribute(Type.color_a, attr);
    export const _Color_B = (attr?: Partial<Attribute>) => createAttribute(Type.color_b, attr);
    export const SingleBufferApproach = () => [_Position(), _Point_A(), _Point_B(), _Color_A(), _Color_B()];
    export const MultiBufferApproach = () => [
        _Position({ buffer_index: 0 }),
        _Point_A({ buffer_index: 1 }),
        _Point_B({ buffer_index: 2 }),
        _Color_A({ buffer_index: 3 }),
        _Color_B({ buffer_index: 4 }),
    ];
}
