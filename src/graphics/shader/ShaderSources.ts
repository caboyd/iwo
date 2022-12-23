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

export interface ShaderSource {
    name: string;
    vert: string;
    frag: string;
    valid_defines?: Set<ShaderSource.Define>;
    material_defines?: Set<ShaderSource.Define>;
    intial_uniforms: Record<string, any>;
}

export namespace ShaderSource {
    export const Defines = ["INSTANCING", "SHADOWS", "FLATSHADING", "BILLBOARD", "BILLBOARD_ROT_Y"] as const;
    export type Define = typeof Defines[number];
    export namespace Define {
        export const INSTANCING = Defines[0];
        export const SHADOWS = Defines[1];
        export const FLATSHADING = Defines[2];
        export const BILLBOARD = Defines[3];
        export const BILLBOARD_ROT_Y = Defines[4];
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
            intial_uniforms: source.intial_uniforms,
        };
        return result;
    }

    const standard_valid_defines = [Define.SHADOWS, Define.INSTANCING, Define.BILLBOARD, Define.BILLBOARD_ROT_Y];

    export const BasicUnlit: ShaderSource = {
        name: "BasicUnlitShader",
        vert: standardVert,
        frag: basic_unlit_frag,
        valid_defines: new Set<Define>(standard_valid_defines),
        intial_uniforms: { "u_material.albedo_sampler": 0 },
    };

    export const Toon: ShaderSource = {
        name: "ToonShader",
        vert: standardVert,
        frag: toon_frag,
        valid_defines: new Set<Define>(standard_valid_defines).add(Define.FLATSHADING),
        intial_uniforms: { "u_material.albedo_sampler": 0 },
    };

    export const PBR: ShaderSource = {
        name: "PBRShader",
        vert: standardVert,
        frag: pbrFrag,
        valid_defines: new Set<Define>(standard_valid_defines),
        intial_uniforms: {
            //gamma: 2.2,
            "u_material.albedo_sampler": 0,
            "u_material.irradiance_sampler": 1,
            "u_material.env_sampler": 2,
            "u_material.normal_sampler": 3,
            "u_material.occlusion_sampler": 4,
            "u_material.metal_roughness_sampler": 5,
            "u_material.emissive_sampler": 6,
            "u_material.shadow_map_sampler": 7,
            "u_material.brdf_LUT_sampler": 8,
        },
    };

    export const NormalOnly: ShaderSource = {
        name: "NormalOnlyShader",
        vert: standardVert,
        frag: normalOnlyFrag,
        valid_defines: new Set<Define>(standard_valid_defines).add(Define.FLATSHADING),
        intial_uniforms: {},
    };

    export const EquiToCubemap: ShaderSource = {
        name: "EquiToCubemapShader",
        vert: standardVert,
        frag: equiToCubemapFrag,
        intial_uniforms: { equirectangular_map: 0 },
    };

    export const CubemapToIrradiance: ShaderSource = {
        name: "CubemapToIrradianceShader",
        vert: standardVert,
        frag: cubemapToIrradianceFrag,
        intial_uniforms: { equirectangular_map: 0 },
    };

    export const CubemapSpecularPrefilter: ShaderSource = {
        name: "CubemapSpecularPrefilter",
        vert: standardVert,
        frag: cubemapSpecularPrefilterFrag,
        intial_uniforms: { equirectangular_map: 0 },
    };

    export const Grid: ShaderSource = {
        name: "GridShader",
        vert: gridVert,
        frag: gridFrag,
        intial_uniforms: {},
    };

    export const BRDF: ShaderSource = {
        name: "BRDFShader",
        vert: brdfVert,
        frag: brdfFrag,
        intial_uniforms: {},
    };

    export const Line: ShaderSource = {
        name: "LineShader",
        vert: lineVert,
        frag: lineFrag,
        intial_uniforms: {},
    };

    export const Depth: ShaderSource = {
        name: "DepthShader",
        vert: depthVert,
        frag: depthFrag,
        intial_uniforms: {},
    };

    export const Quad: ShaderSource = {
        name: "QuadShader",
        vert: quadVert,
        frag: quadFrag,
        intial_uniforms: {},
    };

    export const HDR: ShaderSource = {
        name: "HDRShader",
        vert: quadVert,
        frag: toneFrag,
        intial_uniforms: {},
    };

    export const GuassianBlur: ShaderSource = {
        name: "GuassianBlurShader",
        vert: quadVert,
        frag: gaussFrag,
        intial_uniforms: {},
    };
}
