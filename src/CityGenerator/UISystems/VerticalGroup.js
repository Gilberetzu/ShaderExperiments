import * as PIXI from 'pixi.js';
import Draw from '../Draw';
import Group from './Group';

export default class VerticalGroup extends Group{
	constructor(contianer, bgColor, bgPadding, bgLineWidth, bgLineColor, bgRadius){
		super(contianer, bgColor, bgPadding, bgLineWidth, bgLineColor, bgRadius);
	}

	addElement(element, elementContainer, separation = 0){
		if(element != null){
			this.children.push(element);
		}
		
		this.container.removeChild(this.background);

		const newX = - elementContainer.width / 2;
		const newY = this.container.height + separation;
		this.container.addChild(elementContainer);
		elementContainer.position.set(newX, newY);

		this.container.addChildAt(this.background, 0);
		this.drawBackground();
	}
} 