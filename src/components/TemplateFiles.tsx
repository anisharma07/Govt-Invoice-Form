import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonBadge,
  IonChip,
  IonToast,
} from '@ionic/react';
import { documentText, folder, download, create, trash } from 'ionicons/icons';
import { Local, File, TemplateMetadata } from './Storage/LocalStorage';
import { TemplateManager } from '../utils/templateManager';
import { TemplateInitializer } from '../utils/templateInitializer';

interface TemplateFilesProps {
  onFileSelect?: (fileName: string, templateId: number) => void;
  onFileCreate?: (templateId: number) => void;
}

/**
 * Enhanced Files Component with Multi-Template Support
 * Demonstrates the new template isolation architecture
 */
const TemplateFiles: React.FC<TemplateFilesProps> = ({ onFileSelect, onFileCreate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | 'all'>('all');
  const [files, setFiles] = useState<Record<string, any>>({});
  const [availableTemplates, setAvailableTemplates] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const local = new Local();

  useEffect(() => {
    loadFiles();
    loadAvailableTemplates();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await local._getAllFiles();
      setFiles(allFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setToastMessage('Error loading files');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTemplates = async () => {
    try {
      const allFiles = await local._getAllFiles();
      const templateIds = TemplateManager.getUniqueTemplateIds(allFiles);
      setAvailableTemplates(templateIds);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const getFilteredFiles = () => {
    if (selectedTemplate === 'all') {
      return files;
    }
    return TemplateManager.filterFilesByTemplate(files, selectedTemplate as number);
  };

  const getTemplateInfo = (templateId: number) => {
    const metadata = TemplateInitializer.getTemplateMetadata(templateId);
    return metadata ? metadata.template : `Template ${templateId}`;
  };

  const handleFileCreate = async (templateId: number) => {
    try {
      const metadata = TemplateInitializer.getTemplateMetadata(templateId);
      if (!metadata) {
        setToastMessage('Template not found');
        return;
      }

      const mscContent = TemplateInitializer.createMSCContent(templateId);
      if (!mscContent) {
        setToastMessage('Error creating template content');
        return;
      }

      const fileName = `invoice_${Date.now()}.msc`;
      const newFile = new File(
        new Date().toISOString(),
        new Date().toISOString(),
        mscContent,
        fileName,
        templateId,
        metadata,
        false
      );

      await local._saveFile(newFile);
      await loadFiles();
      setToastMessage(`File created with ${metadata.template}`);
      
      if (onFileCreate) {
        onFileCreate(templateId);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      setToastMessage('Error creating file');
    }
  };

  const handleFileDelete = async (fileName: string) => {
    try {
      await local._deleteFile(fileName);
      await loadFiles();
      setToastMessage('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      setToastMessage('Error deleting file');
    }
  };

  const getFileTemplateInfo = (fileData: any): TemplateMetadata | null => {
    return fileData.templateMetadata || null;
  };

  const filteredFiles = getFilteredFiles();
  const fileCount = Object.keys(filteredFiles).length;

  return (
    <div className="template-files-container">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Multi-Template File Manager</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {/* Template Filter */}
          <IonSegment
            value={selectedTemplate}
            onIonChange={(e) => setSelectedTemplate(e.detail.value as number | 'all')}
          >
            <IonSegmentButton value="all">
              <IonLabel>All Templates</IonLabel>
              <IonBadge color="primary">{Object.keys(files).length}</IonBadge>
            </IonSegmentButton>
            {availableTemplates.map(templateId => (
              <IonSegmentButton key={templateId} value={templateId}>
                <IonLabel>{getTemplateInfo(templateId)}</IonLabel>
                <IonBadge color="secondary">
                  {Object.keys(TemplateManager.filterFilesByTemplate(files, templateId)).length}
                </IonBadge>
              </IonSegmentButton>
            ))}
          </IonSegment>

          {/* Create New File Buttons */}
          <div style={{ margin: '16px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TemplateInitializer.getAllTemplates().map(template => (
              <IonButton
                key={template.templateId}
                fill="outline"
                size="small"
                onClick={() => handleFileCreate(template.templateId)}
              >
                <IonIcon icon={create} slot="start" />
                New {template.template}
              </IonButton>
            ))}
          </div>

          {/* Files List */}
          {loading ? (
            <div>Loading files...</div>
          ) : fileCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
              <IonIcon icon={folder} style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>No files found for selected template</div>
            </div>
          ) : (
            <IonList>
              {Object.entries(filteredFiles).map(([fileName, fileData]) => {
                const templateMetadata = getFileTemplateInfo(fileData);
                return (
                  <IonItem key={fileName}>
                    <IonIcon icon={documentText} slot="start" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{fileName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Created: {new Date(fileData.created).toLocaleDateString()}
                        {fileData.modified !== fileData.created && (
                          <> • Modified: {new Date(fileData.modified).toLocaleDateString()}</>
                        )}
                      </div>
                      {templateMetadata && (
                        <div style={{ marginTop: '4px' }}>
                          <IonChip color="primary" outline>
                            {templateMetadata.template}
                          </IonChip>
                          {templateMetadata.footers.length > 0 && (
                            <IonChip color="secondary" outline>
                              {templateMetadata.footers.length} footer(s)
                            </IonChip>
                          )}
                          {fileData.isEncrypted && (
                            <IonChip color="warning" outline>
                              Encrypted
                            </IonChip>
                          )}
                        </div>
                      )}
                    </div>
                    <IonButton
                      fill="clear"
                      onClick={() => onFileSelect && onFileSelect(fileName, templateMetadata?.templateId || 1)}
                    >
                      <IonIcon icon={download} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => handleFileDelete(fileName)}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </IonItem>
                );
              })}
            </IonList>
          )}

          {/* Template Isolation Info */}
          {selectedTemplate !== 'all' && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Template Isolation Active
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Showing only files for {getTemplateInfo(selectedTemplate as number)}.
                Files are isolated by template to prevent interference between different invoice types.
              </div>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={!!toastMessage}
        onDidDismiss={() => setToastMessage('')}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </div>
  );
};

export default TemplateFiles;
