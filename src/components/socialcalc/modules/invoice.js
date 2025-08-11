// Invoice tracking functions
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

export function getInvoiceCoordinates() {
  console.log("=== GET INVOICE COORDINATES ===");

  // Invoice coordinates mapping for different sections
  const coordinates = {
    billTo: {
      name: "C5",
      streetAddress: "C6",
      cityStateZip: "C7",
      phone: "C8",
      email: "C9",
    },
    from: {
      name: "C12",
      streetAddress: "C13",
      cityStateZip: "C14",
      phone: "C15",
      email: "C16",
    },
    invoice: {
      number: "C18",
      date: "D20",
    },
    items: {
      // Items from C23-F23 to C35-F35 (13 rows)
      startRow: 23,
      endRow: 35,
      descriptionColumn: "C",
      amountColumn: "F",
    },
    total: {
      sum: "F36",
    },
  };

  console.log("Invoice coordinates mapping:", coordinates);
  console.log("=== END GET INVOICE COORDINATES ===");

  return coordinates;
}

export function addInvoiceData(invoiceData) {
  return new Promise(function (resolve, reject) {
    console.log("=== ADD INVOICE DATA START ===");
    console.log("Invoice data:", invoiceData);

    try {
      var control = SocialCalc.GetCurrentWorkBookControl();
      console.log("Workbook control:", control ? "Found" : "Not found");

      if (!control) {
        throw new Error("No workbook control available");
      }

      if (!control.currentSheetButton) {
        throw new Error("No current sheet button available");
      }

      var currsheet = control.currentSheetButton.id;
      console.log("Current active sheet:", currsheet);

      // Get invoice coordinates
      const coordinates = getInvoiceCoordinates();

      // Build commands to set all values
      var commands = [];

      // Set Bill To information
      if (invoiceData.billTo) {
        if (invoiceData.billTo.name) {
          commands.push(
            `set ${coordinates.billTo.name} text t ${invoiceData.billTo.name}`
          );
        }
        if (invoiceData.billTo.streetAddress) {
          commands.push(
            `set ${coordinates.billTo.streetAddress} text t ${invoiceData.billTo.streetAddress}`
          );
        }
        if (invoiceData.billTo.cityStateZip) {
          commands.push(
            `set ${coordinates.billTo.cityStateZip} text t ${invoiceData.billTo.cityStateZip}`
          );
        }
        if (invoiceData.billTo.phone) {
          commands.push(
            `set ${coordinates.billTo.phone} text t ${invoiceData.billTo.phone}`
          );
        }
        if (invoiceData.billTo.email) {
          commands.push(
            `set ${coordinates.billTo.email} text t ${invoiceData.billTo.email}`
          );
        }
      }

      // Set From information
      if (invoiceData.from) {
        if (invoiceData.from.name) {
          commands.push(
            `set ${coordinates.from.name} text t ${invoiceData.from.name}`
          );
        }
        if (invoiceData.from.streetAddress) {
          commands.push(
            `set ${coordinates.from.streetAddress} text t ${invoiceData.from.streetAddress}`
          );
        }
        if (invoiceData.from.cityStateZip) {
          commands.push(
            `set ${coordinates.from.cityStateZip} text t ${invoiceData.from.cityStateZip}`
          );
        }
        if (invoiceData.from.phone) {
          commands.push(
            `set ${coordinates.from.phone} text t ${invoiceData.from.phone}`
          );
        }
        if (invoiceData.from.email) {
          commands.push(
            `set ${coordinates.from.email} text t ${invoiceData.from.email}`
          );
        }
      }

      // Set Invoice information
      if (invoiceData.invoice) {
        if (invoiceData.invoice.number) {
          commands.push(
            `set ${coordinates.invoice.number} text t ${invoiceData.invoice.number}`
          );
        }
        if (invoiceData.invoice.date) {
          commands.push(
            `set ${coordinates.invoice.date} text t ${invoiceData.invoice.date}`
          );
        }
      }

      // Clear existing items first
      for (
        let row = coordinates.items.startRow;
        row <= coordinates.items.endRow;
        row++
      ) {
        commands.push(
          `erase ${coordinates.items.descriptionColumn}${row} formulas`
        );
        commands.push(`erase ${coordinates.items.amountColumn}${row} formulas`);
      }

      // Set Items
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        let totalAmount = 0;

        invoiceData.items.forEach((item, index) => {
          const row = coordinates.items.startRow + index;
          if (row <= coordinates.items.endRow) {
            if (item.description) {
              commands.push(
                `set ${coordinates.items.descriptionColumn}${row} text t ${item.description}`
              );
            }
            if (item.amount !== undefined && item.amount !== "") {
              const amount = parseFloat(item.amount) || 0;
              commands.push(
                `set ${coordinates.items.amountColumn}${row} value n ${amount}`
              );
              totalAmount += amount;
            }
          }
        });

        // Set total sum
        commands.push(`set ${coordinates.total.sum} value n ${totalAmount}`);
      }

      var cmd = commands.join("\n") + "\n";
      console.log("Generated SocialCalc commands:", cmd);

      var commandObj = {
        cmdtype: "scmd",
        id: currsheet,
        cmdstr: cmd,
        saveundo: false,
      };

      console.log("Command object:", commandObj);

      try {
        control.ExecuteWorkBookControlCommand(commandObj, false);
        console.log("✓ Invoice data added successfully");
        console.log("=== ADD INVOICE DATA SUCCESS ===");
        resolve(true);
      } catch (execError) {
        console.error("Error executing command:", execError);
        throw execError;
      }
    } catch (error) {
      console.error("=== ADD INVOICE DATA ERROR ===");
      console.error("Error details:", error);
      console.error("Stack trace:", error.stack);
      reject(error);
    }
  });
}

export function getInvoiceData() {
  console.log("=== GET INVOICE DATA START ===");

  try {
    // Get invoice coordinates
    const coordinates = getInvoiceCoordinates();

    // Get current sheet
    var control = SocialCalc.GetCurrentWorkBookControl();
    if (!control || !control.currentSheetButton) {
      throw new Error("No current sheet available");
    }

    var currsheet = control.currentSheetButton.id;
    console.log("Current active sheet:", currsheet);

    // Read Bill To values
    var billToName = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.billTo.name
    );
    var billToStreetAddress = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.billTo.streetAddress
    );
    var billToCityStateZip = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.billTo.cityStateZip
    );
    var billToPhone = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.billTo.phone
    );
    var billToEmail = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.billTo.email
    );

    // Read From values
    var fromName = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.from.name
    );
    var fromStreetAddress = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.from.streetAddress
    );
    var fromCityStateZip = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.from.cityStateZip
    );
    var fromPhone = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.from.phone
    );
    var fromEmail = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.from.email
    );

    // Read Invoice values
    var invoiceNumber = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.invoice.number
    );
    var invoiceDate = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.invoice.date
    );

    // Read Items
    var items = [];
    for (
      let row = coordinates.items.startRow;
      row <= coordinates.items.endRow;
      row++
    ) {
      var description = SocialCalc.GetCellDataValue(
        currsheet + "!" + coordinates.items.descriptionColumn + row
      );
      var amount = SocialCalc.GetCellDataValue(
        currsheet + "!" + coordinates.items.amountColumn + row
      );

      // Only add items that have at least a description or amount
      if (description || amount) {
        items.push({
          description: description || "",
          amount: amount || "",
        });
      }
    }

    // Read Total
    var total = SocialCalc.GetCellDataValue(
      currsheet + "!" + coordinates.total.sum
    );

    const data = {
      billTo: {
        name: billToName || "",
        streetAddress: billToStreetAddress || "",
        cityStateZip: billToCityStateZip || "",
        phone: billToPhone || "",
        email: billToEmail || "",
      },
      from: {
        name: fromName || "",
        streetAddress: fromStreetAddress || "",
        cityStateZip: fromCityStateZip || "",
        phone: fromPhone || "",
        email: fromEmail || "",
      },
      invoice: {
        number: invoiceNumber || "",
        date: invoiceDate || "",
      },
      items: items,
      total: total || "",
    };

    console.log("Retrieved invoice data:", data);
    console.log("=== GET INVOICE DATA SUCCESS ===");

    return data;
  } catch (error) {
    console.error("=== GET INVOICE DATA ERROR ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error.stack);
    return null;
  }
}

export function clearInvoiceData() {
  return new Promise(function (resolve, reject) {
    console.log("=== CLEAR INVOICE DATA START ===");

    try {
      var control = SocialCalc.GetCurrentWorkBookControl();
      console.log("Workbook control:", control ? "Found" : "Not found");

      if (!control) {
        throw new Error("No workbook control available");
      }

      if (!control.currentSheetButton) {
        throw new Error("No current sheet button available");
      }

      var currsheet = control.currentSheetButton.id;
      console.log("Current active sheet:", currsheet);

      // Get invoice coordinates
      const coordinates = getInvoiceCoordinates();

      // Build commands to clear all values
      var commands = [];

      // Clear Bill To information
      commands.push(`erase ${coordinates.billTo.name} formulas`);
      commands.push(`erase ${coordinates.billTo.streetAddress} formulas`);
      commands.push(`erase ${coordinates.billTo.cityStateZip} formulas`);
      commands.push(`erase ${coordinates.billTo.phone} formulas`);
      commands.push(`erase ${coordinates.billTo.email} formulas`);

      // Clear From information
      commands.push(`erase ${coordinates.from.name} formulas`);
      commands.push(`erase ${coordinates.from.streetAddress} formulas`);
      commands.push(`erase ${coordinates.from.cityStateZip} formulas`);
      commands.push(`erase ${coordinates.from.phone} formulas`);
      commands.push(`erase ${coordinates.from.email} formulas`);

      // Clear Invoice information
      commands.push(`erase ${coordinates.invoice.number} formulas`);
      commands.push(`erase ${coordinates.invoice.date} formulas`);

      // Clear all items
      for (
        let row = coordinates.items.startRow;
        row <= coordinates.items.endRow;
        row++
      ) {
        commands.push(
          `erase ${coordinates.items.descriptionColumn}${row} formulas`
        );
        commands.push(`erase ${coordinates.items.amountColumn}${row} formulas`);
      }

      // Clear total
      commands.push(`erase ${coordinates.total.sum} formulas`);

      var cmd = commands.join("\n") + "\n";
      console.log("Generated SocialCalc clear commands:", cmd);

      var commandObj = {
        cmdtype: "scmd",
        id: currsheet,
        cmdstr: cmd,
        saveundo: false,
      };

      console.log("Command object:", commandObj);

      try {
        control.ExecuteWorkBookControlCommand(commandObj, false);
        console.log("✓ Invoice data cleared successfully");
        console.log("=== CLEAR INVOICE DATA SUCCESS ===");
        resolve(true);
      } catch (execError) {
        console.error("Error executing command:", execError);
        throw execError;
      }
    } catch (error) {
      console.error("=== CLEAR INVOICE DATA ERROR ===");
      console.error("Error details:", error);
      console.error("Stack trace:", error.stack);
      reject(error);
    }
  });
}
