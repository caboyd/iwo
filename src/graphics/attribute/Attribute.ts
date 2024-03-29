import { TypedArray } from "@customtypes/types";
import { ComponentType, GL } from "@graphics/WebglConstants";

export type AttributeFormat<T = string> = {
    readonly name: T;
    readonly createAttribute: (attr?: Partial<Attribute>) => Attribute;
};

export function AttributeGenerator<T extends string>(name: T, attribute?: Partial<Attribute>) {
    return {
        name: name,
        createAttribute: (attr?: Partial<Attribute>) => createAttribute(name, { ...attribute, ...attr }),
    };
}

export function createAttribute(name: string, attr?: Partial<Attribute>): Attribute {
    return {
        ...{
            name: name,
            enabled: true,
            buffer_index: 0,
            component_type: GL.FLOAT,
            component_count: 3,
            normalized: false,
            byte_offset: 0,
            byte_stride: 0,
        },
        ...attr,
    };
}

export interface Attribute {
    name: string;
    enabled: boolean;
    buffer_index: number;
    byte_offset: number;
    byte_stride: number;
    component_type: ComponentType;
    component_count: ComponentCount;
    normalized: boolean;
    divisor?: number;
    buffer?: TypedArray;
}

type ComponentCount = 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12 | 16;

export type Attributes = {
    [key: string]: Attribute;
};

export function typeToComponentCount(type: GLenum): ComponentCount {
    switch (type) {
        case GL.FLOAT_VEC2:
        case GL.UNSIGNED_INT_VEC2:
        case GL.INT_VEC2:
        case GL.BOOL_VEC2:
            return 2;
        case GL.FLOAT_VEC3:
        case GL.UNSIGNED_INT_VEC3:
        case GL.INT_VEC3:
        case GL.BOOL_VEC3:
            return 3;
        case GL.FLOAT_VEC4:
        case GL.UNSIGNED_INT_VEC4:
        case GL.INT_VEC4:
        case GL.BOOL_VEC4:
        case GL.FLOAT_MAT2:
            return 4;
        case GL.FLOAT_MAT2X3:
        case GL.FLOAT_MAT3X2:
            return 6;
        case GL.FLOAT_MAT4X2:
        case GL.FLOAT_MAT2X4:
            return 8;
        case GL.FLOAT_MAT3:
            return 9;
        case GL.FLOAT_MAT3X4:
        case GL.FLOAT_MAT4X3:
            return 12;
        case GL.FLOAT_MAT4:
            return 16;
        default:
            return 1;
    }
}
