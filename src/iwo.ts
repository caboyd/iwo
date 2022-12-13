export * from "./cameras/Camera";
export * from "./cameras/CubeCamera";
export * from "./cameras/OrbitControl";
export * from "./cameras/FPSControl";
export * from "./cameras/Frustum";

export * from "./graphics/attribute/Attribute";
export * from "./graphics/attribute/StandardAttribute";
export * from "./graphics/attribute/LineAttribute";

export * from "./geometry/Geometry";
export * from "./geometry/QuadGeometry";
export * from "./geometry/BoxGeometry";
export * from "./geometry/PlaneGeometry";
export * from "./geometry/SphereGeometry";
export * from "./geometry/LineGeometry";

export * from "./graphics/renderer/RendererStats";
export * from "./graphics/renderer/Renderer";
export * from "./graphics/renderer/RenderQueue";
export * from "./graphics/renderer/postpass/GaussianBlurPass";
export * from "./graphics/renderer/postpass/PostProcessPass";
export * from "./graphics/renderer/postpass/TonemappingPass";
export * from "./graphics/renderer/postpass/GaussianBlurPass";
export * from "./graphics/renderer/renderpass/RenderPass";
export * from "./graphics/renderer/renderpass/DepthPass";
export * from "./graphics/WebglConstants";
export * from "./graphics/WebglHelper";
export * from "./graphics/Uniform";
export * from "./graphics/IndexBuffer";
export * from "./graphics/UniformBuffer";
export * from "./graphics/VertexBuffer";

export * from "./graphics/textures/Texture2D";
export * from "./graphics/textures/TextureCubeMap";
export * from "./graphics/textures/TextureHelper";

export * from "./graphics/shader/ShaderSources";
export * from "./graphics/shader/Shader";

export * from "./materials/Material";
export * from "./materials/BasicUnlitMaterial";
export * from "./materials/ToonMaterial";
export * from "./materials/SkyboxMaterial";
export * from "./materials/GridMaterial";
export * from "./materials/NormalOnlyMaterial";
export * from "./materials/PBRMaterial";
export * from "./materials/LineMaterial";
export * from "./materials/EmptyMaterial";

export * from "./meshes/SubMesh";
export * from "./meshes/Mesh";
export * from "./meshes/MeshInstance";
export * from "./meshes/InstancedMesh";

export * from "./loader/FileLoader";
export * from "./loader/HDRImageLoader";
export * from "./loader/glTFLoader";
export * from "./loader/ObjLoader";
export * from "./loader/MtlLoader";
export * from "./loader/ImageLoader";
export * from "./loader/TextureLoader";

export * from "./helpers/ReferenceCounter";
export * from "./customtypes/types";

export function initGL(canvas: HTMLCanvasElement, opt?: Partial<WebGLContextAttributes>): WebGL2RenderingContext {
    try {
        const gl = <WebGL2RenderingContext>canvas.getContext("webgl2", opt);
        if (!gl) {
            alert("WebGL is not available on your browser.");
        }
        return gl;
    } catch (e) {
        throw new Error("GL init error:\n" + e);
    }
}
