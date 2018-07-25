#version 300 es
precision highp float;

#define PI 3.14159265358979

out vec4 frag_color;

in vec3 normal;
in vec2 tex_coord;
in vec3 world_pos;

uniform vec3 u_camera_pos;

struct Material {
    vec4 albedo;
    float roughness;
    float metallic;
    float ao;
    
    sampler2D albedo_sampler;
    bool active_textures[1];
};

struct Light {
    vec4 position;
    vec3 color;
};

uniform int u_light_count;
uniform Light u_lights[16];
uniform Material u_material;


float DistributionGGX_Trowbridge_Reitz (vec3 N, vec3 H, float roughness) {
    float a2 = roughness * roughness;
    float NdotH = max(dot(N,H), 0.0);
    float NdotH2 = NdotH*NdotH;
    
    float denom = (NdotH2 *  (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    
    return a2 / max(denom, 0.00000001);
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;
    
    float denom = NdotV * (1.0 - k) + k;
    return NdotV / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness){
    float NdotV = max(dot(N,V), 0.0);
    float NdotL = max(dot(N,L), 0.0);
    float ggx1 = GeometrySchlickGGX(NdotV, roughness);
    float ggx2 = GeometrySchlickGGX(NdotL, roughness);
    
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
    //Normal
    vec3 N = normalize(normal);
    //View Direction
    vec3 V = normalize(u_camera_pos - world_pos);
    
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, u_material.albedo.rgb, u_material.metallic);
            
    vec3 Lo = vec3(0.0);
    
    for(int i = 0; i < u_light_count; i++){
    
        // calculate per-light radiance
        vec3 L = u_lights[i].position.xyz;
        vec3 radiance = u_lights[i].color;
        //point light
        if(u_lights[i].position.w == 1.0){
            L = normalize(u_lights[i].position.xyz - world_pos);
            float distance = length(u_lights[i].position.xyz - world_pos);
            float attenuation = 1.0 / ( distance * distance );
            radiance  *= attenuation;
        }else
            L = normalize(L);
            
        vec3 H = normalize( V + L );

        // cook-torrance brdf
        float NDF = DistributionGGX_Trowbridge_Reitz(N, H, u_material.roughness);
        float G = GeometrySmith(N,V,L,u_material.roughness );
        vec3 F = fresnelSchlick(clamp(dot(H, V), 0.0, 1.0), F0);
                
        vec3 numerator = NDF * G * F;
        float denom = 4.0 * max(dot(N,V),0.0) * max(dot(N,L),0.0);
        vec3 specular = numerator / max(denom, 0.001);
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        
        kD *= 1.0 - u_material.metallic;
        
        // add to outgoing radiance Lo
        float NdotL = max(dot(N,L), 0.0);
        Lo += (kD * u_material.albedo.rgb / PI + specular) * radiance * NdotL;
    }
    
    
    vec3 ambient = vec3(0.03) * u_material.albedo.rgb * u_material.ao;
    vec3 color = ambient + Lo;
    
    //HDR correction
    color = color / (color + vec3(1.0));
    //Gamme correction
    color = pow(color, vec3(1.0/2.2));    

    frag_color = vec4(color, 1.0);

}

