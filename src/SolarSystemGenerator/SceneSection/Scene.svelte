<script lang="ts">
	import {onMount} from "svelte";
	import ThreeScene from "./ThreeScene";

	let canvasElement;
	let scene;

	let canvasCrisp = true;
	let setPixelPerfect = (val)=>{
		canvasCrisp = val;
	}
	onMount(()=>{
		scene = new ThreeScene(canvasElement, setPixelPerfect);
	})
	
</script>

<style>
	.canvasRender {
        position: relative;
        width: 100%;
        height: 100%;
    }
	.crispCanvas {
        image-rendering: optimizeSpeed; /* Older versions of FF          */
        image-rendering: -moz-crisp-edges; /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated; /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor; /* IE                            */
    }
</style>
<canvas bind:this={canvasElement} class:canvasRender = {true} class:crispCanvas={canvasCrisp}></canvas>