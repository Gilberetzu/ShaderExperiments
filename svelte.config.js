import vercel from '@sveltejs/adapter-vercel';
import sveltePreprocess from 'svelte-preprocess';

export default {
  preprocess: sveltePreprocess(),
  kit: {
    adapter: vercel(),
    target: '#svelte',
  },
};
