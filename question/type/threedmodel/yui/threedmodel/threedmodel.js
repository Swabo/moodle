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
        this.transControls;

        this.domEvents;

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
        this.colladaScene.scale.set(1,1,1);
        this.animations = collada.animations;
        this.kfAnimationsLength = this.animations.length;

        var canvasWidth = parseInt(this.threedmodelContainer.get("offsetWidth"));
        var canvasHeight = 400;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(canvasWidth, canvasHeight, false);

        this.setupScene(canvasWidth / canvasHeight);
        this.setupHTML();

        this.start();
        this.animate(this.lastTimestamp);
    };

    DDDM.setupScene = function(canvasAspect) {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, canvasAspect, 0.1, 20000);
        this.camera.position.set(0, 200, 1000);
        this.camera.lookAt(this.scene.position);

        // Controls
        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.transControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transControls.addEventListener('change', DDDM.render);

        // Light
        var pointLight = new THREE.PointLight(0xffffff, 1.75);
        pointLight.position = this.camera.position;
        this.scene.add(pointLight);

        // SkyCube        
        var skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        var skyMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide});
        var skyCube = new THREE.Mesh(skyGeometry, skyMaterial);
        skyCube.position.set(0, 0, 0);
        this.scene.add(skyCube);

        // THREEx.DomEvents
        this.domEvents = new THREEx.DomEvents(this.camera, this.renderer.domElement);
        this.domEvents.addEventListener(skyCube, 'click', function() {
            DDDM.orbitControls.enabled = true;
            DDDM.scene.remove(DDDM.transControls);
        }, false);

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
            resetScene: function() {
                location.reload();
            },
            scaleModel: function() {
                DDDM.colladaScene.scale.set();
            }
        };
        gui.add(DDDM, 'play_animation').name('Play animations');
        gui.add(guiConfig, 'resetScene').name('Reset Scene');
        gui.add(DDDM.colladaScene.scale, 'x', 0.01,100).name('Scale Model').onChange(function(value) {
            DDDM.colladaScene.scale.y = DDDM.colladaScene.scale.z = value;
        });
        var modelPartsFolder = gui.addFolder('Modelparts');
        Y.one(modelPartsFolder.domElement).addClass('model_parts');

        DDDM.colladaScene.parent.userData['ownFolder'] = modelPartsFolder;
        // recursivly setup model parts in scene hierarchy
        var setupModelPart = function(model) {
            // is branch
            if (model.children.length > 0) {
                var folderName = model.name === '' ? model.id : model.name;
                model.userData['parentFolder'] = model.parent.userData['ownFolder'];
                try {
                    model.userData['ownFolder'] = model.userData['parentFolder'].addFolder(folderName);
                }
                catch (e)
                {
                    console.log(e);
                    DDDM.printError(e.message);
                    model.userData['ownFolder'] = model.userData['parentFolder'].addFolder(folderName + model.uuid);
                }
            }
            // is leaf
            else {
                // modelPart is a light
                if (model instanceof THREE.Light) {
                    model.visible = false;
                }
                var originalMaterial = model.material;
                var hoverMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});

                // Event listeners for 3D-Space 
                DDDM.domEvents.addEventListener(model, 'mouseover', setHoverMaterial, false);
                DDDM.domEvents.addEventListener(model, 'mouseout', setOriginalMaterial, false);
                DDDM.domEvents.addEventListener(model, 'click', onClickMove, false);

                model.userData['parentFolder'] = model.parent.userData['ownFolder'];

                var leafName = model.name === '' ? model.parent.name : model.name;
                // add dummy function to prevent default datGui behaviour
                guiConfig[model.uuid] = function() {
                };
                // add leave with custom buttons to datGui
                var leaf = model.userData['parentFolder'].add(guiConfig, model.uuid).name(leafName);
                var dg_move_object = Y.Node.create('<span class="dg_move_object">move</span>');
                Y.one(leaf.domElement).appendChild(dg_move_object);
                var dg_toggle_object = Y.Node.create('<span clas="dg_toggle_object">toggle</span>');
                Y.one(leaf.domElement).appendChild(dg_toggle_object);

                // add custom event listeners to datGui
                Y.one(leaf.__li).on('mouseover', setHoverMaterial, false);
                Y.one(leaf.__li).on('mouseleave', setOriginalMaterial, false);
                dg_move_object.on('click', onClickMove);
                dg_toggle_object.on('click', onClickToggle);
            }

            function setHoverMaterial() {
                model.material = hoverMaterial;
            }
            function setOriginalMaterial() {
                model.material = originalMaterial;
            }
            function onClickMove() {
                DDDM.orbitControls.enabled = false;
                DDDM.transControls.attach(model);
                DDDM.scene.add(DDDM.transControls);
            }
            function onClickToggle() {
                model.traverse(function(object) {
                    object.visible = !object.visible;
                });
            }
        };
        DDDM.colladaScene.traverse(setupModelPart);


        // Resize Box
        var resizeBox = Y.Node.create('<div id="resizeBox"></div>');
        Y.use('resize-plugin', function() {
            resizeBox.plug(Y.Plugin.Resize);
            resizeBox.resize.on('resize:resize', DDDM.onCanvasResize);
        });

        window.addEventListener('resize', DDDM.onCanvasResize);

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


}, '@VERSION@', {
    requires: ['node']
});