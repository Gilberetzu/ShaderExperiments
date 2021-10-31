<script>
    export let label = 'error?';
    export let selected = false;

    import WebIcon from '../../CommonComponents/Icons/ControlSelect/WebIcon.svelte';
    import Camera from '../../CommonComponents/Icons/ControlSelect/Camera.svelte';
    import Save from '../../CommonComponents/Icons/ControlSelect/Save.svelte';
    import Cloud from '../../CommonComponents/Icons/ControlSelect/Cloud.svelte';
    import Planet from '../../CommonComponents/Icons/ControlSelect/Planet.svelte';
    import Satellite from '../../CommonComponents/Icons/ControlSelect/Satellite.svelte';
    import Scene from '../../CommonComponents/Icons/ControlSelect/Scene.svelte';
    import Water from '../../CommonComponents/Icons/ControlSelect/Water.svelte';
    import Sun from '../../CommonComponents/Icons/ControlSelect/Sun.svelte';

    let hovered = false;

    let buttonElement;
    let position = {
        left: 0,
        top: 0
    };
    let startHover = () => {
        hovered = true;
        let rect = buttonElement.getClientRects()[0];
        position = {
            left: rect.left,
            top: rect.top
        };
    };
    let endHover = () => {
        hovered = false;
    };
</script>

<div
    class:controlSelectButton={true}
    bind:this={buttonElement}
    class:selected
    on:click
    on:mouseenter={startHover}
    on:mouseleave={endHover}
>
    {#if label == 'About'}
        <WebIcon />
    {:else}
        <div class="newIcons">
            {#if label == 'Camera'}
                <Camera />
            {:else if label == 'Save'}
                <Save />
            {:else if label == 'Scene'}
                <Scene />
            {:else if label == 'Planetary System' || label == 'Satellites'}
                <Satellite />
            {:else if label == 'Star'}
                <Sun />
            {:else if label == 'Surface'}
                <Planet />
            {:else if label == 'Cloud'}
                <Cloud />
            {:else if label == 'Water'}
                <Water />
			{:else}
				<div class="dot"/>
            {/if}
        </div>
    {/if}
    {#if hovered}
        <div
            class="controlSelectButtonAfter"
            style={`top: ${position.top}px; left: ${position.left}px`}
        >
            {label}
        </div>
    {/if}
</div>

<style>
	.dot{
		border-radius: 1em;
		width: 50%;
		height: 50%;
		place-self: center;
		background-color: var(--cs2_6);
	}
    .newIcons {
        display: grid;
        place-content: center;
        grid-template-columns: 80%;
        line-height: 0;
        grid-template-rows: 80%;
        width: 100%;
        height: 100%;
    }
    .controlSelectButton {
        width: 2em;
        height: 2em;
        margin-top: 6px;
        background-color: var(--cs2_5);
        border-radius: 0.5em 0px 0px 0.5em;
        cursor: pointer;
        position: relative;
    }
    .controlSelectButton:hover {
        background-color: var(--cs2_4);
    }
    .selected {
        background-color: var(--cs2_3) !important;
    }
    .controlSelectButtonAfter {
        pointer-events: none;
        position: fixed;
        right: 0.5em;
        height: 2em;
        white-space: nowrap;
        padding: 0em 0.5em;
        display: grid;
        place-content: center;
        background-color: white;
        color: black;
        z-index: 10000;
        width: min-content;
        transform: translateX(-100%);
    }
</style>
