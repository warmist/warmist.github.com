window.onload = main;
//
// start here
//
var global_state={}
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }
  var ext = gl.getExtension("OES_texture_float");
  if (!ext) {
    alert("sorry, no floating point textures");
    return;
  }

  const vsSource = `
    precision mediump float;
    attribute vec4 aVertexPosition;
    varying vec4 pos;
    void main() {
      gl_Position = aVertexPosition;
      pos=aVertexPosition;
    }
`;

  const fsSource = `
    precision mediump float;
    varying vec4 pos;
    uniform sampler2D uSampler;
    uniform float white_point;
    uniform float avg_lum;
    uniform float v_gamma;
    uniform float exposure;

    vec3 xyz2rgb( vec3 c ) {
      vec3 v =  c / 100.0 * mat3(
          3.2406255, -1.5372080, -0.4986286,
          -0.9689307, 1.8757561, 0.0415175,
          0.0557101, -0.2040211, 1.0569959
      );
      vec3 r;
      r=v;
      /* srgb conversion
      r.x = ( v.r > 0.0031308 ) ? (( 1.055 * pow( v.r, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.r;
      r.y = ( v.g > 0.0031308 ) ? (( 1.055 * pow( v.g, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.g;
      r.z = ( v.b > 0.0031308 ) ? (( 1.055 * pow( v.b, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.b;
      //*/
      return r;
    }

    vec3 tonemap(vec3 light,float cur_exp)
    {
      float lum_white =white_point*white_point;// pow(10,white_point);
      //lum_white*=lum_white;
      float Y=light.y;
      Y=Y*exp(cur_exp)/(avg_lum);
      if(white_point<0.0)
          Y = Y / (1.0 + Y); //simple compression
      else
          Y = (Y*(1.0 + Y / lum_white)) / (Y + 1.0); //allow to burn out bright areas

      float m=Y/light.y;
      light.y=Y;
      light.xz*=m;

        //light=clamp(light,0,2);
        //float mm=max(light.x,max(light.y,light.z));
        vec3 ret=xyz2rgb((light)*100.0);
        //float s=smoothstep(0,1,length(light));
        //float s=smoothstep(0,1,dot(light,light));
        //float s=smoothstep(0,1,max(light.x,max(light.y,light.z)));//length(light));
        //float s=smoothstep(0.8,1.2,max(light.x,max(light.y,light.z))-1);//length(light));
        //float s=0;
        //float s=smoothstep(1,8,dot(ret,ret));
        float s=smoothstep(1.0,8.0,length(ret));
      ///*
        if(ret.x>1.0)ret.x=1.0;
        if(ret.y>1.0)ret.y=1.0;
        if(ret.z>1.0)ret.z=1.0;
      //*/
        return mix(ret,vec3(1.0),s);
    }
    vec4 process_color(vec3 col)
    {
      vec3 ccol=col;
      ccol=abs(ccol);
      ccol=max(vec3(0),ccol);
      ccol=pow(ccol,vec3(v_gamma));
      //ccol*=exp(v_gamma);
      return vec4(tonemap(ccol,exposure),1.0);
    }
    void main() {
      lowp vec2 normed_pos=vec2(0.0,0.0)+(pos.yx+vec2(1.0,1.0))*0.5*vec2(1.0,1.0);

      //gl_FragColor = vec4(normed_pos.xy, 0, 1.0);
      //gl_FragColor = vec4(texture2D(uSampler,normed_pos).xyz/500000.0, 1.0);
      gl_FragColor=process_color(texture2D(uSampler,normed_pos).xyz);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
      white_point: gl.getUniformLocation(shaderProgram, "white_point"),
      avg_lum: gl.getUniformLocation(shaderProgram, "avg_lum"),
      v_gamma: gl.getUniformLocation(shaderProgram, "v_gamma"),
      exposure: gl.getUniformLocation(shaderProgram, "exposure"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  var texture=loadTexture(gl)

  global_state={
    gl:gl,
    programInfo:programInfo,
    texture:texture,
  }
  // Draw the scene
  drawScene(gl, programInfo, buffers,texture);
}
function initBuffers(gl) {
  const positionBuffer = initPositionBuffer(gl);

  return {
    position: positionBuffer,
  };
}
function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
function drawScene(gl, programInfo, buffers,texture) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  /*
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amount to translate
  */
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  setPositionAttribute(gl, buffers, programInfo);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
  gl.uniform1f(programInfo.uniformLocations.white_point,-1);
  gl.uniform1f(programInfo.uniformLocations.avg_lum,10000);
  gl.uniform1f(programInfo.uniformLocations.v_gamma,1);
  gl.uniform1f(programInfo.uniformLocations.exposure,1);

  /*
      uniform float white_point;
    uniform float avg_lum;
    uniform float v_gamma;
    uniform float exposure;
  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
*/
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
function redraw() {
  var gl=global_state.gl
  var programInfo=global_state.programInfo
  gl.useProgram(programInfo.program);
 {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  } 
}
function update_params(gamma,exposure,white_point) {
  var gl=global_state.gl
  var programInfo=global_state.programInfo
  gl.useProgram(programInfo.program);
  gl.uniform1f(programInfo.uniformLocations.white_point,white_point);
  gl.uniform1f(programInfo.uniformLocations.v_gamma,gamma);
  gl.uniform1f(programInfo.uniformLocations.exposure,exposure);
  redraw()
}
// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 2; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function loadTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.FLOAT;
  const pixel = new Float32Array([0.2, 0.2, 0.2, 1]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );



  const myRequest = new Request("assets/img/saved_1693195817.buf",{
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  fetch(myRequest)
    .then((response) => response.arrayBuffer())
    .then((myBlob) => {
        //format: x,y,channels,flags
        var u32arr=new Uint32Array(myBlob,0,4);
        //format: 6 (min/max), 1 avg, 
        var statsArray=new Float32Array(myBlob,4*4,7);
        //format: x*y data
        var floatArray=new Float32Array(myBlob,(4+7)*4,u32arr[0]*u32arr[1]*u32arr[2]);
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          u32arr[0],
          u32arr[1],
          border,
          srcFormat,
          srcType,
          floatArray,
        );

        global_state.gl.uniform1f(global_state.programInfo.uniformLocations.avg_lum,Math.exp(statsArray[6]));
        redraw()
    });


  return texture;
}
function value_change() {
  var gamma=document.getElementById("gamma").value
  var exposure=document.getElementById("exposure").value
  var white_point=document.getElementById("white_point").value
  update_params(gamma,exposure,white_point)
}