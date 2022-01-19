
var isPlay = true;
var data = null;

function init() {
    loadData().then(showData);
}

/**
 * Loads the data from csv via D3 JS
 */
function loadData() {
    return Promise.all([
        d3.csv("data/dont_stop_me_now_export.csv")

    ]).then(datasets => {
        data = datasets[0]
        
        // TEST - TO BE REMOVED
        //======================================================================================================//
        console.log(data)

        return data;
    })
}

/**
 * Builds up the Spotify Song Visualizer
 */
function showData(){ 
    const barHeightMax = 15;
    const innerWidth = data.length

    // ADD EVENTLISTENER FOR INTERACTION ELEMENTS
    //======================================================================================================//
    

    
    // CREATE THREE JS BASE OBJECTS
    //======================================================================================================//
   
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, near = 0.1, far = 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: 1});

    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // DEFINE SCALES WITH D3 JS
    //======================================================================================================//
   
    // Create scales for the position and lenght of the segment bars
    const x = d3.scaleBand().range([0, innerWidth]);
    const y = d3.scaleLinear().range([0, barHeightMax]);
    const c = d3.scaleLinear()
        .interpolate(d3.interpolateRgb)
        .range([d3.rgb('#ed4df5'), d3.rgb("#3f5efb")]);

    // TODO: Color of the 12 segment bar pitches (one differently colored section per pitch) 
    // const c = d3.scaleLinear()
    //     .interpolate(d3.interpolateHcl)
    //     .range([d3.rgb('#618DFB'), d3.rgb("#431A42")]);

    // Scale the range of the data
    const y_domain = d3.extent(data, function(d) { return  (d.duration)});
    const x_domain = d3.map(data, (d) => { return d.segment })
    const c_domain = d3.extent(data, function(d) { return  (d.loudness_max)});

    y.domain(y_domain);
    x.domain(x_domain);
    c.domain(c_domain);

    // ADD BARS IN SPIRAL FORM
    //======================================================================================================//
   
    const n = data.length;
    const radius = 8;
    const nPerTurn = 60;
    const angleStep = (Math.PI * 2) / nPerTurn;
    const heightStep = 0.06;

    const createBar = (d) => {
        // const geometry = new THREE.BoxBufferGeometry(1*y(d.duration),1,1, 9, 9);
        // const material = new THREE.MeshPhongMaterial( {color: c(d.loudness_max), shininess: 10})
        // let bar = new THREE.Mesh( geometry, material );
        
        const geometry = new THREE.CylinderBufferGeometry(0.5, 0.5, 1*y(d.duration),50, 10);
        const material = new THREE.MeshPhongMaterial( {color: c(d.loudness_max), shininess: 10})
        let bar = new THREE.Mesh( geometry, material );

        scene.add( bar );
        bar = positionBar(bar, d)
            
        return bar
    }

    // Position the bar on x axes by shifting it depending on the index in the data
    // the defined bar dimensions and the platform height
    const positionBar = (bar, d) => {

        let evenTurn = false; //d.segment%110 > nPerTurn;
        let radiusFactor = evenTurn ? 1.2 : 1;

        // Rotate Object
        bar.rotation.z = (angleStep * d.segment) +  Math.PI / 2;
        bar.rotation.x = Math.PI / 2;

        // Set Object Position
        bar.position.x = Math.cos(angleStep * d.segment) * (radius * radiusFactor + y(d.duration) / 2);
        bar.position.y = heightStep * d.segment;
        bar.position.z = Math.sin(angleStep * d.segment) * (radius * radiusFactor + y(d.duration) / 2);

        bar.maxPositionY = bar.position.y;

        return bar;
    }

    // Create a bar for each entry in data
    bars = []
    data.forEach((d, i) => { 
        bar = {
            mesh: createBar(d, i),
            d: d,
            i: i
        }
        bars.push(bar);
        scene.add(bar.mesh);
    })

    // ADD LIGHT 
    //======================================================================================================//
   
    const createLightSource = (light, position, showLightGeometry = false) => {
    
        // If geometry and material are passed, mesh them and add them to screen in the light postion
        if(showLightGeometry) {
            let geometry = new THREE.SphereGeometry(1,10,10);
            let material = new THREE.MeshPhongMaterial( {color: "white", transparent: true, shininess: 100})
            let sphere = new THREE.Mesh(geometry, material);      
            sphere.position.set(position.x, position.y, position.z)
            scene.add( sphere );
        }

        // Create light and add it to the scene in the defined position
        light.position.set(position.x, position.y, position.z)
        scene.add( light );
    }

    createLightSource(
        light = new THREE.DirectionalLight("white", 0.5), 
        position = {x: -10, y: 10, z: 0},
        showLightGeometry = false
    )

    createLightSource(
        light = new THREE.DirectionalLight("white", 0.5), 
        position = {x: 10, y: 10, z: 0},
        showLightGeometry = false
    )

    const lightAmbient = new THREE.AmbientLight("white")
    scene.add( lightAmbient );

    // ADJUST CAMERA A & SCENE SETTINGS
    //======================================================================================================//
    
    // Adjust camera position to make the object visable
    camera.position.set(0, 50, 20);
    // camera.position.set(0, 15, 0);

    // Position scene vertically
    scene.position.y -= n * heightStep / 2;

    // TODO: REMOVE AXIS HELPER
    // const axesHelper = new THREE.AxesHelper( 100 );
    // scene.add( axesHelper );

    // ITERACTION 
    //======================================================================================================//

    // Add controls to move the camera
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target.set(0,0,0);
    controls.update();

    const animate = () => {
     
        // Render the scene according to the camera settings
        renderer.render(scene, camera)

        // Set up endless repetition/ loop
        requestAnimationFrame(animate)

        if (isPlay) {
            scene.rotation.y -= 0.001
        }

    }

    // Call function to animate in a loop
    animate()

    // REACT TO RESIZE 
    //======================================================================================================//

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
      }
    
    // React to resizing of the browser
    window.addEventListener( 'resize', onResize, false);


}

window.addEventListener("load", init)