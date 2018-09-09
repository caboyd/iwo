#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 local_pos;
in vec3 view_pos;
in vec2 tex_coord;
in vec3 view_normal;

layout (std140) uniform ubo_global{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 projection;      // 64               // 64
    mat4 view_projection; // 64               // 128
 
};

struct Material {
    vec3 albedo;
    
    sampler2D albedo_sampler;
    bool equirectangular_textures[1];
    bool active_textures[1];
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
    if(u_material.active_textures[0]){
        vec2 uv = tex_coord;
        if(u_material.equirectangular_textures[0])
            uv = sampleSphericalMap(normalize(local_pos)); // make sure to normalize localPos
        color =  texture( u_material.albedo_sampler,uv).rgb;
    }
    else 
        color = u_material.albedo.rgb;
        
    frag_color = vec4(color,1.0);
}