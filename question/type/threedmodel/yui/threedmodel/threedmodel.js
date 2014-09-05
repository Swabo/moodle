YUI.add('moodle-qtype_threedmodel-threedmodel', function(Y) {
    M.qtype_threedmodel = M.qtype_threedmodel || {};
    var DDDM = M.qtype_threedmodel.threedmodel = {};

    DDDM.init = function(params) {
        this.threedmodelContainer = Y.one('#threedmodelContainer');
        this.scene;
        this.camera;
        this.renderer;
        this.colladaScene;

        this.lastTimestamp;
        this.progress = 0;
        this.animations;
        this.kfAnimations = [];
        this.kfAnimationsLength = 0;
        this.animationFrame;
        this.play_animation = true;

        this.orbitControls;
        this.projector;
        this.transControls;
        this.modelParts = [];
        this.selected;
        this.hoveredModelPart;

        this.loadColladaModel(params.model_base_url, params.model_file_name);
    };

    DDDM.loadColladaModel = function(model_base_url, model_file_name) {
        if (model_file_name.search(/.+\.dae$/i) !== -1) {
            var loader = new THREE.ColladaLoader();
            loader.options.convertUpAxis = true;

            loader.load(model_base_url + model_file_name, function(collada) {
                var textures = collada.dae.images;

                if (Y.Object.isEmpty(textures)) {
                    DDDM.initWebGL(collada);
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
                        DDDM.initWebGL(collada);
                    }
                }
            });
        }
        else {
            this.printError('kein Collada-Model (.dae) gefunden!');
        }

        function checkFileAccess(file_path) {
            var fileFound;
            // neue Y Instanz, sonst wird für alle Texturen Fehler ausgegeben (??)
            YUI().use('io-base', function(Y) {

                function onFailure() {
                    DDDM.printError('<p>Datei nicht gefunden:' + file_path + '</p>');
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

    DDDM.initWebGL = function(collada) {
        this.colladaScene = collada.scene;
        this.colladaScene.position.set(0, 0, 0);
        this.colladaScene.scale.x = this.colladaScene.scale.y = this.colladaScene.scale.z = 1;
        this.animations = collada.animations;
        this.kfAnimationsLength = this.animations.length;

        var canvasWidth = parseInt(this.threedmodelContainer.get("offsetWidth"));
        var canvasHeight = 400;

        this.setupScene(canvasWidth / canvasHeight);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(canvasWidth, canvasHeight, false);

        // Controls
        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.transControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transControls.addEventListener('change', DDDM.render);

        // Projector for TransControls
        this.projector = new THREE.Projector();
        // this.getModelHierarchy(this.colladaScene.children);

        this.setupHTML();

        this.start();
        this.animate(this.lastTimestamp);
    };

    DDDM.setupScene = function(canvasAspect) {
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
        for (var i = 0; i < this.kfAnimationsLength; ++i) {

            var animation = this.animations[ i ];
            animHandler.add(animation);

            var kfAnimation = new THREE.KeyFrameAnimation(animation.node, animation.name);
            kfAnimation.timeScale = 1;
            this.kfAnimations.push(kfAnimation);
        }

        // Fill Scene
        this.scene.add(this.colladaScene);
    };

    DDDM.setupHTML = function() {

        var gui = new dat.GUI({autoPlace: false});
        DDDM.threedmodelContainer.appendChild(gui.domElement);

        var guiConfig = {
            play_animation: true,
            resetScene: function() {
                location.reload();
            }
        };
        gui.add(guiConfig, 'play_animation', true).onChange(function() {
            DDDM.play_animation === true ? DDDM.play_animation = false : DDDM.play_animation = true;
        });
        gui.add(guiConfig, 'resetScene');

        var mainFolder = gui.addFolder('Modelparts');

        var generateCallback = function(model) {

            return function() {
                // DDDM.toggleObject(model);
                console.log(model);
//                DDDM.orbitControls.enabled = false;
//                DDDM.transControls.attach(model);
//                DDDM.scene.add(DDDM.transControls);
            };

        };

//        for (var i = 0; i < DDDM.modelParts.length; i++) {
//
//            var partName = DDDM.modelParts[i].name === '' ? DDDM.modelParts[i].id : DDDM.modelParts[i].name;
//
//            guiConfig[partName] = generateCallback(i);
//            folder.add(guiConfig, partName);
//        }
        setupGuiModelParts(DDDM.colladaScene.children, mainFolder);

        function setupGuiModelParts(models, parentGuiFolder) {

            for (var i = 0; i < models.length; i++) {

                var model = models[i];
                if (model.children.length > 0) {
//                    var partName = model.name === '' ? model.id : model.name;
//
//                    guiConfig[partName] = generateCallback(model);
//                    parentGuiFolder.add(guiConfig, partName);

                    //  var folder = parentGuiFolder.addFolder(model.uuid + ' - ' + model.name);
                    var folder = parentGuiFolder.addFolder(model.name);
                    setupGuiModelParts(model.children, folder);

                }
                else {
                    DDDM.modelParts.push(model);

                    var partName = model.name === '' ? model.id : model.name;

                    guiConfig[partName] = generateCallback(model);
                    var blatt = parentGuiFolder.add(guiConfig, partName);

                    var dg_move_object = Y.Node.create('<span>move</span>');
                    dg_move_object.addClass('dg_move_object');
                    dg_move_object.on('click', function() {
                        DDDM.orbitControls.enabled = false;
                        DDDM.transControls.attach(model);
                        DDDM.scene.add(DDDM.transControls);
                    });
                    Y.one(blatt.domElement).appendChild(dg_move_object);



                    var dg_toggle_object = Y.Node.create('<span>toggle</span>');
                    dg_toggle_object.addClass('dg_toggle_object');
                    dg_toggle_object.on('click', function() {
                        DDDM.toggleObject(model);
                    });
                    Y.one(blatt.domElement).appendChild(dg_toggle_object);


                }
            }
        }


        // TODO: css "flexibel" machen, u.A. height als Konstante!
        var resizeBox = Y.Node.create('<div id="resizeBox"></div>');
        Y.use('resize-plugin', function() {
            resizeBox.plug(Y.Plugin.Resize);
            resizeBox.resize.on('resize:resize', DDDM.onCanvasResize);
        });

        window.addEventListener('resize', DDDM.onCanvasResize);
        DDDM.renderer.domElement.addEventListener('click', DDDM.onSelectObject, false);
        DDDM.renderer.domElement.addEventListener('mousemove', DDDM.onHoverObject, false);

        resizeBox.appendChild(DDDM.renderer.domElement);
        DDDM.threedmodelContainer.appendChild(resizeBox);


    };

    DDDM.onCanvasResize = function() {
        var canvasWidth = parseInt(Y.one('#resizeBox').get("offsetWidth"));
        var canvasHeight = parseInt(Y.one('#resizeBox').get("offsetHeight"));
        DDDM.camera.aspect = canvasWidth / canvasHeight;
        DDDM.camera.updateProjectionMatrix();

        DDDM.renderer.setSize(canvasWidth, canvasHeight, false);
    };

    DDDM.onSelectObject = function(event) {
        var intersects = DDDM.findIntersections(event);

//        if (intersects.length > 0) {
//            DDDM.orbitControls.enabled = false;
//            DDDM.selected = intersects[ 0 ].object;
//            DDDM.transControls.attach(DDDM.selected);
//            DDDM.scene.add(DDDM.transControls);
//        }
//        else {
//            DDDM.scene.remove(DDDM.transControls);
//            DDDM.orbitControls.enabled = true;
//        }

        // hit on model part
        if (intersects.length > 0) {
            // hit on different model part than previously selected or no previously selected
            if (DDDM.selected !== intersects[ 0 ].object) {
                DDDM.selected = intersects[ 0 ].object;
                DDDM.orbitControls.enabled = false;
                DDDM.transControls.attach(DDDM.selected);
                DDDM.scene.add(DDDM.transControls);
            }
        }
        // no hit on model part
        else {
            // no previously selected model part
            if (!DDDM.selected) {
                DDDM.scene.remove(DDDM.transControls);
                DDDM.orbitControls.enabled = true;
            }
            DDDM.selected = null;
        }
    };


    DDDM.onHoverObject = function(event) {
        var intersects = DDDM.findIntersections(event);
        if (intersects.length > 0) {

            if (DDDM.hoveredModelPart !== intersects[ 0 ].object) {

                if (DDDM.hoveredModelPart)
                    DDDM.hoveredModelPart.material.emissive.setHex(DDDM.hoveredModelPart.currentHex);

                DDDM.hoveredModelPart = intersects[ 0 ].object;
                DDDM.hoveredModelPart.currentHex = DDDM.hoveredModelPart.material.emissive.getHex();
                DDDM.hoveredModelPart.material.emissive.setHex(0xff0000);
                console.log(DDDM.hoveredModelPart);
                DDDM.threedmodelContainer.setStyle('cursor', 'pointer');
            }
        }
        else {
            DDDM.threedmodelContainer.setStyle('cursor', 'inherit');
            if (DDDM.hoveredModelPart)
                DDDM.hoveredModelPart.material.emissive.setHex(DDDM.hoveredModelPart.currentHex);

            DDDM.hoveredModelPart = null;
        }
    };

    DDDM.findIntersections = function(event) {
        // calculate 2D mouse position in CanvasRenderer considering canvas size and scroll position
        var mouseX = ((event.clientX - DDDM.renderer.domElement.offsetParent.offsetLeft + document.body.scrollLeft) / DDDM.renderer.domElement.width) * 2 - 1;
        var mouseY = -((event.clientY - DDDM.renderer.domElement.offsetParent.offsetTop + document.body.scrollTop) / DDDM.renderer.domElement.height) * 2 + 1;

        var vector = new THREE.Vector3(mouseX, mouseY, 1);
        DDDM.projector.unprojectVector(vector, DDDM.camera);
        var raycaster = new THREE.Raycaster(DDDM.camera.position, vector.sub(DDDM.camera.position).normalize());
        return raycaster.intersectObjects(DDDM.modelParts);
    };

    DDDM.getModelHierarchy = function(models) {

        for (var i = 0; i < models.length; i++) {

            var model = models[i];
            if (model.children.length > 0) {
                //console.log('ModelAst:', model.name);

                DDDM.getModelHierarchy(model.children);

            }
            else {
                //console.log('ModelBlatt:', model.name);
                DDDM.modelParts.push(model);
            }
        }
    };

    DDDM.start = function() {
        for (var i = 0; i < this.kfAnimationsLength; ++i) {
            var animation = this.kfAnimations[i];
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
            this.lastTimestamp = Date.now();
        }
    };

    DDDM.animate = function() {
        var timestamp = Date.now();
        var frameTime = (timestamp - DDDM.lastTimestamp) * 0.001; // seconds

        if (DDDM.play_animation) {

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
        }

        DDDM.render();
        DDDM.animationFrame = requestAnimationFrame(DDDM.animate);

    };

    DDDM.render = function() {
        DDDM.transControls.update();
        DDDM.renderer.render(DDDM.scene, DDDM.camera);
    };

    DDDM.printError = function(message) {
        var errorMessage = Y.Node.create(message);
        DDDM.threedmodelContainer.appendChild(errorMessage);
    };


    DDDM.toggleObject = function(obj) {
        console.log(obj);

        if (obj.visible === true) {
            obj.traverse(function(object) {
                object.visible = false;
            });
        }
        else {
            obj.traverse(function(object) {
                object.visible = true;
            });
        }
    };





}, '@VERSION@', {
    requires: ['node']
});