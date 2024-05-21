import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

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
}



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

        };
        this.background_color = color(0.5, 0.8, 0.93, 1);
        this.map_size = 15;
        this.sun_speed = 0.5;
        this.sun_rad = 12;
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));


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
            const x = Math.random() * this.map_size - this.map_size / 2;
            console.log(x)
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
//color(0.5, 0.8, 0.93, 1)
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

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const green = hex_color("#29a651");
        let surface_transform = Mat4.identity()
                .times(Mat4.scale(this.map_size,this.map_size,this.map_size))
                .times(Mat4.rotation(Math.PI/2,1,0,0))
            .times(Mat4.rotation(Math.PI/4,0,0,1));

        
        let n =  -Math.PI/2 * Math.cos(t*this.sun_speed);

        let translationMatrix = Mat4.translation(0, this.sun_rad, 0);
        let rotationMatrix = Mat4.rotation(n, 0, 0, 1);

        let light_position = vec4(0, 0, 0, 1);
        let translated_position = translationMatrix.times(light_position);
        let rotated_light_position = rotationMatrix.times(translated_position);

        program_state.lights = [new Light(rotated_light_position, color(1, 1, 1, 1), 10000)];
        let sun_transform = Mat4.identity();
        sun_transform = sun_transform.times(Mat4.rotation(n,0,0,1));
        sun_transform = sun_transform.times(Mat4.translation(0,this.sun_rad,0));
        // let minion_transform = Mat4.identity()
                // .translation(0, 0, 0);'
        // let minion_transform = Mat4.identity()
        //         .times(Mat4.translation(this.speed*t,0,0));

        this.minion_position = this.minion_position.plus(vec3(this.speed * dt, 0, 0));
        let minion_transform = Mat4.translation(this.minion_position[0], this.minion_position[1], this.minion_position[2])
                // .plus(Mat4.translation(0,1.29,0));
        
        const red = hex_color("#ff5555");
        this.shapes.surface.draw(context, program_state, surface_transform, this.materials.test.override({color: green}));
        this.shapes.creature1.draw(context, program_state, minion_transform, this.materials.test.override({color: red}));
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sunMat)

        
        // let food_transform = Mat4.identity();
        // food_transform = food_transform.times(Mat4.translation(1,0,0));
        // this.shapes.food1.draw(context, program_state, food_transform, this.materials.foodMat);
        for (let pos of this.food_positions) {
            let food_transform = Mat4.translation(pos[0], pos[1], pos[2]);
            this.shapes.food1.draw(context, program_state, food_transform, this.materials.foodMat);
        }
        //this.shapes.creature1.draw(context, program_state, minion_transform, this.materials.test.override({color: red}));
    }
}


