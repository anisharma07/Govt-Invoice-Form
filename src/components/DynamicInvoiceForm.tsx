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
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonToast,
  IonItemDivider,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonChip,
} from "@ionic/react";
import { close, save, trash, layers } from "ionicons/icons";
import { TemplateData } from "../templates";
import { useInvoice } from "../contexts/InvoiceContext";
import {
  addInvoiceData,
  clearInvoiceData,
} from "./socialcalc/modules/invoice.js";
import { 
  DynamicFormManager, 
  DynamicFormSection, 
  DynamicFormField,
  ProcessedFormData 
} from "../utils/dynamicFormManager";
import "./InvoiceForm.css";

interface DynamicInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DynamicInvoiceForm: React.FC<DynamicInvoiceFormProps> = ({ isOpen, onClose }) => {
  const { activeTemplateData } = useInvoice();
  const [activeFooterIndex, setActiveFooterIndex] = useState<number>(1);
  const [formData, setFormData] = useState<ProcessedFormData>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Get current template data
  const currentTemplate = useMemo(() => {
    return activeTemplateData;
  }, [activeTemplateData]);

  // Get active footer based on activeFooterIndex
  const activeFooter = useMemo(() => {
    return currentTemplate?.footers.find(footer => footer.index === activeFooterIndex);
  }, [currentTemplate, activeFooterIndex]);

  // Generate form sections based on cellMappings and active footer
  const formSections = useMemo(() => {
    if (!currentTemplate) return [];
    return DynamicFormManager.getFormSectionsForFooter(currentTemplate, activeFooterIndex);
  }, [currentTemplate, activeFooterIndex]);

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

  const handleFieldChange = (sectionTitle: string, fieldLabel: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: {
        ...prev[sectionTitle],
        [fieldLabel]: value,
      }
    }));
  };

  const handleItemChange = (sectionTitle: string, itemIndex: number, fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [sectionTitle]: prev[sectionTitle].map((item: any, index: number) => 
        index === itemIndex ? { ...item, [fieldName]: value } : item
      )
    }));
  };

  const handleSave = async () => {
    try {
      // Validate form data
      const validation = DynamicFormManager.validateFormData(formData, formSections);
      if (!validation.isValid) {
        showToastMessage(`Validation errors: ${validation.errors.join(', ')}`, "warning");
        return;
      }

      // Convert form data to spreadsheet format
      const cellData = DynamicFormManager.convertToSpreadsheetFormat(formData, formSections, activeFooterIndex);
      
      // Create invoice data object
      const invoiceData = {
        templateId: activeTemplateData ? activeTemplateData.templateId : 1,
        footerIndex: activeFooterIndex,
        cellData,
        dynamicData: formData,
      };
      
      await addInvoiceData(invoiceData);
      showToastMessage("Invoice data saved successfully!", "success");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setToastMessage("Failed to save invoice data. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleClear = async () => {
    try {
      await clearInvoiceData();
      // Reset form data
      const initData = DynamicFormManager.initializeFormData(formSections);
      setFormData(initData);
      showToastMessage("Form data cleared successfully!", "success");
    } catch (error) {
      showToastMessage("Failed to clear form data", "danger");
    }
  };

  const renderField = (field: DynamicFormField, sectionTitle: string) => {
    const value = formData[sectionTitle]?.[field.label] || "";
    
    switch (field.type) {
      case 'textarea':
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonTextarea
              value={value}
              onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={3}
            />
          </IonItem>
        );
      case 'email':
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="email"
              value={value}
              onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
      case 'number':
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="number"
              value={value}
              onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </IonItem>
        );
      case 'decimal':
        return (
          <IonItem key={field.label}>
            <IonLabel position="stacked">{field.label}</IonLabel>
            <IonInput
              type="number"
              step="0.01"
              value={value}
              onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)}
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
              onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)}
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
              {Object.entries(section.itemsConfig!.content).map(([fieldName, cellColumn]) => (
                <IonItem key={`${index}-${fieldName}`}>
                  <IonLabel position="stacked">{fieldName}</IonLabel>
                  <IonInput
                    type={DynamicFormManager.getFieldType(fieldName) === 'decimal' ? 'number' : 'text'}
                    step={DynamicFormManager.getFieldType(fieldName) === 'decimal' ? '0.01' : undefined}
                    value={item[fieldName] || ""}
                    onIonInput={(e) => handleItemChange(section.title, index, fieldName, e.detail.value!)}
                    placeholder={`Enter ${fieldName.toLowerCase()}`}
                  />
                </IonItem>
              ))}
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
            {section.fields.map(field => renderField(field, section.title))}
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
          <div style={{ padding: '20px', textAlign: 'center' }}>
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
          {/* Footer Selection */}
          {currentTemplate.footers.length > 1 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Select Footer</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>Active Footer</IonLabel>
                  <IonSelect
                    value={activeFooterIndex}
                    onIonChange={(e) => setActiveFooterIndex(e.detail.value)}
                  >
                    {currentTemplate.footers.map(footer => (
                      <IonSelectOption key={footer.index} value={footer.index}>
                        {footer.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCardContent>
            </IonCard>
          )}

          {/* Dynamic Form Sections */}
          <IonGrid>
            {formSections.map(section => renderSection(section))}
          </IonGrid>

          {/* Action Buttons */}
          <div style={{ padding: '20px' }}>
            <IonButton
              expand="block"
              onClick={handleSave}
              color="primary"
              style={{ marginBottom: '10px' }}
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
