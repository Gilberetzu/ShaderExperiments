<script>
    export let label = "Cloud Mid Height";
    export let uniformName = "_CloudMidDistance";
    export let updateShaderUniform = (uniformName, newValue) => {};

    export let defaultValue;

    export let value;

    let updateControlValue = ()=>{
        value = defaultValue ? defaultValue : false;
    }

    updateControlValue();

    $:{
        value;
        updateShaderUniform(uniformName, value);
    }
</script>


<style>
    .container{
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5em;
        margin-top: 1em;
    }
    .label{
        min-width: 80px;
    }
    .boolBox{
        width: 1.3em;
        height: 1.3em;
    }
    .boolTrue{
        background-color: var(--c1);
        cursor: pointer;
    }
    .boolFalse{
        background-color: var(--c2);
        cursor: pointer;
    }
</style>

<div class="container">
    <div class="label">{label}</div>
    <div on:click={()=>{value = !value;}} class:boolBox={true} class:boolFalse={!value} class:boolTrue={value}/>
</div>