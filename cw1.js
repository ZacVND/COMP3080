precision highp float;

struct PointLight {
  vec3 position;
  vec3 color;
};

struct Material {
  vec3  diffuse;
  vec3  specular;
  float glossiness;
  // Expand the material struct with the additional necessary information
  float refractiveness;
  float reflectiveness;
};

struct Sphere {
  vec3 position;
  float radius;
  Material material;
};

struct Plane {
  vec3 normal;
  float d;
  Material material;
};

struct Cylinder {
  vec3 position;
  vec3 direction;  
  float radius;
  Material material;
};

const int lightCount = 2;
const int sphereCount = 3;
const int planeCount = 1;
const int cylinderCount = 2;

struct Scene {
  vec3 ambient;
  PointLight[lightCount] lights;
  Sphere[sphereCount] spheres;
  Plane[planeCount] planes;
  Cylinder[cylinderCount] cylinders;
};

struct Ray {
  vec3 origin;
  vec3 direction;
};

// Contains all information pertaining to a ray/object intersection
struct HitInfo {
  bool hit;
  float t;
  vec3 position;
  vec3 normal;
  Material material;
};

HitInfo getEmptyHit() {
  return HitInfo(
    false, 
    0.0, 
    vec3(0.0), 
    vec3(0.0), 
    // Depending on the material definition extension you make, this constructor call might need to be extened as well
    Material(vec3(0.0), vec3(0.0), 0.0, 0.0, 0.0)
  );
}

// Sorts the two t values such that t1 is smaller than t2
void sortT(inout float t1, inout float t2) {
  // Make t1 the smaller t
  if(t2 < t1)  {
    float temp = t1;
    t1 = t2;
    t2 = temp;
  }
}

// Tests if t is in an interval
bool isTInInterval(const float t, const float tMin, const float tMax) {
  return t > tMin && t < tMax;
}

// Get the smallest t in an interval
bool getSmallestTInInterval(float t0, float t1, const float tMin, const float tMax, inout float smallestTInInterval) {
  
  sortT(t0, t1);
  
  // As t0 is smaller, test this first
  if(isTInInterval(t0, tMin, tMax)) {
    smallestTInInterval = t0;
    return true;
  }
  
  // If t0 was not in the interval, still t1 could be
  if(isTInInterval(t1, tMin, tMax)) {
    smallestTInInterval = t1;
    return true;
  }  
  
  // None was
  return false;
}

HitInfo intersectSphere(const Ray ray, const Sphere sphere, const float tMin, const float tMax) {
              
    vec3 to_sphere = ray.origin - sphere.position;
  
    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(ray.direction, to_sphere);
    float c = dot(to_sphere, to_sphere) - sphere.radius * sphere.radius;
    float D = b * b - 4.0 * a * c;
    if (D > 0.0)
    {
    float t0 = (-b - sqrt(D)) / (2.0 * a);
    float t1 = (-b + sqrt(D)) / (2.0 * a);
      
        float smallestTInInterval;
        if(!getSmallestTInInterval(t0, t1, tMin, tMax, smallestTInInterval)) {
          return getEmptyHit();
        }
      
        vec3 hitPosition = ray.origin + smallestTInInterval * ray.direction;      

        vec3 normal = 
            length(ray.origin - sphere.position) < sphere.radius + 0.001? 
            -normalize(hitPosition - sphere.position) : 
          normalize(hitPosition - sphere.position);      

        return HitInfo(
            true,
            smallestTInInterval,
            hitPosition,
            normal,
            sphere.material);
    }
    return getEmptyHit();
}

HitInfo intersectPlane(const Ray ray,const Plane plane, const float tMin, const float tMax) {
  // Put the code for plane intersection here
  float a = dot(ray.origin, plane.normal) + plane.d;
  float b = dot(ray.direction, plane.normal);
  float t = -(a/b);
  vec3 hitPosition = ray.origin + t*ray.direction;
  
  if(isTInInterval(t, tMin, tMax)) {
      return HitInfo(
            true,
            t,
            hitPosition,
            plane.normal,
            plane.material);
    }   
    return getEmptyHit();
 }

float lengthSquared(vec3 x) {
  return dot(x, x);
}

HitInfo intersectCylinder(const Ray ray, const Cylinder cylinder, const float tMin, const float tMax) {
  // Put the code for cylinder intersection here
  vec3 to_cylinder = ray.origin - cylinder.position;

  float a = dot(ray.direction, ray.direction) - dot(ray.direction, cylinder.direction) * dot(ray.direction, cylinder.direction);
  float b = 2.0 * (dot(ray.direction, to_cylinder) - dot(ray.direction, cylinder.direction) * dot(to_cylinder, cylinder.direction));
  float c = dot(to_cylinder, to_cylinder) - cylinder.radius * cylinder.radius - dot(to_cylinder, cylinder.direction) * dot(to_cylinder, cylinder.direction);
  float D = b * b - 4.0 * a * c;
  if (D > 0.0) {
    float t0 = (-b - sqrt(D)) / (2.0 * a);
    float t1 = (-b + sqrt(D)) / (2.0 * a);
      
    float smallestTInInterval;
    if(!getSmallestTInInterval(t0, t1, tMin, tMax, smallestTInInterval)) {
      return getEmptyHit();
    }
  
    vec3 hitPosition = ray.origin + smallestTInInterval * ray.direction;

    float m = dot(ray.direction, cylinder.direction) * smallestTInInterval + dot(to_cylinder, cylinder.direction);
    vec3 normal = normalize(hitPosition - cylinder.direction * m);    

    return HitInfo(
        true,
        smallestTInInterval,
        hitPosition,
        normal,
        cylinder.material);
  }
  return getEmptyHit();
}

HitInfo getBetterHitInfo(const HitInfo oldHitInfo, const HitInfo newHitInfo) {
  if(newHitInfo.hit)
      if(newHitInfo.t < oldHitInfo.t)  // No need to test for the interval, this has to be done per-primitive
          return newHitInfo;
    return oldHitInfo;
}

HitInfo intersectScene(const Scene scene, const Ray ray, const float tMin, const float tMax) {
  HitInfo bestHitInfo;
  bestHitInfo.t = tMax;
  bestHitInfo.hit = false;
  for (int i = 0; i < cylinderCount; ++i) {
    bestHitInfo = getBetterHitInfo(bestHitInfo, intersectCylinder(ray, scene.cylinders[i], tMin, tMax));
  }
  for (int i = 0; i < sphereCount; ++i) {
    bestHitInfo = getBetterHitInfo(bestHitInfo, intersectSphere(ray, scene.spheres[i], tMin, tMax));
  }
  for (int i = 0; i < planeCount; ++i) {
    bestHitInfo = getBetterHitInfo(bestHitInfo, intersectPlane(ray, scene.planes[i], tMin, tMax));
  }
  
  return bestHitInfo;
}

vec3 shadeFromLight(
  const Scene scene,
  const Ray ray,
  const HitInfo hit_info,
  const PointLight light)
{ 
  vec3 hitToLight = light.position - hit_info.position;
  
  vec3 lightDirection = normalize(hitToLight);
  vec3 viewDirection = normalize(hit_info.position - ray.origin);
  vec3 reflectedDirection = reflect(viewDirection, hit_info.normal);
  float diffuse_term = max(0.0, dot(lightDirection, hit_info.normal));
  float specular_term  = pow(max(0.0, dot(lightDirection, reflectedDirection)), hit_info.material.glossiness);
  // Put your shadow test here
  float visibility = 1.0;
  HitInfo hit = intersectScene(scene, Ray(hit_info.position, hitToLight), 0.01, 1.0);
  if (hit.hit) {                                                    // Check if ray from surface to light intersects anything
    visibility = 0.0;                                               // If yes then visibility is 0 -> shadow
  }
  else visibility = 1.0;
  return  visibility * 
        light.color * (
        specular_term * hit_info.material.specular +
          diffuse_term * hit_info.material.diffuse);
}

vec3 background(const Ray ray) {
  // A simple implicit sky that can be used for the background
  return vec3(0.2) + vec3(0.8, 0.6, 0.5) * max(0.0, ray.direction.y);
}

// It seems to be a WebGL issue that the third parameter needs to be inout instea dof const on Tobias' machine
vec3 shade(const Scene scene, const Ray ray, inout HitInfo hitInfo) {
  
    if(!hitInfo.hit) {
      return background(ray);
    }
  
    vec3 shading = scene.ambient * hitInfo.material.diffuse;
    for (int i = 0; i < lightCount; ++i) {
        shading += shadeFromLight(scene, ray, hitInfo, scene.lights[i]); 
    }
    return shading;
}


Ray getFragCoordRay(const vec2 frag_coord) {
    float sensorDistance = 1.0;
    vec2 sensorMin = vec2(-1, -0.5);
    vec2 sensorMax = vec2(1, 0.5);
    vec2 pixelSize = (sensorMax- sensorMin) / vec2(800, 400);
    vec3 origin = vec3(0, 0, sensorDistance);
    vec3 direction = normalize(vec3(sensorMin + pixelSize * frag_coord, -sensorDistance));  
  
    return Ray(origin, direction);
}

float fresnel(const vec3 viewDirection, const vec3 normal, const float outgoingRefractiveIndex, const float incomingRefractiveIndex) {
    // Put your code to compute the Fresnel effect here
  //Schlick's Approx
  float r0 = pow((outgoingRefractiveIndex - incomingRefractiveIndex) / (outgoingRefractiveIndex + incomingRefractiveIndex), 2.0);
  float r = r0 + (1.0 - r0) * pow((1.0 - abs(dot(viewDirection, normal))), 5.0);
  return r;
}

vec3 colorForFragment(const Scene scene, const vec2 fragCoord) {
      
    Ray initialRay = getFragCoordRay(fragCoord);  
    HitInfo initialHitInfo = intersectScene(scene, initialRay, 0.0001, 10000.0);  
    vec3 result = shade(scene, initialRay, initialHitInfo);
  
    Ray currentRay;
    HitInfo currentHitInfo;
    
    // Compute the reflection
    currentRay = initialRay;
    currentHitInfo = initialHitInfo;
    
    // The initial strength of the reflection
    float reflectionWeight = 1.0;
    
    const int maxReflectionStepCount = 2;
    for(int i = 0; i < maxReflectionStepCount; i++) {
      
      if(!currentHitInfo.hit) break;
      
      // Update this with the correct values
      reflectionWeight *= currentHitInfo.material.reflectiveness;
      
      Ray nextRay;
    // Put your code to compute the reflection ray here
      nextRay.origin = currentHitInfo.position;
      nextRay.direction = reflect(currentRay.direction, normalize(currentHitInfo.normal));
 
      currentRay = nextRay;
      
      currentHitInfo = intersectScene(scene, currentRay, 0.0001, 10000.0);      
            
      result += reflectionWeight * shade(scene, currentRay, currentHitInfo);
    }
  
    // Compute the refraction
    currentRay = initialRay;  
    currentHitInfo = initialHitInfo;
   
    // The initial medium is air
    float currentIOR = 1.0;

    // The initial strength of the refraction.
    float refractionWeight = 1.0;
  
    const int maxRefractionStepCount = 2;
    for(int i = 0; i < maxRefractionStepCount; i++) {
      
      if(!currentHitInfo.hit) break;

      // Update this with the correct values
      refractionWeight *= currentHitInfo.material.refractiveness;           

      Ray nextRay;
    // Put your code to compute the reflection ray

      nextRay.origin = currentHitInfo.position;
      nextRay.direction = refract(currentRay.direction, currentHitInfo.normal, currentHitInfo.material.refractiveness/currentIOR);
      currentRay = nextRay;
      currentHitInfo = intersectScene(scene, currentRay, 0.001, 10000.0);
      result += refractionWeight * shade(scene, currentRay, currentHitInfo);     
    }
  return result;
}

Material getDefaultMaterial() {
  // Will need to update this to match the new Material definition
  return Material(vec3(0.3), vec3(0.0), 1.0, 1.0, 1.0);
}

Material getPaperMaterial() {
  // Replace by your definition of a paper material
  return Material(vec3(2.0), vec3(0.0), 0.2, 0.0, 0.0);
}

Material getPlasticMaterial() {
  // Replace by your definition of a plastic material
  return Material(vec3(1.0, 1.0, 0.15), vec3(0.5), 2.0, 0.0, 0.2);
}

Material getGlassMaterial() {
  // Replace by your definition of a glass material
  return Material(vec3(0.0), vec3(3.0), 50.0, 0.85, 1.0);
}

Material getSteelMirrorMaterial() {
  // Replace by your definition of a steel mirror material
  return Material(vec3(0.0, 0.0, 0.0), vec3(0.4), 5.0, 0.0, 1.0);
}

vec3 tonemap(const vec3 radiance) {
  const float monitorGamma = 2.0;
  return pow(radiance, vec3(1.0 / monitorGamma));
}

void main()
{
    // Setup scene
    Scene scene;
    scene.ambient = vec3(0.12, 0.15, 0.2);
  
    // Lights
    scene.lights[0].position = vec3(5, 15, -5);
    scene.lights[0].color    = 0.5 * vec3(0.8, 0.6, 0.5);
    
    scene.lights[1].position = vec3(-15, 10, 2);
    scene.lights[1].color    = 0.5 * vec3(0.5, 0.7, 1.0);
  
    // Primitives
    scene.spheres[0].position             = vec3(8, -2, -13);
    scene.spheres[0].radius               = 4.0;
    scene.spheres[0].material         = getPaperMaterial();
    
    scene.spheres[1].position             = vec3(-7, -1, -13);
    scene.spheres[1].radius               = 4.0;
    scene.spheres[1].material       = getPlasticMaterial();
  
    scene.spheres[2].position             = vec3(0, 0.5, -5);
    scene.spheres[2].radius               = 2.0;
    scene.spheres[2].material         = getGlassMaterial();

    scene.planes[0].normal                = vec3(0, 1, 0);
    scene.planes[0].d                   = 4.5;
    scene.planes[0].material        = getSteelMirrorMaterial();
  
    scene.cylinders[0].position             = vec3(-1, 1, -18);
    scene.cylinders[0].direction            = normalize(vec3(-1, 2, -1));
    scene.cylinders[0].radius             = 1.5;
    scene.cylinders[0].material       = getPaperMaterial();
  
    scene.cylinders[1].position             = vec3(3, 1, -5);
    scene.cylinders[1].direction            = normalize(vec3(1, 4, 1));
    scene.cylinders[1].radius             = 0.25;
    scene.cylinders[1].material       = getPlasticMaterial();

  // compute color for fragment
  gl_FragColor.rgb = tonemap(colorForFragment(scene, gl_FragCoord.xy));
  gl_FragColor.a = 1.0;
}
