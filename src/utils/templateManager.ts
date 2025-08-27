import { TemplateData } from "../templates";
import { TemplateMetadata } from "../components/Storage/LocalStorage";

/**
 * Template Manager Utility
 * Handles multi-template operations and metadata management
 */
export class TemplateManager {
  /**
   * Extract template metadata from template data
   */
  static extractMetadata(templateData: TemplateData): TemplateMetadata {
    return {
      template: templateData.template,
      templateId: templateData.templateId,
      footers: templateData.footers,
      logoCell: templateData.logoCell,
      signatureCell: templateData.signatureCell,
      cellMappings: templateData.cellMappings,
    };
  }

  /**
   * Create a complete template metadata object with MSC content
   */
  static createTemplateWithMSC(
    templateData: TemplateData,
    mscContent: string
  ): {
    metadata: TemplateMetadata;
    mscContent: string;
  } {
    return {
      metadata: this.extractMetadata(templateData),
      mscContent,
    };
  }

  /**
   * Get template-specific storage key
   */
  static getTemplateStorageKey(templateId: number, baseName: string): string {
    return `template_${templateId}_${baseName}`;
  }

  /**
   * Parse template ID from storage key
   */
  static parseTemplateIdFromKey(storageKey: string): number | null {
    const match = storageKey.match(/^template_(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Validate template metadata
   */
  static validateMetadata(metadata: TemplateMetadata): boolean {
    return (
      typeof metadata.template === "string" &&
      typeof metadata.templateId === "number" &&
      Array.isArray(metadata.footers) &&
      metadata.footers.every(
        (footer) =>
          typeof footer.name === "string" &&
          typeof footer.index === "number" &&
          typeof footer.isActive === "boolean"
      )
    );
  }

  /**
   * Merge cell mappings from different sources
   */
  static mergeCellMappings(
    existing: TemplateMetadata["cellMappings"],
    newMappings: TemplateMetadata["cellMappings"]
  ): TemplateMetadata["cellMappings"] {
    const merged = { ...existing };

    for (const [headingName, cellMappings] of Object.entries(newMappings)) {
      if (merged[headingName]) {
        merged[headingName] = { ...merged[headingName], ...cellMappings };
      } else {
        merged[headingName] = { ...cellMappings };
      }
    }

    return merged;
  }

  /**
   * Filter files by template ID
   */
  static filterFilesByTemplate(
    files: Record<string, any>,
    templateId: number
  ): Record<string, any> {
    const filtered: Record<string, any> = {};

    for (const [fileName, fileData] of Object.entries(files)) {
      if (fileData.templateMetadata?.templateId === templateId) {
        filtered[fileName] = fileData;
      }
    }

    return filtered;
  }

  /**
   * Get unique template IDs from files
   */
  static getUniqueTemplateIds(files: Record<string, any>): number[] {
    const templateIds = new Set<number>();

    for (const fileData of Object.values(files)) {
      if (fileData.templateMetadata?.templateId) {
        templateIds.add(fileData.templateMetadata.templateId);
      }
    }

    return Array.from(templateIds).sort();
  }

  /**
   * Generate default cell mappings for a template
   */
  static generateDefaultCellMappings(
    templateId: number
  ): TemplateMetadata["cellMappings"] {
    // Default mappings based on footer index (0 = first footer, 1 = second footer, etc.)
    const defaultMappings: TemplateMetadata["cellMappings"] = {
      0: {
        "Company Name": "B8",
        "Street Address": "B9",
        City: "B10",
        Phone: "B11",
        Email: "B12",
        "Invoice Number": "B5",
        Date: "F4",
        "Due Date": "G4",
        "Customer Name": "B15",
        "Customer Company": "B16",
        "Customer Address": "B17",
        "Customer Phone": "B19",
        "Customer Email": "B20",
      },
      1: {
        "Company Name": "B8",
        "Street Address": "B9",
        City: "B10",
        Phone: "B11",
        Email: "B12",
        "Invoice Number": "B5",
        Date: "F4",
        "Due Date": "G4",
        "Customer Name": "B15",
        "Customer Company": "B16",
        "Customer Address": "B17",
        "Customer Phone": "B19",
        "Customer Email": "B20",
      },
    };

    return defaultMappings;
  }
}
