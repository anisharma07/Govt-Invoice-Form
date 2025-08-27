import { TemplateData } from "../templates";

export interface DynamicFormField {
  label: string;
  value: string;
  type: "text" | "email" | "number" | "decimal" | "textarea";
  cellMapping: string;
}

export interface DynamicFormSection {
  title: string;
  fields: DynamicFormField[];
  isItems?: boolean;
  itemsConfig?: {
    name: string;
    range: { start: number; end: number };
    content: { [key: string]: string };
  };
}

export interface ProcessedFormData {
  [sectionKey: string]: any;
}

/**
 * Utility class for managing dynamic form generation based on cell mappings
 */
export class DynamicFormManager {
  /**
   * Determines the field type based on the field label
   * @param label The field label
   * @returns The appropriate input type
   */
  static getFieldType(
    label: string
  ): "text" | "email" | "number" | "decimal" | "textarea" {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("email")) return "email";
    if (lowerLabel.includes("number") || lowerLabel.includes("#"))
      return "number";
    if (
      lowerLabel.includes("rate") ||
      lowerLabel.includes("amount") ||
      lowerLabel.includes("price") ||
      lowerLabel.includes("tax") ||
      lowerLabel.includes("hours") ||
      lowerLabel.includes("qty") ||
      lowerLabel.includes("quantity")
    )
      return "decimal";
    if (lowerLabel.includes("notes") || lowerLabel.includes("description"))
      return "textarea";
    return "text";
  }

  /**
   * Generates form sections from cell mappings
   * @param cellMappings The cell mappings object for a specific footer
   * @returns Array of form sections
   */
  static generateFormSections(cellMappings: any): DynamicFormSection[] {
    if (!cellMappings) return [];

    const sections: DynamicFormSection[] = [];

    Object.entries(cellMappings).forEach(([key, value]) => {
      if (key === "Items") {
        // Special handling for Items
        const itemsConfig = value as any;
        sections.push({
          title: itemsConfig.name || "Items",
          fields: [],
          isItems: true,
          itemsConfig: {
            name: itemsConfig.name || "Items",
            range: itemsConfig.Range || { start: 1, end: 10 },
            content: itemsConfig.Content || {},
          },
        });
      } else if (typeof value === "string") {
        // Simple field mapping
        sections.push({
          title: key,
          fields: [
            {
              label: key,
              value: "",
              type: this.getFieldType(key),
              cellMapping: value,
            },
          ],
        });
      } else if (typeof value === "object" && value !== null) {
        // Nested object - create a section with multiple fields
        const fields: DynamicFormField[] = [];

        const processObject = (obj: any, prefix: string = "") => {
          Object.entries(obj).forEach(([subKey, subValue]) => {
            if (typeof subValue === "string") {
              fields.push({
                label: prefix ? `${prefix} ${subKey}` : subKey,
                value: "",
                type: this.getFieldType(subKey),
                cellMapping: subValue,
              });
            } else if (typeof subValue === "object" && subValue !== null) {
              processObject(subValue, subKey);
            }
          });
        };

        processObject(value);

        if (fields.length > 0) {
          sections.push({
            title: key,
            fields,
          });
        }
      }
    });

    return sections;
  }

  /**
   * Initializes form data based on form sections
   * @param sections The form sections
   * @returns Initial form data object
   */
  static initializeFormData(sections: DynamicFormSection[]): ProcessedFormData {
    const formData: ProcessedFormData = {};

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        // Initialize items array
        const itemsArray: any[] = [];
        for (
          let i = section.itemsConfig.range.start;
          i <= section.itemsConfig.range.end;
          i++
        ) {
          const item: any = {};
          Object.keys(section.itemsConfig.content).forEach((contentKey) => {
            item[contentKey] = "";
          });
          itemsArray.push(item);
        }
        formData[section.title] = itemsArray;
      } else {
        // Initialize regular fields
        const sectionData: any = {};
        section.fields.forEach((field) => {
          sectionData[field.label] = "";
        });
        formData[section.title] = sectionData;
      }
    });

    return formData;
  }

  /**
   * Validates form data
   * @param formData The form data to validate
   * @param sections The form sections for reference
   * @returns Validation result with errors if any
   */
  static validateFormData(
    formData: ProcessedFormData,
    sections: DynamicFormSection[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    sections.forEach((section) => {
      if (section.isItems) {
        const items = formData[section.title] as any[];
        if (items && items.length > 0) {
          items.forEach((item, index) => {
            Object.entries(item).forEach(([key, value]) => {
              if (
                this.getFieldType(key) === "email" &&
                value &&
                !this.isValidEmail(value as string)
              ) {
                errors.push(
                  `Invalid email format in ${section.title} item ${
                    index + 1
                  }: ${key}`
                );
              }
            });
          });
        }
      } else {
        section.fields.forEach((field) => {
          const value = formData[section.title]?.[field.label];
          if (field.type === "email" && value && !this.isValidEmail(value)) {
            errors.push(`Invalid email format: ${field.label}`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates email format
   * @param email The email to validate
   * @returns Whether the email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Converts form data to spreadsheet format for cell mapping
   * @param formData The form data
   * @param sections The form sections
   * @param footerIndex The active footer index
   * @returns Object with cell references and values
   */
  static convertToSpreadsheetFormat(
    formData: ProcessedFormData,
    sections: DynamicFormSection[],
    footerIndex: number
  ): { [cellRef: string]: any } {
    const cellData: { [cellRef: string]: any } = {};

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        // Handle items with range-based cell mapping
        const items = formData[section.title] as any[];
        if (items && items.length > 0) {
          items.forEach((item, index) => {
            const rowNumber = section.itemsConfig!.range.start + index;
            Object.entries(section.itemsConfig!.content).forEach(
              ([fieldName, columnLetter]) => {
                const cellRef = `${columnLetter}${rowNumber}`;
                cellData[cellRef] = item[fieldName] || "";
              }
            );
          });
        }
      } else {
        // Handle regular fields
        section.fields.forEach((field) => {
          const value = formData[section.title]?.[field.label];
          if (value && field.cellMapping) {
            cellData[field.cellMapping] = value;
          }
        });
      }
    });

    return cellData;
  }

  /**
   * Gets the active footer from a template
   * @param template The template data
   * @returns The active footer or null
   */
  static getActiveFooter(template: TemplateData) {
    return (
      template.footers.find((footer) => footer.isActive) ||
      template.footers[0] ||
      null
    );
  }

  /**
   * Filters form sections based on footer index
   * @param template The template data
   * @param footerIndex The footer index to filter by
   * @returns Array of form sections for the specified footer
   */
  static getFormSectionsForFooter(
    template: TemplateData,
    footerIndex: number
  ): DynamicFormSection[] {
    const cellMappings = template.cellMappings[footerIndex];
    if (!cellMappings) return [];

    return this.generateFormSections(cellMappings);
  }
}
