#version 300 es
precision highp float;

out vec4 frag_color;

in vec3 view_pos;
in vec3 world_pos;

uniform float distance;
uniform float frequency;
uniform float highlight_frequency;
uniform vec4 base_color;
uniform vec4 grid_color;
uniform bool use_base_color;

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
    vec3 color = grid_color.rgb;
    float alpha = grid_color.a - line;

    vec3 default_color = color;

    if(use_base_color){
        default_color = base_color.rgb;
        color = mix(grid_color.rgb, base_color.rgb, line);
        if(line > 0.99999){
            color = base_color.rgb;
        }
        alpha = base_color.a;
    }

    vec2 coord2 = world_pos.xz * 1.0 / highlight_frequency;
    vec2 grid2 = abs(fract(coord2 - 0.5) - 0.5) / fwidth(coord2);
    float line2 = min(grid2.x, grid2.y);


    //blue lines every x highlight_frequency units
    //light blue is +z
    if(grid2.x < 0.99){
        if(world_pos.z > 0.0)
            color = mix(vec3(0,0.8,1.), default_color, grid2.x);
        else
            color = mix(vec3(0.1,0.3,1.), default_color, grid2.x);
    }

    //red/yellow lines every z highlight_frequency units
    //yellow is +x
     if(grid2.y < 0.99){
        if(world_pos.x > 0.0)
            color = mix(vec3(0.9,0.7,0.1), default_color, grid2.y);
        else
            color = mix(vec3(0.9,0.1,0.1), default_color, grid2.y);
    }
    
    //draw anti-aliased circle at origin
    float d = length(world_pos.xz);
    float wd = fwidth(d);
    float rad = 0.015 *length(view_pos);
    float circle = smoothstep(rad + wd, rad - wd, d);
    color = mix(color, color - vec3(0.5), circle);
    alpha = max(alpha, circle);

    //Fade out edge into circle
    float transition = 8.0;
    float dist = length(view_pos);
    dist = dist - (distance - transition);
    dist = dist / transition;

    alpha = clamp(alpha - dist, 0.0, alpha);
    frag_color = vec4(color,alpha);
}
