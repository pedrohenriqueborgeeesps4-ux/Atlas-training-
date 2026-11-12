"use strict";
const CACHE="atlas-training-static-v11";
const ASSETS=["./","./index.html","./app.js","./atlas-enhancements.js","./atlas-analytics.js","./atlas-tools.js","./atlas-exercise-guide.js","./atlas-floating-rest.js","./atlas-floating-rest.css","./atlas-profile.js","./atlas-enhancements.css","./manifest.webmanifest","./icon.svg","./atlas-experience.js","./atlas-experience.css"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("atlas-training-static-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(!new URL(request.url).pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==="navigate"){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put("./index.html",copy)).catch(()=>{});}return response;}).catch(()=>caches.match("./index.html")));return;}
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}).catch(()=>caches.open(CACHE).then(cache=>cache.match(request,{ignoreSearch:true}))));
});
