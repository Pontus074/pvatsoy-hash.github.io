let scene, camera, renderer;
let vehicle;
let keys = {};
let money = 0;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Ljus
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Mark
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    ground.rotation.x = -Math.PI/2;
    scene.add(ground);

    // Bil
    vehicle = new Vehicle(scene);

    // Event listeners
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    vehicle.update(keys);

    // Kameran följer bilen
    camera.position.x = vehicle.mesh.position.x + 10 * Math.sin(vehicle.mesh.rotation.y);
    camera.position.z = vehicle.mesh.position.z + 10 * Math.cos(vehicle.mesh.rotation.y);
    camera.position.y = 5;
    camera.lookAt(vehicle.mesh.position);

    // Enkel driftpoäng (bara för demo)
    if(keys['ArrowLeft'] || keys['ArrowRight']) money += 0.1; 
    document.getElementById('money').innerText = 'Pengar: ' + Math.floor(money);

    renderer.render(scene, camera);
}
