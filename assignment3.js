import {defs, tiny} from './examples/common.js';
import {minion_defs} from './minion.js';
import {food_defs} from './food.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
const {
    Minion
} = minion_defs;
const {
    Food
} = food_defs;

export class NatureNavigators extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            surface: new defs.Regular_2D_Polygon(10, 4),
            creature: new Minion(),
            sun: new defs.Subdivision_Sphere(4),
            food1: new Food(),
            cube: new defs.Cube()
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            sunMat: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#FDB813")}),

            foodMat: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, specularity: 0, color: hex_color("#964B00")}),
            grass: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#29a651")}),
            species1: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ff5555")}), //red
            species2: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#a020f0")}), //purple
            species3: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FFFF00")}), //yellow
            species4: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#0066FF")}), //blue

            squareMat: new Material(new defs.Phong_Shader(), // Adding a material for the square
                {ambient: .5, diffusivity: .6, color: hex_color("#A9A9A9")}),


        };
        this.background_color = color(0.5, 0.8, 0.93, 1);
        this.day_length = 30; // how long a day is in seconds
        this.map_size = 30;
        this.sun_rad = this.map_size*0.75 + 2;
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 35), vec3(0, 0, 0), vec3(0, 1, 0));
        this.day = 0;
        this.paused = true;
        this.t = 0; // how long the simulation has been running for (unpaused time)
        this.last_t = 0; // used to keep track when time is paused

        this.species1_speed = 1;
        this.species2_speed = 1;
        this.species3_speed = 1;
        this.species4_speed = 1;
        this.species1_size = 1;
        this.species2_size = 1;
        this.species3_size = 1;
        this.species4_size = 1;
        this.last_update_time = 0;
        this.new_food_per_day = 100;
        this.last_food_grown_time = 0;
        this.food_positions = this.generate_food_positions(100); // Generate positions for 10 food items
        
        this.minion_initial_amt = 6;
        this.minion_positions = this.generate_minion_spawn_positions(this.minion_initial_amt);
        
        this.new_minion_count = {
            species1: this.minion_initial_amt,
            species2: this.minion_initial_amt,
            species3: this.minion_initial_amt,
            species4: this.minion_initial_amt
        };
        console.log("NEW MINION COUNT ", this.new_minion_count)


        this.minions = [];
        const colors = ["species1", "species2", "species3", "species4"];
        const edges = ["top", "bottom", "left", "right"];

        for (let i = 0; i < edges.length; i++) {
            for (let j = 0; j < this.minion_positions[edges[i]].length; j++) {
                let minion = new Minion(colors[i]);
                minion.position = this.minion_positions[edges[i]][j];
                minion.color = this.materials[colors[i]];
                this.minions.push(minion);
            }
        }
    }
    get_background_color() {
        return this.background_color;
    }

    generate_minion_spawn_positions(x) {
        // this.minion_initial_amt = x;
        const positions = {
            top: [],
            bottom: [],
            left: [],
            right: []
        };
        const map_edge = this.map_size / 2;

        for (let i = 0; i < x; i++) {
            let offset = (i / (x - 1)) * this.map_size - map_edge;
            positions.top.push(vec3(offset, 0, map_edge));
            positions.bottom.push(vec3(offset, 0, -map_edge));
            positions.left.push(vec3(-map_edge, 0, offset));
            positions.right.push(vec3(map_edge, 0, offset));
        }

        return positions;
    }



    generate_food_positions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            // Random value between -map_size/2 and map_size/2
            const x = Math.random() * (4/3) * this.map_size - (2/3) * this.map_size;
            const y = 0;
            const z = Math.random() * (4/3) * this.map_size - (2/3) * this.map_size;
            positions.push(vec3(x, y, z));
        }
        return positions;
    }

    make_control_panel() {
        this.create_input_box("Species 1 (Red) speed", "species1_speed", this.species1_speed);
        this.create_input_box("size", "species1_size", this.species1_size);
        this.new_line();
        this.create_input_box("Species 2 (Purple) speed", "species2_speed", this.species2_speed);
        this.create_input_box("size", "species2_size", this.species2_size);
        this.new_line();
        this.create_input_box("Species 3 (Yellow) speed", "species3_speed", this.species3_speed);
        this.create_input_box("size", "species3_size", this.species3_size);
        this.new_line();
        this.create_input_box("Species 4 (Blue) speed", "species4_speed", this.species4_speed);
        this.create_input_box("size", "species4_size", this.species4_size);
        this.new_line();
        this.key_triggered_button("Play/Pause Simulation", ["p"], () => {
            this.paused = !this.paused;
        });
    }

    draw_grass(context, program_state) {
        let surface_transform = Mat4.identity()
            .times(Mat4.scale(this.map_size,this.map_size,this.map_size))
            .times(Mat4.rotation(Math.PI/2,1,0,0))
            .times(Mat4.rotation(Math.PI/4,0,0,1))

        this.shapes.surface.draw(context, program_state, surface_transform, this.materials.grass);
    }


    draw_graph(context, program_state) {
        // First, draw the background surface
        let surface_transform = Mat4.identity()
            .times(Mat4.translation(0, this.map_size / 2.85, -this.map_size / 1.415))
            .times(Mat4.scale(this.map_size, this.map_size / 2, this.map_size))
            .times(Mat4.rotation(Math.PI / 4, 0, 0, 1));
    
        this.shapes.surface.draw(context, program_state, surface_transform, this.materials.squareMat);
    
        let species_counts = {
            species1: 0,
            species2: 0,
            species3: 0,
            species4: 0
        };
    
        for (let minion of this.minions) {
            species_counts[minion.species]++;
        }
        let species = ["species1", "species2", "species3", "species4"];

        let bar_width = 1;
        let bar_gap = 8.75;
        // let max_bar_height = 4; // Maximum bar height
        // let total_minions_alive = this.minions.length / species.length;

        // console.log("NEW MINION COUNT ", this.new_minion_count)
        let max_new_minion_count = Math.max(...Object.values(this.new_minion_count));



        for (let i = 0; i < species.length; i++) {
            let species_name = species[i];
            // let bar_height = (species_counts[species_name] / species.length) * max_bar_height;
            // let y_scale = (species_counts[species_name] / this.new_minion_count[species_name]);
            let y_scale = (species_counts[species_name] / max_new_minion_count);
            


            // console.log("species_counts[species_name]: ", species_counts[species_name])
            // console.log("species.length: ", species.length)
            // console.log("total_minions_alive", total_minions_alive)
            // console.log("y_scale: ", y_scale)

            let bar_transform = Mat4.identity()
                .times(Mat4.translation(
                    -this.map_size / 2 + bar_width / 2 + i * (bar_width + bar_gap),
                    this.map_size / 256,
                    0))
                .times(Mat4.scale(bar_width * 4, this.map_size / 4 , bar_width / 2))
                .times(Mat4.translation(0, y_scale, -this.map_size * 1.378))
                .times(Mat4.scale(1, y_scale, 1));

            this.shapes.cube.draw(context, program_state, bar_transform, this.materials[species_name]);
        }
    }
    

    draw_sun(context, program_state) {
        let n =  -Math.PI/2 * Math.cos((this.t % this.day_length)*Math.PI/this.day_length);

        let translationMatrix = Mat4.translation(0, this.sun_rad, 0);
        let rotationMatrix = Mat4.rotation(n, 0, 0, 1);

        let light_position = vec4(0, 0, 0, 1);
        let translated_position = translationMatrix.times(light_position);
        let sun_light_position = rotationMatrix.times(translated_position);

        let sun_position = Mat4.identity()
            .times(Mat4.rotation(n,0,0,1))
            .times(Mat4.translation(0,this.sun_rad,0));
        program_state.lights = [new Light(sun_light_position, color(1, 1, 1, 1), 10000)];
        this.shapes.sun.draw(context, program_state, sun_position, this.materials.sunMat);
    }

    draw_food(context, program_state) {
        for (let pos of this.food_positions) {
            let food_transform = Mat4.translation(pos[0], pos[1], pos[2]);
            this.shapes.food1.draw(context, program_state, food_transform, this.materials.foodMat);
        }
    }

    set_background_color() {
        let t = this.t % this.day_length;
        let color_intensity = Math.sin(t*Math.PI/this.day_length);
        this.background_color = color(0.5*color_intensity,0.8*color_intensity,0.93*color_intensity,1);
    }

    draw_minions(context, program_state) {
        for (let minion of this.minions) {
            let minion_transform = Mat4.translation(minion.position[0], minion.position[1], minion.position[2]);
            minion.draw(context, program_state, minion_transform, minion.color);
            if (!this.paused) {
                minion.position = minion.position.plus(minion.movement_direction.times(minion.speed));
            }

            let adjusted_time = this.t*4;
            if (Math.floor(this.t*8) % 2 === 0) {
                minion.movement_direction = minion.movement();
            }
            //make sure creature doesn't leave the grass
            let x_pos = minion.position[0];
            let z_pos = minion.position[2];
            if (x_pos <= -this.map_size/1.5 || x_pos >= this.map_size/1.5
                || z_pos <= -this.map_size/1.5 || z_pos >= this.map_size/1.5) {
                minion.movement_direction = vec3(0,0,0).minus(minion.position).normalized().times(0.05);
            }

            let food_count_x = 0
            let food_count_z = 0

            let food_count_closest_x = 0
            let food_count_closest_z = 0


            let closestFood = vec3(0,0,0)
            let shortDistance = this.map_size;
            for (let pos of this.food_positions) {
                let food_x = pos[0];
                let food_y = pos[1];
                let food_z = pos[2];
                let food_distance = Math.sqrt((minion.position[0] - food_x)**2 + (minion.position[2] - food_z)**2)
                if(food_distance < shortDistance){
                    shortDistance = food_distance;
                    closestFood = pos
                    if(minion.position[0] > closestFood[0]) {
                        food_count_closest_x = (this.map_size) - (minion.position[0] - closestFood[0]);

                    }
                    else {
                        food_count_closest_x = -1* ((this.map_size) - (closestFood[0] - minion.position[0]));

                    }
                    if(minion.position[2] > closestFood[2]) {
                        food_count_closest_z = (this.map_size) - (minion.position[2] - closestFood[2]);
                    }
                    else {
                        food_count_closest_z = -1* ((this.map_size) - (closestFood[2] - minion.position[2]));
                    }
                }
            }
            let movement_prob = 0.4999;

            if(food_count_closest_x > 0 && food_count_closest_z > 0) {
                minion.adjustProb(-movement_prob, -movement_prob, food_count_closest_x, food_count_closest_z, this.map_size);
            }
            else if (food_count_closest_x > 0 && food_count_closest_z <= 0) {
                minion.adjustProb(-movement_prob, movement_prob, food_count_closest_x, food_count_closest_z, this.map_size);
            }
            else if(food_count_closest_x <= 0 && food_count_closest_z > 0)
            {
                minion.adjustProb(movement_prob, -movement_prob, food_count_closest_x, food_count_closest_z, this.map_size);
            }
            else
            {
                minion.adjustProb(movement_prob, movement_prob, food_count_closest_x, food_count_closest_z, this.map_size);
            }
        }
    }

    check_eaten_food() {
        // for each minion, check if its near enough to each piece of food to eat it
        // if food is eaten, remove it from map and add energy to minion
        var remaining_food = this.food_positions;
        for (let minion of this.minions) {
            for (var i = 0; i < this.food_positions.length; i++) {
                let minion_to_food_dist = minion.position.minus(this.food_positions[i]).norm();
                if (minion_to_food_dist < (minion.radius + this.shapes.food1.radius)) {
                    minion.energy += 1;
                    remaining_food = remaining_food.splice(i,1);
                }
            }
        }
    }

    check_new_day() {
        // there is a new day once every this.day_length seconds
        if (Math.floor(this.t) % this.day_length == 0
            && this.day <= Math.floor(this.t/this.day_length)) {
            this.day += 1;
            return true;
        } else {
            return false;
        }
    }

    setup_new_day(context,program_state) {
        this.minions_reproduce();
    }

    update_minion_health() {
        let time_passed = this.t - this.last_update_time;
        // reduce minion energies based on their speed on how much time has passed
        var remaining_minions = this.minions;
        for (var i = 0; i < this.minions.length; i++) {
            let minion = this.minions[i];
            minion.energy -= 0.5 * minion.radius * minion.speed**2 * time_passed ; // KE = 0.5mv^2
            // check if any minions have died from losing all energy
            if (minion.energy <= 0) {
                remaining_minions = remaining_minions.splice(i,1);
            }
        }
        this.last_update_time = this.t;
    }

    change_minion_size(minion, new_size) {
        let new_minion = new Minion(minion.color, new_size);
        new_minion.position = minion.position
        new_minion.color = minion.color;
        new_minion.speed = minion.speed;
        new_minion.species = minion.species;
        new_minion.energy = (new_size/minion.radius) * minion.energy + 1;
        return new_minion;
    }

    update_minion_traits() {
        var updated_minions = this.minions;
        for (var i = 0; i < this.minions.length; i++) {
            let minion = this.minions[i];
            switch(minion.species) {
                case "species1":
                    minion.speed = this.species1_speed;
                    if (minion.radius * 2 != this.species1_size) {
                        let new_minion = this.change_minion_size(minion,this.species1_size/2);
                        updated_minions.push(new_minion);
                        updated_minions = updated_minions.splice(i,1);
                    }
                    break;
                case "species2":
                    minion.speed = this.species2_speed;
                    if (minion.radius * 2 != this.species2_size) {
                        let new_minion = this.change_minion_size(minion,this.species2_size/2);
                        updated_minions.push(new_minion);
                        updated_minions = updated_minions.splice(i,1);
                    }
                    break;
                case "species3":
                    minion.speed = this.species3_speed;
                    if (minion.radius * 2 != this.species3_size) {
                        let new_minion = this.change_minion_size(minion,this.species3_size/2);
                        updated_minions.push(new_minion);
                        updated_minions = updated_minions.splice(i,1);
                    }
                    break;
                case "species4":
                    minion.speed = this.species4_speed;
                    if (minion.radius * 2 != this.species4_size) {
                        let new_minion = this.change_minion_size(minion,this.species4_size/2);
                        updated_minions.push(new_minion);
                        updated_minions = updated_minions.splice(i,1);
                    }
                    break;
            }
        }
    }

    minions_reproduce() {
        for (let minion of this.minions) {
            if (minion.energy > minion.starting_energy) {
                let new_minion = new Minion(minion.color);
                new_minion.position = minion.position.plus(vec3(0,0,0).minus(minion.position).normalized().times(0.05));
                new_minion.color = minion.color;
                new_minion.speed = minion.speed;
                
                new_minion.species = minion.species;
                
                minion.energy -= minion.starting_energy;

                this.minions.push(new_minion);

                if (this.new_minion_count.hasOwnProperty(new_minion.species)) {
                    this.new_minion_count[new_minion.species]++;
                } else {
                    console.error("Unknown species: " + new_minion.species);
                }
                

            }
        }

    }

    grow_food() {
        if (this.t - this.last_food_grown_time >= this.day_length / this.new_food_per_day) {
            this.food_positions = this.food_positions.concat(this.generate_food_positions(1));
            this.last_food_grown_time = this.t;
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        if (!this.paused) {
            this.t += t - this.last_t;
        }

        if (this.check_new_day()) {
            this.setup_new_day(context,program_state);
        }
        this.draw_sun(context,program_state);
        this.draw_grass(context,program_state);
        this.draw_food(context,program_state);
        this.set_background_color();
        this.draw_minions(context,program_state);
        this.check_eaten_food();
        this.grow_food();
        this.update_minion_traits();
        this.update_minion_health();
        
        this.last_t = t;

        this.draw_graph(context,program_state);
    }
}