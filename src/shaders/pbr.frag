#version 300 es
precision highp float;

#define PI 3.14159265358979

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;
in vec2 tex_coord;
in vec3 view_normal;
in vec3 world_normal;

layout (std140) uniform ubo_per_frame{
// base alignment   // aligned offset
    mat4 view;// 64               // 0
    mat4 view_inverse;// 64               // 64
    mat4 projection;// 64               // 128
    mat4 view_projection;// 64               // 192

};

struct Material {
    vec3 albedo;
    float roughness;
    float metallic;
    float ao;

    sampler2D albedo_sampler;
    samplerCube irradiance_sampler;
    samplerCube env_sampler;
    sampler2D brdf_LUT_sampler;
    bool active_textures[3];
};

struct Light {
    vec4 position;
    vec3 color;
};

uniform int u_light_count;
uniform Light u_lights[16];
uniform Material u_material;

float saturate(float a){
    return clamp(a,0.0, 1.0);
}


float DistributionGGX_Trowbridge_Reitz (vec3 N, vec3 H, float roughness) {
    float alphaRoughness = roughness * roughness;

    float a2 = alphaRoughness * alphaRoughness;
    float NdotH = saturate(dot(N, H));
    float NdotH2 = NdotH*NdotH;

    float denom = (NdotH2 *  (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float denom = NdotV * (1.0 - k) + k;
    return NdotV / denom;
}


float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness){
    float NdotV = saturate(dot(N, V));
    float NdotL = saturate(dot(N, L));
    float ggx1 = GeometrySchlickGGX(NdotV, roughness);
    float ggx2 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// Microfacet Models for Refraction through Rough Surfaces - equation (34)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney’s reparameterization
float G_GGX_Smith(vec3 N, vec3 V, vec3 L, float roughness){
    // geometry term (normalized) = G(l)⋅G(v) / 4(n⋅l)(n⋅v)
    float NdotV = saturate(dot(N, V));
    float NdotL = saturate(dot(N, L));
    float a2 = roughness * roughness;
    float gl = NdotL + sqrt( a2 + ( 1.0 - a2 ) *  NdotL*NdotL );
    float gv = NdotV + sqrt( a2 + ( 1.0 - a2 ) *  NdotV*NdotV  );
    return 1.0 / ( gl * gv );
} // validated


// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float G_GGX_SmithCorrelated(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = saturate(dot(N, V));
    float NdotL = saturate(dot(N, L));
    float a2 = roughness * roughness;
    // dotNL and dotNV are explicitly swapped. This is not a mistake.
    float gv = NdotL * sqrt( a2 + ( 1.0 - a2 ) * ( NdotV*NdotV ) );
    float gl = NdotV * sqrt( a2 + ( 1.0 - a2 ) * ( NdotL*NdotL ) );
    return 0.5 / max( gv + gl, 0.001 );
}

vec3 fresnelSchlick(float cosTheta, vec3 F0){
    // Original approximation by Christophe Schlick '94
    //return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);

    // Optimized variant (presented by Epic at SIGGRAPH '13)
    // https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
    float fresnel = exp2( ( -5.55473 * cosTheta - 6.98316 ) * cosTheta );
    return ( 1.0 - F0 ) * fresnel + F0;
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    // Original approximation by Christophe Schlick '94
    //return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);

    // Optimized variant (presented by Epic at SIGGRAPH '13)
    // https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
    float fresnel = exp2( ( -5.55473 * cosTheta - 6.98316 ) * cosTheta );
    return ( 1.0 - F0 ) * fresnel + F0;
}

void main() {
    vec3 albedo;
    if (u_material.active_textures[0])
    albedo = texture(u_material.albedo_sampler, tex_coord).rgb;
    else
    albedo = u_material.albedo.rgb;


    //Normal
    vec3 N = normalize(world_normal);
    //View Direction
    vec3 V = normalize(-world_pos);
    //Reflect Direction
    vec3 R = reflect(-V, N);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, u_material.metallic);

    vec3 Lo = vec3(0.0);

    vec3 color;
    
    for (int i = 0; i < u_light_count; i++){

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

      
        float NDF = DistributionGGX_Trowbridge_Reitz(N, H, u_material.roughness);
        float G = G_GGX_SmithCorrelated(N, V, L, u_material.roughness);
        vec3 F = fresnelSchlick(saturate(dot(H, V)), F0);
        vec3 specular = NDF * G * F;

        // cook-torrance brdf
//        float NDF = DistributionGGX_Trowbridge_Reitz(N, H, u_material.roughness);
//        float G = GeometrySmith(N, V, L, u_material.roughness);
//        vec3 F = fresnelSchlick(saturate(dot(H, V)), F0);
//        vec3 numerator = NDF * G * F;
//        float denom = 4.0 * saturate(dot(N, V)) * saturate(dot(N, L)) + 0.001;
//        vec3 specular = numerator / denom;
//        
     

        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;

        kD *= (1.0 - u_material.metallic);

        // add to outgoing radiance Lo
        float NdotL = saturate(dot(N, L));
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
        
    }

    vec3 ambient;

    // ambient lighting (we now use IBL as the ambient term)
    vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, u_material.roughness);

    vec3 irradiance;
    if (u_material.active_textures[1]){
        // ambient lighting (we now use IBL as the ambient term)
        vec3 kS = F;
        vec3 kD = 1.0 - kS;
        kD *= 1.0 - u_material.metallic;

        irradiance = texture(u_material.irradiance_sampler, N).rgb;
        vec3 diffuse = irradiance * u_material.albedo;

        ambient = (kD * diffuse) * u_material.ao;
    } else {
        ambient = vec3(0.03) * albedo * u_material.ao;
    }

    if (u_material.active_textures[2]){
        // sample both the pre-filter map and the BRDF lut and combine them together as per the Split-Sum approximation to get the IBL specular part.
        const float MAX_REFLECTION_LOD = 4.0;
        vec3 prefilteredColor = textureLod(u_material.env_sampler, R, u_material.roughness * MAX_REFLECTION_LOD).rgb;
        vec2 brdf  = texture(u_material.brdf_LUT_sampler, vec2(max(dot(N, V), 0.0), u_material.roughness)).rg;
        vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

        ambient += specular * u_material.ao;
    }

    color =  ambient + Lo;

    //    //HDR correction
    //    color = color / (color + vec3(1.0));
    //    //Gamme correction
    //    color = pow(color, vec3(1.0/2.2));    

    //HDR + Gamma Correction Magic
    //https://www.slideshare.net/ozlael/hable-john-uncharted2-hdr-lighting  slide 140
    color = max(vec3(0.0), color - 0.004);
    color = (color * (6.2*color + 0.5)) / (color *(6.2*color + 1.7)+0.06);

    frag_color = vec4(color, 1.0);

}

