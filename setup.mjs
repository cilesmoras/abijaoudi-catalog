#!/usr/bin/env node
// Run this once: node setup.mjs
import { mkdirSync } from "fs";

const dirs = [
  "lib",
  "components/ui",
  "components/catalog",
  "components/admin",
  "app/api/categories/[id]",
  "app/api/items/[id]",
  "app/api/upload",
  "app/admin/items/new",
  "app/admin/items/[id]/edit",
  "app/admin/categories",
];

dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));
console.log("✅ Directories created. Now run: npm install");
