import mongoose from "mongoose";
const { Schema } = mongoose;

export { Schema, mongoose };

export const ref = (name) => ({
  type: Schema.Types.ObjectId,
  ref: name,
  required: true,
});

export const point = {
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (v) =>
        v.length === 2 &&
        v.every(Number.isFinite) &&
        Math.abs(v[0]) <= 180 &&
        Math.abs(v[1]) <= 90,
      message: "Invalid longitude/latitude coordinates.",
    },
  },
};

export function model(name, fields, indexes = []) {
  const schema = new Schema(fields, { timestamps: true });
  schema.eachPath((path, field) => {
    if (field.instance !== "Number") return;
    field.validate(
      (value) => value == null || (Number.isFinite(value) && value >= 0),
      "Must be a finite nonnegative number.",
    );
    if (
      [
        "quantity",
        "capacity",
        "version",
        "revision",
        "sessionVersion",
        "itemIndex",
        "attempts",
        "score",
      ].includes(path)
    ) {
      field.validate(
        (value) => value == null || Number.isInteger(value),
        "Must be an integer.",
      );
    }
    if (
      [
        "quantity",
        "capacity",
        "price",
        "minHours",
        "radiusKm",
        "budget",
      ].includes(path)
    ) {
      field.validate(
        (value) => value == null || value > 0,
        "Must be greater than zero.",
      );
    }
  });
  if (fields.start && fields.end) {
    schema.path("end").validate(function (end) {
      return !this.start || !end || end > this.start;
    }, "End must be after start.");
  }
  indexes.forEach(([keys, options]) => schema.index(keys, options || {}));
  return mongoose.model(name, schema);
}
