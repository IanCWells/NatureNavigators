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
        constructor(species, radius=0.5) {
            super("positions", "normals", "texture_coords");

            // Create the ellipsoid body (stretched sphere)
            let ellipsoid = new defs.Subdivision_Sphere(2);
            // Create the circular head
            let circle = new defs.Subdivision_Sphere(4); // Adjust the subdivisions for the desired smoothness

            // Define transformations
            this.radius = radius;
            this.ellipsoid_transform = Mat4.translation(0, this.radius, 0)
                .times(Mat4.scale(this.radius, this.radius*1.5, this.radius)); // Scale the sphere to form an ellipsoid
            this.circle_transform = Mat4.translation(0, 3*this.radius, 0)
                .times(Mat4.scale(this.radius*0.5, this.radius*0.5, this.radius*0.5)); // Position and scale the circle

            this.arrays.position = [];


            this.arrays.normal = [];
            this.arrays.texture_coord = [];
            this.indices = [];

            this.movement_direction = vec3(0, 0, 0);
            this.speed = 1;

            this.starting_energy = 10*2*radius;
            this.energy = this.starting_energy;

            this.sight = 30;

            this.xProb_adjustment = 0;
            this.zProb_adjustment = 0;
            this.position = vec3(0, 0, 0);
            this.color = "species1"; // the material the minion is drawn with
            this.species = species;

            // used for when the traits of the whole species are manually updated
            this.species_radius = radius;
            this.species_speed = 1;

            this.plane = 'x';

            // Transform and add the ellipsoid vertices
            for (let i = 0; i < ellipsoid.arrays.position.length; i++) {
                this.arrays.position.push(this.ellipsoid_transform.times(ellipsoid.arrays.position[i].to4(1)).to3());
                this.arrays.normal.push(this.ellipsoid_transform.times(ellipsoid.arrays.normal[i].to4(0)).to3());
                this.arrays.texture_coord.push(ellipsoid.arrays.texture_coord[i]);
            }

            // Transform and add the circle vertices
            for (let i = 0; i < circle.arrays.position.length; i++) {
                this.arrays.position.push(this.circle_transform.times(circle.arrays.position[i].to4(1)).to3());
                this.arrays.normal.push(this.circle_transform.times(circle.arrays.normal[i].to4(0)).to3());
                this.arrays.texture_coord.push(circle.arrays.texture_coord[i]);
            }

            // Combine the indices from both shapes
            this.indices.push(...ellipsoid.indices);
            const circle_offset = ellipsoid.arrays.position.length;
            this.indices.push(...circle.indices.map(i => i + circle_offset));


        }

        randomMovement(){
            let movement_prob = Math.random();
            let min_speed = 0.04;
            if(movement_prob >= 0 && movement_prob < 0.25){
                return vec3(min_speed, 0, min_speed);
            }
            else if(movement_prob >= 0.25 && movement_prob < 0.5){
                return vec3(-min_speed, 0, min_speed);
            }
            else if(movement_prob >= 0.5 && movement_prob < 0.75){
                return vec3(min_speed, 0, -min_speed);
            }
            else if(movement_prob >= 0.75 && movement_prob < 1){
                return vec3(-min_speed, 0, -min_speed);
            }
        }

        movement() {
            let movement_prob = Math.random();
            let movement_x = 0;
            let movement_z = 0;

            let min_speed = 0.04;
            if(movement_prob >= 0 && movement_prob < (0.5 + this.xProb_adjustment)){
                movement_x = min_speed;
            }
            if(movement_prob >= (0.5 + this.xProb_adjustment) && movement_prob < 1){
                movement_x = -min_speed;
            }
            if(movement_prob >= 0 && movement_prob < (0.5 + this.zProb_adjustment)){
                movement_z = min_speed;
            }
            if(movement_prob >= (0.5 + this.zProb_adjustment) && movement_prob < 1.0){
                movement_z = -min_speed;
            }
            let store = ((this.normalized_x - this.normalized_z));
            if(store < -0.025)
            {
                movement_z = 0;
            }
            else if(store > 0.025)
            {
                movement_x = 0;
            }
            return vec3(movement_x, 0, movement_z);
        }
        adjustProb(x_prob, z_prob, food_count_closest_x, food_count_closest_z, map_size){
            //If x_prob > 0, there are more food items to the right than left of our creature
            //If z_prob > 0, there are more food items to the top than bottom of our creature
            let prob_adjustment_factor = 1;
            this.xProb_adjustment = x_prob;//*0.003;// * prob_adjustment_factor;
            this.zProb_adjustment = z_prob;//*0.003;// * prob_adjustment_factor;

            this.normalized_x = Math.abs((food_count_closest_x / (map_size)));
            this.normalized_z = Math.abs(food_count_closest_z / map_size);
        }
    }