---
layout: post
title: Terrarium
categories: [procgen]
---

![Terrarium in action](https://i.imgur.com/EAF3Mdl.png "Terrarium in action")
# A small ecosystem in a window

I've lately been inspired by [Loren schmidt](https://twitter.com/lorenschmidt) and her [new project](https://twitter.com/hashtag/tygrfav2). Although her project is way more involved and complicated and more game-like it inspired me to try something in similar vein.

So here's a small ecosystem and how it works.

# Simple/physical parts
![Stuff](https://i.imgur.com/uK9fKTm.png "Sand and stuff")

## Sand
A brownish substance that piles up. It's calculated as follows:
* try to fall down
* if you can't try to fall down-left (or randomly down-right)

## Walls
A dark teal totally inert substance. Mostly for light cover

## Water
A blue/light blue material. Currently does nothing important. Calculation:
* try to fall down
* if you can't try to move left (or randomly right)

## Dead plant matter
Dark reddish material. Simulated same as sand.

## Light
Everything in here is either light blocking (e.g. sand, walls) or not (water, empty air, seeds). It's shown as light background and it lights up first layer of sand.

# Plants

![Plants](https://i.imgur.com/2oLIGIU.png "All stages at once")
Plants have 3 stages: seed, growing and fruiting.

## Seed

It's an orange/yellowy falling pixel. While falling it moves a bit to left/right just so it would not fall into same dark spots. To go into growing stage it needs to fall onto sand and be lit by light. If it sits too long in darkness it decomposes into `dead plant matter`.

## Growing

The green material. The seed extends it's shoot upwards. It has a bias towards the light. Each pixel placed consumes some energy of the plant and even existing consumes some more. On the other hand sunlit pixels of the plant generate energy. If energy gets below zero plant turns into `dead plant matter`.
The cost of adding pixels is increased (quadratically) for each new pixel. This makes plants stop growing after some time. That is when the plant goes into `fruiting`.

## Fruiting

The orange blob stuck to the plant. Plant uses it's energy to grow it bigger. As it reaches it's size limit it burst into `dead plant matter` and some `seeds`. This makes new plants as the seeds sometimes get into good place and sprout new plants.

# Worms

![Worm](https://i.imgur.com/4ol2OfN.png "Worm in a pile of dead plant matter")

Worms start a single cell and grow by eating `dead plant matter`. This reduces the piles of it which would drown out the terrarium very quickly. It also mimics the part of decomposers in natural world. Some behavior traits:
* swim through sand
* eat dead plant matter
* when they die they turn into sand
* light hurts them
* if they bite themselves they turn into 1 celled worm and sometimes birth new worms
* they have a small bias to going up

This makes them very good for plants as they come up to the surface, destroy `dead plant matter` and then die and turn into sand in sunlight. This is then makes plant seeds sprout.

# Issues

However this still needs work to be fully closed system:
* The system generated too much sand and eventually fills up
* Sometimes plants for some reason grow very short and die
* Sometimes worms or plants get extinct and needs reintroduction
* Worms bite themselves or get stuck a lot - i would love to see them grow bigger :)
* Everything is fiddly - e.g. plants have ~10 parameters that sometimes make them grow too large or not grow at all.

# Conclusion

It's a very interesting toy to experiment and see some emergent behavior. My approach is more object oriented (i.e. plants and worms are objects) but you could go more [Cellular automaton](https://en.wikipedia.org/wiki/Cellular_automaton) path and get different cell interactions that way (e.g. make artificial cells with cell membrane being one type insides different kind cells). And any way you go it's a very dynamic and 'alive' toy.
