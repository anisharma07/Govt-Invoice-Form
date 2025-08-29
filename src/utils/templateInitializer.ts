import { DATA, TemplateData } from "../templates";
import { TemplateManager } from "./templateManager";

/**
 * Template Initialization System
 * Handles the setup and migration to the new multi-template architecture
 */
export class TemplateInitializer {
  /**
   * Initialize the application with multi-template support
   */
  static async initializeApp(): Promise<void> {
    console.log("🚀 Initializing Multi-Template Architecture...");

    try {
      // Validate template data
      this.validateTemplateData();

      // Setup default template metadata
      this.setupDefaultMetadata();

      // Initialize template registry
      await this.initializeTemplateRegistry();

      console.log("✅ Multi-Template Architecture initialized successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize multi-template architecture:",
        error
      );
      throw error;
    }
  }

  /**
   * Validate template data structure
   */
  private static validateTemplateData(): void {
    console.log("🔍 Validating template data...");

    for (const [id, template] of Object.entries(DATA)) {
      if (!template.template || !template.templateId) {
        throw new Error(`Invalid template data for template ${id}`);
      }

      if (!template.msc || !template.msc.sheetArr) {
        throw new Error(`Missing MSC data for template ${id}`);
      }

      console.log(`✓ Template ${id}: ${template.template} - Valid`);
    }
  }

  /**
   * Setup default metadata for existing templates
   */
  private static setupDefaultMetadata(): void {
    console.log("⚙️ Setting up default metadata...");

    for (const [id, template] of Object.entries(DATA)) {
      // Ensure footers exist
      if (!template.footers || template.footers.length === 0) {
        template.footers = [
          { name: template.template, index: 1, isActive: true },
        ];
      }

      // Ensure cellMappings exist
      if (!template.cellMappings) {
        template.cellMappings = TemplateManager.generateDefaultCellMappings(
          template.templateId
        );
      }

      // Ensure logoCell and signatureCell exist
      if (template.logoCell === undefined) {
        template.logoCell = null;
      }
      if (template.signatureCell === undefined) {
        template.signatureCell = null;
      }

      console.log(`✓ Metadata setup complete for template ${id}`);
    }
  }

  /**
   * Initialize template registry in localStorage
   */
  private static async initializeTemplateRegistry(): Promise<void> {
    console.log("📝 Initializing template registry...");

    const registry = {
      version: "2.0.0",
      templates: Object.keys(DATA).map((id) => {
        const template = DATA[parseInt(id)];
        return {
          id: template.templateId,
          name: template.template,
          version: "1.0.0",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        };
      }),
      initialized: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("template_registry", JSON.stringify(registry));
        console.log("✓ Template registry saved to localStorage");
      }
    } catch (error) {
      console.warn(
        "⚠️ Could not save template registry to localStorage:",
        error
      );
    }
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: number): TemplateData | null {
    return DATA[templateId] || null;
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): TemplateData[] {
    return Object.values(DATA);
  }

  /**
   * Get template data
   */
  static getTemplateData(templateId: number): TemplateData | null {
    const template = this.getTemplate(templateId);
    return template || null;
  }

  /**
   * Create MSC content for a template
   */
  static createMSCContent(templateId: number): string | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    try {
      // Convert the MSC object to a string format
      return JSON.stringify(template.msc);
    } catch (error) {
      console.error(
        `Error creating MSC content for template ${templateId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if the app has been initialized with the new architecture
   */
  static async isInitialized(): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const registry = localStorage.getItem("template_registry");
        if (registry) {
          const parsed = JSON.parse(registry);
          return parsed.version === "2.0.0";
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Migration utility for existing files
   */
  static async migrateExistingFiles(): Promise<void> {
    console.log("🔄 Starting migration of existing files...");

    // This would be implemented to migrate existing files to the new structure
    // For now, we'll just log that it should be implemented
    console.log(
      "⚠️ File migration not yet implemented - manual migration required"
    );
  }

  /**
   * Reset the template system (for development/testing)
   */
  static async reset(): Promise<void> {
    console.log("🔄 Resetting template system...");

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("template_registry");
        console.log("✓ Template registry cleared");
      }
    } catch (error) {
      console.warn("⚠️ Could not clear template registry:", error);
    }
  }
}
