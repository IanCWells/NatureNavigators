import {tiny} from './tiny-graphics.js';
import {defs} from "./examples/common.js";
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4,
    Light, Shape, Material, Shader, Texture, Scene
} = tiny;
const food_defs = {};
export {food_defs};

const Food = food_defs.Food =
class Food extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        // Create the sphere with desired subdivisions for smoothness
        const sphere = new defs.Subdivision_Sphere(4); // Adjust the subdivisions for the desired smoothness
        // Define the scaling transformation

        let food_scale = 0.3;
        const scale_transform = Mat4.translation(0,0.26,0)
            .times(Mat4.scale(food_scale, food_scale, food_scale));

        // Initialize arrays
        this.arrays.position = [];
        this.arrays.normal = [];
        this.arrays.texture_coord = [];
        this.indices = [];

        this.radius = food_scale;

        // Transform and add the sphere vertices
        for (let i = 0; i < sphere.arrays.position.length; i++) {
            // Apply the scaling transformation to the positions
            this.arrays.position.push(scale_transform.times(sphere.arrays.position[i].to4(1)).to3());
            // Normals do not need scaling transformation; they remain unit vectors
            this.arrays.normal.push(sphere.arrays.normal[i]);
            this.arrays.texture_coord.push(sphere.arrays.texture_coord[i]);

        }
        // Add the sphere indices
        this.indices.push(...sphere.indices);
    }
}