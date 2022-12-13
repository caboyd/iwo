#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 local_pos;
in vec2 tex_coord;
//in vec3 view_normal;

layout (std140) uniform ubo_per_frame{
    vec3 camera;        
    mat4 view;   
    mat4 projection;   
    mat4 shadow_map_space;
};

struct Material {
    vec3 albedo_color;
    sampler2D albedo_sampler;
    bool is_equirectangular;
    bool active_textures[2];
};

uniform Material u_material;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 sampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(-atan(v.z, -v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{
    vec3 color = vec3(1.0);
    vec2 uv = tex_coord;
    if (u_material.active_textures[0]){
        if (u_material.is_equirectangular){
            // make sure to normalize localPos
            uv = sampleSphericalMap(normalize(local_pos));
        }
        color = texture(u_material.albedo_sampler, uv).rgb;
    } 
    color = color * u_material.albedo_color.rgb;

    frag_color = vec4(color,1.0);
}