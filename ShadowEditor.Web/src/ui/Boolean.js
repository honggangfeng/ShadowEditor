import Control from './Control';
import UI from './Manager';

/**
 * 布尔值
 * @author tengge / https://github.com/tengge1
 * @param {*} options 
 */
function Boolean(options) {
    Control.call(this, options);
    options = options || {};

    this.text = options.text || '';
    this.value = options.value || false;
    this.cls = options.cls || 'Checkbox';
    this.style = options.style || null;

    this.onChange = options.onChange || null;
};

Boolean.prototype = Object.create(Control.prototype);
Boolean.prototype.constructor = Boolean;

Boolean.prototype.render = function () {
    this.dom = document.createElement('span');

    if (this.cls) {
        this.dom.className = this.cls;
    }

    if (this.style) {
        Object.assign(this.dom.style, this.style);
    }

    this.parent.appendChild(this.dom);

    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.dom.appendChild(this.input);

    this.span = document.createElement('span');
    this.span.innerHTML = this.text;
    this.dom.appendChild(this.span);

    this.setValue(this.value);

    if (this.onChange) {
        this.input.addEventListener('change', this.onChange.bind(this), false);
    }
};

Boolean.prototype.getValue = function () {
    return this.input.checked;
};

Boolean.prototype.setValue = function (value) {
    this.input.checked = value;
};

UI.addXType('boolean', Boolean);

export default Boolean;