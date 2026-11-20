const {test,expect}=require('@playwright/test');
test('public health and unauthenticated API have expected status without Basic auth challenge',async({request},info)=>{
 const health=await request.get('/healthz');expect(health.status()).toBe(200);expect(await health.text()).toBe('ok');
 const response=await request.get('/api/workers/my');
 expect(response.status()).toBe(401);expect(response.headers()['www-authenticate']).toBeUndefined();
 await info.attach('read-only-api-evidence',{body:JSON.stringify({healthStatus:health.status(),profileStatus:response.status(),basicAuthChallenge:false}),contentType:'application/json'});
});
