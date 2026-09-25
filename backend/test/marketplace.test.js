import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

// No local .env credentials or external database are used by this suite.
process.env.JWT_SECRET = "isolated-test-secret-with-at-least-32-characters";
process.env.NODE_ENV = "test";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.ADMIN_INVITE_CODE = "isolated-test-admin-invitation-32";
for (const name of ["GEMINI_API_KEY", "HF_TOKEN", "SMTP_HOST", "ELEVENLABS_API_KEY", "DNS_SERVERS"]) process.env[name] = "";
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/never-connect";
const { app } = await import("../src/app.js");
const { BusinessProfile, Category, Listing, Availability, Booking } = await import("../src/models/index.js");
const { AgentRun } = await import("../src/models/AgentRun.js");

test("Real HTTP marketplace and agent contracts on an isolated replica set", { timeout: 600000 }, async t => {
  const replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: "7.0.14" } });
  let server;
  try {
    await mongoose.connect(replica.getUri(), { dbName: "utlio_contract_test" });
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    server = await new Promise(resolve => { const instance = app.listen(0,"127.0.0.1",()=>resolve(instance)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function call(path, { cookie, method="GET", body, verify=true }={}) {
      const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",Origin:"http://localhost:3000",...(verify?{"X-Utlio-Request":"1"}:{}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const content=response.headers.get("content-type") || "";
      const data=content.includes("application/json")?await response.json():await response.text();
      return { status:response.status,data,cookie:response.headers.get("set-cookie")?.split(";")[0] };
    }
    async function account(name, role="business") {
      const result=await call("/auth/register",{method:"POST",body:{name,email:`${name}@test.invalid`,password:"TestPassword123!",role,mode:"seeker",city:"Mumbai",category:"venue",phone:"9999999999",...(role==="admin"?{inviteCode:process.env.ADMIN_INVITE_CODE}:{})}});
      assert.equal(result.status,200,JSON.stringify(result.data));
      return result;
    }
    const provider=await account("provider"), seeker=await account("seeker"), outsider=await account("outsider"), admin=await account("admin","admin");
    await BusinessProfile.updateMany({role:"business"},{$set:{verification:"verified"}});
    await Category.create({slug:"chairs",name:"Chairs",color:"#FFE66D",requiredFields:[]});
    const start=new Date(Date.now()+4*86400000).toISOString(), end=new Date(Date.now()+5*86400000).toISOString();
    const listingInput={title:"Contract chairs",description:"Stackable chairs for isolated contract tests",category:"chairs",quantity:3,capacity:1,price:10,unit:"day",minHours:1,deposit:0,delivery:false,deliveryFee:0,conditions:"Pickup",cancellationHours:24,city:"Mumbai",address:"Test location",coordinates:[72.8777,19.076],photos:[],attributes:{}};
    const created=await call("/listings",{cookie:provider.cookie,method:"POST",body:listingInput});
    assert.equal(created.status,200,JSON.stringify(created.data));
    const listing=created.data;
    let request, quote, booking;
    await t.test("Auth and role boundaries are enforced",async()=>{
      assert.equal((await call("/listings")).status,401);
      assert.equal((await call("/admin/agents",{cookie:seeker.cookie})).status,403);
      assert.equal((await call("/ai/studio",{cookie:admin.cookie})).status,403);
      assert.equal((await call("/search",{cookie:seeker.cookie,method:"POST",verify:false,body:{}})).status,403);
    });
    await t.test("Search input returns actual availability and rejects incomplete dates",async()=>{
      const response=await call("/search",{cookie:seeker.cookie,method:"POST",body:{category:"chairs",start,end,quantity:2}});
      assert.equal(response.status,200); assert.equal(response.data.items[0]._id,listing._id); assert.equal(response.data.items[0].availableQuantity,3);
      assert.equal((await call("/search",{cookie:seeker.cookie,method:"POST",body:{start}})).status,400);
    });
    await t.test("Owner availability blocks affect seeker search and can be removed",async()=>{
      const block=await call(`/listings/${listing._id}/availability`,{cookie:provider.cookie,method:"POST",body:{start,end,quantity:2,reason:"Maintenance"}});
      assert.equal(block.status,200);
      const response=await call("/search",{cookie:seeker.cookie,method:"POST",body:{category:"chairs",start,end,quantity:2}});
      assert.equal(response.data.total,0);
      assert.equal((await call(`/listings/${listing._id}/availability/${block.data._id}`,{cookie:provider.cookie,method:"DELETE"})).status,200);
    });
    await t.test("Request creation invites providers and returns connected quotes",async()=>{
      const response=await call("/requests",{cookie:seeker.cookie,method:"POST",body:{title:"Test event",items:[{category:"chairs",quantity:2,capacity:1,specs:"Stackable"}],city:"Mumbai",coordinates:listingInput.coordinates,radiusKm:25,start,end,budget:100,urgency:"routine",delivery:false}});
      assert.equal(response.status,200,JSON.stringify(response.data)); request=response.data.request; assert.equal(response.data.invited,1);
      const quotes=await call("/quotes",{cookie:provider.cookie});quote=quotes.data.find(row=>row.request._id===request._id);assert.ok(quote);
    });
    await t.test("Private threads reject nonparticipants",async()=>{
      assert.equal((await call(`/quotes/${quote._id}/messages`,{cookie:outsider.cookie})).status,404);
      assert.equal((await call(`/quotes/${quote._id}/messages`,{cookie:provider.cookie,method:"POST",body:{text:"Pickup is available."}})).status,200);
      const response=await call(`/quotes/${quote._id}/messages`,{cookie:seeker.cookie});assert.equal(response.data[0].text,"Pickup is available.");
    });
    await t.test("Offers enforce version and opposing-party acceptance",async()=>{
      const offer=await call(`/quotes/${quote._id}/offers`,{cookie:provider.cookie,method:"POST",body:{version:0,price:20,conditions:"Pickup"}});assert.equal(offer.status,200);
      assert.equal((await call(`/quotes/${quote._id}/accept`,{cookie:provider.cookie,method:"POST",body:{version:1}})).status,403);
      assert.equal((await call(`/quotes/${quote._id}/accept`,{cookie:seeker.cookie,method:"POST",body:{version:2}})).status,409);
      const accepted=await call(`/quotes/${quote._id}/accept`,{cookie:seeker.cookie,method:"POST",body:{version:1}});assert.equal(accepted.status,200,JSON.stringify(accepted.data));booking=accepted.data;
      assert.equal(await Availability.countDocuments({booking:booking._id}),1);
    });
    await t.test("Booking records, calendar, authorization and cancellation are connected",async()=>{
      const summary=await call(`/bookings/${booking._id}/summary`,{cookie:seeker.cookie});assert.equal(summary.data.booking.price,20);assert.equal(summary.data.offers.length,1);
      assert.match((await call(`/bookings/${booking._id}/calendar`,{cookie:seeker.cookie})).data,/BEGIN:VCALENDAR/);
      assert.equal((await call(`/bookings/${booking._id}/summary`,{cookie:outsider.cookie})).status,404);
      assert.equal((await call(`/bookings/${booking._id}/status`,{cookie:provider.cookie,method:"PATCH",body:{status:"in_progress"}})).status,409);
      assert.equal((await call(`/bookings/${booking._id}/status`,{cookie:seeker.cookie,method:"PATCH",body:{status:"cancelled",reason:"Changed date"}})).status,200);
      assert.equal(await Availability.countDocuments({booking:booking._id}),0);
    });
    await t.test("AI failure returns real deterministic evidence and private partial telemetry",async()=>{
      const response=await call("/ai/urgency",{cookie:seeker.cookie,method:"POST",body:{requestId:request._id}});
      assert.equal(response.status,200,JSON.stringify(response.data)); assert.equal(response.data.generation.status,"unavailable"); assert.equal(typeof response.data.score,"number"); assert.equal(response.data.decision,null);
      const own=await call("/ai/studio",{cookie:seeker.cookie}); assert.equal(own.status,200);assert.equal(own.data.recent[0].status,"partial");
      const other=await call("/ai/studio",{cookie:outsider.cookie});assert.equal(other.data.recent.length,0);
      assert.equal(JSON.stringify(own.data.recent).includes("Test event"),false);
      assert.ok(await AgentRun.countDocuments());
    });
    await t.test("Pricing, demand and admin briefs retain evidence without a model",async()=>{
      for(const [path,cookie,body] of [["/ai/smart-price",provider.cookie,{listingId:listing._id,category:"chairs"}],["/ai/forecast",provider.cookie,{city:"Mumbai"}],["/admin/agents/brief",admin.cookie,{}]]) {
        const response=await call(path,{cookie,method:"POST",body});assert.equal(response.status,200,`${path}: ${JSON.stringify(response.data)}`);assert.equal(response.data.generation.status,"unavailable");
      }
    });
    await t.test("Conductor persists reviewed plans, rejects foreign access and stale revisions",async()=>{
      const input={title:"Checked event",items:[{label:"Chair",category:"chairs",quantity:2,capacity:1,query:"",specs:"",attributes:{}}],filters:{city:"Mumbai",coordinates:listingInput.coordinates,radiusKm:25,start,end,budget:100,delivery:false},excludedProviders:[]};
      const response=await call("/ai/plans",{cookie:seeker.cookie,method:"POST",body:input});assert.equal(response.status,201,JSON.stringify(response.data));
      const plan=response.data;assert.equal(plan.result.feasible,true);
      assert.equal((await call(`/ai/plans/${plan._id}`,{cookie:outsider.cookie})).status,404);
      assert.equal((await call(`/ai/plans/${plan._id}/replan`,{cookie:seeker.cookie,method:"POST",body:{version:9,input}})).status,409);
      const approved=await call(`/ai/plans/${plan._id}/request`,{cookie:seeker.cookie,method:"POST",body:{version:1,packageId:plan.result.alternatives[0].id,acknowledged:true}});assert.equal(approved.status,200,JSON.stringify(approved.data));
      const repeat=await call(`/ai/plans/${plan._id}/request`,{cookie:seeker.cookie,method:"POST",body:{version:1,packageId:plan.result.alternatives[0].id,acknowledged:true}});assert.equal(repeat.data.alreadyCreated,true);
      assert.equal(await Booking.countDocuments({status:{$ne:"cancelled"}}),0);
    });
    await t.test("Saved searches and favorites persist actual user choices",async()=>{
      assert.equal((await call(`/favorites/${listing._id}`,{cookie:seeker.cookie,method:"POST"})).data.saved,true);
      assert.equal((await call("/favorites",{cookie:seeker.cookie})).data.length,1);
      const saved=await call("/saved-searches",{cookie:seeker.cookie,method:"POST",body:{name:"Chairs",filters:{category:"chairs"}}});assert.equal(saved.status,200);
      assert.equal((await call(`/saved-searches/${saved.data._id}`,{cookie:outsider.cookie,method:"DELETE"})).status,404);
      assert.equal((await call(`/saved-searches/${saved.data._id}`,{cookie:seeker.cookie,method:"DELETE"})).status,200);
    });
    await t.test("Every dashboard read endpoint returns data or a genuine empty result",async()=>{
      const paths=["/categories","/listings","/requests","/quotes","/bookings","/reviews","/disputes","/notifications","/analytics","/analytics/intelligence?city=NoSuchCity","/analytics/market-pulse","/analytics/provider-performance","/analytics/demand-heatmap","/analytics/supply-utilization","/analytics/liquidity","/analytics/geo-clusters","/analytics/revenue-trend","/analytics/bundle-coverage","/ai/plans"];
      for(const path of paths) { const result=await call(path,{cookie:seeker.cookie}); assert.equal(result.status,200,`${path}: ${JSON.stringify(result.data)}`); }
      for(const path of ["/admin/agents","/admin/verifications","/admin/reports","/admin/disputes","/admin/audit","/admin/integrations"]) assert.equal((await call(path,{cookie:admin.cookie})).status,200,path);
    });
    await t.test("Moderation holds cannot leak through search, favorites or resource detail",async()=>{
      await Listing.updateOne({_id:listing._id},{$set:{moderationHold:true}});
      assert.equal((await call(`/listings/${listing._id}`,{cookie:seeker.cookie})).status,404);
      assert.equal((await call("/favorites",{cookie:seeker.cookie})).data.length,0);
      assert.equal((await call(`/listings/${listing._id}`,{cookie:provider.cookie})).status,200);
    });
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    await mongoose.disconnect();
    await replica.stop();
  }
});
