<script lang="ts">
	import {onMount, onDestroy} from "svelte";
	import { Writable } from "svelte/store";
	import NumberInput from "./NumberInput.svelte";
	//export let tooltip = "";
	export let floatStore: Writable<Number>;
	export let label;
	export let min = 0.0;
	export let max = 0.0;
	export let addSlider = false;

	let unsubscribeStore;
	onMount(()=>{
		unsubscribeStore = floatStore.subscribe((val)=>{
			value = val;
		});
	});

	onDestroy(()=>{
		unsubscribeStore();
	})

	let value;
	let inputChange = ()=>{
		floatStore.set(value);
	}
</script>

<style>

</style>

<div>
	{label}
	<NumberInput addSlider={addSlider} sliderMinMax={{min, max}} bind:value on:change={inputChange}/>
</div>