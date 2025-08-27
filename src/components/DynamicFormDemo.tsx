import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import DynamicInvoiceForm from "../components/DynamicInvoiceForm";

const DynamicFormDemo: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dynamic Form Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: "20px" }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Dynamic Invoice Form System</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>
                This demo showcases the dynamic form generation system that creates forms based on:
              </p>
              <ul>
                <li>Template cell mappings</li>
                <li>Active footer indices</li>
                <li>Field type detection</li>
                <li>Dynamic validation</li>
              </ul>
              
              <IonButton
                expand="block"
                onClick={() => setShowForm(true)}
                style={{ marginTop: "20px" }}
              >
                Open Dynamic Form
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <DynamicInvoiceForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default DynamicFormDemo;
