
var isPlay = false;
var is3D = true;
var inTransition = false;
var data = null;

function init() {
    loadData().then(showData);
}

/**
 * Loads the data from csv
 */
function loadData() {
    return Promise.all([
        d3.csv("data/dont_stop_me_now_export.csv")

    ]).then(datasets => {
        data = datasets[0]
        
        // TEST TO BE REMOVED !!!!!!!!!!!!!!!!!!!!
        //======================================================================================================//
        console.log(data)

        return data;
    })
}

/**
 * Builds up the Spotify Song Visualizer
 */
function showData(){ 
    const barMargin = 0.1;
    const barHeightMax = 10;
    const barWidth = barMargin * 2;

    // ADD EVENTLISTENER FOR INTERACTION ELEMENTS
    //======================================================================================================//
    

    
    // CREATE THREE JS BASE OBJECTS
    //======================================================================================================//
   
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, near = 0.1, far = 1000 );
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: 1});
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // DEFINE SCALES
    //======================================================================================================//
   
    // Create scales 
    // const x = d3.scaleBand().range([0, innerWidth]);
    // const z = d3.scaleBand().range([0, -innerWidth]);

    // Length of the segment bar
    const y = d3.scaleLinear().range([0, barHeightMax]);

    // Color of the 12 segment bar pitches (one differently colored section per pitch) 
    // const c = d3.scaleLinear()
    //     .interpolate(d3.interpolateHcl)
    //     .range([d3.rgb('#618DFB'), d3.rgb("#431A42")]);

    // Scale the range of the data
    const duration_domain = d3.extent(data, function(d) { return  (d.duration)});
    // const cat2_set = new Set(data.map(function(d){ return d.cat2 }));
    // const value_max = d3.max(data, function(d) { return  (d.value)});
    // const value_min = d3.min(data, function(d) { return  (d.value)});

    y.domain(duration_domain);
    // z.domain(cat2_set);
    // y.domain([0, value_max])
    // c.domain([value_max, 0])

    // ADD PLATFORM
    //======================================================================================================//


    // ADD BARS
    //======================================================================================================//
   
    const createBar = (value, i) => {
        let geometry = new THREE.BoxGeometry(1,1,1);
        let material = new THREE.MeshPhongMaterial( {color: "#eeeeee", shininess: 10})
        let bar = new THREE.Mesh( geometry, material );
        scene.add( bar );
    
        bar = scaleBar(bar, value)
        bar = positionBar(bar, value, i)
            
        return bar
    }

    // Scale the bar according to the individual values in the data and the global bar settings
    const scaleBar = (bar, value) => {
        bar.scale.y = y(value);
        bar.scale.x = barWidth; 
        bar.scale.z = barWidth;
        bar.maxScaleY = bar.scale.y;

        return bar;
    }
    
    // Position the bar on x axes by shifting it depending on the index in the data
    // the defined bar dimensions and the platform height
    const positionBar = (bar, value, i) => {
        bar.position.x = bar.position.x + (barWidth * i)
        // bar.position.z = z(cat2) + barWidth/2 + innerWidth/2
        bar.position.y += y(value) /2
        bar.maxPositionY = bar.position.y;

        return bar;
    }

    // Create a bar for each entry in data
    bars = []
    data.forEach((d, i) => { 
        bar = {
            mesh: createBar(d.duration, i),
            d: d,
            i: i
        }
        bars.push(bar);
        scene.add(bar.mesh);
    })

    // ADD TICK LABELS
    //======================================================================================================//

    
    // ADD LEGEND
    //======================================================================================================//


    // ADD TITLE
    //======================================================================================================//


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
    camera.position.set(0, 0, barWidth * data.length/2 * 1.2);
    // camera.position.set(0, 15, 0);

    // Position scene vertically
    scene.position.x -= barWidth * data.length/2

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

        if(!is3D & inTransition) {
            transitionTo2D()
        }

        if(is3D & inTransition) {
            transitionTo3D()
        }

        if (isPlay) {
            scene.rotation.y -= 0.01
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