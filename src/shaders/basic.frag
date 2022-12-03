#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 local_pos;
in vec2 tex_coord;
in vec3 view_normal;

layout (std140) uniform ubo_per_frame{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192
    mat4 shadow_map_space;// 64               // 256

};

struct Material {
    vec3 albedo_color;

    sampler2D albedo_sampler;
    samplerCube albedo_cube_sampler;
    bool equirectangular_texture;
    bool active_textures[2];
};

uniform Material u_material;

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
    vec3 color;
    vec2 uv = tex_coord;
    if (u_material.active_textures[0]){
        if (u_material.equirectangular_texture)
        uv = sampleSphericalMap(normalize(local_pos));// make sure to normalize localPos
        color =  texture(u_material.albedo_sampler, uv).rgb;
        //color = pow(color, vec3(1.0/2.2));
    } else {
        color = u_material.albedo_color.rgb;
    }

    if (u_material.active_textures[1]){
        vec3 cube_color = texture(u_material.albedo_cube_sampler, local_pos).rgb;
       // cube_color = cube_color / (cube_color + vec3(1.0));
       // color = pow(cube_color, vec3(1.0/2.2));
    }

//    color = max(vec3(0.0), color - 0.004);
//    color = (color * (6.2*color + 0.5)) / (color *(6.2*color + 1.7)+0.06);
    
    frag_color = vec4(color,1.0);
}