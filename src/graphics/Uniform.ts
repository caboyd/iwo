/*
 * Rewritten and modified by Chris Boyd
 * Copyright (c) 2018 Chris Boyd
 *
 * Original code from:
 * https://github.com/greggman/twgl.js/blob/933df9634c64766f72d92f4f73edfdda138296e1/src/programs.js
 *
 * Copyright 2015, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

export const enum UniformType {
    FLOAT = 0x1406,
    FLOAT_VEC2 = 0x8b50,
    FLOAT_VEC3 = 0x8b51,
    FLOAT_VEC4 = 0x8b52,

    INT = 0x1404,
    INT_VEC2 = 0x8b53,
    INT_VEC3 = 0x8b54,
    INT_VEC4 = 0x8b55,

    UNSIGNED_INT = 0x1405,
    UNSIGNED_INT_VEC2 = 0x8dc6,
    UNSIGNED_INT_VEC3 = 0x8dc7,
    UNSIGNED_INT_VEC4 = 0x8dc8,

    BOOL = 0x8b56,
    BOOL_VEC2 = 0x8b57,
    BOOL_VEC3 = 0x8b58,
    BOOL_VEC4 = 0x8b59,

    FLOAT_MAT2 = 0x8b5a,
    FLOAT_MAT3 = 0x8b5b,
    FLOAT_MAT4 = 0x8b5c,

    FLOAT_MAT2x3 = 0x8b65,
    FLOAT_MAT2x4 = 0x8b66,
    FLOAT_MAT3x2 = 0x8b67,
    FLOAT_MAT3x4 = 0x8b68,
    FLOAT_MAT4x2 = 0x8b69,
    FLOAT_MAT4x3 = 0x8b6a,

    SAMPLER_2D = 0x8b5e,
    SAMPLER_3D = 0x8b5f,
    SAMPLER_CUBE = 0x8b60,
    SAMPLER_2D_SHADOW = 0x8b62,
    SAMPLER_2D_ARRAY = 0x8dc1,
    SAMPLER_2D_ARRAY_SHADOW = 0x8dc4,
    SAMPLER_CUBE_SHADOW = 0x8dc5,
    INT_SAMPLER_2D = 0x8dca,
    INT_SAMPLER_3D = 0x8dcb,
    INT_SAMPLER_CUBE = 0x8dcc,
    INT_SAMPLER_2D_ARRAY = 0x8dcf,
    UNSIGNED_INT_SAMPLER_2D = 0x8dd2,
    UNSIGNED_INT_SAMPLER_3D = 0x8dd3,
    UNSIGNED_INT_SAMPLER_CUBE = 0x8dd4,
    UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8dd7,
}

type TypedArray =
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Float32Array
    | Float64Array;
type TypedArrayConstructor = {
    new (length: number): TypedArray;
    new (arrayOrArrayBuffer: ArrayLike<number> | ArrayBufferLike): TypedArray;
    new (buffer: ArrayBufferLike, byteOffset: number, length?: number): TypedArray;
};

export interface UniformInfo {
    Type: TypedArrayConstructor | undefined;
    size: number;
    items_per_row: number;
    default_rows: number;
    set: (gl: WebGL2RenderingContext, location: WebGLUniformLocation) => (_: any) => void;
    set_array?: (gl: WebGL2RenderingContext, location: WebGLUniformLocation) => (_: any) => void;
}

export class Uniform {
    public readonly set: (_: any) => void;

    public constructor(gl: WebGL2RenderingContext, program: WebGLProgram, info: WebGLActiveInfo) {
        const location = gl.getUniformLocation(program, info.name)!;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const uniform_info = uniform_info_map[info.type as UniformType];
        const is_array = info.size > 1 && info.name.substr(-3) === "[0]";
        if (is_array && uniform_info.set_array !== undefined) {
            this.set = uniform_info.set_array(gl, location);
        } else {
            this.set = uniform_info.set(gl, location);
        }
    }
}

export class UniformBlock {
    public readonly set: (value: TypedArray | number[]) => void;
    private readonly _buffer_view: TypedArray;

    public constructor(buffer: ArrayBuffer, type: UniformType, offset: number, count: number, size: number) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const uniform_info = uniform_info_map[type];
        const total_count = uniform_info.default_rows * count;

        if (!uniform_info.Type) throw new Error("Samplers not allowed in Uniform Buffers");

        //Buffer view as a Typed Array (float/int)
        this._buffer_view = new uniform_info.Type(buffer, offset, size);

        if (total_count > 1 && uniform_info.items_per_row < 4) {
            this.set = setBlockPadded(this._buffer_view, uniform_info.items_per_row, total_count);
        } else {
            this.set = setBlock(this._buffer_view);
        }
    }
}

type UniformInfoMap = { [TKey in UniformType]: UniformInfo };

//prettier-ignore
const uniform_info_map:UniformInfoMap = {
    [UniformType.FLOAT]                         : { Type: Float32Array, size:  4, items_per_row: 1, default_rows: 1, set: setFloat,      set_array: setFloatArray, },
    [UniformType.FLOAT_VEC2]                    : { Type: Float32Array, size:  8, items_per_row: 2, default_rows: 1, set: setVec2Float,  },
    [UniformType.FLOAT_VEC3]                    : { Type: Float32Array, size: 12, items_per_row: 3, default_rows: 1, set: setVec3Float,  },
    [UniformType.FLOAT_VEC4]                    : { Type: Float32Array, size: 16, items_per_row: 4, default_rows: 1, set: setVec4Float,  },
    [UniformType.INT]                           : { Type: Int32Array,   size:  4, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.INT_VEC2]                      : { Type: Int32Array,   size:  8, items_per_row: 2, default_rows: 1, set: setVec2Int,    },
    [UniformType.INT_VEC3]                      : { Type: Int32Array,   size: 12, items_per_row: 3, default_rows: 1, set: setVec3Int,    },
    [UniformType.INT_VEC4]                      : { Type: Int32Array,   size: 16, items_per_row: 4, default_rows: 1, set: setVec4Int,    },
    [UniformType.UNSIGNED_INT]                  : { Type: Uint32Array,  size:  4, items_per_row: 1, default_rows: 1, set: setUint,       set_array: setUintArray, },
    [UniformType.UNSIGNED_INT_VEC2]             : { Type: Uint32Array,  size:  8, items_per_row: 2, default_rows: 1, set: setVec2Uint,   },
    [UniformType.UNSIGNED_INT_VEC3]             : { Type: Uint32Array,  size: 12, items_per_row: 3, default_rows: 1, set: setVec3Uint,   },
    [UniformType.UNSIGNED_INT_VEC4]             : { Type: Uint32Array,  size: 16, items_per_row: 4, default_rows: 1, set: setVec4Uint,   },
    [UniformType.BOOL]                          : { Type: Uint32Array,  size:  4, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.BOOL_VEC2]                     : { Type: Uint32Array,  size:  8, items_per_row: 2, default_rows: 1, set: setVec2Int,    },
    [UniformType.BOOL_VEC3]                     : { Type: Uint32Array,  size: 12, items_per_row: 3, default_rows: 1, set: setVec3Int,    },
    [UniformType.BOOL_VEC4]                     : { Type: Uint32Array,  size: 16, items_per_row: 4, default_rows: 1, set: setVec4Int,    },
    [UniformType.FLOAT_MAT2]                    : { Type: Float32Array, size: 16, items_per_row: 2, default_rows: 2, set: setMat2,  },
    [UniformType.FLOAT_MAT3]                    : { Type: Float32Array, size: 36, items_per_row: 3, default_rows: 3, set: setMat3,  },
    [UniformType.FLOAT_MAT4]                    : { Type: Float32Array, size: 64, items_per_row: 4, default_rows: 4, set: setMat4,  },
    [UniformType.FLOAT_MAT2x3]                  : { Type: Float32Array, size: 24, items_per_row: 3, default_rows: 2, set: setMat2x3, },
    [UniformType.FLOAT_MAT2x4]                  : { Type: Float32Array, size: 32, items_per_row: 4, default_rows: 2, set: setMat2x4, },
    [UniformType.FLOAT_MAT3x2]                  : { Type: Float32Array, size: 24, items_per_row: 2, default_rows: 3, set: setMat3x2, },
    [UniformType.FLOAT_MAT3x4]                  : { Type: Float32Array, size: 48, items_per_row: 4, default_rows: 3, set: setMat3x4, },
    [UniformType.FLOAT_MAT4x2]                  : { Type: Float32Array, size: 32, items_per_row: 2, default_rows: 4, set: setMat4x2, },
    [UniformType.FLOAT_MAT4x3]                  : { Type: Float32Array, size: 48, items_per_row: 3, default_rows: 4, set: setMat4x3, },
    [UniformType.SAMPLER_2D]                    : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_3D]                    : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_CUBE]                  : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_2D_SHADOW]             : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_2D_ARRAY]              : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_2D_ARRAY_SHADOW]       : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.SAMPLER_CUBE_SHADOW]           : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.INT_SAMPLER_2D]                : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.INT_SAMPLER_3D]                : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.INT_SAMPLER_CUBE]              : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.INT_SAMPLER_2D_ARRAY]          : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.UNSIGNED_INT_SAMPLER_2D]       : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.UNSIGNED_INT_SAMPLER_3D]       : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.UNSIGNED_INT_SAMPLER_CUBE]     : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
    [UniformType.UNSIGNED_INT_SAMPLER_2D_ARRAY] : { Type: undefined,    size:  0, items_per_row: 1, default_rows: 1, set: setInt,        set_array: setIntArray, },
};

//std140 layout pads everything to be 16 bytes wide
//so a float array will have 12 bytes padded per
function setBlockPadded(buffer: TypedArray, items_per_row: number, array_count: number) {
    return function(value: TypedArray | number[]): void {
        for (let i = 0; i < array_count; i++) {
            //std140 has 4 items per row
            for (let j = 0; j < items_per_row; j++) {
                buffer[i * 4 + j] = value[i * items_per_row + j];
            }
        }
    };
}

function setBlock(buffer: TypedArray) {
    return function(value: TypedArray | number[]): void {
        buffer.set(value);
    };
}

function setFloat(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: number): void {
        gl.uniform1f(location, value);
    };
}

function setFloatArray(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniform1fv(location, value);
    };
}

function setVec2Float(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniform2fv(location, value);
    };
}

function setVec3Float(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniform3fv(location, value);
    };
}

function setVec4Float(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniform4fv(location, value);
    };
}

function setInt(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: number): void {
        gl.uniform1i(location, value);
    };
}

function setIntArray(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Int32List): void {
        gl.uniform1iv(location, value);
    };
}

function setVec2Int(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Int32List): void {
        gl.uniform2iv(location, value);
    };
}

function setVec3Int(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Int32List): void {
        gl.uniform3iv(location, value);
    };
}

function setVec4Int(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Int32List): void {
        gl.uniform4iv(location, value);
    };
}

function setUint(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: number): void {
        gl.uniform1ui(location, value);
    };
}

function setUintArray(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Uint32List): void {
        gl.uniform1uiv(location, value);
    };
}

function setVec2Uint(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Uint32List): void {
        gl.uniform2uiv(location, value);
    };
}

function setVec3Uint(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Uint32List): void {
        gl.uniform3uiv(location, value);
    };
}

function setVec4Uint(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Uint32List): void {
        gl.uniform4uiv(location, value);
    };
}

function setMat2(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix2fv(location, false, value);
    };
}

function setMat3(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix3fv(location, false, value);
    };
}

function setMat4(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix4fv(location, false, value);
    };
}

function setMat2x3(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix2x3fv(location, false, value);
    };
}

function setMat3x2(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix3x2fv(location, false, value);
    };
}

function setMat2x4(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix2x4fv(location, false, value);
    };
}

function setMat4x2(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix4x2fv(location, false, value);
    };
}

function setMat3x4(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix3x4fv(location, false, value);
    };
}

function setMat4x3(gl: WebGL2RenderingContext, location: WebGLUniformLocation) {
    return function(value: Float32List): void {
        gl.uniformMatrix4x3fv(location, false, value);
    };
}
