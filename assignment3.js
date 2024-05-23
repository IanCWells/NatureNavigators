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

export class Assignment3 extends Scene {
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
            creature1: new Minion(),
            creature2: new Minion(),
            creature3: new Minion(),
            creature4: new Minion(),
            sun: new defs.Subdivision_Sphere(4),
            food1: new Food(),
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
                {ambient: .4, diffusivity: .6, color: hex_color("#ff5555")}),
            species2: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#a020f0")}),
            species3: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FFFF00")}),
            species4: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#0066FF")}),

        };
        this.background_color = color(0.5, 0.8, 0.93, 1);
        this.map_size = 15;
        this.sun_speed = 0.5;
        this.sun_rad = 12;
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 22), vec3(0, 0, 0), vec3(0, 1, 0));
        this.day = 0;


        this.speed = 1;
        this.minion_position = vec3(0, 0, 0);
        this.last_update_time = null;

        this.food_positions = this.generate_food_positions(10); // Generate positions for 10 food items


    }
    get_background_color() {
        return this.background_color;
    }


    generate_food_positions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            // Random value between -map_size/2 and map_size/2
            const x = Math.random() * this.map_size - this.map_size / 2;
          //  console.log(x)
            const y = 0;
            const z = Math.random() * this.map_size - this.map_size / 2;
            positions.push(vec3(x, y, z));
        }
        return positions;
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        this.new_line();
        this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        this.new_line();
        this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);

        this.create_input_box("Speed", "speed", this.speed);

    }

    draw_grass(context, program_state) {
        let surface_transform = Mat4.identity()
            .times(Mat4.scale(this.map_size,this.map_size,this.map_size))
            .times(Mat4.rotation(Math.PI/2,1,0,0))
            .times(Mat4.rotation(Math.PI/4,0,0,1));
        this.shapes.surface.draw(context, program_state, surface_transform, this.materials.grass);
    }

    draw_sun(context, program_state, t) {
        let n = 0;
        if(this.day == 0){
            n =  -Math.PI/2 * Math.cos(t*this.sun_speed);
        }
        else{
            n = Math.PI/2;
        }
        if(n >= Math.PI/2 - 0.01){
            this.day += 1;
            n = Math.PI/2;//n *-1;
        }

        let translationMatrix = Mat4.translation(0, this.sun_rad, 0);
        let rotationMatrix = Mat4.rotation(n, 0, 0, 1);

        let light_position = vec4(0, 0, 0, 1);
        let translated_position = translationMatrix.times(light_position);
        let rotated_light_position = rotationMatrix.times(translated_position);

        program_state.lights = [new Light(rotated_light_position, color(1, 1, 1, 1), 10000)];
        let sun_transform = Mat4.identity();
        sun_transform = sun_transform.times(Mat4.rotation(n,0,0,1));
        sun_transform = sun_transform.times(Mat4.translation(0,this.sun_rad,0));
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sunMat);
    }

    draw_food(context, program_state) {
        for (let pos of this.food_positions) {
            let food_transform = Mat4.translation(pos[0], pos[1], pos[2]);
            this.shapes.food1.draw(context, program_state, food_transform, this.materials.foodMat);
        }
    }

    set_background_color(t) {
        let sky_color = Math.abs(Math.cos(t*this.sun_speed));
        this.background_color = color(sky_color,0.5,sky_color,1);
    }

    draw_minions(context, program_state, t) {
        //this.minion_position = this.minion_position.plus(vec3(0, 0, 0));
        let minion_transform = Mat4.translation(this.minion_position[0], this.minion_position[1], this.minion_position[2]);

        this.shapes.creature1.draw(context, program_state, minion_transform, this.materials.species1);

        this.minion_position = this.minion_position.plus(this.shapes.creature1.movement());

        let adjusted_time = t*4;
        if (Math.floor(adjusted_time) % 2 === 0) {
            console.log(adjusted_time);

            this.shapes.creature1.movement_speed = this.shapes.creature1.movement();
        }
        //this.shapes.creature1.movement_speed = this.shapes.creature1.movement();

        //Updates Creature position every tick
        this.shapes.creature1.position = this.minion_position;

        // this.shapes.creature1.setPosition(this.minion_position);

        //food is counted to the left right, top or bottom with respect to a creature, adjusting probabilty
        let food_count_x = 0
        let food_count_z = 0

        let food_count_closest_x = 0
        let food_count_closest_z = 0


        let closestFood = vec3(0,0,0)
        let shortDistance = 15
        for (let pos of this.food_positions) {
            let food_x = pos[0];
            let food_y = pos[1];
            let food_z = pos[2];
            let food_distance = Math.sqrt((this.shapes.creature1.position[0] - food_x)**2 + (this.shapes.creature1.position[2] - food_z)**2)
            if(food_distance < shortDistance){
                shortDistance = food_distance;
                closestFood = pos
                if(this.shapes.creature1.position[0] > closestFood[0])
                {
                    food_count_closest_x = (this.map_size) - (this.shapes.creature1.position[0] - closestFood[0]);

                }
                else
                {
                    food_count_closest_x = -1* ((this.map_size) - (closestFood[0] - this.shapes.creature1.position[0]));

                }
                if(this.shapes.creature1.position[2] > closestFood[2])
                {
                    food_count_closest_z = (this.map_size) - (this.shapes.creature1.position[2] - closestFood[2]);
                }
                else
                {
                    food_count_closest_z = -1* ((this.map_size) - (closestFood[2] - this.shapes.creature1.position[2]));
                }

            }


        }

        /*if(food_count_closest_x > 0)
        {
            this.shapes.creature1.adjustProb(-0.4, 0);
        }
        else
        {
            this.shapes.creature1.adjustProb(0.4, 0);
        }
        if(food_count_closest_z > 0)
        {
            this.shapes.creature1.adjustProb(this.shapes.creature1.xProb_adjustment, -0.4);
        }
        else
        {
            this.shapes.creature1.adjustProb(this.shapes.creature1.xProb_adjustment, 0.4);
        }*/
        //if z is closer than x, move in the x direction
        if(food_count_closest_x > food_count_closest_z)
        {
            if(food_count_closest_x > 0)
            {
                this.shapes.creature1.adjustProb(-0.4, 0, 'x');
            }
            else
            {
                this.shapes.creature1.adjustProb(0.4, 0, 'x');
            }
        }
        else
        {
            if(food_count_closest_z > 0)
            {
                this.shapes.creature1.adjustProb(0, -0.4, 'z');
            }
            else
            {
                this.shapes.creature1.adjustProb(0, 0.4, 'z');
            }
        }


        //this.shapes.creature1.draw(context, program_state, minion_transform, this.materials.test.override({color: red}));
    }

    check_eaten_food() {
        // for each minion, check if its near enough to each piece of food to eat it
        // if food is eaten, remove it from map and add energy to minion
        var remaining_food = this.food_positions;
        for (var i = 0; i < this.food_positions.length; i++) {
            let minion_to_food_dist = this.minion_position.minus(this.food_positions[i]).norm();
            if (minion_to_food_dist < (this.shapes.creature1.radius + this.shapes.food1.radius)) {
                this.shapes.creature1.energy += 1;
                remaining_food = remaining_food.splice(i,1);
                console.log(this.shapes.creature1.energy);
            }
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

        this.draw_sun(context,program_state, t);
        this.draw_grass(context,program_state);
        this.draw_food(context,program_state);
        this.set_background_color(t);
        this.draw_minions(context,program_state, t);
        this.check_eaten_food();
    }
}


