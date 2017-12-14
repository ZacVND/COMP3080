attribute vec2 coord;

varying vec3 fragColor;
varying vec2 fragCoord;

uniform float time;

mat4 computeProjectionMatrix(float fov, float aspect, float zNear, float zFar) { 
	float deltaZ = zFar - zNear;
	float cotangent = cos(fov * 0.5) / sin(fov * 0.5);
	
  	mat4 projectionMatrix;
  	projectionMatrix[0] = vec4(cotangent / aspect, 0.0, 0.0, 0.0);
	projectionMatrix[1] = vec4(0.0, cotangent, 0.0, 0.0);
	projectionMatrix[2] = vec4(0.0, 0.0, -(zFar + zNear) / deltaZ, -1.0);
	projectionMatrix[3] = vec4(0.0, 0.0, -2.0 * zNear * zFar / deltaZ, 0.0);
  
	return projectionMatrix;
}

// Used to generate a simple "look-at" camera. 
mat4 computeViewMatrix(vec3 VRP, vec3 TP, vec3 VUV) {		
  	// The VPN is pointing away from the TP. Can also be modeled the other way around.
  	vec3 VPN = VRP - TP;
  	// Generate the camera axes.
    vec3 n = normalize(VPN);
    vec3 u = normalize(cross(VUV, n));
    vec3 v = normalize(cross(n, u));
    
	mat4 modelViewMatrix;
	modelViewMatrix[0] = vec4(u[0], v[0], n[0], 0);
	modelViewMatrix[1] = vec4(u[1], v[1], n[1], 0);
	modelViewMatrix[2] = vec4(u[2], v[2], n[2], 0);
	modelViewMatrix[3] = vec4(- dot(VRP, u), - dot(VRP, v), - dot(VRP, n), 1);
  
  	return modelViewMatrix;
}

vec3 linearBezier1D(vec3 y0, vec3 y1, float coord) {  
  return mix(y0, y1, coord);
}

vec3 qudraticBezier1D(vec3 y0, vec3 y1, vec3 y2, float coord) {  
  return linearBezier1D(linearBezier1D(y0, y1, coord), linearBezier1D(y1, y2, coord), coord);
}

struct Patch2 {
  vec3 controlPoints[2 * 2];
};

struct Patch3 {
  vec3 controlPoints[3 * 3 ];
};

vec3 linearBezier2D(const vec2 coord, const Patch2 patch2) {   
  return 
    linearBezier1D(
    	linearBezier1D(patch2.controlPoints[0], patch2.controlPoints[1], coord.s),
  		linearBezier1D(patch2.controlPoints[2], patch2.controlPoints[3], coord.s),
      	coord.t);
}

vec3 qudraticBezier2D(const vec2 coord, const Patch3 patch3) {  
  return 
    qudraticBezier1D(
    	qudraticBezier1D(
      		patch3.controlPoints[0 * 3 + 0], 
      		patch3.controlPoints[0 * 3 + 1], 
      		patch3.controlPoints[0 * 3 + 2], coord.s),
  		qudraticBezier1D(
      		patch3.controlPoints[1 * 3 + 0], 
      		patch3.controlPoints[1 * 3 + 1], 
      		patch3.controlPoints[1 * 3 + 2], coord.s),
      	qudraticBezier1D(
      		patch3.controlPoints[2 * 3 + 0], 
      		patch3.controlPoints[2 * 3 + 1], 
      		patch3.controlPoints[2 * 3 + 2], coord.s),
      	coord.t);
}

vec3 spline(const vec2 coord) {  

  Patch2 patch2;
  patch2.controlPoints[0] = vec3(0.0, -1.0, 0.0);
  patch2.controlPoints[1] = vec3(1.0, 0.0, 0.0);
  patch2.controlPoints[2] = vec3(0.0, 1.0, 1.0);  
  patch2.controlPoints[3] = vec3(1.0, 0.0, 1.0);

  patch2.controlPoints[2 * 1 + 1].y = 2.0 * sin(1.0 * time);  
  patch2.controlPoints[2 * 0 + 0].y = 3.0 * cos(2.0 * time);
  
  //return linearBezier2D(coord, patch2);
  
  Patch3 patch3;
  patch3.controlPoints[3 * 0 + 0] = vec3(0.0, 0.0, 0.0);
  patch3.controlPoints[3 * 0 + 1] = vec3(0.5, 0.0, 0.0);
  patch3.controlPoints[3 * 0 + 2] = vec3(1.0, 0.0, 0.0);
  patch3.controlPoints[3 * 1 + 0] = vec3(0.0, 0.0, 0.5);
  patch3.controlPoints[3 * 1 + 1] = vec3(0.5, 4.0, 0.5);
  patch3.controlPoints[3 * 1 + 2] = vec3(1.0, 0.0, 0.5);
  patch3.controlPoints[3 * 2 + 0] = vec3(0.0, 0.0, 1.0);
  patch3.controlPoints[3 * 2 + 1] = vec3(0.5, 0.0, 1.0);
  patch3.controlPoints[3 * 2 + 2] = vec3(1.0, 0.0, 1.0);
  
  patch3.controlPoints[3 * 1 + 1].y = 2.0 * sin(1.0 * time);  
  patch3.controlPoints[3 * 0 + 0].y = 3.0 * cos(2.0 * time);
    
  return qudraticBezier2D(coord, patch3);
}

void main(void) {
  vec3 TP = vec3(0, 0, 0);
  vec3 VRP = 5.0 * vec3(sin(time), 0, cos(time)) + vec3(0, 3.0, 0);
  vec3 VUV = vec3(0, 1, 0); 
  mat4 viewMatrix = computeViewMatrix(VRP, TP, VUV); 
  
  mat4 projectionMatrix = computeProjectionMatrix(0.6, 2.0, 0.5, 200.0);  
  
  gl_Position = projectionMatrix * viewMatrix * vec4(vec3(3, 1, 3) * (spline(coord) - 0.5), 1.0);
  fragColor = coord.x * vec3(1, 0.5, 0.1) + coord.y * vec3(0.1, 0.5, 0.9);
  fragCoord = coord;
}