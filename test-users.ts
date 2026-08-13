import { AdminService } from "./src/modules/admin/admin.service";

async function test() {
  try {
    const adminService = new AdminService();
    const users = await adminService.getUsers(1, 100);
    console.log("Success", users.data.length);
  } catch (error) {
    console.error("Exact Error:", error);
  }
}

test();
