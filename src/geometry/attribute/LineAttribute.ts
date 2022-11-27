import { Attribute, AttributeFormat, AttributeGenerator, createAttribute } from "./Attribute";

export namespace LineAttribute {
    //matches shader attributes
    export const Names = [
        //vertex must always be first
        "position",
        "point_a",
        "point_b",
        "color_a",
        "color_b",
    ] as const;

    export const position = AttributeGenerator(Names[0]);
    export const point_a = AttributeGenerator(Names[1], { divisor: 1, buffer_index: 1 });
    export const point_b = AttributeGenerator(Names[2], { divisor: 1, buffer_index: 1 });
    export const color_a = AttributeGenerator(Names[3]);
    export const color_b = AttributeGenerator(Names[4]);
}
