import { ComponentType } from "graphics/WebglConstants";
import { StandardAttribute } from "./StandardAttribute";
import { LineAttribute } from "./LineAttribute";
import { TypedArray } from "types/types";

export type AttributeType = StandardAttribute.Type | LineAttribute.Type;

export type AttributeFormat = {
    type: AttributeType
    index: number;
    createAttribute: (attr?: Partial<Attribute>) => (Attribute)
}

export function createAttribute(type: AttributeType, attr?: Partial<Attribute>): Attribute {
    return {
        ...{
            type: type,
            enabled: true,
            buffer_index: 0,
            component_type: 5126, //FLOAT
            normalized: false,
            byte_offset: 0,
            byte_stride: 0,
            component_count: 3, //VEC3
        },
        ...attr,
    };
}

export interface Attribute {
    type: AttributeType;
    enabled: boolean;
    buffer_index: number;
    byte_offset: number;
    byte_stride: number;
    component_type: ComponentType;
    component_count: 1 | 2 | 3 | 4 | 9 | 16;
    normalized: boolean;
    buffer?: TypedArray;
}
