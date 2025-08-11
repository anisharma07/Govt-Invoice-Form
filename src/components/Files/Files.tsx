import React, { useState, useEffect } from "react";
import "./Files.css";
import * as AppGeneral from "../socialcalc/index.js";
import { DATA } from "../../app-data.js";
import { File as LocalFile, Local } from "../Storage/LocalStorage";
import {
  IonIcon,
  IonItem,
  IonList,
  IonLabel,
  IonAlert,
  IonItemGroup,
  IonBadge,
  IonSpinner,
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonSearchbar,
  IonButton,
  IonInput,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import {
  trash,
  key,
  documentText,
  cloudOutline,
  server,
  logIn,
  personAdd,
  download,
  folderOpen,
  cloudUpload,
  close,
  swapVertical,
  create,
  ellipsisHorizontal,
} from "ionicons/icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useHistory } from "react-router-dom";
import { useInvoice } from "../../contexts/InvoiceContext";
import {
  formatDateForFilename,
  isQuotaExceededError,
  getQuotaExceededMessage,
} from "../../utils/helper";

const Files: React.FC<{
  store: Local;
  file: string;
  updateSelectedFile: Function;
  updateBillType: Function;
}> = (props) => {
  const { selectedFile, updateSelectedFile } = useInvoice();
  const { isDarkMode } = useTheme();
  const history = useHistory();

  const [showAlert1, setShowAlert1] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [showServerDeleteAlert, setShowServerDeleteAlert] = useState(false);

  const [device] = useState(AppGeneral.getDeviceType());

  const [showRenameAlert, setShowRenameAlert] = useState(false);
  const [renameFileName, setRenameFileName] = useState("");
  const [currentRenameKey, setCurrentRenameKey] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [fileSource, setFileSource] = useState<"local">("local");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "date" | "dateCreated" | "dateModified"
  >("dateModified");
  const [fileListContent, setFileListContent] = useState<React.ReactNode>(null);

  const [serverFilesLoading, setServerFilesLoading] = useState(false);

  // Blockchain state removed - local-only mode

  const handleSaveUnsavedChanges = async () => {
    // Save Default File Changes if not already saved
    if (selectedFile === "default" && props.file !== "default") {
      try {
        const defaultExists = await props.store._checkKey("default");
        if (defaultExists) {
          const storedDefaultFile = await props.store._getFile("default");

          // Decode the stored content
          const storedContent = decodeURIComponent(storedDefaultFile.content);
          const msc = DATA["home"]["App"]["msc"];

          const hasUnsavedChanges = storedContent !== JSON.stringify(msc);
          if (hasUnsavedChanges) {
            console.log("Default file has unsaved changes, saving...");
            // Save the current spreadsheet content to the default file
            const currentContent = AppGeneral.getSpreadsheetContent();
            const now = new Date().toISOString();

            const untitledFileName =
              "Untitled-" + formatDateForFilename(new Date());
            const updatedDefaultFile = new LocalFile(
              now, // created
              now, // modified
              encodeURIComponent(currentContent), // encoded content
              untitledFileName, // new name for the default file
              storedDefaultFile.billType, // keep the same billType
              false // isEncrypted = false for default files
            );
            await props.store._saveFile(updatedDefaultFile);

            // Clear Default File...
            const templateContent = encodeURIComponent(JSON.stringify(msc));
            const newDefaultFile = new LocalFile(
              now,
              now,
              templateContent,
              "default",
              1
            );
            await props.store._saveFile(newDefaultFile);
            setToastMessage(`Changes Saved as ${untitledFileName}`);
            setShowToast(true);
          }
        }
      } catch (error) {
        console.error("Error saving default file changes:", error);

        // Check if the error is due to storage quota exceeded
        if (isQuotaExceededError(error)) {
          setToastMessage(getQuotaExceededMessage("saving changes"));
        } else {
          setToastMessage("Failed to save default file changes");
        }
        setShowToast(true);
      }
    }
  };
  // Edit local file
  const editFile = async (key: string) => {
    try {
      console.log("Attempting to edit file:", key);

      await handleSaveUnsavedChanges();

      const data = await props.store._getFile(key);
      console.log("File data retrieved:", {
        name: data.name,
        contentLength: data.content?.length,
        billType: data.billType,
        hasContent: !!data.content,
      });

      if (!data.content) {
        setToastMessage("File content is empty or corrupted");
        setShowToast(true);
        return;
      }
      // console.log("billType:", data.billType);
      // console.log("File CONTENT-------------->", data.content);
      const decodedContent = decodeURIComponent(data.content);
      // console.log("Decoded content:", decodedContent);
      // console.log("Decoded content length:", decodedContent.length);
      // console.log("Decoded content preview:", decodedContent.substring(0, 200));

      // Ensure SocialCalc is properly initialized before loading the file
      // First, try to get the current workbook control to see if it's initialized
      try {
        const currentControl = AppGeneral.getWorkbookInfo();
        console.log("Current workbook info:", currentControl);

        if (currentControl && currentControl.workbook) {
          // SocialCalc is initialized, use viewFile
          AppGeneral.viewFile(key, decodedContent);
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

      props.updateSelectedFile(key);
      props.updateBillType(data.billType);
      history.push("/app/editor");
    } catch (error) {
      console.error("Error in editFile:", error);
      setToastMessage("Failed to load file");
      setShowToast(true);
    }
  };

  // Delete file
  const deleteFile = (key: string) => {
    setShowAlert1(true);
    setCurrentKey(key);
  };

  // Load default file
  const loadDefault = () => {
    const msc = DATA["home"]["App"]["msc"];
    AppGeneral.viewFile("default", JSON.stringify(msc));
    props.updateSelectedFile("default");
  };

  // Format date with validation
  const _formatDate = (date: string) => {
    if (!date) return "Unknown date";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }
    return parsedDate.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get appropriate date label and value based on sort option for local files
  const getLocalFileDateInfo = (file: any) => {
    const parseDate = (dateValue: any) => {
      if (!dateValue) return null;

      // If it's already a valid date string (ISO format)
      if (
        typeof dateValue === "string" &&
        !isNaN(new Date(dateValue).getTime())
      ) {
        return dateValue;
      }

      // If it's a Date.toString() format, parse it
      if (typeof dateValue === "string" && dateValue.includes("GMT")) {
        const parsed = new Date(dateValue);
        return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
      }

      return null;
    };

    if (sortBy === "dateCreated") {
      const createdDate =
        parseDate(file.dateCreated) ||
        parseDate(file.date) ||
        parseDate(file.dateModified);
      return {
        label: "Created",
        value: createdDate || new Date().toISOString(),
      };
    } else if (sortBy === "dateModified") {
      const modifiedDate = parseDate(file.dateModified) || parseDate(file.date);
      return {
        label: "Modified",
        value: modifiedDate || new Date().toISOString(),
      };
    } else {
      const modifiedDate = parseDate(file.date) || parseDate(file.dateModified);
      return {
        label: "Modified",
        value: modifiedDate || new Date().toISOString(),
      };
    }
  };

  // Sort files based on selected criteria
  const sortFiles = (
    files: any[],
    sortCriteria: "name" | "date" | "dateCreated" | "dateModified"
  ) => {
    const sortedFiles = [...files];

    switch (sortCriteria) {
      case "name":
        return sortedFiles.sort((a, b) => {
          const nameA = (a.name || a.filename || "").toLowerCase();
          const nameB = (b.name || b.filename || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case "date":
        return sortedFiles.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at || 0).getTime();
          const dateB = new Date(b.date || b.created_at || 0).getTime();
          return dateB - dateA; // Most recent first
        });
      case "dateCreated":
        return sortedFiles.sort((a, b) => {
          const dateA = new Date(
            a.dateCreated || a.date || a.dateModified || 0
          ).getTime();
          const dateB = new Date(
            b.dateCreated || b.date || b.dateModified || 0
          ).getTime();
          // Handle invalid dates by treating them as very old dates (0)
          const validDateA = isNaN(dateA) ? 0 : dateA;
          const validDateB = isNaN(dateB) ? 0 : dateB;
          return validDateB - validDateA; // Most recent first
        });
      case "dateModified":
        return sortedFiles.sort((a, b) => {
          const dateA = new Date(a.dateModified || a.date || 0).getTime();
          const dateB = new Date(b.dateModified || b.date || 0).getTime();
          // Handle invalid dates by treating them as very old dates (0)
          const validDateA = isNaN(dateA) ? 0 : dateA;
          const validDateB = isNaN(dateB) ? 0 : dateB;
          return validDateB - validDateA; // Most recent first
        });
      default:
        return sortedFiles;
    }
  };

  // Group files by date
  const groupFilesByDate = (
    files: any[],
    sortCriteria?: "name" | "date" | "dateCreated" | "dateModified"
  ) => {
    const groups: { [key: string]: any[] } = {};
    files.forEach((file) => {
      let dateForGrouping;

      if (sortCriteria === "dateCreated") {
        const createdDate = file.dateCreated || file.date || file.dateModified;
        dateForGrouping = new Date(createdDate);
        // Fallback to a valid date if the created date is invalid
        if (isNaN(dateForGrouping.getTime())) {
          dateForGrouping = new Date(
            file.dateModified || file.date || Date.now()
          );
        }
      } else if (sortCriteria === "dateModified") {
        const modifiedDate = file.dateModified || file.date;
        dateForGrouping = new Date(modifiedDate);
        // Fallback to a valid date if the modified date is invalid
        if (isNaN(dateForGrouping.getTime())) {
          dateForGrouping = new Date(file.date || Date.now());
        }
      } else {
        dateForGrouping = new Date(file.date || file.created_at);
        // Fallback to current date if invalid
        if (isNaN(dateForGrouping.getTime())) {
          dateForGrouping = new Date();
        }
      }

      const dateHeader = dateForGrouping.toDateString();
      if (!groups[dateHeader]) groups[dateHeader] = [];
      groups[dateHeader].push(file);
    });
    return groups;
  };

  // Filter files by search
  const filterFilesBySearch = (files: any[], query: string) => {
    if (!query.trim()) return files;
    const searchTerm = query.toLowerCase().trim();
    return files.filter((file) => {
      const fileName =
        file.name?.toLowerCase() ||
        file.file_name?.toLowerCase() ||
        file.key?.toLowerCase() ||
        file.filename?.toLowerCase() ||
        "";
      return fileName.includes(searchTerm);
    });
  };

  // Validation function (adapted from Menu.tsx)
  const _validateName = async (filename: string, excludeKey?: string) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage(
        "Cannot update default or Untitled file! Use Save As Button to save."
      );
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (
      (await props.store._checkKey(filename)) &&
      filename !== excludeKey
    ) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  // Rename file function
  const renameFile = (key: string) => {
    setCurrentRenameKey(key);
    setRenameFileName(key);
    setShowRenameAlert(true);
  };

  // Handle rename confirmation
  const handleRename = async (newFileName: string) => {
    if (!currentRenameKey) return;

    // If the new filename is the same as the current one, just close the dialog
    if (newFileName === currentRenameKey) {
      setToastMessage("File name unchanged");
      setShowToast(true);
      setCurrentRenameKey(null);
      setRenameFileName("");
      setShowRenameAlert(false);
      return;
    }

    if (await _validateName(newFileName, currentRenameKey)) {
      try {
        // Get the existing file data
        const fileData = await props.store._getFile(currentRenameKey);

        // Create a new file with the new name
        const renamedFile = new LocalFile(
          fileData.created, // Keep the original creation date
          new Date().toISOString(), // Use ISO string for modified date
          fileData.content,
          newFileName,
          fileData.billType,
          fileData.isPasswordProtected,
          fileData.password
        );

        // Save the new file
        await props.store._saveFile(renamedFile);

        // Delete the old file
        await props.store._deleteFile(currentRenameKey);

        // Update selected file if it was the renamed file
        if (selectedFile === currentRenameKey) {
          updateSelectedFile(newFileName);
        }

        setToastMessage(`File renamed to "${newFileName}"`);
        setShowToast(true);

        // Refresh the file list
        await renderFileList();

        // Reset state
        setCurrentRenameKey(null);
        setRenameFileName("");
        setShowRenameAlert(false);
      } catch (error) {
        console.error("Error renaming file:", error);

        // Check if the error is due to storage quota exceeded
        if (isQuotaExceededError(error)) {
          setToastMessage(getQuotaExceededMessage("renaming files"));
        } else {
          setToastMessage("Failed to rename file");
        }
        setShowToast(true);
        // Reset state even on error to close the dialog
        setCurrentRenameKey(null);
        setRenameFileName("");
        setShowRenameAlert(false);
      }
    } else {
      // Validation failed - show the error toast but keep the dialog open
      // The validation function already shows the error toast
      setShowToast(true);
      // Don't close the dialog here - let the user see the error and try again
    }
  };

  // Render file list
  const renderFileList = async () => {
    let content;
    if (fileSource === "local") {
      const localFiles = await props.store._getAllFiles();

      const filesArray = Object.keys(localFiles)
        .filter((key) => key !== "default") // Exclude the default file from the list
        .map((key) => {
          const fileData = localFiles[key];

          // Ensure dates are properly converted - handle both ISO strings and Date.toString() formats
          let createdDate = fileData.created;
          let modifiedDate = fileData.modified;

          // If the date looks like a Date.toString() format, try to parse it
          // Date.toString() typically looks like "Mon Jul 06 2025 10:30:00 GMT+0000 (UTC)"
          if (typeof createdDate === "string" && createdDate.includes("GMT")) {
            createdDate = new Date(createdDate).toISOString();
          }
          if (
            typeof modifiedDate === "string" &&
            modifiedDate.includes("GMT")
          ) {
            modifiedDate = new Date(modifiedDate).toISOString();
          }

          return {
            key,
            name: key,
            date: modifiedDate, // For backward compatibility
            dateCreated: createdDate,
            dateModified: modifiedDate,
            type: "local",
          };
        });
      const filteredFiles = filterFilesBySearch(filesArray, searchQuery);
      if (filteredFiles.length === 0) {
        content = (
          <IonList style={{ border: "none" }} lines="none">
            <IonItem style={{ "--border-width": "0px" }}>
              <IonLabel>
                {searchQuery.trim()
                  ? `No files found matching "${searchQuery}"`
                  : "No local files found"}
              </IonLabel>
            </IonItem>
          </IonList>
        );
      } else {
        const sortedFiles = sortFiles(filteredFiles, sortBy);

        if (sortBy === "name") {
          // For name sorting, show files in a simple list without date grouping
          content = (
            <IonList style={{ border: "none" }} lines="none">
              {sortedFiles.map((file) => (
                <IonItemGroup key={`local-${file.key}`}>
                  <IonItem
                    className="mobile-file-item"
                    onClick={() => editFile(file.key)}
                    style={{
                      "--border-width": "0px",
                      cursor: "pointer",
                    }}
                  >
                    <IonIcon
                      icon={documentText}
                      slot="start"
                      className="file-icon document-icon"
                    />
                    <IonLabel className="mobile-file-label">
                      <h3>{file.name}</h3>
                      <p>
                        Local file • {getLocalFileDateInfo(file).label}:{" "}
                        {_formatDate(getLocalFileDateInfo(file).value)}
                      </p>
                    </IonLabel>
                    <div
                      slot="end"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <IonIcon
                        icon={create}
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameFile(file.key);
                        }}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                        }}
                      />
                      <IonIcon
                        icon={trash}
                        color="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.key);
                        }}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  </IonItem>
                </IonItemGroup>
              ))}
            </IonList>
          );
        } else {
          // For date and recent sorting, group by date
          const groupedFiles = groupFilesByDate(sortedFiles, sortBy);
          content = (
            <IonList style={{ border: "none" }} lines="none">
              {Object.entries(groupedFiles).map(([dateHeader, files]) => (
                <div key={`local-group-${dateHeader}`}>
                  <IonItem
                    color="light"
                    className="date-header-item"
                    style={{ "--border-width": "0px" }}
                  >
                    <IonLabel>
                      <h2
                        className="date-header-text"
                        style={{ color: "var(--ion-color-primary)" }}
                      >
                        {dateHeader}
                      </h2>
                    </IonLabel>
                  </IonItem>
                  {(files as any[]).map((file) => (
                    <IonItemGroup key={`local-${file.key}`}>
                      {" "}
                      <IonItem
                        className="mobile-file-item"
                        onClick={() => editFile(file.key)}
                        style={{
                          "--border-width": "0px",
                          cursor: "pointer",
                        }}
                      >
                        <IonIcon
                          icon={documentText}
                          slot="start"
                          className="file-icon document-icon"
                        />
                        <IonLabel className="mobile-file-label">
                          <h3>{file.name}</h3>
                          <p>
                            Local file • {getLocalFileDateInfo(file).label}:{" "}
                            {_formatDate(getLocalFileDateInfo(file).value)}
                          </p>
                        </IonLabel>
                        <div
                          slot="end"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <IonIcon
                            icon={create}
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              renameFile(file.key);
                            }}
                            style={{
                              fontSize: "24px",
                              cursor: "pointer",
                            }}
                          />
                          <IonIcon
                            icon={trash}
                            color="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.key);
                            }}
                            style={{
                              fontSize: "24px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      </IonItem>
                    </IonItemGroup>
                  ))}
                </div>
              ))}
            </IonList>
          );
        }
      }
    }
    setFileListContent(content);
  };

  useEffect(() => {
    renderFileList();
    // eslint-disable-next-line
  }, [props.file, fileSource, searchQuery, sortBy, serverFilesLoading]);

  // Reset sort option when switching file sources to ensure compatibility
  useEffect(() => {
    if (sortBy === "date") {
      setSortBy("dateModified");
    }
  }, [fileSource]);

  return (
    <div>
      <div>
        <div className="files-modal-content">
          {/* File Source Tabs */}
          <div className="custom-tabs-container">
            <div className="custom-tabs">
              <button
                className={`custom-tab-button ${
                  fileSource === "local" ? "active" : ""
                }`}
                onClick={() => setFileSource("local")}
              >
                🏠 Your Files
              </button>
            </div>
          </div>
          <div style={{ padding: "0 16px 16px 16px" }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              <IonSearchbar
                placeholder="Search files by name..."
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value!)}
                onIonClear={() => setSearchQuery("")}
                showClearButton="focus"
                debounce={300}
                style={{ flex: "2", minWidth: "200px" }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: "1",
                  minWidth: "140px",
                  maxWidth: "180px",
                }}
              >
                <IonIcon
                  icon={swapVertical}
                  style={{ marginRight: "4px", fontSize: "16px" }}
                />
                <IonSelect
                  value={sortBy}
                  placeholder="Sort by"
                  onIonChange={(e) => setSortBy(e.detail.value)}
                  style={{
                    flex: "1",
                    "--placeholder-color": "var(--ion-color-medium)",
                    "--color": "var(--ion-color-dark)",
                  }}
                  interface="popover"
                >
                  {fileSource === "local" ? (
                    <>
                      <IonSelectOption value="dateModified">
                        By Date Modified
                      </IonSelectOption>
                      <IonSelectOption value="dateCreated">
                        By Date Created
                      </IonSelectOption>
                      <IonSelectOption value="name">By Name</IonSelectOption>
                    </>
                  ) : (
                    <>
                      <IonSelectOption value="date">By Date</IonSelectOption>
                      <IonSelectOption value="name">By Name</IonSelectOption>
                    </>
                  )}
                </IonSelect>
              </div>
            </div>
          </div>
        </div>
        <div
          className="files-scrollable-container"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          {fileListContent}
        </div>
      </div>

      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Delete file"
        message={"Do you want to delete the " + currentKey + " file?"}
        buttons={[
          { text: "No", role: "cancel" },
          {
            text: "Yes",
            handler: async () => {
              if (currentKey) {
                await props.store._deleteFile(currentKey);
                loadDefault();
                setCurrentKey(null);
                await renderFileList();
              }
            },
          },
        ]}
      />

      <IonAlert
        animated
        isOpen={showRenameAlert}
        onDidDismiss={() => {
          setShowRenameAlert(false);
          setCurrentRenameKey(null);
          setRenameFileName("");
        }}
        header="Rename File"
        message={`Enter a new name for "${currentRenameKey}"`}
        inputs={[
          {
            name: "filename",
            type: "text",
            value: renameFileName,
            placeholder: "Enter new filename",
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              setCurrentRenameKey(null);
              setRenameFileName("");
            },
          },
          {
            text: "Rename",
            handler: (data) => {
              const newFileName = data.filename?.trim();
              if (newFileName) {
                handleRename(newFileName);
              } else {
                setToastMessage("Filename cannot be empty");
                setShowToast(true);
              }
            },
          },
        ]}
      />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </div>
  );
};

export default Files;
