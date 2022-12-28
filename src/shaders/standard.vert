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
    vec3 camera;        
    mat4 view;   
    mat4 projection;   
    mat4 shadow_map_space;
};

layout (std140) uniform ubo_per_model{
    mat4 model;       
    mat3 model_inverse;         
};

struct Light {
    vec4 position;
    vec3 color;
    float linear_falloff;
    float squared_falloff;
};

uniform int u_light_count;
uniform Light u_lights[16];

out vec3 local_pos;
//out vec3 view_pos;
out vec3 world_pos;
out vec2 tex_coord;
//out vec3 view_normal;
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
    #ifdef BILLBOARD_ROT_Y
    out_mat[1][0] = 0.0;
    out_mat[1][1] = 1.0;
    out_mat[1][2] = 0.0;
    #endif
    //column 2
    out_mat[2][0] = 0.0;
    out_mat[2][1] = 0.0;
    out_mat[2][2] = 1.0;
    return out_mat;
}


void main() {

#ifdef INSTANCING
    //NOTE: transpose inverse is correct but very slow
    //mat3 instance_inverse = mat3(transpose(inverse(a_instance)));
    world_normal = normalize(mat3(a_instance) * model_inverse * a_normal); 
    #ifdef BILLBOARD
        mat4 view_model = mat4ToBillboard(view  * a_instance * model);
        mat4 view_model_inverse = mat4ToBillboard(view  * a_instance * mat4(model_inverse));
        vec3 view_normal = normalize(mat3(view_model_inverse) * a_normal); 
        //put view normal back in world space
        world_normal = view_normal * mat3(view);
    #else
        mat4 view_model = view * a_instance * model;
    #endif

    world_pos = (a_instance * model * vec4(a_vertex, 1.0)).xyz;
    gl_Position = projection * view_model * vec4(a_vertex,1.0);
#else
    world_normal = normalize(model_inverse * a_normal); 
    #ifdef BILLBOARD
        mat4 view_model = mat4ToBillboard(view * model);
        mat4 view_model_inverse = mat4ToBillboard(view  * a_instance * mat4(model_inverse));
        vec3 view_normal = normalize(mat3(view_model_inverse) * a_normal); 
        //put view normal back in world space
        world_normal = view_normal * mat3(view);
    #else
        mat4 view_model = view * model;
    #endif
    world_pos = (model * vec4(a_vertex, 1.0)).xyz;
    gl_Position = projection * view_model * vec4(a_vertex,1.0);
#endif

    camera_pos = camera;
    local_pos = a_vertex;
    tex_coord = a_tex_coord;

    #ifdef SHADOWS
    //Calculate world space coords that map this vertex to the shadow_map
    //The vertex may not appear in the shadow_map and will have no shadow
    vec3 toLight = normalize(u_lights[0].position.xyz);
    float cos_light_angle = dot(toLight, world_normal);
    float slope_scale = clamp(1.0 - cos_light_angle, 0.0, 1.0);
    float normal_offset_scale =  slope_scale * 0.4;
    vec4 shadow_offset = vec4(world_normal * normal_offset_scale,0.0);
    shadow_coord = shadow_map_space * (vec4(world_pos,1.0) + shadow_offset);

    //Note: Moved to fragment shader because it doesn't work if vertices are very far apart.
    //Shadow_coord.w will be used to fade in and out shadows softly when they are far from camera
    //doing this per vertex doesnt work well for objects with one vertex inside and one outside when they are large
    // float distance1 = length(camera_pos - world_pos);

    // distance1 = distance1 - (shadow_distance - transition_distance);
    // distance1 = distance1 / transition_distance;
    // shadow_coord.w = clamp(distance1, 0.0, 1.0);
    #endif
}
