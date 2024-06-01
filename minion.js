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
        constructor(species) {
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

            this.movement_direction = vec3(0, 0, 0);
            this.speed = 1;
            this.radius = 0.5;
            this.starting_energy = 10;
            this.energy = this.starting_energy;

            this.xProb_adjustment = 0;
            this.zProb_adjustment = 0;
            this.position = vec3(0, 0, 0);
            this.color = "species1"; // the material the minion is drawn with
            this.species = species;

            this.plane = 'x';

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

            let movement_prob = Math.random();
            let moveChance = Math.random();
            let movement_x = 0;
            let movement_z = 0;

            //If x_prob > 0, there are more food items to the right than left of our creature
            //If z_prob > 0, there are more food items to the top than bottom of our creature

            //move to the right
            let min_speed = 0.04;
            //this.xProb_adjustment

            //can either move right, left, up, down, ur, ul, dr, dl
            //right if this.xProb_adjustment '-' and this.zProb_adjustment
            //one solution would be multiplying movement trajectory


            if(movement_prob >= 0 && movement_prob < (0.5 + this.xProb_adjustment)){
                movement_x = min_speed;
            }
            //move to the left
            if(movement_prob >= (0.5 + this.xProb_adjustment) && movement_prob < 1){
                movement_x = -min_speed;
            }
            if(movement_prob >= 0 && movement_prob < (0.5 + this.zProb_adjustment)){
                movement_z = min_speed;
            }
            //move down
            if(movement_prob >= (0.5 + this.zProb_adjustment) && movement_prob < 1.0){
                movement_z = -min_speed;
            }

            //Potential Solution for movement fix
            //console.log(this.normalized_x + " " + this.normalized_z);
            let store = ((this.normalized_x - this.normalized_z));
            //let store_z = Math.abs((this.normalized_z - this.normalized_x));
            console.log("store: " + store);
            //if store is close, then they should move diagnolly, if
            let movement_factor = 2;
            if(store < -0.035)
            {
                console.log("HERE1");
                movement_z = 0;
            }
            else if(store > 0.035)
            {
                console.log("HERE2");
                movement_x = 0;
            }




            return vec3(movement_x, 0, movement_z);
        }
        adjustProb(x_prob, z_prob, plane){
            //If x_prob > 0, there are more food items to the right than left of our creature
            //If z_prob > 0, there are more food items to the top than bottom of our creature
            let prob_adjustment_factor = 1;
            this.xProb_adjustment = x_prob;//*0.003;// * prob_adjustment_factor;
            this.zProb_adjustment = z_prob;//*0.003;// * prob_adjustment_factor;
            this.plane = plane;
        }
    }