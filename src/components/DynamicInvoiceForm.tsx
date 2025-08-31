import React, { useState, useEffect, useMemo } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonGrid,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonToast,
  IonItemDivider,
  IonTextarea,
  IonChip,
} from "@ionic/react";
import { close, save, trash, layers } from "ionicons/icons";
import { useInvoice } from "../contexts/InvoiceContext";
import {
  addInvoiceData,
  addDynamicInvoiceData,
  clearInvoiceData,
  clearDynamicInvoiceData,
} from "./socialcalc/modules/invoice.js";
import {
  DynamicFormManager,
  DynamicFormSection,
  DynamicFormField,
  ProcessedFormData,
} from "../utils/dynamicFormManager";
import "./InvoiceForm.css";

interface DynamicInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DynamicInvoiceForm: React.FC<DynamicInvoiceFormProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeTemplateData, currentSheetId } = useInvoice();
  const [formData, setFormData] = useState<ProcessedFormData>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");

  // Get current template data
  const currentTemplate = useMemo(() => {
    return activeTemplateData;
  }, [activeTemplateData]);

  // Get current sheet ID or fall back to template's current sheet
  const effectiveSheetId = useMemo(() => {
    return currentSheetId || currentTemplate?.msc?.currentid || "sheet1";
  }, [currentSheetId, currentTemplate]);

  // Generate form sections based on cellMappings and current sheet
  const formSections = useMemo(() => {
    if (!currentTemplate) return [];
    return DynamicFormManager.getFormSectionsForSheet(
      currentTemplate,
      effectiveSheetId
    );
  }, [currentTemplate, effectiveSheetId]);

  // Initialize form data when form sections change
  useEffect(() => {
    const initData = DynamicFormManager.initializeFormData(formSections);
    setFormData(initData);
  }, [formSections]);

  const showToastMessage = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleFieldChange = (
    sectionTitle: string,
    fieldLabel: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [sectionTitle]: {
        ...prev[sectionTitle],
        [fieldLabel]: value,
      },
    }));
  };

  const handleItemChange = (
    sectionTitle: string,
    itemIndex: number,
    fieldName: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [sectionTitle]: prev[sectionTitle].map((item: any, index: number) =>
        index === itemIndex ? { ...item, [fieldName]: value } : item
      ),
    }));
  };

  const handleSave = async () => {
    try {
      // Validate form data
      const validation = DynamicFormManager.validateFormData(
        formData,
        formSections
      );
      if (!validation.isValid) {
        showToastMessage(
          `Validation errors: ${validation.errors.join(", ")}`,
          "warning"
        );
        return;
      }

      // Convert form data to spreadsheet format
      const cellData = DynamicFormManager.convertToSpreadsheetFormat(
        formData,
        formSections,
        effectiveSheetId
      );

      console.log("Cell data to be saved:", cellData);
      console.log("Effective sheet ID:", effectiveSheetId);

      // Use the new addDynamicInvoiceData function that handles cell references
      await addDynamicInvoiceData(cellData, effectiveSheetId);
      showToastMessage("Invoice data saved successfully!", "success");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving invoice data:", error);
      setToastMessage("Failed to save invoice data. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleClear = async () => {
    try {
      // Get current cell data to know which cells to clear
      const cellData = DynamicFormManager.convertToSpreadsheetFormat(
        formData,
        formSections,
        effectiveSheetId
      );

      await clearDynamicInvoiceData(cellData);

      // Reset form data
      const initData = DynamicFormManager.initializeFormData(formSections);
      setFormData(initData);
      showToastMessage("Form data cleared successfully!", "success");
    } catch (error) {
      console.error("Error clearing form data:", error);
      showToastMessage("Failed to clear form data", "danger");
    }
  };

  const renderField = (field: DynamicFormField, sectionTitle: string) => {
    const value = formData[sectionTitle]?.[field.label] || "";

    switch (field.type) {
      case "textarea":
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonTextarea
              value={value}
              onIonInput={(e) =>
                handleFieldChange(sectionTitle, field.label, e.detail.value!)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={3}
            />
          </IonItem>
        );
      case "email":
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="email"
              value={value}
              onIonInput={(e) =>
                handleFieldChange(sectionTitle, field.label, e.detail.value!)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
      case "number":
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="number"
              value={value}
              onIonInput={(e) =>
                handleFieldChange(sectionTitle, field.label, e.detail.value!)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
      case "decimal":
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="number"
              step="0.01"
              value={value}
              onIonInput={(e) =>
                handleFieldChange(sectionTitle, field.label, e.detail.value!)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
      default:
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              value={value}
              onIonInput={(e) =>
                handleFieldChange(sectionTitle, field.label, e.detail.value!)
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
    }
  };

  const renderItemsSection = (section: DynamicFormSection) => {
    if (!section.itemsConfig || !formData[section.title]) return null;

    const items = formData[section.title] as any[];

    return (
      <IonCard key={section.title}>
        <IonCardHeader>
          <IonCardTitle>{section.title}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {items.map((item, index) => (
            <div key={index} className="item-group">
              <IonItemDivider>
                <IonLabel>Item {index + 1}</IonLabel>
              </IonItemDivider>
              {Object.entries(section.itemsConfig!.content).map(
                ([fieldName, cellColumn]) => (
                  <IonItem key={`${index}-${fieldName}`}>
                    <IonLabel position="stacked">{fieldName}</IonLabel>
                    <IonInput
                      type={
                        DynamicFormManager.getFieldType(fieldName) === "decimal"
                          ? "number"
                          : "text"
                      }
                      step={
                        DynamicFormManager.getFieldType(fieldName) === "decimal"
                          ? "0.01"
                          : undefined
                      }
                      value={item[fieldName] || ""}
                      onIonInput={(e) =>
                        handleItemChange(
                          section.title,
                          index,
                          fieldName,
                          e.detail.value!
                        )
                      }
                      placeholder={`Enter ${fieldName.toLowerCase()}`}
                    />
                  </IonItem>
                )
              )}
            </div>
          ))}
        </IonCardContent>
      </IonCard>
    );
  };

  const renderSection = (section: DynamicFormSection) => {
    if (section.isItems) {
      return renderItemsSection(section);
    }

    return (
      <IonCard key={section.title}>
        <IonCardHeader>
          <IonCardTitle>{section.title}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {section.fields.map((field) => renderField(field, section.title))}
          </IonList>
        </IonCardContent>
      </IonCard>
    );
  };

  if (!currentTemplate) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Dynamic Invoice Form</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>No template found for the current selection.</p>
          </div>
        </IonContent>
      </IonModal>
    );
  }

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={onClose}
        className="invoice-form-modal"
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Dynamic Invoice Form</IonTitle>
            <IonButtons slot="start">
              <IonChip>
                <IonIcon icon={layers} />
                <IonLabel>{currentTemplate.template}</IonLabel>
              </IonChip>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="invoice-form-content">
          {/* Sheet Information Display */}
          {effectiveSheetId && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Current Sheet: {effectiveSheetId}</IonCardTitle>
              </IonCardHeader>
            </IonCard>
          )}

          {/* Dynamic Form Sections */}
          <IonGrid>
            {formSections.map((section) => renderSection(section))}
          </IonGrid>

          {/* Action Buttons */}
          <div style={{ padding: "20px" }}>
            <IonButton
              expand="block"
              onClick={handleSave}
              color="primary"
              style={{ marginBottom: "10px" }}
            >
              <IonIcon icon={save} slot="start" />
              Save Invoice Data
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleClear}
              color="danger"
              fill="outline"
            >
              <IonIcon icon={trash} slot="start" />
              Clear All Data
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
      />
    </>
  );
};

export default DynamicInvoiceForm;
