import BaseEvent from './BaseEvent';

/**
 * 渲染事件
 * @author tengge / https://github.com/tengge1
 * @param {*} app 
 */
function RenderEvent(app) {
    BaseEvent.call(this, app);
    this.sceneSelected = new THREE.Scene();
}

RenderEvent.prototype = Object.create(BaseEvent.prototype);
RenderEvent.prototype.constructor = RenderEvent;

RenderEvent.prototype.start = function () {
    this.app.on(`render.${this.id}`, this.onRender.bind(this));
    this.app.on(`materialChanged.${this.id}`, this.onRender.bind(this));
    this.app.on(`sceneGraphChanged.${this.id}`, this.onRender.bind(this));
    this.app.on(`cameraChanged.${this.id}`, this.onRender.bind(this));
};

RenderEvent.prototype.stop = function () {
    this.app.on(`render.${this.id}`, null);
    this.app.on(`materialChanged.${this.id}`, null);
    this.app.on(`sceneGraphChanged.${this.id}`, null);
    this.app.on(`cameraChanged.${this.id}`, null);
};

RenderEvent.prototype.onRender = function () {
    var editor = this.app.editor;
    var sceneHelpers = editor.sceneHelpers;
    var scene = editor.scene;
    var camera = editor.camera;
    var renderer = editor.renderer;

    sceneHelpers.updateMatrixWorld();
    scene.updateMatrixWorld();

    // 渲染场景

    // 边框
    // if (this.app.options.outline && this.outlineEffect == null) {
    //     this.outlineEffect = new THREE.OutlineEffect(renderer, {
    //         defaultThickness: 0.01,
    //         defaultColor: [0, 0, 0],
    //         defaultAlpha: 0.8,
    //         defaultKeepAlive: true // keeps outline material in cache even if material is removed from scene
    //     });
    // }

    // if (this.app.options.outline) {
    //     this.outlineEffect.render(scene, camera);
    // } else {
    //     renderer.render(scene, camera);
    // }

    // 浮雕效果
    // if (this.anaglyphEffect == null) {
    //     this.anaglyphEffect = new THREE.AnaglyphEffect(renderer);
    // }
    // this.anaglyphEffect.render(scene, camera);

    // ascii字符效果
    // if (this.effect == null) {
    //     this.effect = new THREE.VREffect(renderer);
    //     // this.effect.setSize(renderer.domElement.width, renderer.domElement.height);
    // }
    renderer.render(scene, camera);

    // 为选中的Mesh渲染边框
    if (editor.selected && editor.selected instanceof THREE.Mesh) {
        var box = new THREE.Mesh(editor.selected.geometry, new THREE.MeshBasicMaterial({
            color: 0xec651a,
            depthTest: false
        }));
        box.position.copy(editor.selected.position);
        box.rotation.copy(editor.selected.rotation);
        box.scale.copy(editor.selected.scale);

        var state = renderer.state;
        var context = renderer.context;

        this.sceneSelected.children.length = 0;
        this.sceneSelected.add(box);

        // 绘制模板
        renderer.clearStencil();
        state.buffers.stencil.setTest(true);
        state.buffers.stencil.setClear(0x00);

        state.buffers.color.setMask(false);
        state.buffers.stencil.setMask(0xff);
        state.buffers.stencil.setFunc(context.ALWAYS, 1, 0xff);

        state.buffers.color.setLocked(true);

        renderer.render(this.sceneSelected, camera);

        state.buffers.color.setLocked(false);
        state.buffers.color.setMask(true);
        state.buffers.stencil.setMask(0x00);

        // 绘制轮廓
        var oldScale = box.scale.clone();
        box.scale.set(oldScale.x * 1.1, oldScale.y * 1.1, oldScale.z * 1.1);

        state.buffers.stencil.setOp(context.KEEP, context.REPLACE, context.REPLACE);
        state.buffers.stencil.setFunc(context.NOTEQUAL, 1, 0xff);

        renderer.render(this.sceneSelected, camera);

        // 恢复原来状态
        box.scale.copy(oldScale);
        state.buffers.stencil.setTest(false);
        state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.REPLACE);
    }

    // 渲染帮助器
    renderer.render(sceneHelpers, camera);
};

export default RenderEvent;