import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";

@Controller("admin/users")
@UseGuards(AdminJwtGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  getAllUsers(@Query("search") search?: string, @Query("role") role?: string) {
    return this.adminUsersService.getAllUsers(search, role);
  }

  @Get(":id")
  getUserById(@Param("id") id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Patch(":id/suspend")
  suspendUser(@Param("id") id: string, @Body("reason") reason: string) {
    return this.adminUsersService.suspendUser(id, reason);
  }

  @Patch(":id/unsuspend")
  unsuspendUser(@Param("id") id: string) {
    return this.adminUsersService.unsuspendUser(id);
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string) {
    return this.adminUsersService.resetPassword(id);
  }
}
