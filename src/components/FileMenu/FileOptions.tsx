import React, { useState, useRef, useEffect } from "react";
import {
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAlert,
  IonToast,
  IonInput,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonText,
} from "@ionic/react";
import {
  addOutline,
  arrowUndo,
  arrowRedo,
  ellipsisVertical,
  saveOutline,
  documentOutline,
  imageOutline,
  trashOutline,
  close,
  image,
  closeCircle,
  key,
  cameraOutline,
  createOutline,
  checkmark,
  logoBuffer,
  pencilOutline,
} from "ionicons/icons";
import * as AppGeneral from "../socialcalc/index.js";
import { File } from "../Storage/LocalStorage.js";
import { DATA } from "../../app-data.js";
import { useInvoice } from "../../contexts/InvoiceContext.js";
import { formatDateForFilename } from "../../utils/helper.js";
import { useTheme } from "../../contexts/ThemeContext.js";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  isQuotaExceededError,
  getQuotaExceededMessage,
} from "../../utils/helper.js";

interface FileOptionsProps {
  showActionsPopover: boolean;
  setShowActionsPopover: (show: boolean) => void;
}

const FileOptions: React.FC<FileOptionsProps> = ({
  showActionsPopover,
  setShowActionsPopover,
}) => {
  const { isDarkMode } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [showSaveAsAlert, setShowSaveAsAlert] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showLogoAlert, setShowLogoAlert] = useState(false);
  const [device] = useState(AppGeneral.getDeviceType());
  const actionsPopoverRef = useRef<HTMLIonPopoverElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo management state
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [savedLogos, setSavedLogos] = useState<
    Array<{ id: string; name: string; data: string }>
  >([]);

  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<
    Array<{ id: string; name: string; data: string }>
  >([]);

  const {
    selectedFile,
    store,
    billType,
    updateSelectedFile,
    updateBillType,
    resetToDefaults,
  } = useInvoice();

  // Load saved logos and signatures on component mount
  useEffect(() => {
    loadSavedLogos();
    loadSavedSignatures();
  }, []);

  // Local storage functions for logos
  const loadSavedLogos = () => {
    try {
      const stored = localStorage.getItem("userLogos");
      if (stored) {
        const logos = JSON.parse(stored);
        setSavedLogos(logos);
      }
    } catch (error) {
      console.error("Error loading saved logos:", error);
    }
  };

  // Logo management functions
  const handleAddLogo = () => {
    setShowActionsPopover(false);
    // Reload logos when opening the modal to get latest from localStorage
    loadSavedLogos();
    setShowLogoModal(true);
  };

  const handleSelectLogo = (logo: {
    id: string;
    name: string;
    data: string;
  }) => {
    const logoCoordinates = AppGeneral.getLogoCoordinates();
    AppGeneral.addLogo(logoCoordinates, logo.data);
    setToastMessage(`Logo applied successfully!`);
    setShowToast(true);
    setShowLogoModal(false);
  };

  // Local storage functions for signatures
  const loadSavedSignatures = () => {
    try {
      const stored = localStorage.getItem("userSignatures");
      if (stored) {
        const signatures = JSON.parse(stored);
        setSavedSignatures(signatures);
      }
    } catch (error) {
      console.error("Error loading saved signatures:", error);
    }
  };

  const handleUndo = () => {
    AppGeneral.undo();
    setShowActionsPopover(false);
  };

  const handleRedo = () => {
    AppGeneral.redo();
    setShowActionsPopover(false);
  };

  const _validateName = (filename: string) => {
    if (!filename.trim()) {
      setToastMessage("File name cannot be empty");
      setShowToast(true);
      return false;
    }
    return true;
  };

  const _checkForExistingFile = async (filename: string) => {
    try {
      const existingFile = await store._checkKey(filename);
      if (existingFile) {
        setToastMessage("File already exists. Please choose a different name.");
        setShowToast(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking for existing file:", error);
      return false;
    }
  };

  const doSaveAs = async (filename: string) => {
    try {
      if (_validateName(filename)) {
        // Check if file already exists
        const exists = await _checkForExistingFile(filename);
        if (exists) return;

        setToastMessage("Saving file...");
        setShowToast(true);

        const content = AppGeneral.getSpreadsheetContent();
        const now = new Date().toISOString();

        const file = new File(
          now,
          now,
          encodeURIComponent(content),
          filename,
          1
        );
        await store._saveFile(file);

        setToastMessage("File saved successfully!");
        setShowToast(true);
        updateSelectedFile(filename);
      }
    } catch (error) {
      console.error("Error saving file:", error);

      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("saving file"));
      } else {
        setToastMessage("Failed to save file. Please try again.");
      }
      setShowToast(true);
    }
  };

  const handleSaveAs = () => {
    setShowActionsPopover(false);
    setNewFileName("");
    setShowSaveAsAlert(true);
  };

  const doSave = async () => {
    try {
      setToastMessage("Saving...");
      setShowToast(true);

      const content = AppGeneral.getSpreadsheetContent();

      if (selectedFile === "default") {
        // Save as new file
        const now = new Date().toISOString();
        const filename = "Untitled-" + formatDateForFilename(new Date());
        const file = new File(
          now,
          now,
          encodeURIComponent(content),
          filename,
          1
        );
        await store._saveFile(file);
        updateSelectedFile(filename);
        setToastMessage("File saved as " + filename);
      } else {
        // Update existing file
        const existingFile = await store._getFile(selectedFile);
        const now = new Date().toISOString();
        const updatedFile = new File(
          existingFile.created,
          now,
          encodeURIComponent(content),
          selectedFile,
          existingFile.billType,
          existingFile.isEncrypted
        );
        await store._saveFile(updatedFile);
        setToastMessage("File saved successfully!");
      }
      setShowToast(true);
    } catch (error) {
      console.error("Error saving file:", error);

      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("saving file"));
      } else {
        setToastMessage("Failed to save file. Please try again.");
      }
      setShowToast(true);
    }
  };

  const handleSave = () => {
    setShowActionsPopover(false);
    doSave();
  };

  const handleNewFileClick = async () => {
    try {
      setShowActionsPopover(false);

      // Get the default file from storage
      const defaultExists = await store._checkKey("default");
      if (selectedFile === "default" && defaultExists) {
        const storedDefaultFile = await store._getFile("default");

        // Decode the stored content
        const storedContent = decodeURIComponent(storedDefaultFile.content);
        const msc = DATA["home"]["App"]["msc"];

        const hasUnsavedChanges = storedContent !== JSON.stringify(msc);

        if (hasUnsavedChanges) {
          // If there are unsaved changes, show confirmation alert
          setShowUnsavedChangesAlert(true);
          return;
        }
      }
      await createNewFile();
    } catch (error) {
      console.error("Error checking for unsaved changes:", error);
      // On error, proceed with normal flow
      setShowUnsavedChangesAlert(true);
    }
  };
  const createNewFile = async () => {
    try {
      // Reset to defaults first
      resetToDefaults();

      // Set selected file to "default"
      updateSelectedFile("default");

      const msc = DATA["home"]["App"]["msc"];

      // Load the template data into the spreadsheet
      AppGeneral.viewFile("default", JSON.stringify(msc));

      // Save the new template as the default file in storage
      const templateContent = encodeURIComponent(JSON.stringify(msc));
      const now = new Date().toISOString();
      const newDefaultFile = new File(now, now, templateContent, "default", 1);
      await store._saveFile(newDefaultFile);

      setToastMessage("New file created successfully");
      setShowToast(true);
    } catch (error) {
      console.error("Error creating new file:", error);

      // Check if the error is due to storage quota exceeded
      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("create"));
      } else {
        setToastMessage("Error creating new invoice");
      }
      setShowToast(true);
    }
  };
  const handleDiscardAndCreateNew = async () => {
    try {
      // User confirmed to discard changes, proceed with creating new file
      await createNewFile();
      setShowUnsavedChangesAlert(false);
    } catch (error) {
      console.error("Error discarding and creating new file:", error);
      setToastMessage("Error creating new invoice");
      setShowToast(true);
      setShowUnsavedChangesAlert(false);
    }
  };

  const handleAddImage = () => {
    setShowActionsPopover(false);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          // Get current selected cell
          const currentCell = getCurrentSelectedCell();
          if (currentCell) {
            AppGeneral.addLogo(currentCell, imageUrl);
            setToastMessage("Image added successfully!");
            setShowToast(true);
          } else {
            setToastMessage("Please select a cell first");
            setShowToast(true);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentSelectedCell = (): string | null => {
    // This would typically get the currently selected cell from the spreadsheet
    // For now, return a default cell
    return "A1";
  };

  const handleTakePhoto = async () => {
    setShowActionsPopover(false);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        const currentCell = getCurrentSelectedCell();
        if (currentCell) {
          AppGeneral.addLogo(currentCell, image.dataUrl);
          setToastMessage("Photo added successfully!");
          setShowToast(true);
        } else {
          setToastMessage("Please select a cell first");
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setToastMessage("Failed to take photo");
      setShowToast(true);
    }
  };

  const handleRemoveImage = () => {
    setShowActionsPopover(false);
    const currentCell = getCurrentSelectedCell();
    if (currentCell) {
      AppGeneral.removeLogo(currentCell);
      setToastMessage("Image removed successfully!");
      setShowToast(true);
    } else {
      setToastMessage("Please select a cell with an image first");
      setShowToast(true);
    }
  };

  const handleRemoveLogo = () => {
    setShowActionsPopover(false);
    const logoCoordinates = AppGeneral.getLogoCoordinates();
    AppGeneral.removeLogo(logoCoordinates);
    setToastMessage("Logo removed successfully!");
    setShowToast(true);
  };

  const handleRemoveSignature = () => {
    setShowActionsPopover(false);
    const signatureCoordinates = AppGeneral.getSignatureCoordinates();
    AppGeneral.removeLogo(signatureCoordinates);
    setToastMessage("Signature removed successfully!");
    setShowToast(true);
  };

  // Signature management functions
  const handleAddSignature = () => {
    setShowActionsPopover(false);
    // Reload signatures when opening the modal to get latest from localStorage
    loadSavedSignatures();
    setShowSignatureModal(true);
  };

  const handleSelectSignature = (signature: {
    id: string;
    name: string;
    data: string;
  }) => {
    const signatureCoordinates = AppGeneral.getSignatureCoordinates();
    AppGeneral.addLogo(signatureCoordinates, signature.data);
    setToastMessage(`Signature applied successfully!`);
    setShowToast(true);
    setShowSignatureModal(false);
  };

  return (
    <>
      {/* Actions Popover */}
      <IonPopover
        ref={actionsPopoverRef}
        isOpen={showActionsPopover}
        onDidDismiss={() => setShowActionsPopover(false)}
        trigger="actions-trigger"
        side="end"
        alignment="end"
      >
        <IonContent>
          <IonList>
            <IonItem button onClick={handleNewFileClick}>
              <IonIcon icon={addOutline} slot="start" />
              <IonLabel>New</IonLabel>
            </IonItem>

            <IonItem button onClick={handleSave}>
              <IonIcon icon={saveOutline} slot="start" />
              <IonLabel>Save</IonLabel>
            </IonItem>

            <IonItem button onClick={handleSaveAs}>
              <IonIcon icon={documentOutline} slot="start" />
              <IonLabel>Save As</IonLabel>
            </IonItem>

            <IonItem button onClick={handleUndo}>
              <IonIcon icon={arrowUndo} slot="start" />
              <IonLabel>Undo</IonLabel>
            </IonItem>

            <IonItem button onClick={handleRedo}>
              <IonIcon icon={arrowRedo} slot="start" />
              <IonLabel>Redo</IonLabel>
            </IonItem>

            <IonItem button onClick={handleAddImage}>
              <IonIcon icon={imageOutline} slot="start" />
              <IonLabel>Add Image</IonLabel>
            </IonItem>

            <IonItem button onClick={handleTakePhoto}>
              <IonIcon icon={cameraOutline} slot="start" />
              <IonLabel>Take Photo</IonLabel>
            </IonItem>

            <IonItem button onClick={handleAddLogo}>
              <IonIcon icon={logoBuffer} slot="start" />
              <IonLabel>Apply Logo</IonLabel>
            </IonItem>

            <IonItem button onClick={handleAddSignature}>
              <IonIcon icon={pencilOutline} slot="start" />
              <IonLabel>Apply Signature</IonLabel>
            </IonItem>

            <IonItem button onClick={handleRemoveLogo}>
              <IonIcon icon={closeCircle} slot="start" />
              <IonLabel>Remove Logo</IonLabel>
            </IonItem>

            <IonItem button onClick={handleRemoveSignature}>
              <IonIcon icon={closeCircle} slot="start" />
              <IonLabel>Remove Signature</IonLabel>
            </IonItem>

            <IonItem button onClick={handleRemoveImage}>
              <IonIcon icon={trashOutline} slot="start" />
              <IonLabel>Remove Image</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPopover>

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      {/* Unsaved Changes Confirmation Alert */}
      <IonAlert
        isOpen={showUnsavedChangesAlert}
        onDidDismiss={() => setShowUnsavedChangesAlert(false)}
        header="⚠️ Unsaved Changes"
        message="The default file has unsaved changes. Creating a new file will discard these changes. Do you want to continue?"
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              setShowUnsavedChangesAlert(false);
            },
          },
          {
            text: "Discard & Create New",
            handler: async () => {
              await handleDiscardAndCreateNew();
            },
          },
        ]}
      />

      {/* Save As Alert */}
      <IonAlert
        isOpen={showSaveAsAlert}
        onDidDismiss={() => setShowSaveAsAlert(false)}
        header="Save As"
        inputs={[
          {
            name: "filename",
            type: "text",
            placeholder: "Enter filename",
            value: newFileName,
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
          },
          {
            text: "Save",
            handler: (data) => {
              if (data.filename?.trim()) {
                doSaveAs(data.filename.trim());
              }
            },
          },
        ]}
      />

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
        position="bottom"
      />

      {/* Logo Modal */}
      <IonModal
        isOpen={showLogoModal}
        onDidDismiss={() => setShowLogoModal(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Select Logo</IonTitle>
            <IonButton
              fill="clear"
              slot="end"
              onClick={() => setShowLogoModal(false)}
            >
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Available Logos ({savedLogos.length})</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {savedLogos.length === 0 ? (
                <IonText color="medium">
                  <p>
                    No logos found. Please upload logos in the Settings page
                    first.
                  </p>
                </IonText>
              ) : (
                <IonGrid>
                  <IonRow>
                    {savedLogos.map((logo) => (
                      <IonCol key={logo.id} size="12" sizeMd="6">
                        <IonCard>
                          <IonCardContent>
                            <IonImg
                              src={logo.data}
                              alt={logo.name}
                              style={{
                                maxHeight: "100px",
                                objectFit: "contain",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                padding: "8px",
                                backgroundColor: "white",
                              }}
                            />
                            <IonButton
                              expand="block"
                              fill="solid"
                              color="primary"
                              onClick={() => handleSelectLogo(logo)}
                            >
                              <IonIcon icon={checkmark} slot="start" />
                              Apply Logo
                            </IonButton>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              )}
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>

      {/* Signature Modal */}
      <IonModal
        isOpen={showSignatureModal}
        onDidDismiss={() => setShowSignatureModal(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Select Signature</IonTitle>
            <IonButton
              fill="clear"
              slot="end"
              onClick={() => setShowSignatureModal(false)}
            >
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                Available Signatures ({savedSignatures.length})
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {savedSignatures.length === 0 ? (
                <IonText color="medium">
                  <p>
                    No signatures found. Please create signatures in the
                    Settings page first.
                  </p>
                </IonText>
              ) : (
                <IonGrid>
                  <IonRow>
                    {savedSignatures.map((signature) => (
                      <IonCol key={signature.id} size="12" sizeMd="6">
                        <IonCard>
                          <IonCardContent>
                            <IonImg
                              src={signature.data}
                              alt={signature.name}
                              style={{
                                maxHeight: "100px",
                                objectFit: "contain",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                padding: "8px",
                                backgroundColor: "white",
                              }}
                            />
                            <IonButton
                              expand="block"
                              fill="solid"
                              color="primary"
                              onClick={() => handleSelectSignature(signature)}
                            >
                              <IonIcon icon={checkmark} slot="start" />
                              Apply Signature
                            </IonButton>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              )}
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>
    </>
  );
};

export default FileOptions;
