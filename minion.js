import {tiny} from './tiny-graphics.js';
import {defs} from "./examples/common.js";
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4,
    Light, Shape, Material, Shader, Texture, Scene
} = tiny;
const minion_defs = {};

export {minion_defs};

const Minion = minion_defs.Minion =
class Minion extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");

        // Create the ellipsoid body (stretched sphere)
        const ellipsoid = new defs.Subdivision_Sphere(2);
        // Create the circular head
        const circle = new defs.Subdivision_Sphere(4); // Adjust the subdivisions for the desired smoothness

        // Define transformations
        const ellipsoid_transform = Mat4.translation(0, .59, 0)
            .times(Mat4.scale(0.5, 0.75, 0.5)); // Scale the sphere to form an ellipsoid
        const circle_transform = Mat4.translation(0, 1.58, 0)
            .times(Mat4.scale(0.25, 0.25, 0.25)); // Position and scale the circle

        // Initialize arrays.plus(Mat4.translation(0,1.29,0))
        this.arrays.position = [];


        this.arrays.normal = [];
        this.arrays.texture_coord = [];
        this.indices = [];

        this.movement_speed = vec3(0, 0, 0);

        this.xProb_adjustment = 0;
        this.zProb_adjustment = 0;

        // Transform and add the ellipsoid vertices
        for (let i = 0; i < ellipsoid.arrays.position.length; i++) {
            this.arrays.position.push(ellipsoid_transform.times(ellipsoid.arrays.position[i].to4(1)).to3());
            this.arrays.normal.push(ellipsoid_transform.times(ellipsoid.arrays.normal[i].to4(0)).to3());
            this.arrays.texture_coord.push(ellipsoid.arrays.texture_coord[i]);
        }

        // Transform and add the circle vertices
        for (let i = 0; i < circle.arrays.position.length; i++) {
            this.arrays.position.push(circle_transform.times(circle.arrays.position[i].to4(1)).to3());
            this.arrays.normal.push(circle_transform.times(circle.arrays.normal[i].to4(0)).to3());
            this.arrays.texture_coord.push(circle.arrays.texture_coord[i]);
        }

        // Combine the indices from both shapes
        this.indices.push(...ellipsoid.indices);
        const circle_offset = ellipsoid.arrays.position.length;
        this.indices.push(...circle.indices.map(i => i + circle_offset));


    }

    movement() {

        let movement_prob = Math.random()*2;
        let movement_x = 0;
        let movement_z = 0;

        //If x_prob > 0, there are more food items to the right than left of our creature
        //If z_prob > 0, there are more food items to the top than bottom of our creature

        //move to the right

        console.log(this.xProb_adjustment);
        if(movement_prob >= 0 && movement_prob < (0.5 + this.xProb_adjustment)){
            movement_x = .06;
        }
        //move to the left
        if(movement_prob >= (0.5 + this.xProb_adjustment) && movement_prob < 1){
            movement_x = -0.06;
        }

        //move up
        if(movement_prob >= 1 && movement_prob < (1.5 + this.zProb_adjustment)){
            movement_z = 0.06;
        }
        //move down
        if(movement_prob >= (1.5 + this.zProb_adjustment) && movement_prob < 2.00){
            movement_z = -0.06;
        }
        let movement_vector = vec3(movement_x, 0, movement_z);

        return movement_vector;
    }
    adjustProb(x_prob, z_prob){
        //If x_prob > 0, there are more food items to the right than left of our creature
        //If z_prob > 0, there are more food items to the top than bottom of our creature
        let prob_adjustment_factor = 1;
        this.xProb_adjustment = x_prob*0.0001;// * prob_adjustment_factor;
        this.zProb_adjustment = z_prob*0.0001;// * prob_adjustment_factor;
    }

}
