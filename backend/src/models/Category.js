import { model } from "./helpers.js";

export const Category = model("Category", {
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  color: String,
  requiredFields: [
    {
      key: String,
      label: String,
      type: { type: String, enum: ["text", "number", "boolean"] },
    },
  ],
});
