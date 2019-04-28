/**
 * Created by Chris on Apr, 2019
 *
 * Shader Source Files
 */
import {BasicShader} from "./BasicShader";
import {Shader} from "./Shader";
import {PBRShader} from "./PBRShader";
import {EquiToCubemapShader} from "./EquiToCubemapShader";
import {CubemapToIrradianceShader} from "./CubemapToIrradianceShader";
import {CubemapSpecularPrefilterShader} from "./CubemapSpecularPrefilterShader";

//Shaders may have a subclass defined for custom shader setup
interface ShaderSource {
    name: string,
    vert: string,
    frag: string,
    subclass: typeof Shader | undefined;
}

let standardVert: string = require("src/shaders/standard.vert").default;

let basicFrag: string = require("src/shaders/basic.frag").default;
let pbrFrag: string = require("src/shaders/pbr.frag").default;
let normalOnlyFrag: string = require("src/shaders/normals.frag").default;
let equiToCubemapFrag: string = require("src/shaders/equirectangularToCubemap.frag").default;
let cubemapToIrradianceFrag: string = require("src/shaders/irradiance.frag").default;
let cubemapSpecularPrefilterFrag: string = require("src/shaders/specularPrefilter.frag").default;


let gridVert: string = require("src/shaders/grid.vert").default;
let gridFrag: string = require("src/shaders/grid.frag").default;

let brdfVert: string = require("src/shaders/brdf.vert").default;
let brdfFrag: string = require("src/shaders/brdf.frag").default;



export namespace ShaderSource {
    export let Basic: ShaderSource = {
        name: "BasicShader",
        vert: standardVert,
        frag: basicFrag,
        subclass: BasicShader
    };

    export let PBR: ShaderSource = {
        name: "PBRShader",
        vert: standardVert,
        frag: pbrFrag,
        subclass: PBRShader,
    };

    export let NormalOnly: ShaderSource = {
        name: "NormalOnlyShader",
        vert: standardVert,
        frag: normalOnlyFrag,
        subclass: undefined,
    };

    export let EquiToCubemap: ShaderSource = {
        name: "EquiToCubemapShader",
        vert: standardVert,
        frag: equiToCubemapFrag,
        subclass: EquiToCubemapShader,
    };

    export let CubemapToIrradiance: ShaderSource = {
        name: "CubemapToIrradianceShader",
        vert: standardVert,
        frag: cubemapToIrradianceFrag,
        subclass: CubemapToIrradianceShader,
    };

    export let CubemapSpecularPrefilter: ShaderSource = {
        name: "CubemapSpecularPrefilter",
        vert: standardVert,
        frag: cubemapSpecularPrefilterFrag,
        subclass: CubemapSpecularPrefilterShader,
    };

    export let Grid: ShaderSource = {
        name: "GridShader",
        vert: gridVert,
        frag: gridFrag,
        subclass: undefined,
    };
    
    export let BRDF: ShaderSource = {
        name: "BRDFShader",
        vert: brdfVert,
        frag: brdfFrag,
        subclass: undefined
    }
}


export let ShaderSources: ShaderSource[] = Object.values(ShaderSource);

