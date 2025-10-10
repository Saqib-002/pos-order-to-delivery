import { OrderItem } from "@/types/order";
import { toast } from "react-toastify";
import { calculateOrderTotal, calculateTaxPercentage } from "./orderCalculations";

export const fetchConnectedPrinters = async (
    token: string | null,
    setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getConnectedPrinters(token);
    if (!res.status) {
        setPrinters([]);
        toast.error("Unable to get printers");
        return;
    }
    setPrinters(res.data);
};
export const fetchPrinters = async (
    token: string | null,
    setPrinters: React.Dispatch<React.SetStateAction<any>>
) => {
    const res = await (window as any).electronAPI.getAllPrinters(token);
    if (!res.status) {
        setPrinters([]);
        toast.error("Unable to get printers");
        return;
    }
    setPrinters(res.data);
};
export const groupItemsByPrinter = (
    items: OrderItem[]
): Record<string, OrderItem[]> => {
    const printerGroups: Record<string, OrderItem[]> = {};

    items.forEach((item) => {
        item.printers?.forEach((printerStr) => {
            const printerName = printerStr.split("|")[1];
            if (!printerGroups[printerName]) {
                printerGroups[printerName] = [];
            }
            printerGroups[printerName].push(item);
        });
    });

    return printerGroups;
};
export const generateReceiptHTML = (
    items: OrderItem[],
    orderId: string,
    userRole: string,
): string => {
    const { nonMenuItems, groups, orderTotal } = calculateOrderTotal(items);
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateTimeStr = `${dateStr} - ${timeStr}`;

    // Simple VAT breakdown (group by tax rate; assumes tax % calculable from items)
    const taxBreakdown = items.reduce((acc, item) => {
        let base = 0;
        let tax = 0;
        let rate = 0;
        if (item.menuId) {
            base = item.menuPrice || 0;
            tax = item.menuTax || 0;
            rate = calculateTaxPercentage(base, tax);
        } else {
            base = item.productPrice || 0;
            tax = item.productTax || 0;
            rate = calculateTaxPercentage(base, tax);
        }
        const rateKey = `${Math.round(rate)}%`;
        if (!acc[rateKey]) {
            acc[rateKey] = { base: 0, tax: 0, rate: parseFloat(rateKey) };
        }
        acc[rateKey].base += base * item.quantity;
        acc[rateKey].tax += tax * item.quantity;
        return acc;
    }, {} as Record<string, { base: number; tax: number; rate: number }>);

    // Default rates if none
    if (Object.keys(taxBreakdown).length === 0) {
        taxBreakdown['10%'] = { base: orderTotal / 1.1, tax: orderTotal / 11, rate: 10 };
    }

    let html = `
    <html>
        <head>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; border:1px solid black; }
            .line { width: 100%; height: 1px; background: black; margin: 5px 0; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .left { text-align: left; }
            .order-info { margin: 0 0 24px 0; } 
            .order-info h1 { margin: 0 0 4px 0; } 
            .order-info p { margin: 0 0 2px 0; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size:12px; }
            thead { border-bottom:1px solid black; font-weight: semibold; }
            th, td { padding: 2px; text-align: left; vertical-align: top; }
            .qty-col { width: 10%; text-align: center; }
            .sub-col { width: 20%; text-align: right; }
            .total-col { width: 20%; text-align: right; }
            .name-col { width: 50%; }
            .sub-item { padding-left: 20px; font-size: 11px; }
            .indent { padding-left: 30px; }
            .total-row { font-weight: bold; border-top: 2px solid black; }
            .vat-table th, .vat-table td { text-align: right; }
            .vat-table .name-col { text-align: left; }
        </style>
        </head>
        <body>
        <div class="center">
            <h2 class="bold">${"All Doner Kebap"}</h2>
            <p>${"Street, Company, Address, Lane No., Country, Postal Code"}</p>
        </div>
        <div class="line"></div>
        <div class="order-info center">
            <h1 class="bold">K${orderId}</h1>
        </div>
        <div class="order-info left">
            <p><span class="bold">Date:</span> ${dateTimeStr}</p>
            <p><span class="bold">Order:</span> K${orderId}</p>
            <p><span class="bold">Served By:</span> ${userRole}</p>
            <div class="line"></div>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="name-col">Name</th>
                    <th class="qty-col">Quantity</th>
                    <th class="sub-col">Subtotal</th>
                    <th class="total-col">TOTAL</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Menu groups
    groups.forEach((group) => {
        const sectionQty = group.items[0]?.quantity || 1;
        const menuPrice = group.basePrice;
        const sectionSubtotal = menuPrice * sectionQty;
        const sectionTotal = (menuPrice + group.taxPerUnit + group.supplementTotal) * sectionQty;
        html += `
                <tr>
                    <td class="name-col">${group.menuName}</td>
                    <td class="qty-col">${sectionQty}</td>
                    <td class="sub-col">€${menuPrice.toFixed(2)}</td>
                    <td class="total-col">€${sectionSubtotal.toFixed(2)}</td>
                </tr>
        `;
        // Sub-items and their complements
        group.items.forEach((item) => {
            html += `
                ${item.supplement ? `<tr>
                    <td class="name-col sub-item">Extra:${item.supplement}</td>
                    <td class="qty-col"></td>
                    <td class="sub-col"></td>
                    <td class="total-col"></td>
                </tr>
                `:""}
                <tr>
                    <td class="name-col sub-item">${item.productName} ${item.variantName ? `(${item.variantName})` : ''}</td>
                    <td class="qty-col"></td>
                    <td class="sub-col"></td>
                    <td class="total-col"></td>
                </tr>
            `;
            item.complements.forEach((comp) => {
                html += `
                    <tr>
                        <td class="name-col sub-item indent">+${comp.itemName}</td>
                        <td class="qty-col"></td>
                        <td class="sub-col"></td>
                        <td class="total-col"></td>
                    </tr>
                `;
            });
        });
    });

    // Non-menu items
    nonMenuItems.forEach((item) => {
        const unitPrice = item.productPrice + item.productTax; // Subtotal as base + tax?
        const lineTotal = (item.totalPrice * item.quantity).toFixed(2);
        html += `
            <tr>
                <td class="name-col">${item.productName} ${item.variantName ? `(${item.variantName})` : ''}</td>
                <td class="qty-col">${item.quantity}</td>
                <td class="sub-col">€${unitPrice.toFixed(2)}</td>
                <td class="total-col">€${lineTotal}</td>
            </tr>
        `;
        item.complements.forEach((comp) => {
            html += `
                <tr>
                    <td class="name-col sub-item">+${comp.itemName}</td>
                    <td class="qty-col"></td>
                    <td class="sub-col"></td>
                    <td class="total-col"></td>
                </tr>
            `;
        });
    });

    html += `
            </tbody>
        </table>
        <div class="total-row center">
            <table style="width: 100%; margin: 10px 0;">
                <tr><td class="name-col"></td><td class="sub-col bold">TOTAL</td><td class="total-col bold">€${orderTotal.toFixed(2)}</td></tr>
            </table>
        </div>
        <div class="line"></div>
        <table class="vat-table">
            <thead>
                <tr>
                    <th class="name-col">VAT</th>
                    <th class="sub-col">Base</th>
                    <th class="total-col">Tax</th>
                </tr>
            </thead>
            <tbody>
    `;

    // VAT rows
    Object.entries(taxBreakdown).forEach(([rateKey, { base, tax }]) => {
        html += `
                <tr>
                    <td class="name-col">${rateKey}</td>
                    <td class="sub-col">€${base.toFixed(2)}</td>
                    <td class="total-col">€${tax.toFixed(2)}</td>
                </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div class="line"></div>
        <div class="center"><small>Thank you for your visit</small></div>
        </body>
    </html>
    `;
    return html;
};