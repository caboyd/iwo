#version 300 es
precision highp float;

//##DEFINES

//##END
layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;

#ifdef INSTANCING
in mat4 a_instance;
#endif

layout (std140) uniform ubo_per_frame{
                          // base alignment   // aligned offset
    mat4 view;            // 64               // 0
    mat4 view_inverse;    // 64               // 64
    mat4 projection;      // 64               // 128
    mat4 view_projection; // 64               // 192
    mat4 shadow_map_space;// 64               // 256

};

layout (std140) uniform ubo_per_model{
                        // base alignment   // aligned offset
    mat4 model;         // 64               // 0
    mat3 normal_view;        // 64               // 64
    mat4 mvp;           // 64               // 128
};

struct Light {
    vec4 position;
    vec3 color;
};

uniform int u_light_count;
uniform Light u_lights[16];

out vec3 local_pos;
//out vec3 view_pos;
out vec3 world_pos;
out vec2 tex_coord;
out vec3 view_normal;
out vec3 world_normal;
out vec3 camera_pos;

#ifdef SHADOWS
out vec4 shadow_coord;
uniform float shadow_distance;
uniform float transition_distance;
#endif

vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
    return normalize( (vec4(normal,0.0) * matrix).xyz );
}

void main() {

vec4 world_pos4 = model * vec4(a_vertex, 1.0);

#ifdef INSTANCING
    gl_Position = view_projection * a_instance * model * vec4(a_vertex,1.0f);
    mat4 normal_mat4 = transpose(inverse(a_instance * model)); 
    //view_pos = (view * a_instance * model * vec4(a_vertex,1.0f)).xyz ;
    view_normal =  (view * normal_mat4 * vec4(a_normal, 1.0)).xyz ;
    world_pos4 = a_instance * world_pos4;
    world_normal = normalize((normal_mat4 * vec4(a_normal, 1.0)).xyz);
#else
    gl_Position = mvp * vec4(a_vertex,1.0f);
    //view_pos = (view * model * vec4(a_vertex,1.0f)).xyz ;
    view_normal =  normal_view * a_normal ;
    world_normal = normalize(inverseTransformDirection( view_normal, view ));
#endif

    camera_pos = view_inverse[3].xyz;
    local_pos = a_vertex;
    world_pos = world_pos4.xyz;
    tex_coord = a_tex_coord;

    #ifdef SHADOWS
    //Calculate world space coords that map this vertex to the shadow_map
    //The vertex may not appear in the shadow_map and will have no shadow
    vec3 toLight = normalize(u_lights[0].position.xyz);
    float cos_light_angle = dot(toLight, world_normal);
    float slope_scale = clamp(1.0 - cos_light_angle, 0.0, 1.0);
    float normal_offset_scale =  slope_scale * 0.4;
    vec4 shadow_offset = vec4(world_normal * normal_offset_scale,0.0);
    shadow_coord = shadow_map_space * (world_pos4 + shadow_offset);

    //Shadow_coord.w will be used to fade in and out shadows softly when they are far from camera
    //doing this per vertex doesnt work well for objects with one vertex inside and one outside when they are large
    float distance1 = length(camera_pos - world_pos);

    distance1 = distance1 - (shadow_distance - transition_distance);
    distance1 = distance1 / transition_distance;
    shadow_coord.w = clamp(1.0 - distance1, 0.0, 1.0);
    #endif
}
