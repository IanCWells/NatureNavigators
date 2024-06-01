// graph.js
import { tiny } from './tiny-graphics.js';
const { Shape, vec3, Vector3 } = tiny;

export class BarGraph extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        this.num_bars = 4;  // Assuming 4 species of minions
        this.bar_width = 0.5;
        this.bar_spacing = 1.0;
        this.max_height = 10;  // Maximum height for the bars

        // Initialize the bar heights to zero
        this.bar_heights = Array(this.num_bars).fill(0);
        
        // Generate the initial bar geometry
        this.generate_bars();
    }

    generate_bars() {
        // Clear existing arrays
        this.arrays.position = [];
        this.arrays.normal = [];
        this.arrays.texture_coord = [];
        this.indices = [];

        for (let i = 0; i < this.num_bars; i++) {
            const x = i * this.bar_spacing;
            const height = this.bar_heights[i];
            const w = this.bar_width / 2;
            const h = height / 2;

            // Define vertices for a single bar
            const vertices = [
                vec3(x - w, 0, -w), vec3(x + w, 0, -w), vec3(x + w, 0, w), vec3(x - w, 0, w),
                vec3(x - w, height, -w), vec3(x + w, height, -w), vec3(x + w, height, w), vec3(x - w, height, w)
            ];

            // Define faces for a single bar (two triangles per face)
            const faces = [
                [0, 1, 2, 0, 2, 3], // bottom
                [4, 5, 6, 4, 6, 7], // top
                [0, 1, 5, 0, 5, 4], // front
                [2, 3, 7, 2, 7, 6], // back
                [0, 3, 7, 0, 7, 4], // left
                [1, 2, 6, 1, 6, 5]  // right
            ];

            const base_index = i * 8; // Base index for the current bar's vertices

            // Add vertices, normals, and texture coordinates
            vertices.forEach(v => this.arrays.position.push(v));
            vertices.forEach(() => this.arrays.normal.push(Vector3(0, 1, 0))); // Simplified normals
            vertices.forEach(() => this.arrays.texture_coord.push(vec3(0, 0, 0))); // Simplified texture coords

            // Add indices for the faces
            faces.forEach(face => this.indices.push(...face.map(index => index + base_index)));
        }
    }

    update_bar_heights(new_heights) {
        this.bar_heights = new_heights;
        this.generate_bars();
    }
}
