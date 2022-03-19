const maxZoom = 50
var currentZoom = maxZoom;
var isPlay = true;
var zoomIn = true;
var capture = true;
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
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: 0});

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
    const radius = 10;
    const nPerTurn = 65;
    const angleStep = (Math.PI * 2) / nPerTurn;
    const heightStep = 0.08;

    const createBar = (d) => {
        const bar = new THREE.Group()
        const cylinderGeo = new THREE.CylinderBufferGeometry(0.5, 0.5, 1*y(d.duration),50, 10);
        const sphereGeo = new THREE.SphereGeometry(0.5, 50, 5, 0, Math.PI*2, 0, Math.PI/2);
        const material = new THREE.MeshPhongMaterial( {color: c(d.loudness_max), shininess: 20, opacity: 1, transparent: true})
        
        const cyninder = new THREE.Mesh( cylinderGeo, material );
        bar.add(cyninder)

        const sphereInner = new THREE.Mesh(sphereGeo, material)
        sphereInner.position.y = 1*y(d.duration)/2;
        bar.add(sphereInner)

        const sphereOuter = sphereInner.clone();
        sphereOuter.rotation.z = Math.PI;
        sphereOuter.position.y = -1*y(d.duration)/2;
        bar.add(sphereOuter)

        positionBar(bar, d)
            
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
        bar.position.y = (heightStep * d.segment) -(n*heightStep/2);
        bar.position.z = Math.sin(angleStep * d.segment) * (radius * radiusFactor + y(d.duration) / 2);

        bar.maxPositionY = bar.position.y;
    }

    // Create a bar for each entry in data
    const barGroup = new THREE.Group();
    data.forEach((d, i) => { barGroup.add(createBar(d, i))})
    scene.add(barGroup)

    // ADD LIGHT 
    //======================================================================================================//
   
    const lightColor = "white";
    const lightIntensity = 0.2;
    const lightSourceVisible = false;
    const lightSourcesConfig = [
        {color: lightColor, intensity: lightIntensity, x: 0, y: heightStep*n * 2, z: 0, visible: lightSourceVisible},
        {color: lightColor, intensity: lightIntensity, x: 0, y: -heightStep*n, z: 0, visible: lightSourceVisible}
    ]

    const createLightSource = (light, position, showLightGeometry = false) => {
    
        // If geometry and material are passed, mesh them and add them to screen in the light postion
        if(showLightGeometry) {
            let geometry = new THREE.SphereGeometry(1,10,10);
            let material = new THREE.MeshLambertMaterial( {color: "white", transparent: true, shininess: 100})
            let sphere = new THREE.Mesh(geometry, material);      
            sphere.position.set(position.x, position.y, position.z)
            scene.add( sphere );
        }

        // Create light and add it to the scene in the defined position
        light.position.set(position.x, position.y, position.z)
        scene.add( light );
    }

    lightSourcesConfig.forEach(l => {
        createLightSource(
            light = new THREE.DirectionalLight(l.color, l.intensity), 
            position = {x: l.x, y: l.y, z: l.z},
            showLightGeometry = l.visible
        )
    });

    const lightAmbient = new THREE.AmbientLight("white")
    scene.add( lightAmbient );

    // ADJUST OBJECT, CAMERA & SCENE SETTINGS
    //======================================================================================================//
    
    // Adjust camera position to make the object visable
    camera.position.set(0, 0, 60);

    // Rotate group
    barGroup.rotation.z = Math.PI / 2
    barGroup.rotation.y+= Math.PI / 2

    // const axesHelper = new THREE.AxesHelper( 100 );
    // scene.add( axesHelper );

    // CAPTURER TO CREATE VIDEO
    //======================================================================================================//

    // Create a capturer that exports a WebM video
    var capturer = capture ? new CCapture( {
        verbose: false,
        display: true,
        framerate: 25,
        quality: 70,
        format: 'webm' 
    } ) : false;

    // ANIMATION & ITERACTION 
    //======================================================================================================//

    // Add controls to move the camera
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target.set(0,0,0);
    controls.update();

    const animate = () => {

        // Set up endless repetition/ loop
        requestAnimationFrame(animate)

        // Render the scene according to the camera settings
        renderer.render(scene, camera)

        let zoomStep = 0.3;
        if (isPlay) {
            // barGroup.rotation.x -= 0.01;
            // barGroup.rotation.y+= 0.01;
            // barGroup.rotation.z += 0.01;
            scene.rotation.z += 0.01

            if(currentZoom > 0 && zoomIn) {
                camera.position.z -= zoomStep
                currentZoom -= zoomStep;
            }
            else if(currentZoom <= 0 && zoomIn) {
                zoomIn = !zoomIn;
            }
            else if(currentZoom < maxZoom && !zoomIn) {
                camera.position.z += zoomStep
                currentZoom += zoomStep;
            }
            else if(currentZoom >= maxZoom && !zoomIn) {
                zoomIn = !zoomIn;
            }

        }
        if( capturer ) capturer.capture( renderer.domElement );

    }

    // Call function to animate in a loop
    animate()

    if( capturer ) {
        capturer.start();
        window.setTimeout(() => {
            capturer.stop();
    
            // default save, will download automatically a file called {name}.extension (webm/gif/tar)
            capturer.save();
        
        }, 15000);
    
    }

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