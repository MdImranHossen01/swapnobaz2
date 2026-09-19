import { format, isValid } from 'date-fns';

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBengaliStyle = (n: number): string => {
    if (n < 0) return 'Minus ' + convertBengaliStyle(Math.abs(n));
    let words = '';

    if (n >= 10000000) {
      words += convertBengaliStyle(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }

    if (n >= 100000) {
      words += convertBengaliStyle(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }

    if (n >= 1000) {
      words += convertBengaliStyle(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }

    if (n >= 100) {
      words += convertBengaliStyle(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }

    if (n > 0) {
      if (n < 20) {
        words += a[n];
      } else {
        words += b[Math.floor(n / 10)];
        if (n % 10 > 0) {
          words += ' ' + a[n % 10];
        }
      }
    }

    return words.trim();
  };

  return convertBengaliStyle(Math.round(num)).trim();
}

export async function generateInvoicePDF(orderOrOrders: any | any[], settings: any, mode: 'download' | 'print' = 'download') {
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
  if (orders.length === 0) return;

  const defaultBrandName = settings?.brandName || process.env.NEXT_PUBLIC_STORE_NAME || "Swapnobaz";
  const defaultBrandEmail = settings?.contact?.email || "";
  const defaultBrandPhone = settings?.contact?.phone || "";
  const defaultBrandAddress = settings?.contact?.address || "";
  const defaultBrandLogo = settings?.logo || "";

  // Dynamic colors based on shadcn/tailwind config (HSL values usually)
  let primary = '#0f172a';
  let primaryForeground = '#ffffff';
  let border = '#e2e8f0';
  let mutedForeground = '#64748b';
  let foreground = '#0f172a';
  let background = '#ffffff';

  if (typeof window !== 'undefined') {
    const rootStyle = getComputedStyle(document.documentElement);
    const getHsl = (varName: string, fallback: string) => {
      const val = rootStyle.getPropertyValue(varName).trim();
      if (!val) return fallback;
      if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) return val;
      return `hsl(${val})`;
    };
    primary = getHsl('--primary', primary);
    primaryForeground = getHsl('--primary-foreground', primaryForeground);
    border = getHsl('--border', border);
    mutedForeground = getHsl('--muted-foreground', mutedForeground);
    foreground = getHsl('--foreground', foreground);
    background = getHsl('--background', background);
  }

  const invoicesHtml = orders.map((order, index) => {
    const invoiceId = String(order.shortId || order.orderId || order._id || "").slice(-8).toUpperCase().replace(/^0+/, '');
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const formattedDate = createdAt && isValid(createdAt) ? format(createdAt, "dd MMM yyyy, hh:mm a") : "N/A";

    // Reseller context if applicable
    const reseller = order.resellerId && typeof order.resellerId === 'object' ? order.resellerId : null;
    const storeName = reseller?.storeName || defaultBrandName;
    const storeEmail = reseller?.email || defaultBrandEmail;
    const storePhone = reseller?.phone || defaultBrandPhone;
    const storeAddress = reseller?.address || defaultBrandAddress;
    const storeLogo = reseller?.logo || defaultBrandLogo;

    const items = Array.isArray(order.items) ? order.items : [];
    const subtotalRaw = items.reduce((acc: number, item: any) => {
      const price = item.price !== undefined ? Number(item.price) : Number(item.retailPrice) || 0;
      const quantity = Number(item.quantity) || 1;
      return acc + price * quantity;
    }, 0);
    const subtotal = Number.isFinite(subtotalRaw) ? subtotalRaw : (Number(order.subtotal) || 0);
    const deliveryCharge = order.deliveryCharge !== undefined
      ? Number(order.deliveryCharge)
      : (order.shippingCharge !== undefined ? Number(order.shippingCharge) : Math.max(0, (Number(order.totalAmount || order.total) || 0) - subtotal));
    const couponDiscount = Number(order.couponDiscountAmount || order.couponDiscount || order.discount) || 0;
    const walletUsed = Number(order.walletAmountUsed) || 0;
    const totalAmount = Math.max(0, Math.round(
      order.totalAmount !== undefined 
        ? Number(order.totalAmount) 
        : (order.total !== undefined ? Number(order.total) : subtotal + deliveryCharge - couponDiscount - walletUsed)
    ));

    const customerName = order.shippingAddress?.fullName || order.customerName || order.customer?.name || "Customer";
    const customerStreet = order.shippingAddress?.street || order.customer?.address?.street || "";
    const customerCity = order.shippingAddress?.city || order.customer?.address?.city || "";
    const customerDivision = order.shippingAddress?.division || order.shippingAddress?.state || order.customer?.address?.division || "";
    const customerZip = order.shippingAddress?.zipCode || order.customer?.address?.zipCode || "";
    const customerPhone = order.shippingAddress?.phone || order.customerPhone || order.customer?.phone || "";
    const customerEmail = order.customerEmail || order.customer?.email || "";

    const isPaid = order.paymentStatus === 'Paid';
    const consignmentId = order.shippingDetails?.consignmentId || order.trackingNumber || "";
    const trackingUrl = `https://swapnobaz.com/track-order?invoice=${invoiceId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}`;

    return `
      <div class="invoice-container" style="${index < orders.length - 1 ? 'page-break-after: always; break-after: page;' : ''}">
        <!-- Top Header -->
        <div class="header">
          <div class="brand-logo-container">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="brand-logo-img" />` : `<div class="brand-logo">${storeName}</div>`}
            <div class="brand-details">
              ${storeAddress ? `<div>${storeAddress}</div>` : ''}
              <div>${storePhone ? `Hotline: ${storePhone}` : ''}${storeEmail ? ` | Email: ${storeEmail}` : ''}</div>
              <div style="font-weight: 600; color: var(--foreground); margin-top: 2px;">Official Customer Invoice</div>
            </div>
          </div>

          <div class="invoice-title-block">
            <h1 class="invoice-title">INVOICE</h1>
            <div class="invoice-id-tag">#${invoiceId}</div>
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
          </div>
        </div>

        <!-- Info Grid -->
        <div class="details-grid">
          <div class="card-box bill-to">
            <div class="card-header">
              <span class="card-title">BILL TO (CUSTOMER)</span>
            </div>
            <div class="card-body">
              <p class="customer-name">${customerName}</p>
              ${customerStreet ? `<p class="address-line">${customerStreet}</p>` : ''}
              <p class="address-line">${[customerCity, customerDivision, customerZip].filter(Boolean).join(', ')}</p>
              <p class="contact-line"><strong>Phone:</strong> ${customerPhone}</p>
              ${customerEmail ? `<p class="contact-line"><strong>Email:</strong> ${customerEmail}</p>` : ''}
            </div>
          </div>

          <div class="card-box order-info">
            <div class="card-header">
              <span class="card-title">ORDER INFORMATION</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">Invoice No:</span>
                <span class="info-value font-mono font-bold">#${invoiceId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${order.paymentMethod || 'Cash on Delivery'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="status-badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${order.paymentStatus || 'Pending'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Status:</span>
                <span class="status-badge badge-neutral">${order.status || 'Order Placed'}</span>
              </div>
              ${consignmentId ? `
                <div class="info-row">
                  <span class="info-label">Consignment ID:</span>
                  <span class="info-value font-mono">${consignmentId}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Item Description</th>
              <th style="width: 70px; text-align: center;">Qty</th>
              <th style="width: 110px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any, idx: number) => {
              const unitPrice = item.price !== undefined ? Number(item.price) : Number(item.retailPrice) || 0;
              const itemTotal = Math.round(unitPrice * (Number(item.quantity) || 1));
              return `
              <tr>
                <td style="text-align: center; color: var(--muted-foreground);">${idx + 1}</td>
                <td>
                  <div class="item-name">${item.name || item.title || "Product Item"}</div>
                  ${(item.color || item.size) ? `
                    <div class="item-variants">
                      ${item.color ? `<span class="variant-tag">Color: ${item.color}</span>` : ''}
                      ${item.size ? `<span class="variant-tag">Size: ${item.size}</span>` : ''}
                    </div>
                  ` : ''}
                </td>
                <td style="text-align: center; font-weight: 600;">${item.quantity || 1}</td>
                <td style="text-align: right;">৳${Math.round(unitPrice).toLocaleString()}</td>
                <td style="text-align: right; font-weight: 700;">৳${itemTotal.toLocaleString()}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>

        <!-- Amount In Words & Totals -->
        <div class="bottom-section">
          <div class="words-and-notes">
            <div class="amount-in-words-box">
              <span class="amount-title">AMOUNT IN WORDS:</span>
              <p class="words-text">${numberToWords(totalAmount)} Taka Only</p>
            </div>

            ${(order.customerNote || order.internalNote) ? `
              <div class="order-notes-box">
                <span class="notes-title">SPECIAL INSTRUCTIONS:</span>
                <p class="notes-text">${order.customerNote || order.internalNote}</p>
              </div>
            ` : ''}

            <div class="terms-box">
              <div class="terms-title">Terms & Conditions:</div>
              <ul class="terms-list">
                <li>Please check the parcel in front of the delivery rider.</li>
                <li>Report any discrepancy or damage within 24 hours with this invoice.</li>
                <li>Exchange is subject to terms and product condition.</li>
              </ul>
            </div>
          </div>

          <div class="totals-wrapper">
            <div class="totals-table">
              <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-value">৳${Math.round(subtotal).toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Delivery Charge</span>
                <span class="total-value">৳${Math.round(deliveryCharge).toLocaleString()}</span>
              </div>
              ${couponDiscount > 0 ? `
                <div class="total-row discount-row">
                  <span class="total-label">Coupon Discount</span>
                  <span class="total-value">- ৳${Math.round(couponDiscount).toLocaleString()}</span>
                </div>
              ` : ''}
              ${walletUsed > 0 ? `
                <div class="total-row discount-row">
                  <span class="total-label">Wallet / Loyalty</span>
                  <span class="total-value">- ৳${Math.round(walletUsed).toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total-row">
                <span class="total-label">Total Payable</span>
                <span class="total-value">৳${totalAmount.toLocaleString()}</span>
              </div>
              <div class="total-row" style="font-size: 11px; padding-top: 6px; border-top: 1px dashed var(--border);">
                <span class="total-label">Paid Amount:</span>
                <span class="total-value font-bold" style="color: ${isPaid ? '#059669' : 'inherit'};">৳${isPaid ? totalAmount.toLocaleString() : '0'}</span>
              </div>
              <div class="total-row" style="font-size: 11px;">
                <span class="total-label">Cash on Delivery Due:</span>
                <span class="total-value font-bold" style="color: ${!isPaid ? '#dc2626' : 'inherit'};">৳${!isPaid ? totalAmount.toLocaleString() : '0'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Signatures & Disclaimer -->
        <div class="invoice-footer">
          <div class="signatures-row">
            <div class="signature-box">
              <div class="signature-line"></div>
              <span class="signature-label">Customer's Signature</span>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <span class="signature-label">Authorized Signature</span>
            </div>
          </div>
          <div class="footer-bottom">
            <p class="thank-you-msg">Thank you for shopping with <strong>${storeName}</strong>!</p>
            <p class="computer-gen">This is a system-generated invoice. For support, visit <a href="https://swapnobaz.com" target="_blank">swapnobaz.com</a></p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Invoice - Print Preview</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: ${primary};
            --primary-foreground: ${primaryForeground};
            --border: #e2e8f0;
            --muted-foreground: #64748b;
            --foreground: #0f172a;
            --background: #ffffff;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 24px;
            color: var(--foreground);
            background-color: #f8fafc;
            font-size: 13px;
            line-height: 1.5;
          }
          .invoice-container {
            max-width: 820px;
            margin: 0 auto 30px auto;
            background: #ffffff;
            padding: 36px 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 270mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .brand-logo-container {
            max-width: 60%;
          }
          .brand-logo-img {
            max-height: 56px;
            max-width: 220px;
            object-fit: contain;
            margin-bottom: 8px;
          }
          .brand-logo {
            font-size: 26px;
            font-weight: 800;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .brand-details {
            font-size: 11.5px;
            color: var(--muted-foreground);
            line-height: 1.6;
          }
          .invoice-title-block {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 2px;
            color: var(--primary);
            margin: 0 0 4px 0;
            line-height: 1;
          }
          .invoice-id-tag {
            font-size: 13px;
            font-weight: 700;
            font-family: monospace;
            color: var(--muted-foreground);
            background: #f1f5f9;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .qr-code {
            width: 68px;
            height: 68px;
            border: 1px solid var(--border);
            padding: 2px;
            border-radius: 4px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
          }
          .card-box {
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            background: #fafafa;
          }
          .card-header {
            background: #f1f5f9;
            padding: 8px 14px;
            border-bottom: 1px solid var(--border);
          }
          .card-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: var(--muted-foreground);
          }
          .card-body {
            padding: 12px 14px;
            font-size: 12px;
          }
          .customer-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--foreground);
            margin: 0 0 4px 0;
          }
          .address-line, .contact-line {
            margin: 3px 0;
            color: var(--foreground);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
          }
          .info-label {
            color: var(--muted-foreground);
            font-size: 11.5px;
          }
          .info-value {
            font-weight: 600;
            color: var(--foreground);
          }
          .font-mono {
            font-family: monospace;
          }
          .status-badge {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 9999px;
            letter-spacing: 0.4px;
          }
          .badge-paid {
            background-color: #dcfce7;
            color: #15803d;
          }
          .badge-pending {
            background-color: #fef9c3;
            color: #a16207;
          }
          .badge-neutral {
            background-color: #e2e8f0;
            color: #334155;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-radius: 6px;
            overflow: hidden;
          }
          .items-table thead tr {
            background-color: var(--primary);
            color: var(--primary-foreground);
          }
          .items-table th {
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
          }
          .items-table td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
            font-size: 12.5px;
            vertical-align: middle;
          }
          .items-table tbody tr:last-child td {
            border-bottom: 2px solid var(--border);
          }
          .item-name {
            font-weight: 700;
            color: var(--foreground);
          }
          .item-variants {
            display: flex;
            gap: 6px;
            margin-top: 3px;
          }
          .variant-tag {
            font-size: 10px;
            background: #f1f5f9;
            color: var(--muted-foreground);
            padding: 1px 6px;
            border-radius: 3px;
            border: 1px solid var(--border);
          }
          .bottom-section {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 24px;
            margin-bottom: 28px;
          }
          .words-and-notes {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .amount-in-words-box {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-left: 3px solid var(--primary);
            padding: 10px 14px;
            border-radius: 4px;
          }
          .amount-title {
            font-size: 10px;
            font-weight: 800;
            color: var(--muted-foreground);
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
          }
          .words-text {
            font-size: 12px;
            font-weight: 700;
            color: var(--foreground);
            margin: 0;
            text-transform: capitalize;
          }
          .order-notes-box {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
          }
          .notes-title {
            font-weight: 800;
            color: #b45309;
            font-size: 9.5px;
            display: block;
          }
          .notes-text {
            margin: 2px 0 0 0;
            color: #92400e;
          }
          .terms-box {
            font-size: 10.5px;
            color: var(--muted-foreground);
            line-height: 1.5;
          }
          .terms-title {
            font-weight: 700;
            margin-bottom: 4px;
            color: var(--foreground);
          }
          .terms-list {
            margin: 0;
            padding-left: 16px;
          }
          .totals-wrapper {
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 100%;
            background: #fafafa;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px 16px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            font-size: 12.5px;
          }
          .total-label {
            color: var(--muted-foreground);
          }
          .total-value {
            font-weight: 600;
            color: var(--foreground);
          }
          .discount-row .total-value {
            color: #16a34a;
          }
          .grand-total-row {
            border-top: 2px solid var(--primary);
            margin-top: 6px;
            padding-top: 8px;
            padding-bottom: 4px;
          }
          .grand-total-row .total-label {
            font-size: 14px;
            font-weight: 800;
            color: var(--foreground);
          }
          .grand-total-row .total-value {
            font-size: 17px;
            font-weight: 800;
            color: var(--primary);
          }
          .invoice-footer {
            margin-top: auto;
            border-top: 1px solid var(--border);
            padding-top: 20px;
          }
          .signatures-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            padding: 0 20px;
          }
          .signature-box {
            width: 160px;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px dashed var(--muted-foreground);
            margin-bottom: 6px;
            height: 35px;
          }
          .signature-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--muted-foreground);
          }
          .footer-bottom {
            text-align: center;
          }
          .thank-you-msg {
            font-size: 13px;
            font-weight: 700;
            margin: 0 0 3px 0;
            color: var(--foreground);
          }
          .computer-gen {
            font-size: 10.5px;
            color: var(--muted-foreground);
            margin: 0;
          }
          .computer-gen a {
            color: var(--primary);
            text-decoration: none;
          }
          @media print {
            body {
              padding: 0;
              background-color: #ffffff;
            }
            .invoice-container {
              padding: 0;
              margin: 0;
              box-shadow: none;
              border-radius: 0;
              max-width: 100%;
              width: 100%;
              min-height: 275mm;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
          }
        </style>
      </head>
      <body>
        ${invoicesHtml}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    let hasPrinted = false;
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      printWindow.focus();
      if (mode === 'print') {
        printWindow.onafterprint = () => {
          try {
            printWindow.close();
          } catch (e) {}
        };
      }
      printWindow.print();
    };

    printWindow.onload = triggerPrint;

    setTimeout(() => {
      if (!hasPrinted) {
        triggerPrint();
      }
    }, 500);
  }
}
