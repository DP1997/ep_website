// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// base ist noetig, damit die statische Site unter https://DP1997.github.io/ep_website/ korrekt verlinkt.
export default defineConfig({
  output: 'static',
  site: 'https://DP1997.github.io/ep_website',
  base: '/ep_website/',
});
