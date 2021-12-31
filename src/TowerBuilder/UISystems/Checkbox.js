import * as PIXI from 'pixi.js';
import Vec2 from '../Math/Vec2';

export class CheckboxStyle{
	constructor(fontSize, checkSize, borderRadius, checkColorActive, checkColorInactive, colorActive, colorInactive){
		this.fontSize = fontSize;
		this.checkSize = checkSize;
		this.borderRadius = borderRadius;
		
		this.checkColorActive = checkColorActive;
		this.checkColorInactive = checkColorInactive;

		this.colorActive = colorActive;
		this.colorInactive = colorInactive;
	}
}

export default class Checkbox{
	constructor(label, checkboxStyle, callback, defaultState){
		this.callback = callback;
		this.style = checkboxStyle;

		this.labelText = new PIXI.Text(label, 
			new PIXI.TextStyle({
				fill: this.style.colorInactive, 
				fontFamily:'Bubblegum Sans', 
				fontSize: this.style.fontSize})
		);

		this.checkGraphic = new PIXI.Graphics();

		this.container = new PIXI.Container();
		this.container.addChild(this.checkGraphic);
		this.container.addChild(this.labelText);

		this.state = defaultState;

		this.drawInactive();
	}

	drawInactive(){
		this.checkGraphic.clear();
		this.checkGraphic.beginFill(this.style.checkColorInactive);
		this.checkGraphic.drawRoundedRect(this.labelText.width + 10, this.labelText.height/2 - this.style.checkSize/2, 
			this.style.checkSize, this.style.checkSize, this.style.borderRadius);
		this.checkGraphic.endFill();

		if(this.state == false){
			this.checkGraphic.beginHole();
			this.checkGraphic.drawRoundedRect(
				this.labelText.width + 10 + this.style.checkSize * 0.125, 
				this.labelText.height/2 - this.style.checkSize/2 + this.style.checkSize * 0.125, 
				this.style.checkSize * 0.75, 
				this.style.checkSize * 0.75, 
				this.style.borderRadius);
			this.checkGraphic.endHole();
		}

		this.labelText.style.fill = this.style.colorInactive;
	}

	drawActive(){
		this.checkGraphic.clear();
		this.checkGraphic.beginFill(this.style.checkColorActive);
		this.checkGraphic.drawRoundedRect(this.labelText.width + 10, this.labelText.height/2 - this.style.checkSize/2, 
			this.style.checkSize, this.style.checkSize, this.style.borderRadius);
		this.checkGraphic.endFill();

		if(this.state == false){
			this.checkGraphic.beginHole();
			this.checkGraphic.drawRoundedRect(
				this.labelText.width + 10 + this.style.checkSize * 0.125, 
				this.labelText.height/2 - this.style.checkSize/2 + this.style.checkSize * 0.125, 
				this.style.checkSize * 0.75, 
				this.style.checkSize * 0.75, 
				this.style.borderRadius);
			this.checkGraphic.endHole();
		}

		this.checkGraphic.updateTransform();
		this.labelText.style.fill = this.style.colorActive;
	}

	update(dt){
		const pos = this.container.getGlobalPosition();

		let inputStore = /** @type {import("../types").Input} */ (window.TowerBuilder.input);
		const mousePos = inputStore.mouse.position;

		const boundingBox = {
			min: new Vec2(pos.x, pos.y),
			max: new Vec2(pos.x + this.container.width, pos.y + this.container.height)
		};

		if(mousePos.x >= boundingBox.min.x && mousePos.x <= boundingBox.max.x && 
			mousePos.y >= boundingBox.min.y && mousePos.y <= boundingBox.max.y){
			this.drawActive();

			if(inputStore.mouse.buttons[0]){
				inputStore.mouse.buttons[0] = false;
				this.state = !this.state;
				this.callback(this.state);
			}
		}else{
			this.drawInactive();
		}
	}
}