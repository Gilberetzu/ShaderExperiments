<script context="module">
</script>

<script>
  import { onMount } from 'svelte';
  import SinglePlanetGen from '../PlanetGenerator/SinglePlanetGen';
  import SliderFloat from '../PlanetGenerator/UniformsUI/SliderFloat.svelte';
  import Vec2 from '../PlanetGenerator/UniformsUI/Vec2.svelte';
  import Vec3Color from '../PlanetGenerator/UniformsUI/Vec3Color.svelte';
  import Vec3 from '../PlanetGenerator/UniformsUI/Vec3.svelte';

  let canvasElement;
  let planetGenerator;

  let currentResolution = {
    width: 1,
    height: 1
  };
  let renderScale = 1;

  let updateShaderUniform = () => {};

  let controls = [];
  let fileInput;

  const ControlTypes = {
    CONTROL: 'CONTROL',
    HEADER: 'HEADER',
    DIVISOR: 'DIVISOR',
    SYSTEM: 'SYSTEM'
  };

  let downloadAElement;

  let saveImage = () => {
    planetGenerator.renderForFile();
    canvasElement.toBlob((blob) => {
      saveRenderToImage(blob, `PlanetRender.png`);
    });
  };

  let saveImageCurrent = () => {
    planetGenerator.renderForFileCurrent();
    canvasElement.toBlob((blob) => {
      saveRenderToImage(blob, `PlanetRender.png`);
    });
  };

  let saveRenderToImage = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    downloadAElement.href = url;
    downloadAElement.download = filename;
    downloadAElement.click();

    planetGenerator.resizeRenderer(planetGenerator.desiredWidth);
  };

  let convertControlsToJSON = () => {
    let controlsJSON = [];
    for (let i = 0; i < controls.length; i++) {
      const control = controls[i];

      if (control.type == ControlTypes.CONTROL) {
        let val = null;
        if(planetGenerator.uniforms[control.params.uniformName].value.getHexString){
            val = planetGenerator.uniforms[control.params.uniformName].value.getHexString();
        }
        controlsJSON.push({
          type: ControlTypes.CONTROL,
          uniformName: control.params.uniformName,

          value: val==null ? JSON.stringify(
            planetGenerator.uniforms[control.params.uniformName].value
          ) : val
        });//getHexString
      }
    }

    downloadAElement.href = URL.createObjectURL(
      new Blob([JSON.stringify(controlsJSON, null, 2)], {
        type: 'text/plain'
      })
    );
    downloadAElement.download = 'planetParams.txt';
    downloadAElement.click();
    console.log('done');
  };

  let fileChanged = (event) => {
    console.log(event.target.files);
    let reader = new FileReader();
    reader.onload = (event) => {
      let jsonData = JSON.parse(event.target.result);
    };
    reader.readAsText(event.target.files[0]);
  };

  onMount(() => {
    planetGenerator = new SinglePlanetGen(canvasElement);
    planetGenerator.animate();

    renderScale = planetGenerator.renderScale;

    updateShaderUniform = (uniformName, newValue) => {
      planetGenerator.uniforms[uniformName].value = newValue;
    };

    let newControls = [
      {
        type: ControlTypes.HEADER,
        label: 'Camera Controls'
      },
      {
        type: ControlTypes.SYSTEM,
        component: SliderFloat,
        params: {
          min: -3.14,
          max: 3.14,
          step: 0.01,
          label: 'Camera Rotation Planar',
          uniformName: 'cameraRotationPlanar',
          defaultValue: 0
        }
      },
      {
        type: ControlTypes.SYSTEM,
        component: SliderFloat,
        params: {
          min: -3.14 / 2,
          max: 3.14 / 2,
          step: 0.01,
          label: 'Camera Rotation Vertical',
          uniformName: 'cameraRotationVertical',
          defaultValue: 0
        }
      },
      {
        type: ControlTypes.SYSTEM,
        component: SliderFloat,
        params: {
          min: 1.2,
          max: 2.5,
          step: 0.01,
          label: 'Camera Distance',
          uniformName: 'setCameraDistance',
          defaultValue: 2
        }
      },
      {
        type: ControlTypes.SYSTEM,
        component: SliderFloat,
        params: {
          min: 40,
          max: 90,
          step: 0.01,
          label: 'Camera FOV',
          uniformName: 'setCameraFOV',
          defaultValue: 60
        }
      },
      {
        type: ControlTypes.SYSTEM,
        component: SliderFloat,
        params: {
          min: 246,
          max: 1080,
          step: 0.01,
          label: 'Render Width',
          uniformName: 'setRenderWidth',
          defaultValue: 300
        }
      },
      {
        type: ControlTypes.HEADER,
        label: 'Planet Surface Parameters'
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3,
        params: {
          label: 'Noise Offset',
          uniformName: '_PSNoiseOffset',
          defaultValue: planetGenerator.uniforms['_PSNoiseOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.01,
          max: 20.0,
          step: 0.01,
          label: 'Noise Global Scale',
          uniformName: '_PSNoiseGlobalScale',
          defaultValue: planetGenerator.uniforms['_PSNoiseGlobalScale'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.01,
          max: 1.0,
          step: 0.01,
          label: 'Water Height',
          uniformName: '_PSWaterHeight',
          defaultValue: planetGenerator.uniforms['_PSWaterHeight'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.01,
          max: 1.0,
          step: 0.01,
          label: 'Water Depth',
          uniformName: '_PSWaterDepthOffset',
          defaultValue: planetGenerator.uniforms['_PSWaterDepthOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.01,
          max: 1.0,
          step: 0.01,
          label: 'Height Over Water',
          uniformName: '_PSMaxHeightOffset',
          defaultValue: planetGenerator.uniforms['_PSMaxHeightOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec2,
        params: {
          label: 'Noise Scales',
          uniformName: '_PSNoiseScales',
          defaultValue: planetGenerator.uniforms['_PSNoiseScales'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -1.0,
          max: 1.0,
          step: 0.01,
          label: 'Secondary Noise Strength',
          uniformName: '_SecondaryNoiseStrengthGround',
          defaultValue:
            planetGenerator.uniforms['_SecondaryNoiseStrengthGround'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -10.0,
          max: 10.0,
          step: 0.01,
          label: 'Max Screw Terrain',
          uniformName: '_MaxScrewTerrain',
          defaultValue: planetGenerator.uniforms['_MaxScrewTerrain'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -1.0,
          max: 1.0,
          step: 0.01,
          label: 'Density Offset',
          uniformName: '_PSDensityOffset',
          defaultValue: planetGenerator.uniforms['_PSDensityOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: 'Surface Min Light',
          uniformName: '_SurfaceMinLight',
          defaultValue: planetGenerator.uniforms['_SurfaceMinLight'].value
        }
      },
      {
        type: ControlTypes.DIVISOR
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: '_Planet Color 1',
          uniformName: '_PlanetColor1',
          defaultValue: planetGenerator.uniforms['_PlanetColor1'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: '_Planet Color 2',
          uniformName: '_PlanetColor2',
          defaultValue: planetGenerator.uniforms['_PlanetColor2'].value
        }
      },
      {
        type: ControlTypes.HEADER,
        label: 'Ocean Parameters'
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: 'Water Color Depth',
          uniformName: '_WaterColorDepth',
          defaultValue: planetGenerator.uniforms['_WaterColorDepth'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: 'Water Color Surface',
          uniformName: '_WaterColor',
          defaultValue: planetGenerator.uniforms['_WaterColor'].value
        }
      },
      {
        type: ControlTypes.DIVISOR
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec2,
        params: {
          label: 'Water Depth Smooth Step',
          uniformName: '_WaterMaterialSmoothStep',
          defaultValue:
            planetGenerator.uniforms['_WaterMaterialSmoothStep'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 20.0,
          step: 0.01,
          label: 'Water Normal Scale',
          uniformName: '_WaterNormalScale',
          defaultValue: planetGenerator.uniforms['_WaterNormalScale'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: 'Water Min Light',
          uniformName: '_WaterSurfaceMinLight',
          defaultValue: planetGenerator.uniforms['_WaterSurfaceMinLight'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: 'Water Normal Strength',
          uniformName: '_WaterNormalStrength',
          defaultValue: planetGenerator.uniforms['_WaterNormalStrength'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec2,
        params: {
          label: 'Specular Params',
          uniformName: '_SpecularParams',
          defaultValue: planetGenerator.uniforms['_SpecularParams'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: 'Water Move Speed',
          uniformName: '_WaterMoveSpeed',
          defaultValue: planetGenerator.uniforms['_WaterMoveSpeed'].value
        }
      },
      {
        type: ControlTypes.HEADER,
        label: 'Cloud Parameters'
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1,
          step: 0.01,
          label: 'Cloud Transparency',
          uniformName: '_CloudTransparency',
          defaultValue: planetGenerator.uniforms['_CloudTransparency'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: 'Cloud Color 1',
          uniformName: '_CloudColor1',
          defaultValue: planetGenerator.uniforms['_CloudColor1'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: 'Cloud Color 2',
          uniformName: '_CloudColor2',
          defaultValue: planetGenerator.uniforms['_CloudColor2'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -10.0,
          max: 10.0,
          step: 0.01,
          label: 'Cloud Max Screw',
          uniformName: '_MaxScrewCloud',
          defaultValue: planetGenerator.uniforms['_MaxScrewCloud'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: 'Cloud Mid Distance',
          uniformName: '_CloudMidDistance',
          defaultValue: planetGenerator.uniforms['_CloudMidDistance'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 0.5,
          step: 0.01,
          label: 'Cloud Half Height',
          uniformName: '_CloudHalfHeight',
          defaultValue: planetGenerator.uniforms['_CloudHalfHeight'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec2,
        params: {
          label: 'Cloud Noise Scales',
          uniformName: '_CloudNoiseScales',
          defaultValue: planetGenerator.uniforms['_CloudNoiseScales'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3,
        params: {
          label: 'Cloud Noise Offset',
          uniformName: '_CloudNoiseOffset',
          defaultValue: planetGenerator.uniforms['_CloudNoiseOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 20,
          step: 0.01,
          label: 'Cloud Noise Global Scale',
          uniformName: '_CloudNoiseGlobalScale',
          defaultValue: planetGenerator.uniforms['_CloudNoiseGlobalScale'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 20,
          step: 0.01,
          label: 'Cloud Secondary Noise Strength',
          uniformName: '_SecondaryNoiseStrength',
          defaultValue:
            planetGenerator.uniforms['_SecondaryNoiseStrength'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.0,
          max: 20,
          step: 0.01,
          label: 'Cloud Noise Multiplier',
          uniformName: '_CloudDensityMultiplier',
          defaultValue:
            planetGenerator.uniforms['_CloudDensityMultiplier'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -10.0,
          max: 10.0,
          step: 0.01,
          label: 'Cloud Noise Offset',
          uniformName: '_CloudDensityOffset',
          defaultValue: planetGenerator.uniforms['_CloudDensityOffset'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: -10.0,
          max: 10.0,
          step: 0.01,
          label: 'Cloud Move Speeed',
          uniformName: '_CloudMoveSpeed',
          defaultValue: planetGenerator.uniforms['_CloudMoveSpeed'].value
        }
      },
      {
        type: ControlTypes.HEADER,
        label: 'Ambien Parameters'
      },
      {
        type: ControlTypes.CONTROL,
        component: Vec3Color,
        params: {
          label: 'Ambient Color',
          uniformName: '_AmbientColor',
          defaultValue: planetGenerator.uniforms['_AmbientColor'].value
        }
      },
      {
        type: ControlTypes.CONTROL,
        component: SliderFloat,
        params: {
          min: 0.5,
          max: 10.0,
          step: 0.01,
          label: 'Ambient Power',
          uniformName: '_AmbientPower',
          defaultValue: planetGenerator.uniforms['_AmbientPower'].value
        }
      },

      {
        type: ControlTypes.DIVISOR
      }
    ];

    controls = newControls;
  });
</script>

<a style="display: none;" bind:this={downloadAElement}>download</a>
<div class="container">
  <div class="canvasRenderHolder">
    <canvas class="canvasRender" bind:this={canvasElement} />
  </div>
  <div class="sideControls">
    <div>
      <div class="Render" on:click={convertControlsToJSON}>JSON</div>
      <input type="file" on:change={fileChanged} bind:value={fileInput} />
    </div>
    <div class="SettingsButtons">
      <div class="Render" on:click={saveImage}>Render HD</div>
      <div class="Render" on:click={saveImageCurrent}>Render Current</div>
    </div>
    <div class="SettingsButtons">
      <div
        class="Render"
        on:click={() => {
          planetGenerator.setRaymarchLowSettings();
        }}
      >
        Low Settings
      </div>
      <div
        class="Render"
        on:click={() => {
          planetGenerator.setRaymarchNormalSettings();
        }}
      >
        Normal Settings
      </div>
    </div>
    {#each controls as control}
      {#if control.type == ControlTypes.CONTROL}
        <svelte:component
          this={control.component}
          bind:updateShaderUniform
          {...control.params}
        />
      {:else if control.type == ControlTypes.HEADER}
        <div class="header">
          <div class="headerLine" />
          <div>{control.label}</div>
          <div class="headerLine" />
        </div>
      {:else if control.type == ControlTypes.DIVISOR}
        <div class="Divisor" />
      {:else if control.type == ControlTypes.SYSTEM}
        <svelte:component
          this={control.component}
          updateShaderUniform={(uniformName, newValue) => {
            planetGenerator[uniformName](newValue);
          }}
          {...control.params}
        />
      {/if}
    {/each}
  </div>
</div>

<style>
  :global(body) {
    padding: 0px;
    margin: 0px;
  }
  .container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    display: grid;
    grid-template-columns: 1fr 400px;

    grid-template-areas: 'render sideControls';
  }
  .topControls {
    grid-area: topControls;
  }
  .canvasRenderHolder {
    grid-area: render;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .canvasRender {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .sideControls {
    grid-area: sideControls;
    padding: 0em 1em;
    background-color: var(--c4);
    color: var(--c1);
    overflow-y: auto;
  }
  .header {
    font-size: 1.5em;
    font-weight: 300;
    margin-top: 1em;
    display: grid;
    place-items: center;
    gap: 1em;
    grid-template-columns: 1fr auto 1fr;
  }
  .headerLine {
    height: 2px;
    width: 100%;
    background-color: var(--c1);
  }
  .Divisor {
    width: 100%;
    height: 1em;
    position: relative;
  }
  .Divisor::after {
    content: '';
    width: 50%;
    height: 0.25em;
    position: absolute;
    left: 25%;
    top: 0.7em;
    border-radius: 1em;
    background-color: var(--c2);
  }
  .Render {
    background-color: var(--c1);
    color: var(--c4);
    font-weight: 700;
    font-size: 1.2em;
    text-align: center;
    padding: 0.5em 0px;
    margin-top: 1em;
    cursor: pointer;
  }
  .Render:hover {
    background-color: var(--c3);
  }
  .SettingsButtons {
    display: grid;
    gap: 1em;
    grid-template-columns: 1fr 1fr;
  }
</style>
