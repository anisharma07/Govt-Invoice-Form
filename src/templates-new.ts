export let APP_NAME = "Invoice Suite";

// Template Interface for better type safety
export interface TemplateData {
  template: string;
  templateId: number;
  msc: {
    numsheets: number;
    currentid: string;
    currentname: string;
    sheetArr: {
      [sheetName: string]: {
        sheetstr: {
          savestr: string;
        };
        name: string;
        hidden: string;
      };
    };
    EditableCells: {
      allow: boolean;
      cells: {
        [cellName: string]: boolean;
      };
    };
    Prompts: {
      [cellName: string]: [string, string, string, string];
    };
  };
  footers: {
    name: string;
    index: number;
    isActive: boolean;
  }[];
  logoCell: string | null;
  signatureCell: string | null;
  cellMappings: {
    [headingName: string]: {
      [cellName: string]: {
        heading: string;
        datatype: string;
      };
    };
  };
}

// Sample template metadata for demonstration
export const TEMPLATE_METADATA_SAMPLES: {
  [key: number]: Pick<
    TemplateData,
    "footers" | "logoCell" | "signatureCell" | "cellMappings"
  >;
} = {
  1: {
    footers: [
      { name: "Detail1", index: 1, isActive: false },
      { name: "Detail2", index: 2, isActive: false },
      { name: "Invoice", index: 3, isActive: true },
    ],
    logoCell: "F8",
    signatureCell: null,
    cellMappings: {
      "Company Information": {
        B8: { heading: "Company Name", datatype: "text" },
        B9: { heading: "Street Address", datatype: "text" },
        B10: { heading: "City, State, Zip", datatype: "text" },
        B11: { heading: "Phone", datatype: "text" },
        B12: { heading: "Email", datatype: "email" },
      },
      "Bill To": {
        B15: { heading: "Customer Name", datatype: "text" },
        B16: { heading: "Customer Company", datatype: "text" },
        B17: { heading: "Customer Address", datatype: "text" },
        B18: { heading: "Customer City, State, Zip", datatype: "text" },
        B19: { heading: "Customer Phone", datatype: "text" },
        B20: { heading: "Customer Email", datatype: "email" },
      },
      "Line Items": {
        B23: { heading: "Description", datatype: "text" },
        G23: { heading: "Amount", datatype: "decimal" },
      },
    },
  },
  2: {
    footers: [
      { name: "Invoice 1", index: 1, isActive: true },
      { name: "Invoice 2", index: 2, isActive: false },
    ],
    logoCell: null,
    signatureCell: null,
    cellMappings: {
      Header: {
        B2: { heading: "Invoice Title", datatype: "text" },
        B5: { heading: "Invoice Number", datatype: "text" },
        F4: { heading: "Date", datatype: "date" },
      },
      "Line Items": {
        C23: { heading: "Description", datatype: "text" },
        E23: { heading: "Quantity", datatype: "number" },
        F23: { heading: "Price", datatype: "decimal" },
      },
    },
  },
};

// Simplified template data structure
export let DATA: { [key: number]: TemplateData } = {
  1: {
    template: "Mobile Invoice 1",
    templateId: 1,
    msc: {
      numsheets: 3,
      currentid: "sheet3",
      currentname: "sheet6",
      sheetArr: {
        // Existing sheet data would go here - keeping original structure
        // For brevity, using a simplified version here
      },
      EditableCells: {
        allow: true,
        cells: {
          "sheet6!B2": true,
          "sheet6!F4": true,
          "sheet6!G4": true,
          // ... other editable cells
        },
      },
      Prompts: {
        "sheet6!B2": ["prompttext", "0", "1e10", "Invoice"],
        "sheet6!F4": ["prompttext", "0", "1e10", "Date"],
        "sheet6!G4": ["prompttext", "0", "1e10", "Date"],
        // ... other prompts
      },
    },
    ...TEMPLATE_METADATA_SAMPLES[1],
  },
  2: {
    template: "Mobile Invoice 2",
    templateId: 2,
    msc: {
      numsheets: 2,
      currentid: "sheet1",
      currentname: "inv1",
      sheetArr: {
        // Existing sheet data would go here
      },
      EditableCells: {
        allow: true,
        cells: {
          "inv1!B2": true,
          "inv1!C5": true,
          // ... other editable cells
        },
      },
      Prompts: {
        "inv1!B2": ["prompttext", "0", "1e10", "Invoice"],
        "inv1!C5": ["prompttext", "0", "1e10", "From"],
        // ... other prompts
      },
    },
    ...TEMPLATE_METADATA_SAMPLES[2],
  },
};

// Helper functions for template management
export const getTemplateMetadata = (templateId: number) => {
  const template = DATA[templateId];
  if (!template) return null;

  return {
    template: template.template,
    templateId: template.templateId,
    footers: template.footers,
    logoCell: template.logoCell,
    signatureCell: template.signatureCell,
    cellMappings: template.cellMappings,
  };
};

export const getAvailableTemplates = () => {
  return Object.keys(DATA).map((id) => ({
    id: parseInt(id),
    name: DATA[parseInt(id)].template,
  }));
};

export const getTemplateById = (templateId: number) => {
  return DATA[templateId] || null;
};
