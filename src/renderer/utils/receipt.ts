import { Order } from "@/types/order";

export interface ReceiptData {
  order: Order;
  restaurantInfo: {
    name: string;
    address: string;
    phone: string;
  };
  printDate: string;
}

export const generateReceiptHTML = (receiptData: ReceiptData): string => {
  const { order, restaurantInfo, printDate } = receiptData;
  
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order Receipt #${order.orderId}</title>
      <style>
        @media print {
          @page { margin: 0.5in; }
          body { font-size: 12px; }
        }
        body {
          font-family: 'Courier New', monospace;
          max-width: 300px;
          margin: 0 auto;
          padding: 10px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .restaurant-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .order-info {
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .customer-info {
          margin-bottom: 15px;
        }
        .items {
          margin-bottom: 15px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding: 2px 0;
        }
        .item-details {
          flex: 1;
        }
        .item-name {
          font-weight: bold;
        }
        .item-ingredients {
          font-size: 10px;
          color: #666;
          margin-left: 10px;
        }
        .item-price {
          text-align: right;
          width: 60px;
        }
        .total-section {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 15px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .total-final {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 10px;
        }
        .delivery-info {
          background-color: #f5f5f5;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">${restaurantInfo.name}</div>
        <div>${restaurantInfo.address}</div>
        <div>Tel: ${restaurantInfo.phone}</div>
      </div>

      <div class="order-info">
        <div><strong>Order #${order.orderId}</strong></div>
        <div>Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
        <div>Time: ${new Date(order.createdAt).toLocaleTimeString()}</div>
        <div>Status: ${order.status}</div>
        <div>Print Time: ${printDate}</div>
      </div>

      <div class="customer-info">
        <div><strong>Customer Information:</strong></div>
        <div>Name: ${order.customer.name}</div>
        <div>Phone: ${order.customer.phone}</div>
        <div>Address: ${order.customer.address}</div>
      </div>

      ${order.deliveryPerson ? `
        <div class="delivery-info">
          <div><strong>Delivery Person:</strong></div>
          <div>Name: ${order.deliveryPerson.name}</div>
          <div>Phone: ${order.deliveryPerson.phone}</div>
          <div>Vehicle: ${order.deliveryPerson.vehicleType}</div>
          ${order.deliveryPerson.licenseNo ? `<div>License: ${order.deliveryPerson.licenseNo}</div>` : ''}
        </div>
      ` : ''}

      <div class="items">
        <div><strong>Order Items:</strong></div>
        ${order.items.map(item => `
          <div class="item">
            <div class="item-details">
              <div class="item-name">${item.name} x${item.quantity}</div>
              ${item.ingredients && item.ingredients.length > 0 ? 
                `<div class="item-ingredients">Ingredients: ${item.ingredients.join(', ')}</div>` : ''
              }
              ${item.specialInstructions ? 
                `<div class="item-ingredients">Special: ${item.specialInstructions}</div>` : ''
              }
            </div>
            <div class="item-price">$${((item.price || 0) * item.quantity).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <div class="total-section">
        <div class="total-line">
          <span>Total Items:</span>
          <span>${totalItems}</span>
        </div>
        <div class="total-line total-final">
          <span>TOTAL:</span>
          <span>$${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <div>Thank you for your order!</div>
        <div>Keep this receipt for your records</div>
      </div>
    </body>
    </html>
  `;
};

export const printReceipt = (order: Order): Promise<boolean> => {
  return new Promise((resolve) => {
    const restaurantInfo = {
      name: "Your Restaurant Name",
      address: "123 Restaurant Street, City, State 12345",
      phone: "(555) 123-4567"
    };

    const receiptData: ReceiptData = {
      order,
      restaurantInfo,
      printDate: new Date().toLocaleString()
    };

    const receiptHTML = generateReceiptHTML(receiptData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (!printWindow) {
      console.error('Failed to open print window');
      resolve(false);
      return;
    }

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        
        // Close the window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve(true);
        };
        
        // Fallback: close window after 3 seconds if onafterprint doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
          resolve(true);
        }, 3000);
      }, 500);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          resolve(true);
        }, 1000);
      }
    }, 1000);
  });
};

// Alternative function for direct browser printing (without popup)
export const printReceiptDirect = async (order: Order): Promise<boolean> => {
  const restaurantInfo = {
    name: "Your Restaurant Name", 
    address: "123 Restaurant Street, City, State 12345",
    phone: "(555) 123-4567"
  };

  const receiptData: ReceiptData = {
    order,
    restaurantInfo,
    printDate: new Date().toLocaleString()
  };

  const receiptHTML = generateReceiptHTML(receiptData);
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return false;
  }

  iframeDoc.write(receiptHTML);
  iframeDoc.close();

  return new Promise((resolve) => {
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(true);
          }, 1000);
        } catch (error) {
          console.error('Print failed:', error);
          document.body.removeChild(iframe);
          resolve(false);
        }
      }, 500);
    };
  });
};