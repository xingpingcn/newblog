# Serve images directly from jsdmirror

Blog image bytes must be delivered directly from `cdn.jsdmirror.com` so they do not consume the blog deployment's bandwidth. We therefore keep source images and pre-generated responsive variants in `xingpingcn/picx-images-hosting`, emit external CDN `srcset` URLs, and deliberately avoid Astro's default site-hosted image output.
