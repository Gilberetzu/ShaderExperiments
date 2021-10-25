<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import * as THREE from "three";
	import { createEventDispatcher } from 'svelte';

	export let tooltip = "";
	export let vector2Store: Writable<THREE.Vector2>;
	export let label;
	export let min = 0;
	export let max = 1;

	let xVal:number;
	let yVal:number;

	let minSlider: number;
	let maxSlider: number;

	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = vector2Store.subscribe((val)=>{
			xVal = val.x;
			yVal = val.y;

			minSlider = (xVal - min)/(max - min);
			maxSlider = (yVal - min)/(max - min);
		});
	})

	onDestroy(()=>{
		unsubscribeStore();
	})

	let inputChange = ()=>{
		vector2Store.set(new THREE.Vector2(xVal, yVal));
	}

	let sliderElement;
	
	let movingMinSlider = false;
	let movingMaxSlider = false;

	let hoverRange = false;

	let setHoverRange = (val)=>{
		hoverRange = val;
	}

	const dispatch = createEventDispatcher();

	let getSliderPos = (clientX)=>{
		let rect = sliderElement.getClientRects()[0];
		let deltaPos = clientX - rect.x;
		deltaPos = deltaPos < 0 ? 0 : deltaPos;
		deltaPos = deltaPos > rect.width ? rect.width : deltaPos;

		return deltaPos / rect.width;
	}

	let getValFromSliderPos = (slider)=>{
		return min + slider * (max - min)
	}

	let setSliderPos = (sliderPos) => {
		if(movingMinSlider){
			minSlider = sliderPos;
			if(minSlider > maxSlider){
				maxSlider = minSlider;
				yVal = getValFromSliderPos(maxSlider);
			}
			xVal = getValFromSliderPos(minSlider);
		}else{
			maxSlider = sliderPos;
			if(maxSlider < minSlider){
				minSlider = maxSlider;
				xVal = getValFromSliderPos(minSlider);
			}
			yVal = getValFromSliderPos(maxSlider);
		}
	}

	let mouseDownSlider = (event, isMinSlider)=>{
		event.preventDefault();
		let sliderPos = getSliderPos(event.clientX);
		if(isMinSlider){
			movingMinSlider = true;
		}else{
			movingMaxSlider = true;
		}
		setSliderPos(sliderPos);
		inputChange();

		dispatch('change', "");
	}

	let mouseMove = (event)=>{
		if(movingMinSlider || movingMaxSlider){
			event.preventDefault();
			let sliderPos = getSliderPos(event.clientX);
			setSliderPos(sliderPos);
			inputChange();
			dispatch('change', "");
		}
	}

	let mouseUp = ()=>{
		if(movingMinSlider || movingMaxSlider){
			movingMinSlider = false;
			movingMaxSlider = false;
		}
	}

	let changeValPrecision = (val)=>{
		return Math.floor(val * 100)/100;	
	}
</script>

<svelte:window on:mousemove={mouseMove} on:mouseup ={mouseUp}/>

<style>
	.label{
		color: var(--cs2_6);
		font-weight: 300;
		font-size: 1.2em;
	}

	.slider{
		width: 100%;
		height: 1.5em;
		position: relative;
	}
	.sliderTrack{
		position: absolute;
		top: 40%;
		background-color: var(--cs2_1);
		width: 100%;
		height: 20%;
	}
	.sliderRangeArea{
		position: absolute;
		top: 30%;
		height: 40%;
		z-index: 50;
		background-color: var(--cs2_2);
	}
	.sliderRangeArea:hover{
		background-color: var(--cs2_4);
	}
	.sliderThumb{
		position: absolute;
		height: 100%;
		width: 1em;
		border-radius: 1em;
		cursor: pointer;
		transform: translateX(-0.5em);
		z-index: 75;
	}
	.sliderThumbMin{
		background-color: var(--cs2_7);
	}
	.sliderThumbMax{
		background-color: var(--cs2_8);
	}
	.sliderThumb:hover{
		background-color: var(--cs2_4);
	}
	.sliderValue{
		position: absolute;
		z-index: 100;
		padding: 0.25em 1em;
		top: -150%;
		background-color: var(--cs2_1);
		color: var(--cs_5);
		transform: translateX(-50%);
		border-radius: 1em;
	}
</style>

<div>
	{label}
	<div class="slider" bind:this={sliderElement}>
		<div class="sliderTrack" ></div>
		
		<div class="sliderThumb sliderThumbMin" style={`left: ${minSlider * 100}%`} on:mousedown={(event)=>{mouseDownSlider(event, true)}}></div>
		<div class="sliderThumb sliderThumbMax" style={`left: ${maxSlider * 100}%`} on:mousedown={(event)=>{mouseDownSlider(event, false)}}></div>

		<div class="sliderRangeArea" on:mouseenter={()=>{setHoverRange(true)}} on:mouseleave={()=>{setHoverRange(false)}} style={`left: ${minSlider* 100}%; right:${(1 - maxSlider) * 100}%`}/>

		{#if movingMinSlider || hoverRange}
			<div class="sliderValue" style={`left: ${(minSlider) * 100}%`}>
				{changeValPrecision(xVal)}
			</div>
		{/if}
		{#if movingMaxSlider || hoverRange}
			<div class="sliderValue" style={`left: ${(maxSlider) * 100}%`}>
				{changeValPrecision(yVal)}
			</div>
		{/if}
	</div>
</div>