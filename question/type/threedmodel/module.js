/**
 * @namespace
 */
M.qtype_threedmodel = M.qtype_threedmodel || {};
M.qtype_threedmodel.dddm = {};
var DDDM = M.qtype_threedmodel.dddm;
/**
 * This function is initialized from PHP
 *
 * @param {Object} Y YUI instance
 */


DDDM = {
    //Y: null,
    scene: null,
    camera: null,
    renderer: null,
    colladaScene: null,
    lastTimestamp: null,
    progress: 0,
    animations: null,
    kfAnimations: [],
    kfAnimationsLength: 0
//            var controls;
//                // transControl : null,
//            var targetList = [];
//            var projector;
//            var transControlInUse = false;
//            var modelParts = [];
//            var mouse = new THREE.Vector2(),
//                    offset = new THREE.Vector3(),
//                    plane, container,
//                    INTERSECTED, SELECTED;



};

DDDM.init = function(Y, model_base_url, model_file_name) {
    console.log('init aufgerufen');
    this.Y = Y;

    this.loadColladaModel(model_base_url, model_file_name);
},
//var DDDM = M.qtype_threedmodel;

        DDDM.loadColladaModel = function(model_base_url, model_file_name) {
            if (model_file_name.search(/.+\.dae$/i) !== -1) {
                var loader = new THREE.ColladaLoader();
                loader.options.convertUpAxis = true;

                loader.load(model_base_url + model_file_name, function(collada) {
                    var textures = collada.dae.images;

                    if (DDDM.Y.Object.isEmpty(textures)) {
                        DDDM.initWebGL(DDDM.Y, collada);
                    }
                    else
                    {
                        var no_textures_missing = true;

                        for (var key in textures) {
                            if (textures.hasOwnProperty(key)) {
                                var texture_loaded = checkFileAccess(model_base_url + textures[key].init_from);
                                no_textures_missing = (no_textures_missing && texture_loaded);
                            }
                        }
                        if (no_textures_missing === true) {
                            DDDM.initWebGL(DDDM.Y, collada);
                        }
                    }
                });
            }
            else {
                DDDM.printError(DDDM.Y, 'kein Collada-Model (.dae) gefunden!');
            }



            function checkFileAccess(file_path) {
                var fileFound;
                YUI().use("node", "io-base", function(Y) {

                    function onFailure() {
                        DDDM.printError(Y, '<p>Datei nicht gefunden:' + file_path + '</p>');
                        fileFound = false;
                    }

                    Y.on('io:failure', onFailure, Y, 'Transaction Failed');
                    Y.on('io:success', function() {
                        fileFound = true;
                    }, Y, 'Transaction Succeeded');

                    Y.io(file_path, {sync: true}); // auf events warten, dann erst weiter im code
                });
                return fileFound;
            }

        };

DDDM.printError = function(Y, message) {
    var errorMessage = Y.Node.create(message);
    Y.one('#threedmodelContainer').appendChild(errorMessage);
};


DDDM.initWebGL = function(Y, collada) {

    console.log("this in initWbGL: " + this);

    this.colladaScene = collada.scene;
    this.colladaScene.position.set(0, 0, 0);
    this.colladaScene.scale.x = this.colladaScene.scale.y = this.colladaScene.scale.z = 1;
    this.animations = collada.animations;
    this.kfAnimationsLength = this.animations.length;


    var threedmodelContainer = Y.one('#threedmodelContainer');

    var canvasWidth = parseInt(threedmodelContainer.get("offsetWidth"));
    var canvasHeight = 400;
    var canvasAspect = canvasWidth / canvasHeight;

    setupScene();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(canvasWidth, canvasHeight, false);


    function setupScene() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, canvasAspect, 1, 10000);
        this.camera.position.set(0, 0, 1000);
        this.camera.lookAt(this.scene.position);

        // Light
        var pointLight = new THREE.PointLight(0xffffff, 1.75);
        pointLight.position = this.camera.position;
        this.scene.add(pointLight);

        // KeyFrame Animations
        var animHandler = THREE.AnimationHandler;
        for (var i = 0; i < DDDM.kfAnimationsLength; ++i) {

            var animation = DDDM.animations[ i ];
            animHandler.add(animation);

            var kfAnimation = new THREE.KeyFrameAnimation(animation.node, animation.name);
            kfAnimation.timeScale = 1;
            DDDM.kfAnimations.push(kfAnimation);
        }

        // Fill Scene
        this.scene.add(this.colladaScene);
    }


    DDDM.setupHTML();

    DDDM.start();
    DDDM.animate(this.lastTimestamp);

};

DDDM.setupHTML = function() {
    // TODO: css "flexibel" machen, u.A. height als Konstante!
    var resizeBox = Y.Node.create('<div id="resizeBox" style="position:relative;height:400px;width:auto !important"></div>');
    Y.use('resize-plugin', function() {
        resizeBox.plug(Y.Plugin.Resize);
//        resizeBox.resize.plug(Y.Plugin.ResizeConstrained, {
//            minWidth: 100,
//            minHeight: 100,
//            maxWidth: 1000,
//            maxHeight: 600,
//            preserveRatio: false
//        });
        resizeBox.resize.on('resize:resize', DDDM.onCanvasResize);
    });
    window.addEventListener('resize', DDDM.onCanvasResize);
    resizeBox.appendChild(DDDM.renderer.domElement);
    Y.one('#threedmodelContainer').appendChild(resizeBox);
};

DDDM.onCanvasResize = function() {
    var canvasWidth = parseInt(Y.one('#resizeBox').get("offsetWidth"));
    var canvasHeight = parseInt(Y.one('#resizeBox').get("offsetHeight"));
    this.camera.aspect = canvasWidth / canvasHeight;
    this.camera.updateProjectionMatrix();

    DDDM.renderer.setSize(canvasWidth, canvasHeight, false);
};


DDDM.start = function() {
    for (var i = 0; i < DDDM.kfAnimationsLength; ++i) {
        var animation = DDDM.kfAnimations[i];
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
        DDDM.lastTimestamp = Date.now();
    }
};

DDDM.animate = function() {

    var timestamp = Date.now();
    var frameTime = (timestamp - DDDM.lastTimestamp) * 0.001; // seconds

    if (DDDM.progress >= 0 && DDDM.progress < 48) {
        for (var i = 0; i < DDDM.kfAnimationsLength; ++i) {
            DDDM.kfAnimations[ i ].update(frameTime);
        }
    } else if (DDDM.progress >= 48) {
        for (var i = 0; i < DDDM.kfAnimationsLength; ++i) {
            DDDM.kfAnimations[ i ].stop();
        }
        DDDM.progress = 0;
        DDDM.start();
    }
    DDDM.progress += frameTime;
    DDDM.lastTimestamp = timestamp;

    console.log("this in animate: " + this);

    this.renderer.render(DDDM.scene, DDDM.camera);
    requestAnimationFrame(this.animate);
};





//DDDM = {
//    Y: null,
//    model: null,
//    testString: 'blabla',
//    init: function(Y, model_url) {
//
//        this.Y = Y;
//
//       // this.loadColladaModel(model_url);
//
//        console.log(this);
//
//    },
//    loadColladaModel: function(model_url) {
//        var loader = new THREE.ColladaLoader();
//
//        console.log(this);
//
//        loader.load(model_url, function(collada) {
//            console.log(M.qtype_threedmodel.testString);
//            this.model = collada.scene;
//            this.animations = collada.animations;
//            this.kfAnimationsLength = animations.length;
//            this.model.scale.x = model.scale.y = model.scale.z = 0.1; // 1/8 scale, modeled in cm
//
////            initWebGl();
////            start();
////            animate(lastTimestamp);
//        });
//
//    }
//
//};

//M.qtype_threedmodel.loadColladaModel = function(model_url) {
//    var loader = new THREE.ColladaLoader();
//
//    console.log(this);
//
//    loader.load(model_url, function(collada) {
//        console.log(M.qtype_threedmodel.testString);
//        this.model = collada.scene;
//        this.animations = collada.animations;
//        this.kfAnimationsLength = animations.length;
//        this.model.scale.x = model.scale.y = model.scale.z = 0.1; // 1/8 scale, modeled in cm
//
////            initWebGl();
////            start();
////            animate(lastTimestamp);
//    });
//}
//
//M.qtype_threedmodel.init = function(Y, fullurl) {
//
//    var scene;
//    var camera;
//    var renderer;
//    var model;
//    var animations;
//    var kfAnimations = [];
//    var kfAnimationsLength = 0;
//    var loader = new THREE.ColladaLoader();
//    var lastTimestamp;
//    var progress = 0;
//
//
//    var controls;
//    var targetList = [];
//    var projector;
//    var selectedPiece = null;
//    var mouse = {x: 0, y: 0};
//
//
//    var modelParts = [];
//
//
//    var modelPartsBox = document.createElement('div');
//    modelPartsBox.setAttribute('style', 'position:absolute;left:15px;top:15px;z-index:1500;background:white;');
//    Y.one('#threedmodelContainer').appendChild(modelPartsBox);
//
//    loader.load(fullurl, function(collada) {
//
//        model = collada.scene;
//        animations = collada.animations;
//        kfAnimationsLength = animations.length;
//        model.scale.x = model.scale.y = model.scale.z = 0.1; // 1/8 scale, modeled in cm
//
//        initWebGl();
//        start();
//        animate(lastTimestamp);
//
//    });
//
//
//    var htmlCode = '';
//    function getModelHierarchy(models) {
//
//        for (var i = 0; i < models.length; i++) {
//
//            var model = models[i];
//
//            if (model.children.length !== 0) {
//
//                //   console.log('ModelAst:', model.name);
//
//                htmlCode += '<ul>';
//                htmlCode += buildToggleLink(model.name);
//                getModelHierarchy(model.children);
//
//                htmlCode += '</ul>';
//            }
//            else {
//                //     console.log('ModelBlatt:', model.name);
//                if (model.name)
//                    htmlCode += '<li>', buildToggleLink(model.name), '</li>';
//            }
//        }
//        return htmlCode;
//    }
//
//    function buildToggleLink(modelName) {
//
//        var htmlLink = '<a href="#" id="toggler" onclick="toggleObject(\'' + modelName + '\');">Toggle ' + modelName + '</a>';
//        return htmlLink;
//    }
//
//
//    function initWebGl() {
//
//
//        //  document.body.appendChild(container);
//
//
//
//        //  Y.one('#threedmodelContainer').setStyle('width', 'auto');
//        //  Y.one('#threedmodelContainer').setStyle('height', '100%');
//        //   Y.one('#threedmodelContainer').setStyle('min-height', '500px');
////        Y.one('#threedmodelContainer').setStyle('resize', 'both');
////        Y.one('#threedmodelContainer').setStyle('overflow', 'auto');
//
//        var canvasWidth = parseInt(Y.one('#threedmodelContainer').get("offsetWidth"));
//        var canvasHeight = 400;
//
//        var container = document.createElement('div');
//        container.setAttribute('id', 'resizeDiv');
//        container.setAttribute('style', 'position:relative;height:' + canvasHeight + 'px');
//        Y.one('#threedmodelContainer').appendChild(container);
//
////        var canvasHeight = parseInt(Y.one('#threedmodelContainer').get("offsetHeight"));
//
//
//        // Camera
//
////        camera = new THREE.PerspectiveCamera(40, canvasWidth / canvasHeight, 0.01, 1000);
////        camera.position.set(-5.00181875, 3.42631375, 11.3102925);
////        camera.lookAt(new THREE.Vector3(-1.224774125, 2.18410625, 4.57969125));
//
//        // Scene
//
//        scene = new THREE.Scene();
//
//        // KeyFrame Animations
//
//
//        // CAMERA
//        var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
//        var VIEW_ANGLE = 45, ASPECT = canvasWidth / canvasHeight, NEAR = 0.1, FAR = 20000;
//        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
//
//        camera.position.set(3, 8, 10);
//
//        scene.add(camera);
//        camera.lookAt(scene.position);
//
//        var animHandler = THREE.AnimationHandler;
//
//        for (var i = 0; i < kfAnimationsLength; ++i) {
//
//            var animation = animations[ i ];
//            animHandler.add(animation);
//
//            var kfAnimation = new THREE.KeyFrameAnimation(animation.node, animation.name);
//            kfAnimation.timeScale = 1;
//            kfAnimations.push(kfAnimation);
//
//        }
//
//        // Grid
//
//        var material = new THREE.LineBasicMaterial({color: 0x303030});
//        var geometry = new THREE.Geometry();
//        var floor = -0.04, step = 1, size = 14;
//
//        for (var i = 0; i <= size / step * 2; i++) {
//
//            geometry.vertices.push(new THREE.Vector3(-size, floor, i * step - size));
//            geometry.vertices.push(new THREE.Vector3(size, floor, i * step - size));
//            geometry.vertices.push(new THREE.Vector3(i * step - size, floor, -size));
//            geometry.vertices.push(new THREE.Vector3(i * step - size, floor, size));
//
//        }
//
//        var line = new THREE.Line(geometry, material, THREE.LinePieces);
//        scene.add(line);
//
//
//        scene.add(model);
//        targetList.push(model);
//
//        // Lights
//
//        pointLight = new THREE.PointLight(0xffffff, 1.75);
//        pointLight.position = camera.position;
//
//        scene.add(pointLight);
//
//
//        // Renderer
//
//        renderer = new THREE.WebGLRenderer({antialias: true});
//
//
//        // Y.one(renderer.domElement).setStyle('width', '100%');
//        //  Y.one(renderer.domElement).setStyle('height', '100%');
//        renderer.setSize(canvasWidth, canvasHeight, false);
//
//        container.appendChild(renderer.domElement);
//
////YUI().use('resize');
////
//
//
//        var resizediv = Y.one('#resizeDiv');
//        Y.use('resize-plugin', 'resize-constrain', function() {
//
//            resizediv.plug(Y.Plugin.Resize);
//
//            resizediv.resize.plug(Y.Plugin.ResizeConstrained, {
//                minWidth: 50,
//                minHeight: 100,
//                maxWidth: 1000,
//                maxHeight: 600,
//                preserveRatio: false
//
//            });
//
//            resizediv.resize.on('resize:resize', onResize);
//        });
//
//
//        var models = model.children;
//
//        for (var i = 0; i < models.length; i++) {
//            modelParts[i] = models[i].name;
//        }
//
////        for (var i = 0; i < modelParts.length; i++) {
////            var tempLink = document.createElement('a');
////            tempLink.setAttribute('onclick', "toggleObject('" + modelParts[i] + "');");
////            tempLink.setAttribute('href', '#');
////            tempLink.innerHTML = "Toggle " + modelParts[i];
////            container.appendChild(tempLink);
////            container.appendChild(document.createElement('br'));
////        }
//
//
//
//        projector = new THREE.Projector();
//
//        // console.log(models);
//
//        var modelPartList = document.createElement('div');
//
//        modelPartList.innerHTML = getModelHierarchy(models);
//        modelPartsBox.appendChild(modelPartList);
//
//
//
//        controls = new THREE.OrbitControls(camera, renderer.domElement);
//
//
//        window.addEventListener('resize', onResize, false);
//
//        renderer.domElement.addEventListener('mousedown', onMouseDown, false);
//        renderer.domElement.addEventListener('mouseup', onMouseUp, false);
//    }
//
//    YUI().use('node', function(Y) {
//        var someNode = Y.one('#some-node');
//
//    });
//
//    Y.one('#threedmodelContainer').on('click', function(event) {
//        console.log(event);
//    });
//
//    function onMouseDown(event)
//    {
//        console.log("Click.");
//
//
//        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//
//        // find intersections
//
//        // create a Ray with origin at the mouse position
//        //   and direction into the scene (camera direction)
//        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
//        projector.unprojectVector(vector, camera);
//        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
//
//        // create an array containing all objects in the scene with which the ray intersects
//        var intersects = ray.intersectObjects(targetList, true);
//
//        // if there is one (or more) intersections
//        if (intersects.length > 0)
//        {
//            console.log(intersects);
//            console.log("Hit @ " + toString(intersects[0].point));
//            // change the color of the closest face.
//            //intersects[ 0 ].face.color.setRGB(0.8 * Math.random() + 0.2, 0, 0);
//            //intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
//            selectedPiece = intersects[0].object;
//            controls.enabled = false;
//            renderer.domElement.addEventListener('mousemove', onMouseDrag, false);
//        }
//        else {
//            renderer.domElement.addEventListener('mousemove', onCameraMove, false);
//        }
//    }
//
//    function onCameraMove() {
//
//    }
//
//    function getMouse3D(mouseEvent) {
//        var x, y;
//        //
//        if (mouseEvent.offsetX !== undefined) {
//            x = mouseEvent.offsetX;
//            y = mouseEvent.offsetY;
//        } else {
//            x = mouseEvent.layerX;
//            y = mouseEvent.layerY;
//        }
//
//        var pos = new THREE.Vector3(0, 0, 0);
//        var pMouse = new THREE.Vector3(
//                (x / renderer.domElement.width) * 2 - 1,
//                -(y / renderer.domElement.height) * 2 + 1,
//                1
//                );
//        //
//        projector.unprojectVector(pMouse, camera);
//
//        var cam = camera.position;
//        var m = pMouse.y / (pMouse.y - cam.y);
//
//        pos.x = pMouse.x + (cam.x - pMouse.x) * m;
//        pos.z = pMouse.z + (cam.z - pMouse.z) * m;
//
//        return pos;
//    }
//
//    function onMouseDrag(event)
//    {
//        // the following line would stop any other event handler from firing
//        // (such as the mouse's TrackballControls)
//        // event.preventDefault();
//
//        // update sprite position
//        // console.log(event.clientX, event.clientY, 0);
//
//        var mouse3D = getMouse3D(event);
//
//        if (selectedPiece) {
//            selectedPiece.position.x = mouse3D.x;
//            selectedPiece.position.z = mouse3D.z;
//            // selectedPiece.position.y = 1;
//        }
//    }
//
//    function onMouseUp(event) {
//
//        renderer.domElement.removeEventListener('mousemove', onMouseDrag, false);
//        renderer.domElement.removeEventListener('mousemove', onCameraMove, false);
//        if (selectedPiece) {
//            // selectedPiece.position.y = 0.5;
//            selectedPiece = null;
//        }
//        controls.enabled = true;
//    }
//
//
//    function toggleObject(test) {
//
//        var obj = model.getObjectByName(test, true);
//
//        if (obj.visible == true) {
//            obj.traverse(function(object) {
//                object.visible = false;
//            });
//        }
//        else {
//            obj.traverse(function(object) {
//                object.visible = true;
//            });
//        }
//
//    }
//
//    function onResize() {
//        var canvasWidth = parseInt(Y.one('#resizeDiv').get("offsetWidth"));
//        var canvasHeight = parseInt(Y.one('#resizeDiv').get("offsetHeight"));
//        camera.aspect = canvasWidth / canvasHeight;
//        camera.updateProjectionMatrix();
//
//        renderer.setSize(canvasWidth, canvasHeight, false);
//    }
//
//
//    function start() {
//
//        for (var i = 0; i < kfAnimationsLength; ++i) {
//
//            var animation = kfAnimations[i];
//
//            for (var h = 0, hl = animation.hierarchy.length; h < hl; h++) {
//
//                var keys = animation.data.hierarchy[ h ].keys;
//                var sids = animation.data.hierarchy[ h ].sids;
//                var obj = animation.hierarchy[ h ];
//
//                if (keys.length && sids) {
//
//                    for (var s = 0; s < sids.length; s++) {
//
//                        var sid = sids[ s ];
//                        var next = animation.getNextKeyWith(sid, h, 0);
//
//                        if (next)
//                            next.apply(sid);
//
//                    }
//
//                    obj.matrixAutoUpdate = false;
//                    animation.data.hierarchy[ h ].node.updateMatrix();
//                    obj.matrixWorldNeedsUpdate = true;
//
//                }
//
//            }
//            animation.loop = false;
//            animation.play();
//            lastTimestamp = Date.now();
//
//        }
//
//    }
//
//    function animate() {
//
//        var timestamp = Date.now();
//        var frameTime = (timestamp - lastTimestamp) * 0.001; // seconds
//
//        if (progress >= 0 && progress < 48) {
//
//            for (var i = 0; i < kfAnimationsLength; ++i) {
//
//                kfAnimations[ i ].update(frameTime);
//
//            }
//
//        } else if (progress >= 48) {
//
//            for (var i = 0; i < kfAnimationsLength; ++i) {
//
//                kfAnimations[ i ].stop();
//
//            }
//
//            progress = 0;
//            start();
//
//        }
//
//        progress += frameTime;
//        lastTimestamp = timestamp;
//        renderer.render(scene, camera);
//
//        requestAnimationFrame(animate);
//
//    }
//
//
//}
//

