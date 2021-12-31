export type Vec2 = {
	x: number,
	y: number,
}
export type Input = {
	mouse: {
		init: boolean,
		buttons: Array<Boolean>,
		position: Vec2,
		delta: Vec2,
		scrollDelta: Vec2
	}
};