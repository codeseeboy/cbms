"use server"

import { apiGet } from "../api"

export async function getDashboardData() {
  return apiGet("/api/dashboard")
}
