export const enum DrawMode {
    POINTS = 0x0000,
    LINES = 0x0001,
    LINE_LOOP = 0x0002,
    LINE_STRIP = 0x0003,
    TRIANGLES = 0x0004,
    TRIANGLE_STRIP = 0x0005,
    TRIANGLE_FAN = 0x0006,
}

// eslint-disable-next-line prettier/prettier
export type ComponentType = 5120 | 5121             | 5122  | 5123              | 5124  | 5125          | 5126 | number;
//                          BYTE | UNSIGNED_BYTE    | SHORT | UNSIGNED_SHORT    | INT   | UNSIGNED_INT  | FLOAT

export type ComponentFormatType = "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4" | string;
