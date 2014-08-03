/**
 * @namespace
 */
M.qtype_threedmodel = M.qtype_threedmodel || {};

/**
 * This function is initialized from PHP
 *
 * @param {Object} Y YUI instance
 */

M.qtype_threedmodel.toggleObject = function(Y, test) {
    console.log('toggleObject aufgerufen:', test);
}

M.qtype_threedmodel.init = function(Y, fullurl) {

    var scene;
    var camera;
    var renderer;
    var model;
    var animations;
    var kfAnimations = [];
    var kfAnimationsLength = 0;
    var loader = new THREE.ColladaLoader();
    var lastTimestamp;
    var progress = 0;


    var controls;
    var targetList = [];
    var projector;
    var selectedPiece = null;
    var mouse = {x: 0, y: 0};


    var modelParts = [];


    var modelPartsBox = document.createElement('div');
    modelPartsBox.setAttribute('style', 'position:absolute;left:15px;top:15px;z-index:1500;background:white;');
    Y.one('#threedmodelContainer').appendChild(modelPartsBox);

    loader.load(fullurl, function(collada) {

        model = collada.scene;
        animations = collada.animations;
        kfAnimationsLength = animations.length;
        model.scale.x = model.scale.y = model.scale.z = 0.1; // 1/8 scale, modeled in cm

        initWebGl();
        start();
        animate(lastTimestamp);

    });


    var htmlCode = '';
    function getModelHierarchy(models) {

        for (var i = 0; i < models.length; i++) {

            var model = models[i];

            if (model.children.length !== 0) {

                console.log('ModelAst:', model.name);

                htmlCode += '<ul>';
                htmlCode += buildToggleLink(model.name);
                getModelHierarchy(model.children);

                htmlCode += '</ul>';
            }
            else {
                console.log('ModelBlatt:', model.name);
                if (model.name)
                    htmlCode += '<li>', buildToggleLink(model.name), '</li>';
            }
        }
        return htmlCode;
    }

    function buildToggleLink(modelName) {

        var htmlLink = '<a href="#" id="toggler" onclick="toggleObject(\'' + modelName + '\');">Toggle ' + modelName + '</a>';
        return htmlLink;
    }


    function initWebGl() {

        var container = document.createElement('div');
        //  document.body.appendChild(container);
        Y.one('#threedmodelContainer').appendChild(container);


        Y.one('#threedmodelContainer').setStyle('width', '100%');
        Y.one('#threedmodelContainer').setStyle('height', '100%');

        var canvasWidth = parseInt(Y.one('#threedmodelContainer').get("offsetWidth"));
        var canvasHeight = parseInt(Y.one('#threedmodelContainer').get("offsetHeight"));


        // Camera

//        camera = new THREE.PerspectiveCamera(40, canvasWidth / canvasHeight, 0.01, 1000);
//        camera.position.set(-5.00181875, 3.42631375, 11.3102925);
//        camera.lookAt(new THREE.Vector3(-1.224774125, 2.18410625, 4.57969125));

        // Scene

        scene = new THREE.Scene();

        // KeyFrame Animations


        // CAMERA
        var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
        var VIEW_ANGLE = 45, ASPECT = canvasWidth / canvasHeight, NEAR = 0.1, FAR = 20000;
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

        camera.position.set(3, 8, 10);

        scene.add(camera);
        camera.lookAt(scene.position);

        var animHandler = THREE.AnimationHandler;

        for (var i = 0; i < kfAnimationsLength; ++i) {

            var animation = animations[ i ];
            animHandler.add(animation);

            var kfAnimation = new THREE.KeyFrameAnimation(animation.node, animation.name);
            kfAnimation.timeScale = 1;
            kfAnimations.push(kfAnimation);

        }

        // Grid

        var material = new THREE.LineBasicMaterial({color: 0x303030});
        var geometry = new THREE.Geometry();
        var floor = -0.04, step = 1, size = 14;

        for (var i = 0; i <= size / step * 2; i++) {

            geometry.vertices.push(new THREE.Vector3(-size, floor, i * step - size));
            geometry.vertices.push(new THREE.Vector3(size, floor, i * step - size));
            geometry.vertices.push(new THREE.Vector3(i * step - size, floor, -size));
            geometry.vertices.push(new THREE.Vector3(i * step - size, floor, size));

        }

        var line = new THREE.Line(geometry, material, THREE.LinePieces);
        scene.add(line);


        scene.add(model);
        targetList.push(model);

        // Lights

        pointLight = new THREE.PointLight(0xffffff, 1.75);
        pointLight.position = camera.position;

        scene.add(pointLight);


        // Renderer

        renderer = new THREE.WebGLRenderer({antialias: true});


        Y.one(renderer.domElement).setStyle('width', '100%');
        Y.one(renderer.domElement).setStyle('height', '100%');
        renderer.setSize(canvasWidth, canvasHeight, false);

        container.appendChild(renderer.domElement);

        var models = model.children;

        for (var i = 0; i < models.length; i++) {
            modelParts[i] = models[i].name;
        }

//        for (var i = 0; i < modelParts.length; i++) {
//            var tempLink = document.createElement('a');
//            tempLink.setAttribute('onclick', "toggleObject('" + modelParts[i] + "');");
//            tempLink.setAttribute('href', '#');
//            tempLink.innerHTML = "Toggle " + modelParts[i];
//            container.appendChild(tempLink);
//            container.appendChild(document.createElement('br'));
//        }



        projector = new THREE.Projector();

        // console.log(models);

        var modelPartList = document.createElement('div');

        modelPartList.innerHTML = getModelHierarchy(models);
        modelPartsBox.appendChild(modelPartList);



        controls = new THREE.OrbitControls(camera, renderer.domElement);


        window.addEventListener('resize', onWindowResize, false);

        renderer.domElement.addEventListener('mousedown', onMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    }

    YUI().use('node', function(Y) {
        var someNode = Y.one('#some-node');

    });

        Y.one('#threedmodelContainer').on('click', function(event) {
            console.log(event);
        });

    function onMouseDown(event)
    {
        console.log("Click.");


        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // find intersections

        // create a Ray with origin at the mouse position
        //   and direction into the scene (camera direction)
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        // create an array containing all objects in the scene with which the ray intersects
        var intersects = ray.intersectObjects(targetList, true);

        // if there is one (or more) intersections
        if (intersects.length > 0)
        {
            console.log(intersects);
            console.log("Hit @ " + toString(intersects[0].point));
            // change the color of the closest face.
            //intersects[ 0 ].face.color.setRGB(0.8 * Math.random() + 0.2, 0, 0);
            //intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
            selectedPiece = intersects[0].object;
            controls.enabled = false;
            renderer.domElement.addEventListener('mousemove', onMouseDrag, false);
        }
        else {
            renderer.domElement.addEventListener('mousemove', onCameraMove, false);
        }
    }

    function onCameraMove() {

    }

    function getMouse3D(mouseEvent) {
        var x, y;
        //
        if (mouseEvent.offsetX !== undefined) {
            x = mouseEvent.offsetX;
            y = mouseEvent.offsetY;
        } else {
            x = mouseEvent.layerX;
            y = mouseEvent.layerY;
        }

        var pos = new THREE.Vector3(0, 0, 0);
        var pMouse = new THREE.Vector3(
                (x / renderer.domElement.width) * 2 - 1,
                -(y / renderer.domElement.height) * 2 + 1,
                1
                );
        //
        projector.unprojectVector(pMouse, camera);

        var cam = camera.position;
        var m = pMouse.y / (pMouse.y - cam.y);

        pos.x = pMouse.x + (cam.x - pMouse.x) * m;
        pos.z = pMouse.z + (cam.z - pMouse.z) * m;

        return pos;
    }

    function onMouseDrag(event)
    {
        // the following line would stop any other event handler from firing
        // (such as the mouse's TrackballControls)
        // event.preventDefault();

        // update sprite position
        // console.log(event.clientX, event.clientY, 0);

        var mouse3D = getMouse3D(event);

        if (selectedPiece) {
            selectedPiece.position.x = mouse3D.x;
            selectedPiece.position.z = mouse3D.z;
            // selectedPiece.position.y = 1;
        }
    }

    function onMouseUp(event) {

        renderer.domElement.removeEventListener('mousemove', onMouseDrag, false);
        renderer.domElement.removeEventListener('mousemove', onCameraMove, false);
        if (selectedPiece) {
            // selectedPiece.position.y = 0.5;
            selectedPiece = null;
        }
        controls.enabled = true;
    }


    function toggleObject(test) {

        var obj = model.getObjectByName(test, true);

        if (obj.visible == true) {
            obj.traverse(function(object) {
                object.visible = false;
            });
        }
        else {
            obj.traverse(function(object) {
                object.visible = true;
            });
        }

    }


    function onWindowResize() {
        var canvasWidth = parseInt(Y.one('#threedmodelContainer').get("offsetWidth"));
        var canvasHeight = parseInt(Y.one('#threedmodelContainer').get("offsetHeight"));
        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(canvasWidth, canvasHeight, false);

        console.log(canvasHeight);

    }

    function start() {

        for (var i = 0; i < kfAnimationsLength; ++i) {

            var animation = kfAnimations[i];

            for (var h = 0, hl = animation.hierarchy.length; h < hl; h++) {

                var keys = animation.data.hierarchy[ h ].keys;
                var sids = animation.data.hierarchy[ h ].sids;
                var obj = animation.hierarchy[ h ];

                if (keys.length && sids) {

                    for (var s = 0; s < sids.length; s++) {

                        var sid = sids[ s ];
                        var next = animation.getNextKeyWith(sid, h, 0);

                        if (next)
                            next.apply(sid);

                    }

                    obj.matrixAutoUpdate = false;
                    animation.data.hierarchy[ h ].node.updateMatrix();
                    obj.matrixWorldNeedsUpdate = true;

                }

            }
            animation.loop = false;
            animation.play();
            lastTimestamp = Date.now();

        }

    }

    function animate() {

        var timestamp = Date.now();
        var frameTime = (timestamp - lastTimestamp) * 0.001; // seconds

        if (progress >= 0 && progress < 48) {

            for (var i = 0; i < kfAnimationsLength; ++i) {

                kfAnimations[ i ].update(frameTime);

            }

        } else if (progress >= 48) {

            for (var i = 0; i < kfAnimationsLength; ++i) {

                kfAnimations[ i ].stop();

            }

            progress = 0;
            start();

        }

        progress += frameTime;
        lastTimestamp = timestamp;
        renderer.render(scene, camera);

        requestAnimationFrame(animate);

    }


}


