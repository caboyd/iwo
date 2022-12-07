/**
 * Created by Chris on Apr, 2019
 *
 * Shader Source Files
 */
import { BasicUnlitShader } from "./BasicUnlitShader";
import { CubemapSpecularPrefilterShader } from "./CubemapSpecularPrefilterShader";
import { CubemapToIrradianceShader } from "./CubemapToIrradianceShader";
import { EquiToCubemapShader } from "./EquiToCubemapShader";
import { LineShader } from "./LineShader";
import { PBRShader } from "./PBRShader";
import { Shader } from "./Shader";

//Shaders may have a subclass defined for custom shader setup
export interface ShaderSource {
    name: string;
    vert: string;
    frag: string;
    subclass: typeof Shader | undefined;
    valid_defines?: Set<ShaderSource.Define>;
    material_defines?: Set<ShaderSource.Define>;
}

//NOTE: Relative import is required for rollup-plugin-node-resolve to resolve these extensions
// @ts-ignore
import standardVert from "../../shaders/standard.vert";
// @ts-ignore
import basic_unlit_frag from "../../shaders/basic_unlit.frag";
// @ts-ignore
import pbrFrag from "../../shaders/pbr.frag";
// @ts-ignore
import normalOnlyFrag from "../../shaders/normals.frag";
// @ts-ignore
import equiToCubemapFrag from "../../shaders/equirectangularToCubemap.frag";
// @ts-ignore
import cubemapToIrradianceFrag from "../../shaders/irradiance.frag";
// @ts-ignore
import cubemapSpecularPrefilterFrag from "../../shaders/specularPrefilter.frag";
// @ts-ignore
import gridVert from "../../shaders/grid.vert";
// @ts-ignore
import gridFrag from "../../shaders/grid.frag";
// @ts-ignore
import brdfVert from "../../shaders/brdf.vert";
// @ts-ignore
import brdfFrag from "../../shaders/brdf.frag";
// @ts-ignore
import lineFrag from "../../shaders/line.frag";
// @ts-ignore
import lineVert from "../../shaders/line.vert";
// @ts-ignore
import depthFrag from "../../shaders/depth_RTT.frag";
// @ts-ignore
import depthVert from "../../shaders/depth_RTT.vert";
// @ts-ignore
import quadFrag from "../../shaders/quad.frag";
// @ts-ignore
import quadVert from "../../shaders/quad.vert";
// @ts-ignore
import toneFrag from "../../shaders/postprocess/tonemapping.frag";
// @ts-ignore
import gaussFrag from "../../shaders/postprocess/gaussianblur.frag";
// @ts-ignore
import toon_frag from "../../shaders/toon.frag";

export namespace ShaderSource {
    export const Defines = ["INSTANCING", "SHADOWS", "FLATSHADING", "BILLBOARD"] as const;
    export type Define = typeof Defines[number];
    export namespace Define {
        export const INSTANCING = Defines[0];
        export const SHADOWS = Defines[1];
        export const FLATSHADING = Defines[2];
        export const BILLBOARD = Defines[3];
    }

    export function toShaderSourceWithDefines(source: ShaderSource, defines?: Set<Define>): ShaderSource {
        if (!source.material_defines && (!defines || !source.valid_defines)) return source;

        let name = source.name;
        let vert = source.vert;
        let frag = source.frag;

        const valid_defines = [];
        if (defines && source.valid_defines)
            for (const d of source.valid_defines.values()) {
                if (defines.has(d)) valid_defines.push(d);
            }
        if (source.material_defines) for (const d of source.material_defines) valid_defines.push(d);

        //DEFINES ALWAYS ALPHABETICAL
        valid_defines.sort((a, b) => a.localeCompare(b));

        let define_str = "";
        for (const d of valid_defines) {
            define_str += `#define ${d}\n`;
            name += `#${d}`;
        }
        vert = vert.replace("#version 300 es\n", `#version 300 es\n${define_str}`);
        frag = frag.replace("#version 300 es\n", `#version 300 es\n${define_str}`);

        const result: ShaderSource = {
            name: name,
            vert: vert,
            frag: frag,
            subclass: source.subclass,
        };
        return result;
    }

    export const BasicUnlit: ShaderSource = {
        name: "BasicUnlitShader",
        vert: standardVert,
        frag: basic_unlit_frag,
        subclass: BasicUnlitShader,
        valid_defines: new Set<Define>([Define.INSTANCING, Define.BILLBOARD]),
    };

    export const Toon: ShaderSource = {
        name: "ToonShader",
        vert: standardVert,
        frag: toon_frag,
        subclass: BasicUnlitShader,
        valid_defines: new Set<Define>([Define.INSTANCING, Define.SHADOWS, Define.FLATSHADING, Define.BILLBOARD]),
    };

    export const PBR: ShaderSource = {
        name: "PBRShader",
        vert: standardVert,
        frag: pbrFrag,
        subclass: PBRShader,
        valid_defines: new Set<Define>([Define.INSTANCING, Define.SHADOWS, Define.BILLBOARD]),
    };

    export const NormalOnly: ShaderSource = {
        name: "NormalOnlyShader",
        vert: standardVert,
        frag: normalOnlyFrag,
        subclass: undefined,
        valid_defines: new Set<Define>([Define.INSTANCING, Define.FLATSHADING, Define.BILLBOARD]),
    };

    export const EquiToCubemap: ShaderSource = {
        name: "EquiToCubemapShader",
        vert: standardVert,
        frag: equiToCubemapFrag,
        subclass: EquiToCubemapShader,
    };

    export const CubemapToIrradiance: ShaderSource = {
        name: "CubemapToIrradianceShader",
        vert: standardVert,
        frag: cubemapToIrradianceFrag,
        subclass: CubemapToIrradianceShader,
    };

    export const CubemapSpecularPrefilter: ShaderSource = {
        name: "CubemapSpecularPrefilter",
        vert: standardVert,
        frag: cubemapSpecularPrefilterFrag,
        subclass: CubemapSpecularPrefilterShader,
    };

    export const Grid: ShaderSource = {
        name: "GridShader",
        vert: gridVert,
        frag: gridFrag,
        subclass: undefined,
    };

    export const BRDF: ShaderSource = {
        name: "BRDFShader",
        vert: brdfVert,
        frag: brdfFrag,
        subclass: undefined,
    };

    export const Line: ShaderSource = {
        name: "LineShader",
        vert: lineVert,
        frag: lineFrag,
        subclass: LineShader,
    };

    export const Depth: ShaderSource = {
        name: "DepthShader",
        vert: depthVert,
        frag: depthFrag,
        subclass: undefined,
    };

    export const Quad: ShaderSource = {
        name: "QuadShader",
        vert: quadVert,
        frag: quadFrag,
        subclass: undefined,
    };

    export const HDR: ShaderSource = {
        name: "HDRShader",
        vert: quadVert,
        frag: toneFrag,
        subclass: undefined,
    };

    export const GuassianBlur: ShaderSource = {
        name: "GuassianBlurShader",
        vert: quadVert,
        frag: gaussFrag,
        subclass: undefined,
    };
}
