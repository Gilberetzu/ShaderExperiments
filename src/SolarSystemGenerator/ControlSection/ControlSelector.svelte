<script>
	export let label = "error?";
	export let selected = false;
	let hovered = false;

	let buttonElement;
	let position = {
		left: 0,
		top: 0
	};
	let startHover = ()=>{
		hovered = true;
		let rect = buttonElement.getClientRects()[0];
		position = {
			left: rect.left,
			top: rect.top
		};
	}
	let endHover = ()=>{
		hovered = false;
	}
</script>

<style>
	.controlSelectButton{
		width: 2em;
		height: 2em;
		margin-top: 6px;
		background-color: var(--cs2_5);
		border-radius: 0.5em 0px 0px 0.5em;
		cursor: pointer;
		position: relative;
	}
	.controlSelectButton:hover{
		background-color: var(--cs2_4);
	}
	.selected{
		background-color: var(--cs2_3) !important;
	}
	.controlSelectButtonAfter{
		pointer-events: none;
		position: fixed;
		right: 0.5em;
		height: 2em;
		white-space: nowrap;
		padding: 0em 0.5em;
		display: grid;
		place-content: center;
		background-color: white;
		color:black;
		z-index: 10000;
		width: min-content;
		transform: translateX(-100%);
	}
</style>

<div class:controlSelectButton={true} bind:this={buttonElement} class:selected on:click on:mouseenter={startHover} on:mouseleave={endHover}>
	{#if hovered}
		<div class="controlSelectButtonAfter" style={`top: ${position.top}px; left: ${position.left}px`}>
			{label}
		</div>
	{/if}
</div>