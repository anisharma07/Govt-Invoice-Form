// Device detection and coordinate utilities
let SocialCalc;

// Ensure SocialCalc is loaded from the global scope
if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  console.error("SocialCalc not found in global scope");
  SocialCalc = {}; // Fallback to prevent errors
}

export function getDeviceType() {
  /* Returns the type of the device */
  var device = "default";
  if (navigator.userAgent.match(/iPod/)) device = "iPod";
  if (navigator.userAgent.match(/iPad/)) device = "iPad";
  if (navigator.userAgent.match(/iPhone/)) device = "iPhone";
  if (navigator.userAgent.match(/Android/)) device = "Android";
  return device;
}

export function getLogoCoordinates() {
  const deviceType = getDeviceType();
  console.log("=== GET LOGO COORDINATES ===");
  console.log("Detected device type:", deviceType);

  // Import the LOGO configuration (you'll need to import this)
  // For now, returning a basic structure - you should import from app-data-new.ts
  const LOGO = {
    iPad: {
      sheet1: "F4",
      sheet2: "F4",
      sheet3: "F4",
      sheet4: "F4",
    },
    iPhone: {
      sheet1: "F5",
      sheet2: "F7",
      sheet3: "F8",
      sheet4: null,
      sheet5: null,
    },
    iPod: {
      sheet1: "F5",
      sheet2: "F7",
      sheet3: "F8",
      sheet4: null,
      sheet5: null,
    },
    Android: {
      sheet1: "F5",
      sheet2: "F7",
      sheet3: "F8",
      sheet4: null,
      sheet5: null,
    },
    default: {
      sheet1: "F4",
      sheet2: "F4",
      sheet3: "F4",
      sheet4: "F4",
    },
  };

  const coordinates = LOGO[deviceType] || LOGO.default;
  console.log("Selected coordinates:", coordinates);
  console.log("=== END GET LOGO COORDINATES ===");

  return coordinates;
}

export function getSignatureCoordinates() {
  const deviceType = getDeviceType();
  console.log("=== GET SIGNATURE COORDINATES ===");
  console.log("Detected device type:", deviceType);

  // Import the SIGNATURE configuration (you'll need to import this)
  // For now, returning a basic structure - you should import from app-data-new.ts
  const SIGNATURE = {
    iPad: {
      sheet1: null,
      sheet2: null,
      sheet3: null,
      sheet4: null,
    },
    iPhone: {
      sheet1: null,
      sheet2: null,
      sheet3: null,
      sheet4: null,
      sheet5: null,
    },
    iPod: {
      sheet1: null,
      sheet2: null,
      sheet3: null,
      sheet4: null,
      sheet5: null,
    },
    Android: {
      sheet1: null,
      sheet2: null,
      sheet3: null,
      sheet4: null,
      sheet5: null,
    },
    default: {
      sheet1: "D31",
      sheet2: "D31",
      sheet3: "C36",
      sheet4: "C36",
    },
  };

  const coordinates = SIGNATURE[deviceType] || SIGNATURE.default;
  console.log("Selected coordinates:", coordinates);
  console.log("=== END GET SIGNATURE COORDINATES ===");

  return coordinates;
}
