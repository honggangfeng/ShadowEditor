import BaseHelper from './BaseHelper';
import MaskVertex from './shader/mask_vertex.glsl';
import MaskFragment from './shader/mask_fragment.glsl';
import EdgeVertex from './shader/edge_vertex.glsl';
import EdgeFragment from './shader/edge_fragment.glsl';

/**
 * 选择帮助器
 * @author tengge / https://github.com/tengge1
 * @param {*} app 
 */
function SelectHelper(app) {
    BaseHelper.call(this, app);
}

SelectHelper.prototype = Object.create(BaseHelper.prototype);
SelectHelper.prototype.constructor = SelectHelper;

SelectHelper.prototype.start = function () {
    this.app.on(`objectSelected.${this.id}`, this.onObjectSelected.bind(this));
    this.app.on(`objectRemoved.${this.id}`, this.onObjectRemoved.bind(this));
    this.app.on(`afterRender.${this.id}`, this.onAfterRender.bind(this));
};

SelectHelper.prototype.stop = function () {
    this.app.on(`objectSelected.${this.id}`, null);
    this.app.on(`afterRender.${this.id}`, null);
};

SelectHelper.prototype.onObjectSelected = function (obj) {
    if (!obj) {
        this.unselect();
        return;
    }

    // 进制选中场景和相机
    if (obj === this.app.editor.scene || obj === this.app.editor.camera) {
        return;
    }

    if (!this.size) {
        this.size = new THREE.Vector2();
    }

    this.app.editor.renderer.getDrawingBufferSize(this.size);

    var width = this.size.x;
    var height = this.size.y;

    if (this.scene === undefined) {
        this.scene = new THREE.Scene();
    }

    if (this.camera === undefined) {
        this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 1);
        this.camera.position.z = 1;
        this.camera.lookAt(new THREE.Vector3());
    }

    if (this.quad === undefined) {
        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(width, height), null);
        this.quad.frustumCulled = false;
        this.scene.add(this.quad);
    }

    var params = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        antialias: true,
    };

    if (this.maskBuffer === undefined) {
        this.maskBuffer = new THREE.WebGLRenderTarget(width, height, params);
        this.maskBuffer.texture.generateMipmaps = false;
    }

    if (this.edgeBuffer === undefined) {
        this.edgeBuffer = new THREE.WebGLRenderTarget(width, height, params);
        this.edgeBuffer.texture.generateMipmaps = false;
    }

    if (this.maskMaterial === undefined) {
        this.maskMaterial = new THREE.ShaderMaterial({
            vertexShader: MaskVertex,
            fragmentShader: MaskFragment,
            depthTest: false,
        });
    }

    if (this.edgeMaterial === undefined) {
        this.edgeMaterial = new THREE.ShaderMaterial({
            vertexShader: EdgeVertex,
            fragmentShader: EdgeFragment,
            uniforms: {
                maskTexture: {
                    value: this.maskBuffer.texture,
                },
                texSize: {
                    value: new THREE.Vector2(width, height),
                },
                color: {
                    value: new THREE.Vector3(1.0, 1.0, 1.0),
                },
                thickness: {
                    type: 'f',
                    value: 2,
                },
            },
            depthTest: false,
        });
    }

    if (this.copyMaterial === undefined) {
        this.copyMaterial = new THREE.ShaderMaterial({
            vertexShader: THREE.FXAAShader.vertexShader,
            fragmentShader: THREE.FXAAShader.fragmentShader,
            uniforms: {
                tDiffuse: {
                    value: this.edgeBuffer.texture,
                },
                resolution: {
                    value: new THREE.Vector2(1 / width, 1 / height),
                },
            },
            blending: THREE.AdditiveBlending,
            depthTest: false,
        });
    }

    this.object = obj;
};

SelectHelper.prototype.onObjectRemoved = function (object) {
    if (object === this.object) {
        this.unselect();
    }
};

SelectHelper.prototype.unselect = function () {
    if (this.object) {
        delete this.object;
    }
};

SelectHelper.prototype.onAfterRender = function () {
    if (!this.object || !this.object.parent) {
        // TODO: this.object.parent为null时表示该物体被移除
        return;
    }

    var renderScene = this.app.editor.scene;
    var renderCamera = this.app.editor.camera;
    var renderer = this.app.editor.renderer;

    var scene = this.scene;
    var camera = this.camera;
    var selected = this.object;

    // 记录原始状态
    var oldOverrideMaterial = renderScene.overrideMaterial;
    var oldBackground = renderScene.background;

    var oldAutoClear = renderer.autoClear;
    var oldClearColor = renderer.getClearColor();
    var oldClearAlpha = renderer.getClearAlpha();
    var oldRenderTarget = renderer.getRenderTarget();

    // 绘制蒙版
    this.hideNonSelectedObjects(renderScene, selected);

    renderScene.overrideMaterial = this.maskMaterial;
    renderScene.background = null;

    renderer.autoClear = false;
    renderer.setRenderTarget(this.maskBuffer);
    renderer.setClearColor(0xffffff);
    renderer.setClearAlpha(1);
    renderer.clear();

    renderer.render(renderScene, renderCamera);

    this.showNonSelectedObjects(renderScene, selected);

    // 绘制边框
    this.quad.material = this.edgeMaterial;

    renderScene.overrideMaterial = null;

    renderer.setRenderTarget(this.edgeBuffer);
    renderer.clear();
    renderer.render(scene, camera);

    // 与原场景叠加
    this.quad.material = this.copyMaterial;

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // 还原原始状态
    renderScene.overrideMaterial = oldOverrideMaterial;
    renderScene.background = oldBackground;

    renderer.autoClear = oldAutoClear;
    renderer.setClearColor(oldClearColor);
    renderer.setClearAlpha(oldClearAlpha);
    renderer.setRenderTarget(oldRenderTarget);
};

SelectHelper.prototype.hideNonSelectedObjects = function (scene, selected) {
    scene.traverse(obj => {
        if (obj.isMesh && obj !== selected) {
            obj.userData.oldVisible = obj.visible;
            obj.visible = false;
        }
    });
};

SelectHelper.prototype.showNonSelectedObjects = function (scene, selected) {
    scene.traverse(obj => {
        if (obj.isMesh && obj !== selected && obj.userData.oldVisible) {
            obj.visible = obj.userData.oldVisible;
            delete obj.userData.oldVisible;
        }
    });
};

export default SelectHelper;