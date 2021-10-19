<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import * as THREE from "three";

	import NumberInput from "./NumberInput.svelte";

	export let tooltip = "";
	export let vector2Store: Writable<THREE.Vector2>;
	export let label;

	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = vector2Store.subscribe((val)=>{
			xVal = val.x;
			yVal = val.y;
		});
	})

	onDestroy(()=>{
		unsubscribeStore();
	})

	let xVal:number;
	let yVal:number;
	let inputChange = ()=>{
		vector2Store.set(new THREE.Vector2(xVal, yVal));
	}
</script>

<style>
	.valContainer{
		display: grid;
		grid-template-columns: 2em 1fr;
	}
	.label{
		color: var(--cs2_6);
		font-weight: 300;
		font-size: 1.2em;
	}
</style>

<div>
	{label}
	<div class="valContainer">
		<div class="label">x :</div>
		<NumberInput bind:value={xVal} on:change={inputChange}/>
	</div>
	<div class="valContainer">
		<div class="label">y :</div>
		<NumberInput bind:value={yVal} on:change={inputChange}/>
	</div>
</div>