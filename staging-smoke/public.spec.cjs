const {test,expect}=require('@playwright/test');
const origin='https://dev.work-time.co.kr';
test.beforeEach(async({context,page})=>{
 const blocked=[];const errors=[];
 await context.route('**/*',async route=>{
  const r=route.request();
  if(!['GET','HEAD'].includes(r.method())||new URL(r.url()).origin!==origin){blocked.push({method:r.method(),url:r.url()});await route.abort();return;}
  await route.continue();
 });
 page.on('pageerror',e=>errors.push(e.message));
 page.__evidence={blocked,errors};
});
test.afterEach(async({page},info)=>{
 await info.attach('read-only-requests-and-browser-errors',{body:JSON.stringify(page.__evidence,null,2),contentType:'application/json'});
 expect(page.__evidence.blocked,'No write or cross-origin request should be attempted').toEqual([]);
 expect(page.__evidence.errors,'No uncaught browser error').toEqual([]);
});
test('deployed login renders without horizontal overflow',async({page})=>{
 const response=await page.goto('/login');expect(response.status()).toBe(200);
 await expect(page.getByLabel('이메일')).toBeVisible();
 await expect(page.getByLabel('비밀번호')).toBeVisible();
 await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
for(const route of ['/dashboard','/workers','/schedule','/worklogs','/payroll']){
 test(`anonymous ${route} returns to login`,async({page})=>{
  await page.goto(route);await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('이메일')).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeVisible();
 });
}
test('empty required fields cannot submit a login request',async({page})=>{
 await page.goto('/login');
 await page.getByRole('button',{name:'로그인',exact:true}).click();
 expect(await page.getByLabel('이메일').evaluate(el=>el.validity.valueMissing)).toBe(true);
 await page.getByLabel('이메일').fill('readonly-synthetic@example.test');
 await page.getByRole('button',{name:'로그인',exact:true}).click();
 expect(await page.getByLabel('비밀번호').evaluate(el=>el.validity.valueMissing)).toBe(true);
 await expect(page).toHaveURL(/\/login$/);
});
