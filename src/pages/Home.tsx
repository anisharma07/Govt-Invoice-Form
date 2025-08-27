import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonToast,
  IonAlert,
  IonLabel,
  IonInput,
  IonItemDivider,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  isPlatform,
} from "@ionic/react";
import { APP_NAME, DATA } from "../templates";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState, useRef } from "react";
import { Local, File } from "../components/Storage/LocalStorage";
import {
  checkmark,
  checkmarkCircle,
  pencil,
  saveSharp,
  syncOutline,
  closeOutline,
  textOutline,
  ellipsisVertical,
  shareSharp,
  cloudDownloadOutline,
  wifiOutline,
  downloadOutline,
  createOutline,
  refreshOutline,
  arrowBack,
  documentText,
  folder,
} from "ionicons/icons";
import "./Home.css";
import FileOptions from "../components/FileMenu/FileOptions";
import Menu from "../components/Menu/Menu";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import { usePWA } from "../hooks/usePWA";
import { useTheme } from "../contexts/ThemeContext";
import { useInvoice } from "../contexts/InvoiceContext";
import { useHistory, useParams } from "react-router-dom";
import InvoiceForm from "../components/InvoiceForm";
import DynamicInvoiceForm from "../components/DynamicInvoiceForm";
// import WalletConnection from "../components/wallet/WalletConnection";
import {
  isDefaultFileEmpty,
  generateUntitledFilename,
  isQuotaExceededError,
  getQuotaExceededMessage,
} from "../utils/helper";
import { TemplateInitializer } from "../utils/templateInitializer";
import { TemplateManager } from "../utils/templateManager";
// import { cloudService } from "../services/cloud-service";

const Home: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { selectedFile, billType, store, updateSelectedFile, updateBillType, activeTempId, updateActiveTempId } =
    useInvoice();
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const history = useHistory();
  const { fileName } = useParams<{ fileName?: string }>();

  const [fileNotFound, setFileNotFound] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [device] = useState(AppGeneral.getDeviceType());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");

  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState("");
  const [saveAsOperation, setSaveAsOperation] = useState<"local" | null>(null);

  // Color picker state
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorMode, setColorMode] = useState<"background" | "font">(
    "background"
  );
  const [customColorInput, setCustomColorInput] = useState("");
  const [activeBackgroundColor, setActiveBackgroundColor] = useState("#f4f5f8");
  const [activeFontColor, setActiveFontColor] = useState("#000000");

  // Actions popover state
  const [showActionsPopover, setShowActionsPopover] = useState(false);

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // Error state for initialization failures
  // const [initError, setInitError] = useState(false);
  // const [fileIsEmpty, setFileIsEmpty] = useState(false);

  // Available colors for sheet themes
  const availableColors = [
    { name: "red", label: "Red", color: "#ff4444" },
    { name: "blue", label: "Blue", color: "#3880ff" },
    { name: "green", label: "Green", color: "#2dd36f" },
    { name: "yellow", label: "Yellow", color: "#ffc409" },
    { name: "purple", label: "Purple", color: "#6f58d8" },
    { name: "black", label: "Black", color: "#000000" },
    { name: "white", label: "White", color: "#ffffff" },
    { name: "default", label: "Default", color: "#f4f5f8" },
  ];

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  const handleColorChange = (colorName: string) => {
    try {
      // Get the actual color value (hex) for the color name
      const selectedColor = availableColors.find((c) => c.name === colorName);
      const colorValue = selectedColor ? selectedColor.color : colorName;

      if (colorMode === "background") {
        AppGeneral.changeSheetBackgroundColor(colorName);
        setActiveBackgroundColor(colorValue);
      } else {
        AppGeneral.changeSheetFontColor(colorName);
        setActiveFontColor(colorValue);

        // Additional CSS override for dark mode font color
        setTimeout(() => {
          const spreadsheetContainer = document.getElementById("tableeditor");
          if (spreadsheetContainer && isDarkMode) {
            // Force font color in dark mode by adding CSS override
            const style = document.createElement("style");
            style.id = "dark-mode-font-override";
            // Remove existing override if any
            const existingStyle = document.getElementById(
              "dark-mode-font-override"
            );
            if (existingStyle) {
              existingStyle.remove();
            }
            style.innerHTML = `
              .dark-theme #tableeditor * {
                color: ${colorValue} !important;
              }
              .dark-theme #tableeditor td,
              .dark-theme #tableeditor .defaultCell,
              .dark-theme #tableeditor .cell {
                color: ${colorValue} !important;
              }
            `;
            document.head.appendChild(style);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error changing sheet color:", error);
      setToastMessage("Failed to change sheet color");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleCustomColorApply = () => {
    const hexColor = customColorInput.trim();
    if (hexColor && /^#?[0-9A-Fa-f]{6}$/.test(hexColor)) {
      const formattedColor = hexColor.startsWith("#")
        ? hexColor
        : `#${hexColor}`;
      handleColorChange(formattedColor);
      setCustomColorInput("");
    } else {
      setToastMessage(
        "Please enter a valid hex color (e.g., #FF0000 or FF0000)"
      );
      setToastColor("warning");
      setShowToast(true);
    }
  };

  const openColorModal = (mode: "background" | "font") => {
    setColorMode(mode);
    setShowColorModal(true);
  };

  const executeSaveAsWithFilename = async (filename: string) => {
    updateSelectedFile(filename);

    if (saveAsOperation === "local") {
      await performLocalSave(filename);
    }
    setSaveAsFileName("");
    setSaveAsOperation(null);
  };

  const performLocalSave = async (fileName: string) => {
    try {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const now = new Date().toISOString();
      
      // Get template metadata for the current active template
      const metadata = TemplateInitializer.getTemplateMetadata(activeTempId);
      
      const file = new File(
        now, 
        now, 
        content, 
        fileName, 
        billType,
        metadata || {
          template: `Template ${activeTempId}`,
          templateId: activeTempId,
          footers: [],
          logoCell: null,
          signatureCell: null,
          cellMappings: {},
        },
        false
      );
      await store._saveFile(file);

      setToastMessage(`File "${fileName}" saved locally!`);
      setToastColor("success");
      setShowToast(true);
    } catch (error) {
      console.error("Error saving file:", error);

      // Check if the error is due to storage quota exceeded
      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("saving files"));
      } else {
        setToastMessage("Failed to save file locally.");
      }
      setToastColor("danger");
      setShowToast(true);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize template system first
        const isTemplateInitialized = await TemplateInitializer.isInitialized();
        if (!isTemplateInitialized) {
          await TemplateInitializer.initializeApp();
        }

        // Determine which file to load
        let fileToLoad = fileName || selectedFile;

        // If no file is specified in URL or context, redirect to files page
        if (!fileToLoad) {
          console.log("No file specified, redirecting to files");
          history.push("/app/files");
          return;
        }

        // Check if the file exists in storage
        const fileExists = await store._checkKey(fileToLoad);
        if (!fileExists) {
          console.log(`File "${fileToLoad}" not found`);
          setFileNotFound(true);
          return;
        }

        // Load the file
        const fileData = await store._getFile(fileToLoad);
        const decodedContent = decodeURIComponent(fileData.content);

        // Update context if URL parameter is different from selected file
        if (fileName && fileName !== selectedFile) {
          updateSelectedFile(fileName);
        }

        // Use initializeApp instead of viewFile to ensure proper SocialCalc setup
        AppGeneral.initializeApp(decodedContent);
        updateBillType(fileData.billType);
        
        // Update active template if file has template metadata
        if (fileData.templateMetadata?.templateId) {
          updateActiveTempId(fileData.templateMetadata.templateId);
        }
        
        console.log("Loaded file:", fileToLoad);
        setFileNotFound(false);
      } catch (error) {
        console.error("Error initializing app:", error);
        // On error, show file not found
        setFileNotFound(true);
      }
    };

    initializeApp();
  }, [fileName, selectedFile]);

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleAutoSave = async () => {
    try {
      console.log("Auto-saving file...");
      
      // If no file is selected, can't autosave
      if (!selectedFile) {
        return;
      }

      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());

      // Get existing metadata and update
      const data = await store._getFile(selectedFile);
      const file = new File(
        (data as any)?.created || new Date().toISOString(),
        new Date().toISOString(),
        content,
        selectedFile,
        billType,
        (data as any)?.templateMetadata,
        false
      );
      await store._saveFile(file);
      updateSelectedFile(selectedFile);
    } catch (error) {
      console.error("Error auto-saving file:", error);

      // Check if the error is due to storage quota exceeded
      if (isQuotaExceededError(error)) {
        setToastMessage(getQuotaExceededMessage("auto-saving"));
        setToastColor("danger");
        setShowToast(true);
      } else {
        // For other errors during auto-save, show a less intrusive message
        setToastMessage("Auto-save failed. Please save manually.");
        setToastColor("warning");
        setShowToast(true);
      }
    }
  };
  useEffect(() => {
    const debouncedAutoSave = () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const newTimer = setTimeout(() => {
        handleAutoSave();
        setAutoSaveTimer(null);
      }, 1000);

      setAutoSaveTimer(newTimer);
    };

    const removeListener = AppGeneral.setupCellChangeListener((_) => {
      debouncedAutoSave();
    });

    return () => {
      removeListener();
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [selectedFile, billType, autoSaveTimer]);

  useEffect(() => {
    activateFooter(billType);
  }, [billType]);

  // Effect to handle font color in dark mode
  useEffect(() => {
    if (isDarkMode && activeFontColor !== "#000000") {
      // Reapply font color when switching to dark mode
      setTimeout(() => {
        const style = document.createElement("style");
        style.id = "dark-mode-font-override";
        // Remove existing override if any
        const existingStyle = document.getElementById(
          "dark-mode-font-override"
        );
        if (existingStyle) {
          existingStyle.remove();
        }
        style.innerHTML = `
          .dark-theme #tableeditor * {
            color: ${activeFontColor} !important;
          }
          .dark-theme #tableeditor td,
          .dark-theme #tableeditor .defaultCell,
          .dark-theme #tableeditor .cell {
            color: ${activeFontColor} !important;
          }
        `;
        document.head.appendChild(style);
      }, 100);
    } else if (!isDarkMode) {
      // Remove dark mode font override when switching to light mode
      const existingStyle = document.getElementById("dark-mode-font-override");
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }, [isDarkMode, activeFontColor]);

  const footers = DATA[activeTempId]["footers"];
  const footersList = footers.map((footerArray) => {
    const isActive = footerArray.index === billType;

    return (
      <IonButton
        key={footerArray.index}
        color="light"
        className="ion-no-margin"
        style={{
          whiteSpace: "nowrap",
          minWidth: "max-content",
          marginRight: "8px",
          flexShrink: 0,
          border: isActive ? "2px solid #3880ff" : "2px solid transparent",
          borderRadius: "4px",
        }}
        onClick={() => {
          updateBillType(footerArray.index);
          activateFooter(footerArray.index);
        }}
      >
        {footerArray.name}
      </IonButton>
    );
  });

  return (
    <IonPage
      className={isDarkMode ? "dark-theme" : ""}
      // style={{ overflow: "hidden", maxHeight: "80vh" }}
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton 
              fill="clear" 
              onClick={() => history.push("/app/files")}
              style={{ color: "white" }}
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="start" className="editing-title" style={{ marginLeft: "8px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonIcon
                icon={pencil}
                size="medium"
                style={{ marginRight: "8px" }}
              />
              {isPlatform("mobile") || isPlatform("hybrid") ? (
                <span title={selectedFile}>
                  {selectedFile.length > 15
                    ? `${selectedFile.substring(0, 15)}...`
                    : selectedFile}
                </span>
              ) : (
                <span>{selectedFile}</span>
              )}
              {selectedFile && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={handleAutoSave}
                  disabled={autoSaveTimer !== null}
                  style={{
                    minWidth: "auto",
                    height: "32px",
                  }}
                >
                  <IonIcon
                    icon={autoSaveTimer ? syncOutline : checkmarkCircle}
                    size="small"
                    color={"success"}
                    style={{
                      animation: autoSaveTimer
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                </IonButton>
              )}
            </div>
          </IonButtons>

          <IonButtons
            slot="end"
            className={isPlatform("desktop") && "ion-padding-end"}
          >
            {/* Wallet Connection */}
            <div style={{ marginRight: "12px" }}>
              {/* <WalletConnection /> */}
            </div>
            <IonIcon
              icon={textOutline}
              size="large"
              onClick={() => AppGeneral.toggleCellFormatting()}
              style={{ cursor: "pointer", marginRight: "12px" }}
              title="Format Current Cell"
            />
            <IonIcon
              icon={shareSharp}
              size="large"
              onClick={(e) => {
                setShowMenu(true);
              }}
              style={{ cursor: "pointer", marginRight: "12px" }}
            />
            <IonIcon
              id="actions-trigger"
              icon={ellipsisVertical}
              size="large"
              onClick={() => setShowActionsPopover(true)}
              style={{ cursor: "pointer", marginRight: "12px" }}
              title="More Actions"
            />
          </IonButtons>
        </IonToolbar>
        <IonToolbar color="secondary">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              padding: "8px 16px",
              width: "100%",
              alignItems: "center",
            }}
          >
            {footersList}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {fileNotFound ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "40px 20px",
            textAlign: "center"
          }}>
            <IonIcon 
              icon={documentText} 
              style={{ 
                fontSize: "80px", 
                color: "var(--ion-color-medium)",
                marginBottom: "20px"
              }}
            />
            <h2 style={{ 
              margin: "0 0 16px 0", 
              color: "var(--ion-color-dark)",
              fontSize: "24px",
              fontWeight: "600"
            }}>
              File Not Found
            </h2>
            <p style={{ 
              margin: "0 0 30px 0", 
              color: "var(--ion-color-medium)",
              fontSize: "16px",
              lineHeight: "1.5",
              maxWidth: "400px"
            }}>
              {fileName ? `The file "${fileName}" doesn't exist in your storage.` : "The requested file couldn't be found."}
            </p>
            <IonButton 
              fill="solid" 
              size="default"
              onClick={() => history.push("/app/files")}
              style={{ minWidth: "200px" }}
            >
              <IonIcon icon={folder} slot="start" />
              Go to File Explorer
            </IonButton>
          </div>
        ) : (
          <div id="container">
            <div id="workbookControl"></div>
            <div id="tableeditor"></div>
            <div id="msg"></div>
          </div>
        )}

        {/* Toast for save notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {/* Save As Dialog */}
        <IonAlert
          isOpen={showSaveAsDialog}
          onDidDismiss={() => {
            setShowSaveAsDialog(false);
            setSaveAsFileName("");
            setSaveAsOperation(null);
          }}
          header="Save As - Local Storage"
          message="Enter a filename for your invoice:"
          inputs={[
            {
              name: "filename",
              type: "text",
              placeholder: "Enter filename...",
              value: saveAsFileName,
              attributes: {
                maxlength: 50,
              },
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setSaveAsFileName("");
                setSaveAsOperation(null);
              },
            },
            {
              text: "Save",
              handler: (data) => {
                if (data.filename && data.filename.trim()) {
                  setSaveAsFileName(data.filename.trim());
                  // Close dialog and execute save
                  setShowSaveAsDialog(false);
                  // Use setTimeout to ensure state updates
                  setTimeout(async () => {
                    await executeSaveAsWithFilename(data.filename.trim());
                  }, 100);
                } else {
                  setToastMessage("Please enter a valid filename");
                  setToastColor("warning");
                  setShowToast(true);
                  return false; // Prevent dialog from closing
                }
              },
            },
          ]}
        />

        {/* File Options Popover */}
        <FileOptions
          showActionsPopover={showActionsPopover}
          setShowActionsPopover={setShowActionsPopover}
          showColorModal={showColorModal}
          setShowColorPicker={setShowColorModal}
        />

        {/* Color Picker Modal */}
        <IonModal
          className="color-picker-modal"
          isOpen={showColorModal}
          onDidDismiss={() => {
            setShowColorModal(false);
            setCustomColorInput("");
          }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Change Sheet Color</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  className="close-button"
                  onClick={() => setShowColorModal(false)}
                  fill="clear"
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {/* Tab Segments */}
            <IonSegment
              value={colorMode}
              onIonChange={(e) =>
                setColorMode(e.detail.value as "background" | "font")
              }
            >
              <IonSegmentButton value="background">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: activeBackgroundColor,
                      borderRadius: "50%",
                      border: "2px solid #ccc",
                    }}
                  />
                  <IonLabel>Background Color</IonLabel>
                </div>
              </IonSegmentButton>
              <IonSegmentButton value="font">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: activeFontColor,
                      borderRadius: "50%",
                      border: "2px solid #ccc",
                    }}
                  />
                  <IonLabel>Font Color</IonLabel>
                </div>
              </IonSegmentButton>
            </IonSegment>

            <IonItemDivider>
              <IonLabel>
                {colorMode === "background"
                  ? "Background Colors"
                  : "Font Colors"}
              </IonLabel>
            </IonItemDivider>

            <IonGrid>
              <IonRow>
                {availableColors.map((color) => (
                  <IonCol size="3" size-md="2" key={color.name}>
                    <div
                      className="color-swatch"
                      onClick={() => handleColorChange(color.name)}
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: color.color,
                        borderRadius: "12px",
                        margin: "8px auto",
                        border:
                          (colorMode === "background" &&
                            activeBackgroundColor === color.color) ||
                          (colorMode === "font" &&
                            activeFontColor === color.color)
                            ? "3px solid #3880ff"
                            : "2px solid #ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        margin: "4px 0",
                        fontWeight: "500",
                      }}
                    >
                      {color.label}
                    </p>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            <IonItemDivider>
              <IonLabel>Custom Hex Color</IonLabel>
            </IonItemDivider>

            <div style={{ padding: "16px" }}>
              <IonInput
                fill="outline"
                value={customColorInput}
                placeholder="Enter hex color (e.g., #FF0000)"
                onIonInput={(e) => setCustomColorInput(e.detail.value!)}
                maxlength={7}
                style={{ marginBottom: "16px" }}
              />
              <IonButton
                expand="block"
                onClick={handleCustomColorApply}
                disabled={!customColorInput.trim()}
              >
                Apply Custom Color
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <DynamicInvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
        />

        {/* Floating Action Button for Invoice Edit */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            onClick={() => setShowInvoiceForm(true)}
            color="primary"
          >
            <IonIcon icon={createOutline} />
          </IonFabButton>
        </IonFab>

        <Menu showM={showMenu} setM={() => setShowMenu(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
