class Vehicle {
    constructor(scene) {
        const geometry = new THREE.BoxGeometry(2, 1, 4); // enkel bil
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.5;
        scene.add(this.mesh);

        this.speed = 0;
        this.maxSpeed = 0.5;
        this.acceleration = 0.01;
        this.turnSpeed = 0.03;
    }

    update(keys) {
        // Framåt & bakåt
        if(keys['ArrowUp']) this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        else if(keys['ArrowDown']) this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed/2);
        else this.speed *= 0.95; // friktion

        // Vändning
        if(keys['ArrowLeft']) this.mesh.rotation.y += this.turnSpeed * (this.speed / this.maxSpeed);
        if(keys['ArrowRight']) this.mesh.rotation.y -= this.turnSpeed * (this.speed / this.maxSpeed);

        // Rörelse framåt
        this.mesh.position.x -= Math.sin(this.mesh.rotation.y) * this.speed;
        this.mesh.position.z -= Math.cos(this.mesh.rotation.y) * this.speed;
    }
}
