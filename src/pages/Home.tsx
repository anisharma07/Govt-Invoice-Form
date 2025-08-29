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
  IonSpinner,
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
  const { selectedFile, billType, store, updateSelectedFile, updateBillType, activeTemplateData, updateActiveTemplateData } =
    useInvoice();
  const history = useHistory();
  const { fileName } = useParams<{ fileName?: string }>();

  const [fileNotFound, setFileNotFound] = useState(false);
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [showMenu, setShowMenu] = useState(false);
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
      // Check if SocialCalc is ready
      const socialCalc = (window as any).SocialCalc;
      if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
        setToastMessage("Spreadsheet not ready. Please wait and try again.");
        setToastColor("warning");
        setShowToast(true);
        return;
      }

      const control = socialCalc.GetCurrentWorkBookControl();
      if (!control || !control.workbook || !control.workbook.spreadsheet) {
        setToastMessage("Spreadsheet not ready. Please wait and try again.");
        setToastColor("warning");
        setShowToast(true);
        return;
      }

      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const now = new Date().toISOString();
      
      // Get template ID from active template data
      const templateId = activeTemplateData ? activeTemplateData.templateId : billType;
      
      const file = new File(
        now, 
        now, 
        content, 
        fileName, 
        billType,
        templateId,
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

    const activateFooter = (footer) => {
    // Only activate footer if SocialCalc is properly initialized
    try {
      const tableeditor = document.getElementById("tableeditor");
      const socialCalc = (window as any).SocialCalc;
      
      // Check if SocialCalc and WorkBook control are properly initialized
      if (tableeditor && socialCalc && socialCalc.GetCurrentWorkBookControl) {
        const control = socialCalc.GetCurrentWorkBookControl();
        if (control && control.workbook && control.workbook.spreadsheet) {
          AppGeneral.activateFooterButton(footer);
        } else {
          console.log("SocialCalc WorkBook not ready for footer activation, skipping...");
        }
      } else {
        console.log("SocialCalc not ready for footer activation, skipping...");
      }
    } catch (error) {
      console.log("Error activating footer, SocialCalc might not be ready:", error);
    }
    };
  
const initializeApp = async () => {
      setIsInitializing(true);
      
      try {
        // Initialize template system first
        const isTemplateInitialized = await TemplateInitializer.isInitialized();
        if (!isTemplateInitialized) {
          await TemplateInitializer.initializeApp();
        }

        // Prioritize URL parameter over context to ensure fresh state
        let fileToLoad=selectedFile;
        if (!selectedFile || selectedFile.trim() === "") {
          fileToLoad = fileName;
          updateSelectedFile(fileName);
        }

        // If no file is specified, redirect to files page
        if (!fileToLoad || fileToLoad === "") {
          // console.log("No file specified, redirecting to files");
          setIsInitializing(false);
          history.push("/app/files");
          return;
        }

        // Check if the file exists in storage
        console.log("file to load", fileToLoad);
        const fileExists = await store._checkKey(fileToLoad);
        if (!fileExists) {
          console.log(`File "${fileToLoad}" not found`);
          setFileNotFound(true);
          setIsInitializing(false);
          return;
        }

        // Load the file
        const fileData = await store._getFile(fileToLoad);
        const decodedContent = decodeURIComponent(fileData.content);

        // Get template ID from file data
        const templateId = fileData.templateId;
        
        // Check if template exists in the templates library
        if (!DATA[templateId]) {
          console.error(`Template ${templateId} not found in templates library`);
          setTemplateNotFound(true);
          setFileNotFound(false);
          setIsInitializing(false);
          return;
        }

        // Load template data
        const templateData = DATA[templateId];
        updateActiveTemplateData(templateData);
        console.log(templateData);
        console.log("Template data loaded successfully", fileData);
        // Initialize SocialCalc with the file content
        // console.log(`Initializing SocialCalc for file: ${fileToLoad}`);
        
        // Wait a bit to ensure DOM elements are ready
        setTimeout(() => {
          try {
        const currentControl = AppGeneral.getWorkbookInfo();
        console.log("Current workbook info:", currentControl);

        if (currentControl && currentControl.workbook) {
          // SocialCalc is initialized, use viewFile
          AppGeneral.viewFile(fileToLoad, decodedContent);
          console.log("File loaded successfully with viewFile");
        } else {
          // SocialCalc not initialized, initialize it first
          console.log("SocialCalc not initialized, initializing...");
          AppGeneral.initializeApp(decodedContent);
          console.log("File loaded successfully with initializeApp");
        }
      } catch (error) {
        console.error("Error checking SocialCalc state:", error);
        // Fallback: try to initialize the app
        try {
          AppGeneral.initializeApp(decodedContent);
          console.log("File loaded successfully with initializeApp (fallback)");
        } catch (initError) {
          console.error("initializeApp failed:", initError);
          throw new Error(
            "Failed to load file: SocialCalc initialization error"
          );
        }
      }
          
          // Activate footer after initialization
          setTimeout(() => {
            activateFooter(fileData.billType);
            setIsInitializing(false); // Set loading to false after complete initialization
          }, 500);
        }, 100);
        console.log("success");
        // console.log("Successfully loaded file:", fileToLoad);
        setFileNotFound(false);
        setTemplateNotFound(false);
      } catch (error) {
        console.error("Error initializing app:", error);
        // On error, show file not found
        setFileNotFound(true);
        setTemplateNotFound(false);
        setIsInitializing(false);
      }
};
  
  useEffect(() => {
    initializeApp();
  }, [selectedFile]); // Only depend on selectedFile to prevent loops with selectedFile updates

  useEffect(() => {
    if (fileName) {
      updateSelectedFile(fileName);
    }
  }, [fileName]);

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

      // Check if SocialCalc is ready
      const socialCalc = (window as any).SocialCalc;
      if (!socialCalc || !socialCalc.GetCurrentWorkBookControl) {
        console.log("SocialCalc not ready for auto-save, skipping...");
        return;
      }

      const control = socialCalc.GetCurrentWorkBookControl();
      if (!control || !control.workbook || !control.workbook.spreadsheet) {
        console.log("SocialCalc WorkBook not ready for auto-save, skipping...");
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
        activeTemplateData ? activeTemplateData.templateId : billType,
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

    let removeListener = () => {};
    
    // Wait for SocialCalc to be ready before setting up the listener
    const setupListener = () => {
      try {
        const socialCalc = (window as any).SocialCalc;
        if (socialCalc && socialCalc.GetCurrentWorkBookControl) {
          const control = socialCalc.GetCurrentWorkBookControl();
          if (control && control.workbook && control.workbook.spreadsheet) {
            removeListener = AppGeneral.setupCellChangeListener((_) => {
              debouncedAutoSave();
            });
          } else {
            // Retry after a delay if WorkBook is not ready
            setTimeout(setupListener, 2000);
          }
        } else {
          // Retry after a delay if SocialCalc is not ready
          setTimeout(setupListener, 2000);
        }
      } catch (error) {
        console.log("Error setting up cell change listener:", error);
        // Retry after a delay
        setTimeout(setupListener, 2000);
      }
    };

    // Start attempting to setup the listener
    setupListener();

    return () => {
      removeListener();
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [selectedFile, billType, autoSaveTimer]);

  useEffect(() => {
    // Add a delay to ensure SocialCalc is initialized before activating footer
    const timer = setTimeout(() => {
      activateFooter(billType);
    }, 1000);
    
    return () => clearTimeout(timer);
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

  const footers = activeTemplateData ? activeTemplateData.footers : [];
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

  useEffect(() => {
    // Add a delay to ensure SocialCalc is initialized before activating footer
    console.log("Selected file changed:", selectedFile);
    console.log("activeTemplateData", activeTemplateData);
  }, [selectedFile, activeTemplateData]);

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
              <span>{selectedFile}</span>
              {selectedFile && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={initializeApp}
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
        {activeTemplateData && activeTemplateData.footers.length > 1 && (
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
      )}
    </IonHeader>

      <IonContent fullscreen
      style={{
        height: '100vh',
      }}
      >
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
        ) : templateNotFound ? (
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
              icon={downloadOutline} 
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
              Template Not Found
            </h2>
            <p style={{ 
              margin: "0 0 30px 0", 
              color: "var(--ion-color-medium)",
              fontSize: "16px",
              lineHeight: "1.5",
              maxWidth: "400px"
            }}>
              The file information is not downloaded. Please download the file template to open this file.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <IonButton 
                fill="solid" 
                size="default"
                onClick={() => history.push("/app/files")}
                style={{ minWidth: "140px" }}
              >
                <IonIcon icon={folder} slot="start" />
                Go to Files
              </IonButton>
              <IonButton 
                fill="outline" 
                size="default"
                onClick={() => {
                  // Add download template functionality here
                  setToastMessage("Template download functionality coming soon");
                  setToastColor("warning");
                  setShowToast(true);
                }}
                style={{ minWidth: "140px" }}
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download Template
              </IonButton>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative", height: "100%" }}>
            {/* Loading overlay */}
            {isInitializing && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDarkMode ? "var(--ion-background-color)" : "var(--ion-background-color)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "40px 20px",
                textAlign: "center"
              }}>
                <IonSpinner 
                  name="crescent" 
                  style={{ 
                    fontSize: "60px", 
                    color: "var(--ion-color-primary)",
                    marginBottom: "20px"
                  }}
                />
                <h2 style={{ 
                  margin: "0 0 16px 0", 
                  color: "var(--ion-color-dark)",
                  fontSize: "24px",
                  fontWeight: "600"
                }}>
                  Initializing App
                </h2>
                <p style={{ 
                  margin: "0", 
                  color: "var(--ion-color-medium)",
                  fontSize: "16px",
                  lineHeight: "1.5",
                  maxWidth: "400px"
                }}>
                  Please wait while we load your invoice template and prepare the editor...
                </p>
              </div>
            )}
            
            {/* SocialCalc container - always rendered */}
            <div id="container">
              <div id="workbookControl"></div>
              <div id="tableeditor"></div>
              <div id="msg"></div>
            </div>
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
