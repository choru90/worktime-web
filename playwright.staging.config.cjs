const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname+'/staging-smoke',testMatch:'*.spec.cjs',timeout:45000,retries:0,workers:1,forbidOnly:true,
 reporter:[['list'],['json',{outputFile:__dirname+'/staging-smoke-results/results.json'}],['junit',{outputFile:__dirname+'/staging-smoke-results/junit.xml'}],['html',{outputFolder:__dirname+'/staging-smoke-results/html',open:'never'}]],
 outputDir:__dirname+'/staging-smoke-results/artifacts',
 use:{baseURL:'https://dev.work-time.co.kr',headless:true,trace:'retain-on-failure',screenshot:'on',timezoneId:'Asia/Seoul'},
 projects:[
  {name:'desktop-chromium',testMatch:'public.spec.cjs',use:{...devices['Desktop Chrome']}},
  {name:'desktop-firefox',testMatch:'public.spec.cjs',use:{...devices['Desktop Firefox'],launchOptions:{firefoxUserPrefs:{'security.enterprise_roots.enabled':true}}}},
  {name:'desktop-webkit',testMatch:'public.spec.cjs',use:{...devices['Desktop Safari']}},
  {name:'mobile-chromium',testMatch:'public.spec.cjs',use:{...devices['Pixel 7']}},
  {name:'api-protocol',testMatch:'api.spec.cjs'}
 ]
});
