<script>
	import {onMount} from "svelte";
	import ThreeScene from "./ThreeScene";

	let canvasElement;

	onMount(()=>{
		let scene = new ThreeScene(canvasElement);
		/*requestAnimationFrame(()=>{
			scene.animate();
		})*/
	})
</script>

<style>
	.canvasRender {
        position: relative;
        width: 100%;
        height: 100%;
    }
</style>

<canvas bind:this={canvasElement} class="canvasRender"></canvas>