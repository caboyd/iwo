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

uniform sampler2D equirectangular_map;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 sampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{
    vec2 uv = sampleSphericalMap(normalize(local_pos));
    vec3 color = texture(equirectangular_map, uv).rgb;
   // color = vec3(uv,1);
    frag_color = vec4(color, 1.0);
}