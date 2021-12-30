import * as PIXI from 'pixi.js';

export default class Group{
	constructor(container, bgColor, bgPadding, bgLineWidth, bgLineColor, bgRadius){
		this.container = new PIXI.Container();
		this.background = new PIXI.Graphics();

		this.bgColor = bgColor;
		this.bgPadding = bgPadding;
		this.bgLineWidth = bgLineWidth;
		this.bgLineColor = bgLineColor;
		this.bgRadius = bgRadius;

		this.container.addChild(this.background);
		container.addChild(this.container);
		this.children = [];
	}
	drawBackground(){
		this.background.clear();
		
		this.background.lineStyle({
			color: this.bgLineColor,
			width: this.bgLineWidth
		});
		this.background.beginFill(this.bgColor);
		this.background.drawRoundedRect(-this.bgPadding.x/2 - this.container.width/2, -this.bgPadding.x/2, 
			this.container.width + this.bgPadding.x, this.container.height + this.bgPadding.x, this.bgRadius);
		this.background.endFill();
	}
	addElement(element, elementContainer){
		this.children.push(element);
		this.container.addChild(elementContainer);
		if(updateCallback != null){
			this.updateList.push(updateCallback);
		}
	}
	update(dt){
		this.children.forEach(child => {
			child.update(dt);
		})
	}
}