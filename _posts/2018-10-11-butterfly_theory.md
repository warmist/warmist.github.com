---
layout: post
title: Butterfly theory
categories: [procgen]
---

# Generating Diffusion Limited Aggregation (like thing)
![initial](https://i.imgur.com/pLYBg9P.png "Seed 42 of aggregation")

The general idea is particles move around and clump together when they hit each other. In this case it's simplified to have a central seed (red rectangle in center of the image) and the particles start in random place on the border and shoot somewhat towards the center.

More info about this style of generation: [wikipedia](https://en.wikipedia.org/wiki/Diffusion-limited_aggregation)
Example of generator like this: [reddit](https://www.reddit.com/r/generative/comments/92nvm5/diffusion_limited_aggregation_its_amazing_how/)

# The chaos part
![final](https://i.imgur.com/CZnnVKL.png "Seed 42 with some randomness and many iterations")

My idea was to explore what happens when you offset particles very little each run. The resulting image (log normed - see [fractal flames wikipedia](https://en.wikipedia.org/wiki/Fractal_flame#Rendering_an_image) or [original pdf about fractal flames](http://flam3.com/flame.pdf)) is displayed above.

# Implementation

The idea is to have 2 random generators: one that is used for "main" generation of random rays and the "offset" generator that is generating very small (ray target in my case) offset. Rerun the algo many times each time adding the result into a floating point buffer and after some time get the nice image.

The source code for this is here: [my github repo](https://github.com/warmist/PixelDance/blob/868ab009cc0fa9a57b8c6c455a489fec03c461ca/projects/crystals.lua)

# Results

Main issues:

* This takes too long - the second image took full night to show up. This is mainly due to wasted cycles with rays that miss the target.
* Does not look too interesting :|
* Log normed rendering is not idea for this kind of algo. It requires a huge amount of data and looks better with very uneven distribution (e.g. in case of fractal flames, there could be 10e9 difference in bright and dark parts of image).

# Other

Original idea was just to grow many DFLA's and add them together. This resulted in uniform "fluffy" look.

<blockquote class="imgur-embed-pub" lang="en" data-id="a/satLV0k"><a href="//imgur.com/satLV0k"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

