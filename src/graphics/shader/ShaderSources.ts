/**
 * Created by Chris on Apr, 2019
 *
 * Shader Source Files
 */
import { BasicShader } from "./BasicShader";
import { Shader } from "./Shader";
import { PBRShader } from "./PBRShader";
import { EquiToCubemapShader } from "./EquiToCubemapShader";
import { CubemapToIrradianceShader } from "./CubemapToIrradianceShader";
import { CubemapSpecularPrefilterShader } from "./CubemapSpecularPrefilterShader";

//Shaders may have a subclass defined for custom shader setup
interface ShaderSource {
    name: string;
    vert: string;
    frag: string;
    subclass: typeof Shader | undefined;
}

// const standardVert: string = require("src/shaders/standard.vert").default;
//
// const basicFrag: string = require("src/shaders/basic.frag").default;
// const pbrFrag: string = require("src/shaders/pbr.frag").default;
// const normalOnlyFrag: string = require("src/shaders/normals.frag").default;
// const equiToCubemapFrag: string = require("src/shaders/equirectangularToCubemap.frag").default;
// const cubemapToIrradianceFrag: string = require("src/shaders/irradiance.frag").default;
// const cubemapSpecularPrefilterFrag: string = require("src/shaders/specularPrefilter.frag").default;
//
// const gridVert: string = require("src/shaders/grid.vert").default;
// const gridFrag: string = require("src/shaders/grid.frag").default;
//
// const brdfVert: string = require("src/shaders/brdf.vert").default;
// const brdfFrag: string = require("src/shaders/brdf.frag").default;

// @ts-ignore
import standardVert from "shaders/standard.vert";
// @ts-ignore
import basicFrag from "shaders/basic.frag";
// @ts-ignore
import pbrFrag from "shaders/pbr.frag";
// @ts-ignore
import normalOnlyFrag from "shaders/normals.frag";
// @ts-ignore
import equiToCubemapFrag from "shaders/equirectangularToCubemap.frag";
// @ts-ignore
import cubemapToIrradianceFrag from "shaders/irradiance.frag";
// @ts-ignore
import cubemapSpecularPrefilterFrag from "shaders/specularPrefilter.frag";
// @ts-ignore
import gridVert from "shaders/grid.vert";
// @ts-ignore
import gridFrag from "shaders/grid.frag";
// @ts-ignore
import brdfVert from "shaders/brdf.vert";
// @ts-ignore
import brdfFrag from "shaders/brdf.frag";

export namespace ShaderSource {
    export const Basic: ShaderSource = {
        name: "BasicShader",
        vert: standardVert,
        frag: basicFrag,
        subclass: BasicShader,
    };

    export const PBR: ShaderSource = {
        name: "PBRShader",
        vert: standardVert,
        frag: pbrFrag,
        subclass: PBRShader,
    };

    export const NormalOnly: ShaderSource = {
        name: "NormalOnlyShader",
        vert: standardVert,
        frag: normalOnlyFrag,
        subclass: undefined,
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
}

export const ShaderSources: ShaderSource[] = Object.values(ShaderSource);
