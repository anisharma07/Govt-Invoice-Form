import React, { useState } from "react";
import {
  IonAlert,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
} from "@ionic/react";
import {
  chevronForward,
  chevronUp,
  chevronDown,
  layers,
  settings,
} from "ionicons/icons";
import Files from "../components/Files/Files";
import { useTheme } from "../contexts/ThemeContext";
import { useInvoice } from "../contexts/InvoiceContext";
import { DATA } from "../templates";
import { tempMeta } from "../templates-meta";
import * as AppGeneral from "../components/socialcalc/index";
import "./FilesPage.css";
import { useHistory } from "react-router-dom";
import { File } from "../components/Storage/LocalStorage";
import { TemplateInitializer } from "../utils/templateInitializer";

const FilesPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const {
    selectedFile,
    billType,
    store,
    updateSelectedFile,
    updateBillType,
  } = useInvoice();
  const history = useHistory();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showFileNamePrompt, setShowFileNamePrompt] = useState(false);
  const [selectedTemplateForFile, setSelectedTemplateForFile] = useState<number | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const [device] = useState(AppGeneral.getDeviceType());

  // Template helper functions
  const getAvailableTemplates = () => {
    return TemplateInitializer.getAllTemplates();
  };

  const getTemplateInfo = (templateId: number) => {
    const template = TemplateInitializer.getTemplate(templateId);
    return template ? template.template : `Template ${templateId}`;
  };

  const getTemplateMetadata = (templateId: number) => {
    return tempMeta.find(meta => meta.template_id === templateId);
  };

  const handleTemplateSelect = (templateId: number) => {
    setSelectedTemplateForFile(templateId);
    setShowFileNamePrompt(true);
  };

  // Create new file with template
  const createNewFileWithTemplate = async (templateId: number, fileName: string) => {
    try {
      const metadata = TemplateInitializer.getTemplateMetadata(templateId);
      if (!metadata) {
        setToastMessage("Template not found");
        setShowToast(true);
        return;
      }

      const mscContent = TemplateInitializer.createMSCContent(templateId);
      if (!mscContent) {
        setToastMessage("Error creating template content");
        setShowToast(true);
        return;
      }

      const now = new Date().toISOString();
      const newFile = new File(
        now,
        now,
        encodeURIComponent(mscContent), // mscContent is already a JSON string
        fileName,
        templateId,
        metadata,
        false
      );

      await store._saveFile(newFile);
      
      setToastMessage(`File "${fileName}" created with ${metadata.template}`);
      setShowToast(true);
      
      // Reset modal state
      setShowFileNamePrompt(false);
      setSelectedTemplateForFile(null);
      setNewFileName("");

      // Navigate to editor with the new file using the new URL structure
      updateSelectedFile(fileName);
      updateBillType(templateId);
      
      // Don't initialize SocialCalc here - let the Home page handle initialization
      // when it loads with the selected file
      
      history.push(`/app/editor/${encodeURIComponent(fileName)}`);
    } catch (error) {
      console.error("Error creating file:", error);
      setToastMessage("Failed to create file");
      setShowToast(true);
    }
  };

  const handleNewFileClick = async () => {
    // Directly show the template selection modal
    // No need to check for unsaved changes since we removed the default file
    setShowAllTemplates(false);
  };
  const handleNewMedClick = async () => {
    // Directly show the template selection modal  
    // No need to check for unsaved changes since we removed the default file
    setShowAllTemplates(false);
  };

  // Removed createNewFile and createNewMed functions since they handled default file logic
  // Now we only use createNewFileWithTemplate for creating files with specific templates

  return (
    <IonPage className={isDarkMode ? "dark-theme" : ""}>
      <IonHeader className="files-modal-header">
        <IonToolbar style={{ minHeight: "56px", "--min-height": "56px" }}>
          <IonTitle
            className="files-modal-title"
            style={{
              fontSize: "18px",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            🧾 Invoice App
          </IonTitle>
          <IonButtons slot="end">
            <IonButton 
              fill="clear" 
              onClick={() => history.push("/app/settings")}
              style={{ fontSize: "1.2em" }}
            >
              <IonIcon icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {/* Template Creation Section with Template Cards */}
        <div style={{ padding: "16px" }}>
          <h2 style={{ 
            margin: "0 0 16px 0", 
            fontSize: "20px", 
            fontWeight: "600",
            color: "var(--ion-color-dark)",
            textAlign: "center"
          }}>
            Create New File
          </h2>
          
          {/* Template Cards - Show first 3, then expand button if more */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "16px",
            marginBottom: "16px",
            maxWidth: "900px",
            margin: "0 auto"
          }}>
            {getAvailableTemplates()
              .slice(0, showAllTemplates ? undefined : 3)
              .map((template) => {
                const metadata = getTemplateMetadata(template.templateId);
                return (
                  <div
                    key={template.templateId}
                    onClick={() => handleTemplateSelect(template.templateId)}
                    style={{
                      border: "2px solid var(--ion-color-light)",
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backgroundColor: "var(--ion-color-light-tint)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--ion-color-primary)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--ion-color-light)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Template Image */}
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "var(--ion-color-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px solid var(--ion-color-medium-tint)"
                    }}>
                      {metadata?.ImageUri ? (
                        <img
                          src={`data:image/png;base64,${metadata.ImageUri}`}
                          alt={metadata.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      ) : (
                        <IonIcon 
                          icon={layers} 
                          style={{ fontSize: "32px", color: "var(--ion-color-medium)" }}
                        />
                      )}
                    </div>
                    
                    {/* Template Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: "18px", 
                        fontWeight: "600",
                        color: "var(--ion-color-dark)"
                      }}>
                        {metadata?.name || template.template}
                      </h3>
                      <p style={{ 
                        margin: "0", 
                        fontSize: "14px", 
                        color: "var(--ion-color-medium)"
                      }}>
                        {template.footers.length} footer(s)
                      </p>
                    </div>
                    
                    {/* Arrow Icon */}
                    <IonIcon 
                      icon={chevronForward} 
                      style={{ 
                        fontSize: "20px", 
                        color: "var(--ion-color-medium)",
                        opacity: 0.7
                      }}
                    />
                  </div>
                );
              })}
          </div>

          {/* Show More Templates Button */}
          {getAvailableTemplates().length > 3 && (
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <IonButton
                fill="outline"
                size="default"
                onClick={() => setShowAllTemplates(!showAllTemplates)}
                style={{ margin: "0 auto" }}
              >
                <IonIcon 
                  icon={showAllTemplates ? chevronUp : chevronDown} 
                  slot="start" 
                />
                {showAllTemplates ? 'Show Less' : `View ${getAvailableTemplates().length - 3} More Templates`}
              </IonButton>
            </div>
          )}
        </div>
        <Files
          store={store}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          updateBillType={updateBillType}
        />
      </IonContent>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastMessage.includes("successfully") ? "success" : "warning"}
        position="top"
      />

      {/* File Name Prompt Alert */}
      <IonAlert
        animated
        isOpen={showFileNamePrompt}
        onDidDismiss={() => {
          setShowFileNamePrompt(false);
          setSelectedTemplateForFile(null);
          setNewFileName("");
        }}
        header="Create New File"
        message={
          selectedTemplateForFile && getTemplateMetadata(selectedTemplateForFile) 
            ? `Create a new ${getTemplateMetadata(selectedTemplateForFile)?.name} file`
            : 'Create a new invoice file'
        }
        inputs={[
          {
            name: "filename",
            type: "text",
            value: newFileName,
            placeholder: "Enter file name",
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              setSelectedTemplateForFile(null);
              setNewFileName("");
            },
          },
          {
            text: "Create",
            handler: (data) => {
              const fileName = data.filename?.trim();
              if (fileName && selectedTemplateForFile) {
                createNewFileWithTemplate(selectedTemplateForFile, fileName);
              } else {
                setToastMessage("Please enter a file name");
                setShowToast(true);
              }
            },
          },
        ]}
      />
    </IonPage>
  );
};

export default FilesPage;
