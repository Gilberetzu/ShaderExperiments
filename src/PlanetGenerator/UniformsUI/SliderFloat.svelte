<script>
    import {onMount} from 'svelte';

    export let min = 0;
    export let max = 2;
    export let step = 0.01;
    export let label = "Cloud Mid Height";
    export let uniformName = "_CloudMidDistance";

    export let updateShaderUniform = (uniformName, newValue) => {};
    export let defaultValue;

    let value;

    let updateControlValue = ()=>{
        if(!isNaN(defaultValue)) value = defaultValue;
    }

    updateControlValue();

    $:{
        value;
        updateShaderUniform(uniformName, value);
    }
</script>


<style>
    .container{
        display: grid;
        grid-template-columns: auto 1fr 40px 1em;
        gap: 0.5em;
        margin-top: 1em;
    }

    /*Chrome*/
@media screen and (-webkit-min-device-pixel-ratio:0) {
    input[type='range'] {
      overflow: hidden;
      -webkit-appearance: none;
      background-color: var(--c1);
    }
    
    input[type='range']::-webkit-slider-runnable-track {
      -webkit-appearance: none;
      color: var(--c2); 
      margin-top: -7px;
    }
    
    input[type='range']::-webkit-slider-thumb {
      width: 18px;
      -webkit-appearance: none;
      height: 18px;
      cursor: ew-resize;
      background: var(--c3);
      box-shadow: -200px 0 0 200px var(--c2);
    }

}
/** FF*/
input[type="range"]::-moz-range-progress {
  background-color: var(--c2); 
}
input[type="range"]::-moz-range-track {  
  background-color: var(--c1);
}
/* IE*/
input[type="range"]::-ms-fill-lower {
  background-color: var(--c2);
}
input[type="range"]::-ms-fill-upper {  
  background-color: var(--c1);
}

.resetButton{
    width: 1em;
    height: 100%;
    cursor: pointer;
    background-color: var(--c3);
}
input[type="number"]{
        min-width: 0px;
        border: none;
        background-color: rgb(240, 230, 230);
        padding: 0em 0.2em;
        border-radius: 0px 0.2em 0.2em 0em;
    }
    input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>

<div class="container">
    <div>{label}</div>
    <input type="range" min={min} max={max} step={step} bind:value/>
    <input type="number" bind:value>

    <div class="resetButton" on:click={()=>{
        value = defaultValue;
    }}/>
</div>