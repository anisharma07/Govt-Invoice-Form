import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Local } from "../components/Storage/LocalStorage";
import { TemplateData, DATA } from "../templates";

interface InvoiceContextType {
  selectedFile: string;
  billType: number;
  store: Local;
  activeTemplateData: TemplateData | null;
  updateSelectedFile: (fileName: string) => void;
  updateBillType: (type: number) => void;
  updateActiveTemplateData: (templateData: TemplateData | null) => void;
  resetToDefaults: () => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoice must be used within an InvoiceProvider");
  }
  return context;
};

interface InvoiceProviderProps {
  children: ReactNode;
}

export const InvoiceProvider: React.FC<InvoiceProviderProps> = ({
  children,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>("file_not_found");
  const [billType, setBillType] = useState<number>(1);
  const [activeTemplateData, setActiveTemplateData] = useState<TemplateData | null>(null);
  const [store] = useState(() => new Local());

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const savedFile = localStorage.getItem("stark-invoice-selected-file");
      const savedBillType = localStorage.getItem("stark-invoice-bill-type");
      const savedActiveTemplateId = localStorage.getItem("stark-invoice-active-template-id");

      if (savedFile) {
        setSelectedFile(savedFile);
      }

      if (savedBillType) {
        setBillType(parseInt(savedBillType, 10));
      }

      if (savedActiveTemplateId) {
        const templateId = parseInt(savedActiveTemplateId, 10);
        const templateData = DATA[templateId];
        if (templateData) {
          setActiveTemplateData(templateData);
        }
      }
    } catch (error) {
      // Failed to load invoice state from localStorage
    }
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("stark-invoice-selected-file", selectedFile);
    } catch (error) {
      // Failed to save selected file to localStorage
    }
  }, [selectedFile]);

  useEffect(() => {
    try {
      localStorage.setItem("stark-invoice-bill-type", billType.toString());
    } catch (error) {
      // Failed to save bill type to localStorage
    }
  }, [billType]);

  useEffect(() => {
    try {
      if (activeTemplateData) {
        localStorage.setItem("stark-invoice-active-template-id", activeTemplateData.templateId.toString());
      } else {
        localStorage.removeItem("stark-invoice-active-template-id");
      }
    } catch (error) {
      // Failed to save active template id to localStorage
    }
  }, [activeTemplateData]);

  const updateSelectedFile = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const updateBillType = (type: number) => {
    setBillType(type);
  };

  const updateActiveTemplateData = (templateData: TemplateData | null) => {
    setActiveTemplateData(templateData);
  };

  const resetToDefaults = () => {
    setSelectedFile("File_Not_found");
    setBillType(1);
    setActiveTemplateData(null);
  };

  const value: InvoiceContextType = {
    selectedFile,
    billType,
    store,
    activeTemplateData,
    updateSelectedFile,
    updateBillType,
    updateActiveTemplateData,
    resetToDefaults,
  };

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
};
