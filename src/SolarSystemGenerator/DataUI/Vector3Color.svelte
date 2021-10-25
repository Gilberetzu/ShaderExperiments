<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import * as THREE from "three";

	//export let tooltip = "";
	export let colorStore: Writable<THREE.Color>;
	export let label;

	let colorInput;
	let hovered = false;
	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = colorStore.subscribe((val)=>{
			value = `#${val.getHexString()}`;
		});
	});
	onDestroy(()=>{
		unsubscribeStore();
	})

	let value:string;
	let inputChange = ()=>{
		colorStore.set(new THREE.Color(value));
	}
</script>

<style>
	.container{
		display: grid;
		grid-template-columns: 1fr 4em;
		position: relative;
	}
	.colorBoxBorder{
		position: absolute;
		top: 0px;
		left: 0px;
		right: 0px;
		bottom: 0px;
		background-color: var(--cs2_1);
	}
	.colorBoxBorderHover{
		background-color: var(--cs2_4) !important;
	}
	.colorBox{
		position: absolute;
		top: 4px;
		left: 4px;
		right: 4px;
		bottom: 4px;
	}
</style>

<div class="container">
	<div>
		{label}
	</div>
	<div style="position:relative; cursor: pointer;" on:mouseenter={()=>{hovered = true}} on:mouseleave={()=>{hovered = false}}>
		<input type="color" style="opacity: 0px;" bind:value on:change={inputChange} bind:this={colorInput}>
		<div class:colorBoxBorder={true} class:colorBoxBorderHover={hovered}/>
		<div class="colorBox" style={`background-color: ${value}`} on:click={()=>{colorInput.click()}}/>
	</div>
</div>