#version 300 es
precision highp float;

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
#endif

mat4 mat4ToBillboard(mat4 m) {
    mat4 out_mat = mat4(m);
    //column 0
    out_mat[0][0] = 1.0;
    out_mat[0][1] = 0.0;
    out_mat[0][2] = 0.0;
    //column 1
    out_mat[1][0] = 0.0;
    out_mat[1][1] = 1.0;
    out_mat[1][2] = 0.0;
    //column 2
    out_mat[2][0] = 0.0;
    out_mat[2][1] = 0.0;
    out_mat[2][2] = 1.0;
    return out_mat;
}

vec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {
    return normalize( (vec4(normal,0.0) * matrix).xyz );
}

void main() {

vec4 world_pos4 = model * vec4(a_vertex, 1.0);

#ifdef INSTANCING
   
    #ifdef BILLBOARD
        mat4 instance = mat4ToBillboard(view  * a_instance * model);
        gl_Position = projection * instance * vec4(a_vertex,1.0f);
        mat4 normal_mat4 = transpose(inverse(instance)); 
        view_normal =  (normal_mat4 * vec4(a_normal, 1.0)).xyz ;
        world_normal = (vec4(view_normal,1.0) * view).xyz;
        world_pos4 = instance * vec4(a_vertex,1.0f);
    #else
         mat4 instance = a_instance * model;
        gl_Position = view_projection * instance * vec4(a_vertex,1.0f);
        mat4 normal_mat4 = transpose(inverse(instance)); 
        view_normal =  (view * normal_mat4 * vec4(a_normal, 1.0)).xyz ;
        world_pos4 = instance * vec4(a_vertex, 1.0);
        world_normal = normalize((normal_mat4 * vec4(a_normal, 1.0)).xyz);
    #endif
#else
    //FIXME: did not finish this
    #ifdef BILLBOARD
        mat4 billboard_model = mat4ToBillboard(view * model);
        world_pos4 = billboard_model *  vec4(a_vertex, 1.0);
        gl_Position = projection * billboard_model * vec4(a_vertex,1.0f);
    #else
        gl_Position = mvp * vec4(a_vertex,1.0f);
    #endif
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

    //Note: Moved to fragment shader because it doesn't work if vertices are very far apart.
    //Shadow_coord.w will be used to fade in and out shadows softly when they are far from camera
    //doing this per vertex doesnt work well for objects with one vertex inside and one outside when they are large
    // float distance1 = length(camera_pos - world_pos);

    // distance1 = distance1 - (shadow_distance - transition_distance);
    // distance1 = distance1 / transition_distance;
    // shadow_coord.w = clamp(distance1, 0.0, 1.0);
    #endif
}
