import { InferSelectModel } from "drizzle-orm";
import { mountainImages, mountains } from "./schema.js";

export type Mountain = InferSelectModel<typeof mountains>;
export type MountainImage = InferSelectModel<typeof mountainImages>;