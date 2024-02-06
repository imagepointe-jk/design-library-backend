import { z } from "zod";

export const designTypes = ["Screen Print", "Embroidery"] as const;
export const designTypeSchema = z.enum(designTypes);

const designStatuses = ["Published", "Draft"] as const;
const designStatusSchema = z.enum(designStatuses);

export const tempDesignSchema = z.object({
  Id: z.number(),
  Name: z.string().optional(),
  Description: z.string().optional(),
  DefaultBackgroundColor: z.string(),
  Subcategory1: z.string().optional(),
  Subcategory2: z.string().optional(),
  Subcategory3: z.string().optional(),
  Subcategory4: z.string().optional(),
  Subcategory5: z.string().optional(),
  DesignType: designTypeSchema,
  Tag1: z.string().optional(),
  Tag2: z.string().optional(),
  Tag3: z.string().optional(),
  Tag4: z.string().optional(),
  Tag5: z.string().optional(),
  Tag6: z.string().optional(),
  Tag7: z.string().optional(),
  Tag8: z.string().optional(),
  Tag9: z.string().optional(),
  Tag10: z.string().optional(),
  Tag11: z.string().optional(),
  Tag12: z.string().optional(),
  ImageURL: z.string().optional(),
  DropboxImagePath1: z.string().optional(),
  DropboxImagePath2: z.string().optional(),
  DropboxImagePath3: z.string().optional(),
  DropboxImagePath4: z.string().optional(),
  DropboxImagePath5: z.string().optional(),
  DropboxImagePath6: z.string().optional(),
  DropboxImagePath7: z.string().optional(),
  DesignNumber: z.string(),
  Featured: z.boolean(),
  Date: z.string().optional(),
  Status: designStatusSchema,
  Priority: z.number().optional(),
});

export const tempImageDataSchema = z.object({
  url: z.string(),
  hasTransparency: z.boolean(),
});

export const tempDesignWithImagesSchema = z.intersection(
  tempDesignSchema,
  z.object({ ImageData: z.array(tempImageDataSchema) })
);

export const tempCategorySchema = z.object({
  Name: z.string(),
  DesignType: z.string(),
});

export const tempSubcategorySchema = z.object({
  Name: z.string(),
  ParentCategory: z.string(),
  Hierarchy: z.string().regex(/^.+ > .+$/g),
});

export const tempDbSchema = z.object({
  Designs: z.array(tempDesignSchema),
  Tags: z.array(z.object({ Name: z.string() })),
  Categories: z.array(tempCategorySchema),
  Subcategories: z.array(tempSubcategorySchema),
  Colors: z.array(z.string()),
});

export const quoteRequestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.number(),
  designId: z.number(),
  union: z.string(),
  comments: z.string(),
  garmentColor: z.string(),
  designNumber: z.string(),
});

export type DesignType = z.infer<typeof designTypeSchema>;
export type TempDesign = z.infer<typeof tempDesignSchema>;
export type TempImageData = z.infer<typeof tempImageDataSchema>;
export type TempDesignWithImages = z.infer<typeof tempDesignWithImagesSchema>;
export type TempDb = z.infer<typeof tempDbSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
