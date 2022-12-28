#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DShadow;

#define PI 3.14159265358979

out vec4 frag_color;

//in vec3 view_pos;
in vec3 world_pos;
in vec2 tex_coord;
in vec3 normal;
//in vec3 view_normal;
in vec3 world_normal;
in vec3 camera_pos;

#ifdef SHADOWS
in vec4 shadow_coord;
#endif

struct Material {

    //Textures
    sampler2D albedo_sampler;
    //sampler2DShadow shadow_map_sampler;
    bool is_texture_active[2];
    //Colors
    vec3 albedo_color;
    vec3 outline_color;
    float specular_power;
    float specular_intensity;
    float diffuse_levels;
    float specular_levels;
    vec3 light_factor;

}; 

struct Light {
    vec4 position;
    vec3 color;
    float linear_falloff;
    float squared_falloff;
};

uniform int u_light_count;
uniform Light u_lights[16];
uniform vec3 light_ambient;

uniform Material u_material;

#ifdef SHADOWS
uniform float shadow_map_size;
#endif


float saturate(float x){
    return clamp(x,0.0,1.0);
}

void main() {

    //Objects not in shadow have full light
    float light_factor = 1.0;
#ifdef SHADOWS

    //16 Samples of Percentage Closer Filtering
    for(float y = -1.5; y <= 1.5; y += 1.0) {    
        for(float x = -1.5; x <= 1.5; x += 1.0) {
            vec2 shadow_offset = vec2(x / shadow_map_size, y / shadow_map_size);
            float vis = 1.0 - texture(u_material.shadow_map_sampler, vec3(shadow_coord.xy + shadow_offset, shadow_coord.z));
            light_factor -= shadow_coord.w * vis * (1.0/16.0);
        }
    }
#endif

#ifdef FLATSHADING
    vec3 xTangent = dFdx( world_normal );
    vec3 yTangent = dFdy( world_normal );
    vec3 N = normalize( cross( xTangent, yTangent ) );
#else
    vec3 N = normalize(world_normal);
#endif

    //View Direction
    vec3 V = normalize( camera_pos - world_pos);

	vec3 albedo_color  = u_material.albedo_color;
    float alpha = 1.0;
    if(u_material.is_texture_active[0]) {
        vec4 albedo_alpha = texture(u_material.albedo_sampler, tex_coord);
        alpha = albedo_alpha.a;
        albedo_color *=  albedo_alpha.rgb;
    }

	vec3 color = vec3(0.0);

	for(int i = 0; i < u_light_count; i++)
	{

        vec3 light_pos = (u_lights[i].position).xyz;
        vec3 L = light_pos;
        float attenuation = 1.0;

        if (u_lights[i].position.w == 1.0) {
            //point light
            L = normalize(light_pos - world_pos);
            float light_distance = length(light_pos - world_pos);
            float lf = u_lights[i].linear_falloff;
            if(lf == 0.0) lf = 1.0;
            float sf = u_lights[i].squared_falloff;
            if(sf == 0.0) sf = 1.0;
            float attenuation = 1.0 / ((light_distance * lf) + (light_distance * light_distance * sf));
        } else {
            L = normalize(L);
        }
      
        vec3 H = normalize(V + L);
  
        float df = max(0.0, dot(N, L));
        float sf = max(0.0, dot(N, H));
        sf = pow(sf, u_material.specular_power);

        df = floor((df * u_material.diffuse_levels)  + 0.5) / u_material.diffuse_levels;
        if(u_material.specular_levels > 0.0)
            sf = floor((sf * u_material.specular_levels) + 0.5) / u_material.specular_levels;
        else sf = 0.0;

        vec3 diffuse_color  =  u_material.light_factor * albedo_color * u_lights[i].color * attenuation; 
        vec3 specular_color =  u_material.light_factor * vec3(u_material.specular_intensity) * u_lights[i].color * attenuation; 

        color += df * diffuse_color + sf * specular_color ;
    }

    color += albedo_color * light_ambient;

    //ignore flat_shading for outline
    vec3 real_normal = normalize(world_normal);


    float outline = 1.0 - smoothstep(0.16,0.24, dot(real_normal,V));
    color = mix(color, u_material.outline_color, outline);


    //Unreal HDR correction
    color = color / (color + 0.155) * 1.019;

    if(alpha < 0.1) discard;

    frag_color =  vec4(color, alpha);

    
}

