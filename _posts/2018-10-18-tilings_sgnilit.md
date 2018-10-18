---
layout: post
title: Tilings sgniliT
categories: [procgen]
mathjax: true
---

![Tiling fractal](https://i.imgur.com/GOT6mSH.png "Oops i tiled it again")

# Why did I do this?

I've always wanted my own [IFS][IFS wiki] tool to play around. Latest idea was to generate
the function that is iterated procedurally. However you quickly run into a problem:
how to make it visually good? Or more specifically I was afraid it would quickly
diverge thus all the points you are iterating would be outside of the "view" so to
say.

One way to solve it would be to generate the function with some special way (more
on this later) but the simplest idea i had was just to `mod` the coordinates. That
way it would bend on itself and no generated points would be wasted! That had a
side effect: because the "visits" ($x_n=mod(f(x_{n-1}),size)$) map into same space
the reverse can be true - we can map image space into that modular space. I.e. we
can have image be any size and it would map into same "render" image.

# Some tilings

Function used in these later examples:
```lua
function step_iter( x,y,v0,v1)
	local x_1=x
	local x_2=x*x/2

	local y_1=y
	local y_2=y*y/2

	local nx=x_2*v0-y_2;
	local ny=y_2*v1/x_2;

	local delta=math.sqrt(nx*nx+ny*ny)
	if delta<0.00001 then
		delta=1
	end
	local d=config.move_dist/delta
	nx=x+nx*d
	ny=y+ny*d

	return nx,ny
end
```

Arguments used: $v0=0.704; v1=-0.075; \text{config.move_dist}=0.428$

## No tiling

![no tiling](https://i.imgur.com/EPia8pB.png)

```lua
function map_coordinate(x,y)
	return x,y
end
```

## Modular

```lua
function mod(a,b)
	local r=math.fmod(a,b)
	if r<0 then
		return r+b
	else
		return r
    end
end
function map_coordinate(x,y)
	x=mod(x,w)
	y=mod(y,h)
	return x,y
end
```

Simplest tiling. Repeats in both directions looks very repetitive for that reason.

### Single
![single](https://i.imgur.com/rDN6tZl.png)
### Tiled
![tiled](https://i.imgur.com/r8utz8y.jpg)

## Reflection

```lua
function mod_reflect( a,max )
	local ad=math.floor(a/max)
	a=mod(a,max)
	if ad%2==1 then
		a=max-a
	end
	return a
end
function map_coordinate(x,y)
	x=mod_reflect(x,w-1)
	y=mod_reflect(y,h-1)
	return x,y
end
```
Repeats in both direction every even repetition being flipped. Looks like fractal
is bouncing of the walls.

### Single
![single](https://i.imgur.com/EcOkK1F.png)
### Tiled
![tiled](https://i.imgur.com/xqbCfak.jpg)

## Polar mappings

Note: these mappings no longer preserve areas - i.e. you would need some smarter
way of mapping things so that tiled image quality is preserved. I do (almost) nothing and
some scaling artifacts are present.

Variant A:
```lua
function map_coordinate(x,y)
	local dist=w/2
	local cx,cy=x-w/2,y-h/2 --center the space
	--to polar coordinates
	local r=math.sqrt(cx*cx+cy*cy)
	local a=math.atan2(cy,cx)

	--bend space :)
	--for function def. see above
	r=mod_reflect(r,dist)
	a=mod(a,math.pi/3)
	
	--unbend space
	cx=math.cos(a)*r
	cy=math.sin(a)*r

	return cx+w/2,cy+h/2
end
```
It's easy to see from the images below that not all of the screen is used and some
parts are look bad.

Variant B:
```lua
function map_coordinate(x,y)
	local dist=w
	local cx,cy=x-w/2,y-h/2
	local r=math.sqrt(cx*cx+cy*cy)
	local a=math.atan2(cy,cx)

	r=mod_reflect(r,dist-1)
	a=mod(a,math.pi/3)
	--the new part: map the angle to y coordinate to fill ALL of the image
	a=a/(math.pi/3)
	a=a*s[2]
	return r,a
end
```
This makes the center look worse but the image can have more details.

### Single, variant A

![single](https://i.imgur.com/wUrrOzV.png)

### Tiled, variant A

![tiled](https://i.imgur.com/KSsKGoQ.jpg)

### Single, variant B

![single](https://i.imgur.com/oAKl2uc.png)

### Tiled, variant B

![tiled](https://i.imgur.com/eb5eipl.jpg)

## Hex mapping

Not sure why, but i really wanted to have a hex mapping... So it took me few sleepless
nights but finally i've got it. Mostly from [Red Blob Games site][rbgsite]

```lua
function to_hex_coord( x,y )
	local size=300
	local q=(math.sqrt(3)/3*x-(1/3)*y)/size
	local r=((2/3)*y)/size
	return q,r
end
function from_hex_coord( q,r )
	local size=300
	local x=(math.sqrt(3)*q+(math.sqrt(3)/2)*r)*size
	local r=((3/2)*r)*size
	return x,r
end
function round( x )
	return math.floor(x+0.5)
end
function axial_to_cube( q,r )
	return q,-q-r,r
end
function cube_to_axial(x,y,z )
	return x,z
end
function cube_round( x,y,z )
	local rx = round(x)
    local ry = round(y)
    local rz = round(z)

    local x_diff = math.abs(rx - x)
    local y_diff = math.abs(ry - y)
    local z_diff = math.abs(rz - z)

    if x_diff > y_diff and x_diff > z_diff then
        rx = -ry-rz
    elseif y_diff > z_diff then
        ry = -rx-rz
    else
        rz = -rx-ry
    end

    return rx, ry, rz
end
function map_coordinate(x,y)
	local cx,cy=x-w/2,y-h/2
	cx,cy=to_hex_coord(cx,cy)
	local rx,ry,rz=axial_to_cube(cx,cy)
	--the hex tile id or rounded coordinate
	local rrx,rry,rrz=cube_round(rx,ry,rz)
	--basically fract(x) in "cube" space
	rx=rx-rrx
	ry=ry-rry
	rz=rz-rrz
	cx,cy=cube_to_axial(rx,ry,rz)
	cx,cy=from_hex_coord(cx,cy)
	return cx+sx,cy+sy
end
```

### Single

![single](https://i.imgur.com/rkhHK2W.png)

### Tiled

![tiled](https://i.imgur.com/O4JXL3I.png)

# Conclusion

Although all of this was inspired by [fractal flames][ff wiki] I haven't seen
anything like this done before. Also all these techniques could be mixed and matched
to achieve even more different nice images.

Next questions I want to tackle: 

* How do you stitch fractal flames so you could have tiles seamlessly transition to different functions.
* What happens if you have [Voronoi][wolfram voronoi] regions that have different functions.
* Is there a way to have equal area polar (and other) transformations.
* Is it possible to make [Penrose][wiki penrose] tiling fractal.

And finally some random images with these techniques.

<blockquote class="imgur-embed-pub" lang="en" data-id="a/HO1RKqw"><a href="//imgur.com/HO1RKqw"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>


[IFS wiki]: https://en.wikipedia.org/wiki/Iterated_function_system
[rbgsite]: https://www.redblobgames.com/grids/hexagons/#pixel-to-hex
[ff wiki]: https://en.wikipedia.org/wiki/Fractal_flame
[wolfram voronoi]: http://mathworld.wolfram.com/VoronoiDiagram.html
[wiki penrose]: https://en.wikipedia.org/wiki/Penrose_tiling