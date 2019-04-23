#version 300 es
precision highp float;

out vec4 frag_color;



uniform samplerCube environment_map;

void main()
{
    vec3 env_color = texture(environment_map, local_pos).rgb;

    env_color = env_color / (env_color + vec3(1.0));
    env_color = pow(env_color, vec3(1.0/2.2));

    frag_color = vec4(env_color, 1.0);
}