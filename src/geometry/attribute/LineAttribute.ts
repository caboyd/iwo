import { Attribute, AttributeFormat, createAttribute } from "./Attribute";

export namespace LineAttribute {
    export enum Name {
        position = "position",
        point_a = "point_a",
        point_b = "point_b",
        color_a = "color_a",
        color_b = "color_b",
    }

    export const position: AttributeFormat = {
        name: Name.position,
        createAttribute: (attr?: Partial<Attribute>) => _Position(attr),
    } as const;
    export const point_a: AttributeFormat = {
        name: Name.point_a,
        createAttribute: (attr?: Partial<Attribute>) => _Point_A(attr),
    } as const;
    export const point_b: AttributeFormat = {
        name: Name.point_b,
        createAttribute: (attr?: Partial<Attribute>) => _Point_B(attr),
    } as const;
    export const color_a: AttributeFormat = {
        name: Name.color_a,
        createAttribute: (attr?: Partial<Attribute>) => _Color_A(attr),
    } as const;
    export const color_b: AttributeFormat = {
        name: Name.color_b,
        createAttribute: (attr?: Partial<Attribute>) => _Color_B(attr),
    } as const;
    export const _Position = (attr?: Partial<Attribute>) => createAttribute(Name.position, attr);
    export const _Point_A = (attr?: Partial<Attribute>) => createAttribute(Name.point_a, attr);
    export const _Point_B = (attr?: Partial<Attribute>) => createAttribute(Name.point_b, attr);
    export const _Color_A = (attr?: Partial<Attribute>) => createAttribute(Name.color_a, attr);
    export const _Color_B = (attr?: Partial<Attribute>) => createAttribute(Name.color_b, attr);
    export const SingleBufferApproach = () => ({
        [position.name]: _Position(),
        [point_a.name]: _Point_A(),
        [point_b.name]: _Point_B(),
        [color_a.name]: _Color_A(),
        [color_b.name]: _Color_B(),
    });
    export const MultiBufferApproach = () => ({
        [position.name]: _Position({ buffer_index: 0 }),
        [point_a.name]: _Point_A({ buffer_index: 1 }),
        [point_b.name]: _Point_B({ buffer_index: 2 }),
        [color_a.name]: _Color_A({ buffer_index: 3 }),
        [color_b.name]: _Color_B({ buffer_index: 4 }),
    });
}
