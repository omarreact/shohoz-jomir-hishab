import {isSoleAdminFirebaseIdentity,soleAdminRoleFromClaims} from "./soleAdmin";
const owner={firebase:{sign_in_provider:"github.com",identities:{"github.com":["91119648"]}}};
describe("one GitHub administrator",()=>{
 it("grants full dashboard role to the immutable GitHub user ID",()=>{
  expect(isSoleAdminFirebaseIdentity(owner)).toBe(true);
  expect(soleAdminRoleFromClaims(owner)).toBe("Super Admin");
 });
 it.each([
  {role:"Super Admin",admin:true,email:"owner@example.com"},
  {firebase:{sign_in_provider:"password",identities:{"github.com":["91119648"]}},role:"Super Admin"},
  {firebase:{sign_in_provider:"github.com",identities:{"github.com":["91119649"]}},admin:true},
  {firebase:{sign_in_provider:"github.com",identities:{"github.com":[]}},role:"Admin"},
  {firebase:{sign_in_provider:"github.com",identities:{"github.com":["omarreact"]}}},
  {firebase:{sign_in_provider:"github.com"},role:"Super Admin"},
 ])("does not trust roles, linked-password sessions, names, or other GitHub IDs",claims=>{
  expect(soleAdminRoleFromClaims(claims)).toBe("User");
 });
});

 describe("owner Firebase account", () => {
  const uid = "408LTqriBAPIMIe37pXPVehfPIe2";
  it("recognizes the verified token subject with password sign-in", () => {
    expect(soleAdminRoleFromClaims({ sub: uid, firebase: { sign_in_provider: "password" } })).toBe("Super Admin");
  });
  it.each([
    { sub: "another-user" },
    { uid },
    { email: uid },
    { sub: `${uid}x` },
    {},
  ])("rejects other subjects and profile fields", claims => {
    expect(soleAdminRoleFromClaims(claims)).toBe("User");
  });
 });
