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
        const ellipsoid_transform = Mat4.scale(0.5, 0.75, 0.5); // Scale the sphere to form an ellipsoid
        const circle_transform = Mat4.translation(0, 1, 0).times(Mat4.scale(0.25, 0.25, 0.25)); // Position and scale the circle

        // Initialize arrays
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
            creature1: new Minion()
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")})
        }

        this.map_size = 15;
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
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

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const green = hex_color("#29a651");
        let surface_transform = Mat4.identity()
                .times(Mat4.scale(this.map_size,this.map_size,this.map_size))
                .times(Mat4.rotation(Math.PI/2,1,0,0))
            .times(Mat4.rotation(Math.PI/4,0,0,1));



        let minion_transform = Mat4.identity();
        const red = hex_color("#ff5555");
        this.shapes.surface.draw(context, program_state, surface_transform, this.materials.test.override({color: green}));
        this.shapes.creature1.draw(context, program_state, minion_transform, this.materials.test.override({color: red}));
    }
}


