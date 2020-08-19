#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;

uniform float distance;
uniform float frequency;
uniform float highlight_frequency;

float distSquared( vec2 A, vec2 B )
{
    vec2 C = A - B;
    return dot( C, C );
}

void main() {
    vec3 red = vec3(0.9,0.1,0.1);
    vec3 blue = vec3(0.1,0.3,1.0);

    vec2 coord = world_pos.xz * 1.0f/frequency;
        
    // Compute anti-aliased world-space grid lines
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);

    // Just visualize the grid lines directly
    vec3 color = vec3(0.5 - min(line,1.0));
    float alpha = 1.0 - line;

    //blue lines every x units
    if((mod(world_pos.x + 0.5, highlight_frequency)) < 1. && grid.x < 1.) {
        color = vec3(0.1,0.3,1.);
        alpha = max(alpha,1.0 - grid.x);
    }

    //red lines every x units
    if(abs(mod(world_pos.z + 0.5, highlight_frequency)) < 1. && grid.y < 1.) {
        color = vec3(0.9,0.1,0.1);
        alpha = max(alpha,1.0 - grid.y);
    }

    //draw anti-aliased circle at origin
    float d = length(world_pos.xz);
    float wd = fwidth(d);
    float rad = 0.015 *length(view_pos);
    float circle = smoothstep(rad + wd, rad - wd, d);
    color += vec3(0.) * (1. - alpha);
    alpha = max(alpha,circle);

    //Fade out edge into circle
    float transition = 8.0;
    float dist = length(view_pos);
    dist = dist - (distance - transition);
    dist = dist / transition;

    alpha = clamp(alpha - dist, 0.0, alpha);
    frag_color = vec4(color, alpha);
}
