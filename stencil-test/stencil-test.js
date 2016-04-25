
var html=null;
var gl=null;


/* shader program */
var shaderProgram=null;
var texShaderProgram=null;

/* vertex attributes locations */
var position=null;

/* uniform variables locations */
var projection=null;
var view=null;
var skybox=null;



/* input vertices of cube triangles */
var xPlusFloat32Array= new Float32Array( [
	+1, +1, +1,
	+1, -1, +1,
	+1, -1, -1,
	+1, +1, -1,
]);
var xMinusFloat32Array= new Float32Array( [
	-1, +1, -1,
        -1, -1, -1,
        -1, -1, +1,
        -1, +1, +1,
]);

var yPlusFloat32Array= new Float32Array( [
        -1,  1, -1,
	-1,  1, +1,
	+1,  1, +1,
        +1,  1, -1,
]);
var yMinusFloat32Array= new Float32Array( [
        -1, -1, +1,
        -1, -1, -1,
	+1, -1, -1,
        +1, -1, +1,
]);

var zPlusFloat32Array= new Float32Array( [
        -1, +1,  1,
        -1, -1,  1,
	+1, -1,  1,
	+1, +1,  1,
]);
var zMinusFloat32Array= new Float32Array( [
	+1, +1, -1,
	+1, -1, -1,
	-1, -1, -1,
	-1, +1, -1,
]);



var vertexShaderSource=""+
    "attribute vec3 aPosition;\n"+
    "uniform mat4 projection;\n"+
    "uniform mat4 rotation;\n"+
    "uniform vec3 move;\n"+
    "void main()\n"+
    "{\n"+
    "    vec4 pos = rotation * vec4(aPosition, 1.0) + vec4(move, 0.0);\n"+
    "    gl_Position =  projection * pos;\n"+
    "}\n";

var fragmentShaderSource=""+
    "precision mediump float;\n"+
    "void main()\n"+
    "{\n"+
    /* red color - shows areas modified in stencil buffer */
    "    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n"+
    "}\n";


var texVertexShaderSrc=""+
    "attribute vec3 aPosition;\n"+
    "varying vec2 TexCoords;\n"+
    "void main()\n"+
    "{\n"+
    "    gl_Position = vec4(aPosition,1.0);\n"+
    "    TexCoords = aPosition.xy*10.0;\n"+ //// scaling by 10.0 
    "}\n";

var texFragmentShaderSrc=""+
    "precision mediump float;\n"+
    "varying vec2 TexCoords;\n"+
    "uniform sampler2D tex2D;\n"+
    "void main()\n"+
    "{\n"+
    "    gl_FragColor = texture2D(tex2D, TexCoords);\n"+
    "}\n";

var makeShaderProgram= function(gl, vertexShaderSource, fragmentShaderSource){
    /* Parameters:
       gl - WebGL context
    */

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(vertexShader));
	return null;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	console.log(gl.getShaderInfoLog(fragmentShader));
	return null;
    }

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	console.log("Could not initialise shaders");
	return null;
    }
    
    // SUCCESS
    return shaderProgram;
};


var drawTexture= function ( gl,  buffer, textureId, textureUnit ) {


    gl.useProgram(texShaderProgram);

    gl.enableVertexAttribArray(aPositionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0+textureUnit );
    gl.uniform1i(tex2DLocation, textureUnit );
    gl.bindTexture(gl.TEXTURE_2D, textureId);
    
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

var drawBufferFace= function ( gl, rotation, move, projection, buffer) {
    /* Parameters:
       gl - WebGL context
       view, projection - gl matrices 4x4 (column major)
       textureUnit - integer from [0 ... gl.MAX_TEXTURE_IMAGE_UNITS]
    */
    gl.depthFunc(gl.LESS);

    gl.useProgram(shaderProgram);

    gl.uniformMatrix4fv(rotationLocation, false, rotation);
    gl.uniform3fv(moveLocation,  move  );
    gl.uniformMatrix4fv(projectionLocation, false, projection);
    
    gl.enableVertexAttribArray(aPositionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

var createTexture2D= function(gl){
    /* parameters:
       gl -  WebGL contex
       textureUnit - texture unit to which the texture should be bound
    */
    var textureId=gl.createTexture();
    // gl.activeTexture(gl.TEXTURE0+textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureId);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return textureId;
}


var loadTexture2DFromImg= function(gl, img, textureId){
    /* use after  makeShaderProgram(gl) */
    /* Parameters:
       gl - WebGL context
       img - container of the image
       textureId - ID returned by  createMyTexture2D
       textureUnit - texture unit to which the texture should be bound
    */
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
    gl.bindTexture(gl.TEXTURE_2D, textureId);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap( gl.TEXTURE_2D ); /// 
};




/**  Model-view and projection  matrices **/

const PROJECTION_Z_NEAR = 0.25;
const PROJECTION_Z_FAR = 300;
const PROJECTION_ZOOM_Y = 4.0;


const identityMatrix4= [
    [ 1,0,0,0 ],
    [ 0,1,0,0 ],
    [ 0,0,1,0 ],
    [ 0,0,0,1 ],
];


var rotationMatrix4= identityMatrix4;

var moveVector=[0,0,10];



var createProjectionMatrix4= function (gl, zNear, zFar, zoomY ) {
    /* arguments:
       gl - GL context
       zNear, zFar, zoomY - Y-frustum parameters 

       returns: 4x4 row-major order perspective matrix
    */
    var xx=  zoomY*gl.viewportHeight/gl.viewportWidth;
    var yy=  zoomY;
    var zz=  (zFar+zNear)/(zFar-zNear);
    var zw= 1;
    var wz= -2*zFar*zNear/(zFar-zNear);
    return [
	[ xx,  0,  0,  0],
	[  0, yy,  0,  0],
	[  0,  0, zz, wz],
	[  0,  0, zw,  0]
    ];
}




var glVector3 = function ( x,y,z ){
    return new Float32Array(x,y,z);
};


var glMatrix4 = function (  xx, yx, zx, wx,
			    xy, yy, zy, wy,
			    xz, yz, zz, wz,
			    xw, yw, zw, ww )
{
    // sequence of concatenated columns
    return new Float32Array( [ xx, xy, xz, xw,
                               yx, yy, yz, yw,
                               zx, zy, zz, zw,
                               wx, wy, wz, ww ] );
};

var glMatrix4FromMatrix= function( m ) {
    /* arguments:
       m - the 4x4 array with the matrix in row-major order 

       returns: sequence of elements in column-major order in Float32Array for GL
    */
    return glMatrix4( 
	m[0][0], m[0][1], m[0][2], m[0][3],
	m[1][0], m[1][1], m[1][2], m[1][3],
	m[2][0], m[2][1], m[2][2], m[2][3],
	m[3][0], m[3][1], m[3][2], m[3][3]
    );
};


var scalarProduct4 = function( v,w ) {
    return v[0]*w[0]+v[1]*w[1]+v[2]*w[2]+v[3]*w[3];
};

var matrix4Column = function( m, c ) {
    return [ m[0][c], m[1][c], m[2][c], m[3][c] ]; 
};

var matrix4Product = function( m1, m2){ 
    var sp = scalarProduct4;
    var col = matrix4Column;
    return [ 
	[ sp(m1[0], col(m2, 0)) , sp(m1[0], col(m2, 1)),  sp(m1[0], col(m2, 2)),  sp(m1[0], col(m2, 3)) ], 
	[ sp(m1[1], col(m2, 0)) , sp(m1[1], col(m2, 1)),  sp(m1[1], col(m2, 2)),  sp(m1[1], col(m2, 3)) ], 
	[ sp(m1[2], col(m2, 0)) , sp(m1[2], col(m2, 1)),  sp(m1[2], col(m2, 2)),  sp(m1[1], col(m2, 3)) ], 
	[ sp(m1[3], col(m2, 0)) , sp(m1[3], col(m2, 1)),  sp(m1[3], col(m2, 2)),  sp(m1[3], col(m2, 3)) ] 
    ];
};

var matrix4RotatedXZ= function(matrix, alpha ){
    var c = Math.cos( alpha );
    var s = Math.sin( alpha ); 
    var rot = [ [ c,  0, -s, 0 ],
		[ 0,  1,  0, 0 ],
		[ s,  0,  c, 0 ],
		[ 0,  0,  0, 1 ]
	      ];

    return matrix4Product( rot, matrix );
};

var matrix4RotatedYZ= function(matrix, alpha ){
    var c = Math.cos( alpha );
    var s = Math.sin( alpha ); 
    var rot = [ [ 1,  0,  0, 0 ],
		[ 0,  c, -s, 0 ],
		[ 0,  s,  c, 0 ], 
		[ 0,  0,  0, 1 ]
	      ];

    return matrix4Product( rot, matrix );
};



/* redraw variables */

var boxFaceTextures=[];

var redraw=function(){
    var projectionMatrix=glMatrix4FromMatrix( createProjectionMatrix4(gl,
								      PROJECTION_Z_NEAR, 
								      PROJECTION_Z_FAR,
								      PROJECTION_ZOOM_Y )
					    );
    var rotationMatrix=glMatrix4FromMatrix( rotationMatrix4 ); //tmp

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST); //

    gl.clearStencil(0);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT );

    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE );

    gl.stencilMask(255); // enable modification of stencil buffer

    gl.stencilFunc(gl.ALWAYS, 1, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    xPlusArrayBuffer); 
    gl.stencilFunc(gl.ALWAYS, 2, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    xMinusArrayBuffer); 

    gl.stencilFunc(gl.ALWAYS, 3, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    yPlusArrayBuffer); 
    gl.stencilFunc(gl.ALWAYS, 4, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    yMinusArrayBuffer); 

    gl.stencilFunc(gl.ALWAYS, 5, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    zPlusArrayBuffer); 
    gl.stencilFunc(gl.ALWAYS, 6, 255); 
    drawBufferFace( gl, rotationMatrix, moveVector, projectionMatrix, 
		    zMinusArrayBuffer); 

    gl.stencilMask(0); // disable modification of stencil buffer
    gl.disable(gl.DEPTH_TEST);

    gl.stencilFunc(gl.EQUAL, 1, 255); 
    drawTexture( gl, zPlusArrayBuffer,  boxFaceTextures[0] , 1 ); 
    gl.stencilFunc(gl.EQUAL, 2, 255); 
    drawTexture( gl, zMinusArrayBuffer,  boxFaceTextures[1] , 2 ); 

    gl.stencilFunc(gl.EQUAL, 3, 255); 
    drawTexture( gl, zPlusArrayBuffer,  boxFaceTextures[2] , 3 ); 
    gl.stencilFunc(gl.EQUAL, 4, 255); 
    drawTexture( gl, zMinusArrayBuffer,  boxFaceTextures[3] , 4 ); 

    gl.stencilFunc(gl.EQUAL, 5, 255); 
    drawTexture( gl, zPlusArrayBuffer,  boxFaceTextures[4] , 5 ); 
    gl.stencilFunc(gl.EQUAL, 6, 255); 
    drawTexture( gl, zMinusArrayBuffer,  boxFaceTextures[5] , 6 ); 

    gl.enable(gl.DEPTH_TEST);

}

onWindowResize = function () {
    var wth = parseInt(window.innerWidth)-10;
    var hth = parseInt(window.innerHeight)-10;
    canvasGL.setAttribute("width", ''+wth);
    canvasGL.setAttribute("height", ''+hth);
    gl.viewportWidth = wth;
    gl.viewportHeight = hth;
    gl.viewport(0,0,wth,hth);
    redraw();
};




function onKeyDown(e){
    // var code=e.keyCode? e.keyCode : e.charCode;
    var code= e.which || e.keyCode;
    var alpha= Math.PI/32;
    var moveStep= 1/8;
    switch(code)
    {
    case 38: // up
	rotationMatrix4=matrix4RotatedYZ(rotationMatrix4, alpha );
	break;
    case 73: // I
	moveVector[1]+=moveStep;
	break;
    case 40: // down
	rotationMatrix4=matrix4RotatedYZ(rotationMatrix4, -alpha );
	break;
    case 75: // K
	moveVector[1]-=moveStep;
	break;
    case 37: // left
	rotationMatrix4=matrix4RotatedXZ(rotationMatrix4, -alpha );
	break;
    case 74:// J
	moveVector[0]-=moveStep;
	break;
    case 39:// right
	rotationMatrix4=matrix4RotatedXZ(rotationMatrix4, alpha );
	break;
    case 76: // L
	moveVector[0]+=moveStep;
	break;
    case 70: // F
	moveVector[2]++;
	break;
    case 66: // B
    case 86: // V
	moveVector[2]--;
	break;
    case 32: // space
	rotationMatrix4= identityMatrix4;
	break;
	/*
	  case 77: // M
	  case 82: // R
	  case 81: // Q
	  case 69: // E
	  case 191: // ?
	  case 68: // D
	  case 13: // enter
	  case 187: // +
	  case 27: // escape
	  case 189: // -
	  case 86: // V
	  case 46: // Delete
	  case 51: // #
	  case 83: // S
	  case 65: // A
	  case 56: // *
	  case 88: // X
	  case 74: // J
	  break;
	*/
    }
    redraw();
}




window.onload= function(){
    html={};
    html.canvasGL=document.querySelector('#canvasGL');
    html.canvasTex=document.querySelector('#canvasTex');
    gl = canvasGL.getContext("webgl", { stencil: true }); ///

    html.img=[
	document.querySelector('#xPlus'),
	document.querySelector('#xMinus'),
	document.querySelector('#yPlus'),
	document.querySelector('#yMinus'),
	document.querySelector('#zPlus'),
	document.querySelector('#zMinus'),
    ];


    shaderProgram=makeShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    texShaderProgram=makeShaderProgram(gl, texVertexShaderSrc, texFragmentShaderSrc);
    
    // gl.useProgram(shaderProgram);

    /* set vertex attributes locations */
    aPositionLocation=gl.getAttribLocation(shaderProgram, "aPosition");

    aTexPositionLocation=gl.getAttribLocation(texShaderProgram, "aPosition");
    aTexCoordsLocation=gl.getAttribLocation(texShaderProgram, "aTexCoords");

    /* set uniform variables locations */
    projectionLocation=gl.getUniformLocation(shaderProgram, "projection");
    rotationLocation=gl.getUniformLocation(shaderProgram, "rotation");
    moveLocation=gl.getUniformLocation(shaderProgram, "move");

    tex2DLocation=gl.getUniformLocation(texShaderProgram, "tex2D");

    /* load  data buffers */
    zMinusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, zMinusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, zMinusFloat32Array , gl.STATIC_DRAW );

    zPlusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, zPlusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, zPlusFloat32Array , gl.STATIC_DRAW );

    xMinusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, xMinusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, xMinusFloat32Array , gl.STATIC_DRAW );

    xPlusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, xPlusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, xPlusFloat32Array , gl.STATIC_DRAW );

    yMinusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, yMinusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, yMinusFloat32Array , gl.STATIC_DRAW );

    yPlusArrayBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, yPlusArrayBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, yPlusFloat32Array , gl.STATIC_DRAW );

    boxFaceTextures=[];
    for(var step=0; step<6; step++ ){
	boxFaceTextures.push( createTexture2D(gl) );
	loadTexture2DFromImg(gl, html.img[step], boxFaceTextures[boxFaceTextures.length-1]);
    }

    onWindowResize();
    window.onresize= onWindowResize;
    window.onkeydown= onKeyDown;
}

