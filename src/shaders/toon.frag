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
    sampler2D albedo_texture;
    //sampler2DShadow shadow_map_sampler;
    bool is_texture_active[2];
    //Colors
    vec3 albedo_color;
    vec3 outline_color;
    float specular_power;
    float specular_intensity;
    float diffuse_levels;
    float specular_levels;

}; 

struct Light {
    vec4 position;
    vec3 color;
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
    if(u_material.is_texture_active[0]) albedo_color  *= texture(u_material.albedo_texture,  tex_coord).rgb;

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
            float attenuation = 1.0 / (light_distance * light_distance);
        } else {
            L = normalize(L);
        }
      
        vec3 H = normalize(V + L);
  
        float df = max(0.0, dot(N, L));
        float sf = max(0.0, dot(N, H));
        sf = pow(sf, u_material.specular_power);

        df = floor((df * u_material.diffuse_levels)  + 0.5) / u_material.diffuse_levels;
        sf = floor((sf * u_material.specular_levels) + 0.5) / u_material.specular_levels;

        vec3 diffuse_color  = albedo_color * u_lights[i].color * attenuation; 
        vec3 specular_color = vec3(u_material.specular_intensity) * u_lights[i].color * attenuation; 

        color += df * diffuse_color + sf * specular_color ;
    }

    color += albedo_color * light_ambient * PI;

    //ignore flat_shading for outline
    vec3 real_normal = normalize(world_normal);

    //gives outline sortof
    if(pow(saturate(dot(real_normal,V)), 1.5) < 0.08){
        color = u_material.outline_color;
    }

    //Unreal HDR correction
    color = color / (color + 0.155) * 1.019;

    frag_color =  vec4(color, 1.0);

    
}

