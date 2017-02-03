var vert_src = [
	"attribute vec2 aVertexPosition;",

	"attribute vec3 aVertexColor;",
	"varying vec3 vColor;",

	"void main() {",
		"vColor = aVertexColor;",
		"gl_Position = vec4(aVertexPosition, 0.0, 1.0);",
	"}"
].join('\n');
var frag_src = [
	"#ifdef GL_ES",
		"precision lowp float;",
	"#endif",
	
	"varying vec3 vColor;",

	"void main() {",
		"gl_FragColor = vec4(vColor, 1.0);",
	"}"
].join('\n');

function Renderer(canvas)
{
	var gl, program, vertexBuffer, colorBuffer;
	function setupWebGL()
	{
		gl = canvas.getContext("webgl");
		gl.viewport(0,0,canvas.width,canvas.height);
		gl.clearColor(0,0,0,1);
		
		var vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, vert_src); gl.compileShader(vs);

		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, frag_src); gl.compileShader(fs);

		program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		gl.useProgram(program);
		
		vertexBuffer = gl.createBuffer();
		colorBuffer = gl.createBuffer();
	}
	setupWebGL();
	
	canvas.addEventListener("webglcontextlost", function(evt) { evt.preventDefault(); }, false);
	canvas.addEventListener("webglcontextrestored", setupWebGL, false);

	var vertices, colors;
	
	this.clear = function()
	{
		vertices = [];
		colors = [];
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
	this.clear();
	
	var half_width = canvas.width/2;
	var half_height = canvas.height/2;
	this.drawRect = function(x, y, width, height, color)
	{				
		var left = x/half_width - 1;
		var top = y/half_height - 1;
		var right = left + width/half_width;
		var bottom = top + height/half_height;
		top *= -1;
		bottom *= -1;
		vertices.push(
			//top triangle
			left, top,
			right, top,
			right, bottom,
			//bottom triangle
			left, top,
			right, bottom,
			left, bottom
		);
		colors.push(
			color[0], color[1], color[2],
			color[0], color[1], color[2],
			color[0], color[1], color[2],
			
			color[0], color[1], color[2],
			color[0], color[1], color[2],
			color[0], color[1], color[2]
		);
	}
	
	this.drawSlant = function(x, y, width, height, top_color, bottom_color)
	{
		var left = x/half_width - 1;
		var top = y/half_height - 1;
		var right = left + width/half_width;
		var bottom = top + height/half_height;
		top *= -1;
		bottom *= -1;
		vertices.push(
			//top triangle
			left, top,
			right, top,
			right, bottom,
			//bottom triangle
			left, top,
			right, bottom,
			left, bottom
		);
		colors.push(
			top_color[0], top_color[1], top_color[2],
			top_color[0], top_color[1], top_color[2],
			top_color[0], top_color[1], top_color[2],
			
			bottom_color[0], bottom_color[1], bottom_color[2],
			bottom_color[0], bottom_color[1], bottom_color[2],
			bottom_color[0], bottom_color[1], bottom_color[2]
		);
	}
	
	this.paint = function()
	{	
		//vertices	
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

		program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
		gl.enableVertexAttribArray(program.aVertexPosition);
		gl.vertexAttribPointer(program.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
		
		// color
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
		
		program.aVertexColor = gl.getAttribLocation(program, "aVertexColor");
		gl.enableVertexAttribArray(program.aVertexColor);
		gl.vertexAttribPointer(program.aVertexColor, 3, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, vertices.length/2);
	}
}
