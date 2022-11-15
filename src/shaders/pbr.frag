#version 300 es
precision highp float;
precision lowp sampler2DShadow;

#define PI 3.14159265358979
#define MIN_PERCEPTUAL_ROUGHNESS 0.045
#define MIN_ROUGHNESS            0.002025

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;
in vec2 tex_coord;
in vec3 normal;
in vec3 view_normal;
in vec3 world_normal;
in vec3 camera_pos;
in vec4 shadow_coord;

layout (std140) uniform ubo_per_frame{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192
    mat4 shadow_map_space;// 64               // 256

};
struct Material {
    vec3 albedo;
    float roughness;
    float metallic;
    float ao;
    vec3 emissive_factor;

    sampler2D albedo_sampler;
    samplerCube irradiance_sampler;
    samplerCube env_sampler;
    sampler2D normal_sampler;
    sampler2D occlusion_sampler;
    sampler2D metal_roughness_sampler;
    sampler2D emissive_sampler;
    sampler2DShadow shadow_map_sampler;
    bool active_textures[8];

    sampler2D brdf_LUT_sampler;
};

struct Light {
    vec4 position;
    vec3 color;
};

uniform int u_light_count;
uniform Light u_lights[16];
uniform Material u_material;
uniform vec3 light_ambient;
uniform float gamma;
uniform float shadow_map_size;
uniform float shadow_distance;
uniform float transition_distance;

float saturate(float a){
    return clamp(a, 0.0, 1.0);
}


float DistributionGGX_Trowbridge_Reitz (vec3 N, vec3 H, float perceptual_roughness) {
    float roughness = perceptual_roughness * perceptual_roughness;

    float a2 = roughness * roughness;
    float NdotH = saturate(dot(N, H));
    float NdotH2 = NdotH*NdotH;

    float denom = (NdotH2 *  (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float G_GGX_SmithCorrelated(vec3 N, vec3 V, vec3 L, float perceptual_roughness) {
    float NdotV = saturate(dot(N, V));
    float NdotL = saturate(dot(N, L));
    float a2 = perceptual_roughness * perceptual_roughness;
    // dotNL and dotNV are explicitly swapped. This is not a mistake.
    float gv = NdotL * sqrt(a2 + (1.0 - a2) * (NdotV*NdotV));
    float gl = NdotV * sqrt(a2 + (1.0 - a2) * (NdotL*NdotL));
    return 0.5 / max(gv + gl, 0.001);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0){
    // Original approximation by Christophe Schlick '94
    //float fresnel = pow(1.0 - cosTheta, 5.0);

    // Optimized variant (presented by Epic at SIGGRAPH '13)
    // https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
    float fresnel = exp2((-5.55473 * cosTheta - 6.98316) * cosTheta);
    return (1.0 - F0) * fresnel + F0;
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float perceptual_roughness)
{
    float roughness = perceptual_roughness * perceptual_roughness;

    // See fresnelSchlick
    float fresnel = exp2((-5.55473 * cosTheta - 6.98316) * cosTheta);
    vec3 Fr = max(vec3( 1.0 - roughness), F0) - F0;

    return Fr * fresnel + F0;
}

bool isnan2( float val )
{
    return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
    // important: some nVidias failed to cope with version below.
    // Probably wrong optimization.
    /*return ( val <= 0.0 || 0.0 <= val ) ? false : true;*/
}

//https://github.com/google/filament/blob/3862b44ef4a2cd3c41dec85a8d5760835ba15f0d/shaders/src/light_indirect.fs#L101
float perceptualRoughnessToLod(float perceptualRoughness) {
    // The mapping below is a quadratic fit for log2(perceptualRoughness)+iblRoughnessOneLevel when
    // iblRoughnessOneLevel is 4. We found empirically that this mapping works very well for
    // a 256 cubemap with 5 levels used. But also scales well for other iblRoughnessOneLevel values.
    const float MAX_REFLECTION_LOD = 4.0;
    return MAX_REFLECTION_LOD * perceptualRoughness * (2.0 - perceptualRoughness);
}

vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN ) {
    vec3 q0 = dFdx( eye_pos );
    vec3 q1 = dFdy( eye_pos );
    vec2 st0 = dFdx( tex_coord.st );
    vec2 st1 = dFdy( tex_coord.st );
    float scale = sign( st1.t * st0.s - st0.t * st1.s );
    vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
    vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
    vec3 N = normalize( surf_norm );
    mat3 tsn = mat3( S, T, N );
    mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
    return normalize( tsn * mapN );
}

mat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv, vec2 tangentSpaceParams) {
    uv = gl_FrontFacing ? uv : -uv;
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);
    vec3 dp2perp = cross(dp2, normal);
    vec3 dp1perp = cross(normal, dp1);
    vec3 tangent = dp2perp*duv1.x+dp1perp*duv2.x;
    vec3 bitangent = dp2perp*duv1.y+dp1perp*duv2.y;
    tangent *= tangentSpaceParams.x;
    bitangent *= tangentSpaceParams.y;
    float invmax = inversesqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
    return mat3(tangent*invmax, bitangent*invmax, normal);
}



vec3 perturbNormalBase(mat3 cotangentFrame, vec3 normal, float scale) {
    normal = normalize(normal*vec3(scale, scale, 1.0));
    return normalize(cotangentFrame*normal);
}
vec3 perturbNormal(mat3 cotangentFrame, vec3 textureSample, float scale) {
    return perturbNormalBase(cotangentFrame, textureSample, scale);
}

void main() {
    vec3 albedo;
    if (u_material.active_textures[0])
    albedo = texture(u_material.albedo_sampler, tex_coord).rgb;
    else
    albedo = u_material.albedo.rgb;

    vec3 emission;
    if(u_material.active_textures[6])
        emission = u_material.emissive_factor *  texture(u_material.emissive_sampler,tex_coord).rgb;
    else
        emission = vec3(0);

    float metallic = u_material.metallic;
    if(u_material.active_textures[5])
    metallic = u_material.metallic * texture(u_material.metal_roughness_sampler, tex_coord).b;

    float perceptual_roughness = u_material.roughness;
    if(u_material.active_textures[5])
        perceptual_roughness = u_material.roughness * texture(u_material.metal_roughness_sampler, tex_coord).g;
    perceptual_roughness = clamp(perceptual_roughness,MIN_PERCEPTUAL_ROUGHNESS, perceptual_roughness);


    vec3 N = normalize(world_normal);
    if(u_material.active_textures[3]){
       vec3 mapN = texture( u_material.normal_sampler, tex_coord ).xyz * 2.0 - vec3(1.0);
        mat3 TBN = cotangent_frame(world_normal, world_pos, tex_coord, vec2(1.,1.));
        N = perturbNormal(TBN, mapN, 1.0);
    }

    //View Direction
    vec3 V = normalize( camera_pos - world_pos);
    //Reflect Direction
    vec3 R = (reflect(-V, N));

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 Lo = vec3(0.0);

    vec3 color;

    float AO = u_material.ao;
    if(u_material.active_textures[4])
        AO = u_material.ao * texture(u_material.occlusion_sampler, tex_coord).r;

    for (int i = 0; i < u_light_count; i++) {

        // calculate per-light radiance

        vec3 light_pos =  (u_lights[i].position).xyz;
        vec3 L = light_pos;
        vec3 radiance = u_lights[i].color;
        //point light
        if (u_lights[i].position.w == 1.0){
            L = normalize(light_pos - world_pos);
            float distance = length(light_pos - world_pos);
            float attenuation = 1.0 / (distance * distance);
            radiance  *= attenuation;
        } else
        L = normalize(L);

        vec3 H = normalize(V + L);

        float NDF = DistributionGGX_Trowbridge_Reitz(N, H, perceptual_roughness );
        float G = G_GGX_SmithCorrelated(N, V, L, perceptual_roughness);
        vec3 F = fresnelSchlick(saturate(dot(H, V)), F0);

        vec3 specular = NDF * G * F;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;

        kD *= (1.0 - metallic);

        // add to outgoing radiance Lo
        float NdotL = saturate(dot(N, L));
        


        //only light 0 has shadows
        if(u_material.active_textures[7]) {
            //Objects not in shadow have full light
            float light_factor = 1.0;

            float distance1 = length(camera_pos - world_pos);
            distance1 = distance1 - (shadow_distance - transition_distance);
            distance1 = distance1 / transition_distance;
            float w = clamp(1.0 - distance1, 0.0, 1.0);

            //16 Samples of Percentage Closer Filtering
            for(float y = -1.5; y <= 1.5; y += 1.0){    
                for(float x = -1.5; x <= 1.5; x += 1.0) {
                    float vis = 1.0 - texture(u_material.shadow_map_sampler, vec3(shadow_coord.xy + vec2(x/shadow_map_size,y/shadow_map_size) ,  (shadow_coord.z)));
                    light_factor -= w *  vis * (1.0/16.0);
                }
            }
            radiance *= light_factor;
        }

        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
   
    }

    vec3 ambient;
    float NoV = max(dot(N,V),0.0);
    float PI_light = PI;

    // ambient lighting (we now use IBL as the ambient term)
    vec3 F = fresnelSchlickRoughness(NoV, F0, perceptual_roughness);

    vec3 irradiance;
    if (u_material.active_textures[1]){
        // ambient lighting (we now use IBL as the ambient term)
        vec3 kS = F;
        vec3 kD = 1.0 - kS;
        if(!u_material.active_textures[2])
            kD = vec3(1.0);
        kD *= 1.0 - metallic;

        irradiance = texture(u_material.irradiance_sampler, world_normal).rgb;
        vec3 diffuse = (irradiance + (light_ambient)) * albedo;
        ambient += (kD * diffuse) * AO ;

    } else {
        ambient = (light_ambient ) * albedo * AO;
    }

    if (u_material.active_textures[2]){
     
        // sample both the pre-filter map and the BRDF lut and combine them together as per the Split-Sum approximation to get the IBL specular part.
        float lod = perceptualRoughnessToLod(perceptual_roughness);
        vec3 prefilteredColor = textureLod(u_material.env_sampler, R, lod ).rgb;
       
        vec2 brdf  = texture(u_material.brdf_LUT_sampler, vec2(NoV, perceptual_roughness)).rg;
        vec3  specular =  prefilteredColor * (F * brdf.x + brdf.y);
     
        ambient += (specular * AO);
      
    }
    
    color = Lo + (emission + ambient) * PI_light;

    //HDR correction
    color = color / (color + vec3(1.0));
    //Gamma correction
    float g = gamma;
    if(g < 0.0001) g = 2.2;
    color = pow(color, vec3(1.0/g));

    //HDR + Gamma Correction Magic
    //https://www.slideshare.net/ozlael/hable-john-uncharted2-hdr-lighting  slide 140
    //color = max(vec3(0.0), color - 0.004);
    //color = (color * (6.2*color + 0.5)) / (color *(6.2*color + 1.7)+0.06);

    frag_color = vec4(color,1.0);

}

